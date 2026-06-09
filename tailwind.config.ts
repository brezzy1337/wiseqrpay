import { type Config } from "tailwindcss";
import { fontFamily } from "tailwindcss/defaultTheme.js";

export default {
  content: ["./src/**/*.tsx"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", ...fontFamily.sans],
        // Loud all-caps display face. Archivo Black is a free OFL stand-in for
        // Wise Sans (proprietary) — used ONLY for big feature headlines.
        display: ['"Archivo Black"', "Inter", ...fontFamily.sans],
      },
      // Wise Design tokens (docs.wise.design/foundations/colour)
      colors: {
        wise: {
          green: "#9FE870", // Bright Green — primary button / accent / text on forest
          forest: "#163300", // Forest Green — dark surfaces, text on green, links
          content: "#0E0F0C", // Content Primary
          secondary: "#454745", // Content Secondary — body text
          tertiary: "#6A6C6A", // Content Tertiary — placeholders / "Optional"
          border: "#868685", // Interactive Secondary — input/checkbox borders
          neutral: "rgba(22,51,0,0.08)", // Background Neutral
          hairline: "rgba(14,15,12,0.12)", // Border Neutral
          negative: "#A8200D", // Sentiment Negative
          positive: "#2F5711", // Sentiment Positive
          warning: "#EDC843", // Sentiment Warning
          // Expressive secondary brights — used in tapestries / accents.
          orange: "#FFC091",
          yellow: "#FFEB69",
          blue: "#A0E1E1",
          pink: "#FFD7EF",
          dark: "#121511", // Base Dark
        },
      },
      // Wise radius scale (docs.wise.design/foundations/radius — desktop).
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
