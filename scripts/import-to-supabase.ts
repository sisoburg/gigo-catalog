// One-time import: uploads the mock-data photos/video into Supabase Storage
// and inserts the matching pieces/media rows. Safe to re-run — pieces are
// upserted by slug, and each run replaces that piece's media rows.
//
// Already run successfully once (all 7 pieces live in Supabase). Its source
// images under src/assets/pieces/ were deleted afterward since the app now
// reads from Storage, not the bundle — re-running this script as-is will
// fail until those folders are restored from the Drive export again.
//
// Usage:
//   SUPABASE_ADMIN_PASSWORD=... npx tsx scripts/import-to-supabase.ts
//
// Reads SUPABASE_URL / SUPABASE_ANON_KEY from .env.local (same values the
// app uses) and signs in as the admin account to satisfy RLS — no service
// key involved. (Root cause of the earlier RLS failures: passing
// `upsert: true` to storage.upload() on a brand-new object — removed below.)

import { readFileSync, existsSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'
import { createClient } from '@supabase/supabase-js'
import type { Database } from '../src/lib/database.types'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '..')
const ASSETS = path.join(ROOT, 'src/assets/pieces')

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
type GalleryItem =
  | { kind: 'photo'; file: string; alt: LocalizedText }
  | { kind: 'video'; file: string; poster: string; alt: LocalizedText }

interface PieceInput {
  slug: string
  folder: string
  name: LocalizedText
  materials: LocalizedText
  description: LocalizedText
  gallery: GalleryItem[]
}

// Mirrors src/data/mockPieces.ts exactly (that file will be retired once the
// app reads from Supabase — see Home.tsx / PieceDetail.tsx after this runs).
const PIECES: PieceInput[] = [
  {
    slug: 'gemstone-dome-ring',
    folder: 'gemstone-dome-ring',
    name: { en: 'Mazal', he: 'מזל' },
    materials: { en: 'Sterling silver, mixed gemstones', he: 'כסף 925, אבנים מעורבות' },
    description: {
      en: 'A softly domed silver ring scattered with small, colorful gemstones.',
      he: 'טבעת כסף כיפתית ורכה, משובצת באבנים צבעוניות קטנות.',
    },
    gallery: [
      { kind: 'photo', file: '1.jpg', alt: { en: 'Gemstone dome ring, worn', he: 'טבעת כיפה משובצת אבנים, על היד' } },
      { kind: 'photo', file: '2.jpg', alt: { en: 'Gemstone dome ring, worn on two fingers', he: 'טבעת כיפה, על שתי אצבעות' } },
      { kind: 'photo', file: '3.jpg', alt: { en: 'Gemstone dome ring, studio', he: 'טבעת כיפה, צילום סטודיו' } },
      { kind: 'photo', file: '4.jpg', alt: { en: 'Gemstone dome ring, angle view', he: 'טבעת כיפה, זווית נוספת' } },
      { kind: 'photo', file: '5.jpg', alt: { en: 'Gemstone dome ring, close detail', he: 'טבעת כיפה, תקריב' } },
    ],
  },
  {
    slug: 'ribbed-earrings-wide-blue',
    folder: 'ribbed-earrings-wide-blue',
    name: { en: 'Bracha', he: 'ברכה' },
    materials: { en: 'Sterling silver, blue stone accent', he: 'כסף 925, נגיעת אבן כחולה' },
    description: {
      en: 'Wide ribbed silver hoops finished with a single blue stone.',
      he: 'עגילי חישוק כסף מצולעים ורחבים, עם נגיעת אבן כחולה בקצה.',
    },
    gallery: [
      { kind: 'photo', file: '1.jpg', alt: { en: 'Ribbed earring, worn close on the ear', he: 'עגיל מצולע, תקריב על האוזן' } },
      {
        kind: 'video',
        file: 'video.mp4',
        poster: 'video-poster.jpg',
        alt: { en: 'Ribbed earring and necklace, worn, turning', he: 'עגיל מצולע ושרשרת, על הגוף, בתנועה' },
      },
      { kind: 'photo', file: '2.jpg', alt: { en: 'Ribbed earring, worn on the ear', he: 'עגיל מצולע, על האוזן' } },
      { kind: 'photo', file: '3.jpg', alt: { en: 'Ribbed earrings, studio pair', he: 'זוג עגילים מצולעים, צילום סטודיו' } },
      { kind: 'photo', file: '4.jpg', alt: { en: 'Ribbed earrings, side profile', he: 'עגילים מצולעים, פרופיל צד' } },
      { kind: 'photo', file: '5.jpg', alt: { en: 'Ribbed earrings, styled shot', he: 'עגילים מצולעים, צילום סטיילינג' } },
    ],
  },
  {
    slug: 'green-stone-choker',
    folder: 'green-stone-choker',
    name: { en: 'Galya', he: 'גליה' },
    materials: { en: 'Sterling silver, green gemstone', he: 'כסף 925, אבן ירוקה' },
    description: {
      en: 'A double-strand silver chain with a single green gemstone drop.',
      he: 'שרשרת כסף כפולה עם תליון אבן ירוקה בודד.',
    },
    gallery: [
      { kind: 'photo', file: '1.jpg', alt: { en: 'Green stone choker, worn', he: "צ'וקר אבן ירוקה, על הצוואר" } },
      { kind: 'photo', file: '2.jpg', alt: { en: 'Green stone choker, worn close', he: "צ'וקר אבן ירוקה, תקריב" } },
      { kind: 'photo', file: '3.jpg', alt: { en: 'Green stone choker, studio', he: "צ'וקר אבן ירוקה, צילום סטודיו" } },
      { kind: 'photo', file: '4.jpg', alt: { en: 'Green stone choker, detail', he: "צ'וקר אבן ירוקה, תקריב פרט" } },
    ],
  },
  {
    slug: 'cutout-flower-ring',
    folder: 'cutout-flower-ring',
    name: { en: 'Jeanine', he: "ג'נין" },
    materials: { en: 'Sterling silver, gemstone accent', he: 'כסף 925, נגיעת אבן חן' },
    description: {
      en: 'An open floral silhouette ring with a petal of colored stone.',
      he: 'טבעת בעיצוב פרח פתוח, עם עלה כותרת מאבן צבעונית.',
    },
    gallery: [
      { kind: 'photo', file: '1.jpg', alt: { en: 'Cutout flower ring, worn on shoulder', he: 'טבעת פרח חתוכה, על הכתף' } },
      { kind: 'photo', file: '2.jpg', alt: { en: 'Cutout flower ring, worn close', he: 'טבעת פרח חתוכה, תקריב' } },
      { kind: 'photo', file: '3.jpg', alt: { en: 'Cutout flower ring, studio', he: 'טבעת פרח חתוכה, צילום סטודיו' } },
      { kind: 'photo', file: '4.jpg', alt: { en: 'Cutout flower ring, angle view', he: 'טבעת פרח חתוכה, זווית נוספת' } },
      { kind: 'photo', file: '5.jpg', alt: { en: 'Cutout flower ring, close detail', he: 'טבעת פרח חתוכה, תקריב פרט' } },
    ],
  },
  {
    slug: 'chaya',
    folder: 'chaya',
    name: { en: 'Chaya', he: 'חיה' },
    materials: { en: 'Sterling silver, multi-color gemstones', he: 'כסף 925, אבני חן רב-גוניות' },
    description: {
      en: 'A slender silver band set with four colorful gemstones in a row.',
      he: 'טבעת כסף דקה משובצת בארבע אבני חן צבעוניות בשורה.',
    },
    gallery: [
      { kind: 'photo', file: '1.jpg', alt: { en: 'Multi-stone band ring, studio', he: 'טבעת רב-אבנים, צילום סטודיו' } },
      { kind: 'photo', file: '2.jpg', alt: { en: 'Multi-stone band ring, angle view', he: 'טבעת רב-אבנים, זווית נוספת' } },
      { kind: 'photo', file: '3.jpg', alt: { en: 'Multi-stone band ring, on a box', he: 'טבעת רב-אבנים, על קופסה' } },
      { kind: 'photo', file: '4.jpg', alt: { en: 'Multi-stone band ring, close detail', he: 'טבעת רב-אבנים, תקריב' } },
      { kind: 'photo', file: '5.jpg', alt: { en: 'Multi-stone band ring, top view', he: 'טבעת רב-אבנים, מבט מלמעלה' } },
    ],
  },
  {
    slug: 'liya',
    folder: 'liya',
    name: { en: 'Liya', he: 'ליה' },
    materials: { en: 'Sterling silver, drop beads', he: 'כסף 925, חרוזי תליון' },
    description: {
      en: 'A fine silver chain ending in two graduated drop beads.',
      he: 'שרשרת כסף דקה המסתיימת בשני חרוזי תליון מדורגים.',
    },
    gallery: [
      { kind: 'photo', file: '1.jpg', alt: { en: 'Drop bead necklace, worn close', he: 'שרשרת חרוזים, תקריב על הגוף' } },
      { kind: 'photo', file: '2.jpg', alt: { en: 'Drop bead necklace, worn', he: 'שרשרת חרוזים, על הגוף' } },
      { kind: 'photo', file: '3.jpg', alt: { en: 'Drop bead necklace, worn in sunlight', he: 'שרשרת חרוזים, באור שמש' } },
      { kind: 'photo', file: '4.jpg', alt: { en: 'Drop bead necklace, studio', he: 'שרשרת חרוזים, צילום סטודיו' } },
      { kind: 'photo', file: '5.jpg', alt: { en: 'Drop bead necklace, styled shot', he: 'שרשרת חרוזים, צילום סטיילינג' } },
    ],
  },
  {
    slug: 'hadasa',
    folder: 'hadasa',
    name: { en: 'Hadasa', he: 'הדסה' },
    materials: { en: 'Sterling silver', he: 'כסף 925' },
    description: {
      en: 'A double-link ring with a simple, sculptural silver band.',
      he: 'טבעת כסף פיסולית עם חישוק כפול פשוט.',
    },
    gallery: [
      { kind: 'photo', file: '1.jpg', alt: { en: 'Link ring, worn close', he: 'טבעת חוליות, תקריב על הגוף' } },
      { kind: 'photo', file: '2.jpg', alt: { en: 'Link ring, studio', he: 'טבעת חוליות, צילום סטודיו' } },
      { kind: 'photo', file: '3.jpg', alt: { en: 'Link ring, studio angle', he: 'טבעת חוליות, זווית סטודיו' } },
      { kind: 'photo', file: '4.jpg', alt: { en: 'Link ring, overhead view', he: 'טבעת חוליות, מבט מלמעלה' } },
    ],
  },
]

// The current hero: Jeanine's cover photo, uploaded at a larger size.
const HERO = { slug: 'cutout-flower-ring', file: '1.jpg' }

const SIZES = { thumbnail: 480, medium: 900, large: 1600, hero: 2400 } as const

async function toWebp(srcPath: string, maxWidth: number): Promise<Buffer> {
  return sharp(srcPath)
    .resize({ width: maxWidth, withoutEnlargement: true })
    .webp({ quality: 82 })
    .toBuffer()
}

async function upload(storagePath: string, body: Buffer | Uint8Array, contentType: string) {
  const { error } = await supabase.storage.from('media').upload(storagePath, body, {
    contentType,
  })
  if (error) {
    console.error('Full upload error object:', JSON.stringify(error, null, 2))
    throw new Error(`upload ${storagePath}: ${error.message}`)
  }
  return storagePath
}

function decodeJwt(token: string): Record<string, unknown> {
  const payload = token.split('.')[1]
  return JSON.parse(Buffer.from(payload, 'base64url').toString('utf-8'))
}

async function main() {
  console.log(`Signing in as ${ADMIN_EMAIL}...`)
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email: ADMIN_EMAIL,
    password: ADMIN_PASSWORD!,
  })
  if (authError) throw new Error(`Sign-in failed: ${authError.message}`)
  console.log('Signed in.')

  const token = authData.session?.access_token
  if (token) {
    const claims = decodeJwt(token)
    console.log('Session JWT claims:', JSON.stringify({ role: claims.role, aud: claims.aud, sub: claims.sub, iss: claims.iss }, null, 2))
  }

  // Prove the session actually carries write access before touching storage.
  const probe = await supabase.from('pieces').select('id').limit(1)
  console.log('DB read probe (should succeed, RLS allows authenticated full access):', probe.error ? probe.error.message : 'ok')
  const writeProbe = await supabase.from('site_settings').update({ hero_kind: 'photo' }).eq('id', true).select()
  console.log('DB write probe (should succeed under admin RLS policy):', writeProbe.error ? writeProbe.error.message : 'ok')
  console.log()

  for (const [pieceIndex, piece] of PIECES.entries()) {
    console.log(`--- ${piece.name.en} (${piece.slug}) ---`)
    const folderPath = path.join(ASSETS, piece.folder)

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
          is_draft: false,
          sort_order: pieceIndex,
        },
        { onConflict: 'slug' },
      )
      .select('id')
      .single()
    if (pieceError) throw new Error(`upsert piece ${piece.slug}: ${pieceError.message}`)
    const pieceId = pieceRow.id

    // Re-running should replace this piece's media, not accumulate duplicates.
    const { error: deleteError } = await supabase.from('media').delete().eq('piece_id', pieceId)
    if (deleteError) throw new Error(`clear media for ${piece.slug}: ${deleteError.message}`)

    for (const [i, item] of piece.gallery.entries()) {
      const isCover = i === 0
      if (item.kind === 'photo') {
        const srcPath = path.join(folderPath, item.file)
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
          alt_en: item.alt.en,
          alt_he: item.alt.he,
          sort_order: i,
          is_cover: isCover,
        })
        if (error) throw new Error(`insert media for ${piece.slug} #${i}: ${error.message}`)
        console.log(`  photo ${i + 1}/${piece.gallery.length} uploaded`)
      } else {
        const videoSrc = path.join(folderPath, item.file)
        const posterSrc = path.join(folderPath, item.poster)
        if (!existsSync(videoSrc)) throw new Error(`missing file: ${videoSrc}`)
        const base = `pieces/${piece.slug}/${i + 1}`
        const videoBuf = readFileSync(videoSrc)
        const posterBuf = await toWebp(posterSrc, SIZES.medium)
        const pVideo = await upload(`${base}-video.mp4`, videoBuf, 'video/mp4')
        const pPoster = await upload(`${base}-poster.webp`, posterBuf, 'image/webp')
        const { error } = await supabase.from('media').insert({
          piece_id: pieceId,
          kind: 'video',
          path_video: pVideo,
          path_poster: pPoster,
          alt_en: item.alt.en,
          alt_he: item.alt.he,
          sort_order: i,
          is_cover: isCover,
        })
        if (error) throw new Error(`insert media for ${piece.slug} #${i}: ${error.message}`)
        console.log(`  video ${i + 1}/${piece.gallery.length} uploaded`)
      }
    }
  }

  console.log('\n--- hero ---')
  const heroSrc = path.join(ASSETS, HERO.slug, HERO.file)
  const heroBuf = await toWebp(heroSrc, SIZES.hero)
  const heroPath = await upload('site/hero.webp', heroBuf, 'image/webp')
  const { error: heroError } = await supabase
    .from('site_settings')
    .update({ hero_kind: 'photo', hero_path_image: heroPath, hero_path_video: null, hero_path_poster: null })
    .eq('id', true)
  if (heroError) throw new Error(`update hero: ${heroError.message}`)
  console.log('hero uploaded')

  console.log('\nDone.')
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
