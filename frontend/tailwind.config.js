/** @type {import('tailwindcss').Config} */

// Neutrales como variables CSS para soportar tema claro/oscuro: los valores
// se invierten bajo `.dark` (ver index.css) sin tocar las clases existentes.
const withVar = (name) => `rgb(var(${name}) / <alpha-value>)`;

export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        // Superficie de página y de tarjetas (tematizables).
        surface: withVar("--color-surface"),
        card: withVar("--color-card"),
        // Sidebar siempre oscuro: mismo tono que la superficie en modo oscuro
        // (rgb 15 17 21), no negro puro, para coherencia visual entre temas.
        sidebar: "rgb(15 17 21 / <alpha-value>)",
        // Escala neutral tematizable (texto en tonos altos, superficies en bajos).
        gray: {
          50: withVar("--color-gray-50"),
          100: withVar("--color-gray-100"),
          200: withVar("--color-gray-200"),
          300: withVar("--color-gray-300"),
          400: withVar("--color-gray-400"),
          500: withVar("--color-gray-500"),
          600: withVar("--color-gray-600"),
          700: withVar("--color-gray-700"),
          800: withVar("--color-gray-800"),
          900: withVar("--color-gray-900"),
        },
        // Acento institucional CAS. Es el ÚNICO color de acento: CTAs, estado
        // activo, barras de progreso, enlaces. Anclado en 600 = #DE0613.
        brand: {
          50: "#fef2f2",
          100: "#fee2e2",
          200: "#fecaca",
          300: "#fca5a5",
          400: "#f4555c",
          500: "#ee1f2a",
          600: "#de0613",
          700: "#b80510",
          800: "#94060f",
          900: "#7a0a11",
        },
        // Oro de logro. Uso restringido: certificados, estrellas de rating y
        // estados de logro (100% completado). Nunca decoración general de UI.
        gold: {
          50: "#fdf6ec",
          100: "#fae9cc",
          200: "#f4d293",
          300: "#efbc5e",
          400: "#f0a93e",
          500: "#ec9a29",
          600: "#d4831a",
          700: "#a9651a",
          800: "#864f18",
          900: "#6e4117",
        },
      },
      fontFamily: {
        sans: ['"Inter Variable"', "Inter", "system-ui", "sans-serif"],
      },
      boxShadow: {
        // Tarjetas: borde 1px + sombra muy sutil (no sombras flotantes).
        card: "0 1px 3px rgba(0, 0, 0, 0.08)",
        // Escala de elevación para dar profundidad sin perder el tono institucional.
        soft: "0 1px 2px rgba(16, 24, 40, 0.06), 0 1px 3px rgba(16, 24, 40, 0.1)",
        elevated: "0 4px 12px rgba(16, 24, 40, 0.08)",
        dropdown: "0 8px 24px rgba(16, 24, 40, 0.12)",
      },
      letterSpacing: {
        tightish: "-0.01em",
      },
    },
  },
  plugins: [],
};
