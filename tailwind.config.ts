import type { Config } from "tailwindcss";

export default {
  darkMode: "class",
  content: ["./app/**/{**,.client,.server}/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: "rgb(var(--bg-rgb) / <alpha-value>)",
        surface: {
          DEFAULT: "rgb(var(--surface-rgb) / <alpha-value>)",
          raised: "rgb(var(--surface-raised-rgb) / <alpha-value>)",
          sunken: "rgb(var(--surface-sunken-rgb) / <alpha-value>)",
        },
        ink: {
          DEFAULT: "rgb(var(--ink-rgb) / <alpha-value>)",
          muted: "rgb(var(--ink-muted-rgb) / <alpha-value>)",
          faint: "rgb(var(--ink-faint-rgb) / <alpha-value>)",
        },
        brand: {
          DEFAULT: "rgb(var(--brand-rgb) / <alpha-value>)",
          hover: "rgb(var(--brand-hover-rgb) / <alpha-value>)",
          text: "rgb(var(--brand-text-rgb) / <alpha-value>)",
          muted: "rgb(var(--brand-muted-rgb) / <alpha-value>)",
          soft: "rgb(var(--brand-soft-rgb) / <alpha-value>)",
        },
        status: {
          success: "rgb(var(--status-success-rgb) / <alpha-value>)",
          warning: "rgb(var(--status-warning-rgb) / <alpha-value>)",
          danger: "rgb(var(--status-danger-rgb) / <alpha-value>)",
        },
        onbrand: "rgb(var(--onbrand-rgb) / <alpha-value>)",
        line: {
          DEFAULT: "var(--line)",
          strong: "var(--line-strong)",
        },
      },
      fontFamily: {
        sans: ["Overpass", "ui-monospace", "SFMono-Regular", "monospace"],
        mono: ["Overpass", "ui-monospace", "SFMono-Regular", "monospace"],
        script: ["Yesteryear", "cursive"],
      },
      spacing: {
        xxs: "4px",
        xs: "8px",
        sm: "12px",
        md: "16px",
        lg: "24px",
        xl: "32px",
        xxl: "48px",
        xxxl: "64px",
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
