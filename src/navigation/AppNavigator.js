// src/navigation/AppNavigator.js
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { COLORS } from '../constants/colors';
// Screens (make sure these file names match exactly)
import DashboardScreen from '../screens/DashboardScreen';
import HomeScreen from '../screens/HomeScreen';
import WorkerIdentityScreen from '../screens/WorkerIdentityScreen';

const Stack = createNativeStackNavigator();

export default function AppNavigator() {
  return (
    <Stack.Navigator
      initialRouteName="WorkerIdentity"
      screenOptions={{
        headerShown: false, // Hidden because each screen renders its own header
        contentStyle: { backgroundColor: COLORS.background } // Unified dark background
      }}
    >
      <Stack.Screen name="WorkerIdentity" component={WorkerIdentityScreen} />
      <Stack.Screen name="Home" component={HomeScreen} />
      <Stack.Screen name="Dashboard" component={DashboardScreen} />
    </Stack.Navigator>
  );
}
