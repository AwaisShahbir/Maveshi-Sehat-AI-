import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import SplashScreen from './src/screens/shared/SplashScreen';
import WelcomeScreen from './src/screens/shared/WelcomeScreen';
import LoginScreen from './src/screens/shared/LoginScreen';
import RegisterScreen from './src/screens/shared/RegisterScreen';
import VerifyScreen from './src/screens/shared/VerifyScreen';
import DashboardScreen from './src/screens/user/DashboardScreen';
import VetDashboardScreen from './src/screens/vet/VetDashboardScreen';
import VetConsultationsScreen from './src/screens/vet/VetConsultationsScreen';
import VetCasesScreen from './src/screens/vet/VetCasesScreen';
import VetPrescriptionsScreen from './src/screens/vet/VetPrescriptionsScreen';
import VetHealthRecordsScreen from './src/screens/vet/VetHealthRecordsScreen';
import VetProfileScreen from './src/screens/vet/VetProfileScreen';
import VetNotificationCenterScreen from './src/screens/vet/VetNotificationCenterScreen';
import HeatAlertScreen from './src/screens/user/HeatAlertScreen';
import VeterinariansListScreen from './src/screens/user/VeterinariansListScreen';
import MyConsultationsScreen from './src/screens/user/MyConsultationsScreen';
import ChatScreen from './src/screens/shared/ChatScreen';
import CommunityForumScreen from './src/screens/user/CommunityForumScreen';
import ForumPostDetailScreen from './src/screens/user/ForumPostDetailScreen';
import AiScanScreen from './src/screens/user/AiScanScreen';
import HealthRecordsScreen from './src/screens/user/HealthRecordsScreen';
import ProfileScreen from './src/screens/user/ProfileScreen';
import MarketplaceScreen from './src/screens/user/MarketplaceScreen';
import CartScreen from './src/screens/user/CartScreen';
import VaccinationScreen from './src/screens/user/VaccinationScreen';

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Splash" screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Splash" component={SplashScreen} />
        <Stack.Screen name="Welcome" component={WelcomeScreen} />
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Register" component={RegisterScreen} />
        <Stack.Screen name="Verify" component={VerifyScreen} />
        <Stack.Screen name="Dashboard" component={DashboardScreen} />
        <Stack.Screen name="AiScan" component={AiScanScreen} />
        <Stack.Screen name="HealthRecords" component={HealthRecordsScreen} />
        <Stack.Screen name="Vaccination" component={VaccinationScreen} />
        <Stack.Screen name="Profile" component={ProfileScreen} />
        <Stack.Screen name="Marketplace" component={MarketplaceScreen} />
        <Stack.Screen name="Cart" component={CartScreen} />
        <Stack.Screen name="VetDashboard" component={VetDashboardScreen} />
        <Stack.Screen name="HeatAlert" component={HeatAlertScreen} />
        <Stack.Screen name="VeterinariansList" component={VeterinariansListScreen} />
        <Stack.Screen name="VetConsultations" component={VetConsultationsScreen} />
        <Stack.Screen name="VetCases" component={VetCasesScreen} />
        <Stack.Screen name="VetPrescriptions" component={VetPrescriptionsScreen} />
        <Stack.Screen name="VetHealthRecords" component={VetHealthRecordsScreen} />
        <Stack.Screen name="VetProfile" component={VetProfileScreen} />
        <Stack.Screen name="VetNotificationCenter" component={VetNotificationCenterScreen} />
        <Stack.Screen name="MyConsultations" component={MyConsultationsScreen} />
        <Stack.Screen name="Chat" component={ChatScreen} />
        <Stack.Screen name="CommunityForum" component={CommunityForumScreen} />
        <Stack.Screen name="ForumPostDetail" component={ForumPostDetailScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
