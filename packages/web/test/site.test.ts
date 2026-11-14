import { describe, expect, it } from 'vitest'
import { footerLinks, SITE } from '../src/site'

const site = (over: Partial<typeof SITE> = {}) => ({ ...SITE, contactEmail: '', instagramUrl: '', ...over })

describe('the footer links', () => {
  it('with no addresses set shows only the privacy page: a link is never shown without somewhere to go', () => {
    expect(footerLinks(site()).map((l) => l.label)).toEqual(['privacy'])
  })

  it('shows each link as soon as its address is set, in the order contact, instagram, privacy', () => {
    const all = footerLinks(site({ contactEmail: 'a@example.com', instagramUrl: 'https://www.instagram.com/x' }))
    expect(all.map((l) => l.label)).toEqual(['contact us', 'instagram', 'privacy'])
    expect(footerLinks(site({ instagramUrl: 'https://www.instagram.com/x' })).map((l) => l.label)).toEqual(['instagram', 'privacy'])
    expect(all.map((l) => l.label)).not.toContain('business inquiries')
  })

  it('writes e-mail links with a subject that is safe to put in an address', () => {
    const l = footerLinks(site({ contactEmail: 'a@example.com' }))[0]
    expect(l.href).toBe('mailto:a@example.com?subject=Minitude%3A%20bug%20or%20feedback')
    expect(l.external).toBe(false)
  })

  it('opens the privacy page and Instagram in a new tab, and e-mail in the mail program', () => {
    const links = footerLinks(site({ contactEmail: 'a@example.com', instagramUrl: 'https://www.instagram.com/x' }))
    expect(links.find((l) => l.label === 'privacy')).toMatchObject({ href: '/privacy', external: true })
    expect(links.find((l) => l.label === 'instagram')?.external).toBe(true)
    expect(links.find((l) => l.label === 'contact us')?.external).toBe(false)
  })

  it('leaves the privacy link out on the privacy page itself', () => {
    expect(footerLinks(site({ contactEmail: 'a@example.com' }), false).map((l) => l.label)).toEqual(['contact us'])
    expect(footerLinks(site(), false)).toEqual([])
  })

  it('ships with real contact details (one address, and no separate business link: the owner chose that on 14 Nov 2026) and no Instagram link yet', () => {
    expect(SITE.contactEmail).toMatch(/^[^@\s]+@[^@\s]+\.[^@\s]+$/)
    expect(SITE.contactEmail).not.toMatch(/example\./)          // never a made-up address
    expect(SITE.instagramUrl).toBe('')
    expect(footerLinks().map((l) => l.label)).toEqual(['contact us', 'privacy'])
  })
})
