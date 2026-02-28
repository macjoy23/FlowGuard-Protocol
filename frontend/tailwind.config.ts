/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        background: "#05080D",
        glass: "rgba(15, 20, 30, 0.65)",
        "glass-heavy": "rgba(15, 20, 30, 0.85)",
        "border-glow": "rgba(0, 255, 220, 0.15)",
        "border-glow-strong": "rgba(0, 255, 220, 0.3)",
        accent: "#00E0C7",
        "accent-dim": "rgba(0, 224, 199, 0.15)",
        secondary: "#1E88E5",
        "text-primary": "#F5F7FA",
        "text-muted": "#9CA3AF",
        "text-dim": "#6B7280",
      },
      fontFamily: {
        heading: ["'Space Grotesk'", "system-ui", "sans-serif"],
        body: ["'Inter'", "system-ui", "sans-serif"],
      },
      borderRadius: {
        glass: "32px",
        "glass-sm": "20px",
        "glass-xs": "12px",
      },
      backdropBlur: {
        glass: "24px",
      },
      boxShadow: {
        glow: "0 0 60px rgba(0, 224, 199, 0.08)",
        "glow-strong": "0 0 80px rgba(0, 224, 199, 0.15)",
        "glow-accent": "0 0 40px rgba(0, 224, 199, 0.25)",
      },
      animation: {
        "fade-in": "fadeIn 0.6s ease-out forwards",
        "slide-up": "slideUp 0.4s ease-out forwards",
        "glow-pulse": "glowPulse 2s ease-in-out infinite",
        float: "float 6s ease-in-out infinite",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0", transform: "translateY(20px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        slideUp: {
          "0%": { opacity: "0", transform: "translateY(100%)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        glowPulse: {
          "0%, 100%": {
            boxShadow: "0 0 20px rgba(0, 224, 199, 0.1)",
          },
          "50%": {
            boxShadow: "0 0 40px rgba(0, 224, 199, 0.3)",
          },
        },
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-10px)" },
        },
      },
      letterSpacing: {
        tighter: "-0.03em",
        tight: "-0.02em",
      },
    },
  },
  plugins: [],
};
