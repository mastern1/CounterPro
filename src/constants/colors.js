// src/constants/colors.js

export const COLORS = {
  // Brand colors (structural — keep stable across the app)
  primary: "#1a237e", // Navy (headers / status bar)
  secondary: "#2e7d32", // Green (FAB / primary actions)
  error: "#FF3B30", // Delete / cancel red
  accent: "#90CAF9", // Light-blue accent used on dark surfaces

  // Dark theme surfaces & text
  background: "#121212", // App background
  surface: "#1E1E1E", // Cards, modals, bars
  surfaceAlt: "#242424", // Slightly elevated areas / inputs
  border: "#333333", // Hairlines / outlines
  white: "#ffffff",
  textPrimary: "#EAEAEA", // Main text on dark
  textSecondary: "#9E9E9E", // Muted / secondary text
  text: "#EAEAEA", // Backwards-compatible alias for textPrimary

  // Pastel palette for counter cards (data-driven, light by design so
  // black text stays readable — these are NOT app chrome colors).
  palette: [
    // Reds & Pinks
    "#FFCDD2",
    "#F8BBD0",
    "#FCE4EC",
    "#F48FB1",

    // Purples
    "#E1BEE7",
    "#D1C4E9",
    "#F3E5F5",
    "#EDE7F6",

    // Blues & Cyans
    "#C5CAE9",
    "#BBDEFB",
    "#B3E5FC",
    "#B2EBF2",
    "#E8EAF6",
    "#E3F2FD",
    "#E1F5FE",
    "#E0F7FA",

    // Greens
    "#B2DFDB",
    "#C8E6C9",
    "#DCEDC8",
    "#E0F2F1",
    "#E8F5E9",
    "#F1F8E9",
    "#A5D6A7",
    "#81C784",

    // Yellows & Oranges
    "#F0F4C3",
    "#FFF9C4",
    "#FFECB3",
    "#FFE0B2",
    "#F9FBE7",
    "#FFFDE7",
    "#FFF8E1",
    "#FFF3E0",

    // Neutrals
    "#D7CCC8",
    "#CFD8DC",
    "#EFEBE9",
    "#ECEFF1",
  ],
};
