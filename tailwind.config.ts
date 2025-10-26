import type { Config } from "tailwindcss";

export default {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/lib/**/*.{tsx,jsx}",
  ],
  theme: {
    extend: {
      screens: {
        '3xl': '1930px',
      },
      colors: {
        primary: "var(--col-primary)",
        primary1: "#0A0A0A",
        primary2: "#101010",
        primary3: "#131313",
        primary0: "#1A1A1A",
        test2: "#2e2e2e",
        testa: "#494949",
        secondary: "var(--col-secondary)",
        third: "var(--col-third)",
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
        danger: "#ef4444",
        success: "#10b981",
      },
      fontFamily: {
        'source-code': ['SourceCodeVf', 'sans-serif'],
        'source-code-bold': ['SourceCodeVfBold', 'sans-serif'],
      },
      keyframes: {
        fadeInLeft: {
          '0%': { opacity: '0', transform: 'translateX(-100%)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
      },
      animation: {
        fadeInLeft: 'fadeInLeft .2s ease-out',
      },
      backgroundImage: {
        primaryDotted: "radial-gradient(var(--bg-point1) 1px, var(--bg-point2) 1px)",
        primaryDottedFooter: "radial-gradient(#D5D5B8 1px, #ECECE2 1px)",
      },
      backgroundSize: {
        primaryDottedSize: "15px 15px",
      },

    },
  },
  plugins: [],
} satisfies Config;
