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
        primary: "#171717",
        secondary: "#1c1c1c",
        primary_light: "#242424",
        battleship_gray: "#858585",
        whitesmoke: "#f5f5f5",
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
