// prettier-ignore
import 'react-native-gesture-handler'; // Mandatory first line so gesture handling boots correctly
import { NavigationContainer, DarkTheme } from "@react-navigation/native";
import { StatusBar } from "expo-status-bar";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";

// Context and navigation
import { ProjectProvider } from "./src/context/ProjectContext";
import AppNavigator from "./src/navigation/AppNavigator";
import { COLORS } from "./src/constants/colors";

// Dark navigation theme so the layer behind screens doesn't flash white during transitions
const navTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    background: COLORS.background,
    card: COLORS.surface,
  },
};

export default function App() {
  // Note: this can log twice in the console in Dev Mode because of React 19 — that's expected.
  console.log("🦅 Is Hermes Running?", !!global.HermesInternal);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ProjectProvider>
          <NavigationContainer theme={navTheme}>
            <StatusBar style="light" backgroundColor={COLORS.primary} />
            <AppNavigator />
          </NavigationContainer>
        </ProjectProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
