#!/bin/bash
# Render every shot in order with one Blender process (two in parallel was slower on this 4-core CPU).
# Frames already on disk are skipped, so this can be restarted.
cd "$(dirname "$0")/.."
python3 tools/render.py street vanish void light back space dark phones lab dome roof sky > out/render.log 2>&1
echo "ALL DONE: $(ls public/frames | wc -l) frames"
