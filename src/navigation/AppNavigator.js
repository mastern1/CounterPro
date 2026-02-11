// src/navigation/AppNavigator.js
import { createNativeStackNavigator } from '@react-navigation/native-stack';

// استيراد الشاشات (تأكد أن أسماء الملفات عندك مطابقة لهذه الأسماء)
import DashboardScreen from '../screens/DashboardScreen';
import HomeScreen from '../screens/HomeScreen';
import WorkerIdentityScreen from '../screens/WorkerIdentityScreen';

const Stack = createNativeStackNavigator();

export default function AppNavigator() {
  return (
    <Stack.Navigator 
      initialRouteName="WorkerIdentity"
      screenOptions={{
        headerShown: false, // نخفي الهيدر لأننا صممنا هيدر خاص بنا
        contentStyle: { backgroundColor: '#f5f6fa' } // لون خلفية موحد للتطبيق
      }}
    >
      <Stack.Screen name="WorkerIdentity" component={WorkerIdentityScreen} />
      <Stack.Screen name="Home" component={HomeScreen} />
      <Stack.Screen name="Dashboard" component={DashboardScreen} />
    </Stack.Navigator>
  );
}