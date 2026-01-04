// src/utils/generators.js
import { COLORS } from '../constants/colors';

// توليد ID فريد (بسيط وموحد)
export const generateId = () => Date.now().toString();

// اختيار لون عشوائي من الباليت
export const getRandomColor = () => {
  return COLORS.palette[Math.floor(Math.random() * COLORS.palette.length)];
};

// تنسيق اسم الجهاز
export const getDeviceName = (device) => {
  if (device?.modelName && device?.brand) {
    const brand = device.brand.charAt(0).toUpperCase() + device.brand.slice(1);
    return `${brand} ${device.modelName}`;
  }
  return device?.modelName || 'Unknown Device';
};