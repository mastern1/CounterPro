import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';

// إنشاء القناة (Context)
export const ProjectContext = createContext();

export const ProjectProvider = ({ children }) => {
  // ─── 1. الثوابت والمفاتيح (Professional Naming) ───
  const STORAGE_KEY_DATA = '@counters_pro_data_v1';     // للبيانات
  const STORAGE_KEY_USER = '@counters_pro_session_v1';  // للجلسة
  const STORAGE_KEY_LAYOUT = '@counters_pro_layout_v1'; // للتصميم

  // ─── 2. المتغيرات (States) ───
  const [groups, setGroups] = useState([]); // المجموعات
  const [userData, setUserData] = useState(null); // بيانات العامل
  const [isGridLayout, setIsGridLayout] = useState(true); // نوع العرض
  const [isLoading, setIsLoading] = useState(true); // حالة التحميل

  // ─── 3. المراجع (Refs) للحفظ الذكي ───
  const saveTimeoutRef = useRef(null);
  const appState = useRef(AppState.currentState);
  const previousGroupsRef = useRef(null); // لتتبع التغييرات ومنع الحفظ المتكرر

  // ─── 4. التحميل الأولي (يحدث مرة واحدة) ───
  useEffect(() => {
    const loadAllData = async () => {
      try {
        // قراءة كل شيء دفعة واحدة (Parallel Execution)
        const [savedGroups, savedUser, savedLayout] = await Promise.all([
          AsyncStorage.getItem(STORAGE_KEY_DATA),
          AsyncStorage.getItem(STORAGE_KEY_USER),
          AsyncStorage.getItem(STORAGE_KEY_LAYOUT)
        ]);

        // 1. استرجاع المجموعات
        if (savedGroups) {
          setGroups(JSON.parse(savedGroups));
          previousGroupsRef.current = savedGroups; // 👈 مهم جداً: نحفظ النسخة الأصلية للمقارنة
        }
        
        // 2. استرجاع جلسة المستخدم
        if (savedUser) setUserData(JSON.parse(savedUser));

        // 3. استرجاع شكل العرض
        if (savedLayout) setIsGridLayout(JSON.parse(savedLayout));

      } catch (e) {
        console.error("خطأ في تحميل البيانات:", e);
      } finally {
        setIsLoading(false); // انتهى التحميل
      }
    };

    loadAllData();
  }, []);

  // ─── 5. نظام الحفظ الذكي (Smart Save Logic) ───
  useEffect(() => {
    // 🛡️ حماية: لا تحفظ أثناء التحميل الأولي
    if (isLoading) return;

    // 🛡️ حماية: لا تحفظ إذا البيانات لم تتغير فعلياً
    const groupsString = JSON.stringify(groups);
    if (groupsString === previousGroupsRef.current) return;
    
    // تحديث المرجع الحالي
    previousGroupsRef.current = groupsString;

    // دالة الحفظ الفعلية
    const saveNow = async () => {
      try {
        await AsyncStorage.setItem(STORAGE_KEY_DATA, groupsString);
        console.log("✅ Auto-saved successfully (Smart Save)");
      } catch (e) {
        console.error("❌ Save failed:", e);
      }
    };

    // إلغاء أي مؤقت سابق (Debounce)
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    // انتظر 500ms قبل الحفظ
    saveTimeoutRef.current = setTimeout(() => {
      saveNow();
    }, 500);

    // مراقب إغلاق التطبيق (لحماية البيانات عند الخروج المفاجئ)
    const subscription = AppState.addEventListener('change', nextAppState => {
      if (
        appState.current.match(/active/) && 
        (nextAppState === 'background' || nextAppState === 'inactive')
      ) {
        // المستخدم يغلق التطبيق -> احفظ فوراً والغي الانتظار
        if (saveTimeoutRef.current) {
          clearTimeout(saveTimeoutRef.current);
        }
        saveNow();
      }
      appState.current = nextAppState;
    });

    // تنظيف
    return () => {
      subscription.remove();
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    };

  }, [groups, isLoading]);

  // ─── 6. حفظ تفضيل العرض (منفصل لأنه بسيط) ───
  useEffect(() => {
    const saveLayout = async () => {
      if (isLoading) return;
      try {
        await AsyncStorage.setItem(STORAGE_KEY_LAYOUT, JSON.stringify(isGridLayout));
      } catch (e) { console.error("فشل حفظ التخطيط"); }
    };
    saveLayout();
  }, [isGridLayout, isLoading]);


  // ─── 7. الوظائف (Actions) ───

  // تسجيل الدخول
  const loginUser = async (name, deviceId) => {
    const user = { name, deviceId, loginTime: new Date().toISOString() };
    setUserData(user);
    try {
      await AsyncStorage.setItem(STORAGE_KEY_USER, JSON.stringify(user));
    } catch (e) { console.error("فشل تسجيل الدخول"); }
  };

  // تسجيل الخروج الكامل
  const logoutUser = async () => {
    try {
      await AsyncStorage.clear(); 
      setGroups([]);
      setUserData(null);
      setIsGridLayout(true);
      return true;
    } catch (e) {
      console.error("فشل تسجيل الخروج", e);
      return false;
    }
  };

  // تبديل العرض
  const toggleLayout = () => {
    setIsGridLayout(prev => !prev);
  };

  // إضافة مجموعة جديدة
  const addNewGroup = (groupName) => {
    if (!userData) return;
    const newGroup = {
      id: Date.now().toString(),
      groupName: groupName,
      color: getRandomColor(),
      createdAt: new Date().toISOString(),
      createdBy: userData.name,
      deviceId: userData.deviceId,
      items: [] 
    };
    setGroups([newGroup, ...groups]); 
  };

  // تعديل اسم مجموعة
  const editGroup = (groupId, newName) => {
    const updatedGroup = groups.map(group => {
      if (group.id === groupId) {
        return { ...group, groupName: newName };
      }
      return group;
    });
    setGroups(updatedGroup);
  };

  // حذف مجموعة
  const deleteGroup = (groupId) => {
    const filtered = groups.filter(g => g.id !== groupId);
    setGroups(filtered);
  };

  // تحديث محتوى مجموعة (عدادات)
  const updateGroup = (groupId, newItems) => {
    setGroups(prevGroups => prevGroups.map(group => {
      if (group.id === groupId) {
        return { ...group, items: newItems };
      }
      return group;
    }));
  };

  // توليد لون عشوائي
  const getRandomColor = () => {
    const colors = ['#1a237e', '#c62828', '#2e7d32', '#f9a825', '#4a148c', '#00838f'];
    return colors[Math.floor(Math.random() * colors.length)];
  };

  // ─── 8. التصدير (Export) ───
  return (
    <ProjectContext.Provider value={{ 
      // البيانات
      groups, 
      userData,
      isGridLayout,
      isLoading,

      // الوظائف
      loginUser,
      logoutUser,
      toggleLayout,
      addNewGroup, 
      deleteGroup, 
      updateGroup, // تأكدنا من تسميتها هكذا لتتوافق مع الداش بورد
      editGroup 
    }}>
      {children}
    </ProjectContext.Provider>
  );
};