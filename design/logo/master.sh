#!/bin/zsh
# imaji mark mastering: transparent raster -> two ink masks (letters, dots) ->
# potrace -> one SVG with the letters in currentColor and the dots in Tigerlily.
# Usage: ./master.sh <id> <cut-row>   (cut-row: first row of the letters in work/<id>.png)
set -e
ID=$1; CUT=$2
ACCENT="#E2583E"
INK="#1c1917"
OUT=out/master; WORK=$OUT/work; DEST=$OUT/$ID
mkdir -p "$DEST"
SRC=$WORK/$ID.png
read W H <<< "$(magick "$SRC" -format '%w %h' info:)"

# ink masks, black ink on white, for the tracer
magick "$SRC" -alpha extract -negate \( -size ${W}x${CUT} xc:white \) -geometry +0+0 -composite "$WORK/$ID.letters.pgm"
magick "$SRC" -alpha extract -negate \( -size ${W}x$((H-CUT)) xc:white \) -geometry +0+$CUT -composite "$WORK/$ID.dots.pgm"

# upsample 4x with mkbitmap's interpolation, then trace
for part in letters dots; do
  mkbitmap -x -s 4 -b 1.2 -t 0.5 "$WORK/$ID.$part.pgm" -o "$WORK/$ID.$part.pbm"
  potrace "$WORK/$ID.$part.pbm" -s -W "${W}pt" -H "${H}pt" -t 6 -a 1.1 -O 0.2 --flat -o "$WORK/$ID.$part.svg"
done

# compose: potrace writes <g transform="translate(0,H) scale(sx,-sy)"> with one path (--flat)
python3 - "$WORK/$ID.letters.svg" "$WORK/$ID.dots.svg" "$DEST/imaji-$ID.svg" "$W" "$H" "$INK" "$ACCENT" <<'EOF'
import re, sys
lsvg, dsvg, dest, W, H, INK, ACCENT = sys.argv[1:]
def parts(p):
    s = open(p).read()
    g = re.search(r'<g transform="([^"]+)"', s).group(1)
    ds = re.findall(r'<path d="([^"]+)"', s)
    return g, ds
gl, dl = parts(lsvg); gd, dd = parts(dsvg)
def group(g, ds, fill, cls):
    return f'<g transform="{g}"><path class="{cls}" fill="{fill}" fill-rule="evenodd" d="{" ".join(ds)}"/></g>'
svg = (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {W} {H}" role="img" aria-label="imaji">'
       f'{group(gl, dl, "currentColor", "ink")}{group(gd, dd, ACCENT, "dot")}</svg>')
open(dest, "w").write(svg)
# a standalone copy with the ink colour baked in, for tools that ignore currentColor
open(dest.replace('.svg', '-ink.svg'), "w").write(svg.replace('fill="currentColor"', f'fill="{INK}"'))
print(dest, len(svg), "bytes")
EOF

# renders: light and dark at 1600 wide, favicons
magick -density 300 -background '#fbfaf7' "$DEST/imaji-$ID-ink.svg" -flatten -resize 1600x "$DEST/imaji-$ID-light.png"
sed "s/fill=\"$INK\"/fill=\"#f3efe8\"/" "$DEST/imaji-$ID-ink.svg" > "$WORK/$ID.dark.svg"
magick -density 300 -background '#171412' "$WORK/$ID.dark.svg" -flatten -resize 1600x "$DEST/imaji-$ID-dark.png"
magick -density 300 -background none "$DEST/imaji-$ID-ink.svg" -resize 1600x "$DEST/imaji-$ID-transparent.png"
# favicon candidates: the three dots alone (square), and the whole word
magick "$WORK/$ID.dots.svg" -density 600 -background none -fuzz 1% -trim +repage -gravity center -extent '%[fx:max(w,h)]x%[fx:max(w,h)]' -fill "$ACCENT" -colorize 100 -resize 64x64 "$DEST/favicon-dots-$ID.png" 2>/dev/null || true
magick -density 300 -background none "$DEST/imaji-$ID-ink.svg" -resize 64x -gravity center -extent 64x64 "$DEST/favicon-word-$ID.png"
ls -la "$DEST"
