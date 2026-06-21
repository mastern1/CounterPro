// src/services/storageService.js
import AsyncStorage from '@react-native-async-storage/async-storage';

// Storage keys are defined here only (kept private inside the service)
const KEYS = {
  DATA: '@counters_pro_data_v1',
  USER: '@counters_pro_session_v1',
  LAYOUT: '@counters_pro_layout_v1'
};

export const StorageService = {
  // Load everything (used on startup)
  loadAll: async () => {
    try {
      const [groups, user, layout] = await Promise.all([
        AsyncStorage.getItem(KEYS.DATA),
        AsyncStorage.getItem(KEYS.USER),
        AsyncStorage.getItem(KEYS.LAYOUT)
      ]);
      return {
        groups: groups ? JSON.parse(groups) : [],
        user: user ? JSON.parse(user) : null,
        layout: layout ? JSON.parse(layout) : true // Default: true
      };
    } catch (error) {
      console.error('Storage Load Error:', error);
      throw error;
    }
  },

  // Save groups
  saveGroups: async (groups) => {
    try {
      await AsyncStorage.setItem(KEYS.DATA, JSON.stringify(groups));
      return true;
    } catch (error) {
      console.error('Storage Save Groups Error:', error);
      return false;
    }
  },

  // Save user
  saveUser: async (user) => {
    try {
      await AsyncStorage.setItem(KEYS.USER, JSON.stringify(user));
    } catch (error) {
      console.error('Storage Save User Error:', error);
    }
  },

  // Save layout
  saveLayout: async (isGrid) => {
    try {
      await AsyncStorage.setItem(KEYS.LAYOUT, JSON.stringify(isGrid));
    } catch (error) {
      console.error('Storage Save Layout Error:', error);
    }
  },

  // Clear everything (logout)
  clearAll: async () => {
    try {
      await AsyncStorage.multiRemove([KEYS.DATA, KEYS.USER, KEYS.LAYOUT]);
      return true;
    } catch (error) {
      console.error('Storage Clear Error:', error);
      return false;
    }
  }
};
