import { defineConfig } from 'vite'
import path from 'path'
import fs from 'fs'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'

const DB_PREFIX = '/api/db/'

function dbApiPlugin() {
  const dbDir = path.resolve(__dirname, 'database')
  return {
    name: 'db-api',
    configureServer(server: any) {
      fs.mkdirSync(dbDir, { recursive: true })
      server.watcher.add(path.join(dbDir, '*.json'))
      server.watcher.on('change', (filePath: string) => {
        if (filePath.startsWith(dbDir) && filePath.endsWith('.json')) {
          const collection = path.basename(filePath, '.json')
          server.ws.send({ type: 'custom', event: 'db-update', data: { collection } })
        }
      })
      server.middlewares.use((req: any, res: any, next: any) => {
        const url: string = req.url ?? ''
        if (!url.startsWith(DB_PREFIX)) { next(); return }
        const rest = url.slice(DB_PREFIX.length)
        const collection = rest.split(/[/?#]/)[0]
        if (!collection || !/^[a-z_]+$/.test(collection)) {
          res.statusCode = 400
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify({ error: 'Invalid collection name' }))
          return
        }
        const filePath = path.join(dbDir, `${collection}.json`)
        res.setHeader('Content-Type', 'application/json')
        res.setHeader('Access-Control-Allow-Origin', '*')
        if (req.method === 'GET') {
          if (!fs.existsSync(filePath)) {
            res.statusCode = 404
            res.end(JSON.stringify({ error: `Collection "${collection}" not found` }))
            return
          }
          res.statusCode = 200
          res.end(fs.readFileSync(filePath, 'utf-8'))
        } else if (req.method === 'POST') {
          const chunks: Buffer[] = []
          req.on('data', (chunk: Buffer) => chunks.push(chunk))
          req.on('end', () => {
            const body = Buffer.concat(chunks).toString('utf-8')
            let parsed: unknown
            try { parsed = JSON.parse(body) } catch {
              res.statusCode = 400
              res.end(JSON.stringify({ error: 'Invalid JSON body' }))
              return
            }
            fs.writeFileSync(filePath, JSON.stringify(parsed, null, 2), 'utf-8')
            res.statusCode = 200
            res.end(JSON.stringify({ ok: true }))
            server.ws.send({ type: 'custom', event: 'db-update', data: { collection } })
          })
        } else {
          res.statusCode = 405
          res.end(JSON.stringify({ error: 'Method not allowed' }))
        }
      })
    },
  }
}


function figmaAssetResolver() {
  return {
    name: 'figma-asset-resolver',
    resolveId(id) {
      if (id.startsWith('figma:asset/')) {
        const filename = id.replace('figma:asset/', '')
        return path.resolve(__dirname, 'src/assets', filename)
      }
    },
  }
}

export default defineConfig({
  plugins: [
    figmaAssetResolver(),
    // The React and Tailwind plugins are both required for Make, even if
    // Tailwind is not being actively used – do not remove them
    react(),
    tailwindcss(),
    dbApiPlugin(),
  ],
  resolve: {
    alias: {
      // Alias @ to the src directory
      '@': path.resolve(__dirname, './src'),
    },
  },

  // File types to support raw imports. Never add .css, .tsx, or .ts files to this.
  assetsInclude: ['**/*.svg', '**/*.csv'],
})
