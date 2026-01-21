import type { Config } from "tailwindcss";

const config: Config = {
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
        muted: "var(--muted)",
        card: "var(--card)",
        border: "var(--border)",
        ring: "var(--ring)",
        accent: "var(--accent)",
        "accent-2": "var(--accent-2)",
      },
      borderRadius: {
        base: "0.5rem",
      },
    },
  },
  plugins: [
    require("@tailwindcss/line-clamp"),
  ],
  darkMode: "class",
};
export default config;
