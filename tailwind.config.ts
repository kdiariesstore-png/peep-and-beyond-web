import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        cream: "#FBF3E7",
        brown: "#3B2A1E",
        leaf: "#6B8E5A",
      },
    },
  },
  plugins: [],
};

export default config;
