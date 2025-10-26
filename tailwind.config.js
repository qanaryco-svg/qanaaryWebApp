module.exports = {
  darkMode: 'class',
  content: [
    './pages/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}'
  ],
  theme: {
    extend: {
      colors: {
        qanari: '#F3ca16', // requested canary yellow
        qanariDark: '#6c7c58' // requested green/earth
      }
    }
  },
  plugins: []
}
