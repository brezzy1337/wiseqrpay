import { type Config } from "tailwindcss";
import { fontFamily } from "tailwindcss/defaultTheme.js";

export default {
  content: ["./src/**/*.tsx"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", "var(--font-geist-sans)", ...fontFamily.sans],
      },
      // Wise Design tokens (docs.wise.design/foundations/colour)
      colors: {
        wise: {
          green: "#9FE870", // Bright Green — primary button / accent
          forest: "#163300", // Forest Green — text on green, links, dark surfaces
          content: "#0E0F0C", // Content Primary
          secondary: "#454745", // Content Secondary — body text
          tertiary: "#6A6C6A", // Content Tertiary — placeholders / "Optional"
          border: "#868685", // Interactive Secondary — input/checkbox borders
          neutral: "rgba(22,51,0,0.08)", // Background Neutral
          hairline: "rgba(14,15,12,0.12)", // Border Neutral
          negative: "#A8200D", // Sentiment Negative
        },
      },
    },
  },
  plugins: [],
} satisfies Config;
