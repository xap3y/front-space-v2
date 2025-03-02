import type { Config } from "tailwindcss";

export default {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: "var(--col-primary)",
        secondary: "var(--col-secondary)",
        primary_light: "var(--col-primary-light)",
        battleship_gray: "#858585",
        whitesmoke: "var(--col-whitesmoke)",
        telegram: "#24A1DE",
        telegram2: "#0088cc",
        "telegram-darker": "#0081c3",
        "telegram-bright": "#00a7ff",
        "telegram-brighter": "#29b1ff",
        "telegram-brightest": "#60beff",
        "primary-brighter": "rgb(120, 120, 120)",
      },
      fontFamily: {
        'source-code': ['Source Code Pro', 'sans-serif'],
      }
    },
  },
  plugins: [],
} satisfies Config;
