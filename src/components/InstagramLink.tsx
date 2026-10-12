import styles from './InstagramLink.module.css'

export function InstagramLink() {
  return (
    <a
      className={styles.link}
      href="https://www.instagram.com/gigo_jewelry/"
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Instagram"
    >
      <svg width="26" height="26" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <defs>
          <linearGradient id="ig-gradient" x1="2" y1="22" x2="22" y2="2" gradientUnits="userSpaceOnUse">
            <stop offset="0" stopColor="#feda75" />
            <stop offset="0.35" stopColor="#d62976" />
            <stop offset="0.7" stopColor="#962fbf" />
            <stop offset="1" stopColor="#4f5bd5" />
          </linearGradient>
        </defs>
        <rect x="3" y="3" width="18" height="18" rx="5" stroke="url(#ig-gradient)" strokeWidth="1.4" />
        <circle cx="12" cy="12" r="4.2" stroke="url(#ig-gradient)" strokeWidth="1.4" />
        <circle cx="17.3" cy="6.7" r="1" fill="url(#ig-gradient)" />
      </svg>
    </a>
  )
}
