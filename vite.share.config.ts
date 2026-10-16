// Standalone build for sharing the prototype as ONE self-contained HTML file
// (no server needed — double-click to open). Run: npm run build:share
// Output: dist-share/index.html
import { defineConfig, mergeConfig } from 'vite'
import { viteSingleFile } from 'vite-plugin-singlefile'
import fs from 'fs'
import path from 'path'
import base from './vite.config'

// Images in /public are referenced as '/hbo.png' etc. in the source. Those paths only work
// when served from a web root, so inline them as data URIs for the single-file build.
function inlinePublicAssets() {
  const mime: Record<string, string> = { '.png': 'image/png', '.svg': 'image/svg+xml' }
  const toDataUri = (file: string) => {
    const buf = fs.readFileSync(path.resolve(__dirname, 'public', file))
    return `data:${mime[path.extname(file)]};base64,${buf.toString('base64')}`
  }
  return {
    name: 'inline-public-assets',
    enforce: 'pre' as const,
    transform(code: string, id: string) {
      if (!id.includes('/src/') || !/\.(t|j)sx?$/.test(id)) return null
      const out = code.replace(/(['"])\/([\w-]+\.(?:png|svg))\1/g, (m, q, file) =>
        fs.existsSync(path.resolve(__dirname, 'public', file)) ? `${q}${toDataUri(file)}${q}` : m)
      return out === code ? null : { code: out, map: null }
    },
    transformIndexHtml(html: string) {
      return html.replace('href="/favicon.svg"', `href="${toDataUri('favicon.svg')}"`)
    },
  }
}

export default mergeConfig(
  base,
  defineConfig({
    plugins: [inlinePublicAssets(), viteSingleFile()],
    build: {
      outDir: 'dist-share',
      emptyOutDir: true,
      assetsInlineLimit: 100_000_000,
      cssCodeSplit: false,
    },
  }),
)
