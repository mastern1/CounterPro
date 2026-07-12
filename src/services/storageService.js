// src/services/storageService.js
import AsyncStorage from '@react-native-async-storage/async-storage';

// Storage keys are defined here only (kept private inside the service)
const KEYS = {
  DATA: '@counters_pro_data_v1',
  USER: '@counters_pro_session_v1',
  LAYOUT: '@counters_pro_layout_v1',
  SESSION_LOGS: '@counters_pro_session_logs_v1', // Completed session records (source for future Supabase sync)
  SYNC_DEVICE_ID: '@counters_pro_sync_device_id_v1' // Unique per-install id for Supabase (userData.deviceId is just the device model name, not unique)
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

  // Append a completed session record to the local log
  appendSessionLog: async (record) => {
    try {
      const existing = await AsyncStorage.getItem(KEYS.SESSION_LOGS);
      const logs = existing ? JSON.parse(existing) : [];
      logs.push(record);
      await AsyncStorage.setItem(KEYS.SESSION_LOGS, JSON.stringify(logs));
      return true;
    } catch (error) {
      console.error('Storage Append Session Log Error:', error);
      return false;
    }
  },

  // Mark one stored session log as successfully synced to Supabase
  markSessionSynced: async (sessionId) => {
    try {
      const existing = await AsyncStorage.getItem(KEYS.SESSION_LOGS);
      const logs = existing ? JSON.parse(existing) : [];
      const updated = logs.map((log) =>
        log.sessionId === sessionId ? { ...log, synced: true } : log,
      );
      await AsyncStorage.setItem(KEYS.SESSION_LOGS, JSON.stringify(updated));
      return true;
    } catch (error) {
      console.error('Storage Mark Session Synced Error:', error);
      return false;
    }
  },

  // Load all stored session records
  loadSessionLogs: async () => {
    try {
      const logs = await AsyncStorage.getItem(KEYS.SESSION_LOGS);
      return logs ? JSON.parse(logs) : [];
    } catch (error) {
      console.error('Storage Load Session Logs Error:', error);
      return [];
    }
  },

  // Get (or create, once ever) this install's unique Supabase device id.
  // Survives logout so a phone keeps the same identity across workers/shifts.
  getSyncDeviceId: async () => {
    try {
      let id = await AsyncStorage.getItem(KEYS.SYNC_DEVICE_ID);
      if (!id) {
        id = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
        await AsyncStorage.setItem(KEYS.SYNC_DEVICE_ID, id);
      }
      return id;
    } catch (error) {
      console.error('Storage Get Sync Device Id Error:', error);
      return null;
    }
  },

  // Clear everything (logout). SESSION_LOGS and SYNC_DEVICE_ID are
  // intentionally kept so unsynced session records survive logout (synced to
  // Supabase later) and the device keeps a stable identity across workers.
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
