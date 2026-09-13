// /** @type {import('tailwindcss').Config} */
// module.exports = {
//   // NOTE: Update this to include the paths to all files that contain Nativewind classes.
//   content: [
//     "./src/app/**/*.{js,jsx,ts,tsx}",
//     "./components/**/*.{js,jsx,ts,tsx}",
//   ],
//   presets: [require("nativewind/preset")],
//   theme: {
//     extend: {
//         // colors: {
//         //   primary: {
//         //     DEFAULT: "#F4A261",
//         //     light: "#F4B183",
//         //     dark: "#E76F51",
//         //     soft: "#FFD7BA",
//         //   },
//         //   surface: {
//         //     DEFAULT: "#1A1A1D",
//         //     light: "#2D2D30",
//         //     dark: "#0D0D0F",
//         //     card: "#242428",
//         //     overlay: "#1C3A47",
//         //   },
//         //   foreground: "#FFFFFF",
//         //   "muted-foreground": "#A0A0A5",
//         //   "subtle-foreground": "#6B6B70",
//         // },
//         colors: {
//           primary: {
//             DEFAULT: "#6366F1",   // Indigo — vibrant but not harsh
//             light: "#818CF8",
//             dark: "#4F46E5",
//             soft: "#C7D2FE",
//           },
//           surface: {
//             DEFAULT: "#131316",
//             light: "#1E1E22",
//             dark: "#0A0A0C",
//             card: "#1C1C20",
//             overlay: "#25252B",
//           },
//           foreground: "#F5F5F7",
//           "muted-foreground": "#9B9BA3",
//           "subtle-foreground": "#5C5C64",
//           accent: "#22D3EE",       // cyan pop for online status/highlights
//           success: "#34D399",
//           danger: "#F87171",
//         }
//       },
//   },
//   plugins: [],
// };

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/app/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}",
  ],

  presets: [require("nativewind/preset")],

  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#7C6FF7",
          light: "#9B91FF",
          dark: "#6357D9",
          soft: "#2D294A",
        },

        surface: {
          DEFAULT: "#111114",
          light: "#18181D",
          dark: "#0A0A0C",
          card: "#1E1E24",
          elevated: "#24242C",
          overlay: "#17171C",
        },

        foreground: "#F5F5F7",
        "muted-foreground": "#A1A1AA",
        "subtle-foreground": "#71717A",

        border: "#27272F",

        success: "#4ADE80",
        warning: "#FBBF24",
        danger: "#F87171",
        info: "#60A5FA",
      },
    },
  },

  plugins: [],
};