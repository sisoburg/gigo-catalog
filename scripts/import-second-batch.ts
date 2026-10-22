// Second import batch: 8 pieces found in the Drive "Organized by piece"
// folder that weren't in the catalog yet — sourced from the user's own
// files:
//   Drive: "תמונות תכשיטים/Organized by piece" (photos)
//   C:\Users\sisob\Downloads\טבלאת הוצאות - תמחור.csv (prices/stones)
//
// (Price updates for the 8 pieces already in the catalog were applied
// directly via SQL, not here — no photo upload needed for those, so no
// admin session was required.)
//
// Photo picks deliberately avoid every .HEIC file: this sharp build lacks
// the HEVC decoder plugin (libde265), so HEIC input fails. Each piece folder
// had enough plain .JPG shots to fill out a gallery without needing HEIC —
// two pieces ended up with 4 photos instead of 5 for the same reason.
// Videos aren't included here: generating a poster frame needs a video
// decoder this environment doesn't have either (no ffmpeg); add them later
// through the admin's own video upload, which captures a poster in-browser.
//
// Usage:
//   SUPABASE_ADMIN_PASSWORD=... npx tsx scripts/import-second-batch.ts

import { existsSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { readFileSync } from 'node:fs'
import sharp from 'sharp'
import { createClient } from '@supabase/supabase-js'
import type { Database } from '../src/lib/database.types'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '..')
const DRIVE_BASE =
  'G:\\.shortcut-targets-by-id\\1q8e6JHf9QJek2yAT9-Z8UPMDWZQc3Jl8\\תמונות תכשיטים\\Organized by piece'

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

type LocalizedText = { en: string; he: string }

interface NewPiece {
  slug: string
  folder: string
  name: LocalizedText
  materials: LocalizedText
  description: LocalizedText
  price: number | null
  photos: { file: string; alt: LocalizedText }[]
}

const NEW_PIECES: NewPiece[] = [
  {
    slug: 'chevron-gemstone-ring',
    folder: '02 Chevron Gemstone Ring - Mazal small',
    name: { en: 'Mazal', he: 'מזל' },
    materials: { en: 'Sterling silver, mixed gemstones', he: 'כסף 925, אבנים מעורבות' },
    description: {
      en: 'A slim chevron ring set with four small, colorful gemstones — a lighter take on the dome ring.',
      he: 'טבעת שברון דקה, משובצת בארבע אבני חן צבעוניות קטנות — גרסה קלילה יותר של טבעת הכיפה.',
    },
    price: 590,
    photos: [
      { file: 'IMG_8217.JPG', alt: { en: 'Chevron gemstone ring, studio', he: 'טבעת שברון משובצת, צילום סטודיו' } },
      { file: 'IMG_8223.JPG', alt: { en: 'Chevron gemstone ring, angle view', he: 'טבעת שברון משובצת, זווית נוספת' } },
      { file: 'IMG_8208.JPG', alt: { en: 'Chevron gemstone ring, close detail', he: 'טבעת שברון משובצת, תקריב' } },
      { file: 'IMG_8215.JPG', alt: { en: 'Chevron gemstone ring, top view', he: 'טבעת שברון משובצת, מבט מלמעלה' } },
      { file: 'IMG_8220.JPG', alt: { en: 'Chevron gemstone ring, side profile', he: 'טבעת שברון משובצת, פרופיל צד' } },
    ],
  },
  {
    slug: 'wavy-band-ring',
    folder: '06 Wavy Band Ring - Jeanine single',
    name: { en: 'Jeanine', he: "ג'נין" },
    materials: { en: 'Sterling silver', he: 'כסף 925' },
    description: {
      en: 'A plain wavy silver band with a soft, organic silhouette — no stones, just the shape.',
      he: 'טבעת כסף גלית פשוטה, בצורה אורגנית ורכה — ללא אבנים, רק הצורה.',
    },
    price: 270,
    photos: [
      { file: 'IMG_8224.JPG', alt: { en: 'Wavy band ring, studio', he: 'טבעת גלית, צילום סטודיו' } },
      { file: 'IMG_8225.JPG', alt: { en: 'Wavy band ring, angle view', he: 'טבעת גלית, זווית נוספת' } },
      { file: 'P1060063.JPG', alt: { en: 'Wavy band ring, close detail', he: 'טבעת גלית, תקריב' } },
      { file: 'P1060070.JPG', alt: { en: 'Wavy band ring, top view', he: 'טבעת גלית, מבט מלמעלה' } },
      { file: 'P1060059.JPG', alt: { en: 'Wavy band ring, side profile', he: 'טבעת גלית, פרופיל צד' } },
    ],
  },
  {
    slug: 'signet-ring-liza',
    folder: '08 Signet Ring - Liza',
    name: { en: 'Liza', he: 'ליזה' },
    materials: { en: 'Sterling silver', he: 'כסף 925' },
    description: {
      en: 'A signet ring with an engraved geometric chevron pattern — bold, flat-topped, unmistakably silver.',
      he: 'טבעת חותם עם תבנית שברון גיאומטרית חרוטה — נועזת, שטוחה מלמעלה, כסף מובהק.',
    },
    price: 850,
    photos: [
      { file: 'IMG_8264.JPG', alt: { en: 'Signet ring, studio', he: 'טבעת חותם, צילום סטודיו' } },
      { file: 'IMG_8272.JPG', alt: { en: 'Signet ring, angle view', he: 'טבעת חותם, זווית נוספת' } },
      { file: 'P1060202.JPG', alt: { en: 'Signet ring, close detail', he: 'טבעת חותם, תקריב' } },
      { file: 'IMG_8267.JPG', alt: { en: 'Signet ring, top view', he: 'טבעת חותם, מבט מלמעלה' } },
      { file: 'P1060195.JPG', alt: { en: 'Signet ring, side profile', he: 'טבעת חותם, פרופיל צד' } },
    ],
  },
  {
    slug: 'ribbed-earrings-red',
    folder: '11 Ribbed Earrings - Red Stones - Bracha',
    name: { en: 'Bracha', he: 'ברכה' },
    materials: { en: 'Sterling silver, garnet accent', he: 'כסף 925, נגיעת אבן גרנט' },
    description: {
      en: 'Wide ribbed silver hoops finished with a single garnet stone — the red-stone sibling of the blue pair.',
      he: 'עגילי חישוק כסף מצולעים ורחבים, עם נגיעת אבן גרנט בקצה — האחות האדומה של הזוג הכחול.',
    },
    price: 290,
    photos: [
      { file: 'IMG_8258.JPG', alt: { en: 'Ribbed earring, worn close on the ear', he: 'עגיל מצולע, תקריב על האוזן' } },
      { file: 'IMG_8256.JPG', alt: { en: 'Ribbed earrings, studio pair', he: 'זוג עגילים מצולעים, צילום סטודיו' } },
      { file: 'IMG_8260.JPG', alt: { en: 'Ribbed earrings, side profile', he: 'עגילים מצולעים, פרופיל צד' } },
      { file: 'IMG_8261.JPG', alt: { en: 'Ribbed earrings, close detail', he: 'עגילים מצולעים, תקריב' } },
      { file: 'IMG_8262.JPG', alt: { en: 'Ribbed earrings, angle view', he: 'עגילים מצולעים, זווית נוספת' } },
    ],
  },
  {
    slug: 'ball-hoop-earrings',
    folder: '14 Ball Hoop Earrings - Tamar',
    name: { en: 'Tamar', he: 'תמר' },
    materials: { en: 'Sterling silver', he: 'כסף 925' },
    description: {
      en: 'A polished silver ball set onto a simple hoop — a clean, rounded everyday earring.',
      he: 'כדור כסף מלוטש על חישוק פשוט — עגיל יומיומי נקי ועגול.',
    },
    price: 290,
    photos: [
      { file: 'IMG_8306.JPG', alt: { en: 'Ball hoop earrings, studio pair', he: 'זוג עגילי כדור, צילום סטודיו' } },
      { file: 'IMG_8317.JPG', alt: { en: 'Ball hoop earrings, close detail', he: 'עגילי כדור, תקריב' } },
      { file: 'P1060161.JPG', alt: { en: 'Ball hoop earrings, angle view', he: 'עגילי כדור, זווית נוספת' } },
      { file: 'IMG_8310.JPG', alt: { en: 'Ball hoop earrings, side profile', he: 'עגילי כדור, פרופיל צד' } },
      { file: 'IMG_8314.JPG', alt: { en: 'Ball hoop earrings, top view', he: 'עגילי כדור, מבט מלמעלה' } },
    ],
  },
  {
    slug: 'silver-ball-necklace',
    folder: '15 Silver Ball Necklace - Tamar',
    name: { en: 'Tamar', he: 'תמר' },
    materials: { en: 'Sterling silver', he: 'כסף 925' },
    description: {
      en: 'A fine silver chain threaded through a single polished ball.',
      he: 'שרשרת כסף דקה עם כדור מלוטש בודד.',
    },
    price: 580,
    photos: [
      { file: 'EE278C31-0920-42F3-ABCF-9057DA35AA08.JPG', alt: { en: 'Silver ball necklace, worn close', he: 'שרשרת כדור כסף, תקריב על הגוף' } },
      { file: 'IMG_8278.JPG', alt: { en: 'Silver ball necklace, studio', he: 'שרשרת כדור כסף, צילום סטודיו' } },
      { file: 'IMG_8279.JPG', alt: { en: 'Silver ball necklace, close detail', he: 'שרשרת כדור כסף, תקריב' } },
      { file: 'IMG_8280.JPG', alt: { en: 'Silver ball necklace, angle view', he: 'שרשרת כדור כסף, זווית נוספת' } },
    ],
  },
  {
    slug: 'disc-pendant-necklace',
    folder: '17 Disc Pendant Necklace - Galya single',
    name: { en: 'Galya', he: 'גליה' },
    materials: { en: 'Sterling silver, pearl', he: 'כסף 925, פנינה' },
    description: {
      en: 'A round silver disc pendant centered on a single pearl, on a fine chain.',
      he: 'תליון עגול דיסקית כסף עם פנינה אחת במרכז, על שרשרת דקה.',
    },
    price: 650,
    photos: [
      { file: 'IMG_8288.JPG', alt: { en: 'Disc pendant necklace, worn close', he: 'תליון דיסקית, תקריב על הגוף' } },
      { file: 'IMG_8289.JPG', alt: { en: 'Disc pendant necklace, studio', he: 'תליון דיסקית, צילום סטודיו' } },
      { file: 'IMG_8290.JPG', alt: { en: 'Disc pendant necklace, close detail', he: 'תליון דיסקית, תקריב' } },
      { file: 'IMG_8291.JPG', alt: { en: 'Disc pendant necklace, angle view', he: 'תליון דיסקית, זווית נוספת' } },
    ],
  },
  {
    // No matching row in the pricing CSV and no model name in the Drive
    // folder — price left unset ("inquire") and named by the piece itself
    // rather than guessing a person's name. Worth a look in admin.
    slug: 'pebble-pendant-necklace',
    folder: '18 Pebble Pendant Necklace',
    name: { en: 'Pebble', he: 'חלוק' },
    materials: { en: 'Sterling silver', he: 'כסף 925' },
    description: {
      en: 'An organic, pebble-shaped silver pendant on a fine chain.',
      he: 'תליון כסף בצורת חלוק אורגני, על שרשרת דקה.',
    },
    price: null,
    photos: [
      { file: '5744D366-2B25-4A5D-8027-7EDA1AEF41F6.JPG', alt: { en: 'Pebble pendant necklace, worn close', he: 'תליון חלוק, תקריב על הגוף' } },
      { file: 'IMG_8298.JPG', alt: { en: 'Pebble pendant necklace, studio', he: 'תליון חלוק, צילום סטודיו' } },
      { file: 'IMG_8296.JPG', alt: { en: 'Pebble pendant necklace, close detail', he: 'תליון חלוק, תקריב' } },
      { file: 'IMG_8297.JPG', alt: { en: 'Pebble pendant necklace, angle view', he: 'תליון חלוק, זווית נוספת' } },
      { file: 'IMG_8299.JPG', alt: { en: 'Pebble pendant necklace, top view', he: 'תליון חלוק, מבט מלמעלה' } },
    ],
  },
]

const SIZES = { thumbnail: 480, medium: 900, large: 1600 } as const

async function toWebp(srcPath: string, maxWidth: number): Promise<Buffer> {
  return sharp(srcPath)
    .rotate() // auto-orient by EXIF — the first import batch skipped this and produced sideways photos
    .resize({ width: maxWidth, withoutEnlargement: true })
    .webp({ quality: 82 })
    .toBuffer()
}

async function upload(storagePath: string, body: Buffer, contentType: string) {
  const { error } = await supabase.storage.from('media').upload(storagePath, body, { contentType, cacheControl: '31536000' })
  if (error) throw new Error(`upload ${storagePath}: ${error.message}`)
  return storagePath
}

async function main() {
  console.log(`Signing in as ${ADMIN_EMAIL}...`)
  const { error: authError } = await supabase.auth.signInWithPassword({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD! })
  if (authError) throw new Error(`Sign-in failed: ${authError.message}`)
  console.log('Signed in.\n')

  const { data: existing } = await supabase.from('pieces').select('sort_order').order('sort_order', { ascending: false }).limit(1)
  let nextSortOrder = (existing?.[0]?.sort_order ?? -1) + 1

  for (const piece of NEW_PIECES) {
    console.log(`\n--- ${piece.name.en} / ${piece.folder} ---`)
    const folderPath = path.join(DRIVE_BASE, piece.folder)
    if (!existsSync(folderPath)) throw new Error(`missing folder: ${folderPath}`)

    const { data: pieceRow, error: pieceError } = await supabase
      .from('pieces')
      .upsert(
        {
          slug: piece.slug,
          name_en: piece.name.en,
          name_he: piece.name.he,
          materials_en: piece.materials.en,
          materials_he: piece.materials.he,
          description_en: piece.description.en,
          description_he: piece.description.he,
          price: piece.price,
          is_draft: false,
          sort_order: nextSortOrder++,
        },
        { onConflict: 'slug' },
      )
      .select('id')
      .single()
    if (pieceError) throw new Error(`upsert piece ${piece.slug}: ${pieceError.message}`)
    const pieceId = pieceRow.id

    const { error: deleteError } = await supabase.from('media').delete().eq('piece_id', pieceId)
    if (deleteError) throw new Error(`clear media for ${piece.slug}: ${deleteError.message}`)

    for (const [i, photo] of piece.photos.entries()) {
      const srcPath = path.join(folderPath, photo.file)
      if (!existsSync(srcPath)) throw new Error(`missing file: ${srcPath}`)
      const base = `pieces/${piece.slug}/${i + 1}`
      const [thumb, medium, large] = await Promise.all([
        toWebp(srcPath, SIZES.thumbnail),
        toWebp(srcPath, SIZES.medium),
        toWebp(srcPath, SIZES.large),
      ])
      const [pThumb, pMedium, pLarge] = await Promise.all([
        upload(`${base}-thumb.webp`, thumb, 'image/webp'),
        upload(`${base}-medium.webp`, medium, 'image/webp'),
        upload(`${base}-large.webp`, large, 'image/webp'),
      ])
      const { error } = await supabase.from('media').insert({
        piece_id: pieceId,
        kind: 'photo',
        path_thumbnail: pThumb,
        path_medium: pMedium,
        path_large: pLarge,
        alt_en: photo.alt.en,
        alt_he: photo.alt.he,
        sort_order: i,
        is_cover: i === 0,
      })
      if (error) throw new Error(`insert media for ${piece.slug} #${i}: ${error.message}`)
      console.log(`  photo ${i + 1}/${piece.photos.length} uploaded`)
    }
  }

  console.log('\nDone.')
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
