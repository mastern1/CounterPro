// src/utils/generators.js
import { COLORS } from '../constants/colors';

// Generate a unique ID (simple and consistent)
export const generateId = () => Date.now().toString();

// Pick a random color from the palette
export const getRandomColor = () => {
  return COLORS.palette[Math.floor(Math.random() * COLORS.palette.length)];
};

// Format a device name
export const getDeviceName = (device) => {
  if (device?.modelName && device?.brand) {
    const brand = device.brand.charAt(0).toUpperCase() + device.brand.slice(1);
    return `${brand} ${device.modelName}`;
  }
  return device?.modelName || 'Unknown Device';
};
