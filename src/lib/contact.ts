export const WHATSAPP_NUMBERS = {
  noam: '972545555656',
  ayala: '972528888981',
}

const DEFAULT_MESSAGE = {
  he: 'היי! מתעניינ/ת בתכשיט מ-GIGO',
  en: "Hi! I'm interested in a piece from Gigo",
}

export function whatsappHref(number: string, locale: 'en' | 'he', message: string = DEFAULT_MESSAGE[locale]) {
  return `https://wa.me/${number}?text=${encodeURIComponent(message)}`
}
