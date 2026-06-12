/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#fef6ee",
          100: "#fde9d6",
          200: "#fad0ad",
          300: "#f6af78",
          400: "#f08441",
          500: "#eb641d",
          600: "#dc4c13",
          700: "#b63812",
          800: "#912e16",
          900: "#752815",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};
