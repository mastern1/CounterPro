import React, { createContext, useState, useEffect } from 'react';
import { Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// 1. إنشاء "قناة البث" التي ستسمعها كل الشاشات
export const ProjectContext = createContext();

export const ProjectProvider = ({ children }) => {
  // اسم الملف في ذاكرة الهاتف (مثل اسم المجلد في الكمبيوتر)
  const STORAGE_KEY = '@gloves_app_data_v1';

  // هذه هي "المصفوفة الأم" التي تحتوي كل المجموعات والعدادات
  const [groups, setGroups] = useState([]);

  // ─── 1. أول ما يفتح التطبيق: اقرأ من الذاكرة ───
  useEffect(() => {
    const loadData = async () => {
      try {
        const storedData = await AsyncStorage.getItem(STORAGE_KEY);
        if (storedData) {
          setGroups(JSON.parse(storedData)); // حول النص المحفوظ لبيانات حقيقية
        }
      } catch (e) {
        Alert.alert('تنبيه', 'لم نتمكن من استرجاع البيانات القديمة');
      }
    };
    loadData();
  }, []);

  // ─── 2. كلما تغيرت المجموعات: احفظ في الذاكرة ───
  useEffect(() => {
    const saveData = async () => {
      try {
        // حول البيانات لنص واحفظها في الهاتف
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(groups));
      } catch (e) {
        console.error("فشل الحفظ التلقائي");
      }
    };
    saveData();
  }, [groups]); // هذا السطر يعني: راقب "groups" وأي تغيير فيها نفذ الحفظ

  // ─── 3. الأدوات (Functions) التي ستستخدمها الشاشات ───

  // أ) إضافة مجموعة جديدة
  const addNewGroup = (groupName, workerName, deviceId) => {
    const newGroup = {
      id: Date.now().toString(),
      groupName: groupName,
      color: getRandomColor(),
      createdAt: new Date().toISOString(), // تاريخ الإنشاء
      createdBy: workerName, // ✅ هنا حفظنا اسم العامل
      deviceId: deviceId,    // ✅ وهنا رقم الجهاز
      items: [] 
    };
    setGroups([newGroup, ...groups]); 
  };

  // ب) حذف مجموعة كاملة
  const deleteGroup = (groupId) => {
    const filtered = groups.filter(g => g.id !== groupId);
    setGroups(filtered);
  };

  // ج) تحديث بيانات مجموعة (مهم جداً للعدادات)
  // هذه الدالة ستستخدمها شاشة Dashboard لتقول: "خذ يا مدير، هذه العدادات الجديدة للمجموعة الفلانية"
  const updateGroup = (groupId, newItems) => {
    setGroups(prevGroups => prevGroups.map(group => {
      if (group.id === groupId) {
        // وجدنا المجموعة، نحدث قائمة العدادات بداخلها
        return { ...group, items: newItems };
      }
      return group;
    }));
  };

  // دالة مساعدة للألوان
  const getRandomColor = () => {
    const colors = ['#1a237e', '#c62828', '#2e7d32', '#f9a825', '#4a148c', '#00838f'];
    return colors[Math.floor(Math.random() * colors.length)];
  };

  return (
    // هنا نوزع البيانات والأدوات لكل الشاشات
    <ProjectContext.Provider value={{ 
      groups, 
      addNewGroup, 
      deleteGroup, 
      updateGroup 
    }}>
      {children}
    </ProjectContext.Provider>
  );
};