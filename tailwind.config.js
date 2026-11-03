/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./App.{js,jsx,ts,tsx}", "./src/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        brand: "#4F46E5",
        brandPurple: "#7C5CFC",
        dealAmber: "#FFB020",
        appBg: "#F8F7FF",
        cardBg: "#FFFFFF",
        textMain: "#131B2E",
        textMuted: "#5A6478",
        borderLight: "#E6E3F5",
        inactive: "#8A90A6",
      },
    },
  },
  plugins: [],
};
