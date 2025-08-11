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
        danger: "#ef4444",
        success: "#10b981",
      },
      fontFamily: {
        'source-code': ['SourceCodeVf', 'sans-serif'],
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
        primaryDotted: "radial-gradient(#242424 1px, #171717 1px)",
        primaryDottedFooter: "radial-gradient(#D5D5B8 1px, #ECECE2 1px)",
      },
      backgroundSize: {
        primaryDottedSize: "15px 15px",
      },
    },
  },
  plugins: [],
} satisfies Config;
