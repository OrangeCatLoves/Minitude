import type { RGB } from './util'

export interface ExplorerBox { ox: number; oy: number; w: number; h: number }
export interface Manifest {
  explorer: Record<string, ExplorerBox>
  accents: Record<string, RGB>
}
export interface Assets {
  scenes: HTMLImageElement[]   // 36 pictures, 320 x 180
  inners: HTMLImageElement[]   // the same with the next world already inside (for the zoom window)
  explorer: HTMLImageElement[] // 3 glow states, native pixels, cropped
  gems: HTMLImageElement[]     // 6 rarity gems, 32 x 32
  manifest: Manifest
}

const base = import.meta.env.BASE_URL

function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const im = new Image()
    im.onload = () => resolve(im)
    im.onerror = () => reject(new Error('could not load ' + url))
    im.src = url
  })
}

export async function loadFonts(): Promise<void> {
  const faces: [string, string, string][] = [
    ['PixelifyFix', 'fonts/PixelifyFix-400.ttf', '400'],
    ['PixelifyFix', 'fonts/PixelifyFix-500.ttf', '500'],
    ['PixelifyFix', 'fonts/PixelifyFix-600.ttf', '600'],
    ['PixelifyFix', 'fonts/PixelifyFix-700.ttf', '700'],
    ['Silkscreen', 'fonts/Silkscreen-Regular.ttf', '400'],
    ['Silkscreen', 'fonts/Silkscreen-Bold.ttf', '700'],
  ]
  await Promise.all(
    faces.map(async ([family, url, weight]) => {
      const f = new FontFace(family, `url(${base}${url})`, { weight })
      await f.load()
      document.fonts.add(f)
    }),
  )
}

export async function loadAssets(onProgress?: (done: number, total: number) => void): Promise<Assets> {
  const manifest: Manifest = await (await fetch(`${base}assets/manifest.json`)).json()
  const urls: string[] = []
  for (let k = 0; k < 36; k++) urls.push(`${base}assets/world/s${k}.png`)
  for (let k = 0; k < 36; k++) urls.push(`${base}assets/world/i${k}.png`)
  for (let k = 0; k < 3; k++) urls.push(`${base}assets/explorer${k}.png`)
  for (let k = 0; k < 6; k++) urls.push(`${base}assets/gem${k}.png`)
  let done = 0
  const imgs = await Promise.all(
    urls.map(async (u) => {
      const im = await loadImage(u)
      onProgress?.(++done, urls.length)
      return im
    }),
  )
  await loadFonts()
  return {
    scenes: imgs.slice(0, 36),
    inners: imgs.slice(36, 72),
    explorer: imgs.slice(72, 75),
    gems: imgs.slice(75, 81),
    manifest,
  }
}
