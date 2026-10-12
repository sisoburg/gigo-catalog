import type { Piece } from './types'

// Stage 1 placeholder content — hardcoded straight from the Drive folders,
// pending real copy from admin. Every piece below has isMock: true for that
// reason; nothing here should be read as the real product text.

import domeCover from '../assets/pieces/gemstone-dome-ring/1.jpg'
import dome2 from '../assets/pieces/gemstone-dome-ring/2.jpg'
import dome3 from '../assets/pieces/gemstone-dome-ring/3.jpg'
import dome4 from '../assets/pieces/gemstone-dome-ring/4.jpg'
import dome5 from '../assets/pieces/gemstone-dome-ring/5.jpg'

import earCover from '../assets/pieces/ribbed-earrings-wide-blue/1.jpg'
import ear2 from '../assets/pieces/ribbed-earrings-wide-blue/2.jpg'
import ear3 from '../assets/pieces/ribbed-earrings-wide-blue/3.jpg'
import ear4 from '../assets/pieces/ribbed-earrings-wide-blue/4.jpg'
import ear5 from '../assets/pieces/ribbed-earrings-wide-blue/5.jpg'
import earVideo from '../assets/pieces/ribbed-earrings-wide-blue/video.mp4'
import earVideoPoster from '../assets/pieces/ribbed-earrings-wide-blue/video-poster.jpg'

import chokerCover from '../assets/pieces/green-stone-choker/1.jpg'
import choker2 from '../assets/pieces/green-stone-choker/2.jpg'
import choker3 from '../assets/pieces/green-stone-choker/3.jpg'
import choker4 from '../assets/pieces/green-stone-choker/4.jpg'

import flowerCover from '../assets/pieces/cutout-flower-ring/1.jpg'
import flower2 from '../assets/pieces/cutout-flower-ring/2.jpg'
import flower3 from '../assets/pieces/cutout-flower-ring/3.jpg'
import flower4 from '../assets/pieces/cutout-flower-ring/4.jpg'
import flower5 from '../assets/pieces/cutout-flower-ring/5.jpg'

export const mockPieces: Piece[] = [
  {
    slug: 'gemstone-dome-ring',
    isMock: true,
    name: { en: 'Gemstone Dome Ring', he: 'טבעת כיפה משובצת אבנים' },
    materials: { en: 'Sterling silver, mixed gemstones', he: 'כסף 925, אבנים מעורבות' },
    description: {
      en: 'A softly domed silver ring scattered with small, colorful gemstones.',
      he: 'טבעת כסף כיפתית ורכה, משובצת באבנים צבעוניות קטנות.',
    },
    cover: { kind: 'photo', src: domeCover, alt: { en: 'Gemstone dome ring, worn', he: 'טבעת כיפה משובצת אבנים, על היד' } },
    gallery: [
      { kind: 'photo', src: domeCover, alt: { en: 'Gemstone dome ring, worn', he: 'טבעת כיפה משובצת אבנים, על היד' } },
      { kind: 'photo', src: dome2, alt: { en: 'Gemstone dome ring, worn on two fingers', he: 'טבעת כיפה, על שתי אצבעות' } },
      { kind: 'photo', src: dome3, alt: { en: 'Gemstone dome ring, studio', he: 'טבעת כיפה, צילום סטודיו' } },
      { kind: 'photo', src: dome4, alt: { en: 'Gemstone dome ring, angle view', he: 'טבעת כיפה, זווית נוספת' } },
      { kind: 'photo', src: dome5, alt: { en: 'Gemstone dome ring, close detail', he: 'טבעת כיפה, תקריב' } },
    ],
  },
  {
    slug: 'ribbed-earrings-wide-blue',
    isMock: true,
    name: { en: 'Wide Ribbed Earrings, Blue Stone', he: 'עגילים מצולעים רחבים, אבן כחולה' },
    materials: { en: 'Sterling silver, blue stone accent', he: 'כסף 925, נגיעת אבן כחולה' },
    description: {
      en: 'Wide ribbed silver hoops finished with a single blue stone.',
      he: 'עגילי חישוק כסף מצולעים ורחבים, עם נגיעת אבן כחולה בקצה.',
    },
    cover: { kind: 'photo', src: earCover, alt: { en: 'Ribbed earring, worn close on the ear', he: 'עגיל מצולע, תקריב על האוזן' } },
    gallery: [
      { kind: 'photo', src: earCover, alt: { en: 'Ribbed earring, worn close on the ear', he: 'עגיל מצולע, תקריב על האוזן' } },
      {
        kind: 'video',
        src: earVideo,
        poster: earVideoPoster,
        alt: { en: 'Ribbed earring and necklace, worn, turning', he: 'עגיל מצולע ושרשרת, על הגוף, בתנועה' },
      },
      { kind: 'photo', src: ear2, alt: { en: 'Ribbed earring, worn on the ear', he: 'עגיל מצולע, על האוזן' } },
      { kind: 'photo', src: ear3, alt: { en: 'Ribbed earrings, studio pair', he: 'זוג עגילים מצולעים, צילום סטודיו' } },
      { kind: 'photo', src: ear4, alt: { en: 'Ribbed earrings, side profile', he: 'עגילים מצולעים, פרופיל צד' } },
      { kind: 'photo', src: ear5, alt: { en: 'Ribbed earrings, styled shot', he: 'עגילים מצולעים, צילום סטיילינג' } },
    ],
  },
  {
    slug: 'green-stone-choker',
    isMock: true,
    name: { en: 'Green Stone Choker', he: "צ'וקר אבן ירוקה" },
    materials: { en: 'Sterling silver, green gemstone', he: 'כסף 925, אבן ירוקה' },
    description: {
      en: 'A double-strand silver chain with a single green gemstone drop.',
      he: 'שרשרת כסף כפולה עם תליון אבן ירוקה בודד.',
    },
    cover: { kind: 'photo', src: chokerCover, alt: { en: 'Green stone choker, worn', he: "צ'וקר אבן ירוקה, על הצוואר" } },
    gallery: [
      { kind: 'photo', src: chokerCover, alt: { en: 'Green stone choker, worn', he: "צ'וקר אבן ירוקה, על הצוואר" } },
      { kind: 'photo', src: choker2, alt: { en: 'Green stone choker, worn close', he: "צ'וקר אבן ירוקה, תקריב" } },
      { kind: 'photo', src: choker3, alt: { en: 'Green stone choker, studio', he: "צ'וקר אבן ירוקה, צילום סטודיו" } },
      { kind: 'photo', src: choker4, alt: { en: 'Green stone choker, detail', he: "צ'וקר אבן ירוקה, תקריב פרט" } },
    ],
  },
  {
    slug: 'cutout-flower-ring',
    isMock: true,
    name: { en: 'Cutout Flower Ring', he: 'טבעת פרח חתוכה' },
    materials: { en: 'Sterling silver, gemstone accent', he: 'כסף 925, נגיעת אבן חן' },
    description: {
      en: 'An open floral silhouette ring with a petal of colored stone.',
      he: 'טבעת בעיצוב פרח פתוח, עם עלה כותרת מאבן צבעונית.',
    },
    cover: { kind: 'photo', src: flowerCover, alt: { en: 'Cutout flower ring, worn on shoulder', he: 'טבעת פרח חתוכה, על הכתף' } },
    gallery: [
      { kind: 'photo', src: flowerCover, alt: { en: 'Cutout flower ring, worn on shoulder', he: 'טבעת פרח חתוכה, על הכתף' } },
      { kind: 'photo', src: flower2, alt: { en: 'Cutout flower ring, worn close', he: 'טבעת פרח חתוכה, תקריב' } },
      { kind: 'photo', src: flower3, alt: { en: 'Cutout flower ring, studio', he: 'טבעת פרח חתוכה, צילום סטודיו' } },
      { kind: 'photo', src: flower4, alt: { en: 'Cutout flower ring, angle view', he: 'טבעת פרח חתוכה, זווית נוספת' } },
      { kind: 'photo', src: flower5, alt: { en: 'Cutout flower ring, close detail', he: 'טבעת פרח חתוכה, תקריב פרט' } },
    ],
  },
]
