// src/utils/validation.js

export const validateName = (name) => {
  const trimmed = name.trim();
  if (!trimmed) {
    return { valid: false, error: 'Name is required' };
  }
  if (trimmed.length < 2) {
    return { valid: false, error: 'Name too short' };
  }
  return { valid: true };
};

export const checkDuplicateName = (name, items, excludeId = null) => {
  return items.some(i => 
    i.name.trim().toLowerCase() === name.trim().toLowerCase() &&
    i.id !== excludeId
  );
};

export const validateStep = (step) => {
  const num = parseInt(step);
  return !isNaN(num) && num > 0 ? num : 1;
};