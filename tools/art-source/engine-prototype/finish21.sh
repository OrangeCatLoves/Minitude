set -e
cd /tmp/claude-0/-home-claude/3fd5d84e-d272-5730-bf2c-7b023869af54/scratchpad/v21
D=$(pwd)/seg
printf "file '%s/b1.mp4'\nfile '%s/b2.mp4'\n" $D $D > seg/list_best.txt
ffmpeg -y -loglevel error -f concat -safe 0 -i seg/list_best.txt -c copy seg/video_best.mp4
ffmpeg -y -loglevel error -i seg/video_best.mp4 -i audio21_best.wav -map 0:v -map 1:a -c:v copy -c:a aac -b:a 192k -shortest -movflags +faststart Minitude_v5_perfect_run.mp4
ffmpeg -y -loglevel error -i seg/m1.mp4 -i audio21_main.wav -map 0:v -map 1:a -c:v copy -c:a aac -b:a 192k -shortest -movflags +faststart Minitude_v5_typical_run.mp4
for f in Minitude_v5_perfect_run.mp4 Minitude_v5_typical_run.mp4; do
  ffprobe -v error -show_entries stream=codec_name,width,height,r_frame_rate,nb_frames,duration -of default=nw=1 $f; ls -la $f
done
