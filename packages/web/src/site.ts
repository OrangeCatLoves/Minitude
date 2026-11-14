/**
 * Everything about the site that is not the game itself, in one place: who to write to and where the game lives.
 * A link whose address is empty is simply not shown, so nothing on the page ever points nowhere.
 * (Set the addresses here. For a quick look in development they can also come from VITE_CONTACT_EMAIL
 * and VITE_INSTAGRAM_URL in packages/web/.env.local, which is not committed.)
 */
const env = import.meta.env as Record<string, string | undefined>

export const SITE = {
  name: 'Minitude',
  url: 'https://minitude.io',
  /** "found a bug?" and "contact us" (bugs, feedback, business: one address for everything) */
  contactEmail: env.VITE_CONTACT_EMAIL ?? 'weibin265@gmail.com',
  /** the full address of the Instagram page, for example https://www.instagram.com/yourname */
  instagramUrl: env.VITE_INSTAGRAM_URL ?? '',
  /** the year in the copyright line */
  year: 2026,
  /** when the privacy page was last changed */
  privacyUpdated: '14 November 2026',
}

export interface FooterLink { label: string; href: string; external: boolean }

/** the links of the footer, in order, without the ones that have no address yet */
export function footerLinks(site: typeof SITE = SITE, withPrivacy = true): FooterLink[] {
  const out: FooterLink[] = []
  const mail = (to: string, subject: string) => `mailto:${to}?subject=${encodeURIComponent(subject)}`
  if (site.contactEmail) out.push({ label: 'contact us', href: mail(site.contactEmail, 'Minitude: bug or feedback'), external: false })
  if (site.instagramUrl) out.push({ label: 'instagram', href: site.instagramUrl, external: true })
  if (withPrivacy) out.push({ label: 'privacy', href: '/privacy', external: true })
  return out
}

/**
 * The footer as DOM nodes: "found a bug? lost your streak? contact us · instagram · privacy", then the copyright line.
 * The question is shown only when there is a "contact us" to answer it.
 */
export function buildFooter(doc: Document, site: typeof SITE = SITE, withPrivacy = true): HTMLElement {
  const foot = doc.createElement('footer')
  foot.className = 'site-foot'
  const links = doc.createElement('p')
  links.className = 'site-foot-links'
  if (site.contactEmail) {
    const q = doc.createElement('span')
    q.className = 'site-foot-q'
    q.textContent = 'found a bug? lost your streak? '
    links.append(q)
  }
  footerLinks(site, withPrivacy).forEach((l, i) => {
    if (i > 0) links.append(doc.createTextNode(' · '))
    const a = doc.createElement('a')
    a.href = l.href
    a.textContent = l.label
    if (l.external) { a.target = '_blank'; a.rel = 'noopener noreferrer' }
    links.append(a)
  })
  const copy = doc.createElement('p')
  copy.className = 'site-foot-copy'
  copy.textContent = `© ${site.year} ${site.name}`
  foot.append(links, copy)
  return foot
}
