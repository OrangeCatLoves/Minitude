#!/bin/bash
cd /tmp/claude-0/-home-claude/3fd5d84e-d272-5730-bf2c-7b023869af54/scratchpad/v21
( MINI_RUN=best python3 render21.py 0 10000 seg/b1.mp4 > seg/b1.log 2>&1 ) &
( MINI_RUN=main python3 render21.py 0 9312 seg/m1.mp4 > seg/m1.log 2>&1; MINI_RUN=best python3 render21.py 10000 11547 seg/b2.mp4 > seg/b2.log 2>&1 ) &
wait
echo RENDERDONE > seg/render.flag
