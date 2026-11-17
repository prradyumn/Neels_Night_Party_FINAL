#!/usr/bin/env python3
"""make_voice_refs: the reference clip each character's Chatterbox voice is cloned from. Every clip is synthetic: MeloTTS
(MIT) speaks the speaker's ref_text from tools/voice_cast.json, then Rubber Band shifts its pitch. No real person's voice.

    ~/melo/bin/python tools/make_voice_refs.py              # every speaker -> tools/vo_refs/<who>.wav
    ~/melo/bin/python tools/make_voice_refs.py --only neel

Needs `brew install rubberband` (Homebrew's ffmpeg has no rubberband filter). Keep a clip 8-12 s, clean, one emotion.
"""
import argparse, json, os, shutil, subprocess, wave

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
REFS = os.path.join(ROOT, "tools", "vo_refs")
STYLE = dict(sdp_ratio=0.6, noise_scale=0.8, noise_scale_w=1.0)   # MeloTTS "expressive", as in Sonar Defence


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--only", help="comma-separated speakers")
    ap.add_argument("--cast", default=os.path.join(ROOT, "tools", "voice_cast.json"), help="another cast file (to audition a voice)")
    ap.add_argument("--out", default=REFS, help="where the clips go [tools/vo_refs]")
    args = ap.parse_args()
    CAST = json.load(open(args.cast))
    who = [k for k in CAST if not k.startswith("_") and (not args.only or k in args.only.split(","))]
    if not shutil.which("rubberband"):
        raise SystemExit("rubberband is missing: brew install rubberband")
    from melo.api import TTS
    tts = TTS(language="EN", device="cpu")
    os.makedirs(args.out, exist_ok=True)
    for k in who:
        c = CAST[k]
        raw = os.path.join(args.out, f"{k}_melo.wav")
        tts.tts_to_file(c["ref_text"], tts.hps.data.spk2id[c["melo"]], raw, speed=c["speed"], quiet=True, **STYLE)
        out = os.path.join(args.out, f"{k}.wav")
        if c["pitch"]:
            subprocess.run(["rubberband", "-q", "-3", *(["-F"] if c.get("formant") else []), "-p", str(c["pitch"]), raw, out], check=True)
        else:
            shutil.copy(raw, out)
        with wave.open(out) as w:
            print(f"{k:5} {w.getnframes() / w.getframerate():5.1f} s  {c['melo']} speed {c['speed']} pitch {c['pitch']:+d}")


if __name__ == "__main__":
    main()
