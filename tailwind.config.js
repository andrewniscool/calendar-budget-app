/** @type {import('tailwindcss').Config} */
import forms from "@tailwindcss/forms";
import scrollbar from "tailwind-scrollbar";

export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {},
  },
  plugins: [forms, scrollbar],
}

