/** @type {import('tailwindcss').Config} */
module.exports = {
  // darkMode: "class",
  content: ["./app/**/*.{ts,tsx,jsx,js}"],
  theme: {
    // fontFamily: {
    //   display: ["Poppins", "sans-serif"],
    // },
    transitionProperty: {
      height: "height",
    },
  },
  plugins: [require("@tailwindcss/forms")],
};
