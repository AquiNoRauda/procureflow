import React, { useEffect } from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';

export default function VerifyOtpScreen() {
  useEffect(() => {
    router.replace('/sign-in');
  }, []);

  return <View style={{ flex: 1, backgroundColor: '#0F172A' }} />;
}
