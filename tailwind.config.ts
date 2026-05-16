import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        primary: {
          DEFAULT: "var(--primary)",
          light: "var(--primary-light)",
          glow: "var(--primary-glow)",
        },
        cyber: {
          cyan: "var(--cyber-cyan)",
          glow: "var(--cyber-cyan-glow)",
        },
        card: {
          DEFAULT: "var(--card)",
          border: "var(--card-border)",
          hover: "var(--card-hover)",
        },
        text: {
          primary: "var(--text-primary)",
          secondary: "var(--text-secondary)",
          tertiary: "var(--text-tertiary)",
        },
        muted: {
          foreground: "var(--muted-foreground)",
        },
        success: {
          DEFAULT: "var(--success)",
          light: "var(--success-light)",
        },
        destructive: "var(--destructive)",
        border: "var(--border)",
        input: {
          bg: "var(--input-bg)",
          border: "var(--input-border)",
        },
        sidebar: {
          DEFAULT: "var(--sidebar)",
          border: "var(--sidebar-border)",
          accent: "var(--sidebar-accent)",
        },
        surface: {
          DEFAULT: "#0a0d14",
          card: "rgba(20, 27, 45, 0.6)",
          muted: "rgba(30, 40, 60, 0.5)",
          border: "rgba(255, 255, 255, 0.08)",
        },
        brand: {
          50: "#e0fcff",
          100: "#bef8fd",
          200: "#87eaf2",
          300: "#54d1db",
          400: "#38bec9",
          500: "#00e5ff",
          600: "#00c4d6",
          700: "#0997a7",
          800: "#147d87",
          900: "#186471",
          950: "#0e4850",
        },
      },
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
        mono: ["var(--font-jetbrains-mono)", "monospace"],
      },
      boxShadow: {
        glow: "0 0 40px -10px var(--cyber-cyan-glow)",
        "glow-lg": "0 0 60px -15px var(--cyber-cyan-glow)",
        "card-dark": "inset 0 1px 1px rgba(255,255,255,0.05), 0 8px 32px rgba(0,0,0,0.3)",
        "card-glow": "inset 0 1px 1px rgba(255,255,255,0.05), 0 8px 32px rgba(0,0,0,0.3), 0 0 40px var(--cyber-cyan-glow)",
      },
      borderRadius: {
        sm: "0.5rem",
        md: "0.75rem",
        lg: "1rem",
        xl: "1.25rem",
        "2xl": "1.5rem",
      },
      backdropBlur: {
        glass: "24px",
      },
      animation: {
        "pulse-glow": "pulse-glow 2s ease-in-out infinite",
        float: "float 3s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};

export default config;
