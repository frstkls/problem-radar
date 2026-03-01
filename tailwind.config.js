/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Manrope", "sans-serif"],
      },
      colors: {
        brand: {
          50: "#FFF7ED",
          100: "#FFEDD5",
          500: "#F97316",
          600: "#E85D24",
          700: "#C2410C",
        },
      },
    },
  },
  plugins: [],
};
