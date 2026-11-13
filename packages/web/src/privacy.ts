/** The privacy page needs a little script: its date, the footer, the contact section, and the visitor's own anonymous ID. */
import { SITE, buildFooter, footerLinks } from './site'

const GUEST_KEY = 'minitude.guest'

const updated = document.getElementById('updated')
if (updated) updated.textContent = SITE.privacyUpdated

// the visitor's own anonymous ID, read from this browser (it never leaves the page)
const guestLine = document.getElementById('guest-line')
if (guestLine) {
  let id = ''
  try { id = localStorage.getItem(GUEST_KEY) ?? '' } catch { /* storage blocked */ }
  if (/^[A-Za-z0-9_-]{16,64}$/.test(id)) {
    guestLine.textContent = 'This browser’s ID is:'
    const code = document.createElement('span')
    code.className = 'guest'
    code.textContent = id
    guestLine.append(document.createElement('br'), code)
  } else {
    guestLine.textContent = 'This browser has no ID yet. One is made the first time you play, and stays in this browser.'
  }
}

// the contact section appears only when there is something in it
const contact = document.getElementById('contact')
const lines = document.getElementById('contact-lines')
// one address for everything: say so once instead of listing it twice
const oneAddress = !!SITE.contactEmail && SITE.contactEmail === SITE.businessEmail
const links = footerLinks(SITE, false).filter((l) => !(oneAddress && l.label === 'business inquiries'))
if (contact && lines && links.length) {
  const text: Record<string, string> = {
    'contact us': oneAddress ? 'Bugs, feedback, business inquiries, or a question about your information: ' : 'Bugs, feedback, or a question about your information: ',
    'business inquiries': 'Business inquiries: ',
    instagram: 'Find us on ',
  }
  links.forEach((l, i) => {
    if (i > 0) lines.append(document.createElement('br'))
    lines.append(document.createTextNode(text[l.label] ?? ''))
    const a = document.createElement('a')
    a.href = l.href
    a.textContent = l.label === 'contact us' ? (SITE.contactEmail || l.label) : l.label === 'business inquiries' ? (SITE.businessEmail || l.label) : 'Instagram'
    if (l.external) { a.target = '_blank'; a.rel = 'noopener noreferrer' }
    lines.append(a)
  })
  contact.hidden = false
  const toc = document.getElementById('toc-contact')
  if (toc) toc.hidden = false
}

// this IS the privacy page, so its footer does not link to itself
document.getElementById('foot')?.append(buildFooter(document, SITE, false))
