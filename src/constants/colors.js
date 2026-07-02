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

  // Counter card text — actual color is chosen per-card by getContrastText()
  // in CounterCard (auto black/white), so it stays readable on any palette color.
  cardText: "#FFFFFF",

  // Vibrant Material palette for counter cards — saturated 500–700 range.
  palette: [
    // Reds & Pinks
    "#E53935", "#D81B60", "#C2185B", "#AD1457",

    // Purples
    "#8E24AA", "#7B1FA2", "#5E35B1", "#673AB7",

    // Blues & Cyans
    "#3949AB", "#1E88E5", "#039BE5", "#00ACC1",

    // Greens & Teals
    "#00897B", "#00796B", "#43A047", "#388E3C",

    // Ambers & Oranges (darker shades — needed for white-text contrast)
    "#EF6C00", "#E65100", "#F9A825", "#FF8F00",

    // Neutrals
    "#546E7A", "#455A64", "#6D4C41", "#5D4037",
  ],
};
