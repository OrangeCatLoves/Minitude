/**
 * The small script of the plain pages around the game (how to play, about): the footer, the contact section when there is an address to show,
 * and the place for an ad (docs/ADS.md): empty and hidden unless the ads are switched on (ADS_ENABLED) or `?adpreview=1` asks to see the box.
 */
import { ADS_ENABLED } from './ads'
import { SITE, buildFooter, footerLinks } from './site'

const preview = new URLSearchParams(location.search).has('adpreview')
if (preview) document.documentElement.dataset.adpreview = ''
if (ADS_ENABLED || preview) document.querySelectorAll<HTMLElement>('.doc-ad').forEach((e) => { e.hidden = false })

// the contact section appears only when there is something in it
const contact = document.getElementById('contact')
const lines = document.getElementById('contact-lines')
const links = footerLinks(SITE, false)
if (contact && lines && links.length) {
  const text: Record<string, string> = {
    'contact us': 'Bugs, feedback, a mistake in a question, or anything else: ',
    instagram: 'Find us on ',
  }
  links.forEach((l, i) => {
    if (i > 0) lines.append(document.createElement('br'))
    lines.append(document.createTextNode(text[l.label] ?? ''))
    const a = document.createElement('a')
    a.href = l.href
    a.textContent = l.label === 'contact us' ? (SITE.contactEmail || l.label) : 'Instagram'
    if (l.external) { a.target = '_blank'; a.rel = 'noopener noreferrer' }
    lines.append(a)
  })
  contact.hidden = false
  const toc = document.getElementById('toc-contact')
  if (toc) toc.hidden = false
}

document.getElementById('foot')?.append(buildFooter(document, SITE, true))
