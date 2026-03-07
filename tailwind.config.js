/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./templates/**/*.html",
    "./static/**/*.js"
  ],
  theme: {
    extend: {
      colors: {
        primaryBlue: "#0A66C2",
        accentOrange: "#FF4500",
        textPrimary: "#191919",
        textSecondary: "#666666",
        surfaceGray: "#F3F2EF"
      },
      boxShadow: {
        diffuse: "0px 4px 12px rgba(0, 0, 0, 0.05)"
      },
      borderRadius: {
        card: "12px"
      },
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui"]
      }
    }
  },
  plugins: []
};
