// src/context/ProjectContext.js

import { createContext, useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';
// 👇 استيراد الخدمة والأدوات
import { StorageService } from '../services/storageService';
import { generateId, getRandomColor } from '../utils/generators';

export const ProjectContext = createContext();

export const ProjectProvider = ({ children }) => {
  // ─── 1. الحالة (State) ───
  const [groups, setGroups] = useState([]);
  const [userData, setUserData] = useState(null);
  const [isGridLayout, setIsGridLayout] = useState(true);
  const [isLoading, setIsLoading] = useState(true);

  // ─── 2. المراجع (Refs) للحفظ الذكي (بقيت كما هي) ✅ ───
  const saveTimeoutRef = useRef(null);
  const appState = useRef(AppState.currentState);
  const previousGroupsRef = useRef(null);

  // ─── 3. التحميل الأولي (Clean & Fast) ───
  useEffect(() => {
    const initApp = async () => {
      try {
        // المخ يطلب البيانات من الخدمة
        const data = await StorageService.loadAll();
        
        // تعبئة البيانات
        setGroups(data.groups);
        previousGroupsRef.current = JSON.stringify(data.groups); // 👈 حفظنا النسخة الأصلية للمقارنة
        setUserData(data.user);
        setIsGridLayout(data.layout);
        
      } catch (e) {
        console.error("Initialization Failed", e);
      } finally {
        setIsLoading(false);
      }
    };
    initApp();
  }, []);

  // ─── 4. 🔥🔥 المنطق الذكي (Smart Save Logic) 🔥🔥 ───
  // هذا الكود هو "الدماغ" ويبقى هنا ولا ينتقل للخدمة
  useEffect(() => {
    // 🛡️ حماية 1: لا تحفظ أثناء التحميل
    if (isLoading) return;

    // 🛡️ حماية 2: لا تحفظ إذا البيانات لم تتغير فعلياً (مقارنة النصوص)
    const groupsString = JSON.stringify(groups);
    if (groupsString === previousGroupsRef.current) return;
    
    // تحديث المرجع للمرة القادمة
    previousGroupsRef.current = groupsString;

    // دالة التنفيذ (هنا فقط استدعينا الخدمة)
    const saveNow = async () => {
      try {
        // 👇 هنا التغيير الوحيد: بدل AsyncStorage مباشر، نادينا الخدمة
        await StorageService.saveGroups(groups); 
        console.log("✅ Smart Save Executed via Service");
      } catch (e) {
        console.error("❌ Save failed", e);
      }
    };

    // ⏳ منطق الـ Debounce (الانتظار 500ms)
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    
    saveTimeoutRef.current = setTimeout(() => {
      saveNow();
    }, 500);

    // 📱 منطق مراقبة إغلاق التطبيق (AppState)
    const subscription = AppState.addEventListener('change', nextAppState => {
      if (appState.current.match(/active/) && (nextAppState === 'background' || nextAppState === 'inactive')) {
        // المستخدم خرج؟ احفظ فوراً والغي الانتظار
        if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
        saveNow();
      }
      appState.current = nextAppState;
    });

    return () => {
      subscription.remove();
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    };

  }, [groups, isLoading]); // يراقب تغيير المجموعات

  // ─── 5. باقي الأكواد (Layout, Login...) ───
  
  // حفظ التخطيط (بسيط لا يحتاج ذكاء، نحفظه فوراً عبر الخدمة)
  useEffect(() => {
    if (!isLoading) {
      StorageService.saveLayout(isGridLayout);
    }
  }, [isGridLayout, isLoading]);

  const loginUser = async (name, deviceId) => {
    const user = { name, deviceId, loginTime: new Date().toISOString() };
    setUserData(user);
    await StorageService.saveUser(user);
  };

  const logoutUser = async () => {
    const success = await StorageService.clearAll();
    if (success) {
      setGroups([]);
      setUserData(null);
      setIsGridLayout(true);
    }
  };

  const toggleLayout = () => setIsGridLayout(prev => !prev);

  // ✅ استخدام name وتوحيد التسمية
  const addNewGroup = (name) => {
    if (!userData) return;
    const newGroup = {
      id: generateId(),
      name: name,
      color: getRandomColor(),
      createdAt: new Date().toISOString(),
      createdBy: userData.name,
      deviceId: userData.deviceId,
      items: [] 
    };
    setGroups([newGroup, ...groups]); 
  };

  const editGroup = (groupId, newName) => {
    setGroups(prev => prev.map(g => g.id === groupId ? { ...g, name: newName } : g));
  };

  const deleteGroup = (groupId) => {
    setGroups(prev => prev.filter(g => g.id !== groupId));
  };

  const updateGroup = (groupId, newItems) => {
    setGroups(prev => prev.map(g => g.id === groupId ? { ...g, items: newItems } : g));
  };

  return (
    <ProjectContext.Provider value={{ 
      groups, userData, isGridLayout, isLoading,
      loginUser, logoutUser, toggleLayout,
      addNewGroup, deleteGroup, updateGroup, editGroup 
    }}>
      {children}
    </ProjectContext.Provider>
  );
};