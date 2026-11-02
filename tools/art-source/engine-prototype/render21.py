"""Render frames [a, b) to a segment mp4 (no audio). Usage: MINI_RUN=main|best render21.py a b out.mp4"""
import sys, subprocess, time
sys.path.insert(0, '/tmp/claude-0/-home-claude/3fd5d84e-d272-5730-bf2c-7b023869af54/scratchpad/v21')
import minui21 as mini

a, b, out = int(sys.argv[1]), int(sys.argv[2]), sys.argv[3]
cmd = ['ffmpeg', '-y', '-loglevel', 'error', '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-s', '1280x720', '-r', '60', '-i', '-',
       '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '16', '-pix_fmt', 'yuv420p', '-g', '60', '-bf', '2',
       '-colorspace', 'bt709', '-color_primaries', 'bt709', '-color_trc', 'bt709', '-movflags', '+faststart', out]
p = subprocess.Popen(cmd, stdin=subprocess.PIPE)
t0 = time.time()
for k in range(a, b):
    fr = mini.render(k / 60.0)
    p.stdin.write(fr.tobytes())
    if (k - a) % 300 == 0:
        print(k, round(time.time() - t0, 1), flush=True)
p.stdin.close(); p.wait()
print('done', a, b, round(time.time() - t0, 1), flush=True)
