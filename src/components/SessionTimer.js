import React, {
  useState,
  useEffect,
  useRef,
  forwardRef,
  useImperativeHandle,
  useCallback, // ✅ أضفنا استيراد useCallback
} from "react";
import { View, Text, TouchableOpacity, StyleSheet, Alert } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";

const SessionTimer = forwardRef(({ onStart, onStop }, ref) => {
  // 🎯 State
  const [isActive, setIsActive] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [seconds, setSeconds] = useState(0);

  // 🎯 Refs (للحفاظ على القيم بدقة عالية)
  const intervalRef = useRef(null);
  const startTimeRef = useRef(null);
  const pausedTimeRef = useRef(0);
  const pauseStartRef = useRef(null);

  // 🛑 دالة الإيقاف المركزية (مغلفة بـ useCallback لضمان ثباتها)
  const performStop = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);

    // ✅ تم التعديل: حساب الوقت النهائي بناءً على Date.now فقط (بدون الاعتماد على state المتغير)
    let finalSeconds = 0;

    if (startTimeRef.current) {
      const now = Date.now();
      let totalPaused = pausedTimeRef.current;

      if (pauseStartRef.current) {
        totalPaused += now - pauseStartRef.current;
      }

      finalSeconds = Math.floor(
        (now - startTimeRef.current - totalPaused) / 1000,
      );
    }

    // إرسال النتيجة للأب
    if (onStop) onStop(finalSeconds);

    // تصفير كل شيء
    setIsActive(false);
    setIsPaused(false);
    setSeconds(0);
    startTimeRef.current = null;
    pausedTimeRef.current = 0;
    pauseStartRef.current = null;
  }, [onStop]); // تعتمد فقط على onStop

  // 🔗 فتح قناة الاتصال مع الأب (Dashboard)
  useImperativeHandle(
    ref,
    () => ({
      isSessionActive: () => isActive,
      requestStop: () => {
        performStop();
      },
    }),
    [isActive, performStop], // ✅ المصفوفة الآن صحيحة 100% وخالية من الأخطاء
  );

  // 🕒 العداد (يعمل فقط للعرض، الحساب الفعلي يعتمد على Date.now)
  useEffect(() => {
    if (isActive && !isPaused) {
      intervalRef.current = setInterval(() => {
        if (!startTimeRef.current) return;
        const now = Date.now();
        const elapsed = Math.floor(
          (now - startTimeRef.current - pausedTimeRef.current) / 1000,
        );
        setSeconds(elapsed);
      }, 500);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isActive, isPaused]);

  // تنسيق الوقت
  const formatTime = (totalSeconds) => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;
    const pad = (num) => num.toString().padStart(2, "0");
    return `${pad(hours)}:${pad(minutes)}:${pad(secs)}`;
  };

  // ▶️ زر البدء
  const handleStartPress = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    Alert.alert("Start Session", "Ready to start counting?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Start",
        onPress: () => {
          startTimeRef.current = Date.now();
          pausedTimeRef.current = 0;
          pauseStartRef.current = null;
          setIsActive(true);
          setIsPaused(false);
          setSeconds(0);
          if (onStart) onStart();
        },
      },
    ]);
  };

  // ⏸️ زر التوقف المؤقت
  const togglePause = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (!isPaused) {
      pauseStartRef.current = Date.now();
      setIsPaused(true);
    } else {
      if (pauseStartRef.current) {
        pausedTimeRef.current += Date.now() - pauseStartRef.current;
        pauseStartRef.current = null;
      }
      setIsPaused(false);
    }
  };

  // ⏹️ زر الإنهاء (من المستخدم)
  const handleStopPress = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    Alert.alert("End Session", "Finish and save logs?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "End & Save",
        style: "destructive",
        onPress: () => {
          performStop();
        },
      },
    ]);
  };

  // --- الواجهة ---
  if (!isActive) {
    return (
      <View style={styles.startContainer}>
        <TouchableOpacity style={styles.startButton} onPress={handleStartPress}>
          <Ionicons
            name="play"
            size={24}
            color="#FFF"
            style={{ marginRight: 8 }}
          />
          <Text style={styles.startText}>Start New Session</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.timerBar}>
      <View style={styles.timeContainer}>
        <Ionicons
          name={isPaused ? "pause-circle-outline" : "timer-outline"}
          size={24}
          color={isPaused ? "#FF9800" : "#0D47A1"}
        />
        <Text
          style={[styles.digitalClock, isPaused && styles.digitalClockPaused]}
        >
          {formatTime(seconds)}
        </Text>
        {isPaused && <Text style={styles.pausedLabel}>PAUSED</Text>}
      </View>

      <View style={styles.controlsContainer}>
        <TouchableOpacity
          style={[styles.circleButton, { backgroundColor: "#FF9800" }]}
          onPress={togglePause}
        >
          <Ionicons name={isPaused ? "play" : "pause"} size={22} color="#FFF" />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.circleButton, { backgroundColor: "#F44336" }]}
          onPress={handleStopPress}
        >
          <Ionicons name="stop" size={22} color="#FFF" />
        </TouchableOpacity>
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  startContainer: { alignItems: "center", marginBottom: 5, marginTop: 5 },
  startButton: {
    flexDirection: "row",
    backgroundColor: "#4CAF50",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 25,
    alignItems: "center",
    elevation: 3,
  },
  startText: { color: "#FFF", fontWeight: "bold", fontSize: 16 },
  timerBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#E3F2FD",
    borderRadius: 16,
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginHorizontal: 12,
    marginBottom: 10,
    marginTop: 5,
    borderWidth: 1,
    borderColor: "#BBDEFB",
    elevation: 2,
  },
  timeContainer: { flexDirection: "row", alignItems: "center", gap: 8 },
  digitalClock: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#0D47A1",
    fontVariant: ["tabular-nums"],
  },
  digitalClockPaused: { color: "#FF9800" },
  pausedLabel: {
    fontSize: 10,
    fontWeight: "bold",
    color: "#FF9800",
    marginLeft: 4,
  },
  controlsContainer: { flexDirection: "row", gap: 10 },
  circleButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    elevation: 2,
  },
});

SessionTimer.displayName = "SessionTimer";

export default React.memo(SessionTimer);
