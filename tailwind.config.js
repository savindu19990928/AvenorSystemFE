export default {
  content: [
  './index.html',
  './src/**/*.{js,ts,jsx,tsx}'
],
  theme: {
    extend: {
      colors: {
        canvas: '#f5f5f2',
        surface: '#ffffff',
        ink: { DEFAULT: '#16181d', soft: '#23262d' },
        muted: '#5b616c',
        faint: '#8a8f99',
        line: { DEFAULT: '#e4e4de', strong: '#d2d2ca' },
        accent: { DEFAULT: '#1f6f5c', strong: '#175746', soft: '#e3f0ec' },
        premium: { DEFAULT: '#8a5a14', soft: '#f6ecdc' },
        standard: { DEFAULT: '#35557f', soft: '#e6edf6' },
        ok: { DEFAULT: '#1f7a4d', soft: '#e5f4ec' },
        warn: { DEFAULT: '#9a5a06', soft: '#fcf1de' },
        danger: { DEFAULT: '#b42318', soft: '#fdecea' },
        info: { DEFAULT: '#2c5ea8', soft: '#e7eefa' },
      },
      boxShadow: {
        pop: '0 12px 32px -8px rgba(22,24,29,0.18), 0 2px 6px rgba(22,24,29,0.06)',
      },
    },
  },
};
