import 'react-native-gesture-handler'; 

import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

// استيراد الشاشات
import WorkerIdentityScreen from './src/screens/WorkerIdentityScreen';
import DashboardScreen from './src/screens/DashboardScreen';
import HomeScreen from './src/screens/HomeScreen';

// 🔌 1. استيراد "المخ" (المزود) الذي أنشأناه للتو
import { ProjectProvider } from './src/context/ProjectContext';

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        
        {/* 🧠 2. تغليف التطبيق كاملاً بالمزود لكي تصل البيانات للجميع */}
        <ProjectProvider>
          
          <NavigationContainer>
            <Stack.Navigator 
              initialRouteName="WorkerIdentity"
              screenOptions={{ headerShown: false }}
            >
              
              {/* شاشات التطبيق */}
              <Stack.Screen name="WorkerIdentity" component={WorkerIdentityScreen} />
              <Stack.Screen name="Home" component={HomeScreen} />
              <Stack.Screen name="Dashboard" component={DashboardScreen} />

            </Stack.Navigator>
          </NavigationContainer>

        </ProjectProvider>
        {/* نهاية التغليف */}

      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
};