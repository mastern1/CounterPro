import React, { useState, useEffect, useRef } from "react";
import { View, Text, TouchableOpacity, StyleSheet, Alert } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";

const SessionTimer = ({ onStart, onStop }) => {
  const [isActive, setIsActive] = useState(false); // هل الجلسة شغالة؟
  const [isPaused, setIsPaused] = useState(false); // هل هي في وضع إيقاف مؤقت؟
  const [seconds, setSeconds] = useState(0); // عداد الثواني

  const intervalRef = useRef(null);

  // 🕒 منطق العداد (القلب النابض)
  useEffect(() => {
    if (isActive && !isPaused) {
      intervalRef.current = setInterval(() => {
        setSeconds((prev) => prev + 1);
      }, 1000);
    } else {
      clearInterval(intervalRef.current);
    }

    return () => clearInterval(intervalRef.current);
  }, [isActive, isPaused]);

  // 🛠️ تحويل الثواني إلى تنسيق HH:MM:SS
  const formatTime = (totalSeconds) => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;

    // إضافة صفر على اليسار إذا كان الرقم أقل من 10
    const pad = (num) => num.toString().padStart(2, "0");
    return `${pad(hours)}:${pad(minutes)}:${pad(secs)}`;
  };

  // ▶️ دالة بدء الجلسة
  const handleStart = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    Alert.alert(
      "Start New Session",
      "Are you sure you want to start counting?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Start",
          onPress: () => {
            setIsActive(true);
            setIsPaused(false);
            if (onStart) onStart(); // تبليغ الأب
          },
        },
      ]
    );
  };

  // ⏸️ دالة الإيقاف المؤقت / الاستئناف
  const togglePause = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setIsPaused(!isPaused);
  };

  // ⏹️ دالة إنهاء الجلسة
  const handleStop = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    Alert.alert("End Session", "Finish this session and save logs?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "End & Save",
        style: "destructive",
        onPress: () => {
          setIsActive(false);
          setSeconds(0);
          if (onStop) onStop(seconds); // إرسال الوقت النهائي للأب ليحفظه
        },
      },
    ]);
  };

  // --- 1. الحالة الأولى: الجلسة لم تبدأ بعد (زر كبير) ---
  if (!isActive) {
    return (
      <View style={styles.startContainer}>
        <TouchableOpacity style={styles.startButton} onPress={handleStart}>
          <Ionicons name="play" size={24} color="#FFF" />
          <Text style={styles.startText}>Start New Session</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // --- 2. الحالة الثانية: الجلسة تعمل (شريط المؤقت) ---
  return (
    <View style={styles.timerBar}>
      {/* ⏰ الجهة اليسرى: الوقت */}
      <View style={styles.timeContainer}>
        <Ionicons name="timer-outline" size={24} color="#0D47A1" />
        <Text style={styles.digitalClock}>{formatTime(seconds)}</Text>
      </View>

      {/* 🎮 الجهة اليمنى: أزرار التحكم */}
      <View style={styles.controlsContainer}>
        {/* زر Pause/Resume */}
        <TouchableOpacity
          style={[styles.circleButton, { backgroundColor: "#FF9800" }]}
          onPress={togglePause}
        >
          <Ionicons name={isPaused ? "play" : "pause"} size={22} color="#FFF" />
        </TouchableOpacity>

        {/* زر Stop */}
        <TouchableOpacity
          style={[styles.circleButton, { backgroundColor: "#F44336" }]}
          onPress={handleStop}
        >
          <Ionicons name="stop" size={22} color="#FFF" />
        </TouchableOpacity>
      </View>
    </View>
  );
};

// 🎨 الستايلات (Nano Banana Pro Style) 🍌✨
const styles = StyleSheet.create({
  // ستايل زر البدء الكبير
  startContainer: {
    padding: 10,
    alignItems: "center",
    marginBottom: 5,
  },
  startButton: {
    flexDirection: "row",
    backgroundColor: "#4CAF50", // أخضر للبداية
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 30,
    alignItems: "center",
    gap: 8,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
  },
  startText: {
    color: "#FFF",
    fontWeight: "bold",
    fontSize: 16,
  },

  // ستايل شريط المؤقت (الكيكة الطبقة الوسطى)
  timerBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#E3F2FD", // أزرق سماوي فاتح جداً
    borderRadius: 16,
    paddingVertical: 10,
    paddingHorizontal: 16,
    marginHorizontal: 12,
    marginBottom: 10, // مسافة تفصله عن الكروت تحته
    borderWidth: 1,
    borderColor: "#BBDEFB",
    // ظلال خفيفة
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  timeContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  digitalClock: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#0D47A1", // أزرق غامق للأرقام
    fontVariant: ["tabular-nums"], // يجعل عرض الأرقام ثابتاً كي لا تهتز
    letterSpacing: 1,
  },
  controlsContainer: {
    flexDirection: "row",
    gap: 12,
  },
  circleButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
});

export default SessionTimer;
