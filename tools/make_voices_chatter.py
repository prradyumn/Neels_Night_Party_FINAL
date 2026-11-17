#!/usr/bin/env python3
"""make_voices_chatter: record every spoken line of Neel's Night Party with Chatterbox (Resemble AI, MIT license), each
speaker cloned from their own synthetic reference clip (tools/vo_refs/<who>.wav, made by make_voice_refs.py with MeloTTS).
Adapted from Sonar Defence's tools/make_voices_chatter.py.

    node tools/vo_lines.mjs                                          # list the lines first (tools/vo_lines.json)
    ~/chatter/bin/python tools/make_voices_chatter.py --sample       # one line per speaker -> assets/vo/takes/samples/
    ~/chatter/bin/python tools/make_voices_chatter.py                # every line not made yet (resumable)
    ~/chatter/bin/python tools/make_voices_chatter.py --only maya_9f192825 --force
    ~/chatter/bin/python tools/make_voices_chatter.py --who neel --force --seed0 10

Each take is transcribed with Whisper and compared word by word with the script (after both are written out in words:
"3m" = "three em"); the first take that matches goes into the game. After --tries takes with none matching, the take with
the fewest differences goes in and is listed as "please listen". Every line is loudness-normalised to the same target
(LOUD) and saved as Ogg Opus: assets/vo/en/<id>.ogg; src/vo_manifest.json lists the ids that exist (the game falls back
to the browser voice for anything missing). Takes: assets/vo/takes/<id>_<n>.wav (not deployed); done.json there records
each line's result so a stopped run carries on where it left off.

Chatterbox is pinned (chatterbox-tts 0.1.7, resemble-perth 1.0.1; wheels in ~/chatter/wheels) and loads its weights from
a local copy (WEIGHTS), never from the network: Resemble retired Chatterbox in Aug 2026. Every output carries Perth's
inaudible watermark.
"""
import argparse
import hashlib
import json
import os
import re
import subprocess
import sys
import time
import wave

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CAST = {k: v for k, v in json.load(open(os.path.join(ROOT, 'tools', 'voice_cast.json'))).items() if not k.startswith('_')}
LINES = os.path.join(ROOT, 'tools', 'vo_lines.json')
REFS = os.path.join(ROOT, 'tools', 'vo_refs')
VO_DIR = os.path.join(ROOT, 'assets', 'vo')
LANG = 'en'
TAKES = os.path.join(VO_DIR, 'takes')
DONE = os.path.join(TAKES, 'done.json')
MANIFEST = os.path.join(ROOT, 'src', 'vo_manifest.json')
WEIGHTS = os.environ.get('CHATTERBOX_WEIGHTS', os.path.expanduser('~/chatter/weights/chatterbox-5bb1f6e'))
LOUD = 'loudnorm=I=-18:TP=-1.5:LRA=11'          # every speaker the same: EBU R128, -18 LUFS
KBPS = '24k'                                     # Opus speech: 24 kbps sounds the same as 48 and keeps the game near its 20 MB budget
SAMPLE = {'neel': 'neel_1d2dfb94', 'agni': 'agni_cbce6149', 'maya': 'maya_f3aee7b8', 'nar': 'nar_ffcc34d2'}

# ---------------- the words the TTS reads ----------------
ONES = 'zero one two three four five six seven eight nine ten eleven twelve thirteen fourteen fifteen sixteen seventeen eighteen nineteen'.split()
TENS = '_ _ twenty thirty forty fifty sixty seventy eighty ninety'.split()
LETTER = {'m': 'em', 'd': 'dee', 'md': 'em dee'}


def num(n):
    if n < 20:
        return ONES[n]
    if n < 100:
        return TENS[n // 10] + ('' if n % 10 == 0 else '-' + ONES[n % 10])
    return ONES[n // 100] + ' hundred' + ('' if n % 100 == 0 else ' and ' + num(n % 100))


def spoken(t):
    """the line as the TTS should read it: numbers, signs and the letters m and d written out in words"""
    t = t.replace('…', ',').replace('"', '').replace('(', ', ').replace(')', ',')
    t = re.sub(r'\b(\d+)(md|m|d)\b', lambda m: num(int(m[1])) + ' ' + LETTER[m[2]], t)       # 3m -> three em
    t = re.sub(r"(?<![\w'])(md|m|d)(?![\w'])", lambda m: LETTER[m[1]], t)                    # a lone m or d is the letter
    t = t.replace('×', ' times ').replace('−', ' minus ').replace('+', ' plus ').replace('=', ' equals ').replace('<', ' is less than ').replace(':', ',')
    t = re.sub(r'\d+', lambda m: num(int(m[0])), t)
    t = re.sub(r'\s+([,.!?])', r'\1', t)
    t = re.sub(r',\s*,', ',', t)
    t = re.sub(r',\s*([.!?])', r'\1', t)
    return re.sub(r'\s+', ' ', t).strip()


# ---------------- the check: script vs what Whisper heard ----------------
# spellings Whisper uses for the same word (names, the letters m and d); anything else must match exactly
SAME = {'neil': 'neel', 'neal': 'neel', 'neils': 'neels', 'neals': 'neels', 'agnee': 'agni', 'mya': 'maya',
        'ladoos': 'laddoos', 'laddus': 'laddoos', 'ladus': 'laddoos', 'ladoo': 'laddoo', 'ok': 'okay', 'hm': 'hmm', 'mm': 'hmm',
        'm': 'em', 'd': 'dee', 'de': 'dee', 'di': 'dee', 'x': 'times', 'whoa': 'woah', 'yey': 'yay'}


def words(t):
    t = t.lower().replace('×', ' times ').replace('−', ' minus ').replace('+', ' plus ').replace('=', ' equals ').replace('%', ' percent')
    t = re.sub(r'(?<=\d)\s*-\s*(?=\d)', ' minus ', t)
    t = re.sub(r'\b(\d+)\s*(md|m|d)\b', r'\1 \2', t)
    t = re.sub(r'\bm\.d\.?(?![a-z])', ' md ', t)
    t = re.sub(r'\d+', lambda m: ' ' + num(int(m[0])) + ' ', t)
    t = t.replace('-', ' ').replace("'", '').replace('’', '')
    out = []
    for w in re.findall(r'[a-z]+', t):
        w = re.sub(r'^h+m+$', 'hmm', re.sub(r'^u+m+$', 'umm', w))
        w = SAME.get(w, w)
        out += ['em', 'dee'] if w == 'md' else [w]
    return out


def word_diff(expected, heard):
    """-> [] when the take says the line word for word, else what differs"""
    import difflib
    a, b = words(expected), words(heard)
    probs = []
    for op, i1, i2, j1, j2 in difflib.SequenceMatcher(None, a, b, autojunk=False).get_opcodes():
        if op == 'equal' or ''.join(a[i1:i2]) == ''.join(b[j1:j2]):   # "work out" / "workout": the same words, spaced differently
            continue
        probs.append({'insert': '+"%s"' % ' '.join(b[j1:j2]), 'delete': '-"%s"' % ' '.join(a[i1:i2])}.get(op, '"%s" -> "%s"' % (' '.join(a[i1:i2]), ' '.join(b[j1:j2]))))
    return probs


# ---------------- audio ----------------
def trim(a, sr, thresh_db=-42.0, pad_in=0.06, pad_out=0.16, fade=0.008):
    """cut leading and trailing silence (10 ms windows, so a click is not speech) and fade the edges"""
    import numpy as np
    win = max(1, int(sr * 0.01))
    n = len(a) // win
    if n:
        loud = np.nonzero(np.abs(a[:n * win]).reshape(n, win).max(1) > 10 ** (thresh_db / 20))[0]
        if len(loud):
            a = a[max(0, loud[0] * win - int(sr * pad_in)):min(len(a), (loud[-1] + 1) * win + int(sr * pad_out))]
    f = min(len(a) // 2, int(sr * fade))
    if f:
        ramp = np.linspace(0, 1, f, dtype=a.dtype)
        a = a.copy(); a[:f] *= ramp; a[-f:] *= ramp[::-1]
    return a


def write_wav(path, a, sr):
    import numpy as np
    with wave.open(path, 'wb') as f:
        f.setnchannels(1); f.setsampwidth(2); f.setframerate(sr)
        f.writeframes((np.clip(a, -1, 1) * 32767).astype('<i2').tobytes())


def to_game(wav, lid):
    """loudness-normalise (two passes: measure, then a linear gain) and encode Ogg Opus -> assets/vo/en/<id>.ogg"""
    m = subprocess.run(['ffmpeg', '-hide_banner', '-nostats', '-i', wav, '-af', LOUD + ':print_format=json', '-f', 'null', '-'],
                       capture_output=True, text=True).stderr
    s = json.loads(m[m.rindex('{'):m.rindex('}') + 1])
    af = LOUD + ':linear=true:measured_I=%s:measured_TP=%s:measured_LRA=%s:measured_thresh=%s:offset=%s' % (
        s['input_i'], s['input_tp'], s['input_lra'], s['input_thresh'], s['target_offset'])
    out = os.path.join(VO_DIR, LANG, lid + '.ogg')
    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', wav, '-af', af, '-ar', '48000', '-ac', '1', '-c:a', 'libopus', '-b:a', KBPS,
                    '-application', 'voip', out + '.part.ogg'], check=True)
    os.replace(out + '.part.ogg', out)
    return out


def write_manifest():
    have = sorted(f[:-4] for f in os.listdir(os.path.join(VO_DIR, LANG)) if f.endswith('.ogg'))
    with open(MANIFEST + '.part', 'w') as f:
        json.dump(have, f, indent=0)
    os.replace(MANIFEST + '.part', MANIFEST)
    return have


def main():
    ap = argparse.ArgumentParser(description="Record Neel's Night Party voice lines with Chatterbox.")
    ap.add_argument('--only', help='comma-separated line ids')
    ap.add_argument('--who', help='comma-separated speakers (neel, agni, maya, nar)')
    ap.add_argument('--force', action='store_true', help='remake lines already made')
    ap.add_argument('--tries', type=int, default=6, help='takes per line until the words match [6]')
    ap.add_argument('--seed0', type=int, default=0, help='first seed offset (to try new takes) [0]')
    ap.add_argument('--sample', action='store_true', help='one line per speaker into assets/vo/takes/samples/ (not the game)')
    ap.add_argument('--ref', action='append', default=[], help='who=path: clone another clip (auditions)')
    ap.add_argument('--recheck', action='store_true', help='only compare the kept takes with the script again (after changing the check)')
    ap.add_argument('--retry', action='store_true', help='make the "please listen" lines again (use new seeds: --seed0 6); a line changes only if it gets better')
    ap.add_argument('--prune', action='store_true', help='only delete the recordings of lines that are no longer in the script (their takes stay)')
    ap.add_argument('--reencode', action='store_true', help='only rebuild assets/vo/en/*.ogg from the kept takes (after changing LOUD or KBPS)')
    args = ap.parse_args()
    if args.reencode:
        done = json.load(open(DONE))
        for lid, d in done.items():
            to_game(os.path.join(TAKES, '%s_%d.wav' % (lid, d['take'])), lid)
        print('re-encoded %d lines, %d in the manifest' % (len(done), len(write_manifest())))
        return
    if args.prune:
        ids = {l['id'] for l in json.load(open(LINES))}
        done = json.load(open(DONE)) if os.path.exists(DONE) else {}
        gone = [f[:-4] for f in os.listdir(os.path.join(VO_DIR, LANG)) if f.endswith('.ogg') and f[:-4] not in ids]
        for g in gone:
            os.remove(os.path.join(VO_DIR, LANG, g + '.ogg')); done.pop(g, None)
        json.dump(done, open(DONE, 'w'), indent=0, ensure_ascii=False)
        print('removed %d recordings no longer in the script; %d in the manifest' % (len(gone), len(write_manifest())))
        return
    if args.recheck:
        done = json.load(open(DONE))
        by = {l['id']: l for l in json.load(open(LINES))}
        for lid, d in done.items():
            d['diff'] = word_diff(spoken(by[lid]['text']), d['heard']); d['ok'] = not d['diff']
        json.dump(done, open(DONE, 'w'), indent=0, ensure_ascii=False)
        bad = {k: d['diff'] for k, d in done.items() if not d['ok']}
        print('%d of %d match; please listen to %d:' % (len(done) - len(bad), len(done), len(bad)))
        for k, v in bad.items():
            print('  %-14s %s' % (k, ', '.join(v)))
        return

    import numpy as np
    import torch
    from transformers import pipeline
    from chatterbox.tts import ChatterboxTTS

    lines = json.load(open(LINES))
    by_id = {l['id']: l for l in lines}
    refs = {k: os.path.join(REFS, k + '.wav') for k in CAST}
    refs.update(dict(r.split('=', 1) for r in args.ref))
    out_dir = os.path.join(TAKES, 'samples') if args.sample else TAKES
    os.makedirs(out_dir, exist_ok=True)
    os.makedirs(os.path.join(VO_DIR, LANG), exist_ok=True)
    done = json.load(open(DONE)) if os.path.exists(DONE) else {}

    if args.sample:
        todo = [by_id[SAMPLE[k]] for k in CAST if not args.who or k in args.who.split(',')]
    else:
        todo = sorted(lines, key=lambda l: list(CAST).index(l['who']))
        if args.who:
            todo = [l for l in todo if l['who'] in args.who.split(',')]
        if args.only:
            todo = [l for l in todo if l['id'] in args.only.split(',')]
        if args.retry:
            todo = [l for l in todo if l['id'] in done and not done[l['id']]['ok']]
        elif not args.force:
            todo = [l for l in todo if l['id'] not in done or not os.path.exists(os.path.join(VO_DIR, LANG, l['id'] + '.ogg'))]
    for k in {l['who'] for l in todo}:
        if not os.path.exists(refs[k]):
            sys.exit('missing reference clip %s (run make_voice_refs.py)' % refs[k])
    if not os.path.isdir(WEIGHTS):
        sys.exit('missing Chatterbox weights in %s' % WEIGHTS)

    dev = 'mps' if torch.backends.mps.is_available() else 'cpu'
    print('Loading Chatterbox (%s) on %s and Whisper …' % (WEIGHTS, dev), flush=True)
    tts = ChatterboxTTS.from_local(WEIGHTS, dev)
    asr = pipeline('automatic-speech-recognition', model='openai/whisper-small.en', device='cpu')
    print('%d lines to make' % len(todo), flush=True)
    t0, tally = time.time(), {'passed': 0, 'kept': 0}
    for i, l in enumerate(todo, 1):
        c, text = CAST[l['who']], spoken(l['text'])
        best = None
        for k in range(1, args.tries + 1):
            torch.manual_seed(k + args.seed0)
            w = tts.generate(text, audio_prompt_path=refs[l['who']], exaggeration=c['exaggeration'], cfg_weight=c['cfg'])
            a = w.squeeze().cpu().numpy().astype('float32')
            a = trim(a / max(1e-6, float(np.abs(a).max())) * 0.9, tts.sr)
            path = os.path.join(out_dir, '%s_%d.wav' % (l['who'] if args.sample else l['id'], k + args.seed0))   # named by seed: retries keep the old takes
            write_wav(path, a, tts.sr)
            if c.get('tempo', 1) != 1:   # Chatterbox ignores cfg for some voices: slow the take itself (same pitch)
                subprocess.run(['rubberband', '-q', '-3', '-T', str(c['tempo']), path, path + '.t.wav'], check=True)
                os.replace(path + '.t.wav', path)
                with wave.open(path) as f:
                    a = np.frombuffer(f.readframes(f.getnframes()), '<i2').astype('float32') / 32768
            heard =asr({'raw': a, 'sampling_rate': tts.sr})['text'].strip()
            diff = word_diff(text, heard)
            if best is None or len(diff) < len(best[2]):
                best = (k, path, diff, heard)
            if not diff:
                break
            print('    take %d differs: %s' % (k, ', '.join(diff)), flush=True)
        k, path, diff, heard = best
        if args.sample:
            print('[%s] take %d %s  %.1fs  %s' % (l['who'], k, '✓' if not diff else '? please listen: ' + ', '.join(diff), len(a) / tts.sr, path), flush=True)
            continue
        old = done.get(l['id'])
        if args.retry and old and len(old['diff']) <= len(diff):
            print('[%d/%d] %-14s no better take: kept take %d, please listen: %s' % (i, len(todo), l['id'], old['take'], ', '.join(old['diff'])), flush=True)
            tally['kept'] += 1
            continue
        to_game(path, l['id'])
        done[l['id']] = {'take': k + args.seed0, 'seed': k + args.seed0, 'ok': not diff, 'heard': heard, 'diff': diff,
                         'text': hashlib.sha1(text.encode()).hexdigest()[:10]}
        json.dump(done, open(DONE + '.part', 'w'), indent=0, ensure_ascii=False)
        os.replace(DONE + '.part', DONE)
        write_manifest()
        tally['passed' if not diff else 'kept'] += 1
        el = time.time() - t0
        print('[%d/%d] %-14s %s take %d  (%.0f min so far, ~%.0f min left)' % (
            i, len(todo), l['id'], '✓' if not diff else '? kept, please listen: ' + ', '.join(diff), k + args.seed0, el / 60, el / i * (len(todo) - i) / 60), flush=True)
    if not args.sample:
        allv = [done.get(l['id']) for l in lines]
        print('This run: %(passed)d passed, %(kept)d kept for a listen.' % tally)
        print('All lines: %d passed, %d kept (please listen), %d not made yet.' % (
            sum(1 for d in allv if d and d['ok']), sum(1 for d in allv if d and not d['ok']), sum(1 for d in allv if not d)), flush=True)


if __name__ == '__main__':
    main()
