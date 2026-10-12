// One-time fix: two of Liya's "worn" photos were uploaded sideways by the
// original import script (it never called sharp's .rotate(), which is
// required to auto-orient by EXIF — the newer admin upload pipeline doesn't
// have this bug, since the browser decodes EXIF orientation natively).
// Downloads the current (sideways) thumbnail/medium/large for both photos,
// rotates each 90° clockwise, and overwrites them in place — no DB changes
// needed since the paths don't change.
//
// Usage:
//   SUPABASE_ADMIN_PASSWORD=... npx tsx scripts/fix-liya-rotation.ts
//
// Safe to re-run; rotating an already-fixed image a second time would just
// make it sideways again, so this only needs to run once.

import { readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'
import { createClient } from '@supabase/supabase-js'
import type { Database } from '../src/lib/database.types'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '..')

const ADMIN_EMAIL = 'sisoburg@gmail.com'
const ADMIN_PASSWORD = process.env.SUPABASE_ADMIN_PASSWORD
if (!ADMIN_PASSWORD) {
  console.error('Set SUPABASE_ADMIN_PASSWORD in the environment before running this script.')
  process.exit(1)
}

function readEnvLocal(key: string): string {
  const envPath = path.join(ROOT, '.env.local')
  const line = readFileSync(envPath, 'utf-8')
    .split('\n')
    .find((l) => l.startsWith(`${key}=`))
  if (!line) throw new Error(`${key} not found in .env.local`)
  return line.slice(key.length + 1).trim()
}

const SUPABASE_URL = readEnvLocal('VITE_SUPABASE_URL')
const SUPABASE_ANON_KEY = readEnvLocal('VITE_SUPABASE_ANON_KEY')
const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY)

const PATHS = [
  'pieces/liya/2-thumb.webp',
  'pieces/liya/2-medium.webp',
  'pieces/liya/2-large.webp',
  'pieces/liya/3-thumb.webp',
  'pieces/liya/3-medium.webp',
  'pieces/liya/3-large.webp',
]

async function main() {
  const { error: authError } = await supabase.auth.signInWithPassword({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD! })
  if (authError) {
    console.error('Sign-in failed:', authError.message)
    process.exit(1)
  }
  console.log('Signed in as admin.')

  for (const objectPath of PATHS) {
    process.stdout.write(`${objectPath} ... `)
    const { data: blob, error: downloadError } = await supabase.storage.from('media').download(objectPath)
    if (downloadError || !blob) {
      console.log(`FAILED to download: ${downloadError?.message}`)
      continue
    }
    const buffer = Buffer.from(await blob.arrayBuffer())
    const rotated = await sharp(buffer).rotate(90).webp().toBuffer()
    const { error: updateError } = await supabase.storage.from('media').update(objectPath, rotated, { contentType: 'image/webp' })
    if (updateError) {
      console.log(`FAILED to upload: ${updateError.message}`)
      continue
    }
    console.log('fixed.')
  }
}

main()
