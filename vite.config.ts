import { readFileSync, mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig, type Plugin } from 'vite'
import { EVENTS, eventSummary } from './src/data/events.ts'
import { CONTACT, FEST } from './src/data/fest.ts'
import { TITLE_SPONSOR } from './src/data/sponsors.ts'

// the domain index.html is written with; FEST.url replaces it at build time
const HTML_ORIGIN = 'https://atmos26.vercel.app'

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;')

// swaps the page title, description, canonical and share-card tags in the built index.html
function withMeta(html: string, url: string, title: string, description: string) {
  const set = (h: string, key: string, value: string) =>
    h.replace(new RegExp(`(${key}" content=")[^"]*`), `$1${esc(value)}`)
  let out = html.replace(/<title>[^<]*<\/title>/, `<title>${esc(title)}</title>`)
  out = out.replace(/(<link rel="canonical" href=")[^"]*/, `$1${esc(url)}`)
  out = set(out, 'name="description', description)
  out = set(out, 'property="og:url', url)
  out = set(out, 'property="og:title', title)
  out = set(out, 'property="og:description', description)
  out = set(out, 'name="twitter:title', title)
  out = set(out, 'name="twitter:description', description)
  return out
}

// the fest itself as schema.org data, so search results can show its dates and place
function festJsonLd() {
  const data = {
    '@context': 'https://schema.org',
    '@type': 'Event',
    name: `${FEST.name} ’26`,
    alternateName: `${FEST.name} ${FEST.edition}`,
    description: `The technical fest of ${FEST.college}, ${FEST.campus}. ${FEST.theme}: ${FEST.subtheme}.`,
    startDate: FEST.startsAt.toISOString(),
    endDate: FEST.endsAt.toISOString(),
    eventStatus: 'https://schema.org/EventScheduled',
    eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
    location: {
      '@type': 'Place',
      name: `${FEST.college}, ${FEST.campus}`,
      address: CONTACT.address,
      geo: { '@type': 'GeoCoordinates', latitude: FEST.coordinates.lat, longitude: FEST.coordinates.lng },
    },
    image: [`${FEST.url}/og.jpg`],
    url: `${FEST.url}/`,
    organizer: { '@type': 'Organization', name: `${FEST.college}, ${FEST.campus}`, email: CONTACT.email },
  }
  // < escaped so the JSON can never close the script tag
  return `<script type="application/ld+json">${JSON.stringify(data).replace(/</g, '\\u003c')}</script>`
}

// Share cards are read by crawlers that don't run JS, so every route gets its
// own copy of index.html with its own title and description. Vercel serves
// these files as they are; anything else gets 404.html (a real 404 that still
// boots the app's "Signal lost" page). Also writes sitemap.xml and robots.txt.
function sitePages(): Plugin {
  let outDir = 'dist'
  let building = false
  let supabaseUrl: string | undefined
  return {
    name: 'site-pages',
    configResolved(config) {
      outDir = config.build.outDir
      building = config.command === 'build'
      supabaseUrl = config.env.VITE_SUPABASE_URL || undefined
    },
    transformIndexHtml(html) {
      return html.replaceAll(HTML_ORIGIN, FEST.url).replace('</head>', `  ${festJsonLd()}\n  </head>`)
    },
    closeBundle() {
      if (!building) return
      // inner pages don't show the hero, so they skip its logo-layer preloads (~530 KB);
      // the fest's structured data belongs to the home page only
      const html = readFileSync(join(outDir, 'index.html'), 'utf-8')
        .replace(/\s*<!-- the hero's[^>]*-->(\s*<link rel="preload" as="image"[^>]*>)+/, '')
        .replace(/\s*<script type="application\/ld\+json">.*?<\/script>/, '')
      // event pages fetch the clubs' edits from Supabase as they open: start the connection early
      const eventHtml = supabaseUrl
        ? html.replace('</head>', `  <link rel="preconnect" href="${esc(supabaseUrl)}" crossorigin />\n  </head>`)
        : html
      const where = `BITS Pilani, Hyderabad Campus · 23–25 October 2026`
      const paths = ['']
      const page = (path: string, title: string, description: string) => {
        mkdirSync(join(outDir, path), { recursive: true })
        const base = path.startsWith('events') ? eventHtml : html
        writeFileSync(join(outDir, path, 'index.html'), withMeta(base, `${FEST.url}/${path}`, title, description))
        paths.push(path)
      }

      page('events', 'Events · ATMOS ’26', `${EVENTS.length} competitions, workshops and experiences. ${where}.`)
      page('proshows', 'Proshows · ATMOS ’26', `Line-up revealing soon. ${where}.`)
      page('gallery', 'Gallery · ATMOS ’26', 'Photos from past editions of ATMOS, the technical fest of BITS Pilani, Hyderabad Campus.')
      page(
        'sponsors',
        'Sponsors · ATMOS ’26',
        [TITLE_SPONSOR && `Title sponsor: ${TITLE_SPONSOR.name}`, 'Partner with ATMOS ’26', where].filter(Boolean).join('. ') + '.',
      )
      page('contact', 'Contact · ATMOS ’26', `Write to the ATMOS ’26 team or find us on Instagram. ${where}.`)
      for (const e of EVENTS) page(`events/${e.id}`, `${e.title} · ATMOS ’26`, [eventSummary(e), where].filter(Boolean).join('. ') + '.')

      // unknown URLs: no canonical, not indexed
      const lost = withMeta(html, FEST.url, 'Page not found · ATMOS ’26', 'This page never made it through the convergence.')
        .replace(/\s*<link rel="canonical"[^>]*>/, '')
        .replace('<meta name="theme-color"', '<meta name="robots" content="noindex" />\n    <meta name="theme-color"')
      writeFileSync(join(outDir, '404.html'), lost)

      const urls = paths.map((p) => `  <url><loc>${FEST.url}/${p}</loc></url>`).join('\n')
      writeFileSync(
        join(outDir, 'sitemap.xml'),
        `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`,
      )
      writeFileSync(join(outDir, 'robots.txt'), `User-agent: *\nAllow: /\n\nSitemap: ${FEST.url}/sitemap.xml\n`)
    },
  }
}

// The clubs' edits from /manage, fetched once at build time and bundled as
// virtual:event-edits. If Supabase is down or slow when a visitor opens the
// site, the events still show every edit made before the last deploy. A failed
// fetch only logs a warning: the build goes on with no snapshot.
function editsSnapshot(): Plugin {
  const id = 'virtual:event-edits'
  let rows = '[]'
  return {
    name: 'event-edits-snapshot',
    async configResolved(config) {
      const url = config.env.VITE_SUPABASE_URL
      const key = config.env.VITE_SUPABASE_ANON_KEY
      if (config.command !== 'build' || !url || !key) return
      try {
        const res = await fetch(
          `${url}/rest/v1/event_edits?select=event_id,venue,when,team,about,image_path,updated_at&apikey=${encodeURIComponent(key)}`,
          { signal: AbortSignal.timeout(10000) },
        )
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        const data: unknown = await res.json()
        if (!Array.isArray(data)) throw new Error('unexpected response')
        rows = JSON.stringify(data)
        config.logger.info(`event edits snapshot: ${data.length} rows`)
      } catch (err) {
        config.logger.warn(`event edits snapshot skipped (${err instanceof Error ? err.message : err}); building without it`)
      }
    },
    resolveId(source) {
      return source === id ? `\0${id}` : undefined
    },
    load(source) {
      return source === `\0${id}` ? `export default ${rows}` : undefined
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss(), sitePages(), editsSnapshot()],
})
