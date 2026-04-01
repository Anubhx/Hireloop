import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        display: ["var(--font-display)", "sans-serif"],
        body: ["var(--font-body)", "sans-serif"],
      },
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        brand: {
          900: "#0D0D12",
          800: "#1A1A26",
          700: "#24243A",
          600: "#3D3D5C",
          500: "#5C5C8A",
          400: "#7B7BB8",
          300: "#9B9BD0",
          200: "#C4C4E8",
          100: "#E8E8F5",
          50: "#F4F4FA",
        },
        accent: {
          DEFAULT: "#635BFF",
          light: "#EAE9FF",
          hover: "#4F48E0",
        },
        success: {
          DEFAULT: "#0F9D58",
          light: "#E6F5EE",
        },
        warning: {
          DEFAULT: "#F59E0B",
          light: "#FFF8E6",
        },
        danger: {
          DEFAULT: "#EF4444",
          light: "#FEE9E9",
        },
        info: {
          DEFAULT: "#2563EB",
          light: "#EBF2FF",
        },
        surface: {
          DEFAULT: "#FFFFFF",
          2: "#F7F7FB",
          3: "#F0F0F7",
        },
        "border-color": "#E4E4EF",
        "border-strong": "#C8C8DF",
        "text-primary": "#0D0D12",
        "text-secondary": "#5C5C8A",
        "text-muted": "#9898B8",
      },
      borderRadius: {
        sm: "6px",
        md: "10px",
        lg: "16px",
        xl: "24px",
        full: "9999px",
      },
      boxShadow: {
        card: "0 1px 3px rgba(13,13,18,0.06), 0 1px 2px rgba(13,13,18,0.04)",
        elevated: "0 4px 20px rgba(13,13,18,0.08), 0 2px 8px rgba(13,13,18,0.04)",
      },
    },
  },
  plugins: [],
};
export default config;
