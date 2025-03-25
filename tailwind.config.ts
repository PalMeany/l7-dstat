import type { Config } from "tailwindcss"

const config: Config = {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        green: {
          900: "#0a1f0a",
          800: "#0f2f0f",
          700: "#153f15",
          600: "#1a4f1a",
          500: "#00ff00",
          400: "#33ff33",
          300: "#66ff66",
          200: "#99ff99",
          100: "#ccffcc",
        },
        red: {
          500: "#ff0000",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: {
            height: "0",
          },
          to: {
            height: "var(--radix-accordion-content-height)",
          },
        },
        "accordion-up": {
          from: {
            height: "var(--radix-accordion-content-height)",
          },
          to: {
            height: "0",
          },
        },
        "text-glow": {
          "0%, 100%": {
            textShadow: "0 0 10px rgba(0, 255, 0, 0.5)",
          },
          "50%": {
            textShadow: "0 0 20px rgba(0, 255, 0, 0.8), 0 0 30px rgba(0, 255, 0, 0.4)",
          },
        },
        "value-change": {
          "0%": {
            transform: "scale(1)",
            textShadow: "0 0 10px rgba(0, 255, 0, 0.8)",
          },
          "50%": {
            transform: "scale(1.2)",
            textShadow: "0 0 20px rgba(0, 255, 0, 1), 0 0 30px rgba(0, 255, 0, 0.8)",
          },
          "100%": {
            transform: "scale(1)",
            textShadow: "0 0 10px rgba(0, 255, 0, 0.8)",
          },
        },
        "value-decrease": {
          "0%": {
            transform: "scale(1)",
            opacity: "1",
          },
          "50%": {
            transform: "scale(0.95)",
            opacity: "0.8",
          },
          "100%": {
            transform: "scale(1)",
            opacity: "1",
          },
        },
        "status-pulse": {
          "0%, 100%": {
            opacity: "0.9",
          },
          "50%": {
            opacity: "1",
          },
        },
        "pulse-fast": {
          "0%, 100%": {
            opacity: "1",
          },
          "50%": {
            opacity: "0.7",
          },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "text-glow": "text-glow 3s infinite",
        "value-change": "value-change 0.8s ease-in-out",
        "value-decrease": "value-decrease 0.8s ease-in-out",
        "status-pulse": "status-pulse 2s infinite",
        "pulse-fast": "pulse-fast 0.5s infinite",
      },
    },
  },
  plugins: [],
}
export default config

