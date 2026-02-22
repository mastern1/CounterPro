import * as Device from "expo-device";
import { useContext, useEffect, useState, useMemo } from "react"; // ✅ إضافة useMemo
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { TEXTS } from "../constants/translations";
import { ProjectContext } from "../context/ProjectContext";

const WorkerIdentityScreen = ({ navigation }) => {
  const { loginUser, userData, isLoading } = useContext(ProjectContext);
  const [workerName, setWorkerName] = useState("");

  // ✅ تحسين الأداء: حساب اسم الجهاز مرة واحدة فقط
  const deviceId = useMemo(() => {
    if (Device.modelName && Device.brand) {
      const brand =
        Device.brand.charAt(0).toUpperCase() +
        Device.brand.slice(1).toLowerCase();
      return `${brand} ${Device.modelName}`;
    }
    return (
      Device.modelName || (Platform.OS === "ios" ? "iPhone" : "Generic Android")
    );
  }, []); // [] تعني: احسبها مرة واحدة عند البداية ولا تكررها أبداً

  useEffect(() => {
    if (!isLoading && userData) {
      navigation.replace("Home");
    }
  }, [userData, isLoading, navigation]);

  const handleStartWork = async () => {
    if (workerName.trim().length === 0) {
      Alert.alert(TEXTS.alertError, TEXTS.alertName);
      return;
    }
    await loginUser(workerName, deviceId);
  };

  if (isLoading) {
    return (
      <View
        style={[
          styles.container,
          { justifyContent: "center", alignItems: "center" },
        ]}
      >
        <Text style={{ fontSize: 80, marginBottom: 20 }}>📦</Text>
        <ActivityIndicator size="large" color="#ffffff" />
        <Text style={{ color: "rgba(255,255,255,0.7)", marginTop: 20 }}>
          Loading ...
        </Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.content}
      >
        <View style={styles.logoContainer}>
          {/* ✅ إصلاح أندرويد 8: النصوص الكبيرة */}
          <Text style={styles.logoText} adjustsFontSizeToFit numberOfLines={1}>
            📦
          </Text>
          <Text style={styles.appName} adjustsFontSizeToFit numberOfLines={1}>
            {TEXTS.welcomeTitle}
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.label} adjustsFontSizeToFit numberOfLines={1}>
            {TEXTS.welcomeUser}
          </Text>
          <Text style={styles.subLabel}>{TEXTS.enterName}</Text>

          <TextInput
            style={styles.input}
            placeholder={TEXTS.namePlaceholder}
            value={workerName}
            onChangeText={setWorkerName}
            placeholderTextColor="#999"
          />

          <TouchableOpacity style={styles.button} onPress={handleStartWork}>
            <Text style={styles.buttonText}>{TEXTS.startButton}</Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.footerText}>Counters Pro v1.0 | {deviceId}</Text>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#1a237e" },
  content: { flex: 1, justifyContent: "center", padding: 20 },
  logoContainer: { alignItems: "center", marginBottom: 40, width: "100%" },

  // 👇 ستايلات أندرويد 8 الخاصة
  logoText: {
    fontSize: 80,
    marginBottom: 10,
    textAlign: "center",
    height: 100,
    includeFontPadding: false,
    textAlignVertical: "center",
  },
  appName: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#fff",
    textAlign: "center",
    width: "100%",
  },

  card: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 30,
    elevation: 10,
  },
  label: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 5,
    textAlign: "center",
    width: "100%",
  },
  subLabel: {
    fontSize: 14,
    color: "#666",
    marginBottom: 25,
    textAlign: "center",
  },
  input: {
    backgroundColor: "#f5f5f5",
    borderRadius: 12,
    padding: 15,
    fontSize: 16,
    textAlign: "center",
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#eee",
  },
  button: {
    backgroundColor: "#2e7d32",
    padding: 18,
    borderRadius: 12,
    alignItems: "center",
  },
  buttonText: { color: "#fff", fontSize: 18, fontWeight: "bold" },
  footerText: {
    textAlign: "center",
    color: "rgba(255,255,255,0.5)",
    marginTop: 30,
    fontSize: 12,
  },
});

export default WorkerIdentityScreen;
