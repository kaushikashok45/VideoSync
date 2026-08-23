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
        signal: {
          DEFAULT: "rgb(var(--signal-rgb) / <alpha-value>)",
          soft: "rgb(var(--signal-rgb) / 0.16)",
        },
        line: {
          DEFAULT: "var(--line)",
          strong: "var(--line-strong)",
        },
      },
      fontFamily: {
        airone: ["Airone", "Yesteryear", "cursive"],
        built: [
          "Bricolage Grotesque",
          "Avenir Next",
          "ui-sans-serif",
          "system-ui",
          "sans-serif",
        ],
        sans: [
          "Karla",
          "-apple-system",
          "Segoe UI",
          "ui-sans-serif",
          "system-ui",
          "sans-serif",
        ],
        mono: ["ui-monospace", "SFMono-Regular", "Menlo", "monospace"],
        script: ["Airone", "Yesteryear", "cursive"],
      },
      spacing: {
        xxs: "4px",
        xs: "8px",
        sm: "16px",
        md: "24px",
        lg: "32px",
        xl: "40px",
        xxl: "48px",
        xxxl: "64px",
        display: "80px",
      },
      borderRadius: {
        xxs: "4px",
        sm: "6px",
        md: "10px",
        lg: "16px",
        full: "999px",
      },
      fontSize: {
        display: ["clamp(2.5rem, 6vw, 4rem)", {
          lineHeight: "1.1",
          fontWeight: "600",
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
        ring: "0 0 0 2px #0072f5, 0 0 0 4px rgba(0,0,0,0.9)",
        glow:
          "0 0 0 1px var(--line-strong), 0 8px 24px -8px rgba(255,255,255,0.35)",
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
