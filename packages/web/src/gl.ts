/**
 * The world picture. Two passes on a WebGL2 canvas:
 *  A  the zoomed world: the current world at scale Zo, with the next world's soft-edged window growing out of the explorer's feet
 *     (sharp-bilinear sampling keeps the pixels crisp at any zoom; mipmaps keep them calm when zoomed far out)
 *  B  the speed effect (zoom blur + colour fringe) and the darkening reflection in the bottom 60 rows
 * Same maths as the design tool's world_layer3 / zoom_blur / aberrate.
 */
import { FADE_IN, FEATHER, FX, FY, H, HAND_OFF, ROW0, W, WORLD_ROWS, FOC } from './config'
import { smooth } from './util'

const VERT = `#version 300 es
in vec2 aPos;
void main(){ gl_Position = vec4(aPos, 0.0, 1.0); }`

const FRAG_A = `#version 300 es
precision highp float;
precision highp sampler2DArray;
uniform sampler2DArray uTex;
uniform float uZo, uZi, uK, uFade;
uniform int uJ;
uniform int uInner;
uniform vec4 uBox;   // left, right, top, bottom of the inner window in buffer pixels
uniform vec4 uFe;    // feather widths: left, right, top, bottom
uniform vec2 uFoc;
out vec4 o;

vec3 samp(float layer, vec2 p, float Z){
  vec2 s = (uFoc + (p - uFoc) / Z) / 4.0;
  float r = 4.0 * Z;
  vec2 uv; float lod = 0.0;
  if (r >= 1.0) {
    vec2 seam = floor(s + 0.5);
    vec2 d = s - seam;
    uv = (seam + clamp(d * r, -0.5, 0.5)) / vec2(320.0, 180.0);
  } else {
    uv = s / vec2(320.0, 180.0);
    lod = -log2(r);
  }
  return textureLod(uTex, vec3(uv, layer), lod).rgb;
}
void main(){
  vec2 p = vec2(gl_FragCoord.x, (${WORLD_ROWS}.0 - gl_FragCoord.y) + ${ROW0}.0);
  vec3 c = samp(float(uJ), p, uZo);
  if (uInner == 1) {
    float dist = min(min((p.x - uBox.x) / uFe.x, (uBox.y - p.x) / uFe.y), min((p.y - uBox.z) / uFe.z, (uBox.w - p.y) / uFe.w));
    float a = clamp(dist, 0.0, 1.0); a = a * a * (3.0 - 2.0 * a); a *= uFade;
    if (a > 0.0) {
      vec3 inner = samp(float(36 + uJ + 1), p, uZi);
      if (uK > 0.0001) inner = mix(inner, samp(float(uJ + 1), p, uZi), uK);
      c = mix(c, inner, a);
    }
  }
  o = vec4(c, 1.0);
}`

const FRAG_B = `#version 300 es
precision highp float;
uniform sampler2D uW;
uniform float uBlur, uAb;
uniform vec2 uFoc;
out vec4 o;
vec3 fetch(vec2 q){
  q = clamp(q, vec2(0.5), vec2(${W}.0 - 0.5, ${WORLD_ROWS}.0 - 0.5));
  return texture(uW, vec2(q.x / ${W}.0, 1.0 - q.y / ${WORLD_ROWS}.0)).rgb;
}
void main(){
  float yt = ${H}.0 - gl_FragCoord.y;
  vec2 pix = vec2(gl_FragCoord.x, yt);
  float shade = 1.0;
  if (yt >= ${WORLD_ROWS}.0) {
    float k = floor(yt) - ${WORLD_ROWS}.0;
    pix.y = ${WORLD_ROWS - 5}.0 - k + 0.5;
    shade = mix(0.62, 0.22, k / 59.0);
  }
  vec3 acc = vec3(0.0);
  for (int i = 0; i < 5; i++) {
    float sc = 1.0 + uBlur * (float(i) / 4.0 - 0.5);
    vec2 d = pix - uFoc;
    acc.r += fetch(uFoc + d / (sc * (1.0 + uAb))).r;
    acc.g += fetch(uFoc + d / sc).g;
    acc.b += fetch(uFoc + d / (sc * (1.0 - uAb))).b;
  }
  o = vec4(acc / 5.0 * shade, 1.0);
}`

function compile(gl: WebGL2RenderingContext, type: number, src: string): WebGLShader {
  const s = gl.createShader(type)!
  gl.shaderSource(s, src)
  gl.compileShader(s)
  if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error('shader: ' + gl.getShaderInfoLog(s))
  return s
}
function program(gl: WebGL2RenderingContext, frag: string): WebGLProgram {
  const p = gl.createProgram()!
  gl.attachShader(p, compile(gl, gl.VERTEX_SHADER, VERT))
  gl.attachShader(p, compile(gl, gl.FRAGMENT_SHADER, frag))
  gl.bindAttribLocation(p, 0, 'aPos')
  gl.linkProgram(p)
  if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error('program: ' + gl.getProgramInfoLog(p))
  return p
}

export class WorldGL {
  /** the world picture. Replaced by a new canvas when the browser takes the graphics context away and it has to be rebuilt. */
  canvas!: HTMLCanvasElement
  /** false while the world cannot be drawn (the browser has taken the graphics context away) */
  ready = false
  private gl!: WebGL2RenderingContext
  private pa!: WebGLProgram
  private pb!: WebGLProgram
  private tex!: WebGLTexture
  private fbo!: WebGLFramebuffer
  private fboTex!: WebGLTexture
  private ua: Record<string, WebGLUniformLocation | null> = {}
  private ub: Record<string, WebGLUniformLocation | null> = {}
  private failures = 0
  private checks = 0

  constructor(private readonly scenes: HTMLImageElement[], private readonly inners: HTMLImageElement[]) {
    this.build() // throws, as before, when the browser has no WebGL 2
  }

  /** Browsers can take the graphics context away at any time (a graphics driver reset, power saving, switching away). Until it is
   *  rebuilt nothing can be drawn, so the world picture would freeze while everything drawn in 2D carried on. */
  private rebuild(): void {
    try {
      this.build()
      this.failures = 0
      console.info('[minitude] world picture rebuilt')
    } catch (e) {
      console.error('[minitude] could not rebuild the world picture:', e)
      if (++this.failures < 10) setTimeout(() => { if (!this.ready) this.rebuild() }, 2000)
    }
  }

  private build(): void {
    const canvas = document.createElement('canvas')
    canvas.width = W
    canvas.height = H
    const gl = canvas.getContext('webgl2', { antialias: false, alpha: false, preserveDrawingBuffer: false, premultipliedAlpha: false, powerPreference: 'high-performance' })
    if (!gl) throw new Error('This game needs WebGL 2, which this browser does not provide.')
    canvas.addEventListener('webglcontextlost', (e) => {
      e.preventDefault() // asks the browser to give the context back
      if (canvas !== this.canvas) return
      this.ready = false
      console.warn('[minitude] the browser took the graphics context away; rebuilding the world picture')
      setTimeout(() => { if (canvas === this.canvas && !this.ready) this.rebuild() }, 1500)
    })
    canvas.addEventListener('webglcontextrestored', () => { if (canvas === this.canvas && !this.ready) this.rebuild() })
    const info = gl.getExtension('WEBGL_debug_renderer_info')
    console.info('[minitude] graphics:', info ? gl.getParameter(info.UNMASKED_RENDERER_WEBGL) : 'unknown')
    const scenes = this.scenes, inners = this.inners
    this.ready = false
    this.canvas = canvas
    this.gl = gl
    this.pa = program(gl, FRAG_A)
    this.pb = program(gl, FRAG_B)
    for (const n of ['uTex', 'uZo', 'uZi', 'uK', 'uFade', 'uJ', 'uInner', 'uBox', 'uFe', 'uFoc']) this.ua[n] = gl.getUniformLocation(this.pa, n)
    for (const n of ['uW', 'uBlur', 'uAb', 'uFoc']) this.ub[n] = gl.getUniformLocation(this.pb, n)

    // full-screen triangle
    const vb = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, vb)
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW)
    gl.enableVertexAttribArray(0)
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0)

    // 72 layers: scenes 0..35, inners 36..71
    this.tex = gl.createTexture()!
    gl.bindTexture(gl.TEXTURE_2D_ARRAY, this.tex)
    gl.texStorage3D(gl.TEXTURE_2D_ARRAY, 9, gl.RGBA8, 320, 180, 72)
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false)
    const all = [...scenes, ...inners]
    all.forEach((im, k) => gl.texSubImage3D(gl.TEXTURE_2D_ARRAY, 0, 0, 0, k, 320, 180, 1, gl.RGBA, gl.UNSIGNED_BYTE, im))
    gl.generateMipmap(gl.TEXTURE_2D_ARRAY)
    gl.texParameteri(gl.TEXTURE_2D_ARRAY, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR)
    gl.texParameteri(gl.TEXTURE_2D_ARRAY, gl.TEXTURE_MAG_FILTER, gl.LINEAR)
    gl.texParameteri(gl.TEXTURE_2D_ARRAY, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
    gl.texParameteri(gl.TEXTURE_2D_ARRAY, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)

    this.fboTex = gl.createTexture()!
    gl.bindTexture(gl.TEXTURE_2D, this.fboTex)
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA8, W, WORLD_ROWS, 0, gl.RGBA, gl.UNSIGNED_BYTE, null)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
    this.fbo = gl.createFramebuffer()!
    gl.bindFramebuffer(gl.FRAMEBUFFER, this.fbo)
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, this.fboTex, 0)
    gl.bindFramebuffer(gl.FRAMEBUFFER, null)
    this.ready = true
  }

  /** z = camera position in worlds (integer at rest), pulse = camera punch, blur / ab = speed effect strengths (0 = none).
   *  Returns false when nothing could be drawn (the graphics context is away): the caller must not use the canvas then. */
  draw(z: number, pulse: number, blur: number, ab: number): boolean {
    const gl = this.gl
    if (!this.ready) return false
    if (gl.isContextLost()) { this.ready = false; return false }
    let j = Math.floor(z + 1e-9)
    const f = z - j
    j = Math.min(j, 35)
    const Zo = 10 ** f * pulse
    const inner = f > 1e-4 && j < 35
    const Zi = 10 ** (f - 1) * pulse
    const left = FX - Zi * FX, right = FX + Zi * (W - FX), top = FY - Zi * FY, bottom = FY + Zi * (H - FY)
    const fw = FEATHER * 4 * Zi
    const fl = Math.max(1, Math.min(fw, left)), fr = Math.max(1, Math.min(fw, W - right))
    const ft = Math.max(1, Math.min(fw, top)), fb = Math.max(1, Math.min(fw, H - bottom))

    gl.bindFramebuffer(gl.FRAMEBUFFER, this.fbo)
    gl.viewport(0, 0, W, WORLD_ROWS)
    gl.useProgram(this.pa)
    gl.activeTexture(gl.TEXTURE0)
    gl.bindTexture(gl.TEXTURE_2D_ARRAY, this.tex)
    gl.uniform1i(this.ua.uTex, 0)
    gl.uniform1f(this.ua.uZo, Zo)
    gl.uniform1f(this.ua.uZi, Zi)
    gl.uniform1f(this.ua.uK, smooth(HAND_OFF, 1.0, f))
    gl.uniform1f(this.ua.uFade, smooth(0.0, FADE_IN, f))
    gl.uniform1i(this.ua.uJ, j)
    gl.uniform1i(this.ua.uInner, inner ? 1 : 0)
    gl.uniform4f(this.ua.uBox, left, right, top, bottom)
    gl.uniform4f(this.ua.uFe, fl, fr, ft, fb)
    gl.uniform2f(this.ua.uFoc, FX, FY)
    gl.drawArrays(gl.TRIANGLES, 0, 3)

    gl.bindFramebuffer(gl.FRAMEBUFFER, null)
    gl.viewport(0, 0, W, H)
    gl.useProgram(this.pb)
    gl.bindTexture(gl.TEXTURE_2D, this.fboTex)
    gl.uniform1i(this.ub.uW, 0)
    gl.uniform1f(this.ub.uBlur, blur)
    gl.uniform1f(this.ub.uAb, ab)
    gl.uniform2f(this.ub.uFoc, FOC[0], FOC[1])
    gl.drawArrays(gl.TRIANGLES, 0, 3)
    // a graphics error would otherwise be silent: say so (the first few frames only)
    if (this.checks < 5) {
      this.checks++
      const err = gl.getError()
      if (err !== gl.NO_ERROR) console.error('[minitude] WebGL error 0x' + err.toString(16) + ' while drawing the world')
    }
    return true
  }
}
