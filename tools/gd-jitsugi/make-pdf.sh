#!/bin/bash
# 指示書・指示図・チェックリストを PDF にする。
#
# **pdf-lib は使わない。** IPAmj明朝を埋め込むと1本31MBになったため、
# Chrome のヘッドレスに印刷させてサブセットを作らせている（実測 30〜60KB）。
# ヘッドレスの Chrome は印刷後も終了しないので、timeout で切って kill する。
set -u
CHROME="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
OUT="public/study/graphic-design/dento-iro"
SRC="tools/gd-jitsugi"
PROFILE="/tmp/gd-jitsugi-chrome"

mkdir -p "$OUT"
for name in shijisho shijizu checklist; do
  rm -f "$OUT/$name.pdf"
  "$CHROME" --headless --disable-gpu --no-pdf-header-footer \
    --user-data-dir="$PROFILE" \
    --print-to-pdf="$PWD/$OUT/$name.pdf" \
    "file://$PWD/$SRC/$name.html" >/dev/null 2>&1 &
  pid=$!
  for _ in $(seq 1 40); do
    [ -s "$OUT/$name.pdf" ] && break
    sleep 0.5
  done
  sleep 1
  kill "$pid" 2>/dev/null
  wait "$pid" 2>/dev/null
  if [ -s "$OUT/$name.pdf" ]; then
    echo "$name.pdf $(wc -c < "$OUT/$name.pdf") bytes"
  else
    echo "$name.pdf を作れなかった" >&2
    exit 1
  fi
done
