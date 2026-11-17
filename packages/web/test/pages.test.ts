import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { GEM_TIER, RUN_LENGTH, TIERS } from '@minitude/core'

// The plain pages around the game (how to play, about, privacy): they must say what the game really does, point only at pages that exist, and
// say nothing about how answers are judged (the same rule as the privacy page).
const root = join(__dirname, '..')
const read = (f: string): string => readFileSync(join(root, f), 'utf8')
const PAGES: Record<string, string> = { '/how-to-play': 'how-to-play.html', '/about': 'about.html', '/privacy': 'privacy.html' }
const text = (html: string): string => html.replace(/<script[\s\S]*?<\/script>/g, ' ').replace(/<[^>]+>/g, ' ').replace(/&[a-z]+;|&#\d+;/g, ' ').replace(/\s+/g, ' ')

describe('every plain page', () => {
  for (const [url, file] of Object.entries(PAGES)) {
    const html = read(file)
    it(`${file} has its own title, description and canonical address`, () => {
      expect(html).toMatch(/<title>[^<]{10,}<\/title>/)
      expect(html).toMatch(/<meta name="description" content="[^"]{60,}"/)
      expect(html).toContain(`<link rel="canonical" href="https://minitude.io${url}" />`)
      expect(html).toContain('<h1>')
    })
    it(`${file} names no model, provider or way of judging answers`, () => {
      const t = text(html)
      expect(t).not.toMatch(/gemini|fallback model|failover|anthropic|openai|\bllm\b|language model|\bmock\b|artificial intelligence|\bAI\b/i)
      expect(t).not.toMatch(/answer lists?|checked against|look(ed)? up in|database of answers|wikidata|wikipedia|accepted answers|stored answers|matching/i)
    })
    it(`${file} links only to pages that exist, and its in-page links have a target`, () => {
      const ids = new Set([...html.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1]))
      for (const m of html.matchAll(/<a [^>]*href="([^"]+)"/g)) {
        const href = m[1]
        if (href.startsWith('#')) expect(ids.has(href.slice(1)), `${file}: ${href}`).toBe(true)
        else if (href.startsWith('/')) expect(['/', ...Object.keys(PAGES)], `${file}: ${href}`).toContain(href)
        else expect(href, `${file}: ${href}`).toMatch(/^(https:\/\/|mailto:)/)
      }
    })
  }
  it('have different titles', () => {
    const titles = Object.values(PAGES).map((f) => /<title>([^<]+)<\/title>/.exec(read(f))![1])
    expect(new Set(titles).size).toBe(titles.length)
  })
})

describe('the how to play page says what the game does', () => {
  const html = read('how-to-play.html')
  const t = text(html)
  it('lists the rarities with the points the game really gives', () => {
    const scoring = /<section id="scoring">([\s\S]*?)<\/section>/.exec(html)![1]
    const shown = [...scoring.matchAll(/<li>([A-Za-z]+) <b>(\d+)<\/b><\/li>/g)].map((m) => [m[1].toLowerCase(), Number(m[2])])
    expect(shown).toEqual(TIERS.map((x) => [x.name.toLowerCase(), x.points]))
    expect(TIERS[GEM_TIER].name).toBe('SINGULARITY')
  })
  it('gets the size of a run, the time and the best score right', () => {
    expect(RUN_LENGTH).toBe(7)
    expect(t).toContain('A run is seven questions')
    expect(t).toContain('30 seconds')
    expect(t).toContain('perfect 700')
    expect(t).toContain('840')
    expect(Math.max(...TIERS.map((x) => x.points)) * RUN_LENGTH).toBe(840)
    expect(TIERS[GEM_TIER - 1].points * RUN_LENGTH).toBe(700)
  })
  it('does not give away any gem: none of the gem answers appears on any plain page', () => {
    const gems = (JSON.parse(readFileSync(join(root, '..', 'server', 'data', 'gems.json'), 'utf8')) as { gems: { answer: string }[] }).gems
    expect(gems.length).toBeGreaterThan(300)
    for (const f of Object.values(PAGES)) {
      const page = text(read(f)).toLowerCase()
      for (const g of gems) expect(page, `${f} contains the gem "${g.answer}"`).not.toContain(g.answer.toLowerCase())
    }
  })
})

describe('how people find these pages', () => {
  it('the title screen links to all three', () => {
    const index = read('index.html')
    for (const url of Object.keys(PAGES)) expect(index).toContain(`href="${url}"`)
  })
  it('the sitemap lists the game and all three pages, each once', () => {
    const map = read(join('public', 'sitemap.xml'))
    for (const url of ['/', ...Object.keys(PAGES)]) expect(map.split(`<loc>https://minitude.io${url}</loc>`).length - 1).toBe(1)
  })
  it('robots.txt lets crawlers in, keeps them out of the API and points at the sitemap', () => {
    const robots = read(join('public', 'robots.txt'))
    expect(robots).toContain('Allow: /')
    expect(robots).toContain('Disallow: /api/')
    expect(robots).toContain('Sitemap: https://minitude.io/sitemap.xml')
  })
})

describe('the privacy page tells the truth about the visit count', () => {
  const t = text(read('privacy.html'))
  it('says visits are counted, what is sent, and that it cannot tell visitors apart', () => {
    expect(t).toContain('A visit count')
    expect(t).toContain('time zone')
    expect(t).toContain('no address, no ID')
  })
  it('still promises no cookies and no third-party analytics, which the count does not break', () => {
    expect(t).toContain('no tracking cookies and no third-party analytics')
    expect(t).toContain('sets no cookies')
  })
})
