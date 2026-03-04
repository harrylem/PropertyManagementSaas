/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./public/**/*.html"],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['DM Sans', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      colors: {
        kbg:      '#0c0d12',
        ksurface: '#14161e',
        kcard:    '#191b25',
        kborder:  '#252838',
        kborderl: '#31354a',
        ktext:    '#e4e5eb',
        ksec:     '#868a9e',
        kmut:     '#505470',
        kaccent:  '#4a8df8',
        kaccentd: '#3668c0',
        kgreen:   '#1faa64',
        kyellow:  '#dba010',
        kred:     '#d93548',
        korange:  '#d96a20',
        kpurple:  '#a050f0',
      },
    },
  },
  plugins: [],
}
