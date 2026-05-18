import React from 'react';
import { View, StyleSheet, SafeAreaView, StatusBar } from 'react-native';
import { useRouter } from 'expo-router';

// Components
import WelcomeHeader from '../components/WelcomeHeader';
import Button from '../components/Button';

export default function WelcomeScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#58D66D" />
      
      <View style={styles.container}>
        {/* Extracted Header Component */}
        <WelcomeHeader />

        {/* Extracted Button Components */}
        <View style={styles.bottomContainer}>
          <Button 
            title="لاگ ان / Login" 
            variant="white" 
            onPress={() => router.push('/login')} 
          />
          <Button 
            title="رجسٹر کریں / Register" 
            variant="yellow" 
            onPress={() => router.push('/register')} 
          />
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#58D66D', // Modern Neon Green
  },
  container: {
    flex: 1,
    justifyContent: 'space-between',
    paddingHorizontal: 24, // Explicit left and right margin
  },
  bottomContainer: {
    paddingBottom: 32,
  },
});
