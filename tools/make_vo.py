#!/usr/bin/env python3
"""make_vo: record the characters' lines with Parler-TTS Large v1 (Apache 2.0); --model indic uses AI4Bharat's
Indic Parler-TTS (Indian English, gated: accept its terms on Hugging Face first).

    node tools/vo_lines.mjs                              # list the lines first (tools/vo_lines.json)
    source ~/parler/bin/activate
    python tools/make_vo.py --audition                   # one line per candidate voice -> tools/vo_audition/
    python tools/make_vo.py                              # every line not yet recorded -> assets/vo/<id>.mp3
    python tools/make_vo.py --redo neel                  # re-record one character (or an id)

Runs on the CPU: Parler on the Apple GPU comes out as noise. Each character keeps one seed, so the voice stays the
same from line to line. Raw takes are cached in tools/vo_cache/ (not shipped); src/vo_manifest.json lists the ids
that exist, so the game falls back to the browser voice for anything missing.
"""
import argparse, json, os, re, subprocess, sys, time
import numpy as np

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
LINES = os.path.join(ROOT, "tools", "vo_lines.json")
CACHE = os.path.join(ROOT, "tools", "vo_cache")
AUDITION = os.path.join(ROOT, "tools", "vo_audition")
OUT = os.path.join(ROOT, "assets", "vo")
MANIFEST = os.path.join(ROOT, "src", "vo_manifest.json")
MODELS = {"large": "parler-tts/parler-tts-large-v1", "indic": "ai4bharat/indic-parler-tts"}

# who each character is, as a Parler voice description ({sp} = the speaker name)
TAIL = "The recording is of very high quality, with the speaker's voice sounding clear and very close up, with no background noise."
CAST = {   # speakers for Parler-TTS Large v1 (Indic names in INDIC_SPEAKERS)
    "neel": {"speaker": "Gary", "seed": 11, "desc": "{sp} speaks in a deep, low-pitched, warm and friendly voice, gently and a little slowly, like a big kind giant. " + TAIL},
    "agni": {"speaker": "Jordan", "seed": 7, "desc": "{sp} speaks in a high-pitched, very excited and expressive voice at a fast pace, bubbly and playful. " + TAIL},
    "maya": {"speaker": "Jenna", "seed": 5, "desc": "{sp} speaks in a warm, bright and kind voice, like a friendly teacher explaining to a child, at a moderate pace with clear pronunciation. " + TAIL},
    "nar": {"speaker": "Lea", "seed": 3, "desc": "{sp} speaks in a calm, gentle storytelling voice at a moderate pace, with a touch of wonder. " + TAIL},
}
CANDIDATES = {"neel": ["Gary", "Jon", "Bruce"], "agni": ["Jordan", "Eric", "Will"], "maya": ["Jenna", "Laura", "Emily"], "nar": ["Lea", "Rose"]}
INDIC_SPEAKERS = {"neel": "Thoma", "agni": "Aakash", "maya": "Meera", "nar": "Mary"}
SAMPLE = {"neel": "Umm… I don't know. I have not decided yet.", "agni": "Yay! How many friends are coming?",
          "maya": "Don't worry. When we don't know a number, we can write it as a letter.", "nar": "Welcome to Neel's Night Party!"}


def speech_text(t):
    """what the model should say: letters as words, maths signs as words"""
    t = t.replace("…", ",").replace("×", " times ").replace("−", " minus ").replace("=", " equals ").replace("+", " plus ")
    t = re.sub(r"(\d)(md|m|d)\b", r"\1 \2", t)          # 2m -> 2 m, 5md -> 5 md
    t = re.sub(r"(?<![\w'])md(?![\w'])", "em dee", t)
    t = re.sub(r"(?<![\w'])m(?![\w'])", "em", t)          # a lone m or d is the letter
    t = re.sub(r"(?<![\w'])d(?![\w'])", "dee", t)
    return re.sub(r"\s+", " ", t).strip()


class Voice:
    def __init__(self, model):
        import torch
        from parler_tts import ParlerTTSForConditionalGeneration
        from transformers import AutoTokenizer
        torch.set_num_threads(os.cpu_count() or 8)
        self.torch = torch
        self.model = ParlerTTSForConditionalGeneration.from_pretrained(model).to("cpu").eval()
        self.tok = AutoTokenizer.from_pretrained(model)
        self.desc_tok = AutoTokenizer.from_pretrained(self.model.config.text_encoder._name_or_path)
        self.rate = self.model.config.sampling_rate

    def say(self, text, desc, seed):
        d = self.desc_tok(desc, return_tensors="pt")
        p = self.tok(text, return_tensors="pt")
        self.torch.manual_seed(seed)
        with self.torch.no_grad():
            a = self.model.generate(input_ids=d.input_ids, attention_mask=d.attention_mask,
                                    prompt_input_ids=p.input_ids, prompt_attention_mask=p.attention_mask)
        return a.cpu().float().numpy().squeeze()


def polish(a, rate, thresh_db=-40.0, pad_in=0.05, pad_out=0.12):
    """trim silence at both ends, normalise the peak, fade the cut edges"""
    a = a / max(1e-6, float(np.abs(a).max()))
    win = int(rate * 0.02)
    env = np.sqrt(np.convolve(a ** 2, np.ones(win) / win, mode="same"))
    on = np.where(env > 10 ** (thresh_db / 20))[0]
    if len(on):
        a = a[max(0, on[0] - int(pad_in * rate)): min(len(a), on[-1] + int(pad_out * rate))]
    f = int(rate * 0.008)
    if len(a) > 2 * f:
        a[:f] *= np.linspace(0, 1, f); a[-f:] *= np.linspace(1, 0, f)
    return (a * 0.89).astype(np.float32)


def write_wav(path, a, rate):
    import wave
    with wave.open(path, "wb") as w:
        w.setnchannels(1); w.setsampwidth(2); w.setframerate(rate)
        w.writeframes((np.clip(a, -1, 1) * 32767).astype("<i2").tobytes())


def to_mp3(wav, mp3):
    # speech: mono, 22 kHz, 24 kbps, loudness matched across characters
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", wav, "-af", "loudnorm=I=-17:TP=-1.5", "-ac", "1", "-ar", "22050",
                    "-c:a", "libmp3lame", "-b:a", "24k", mp3], check=True)


def pitch(a, rate):
    import librosa
    f0, voiced, _ = librosa.pyin(a, fmin=60, fmax=500, sr=rate)
    f0 = f0[voiced] if voiced is not None else f0
    return float(np.nanmedian(f0)) if len(f0) else 0.0


def audition(v):
    os.makedirs(AUDITION, exist_ok=True)
    for who, names in CANDIDATES.items():
        for sp in names:
            t0 = time.time()
            a = polish(v.say(speech_text(SAMPLE[who]), CAST[who]["desc"].format(sp=sp), CAST[who]["seed"]), v.rate)
            path = os.path.join(AUDITION, f"{who}_{sp}.wav")
            write_wav(path, a, v.rate)
            print(f"{who:5s} {sp:7s} pitch {pitch(a, v.rate):5.0f} Hz  {len(a) / v.rate:4.1f}s  ({time.time() - t0:.0f}s)  {path}", flush=True)


def record(v, redo):
    lines = json.load(open(LINES))
    os.makedirs(CACHE, exist_ok=True); os.makedirs(OUT, exist_ok=True)
    todo = [l for l in lines if redo and (l["who"] == redo or l["id"] == redo) or not os.path.exists(os.path.join(OUT, l["id"] + ".mp3"))]
    print(f"{len(todo)} of {len(lines)} lines to record", flush=True)
    for i, l in enumerate(todo, 1):
        c = CAST[l["who"]]
        t0 = time.time()
        a = polish(v.say(speech_text(l["text"]), c["desc"].format(sp=c["speaker"]), c["seed"]), v.rate)
        wav = os.path.join(CACHE, l["id"] + ".wav")
        write_wav(wav, a, v.rate)
        to_mp3(wav, os.path.join(OUT, l["id"] + ".mp3"))
        write_manifest(lines)
        print(f"[{i}/{len(todo)}] {l['id']} {len(a) / v.rate:4.1f}s ({time.time() - t0:.0f}s)  {l['text'][:60]}", flush=True)
    write_manifest(lines)


def write_manifest(lines):
    have = sorted(l["id"] for l in lines if os.path.exists(os.path.join(OUT, l["id"] + ".mp3")))
    json.dump(have, open(MANIFEST, "w"))


if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("--audition", action="store_true")
    ap.add_argument("--redo", default="")
    ap.add_argument("--model", default="large", choices=list(MODELS))
    args = ap.parse_args()
    if args.model == "indic":
        for k, sp in INDIC_SPEAKERS.items(): CAST[k]["speaker"] = sp
    v = Voice(MODELS[args.model])
    audition(v) if args.audition else record(v, args.redo)
