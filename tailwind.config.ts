import type { Config } from "tailwindcss";

export default {
  darkMode: "class",
  content: ["./app/**/{**,.client,.server}/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: "#0d1117",
        surface: {
          DEFAULT: "#161b22",
          raised: "#1c222b",
          sunken: "#0a0e13",
        },
        ink: {
          DEFAULT: "#e6e9ee",
          muted: "#aeb6c2",
          faint: "#7d8794",
        },
        brand: {
          DEFAULT: "#d93036",
          hover: "#e5484d",
          text: "#f85149",
          muted: "#2a1618",
          soft: "#1c1213",
        },
        status: {
          success: "#3fb950",
          warning: "#d29922",
          danger: "#f85149",
        },
        onbrand: "#ffffff",
        line: {
          DEFAULT: "rgba(230, 233, 238, 0.10)",
          strong: "rgba(230, 233, 238, 0.18)",
        },
      },
      fontFamily: {
        sans: ["Overpass", "ui-monospace", "SFMono-Regular", "monospace"],
        script: ["Yesteryear", "cursive"],
      },
      borderRadius: {
        xxs: "4px",
        sm: "6px",
        md: "10px",
        lg: "16px",
      },
      fontSize: {
        display: ["clamp(2.5rem, 6vw, 4rem)", {
          lineHeight: "1.15",
          fontWeight: "400",
        }],
        brand: ["1.75rem", { lineHeight: "1.2" }],
      },
      zIndex: {
        overlay: "10",
        dropdown: "20",
        sticky: "30",
        modalBackdrop: "40",
        modal: "50",
        toast: "60",
        tooltip: "70",
      },
      boxShadow: {
        overlay:
          "0 24px 64px -12px rgba(0,0,0,0.6), 0 8px 24px -8px rgba(0,0,0,0.5)",
        pop: "0 12px 40px -8px rgba(0,0,0,0.55)",
        ring: "0 0 0 2px #f85149, 0 0 0 4px rgba(13,17,23,0.9)",
      },
      keyframes: {
        "fade-in": {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(12px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "slide-in-right": {
          "0%": { transform: "translateX(100%)" },
          "100%": { transform: "translateX(0)" },
        },
        "reaction-float": {
          "0%": { opacity: "0", transform: "translateY(12px) scale(0.8)" },
          "15%": { opacity: "1", transform: "translateY(0) scale(1.1)" },
          "35%": { transform: "translateY(-6px) scale(1)" },
          "100%": { opacity: "0", transform: "translateY(-64px) scale(1)" },
        },
        "pulse-soft": {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.55" },
        },
      },
      animation: {
        "fade-in": "fade-in 0.45s cubic-bezier(0.16, 1, 0.3, 1)",
        "fade-up": "fade-up 0.45s cubic-bezier(0.16, 1, 0.3, 1)",
        "slide-in-right": "slide-in-right 0.4s cubic-bezier(0.16, 1, 0.3, 1)",
        "reaction-float": "reaction-float 2.4s ease-out forwards",
        "pulse-soft": "pulse-soft 2s ease-in-out infinite",
      },
    },
  },
  plugins: [],
} satisfies Config;
