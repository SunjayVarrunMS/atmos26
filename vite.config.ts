import { readFileSync, mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig, type Plugin } from 'vite'
import { EVENTS, eventSummary } from './src/data/events.ts'
import { FEST } from './src/data/fest.ts'

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;')

// swaps the page title, description and share-card tags in the built index.html
function withMeta(html: string, url: string, title: string, description: string) {
  const set = (h: string, key: string, value: string) =>
    h.replace(new RegExp(`(${key}" content=")[^"]*`), `$1${esc(value)}`)
  let out = html.replace(/<title>[^<]*<\/title>/, `<title>${esc(title)}</title>`)
  out = set(out, 'name="description', description)
  out = set(out, 'property="og:url', url)
  out = set(out, 'property="og:title', title)
  out = set(out, 'property="og:description', description)
  out = set(out, 'name="twitter:title', title)
  return out
}

// Share cards are read by crawlers that don't run JS, so every event gets its
// own copy of index.html with its name and prize in the tags. Vercel serves
// these files before the SPA rewrite; the app itself is unchanged.
function eventPages(): Plugin {
  let outDir = 'dist'
  return {
    name: 'event-pages',
    apply: 'build',
    configResolved(config) {
      outDir = config.build.outDir
    },
    closeBundle() {
      const html = readFileSync(join(outDir, 'index.html'), 'utf-8')
      const where = `BITS Pilani, Hyderabad Campus · 23–25 October 2026`
      const page = (path: string, title: string, description: string) => {
        mkdirSync(join(outDir, path), { recursive: true })
        writeFileSync(join(outDir, path, 'index.html'), withMeta(html, `${FEST.url}/${path}`, title, description))
      }
      page('events', 'Events · ATMOS ’26', `${EVENTS.length} competitions, workshops and experiences. ${where}.`)
      for (const e of EVENTS) page(`events/${e.id}`, `${e.title} · ATMOS ’26`, [eventSummary(e), where].filter(Boolean).join('. ') + '.')
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss(), eventPages()],
})
