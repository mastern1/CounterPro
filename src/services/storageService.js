// src/services/storageService.js
import AsyncStorage from '@react-native-async-storage/async-storage';

// تعريف المفاتيح هنا فقط (سرية تامة داخل الخدمة)
const KEYS = {
  DATA: '@counters_pro_data_v1',
  USER: '@counters_pro_session_v1',
  LAYOUT: '@counters_pro_layout_v1'
};

export const StorageService = {
  // 📥 جلب كل البيانات (للبداية)
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
        layout: layout ? JSON.parse(layout) : true // الافتراضي true
      };
    } catch (error) {
      console.error('Storage Load Error:', error);
      throw error;
    }
  },

  // 💾 حفظ المجموعات
  saveGroups: async (groups) => {
    try {
      await AsyncStorage.setItem(KEYS.DATA, JSON.stringify(groups));
      return true;
    } catch (error) {
      console.error('Storage Save Groups Error:', error);
      return false;
    }
  },

  // 👤 حفظ المستخدم
  saveUser: async (user) => {
    try {
      await AsyncStorage.setItem(KEYS.USER, JSON.stringify(user));
    } catch (error) {
      console.error('Storage Save User Error:', error);
    }
  },

  // 🎨 حفظ التخطيط
  saveLayout: async (isGrid) => {
    try {
      await AsyncStorage.setItem(KEYS.LAYOUT, JSON.stringify(isGrid));
    } catch (error) {
      console.error('Storage Save Layout Error:', error);
    }
  },

  // 🧹 مسح كل شيء (تسجيل خروج)
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