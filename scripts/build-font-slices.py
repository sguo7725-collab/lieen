#!/usr/bin/env python3
"""Slice a large CJK font into small woff2 pieces + @font-face rules with unicode-range.

The browser only downloads the pieces for characters actually on screen, so a 20 MB font
costs a few hundred KB in practice. Slices reuse the same ranges as the bundled Noto Serif SC
(Google Fonts' frequency-ordered slicing), read from app/fonts-pro.css.

Usage (needs fontTools; woff2 needs a `brotli` module):
  python3 scripts/build-font-slices.py SRC.ttf|otf "Family Name" out-dir-name
Writes app/vendor/fonts/<out-dir-name>/*.woff2 and prints the CSS rules to stdout.
"""
import re, sys, pathlib
from fontTools.ttLib import TTFont
from fontTools import subset

ROOT = pathlib.Path(__file__).resolve().parent.parent
APP = ROOT / 'app'

def parse_ranges(spec):
    out = set()
    for part in spec.split(','):
        part = part.strip().upper().replace('U+', '')
        if '-' in part:
            a, b = part.split('-'); out.update(range(int(a, 16), int(b, 16) + 1))
        elif '?' in part:
            lo = int(part.replace('?', '0'), 16); hi = int(part.replace('?', 'F'), 16); out.update(range(lo, hi + 1))
        else:
            out.add(int(part, 16))
    return out

def slices():
    css = (APP / 'fonts-pro.css').read_text(encoding='utf-8')
    for m in re.finditer(r"@font-face\s*\{\s*font-family:\s*'Noto Serif SC'[^}]*?noto-serif-sc-([\w-]+?)-400-normal\.woff2[^}]*?unicode-range:\s*([^;}]+)", css):
        yield m.group(1), m.group(2).strip()

def main(src, family, outname):
    out = APP / 'vendor' / 'fonts' / outname
    out.mkdir(parents=True, exist_ok=True)
    cmap = set(TTFont(src, lazy=True).getBestCmap())
    rules, total = [], 0
    for key, spec in slices():
        cps = parse_ranges(spec) & cmap
        if not cps:
            continue
        font = TTFont(src)
        opts = subset.Options(); opts.flavor = 'woff2'; opts.layout_features = ['*']; opts.name_IDs = ['*']
        opts.notdef_outline = False; opts.hinting = False; opts.desubroutinize = True
        sub = subset.Subsetter(opts); sub.populate(unicodes=cps); sub.subset(font)
        fn = f'{outname}-{key}-400-normal.woff2'
        font.flavor = 'woff2'; font.save(out / fn)
        total += (out / fn).stat().st_size
        rules.append(f"@font-face{{font-family:'{family}';font-style:normal;font-display:swap;font-weight:400;"
                     f"src:url(vendor/fonts/{outname}/{fn}) format('woff2');unicode-range:{spec}}}")
    print('\n'.join(rules))
    print(f'{outname}: {len(rules)} slices, {total/1e6:.1f} MB', file=sys.stderr)

if __name__ == '__main__':
    main(*sys.argv[1:4])
