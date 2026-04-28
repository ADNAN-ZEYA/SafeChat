/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        display: ['"Space Grotesk"', 'sans-serif'],
        sans: ['"Plus Jakarta Sans"', 'sans-serif'],
      },
      colors: {
        /* ── Surface Hierarchy (light, warm creams) ── */
        'sc-surface':         '#fcf6ee',
        'sc-surface-dim':     '#dad4c9',
        'sc-container':       '#ede7de',
        'sc-container-low':   '#f6f0e7',
        'sc-container-high':  '#e8e2d8',
        'sc-container-top':   '#e2dcd2',
        'sc-container-floor': '#ffffff',

        /* ── Primary (deep coral → peach) ── */
        'sc-primary':         '#a83206',
        'sc-primary-light':   '#ff784e',
        'sc-on-primary':      '#ffefeb',

        /* ── Secondary (soft peach) ── */
        'sc-secondary':       '#ffc4b3',
        'sc-on-secondary':    '#713723',

        /* ── Tertiary (gold / amber) ── */
        'sc-tertiary':        '#feb64c',
        'sc-on-tertiary':     '#583700',

        /* ── Text ── */
        'sc-text':            '#312e29',
        'sc-text-muted':      '#5e5b55',
        'sc-outline':         '#b1aca5',
      },
      borderRadius: {
        'card': '2rem',
        'xl-card': '3rem',
      },
      boxShadow: {
        'ambient':     '0 4px 40px rgba(49,46,41,.06)',
        'ambient-lg':  '0 8px 60px rgba(49,46,41,.10)',
        'glow-coral':  '0 0 24px rgba(168,50,6,.10)',
      },
    },
  },
  plugins: [],
}