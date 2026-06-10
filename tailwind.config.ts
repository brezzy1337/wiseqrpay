import { type Config } from "tailwindcss";
import { fontFamily } from "tailwindcss/defaultTheme.js";

export default {
  content: ["./src/**/*.tsx"],
  theme: {
    extend: {
      fontFamily: {
        // Inter, loaded via next/font/google in src/app/layout.tsx.
        sans: ["var(--font-inter)", "Inter", ...fontFamily.sans],
        // Redesign (2026-06): the display face is Inter Extra Bold, sentence
        // case — Archivo Black is gone. `display` is kept as an alias of the
        // sans stack so legacy `font-display` usage still renders (in Inter)
        // until later slices remove it.
        display: ["var(--font-inter)", "Inter", ...fontFamily.sans],
      },
      // Wise redesign tokens (.claude/rules/wise-design.md — canonical)
      colors: {
        wise: {
          green: "#9FE870", // Action ONLY: primary pills + QR hero/poster card surface
          forest: "#163300", // Text on bright green, links, dark surfaces
          content: "#0E0F0C", // Headings, body, amounts
          secondary: "#454745", // Supporting copy
          tertiary: "#6A6C6A", // Captions, meta, helper text, input labels
          border: "#868685", // Legacy interactive-secondary border (pre-redesign screens)
          neutral: "#EDEFEC", // Surface tint — input fills, cards, numpad keys
          hairline: "#E8EAE6", // 1px list dividers only
          negative: "#A8200D", // Errors only
          "negative-tint": "#F7E5E2", // Error chip/badge background
          positive: "#2F5711", // "Received" status + "Active" chip ONLY. Never buttons.
          "positive-tint": "#E8F1DF", // Positive chip background
          "btn-secondary": "#E9EDE6", // Secondary pill fill (forest text)
          warning: "#EDC843", // Sentiment Warning
          // Expressive secondary brights — used in tapestries / accents.
          orange: "#FFC091",
          yellow: "#FFEB69",
          blue: "#A0E1E1",
          pink: "#FFD7EF",
          dark: "#121511", // Base Dark
        },
      },
      // Legacy wise-* radius names kept so pre-redesign screens still compile.
      // Redesign scale: inputs r12 (rounded-xl), cards r16–24 (rounded-2xl /
      // rounded-3xl), QR hero card r32 (rounded-[32px]).
      borderRadius: {
        "wise-sm": "16px",
        "wise-md": "20px",
        "wise-lg": "30px",
        "wise-xl": "40px",
        "wise-2xl": "60px",
      },
      keyframes: {
        // Staggered load reveal — snappy entrance.
        "fade-up": {
          from: { opacity: "0", transform: "translateY(16px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        // Slow organic drift for tapestry shapes — fluid motion.
        float: {
          "0%, 100%": { transform: "translate(0, 0) rotate(0deg)" },
          "50%": { transform: "translate(2%, -3%) rotate(3deg)" },
        },
        "float-slow": {
          "0%, 100%": { transform: "translate(0, 0) rotate(0deg)" },
          "50%": { transform: "translate(-3%, 2%) rotate(-4deg)" },
        },
        // Satisfying success entrance.
        pop: {
          "0%": { opacity: "0", transform: "scale(0.9)" },
          "60%": { opacity: "1", transform: "scale(1.02)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
      },
      animation: {
        "fade-up": "fade-up 0.5s cubic-bezier(0.22, 1, 0.36, 1) both",
        float: "float 14s ease-in-out infinite",
        "float-slow": "float-slow 20s ease-in-out infinite",
        pop: "pop 0.45s cubic-bezier(0.22, 1, 0.36, 1) both",
      },
    },
  },
  plugins: [],
} satisfies Config;
