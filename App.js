// prettier-ignore
import 'react-native-gesture-handler'; // 👈 لازم يكون أول سطر
import { NavigationContainer } from "@react-navigation/native";
import { StatusBar } from "expo-status-bar";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
// استيراد المخ (البيانات)
import { ProjectProvider } from "./src/context/ProjectContext";
// استيراد مدير الحركة (الذي فصلناه)
import AppNavigator from "./src/navigation/AppNavigator";
// استيراد الألوان عشان الـ StatusBar
import { COLORS } from "./src/constants/colors";
export default function App() {
  return (
    // 1. نظام الحركات
    <GestureHandlerRootView style={{ flex: 1 }}>
      {/* 2. حماية الحواف والنوتش */}
      <SafeAreaProvider>
        {/* 3. مزود البيانات (المخ) */}
        <ProjectProvider>
          {/* 4. حاوية التنقل */}
          <NavigationContainer>
            {/* شريط الحالة: نلونه بلون الهيدر ليصبح التطبيق قطعة واحدة */}
            <StatusBar style="light" backgroundColor={COLORS.primary} />

            {/* 👈 هنا نستدعي ملف النافيجيشن المفصول */}
            <AppNavigator />
          </NavigationContainer>
        </ProjectProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
