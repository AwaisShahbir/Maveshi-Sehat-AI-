import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

// Screens
import WelcomeScreen from './src/screens/WelcomeScreen';
import LoginScreen from './src/screens/LoginScreen';
import RegisterScreen from './src/screens/RegisterScreen';
import VerifyScreen from './src/screens/VerifyScreen';
import DashboardScreen from './src/screens/DashboardScreen';
import VetDashboardScreen from './src/screens/VetDashboardScreen';
import HeatAlertScreen from './src/screens/HeatAlertScreen';
import VeterinariansListScreen from './src/screens/VeterinariansListScreen';
import VetConsultationsScreen from './src/screens/VetConsultationsScreen';
import ChatScreen from './src/screens/ChatScreen';

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Welcome" screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Welcome" component={WelcomeScreen} />
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Register" component={RegisterScreen} />
        <Stack.Screen name="Verify" component={VerifyScreen} />
        <Stack.Screen name="Dashboard" component={DashboardScreen} />
        <Stack.Screen name="VetDashboard" component={VetDashboardScreen} />
        <Stack.Screen name="HeatAlert" component={HeatAlertScreen} />
        <Stack.Screen name="VeterinariansList" component={VeterinariansListScreen} />
        <Stack.Screen name="VetConsultations" component={VetConsultationsScreen} />
        <Stack.Screen name="Chat" component={ChatScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
