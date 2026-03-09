import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { authClient } from '@/lib/auth/auth-client';
import { ShoppingCart } from 'lucide-react-native';

export default function SignInScreen() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSend = async () => {
    if (!email.trim()) return;
    setLoading(true);
    setError(null);
    const result = await authClient.emailOtp.sendVerificationOtp({
      email: email.trim().toLowerCase(),
      type: 'sign-in',
    });
    setLoading(false);
    if (result.error) {
      setError(result.error.message ?? 'Failed to send code. Try again.');
    } else {
      router.push({ pathname: '/verify-otp', params: { email: email.trim().toLowerCase() } });
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#0F172A' }}>
      <SafeAreaView style={{ flex: 1 }}>
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <View style={{ flex: 1, justifyContent: 'center', paddingHorizontal: 32 }}>
            {/* Logo */}
            <View style={{ alignItems: 'center', marginBottom: 48 }}>
              <View style={{
                width: 72, height: 72, borderRadius: 20,
                backgroundColor: '#1E3A5F',
                alignItems: 'center', justifyContent: 'center',
                marginBottom: 20,
              }}>
                <ShoppingCart size={36} color="#60A5FA" />
              </View>
              <Text style={{ color: '#F1F5F9', fontSize: 30, fontWeight: '800', letterSpacing: -0.5 }}>
                Purchasing
              </Text>
              <Text style={{ color: '#64748B', fontSize: 15, marginTop: 8, textAlign: 'center', lineHeight: 22 }}>
                Sign in to sync your orders{'\n'}across all your devices
              </Text>
            </View>

            {/* Email input */}
            <Text style={{ color: '#94A3B8', fontSize: 12, fontWeight: '600', marginBottom: 8, letterSpacing: 0.5 }}>
              EMAIL ADDRESS
            </Text>
            <TextInput
              value={email}
              onChangeText={setEmail}
              placeholder="you@example.com"
              placeholderTextColor="#475569"
              autoCapitalize="none"
              keyboardType="email-address"
              autoCorrect={false}
              returnKeyType="done"
              onSubmitEditing={handleSend}
              style={{
                backgroundColor: '#1E293B',
                borderRadius: 14,
                paddingHorizontal: 16,
                paddingVertical: 14,
                fontSize: 16,
                color: '#F1F5F9',
                borderWidth: 1,
                borderColor: '#334155',
                marginBottom: 16,
              }}
            />

            {error != null && (
              <Text style={{ color: '#F87171', fontSize: 14, marginBottom: 12, textAlign: 'center' }}>
                {error}
              </Text>
            )}

            <TouchableOpacity
              onPress={handleSend}
              disabled={loading || !email.trim()}
              style={{
                backgroundColor: email.trim() ? '#2563EB' : '#1E3A5F',
                borderRadius: 14,
                paddingVertical: 15,
                alignItems: 'center',
                opacity: loading ? 0.7 : 1,
              }}>
              {loading
                ? <ActivityIndicator color="#fff" />
                : <Text style={{ color: '#fff', fontSize: 16, fontWeight: '700' }}>Send Code</Text>
              }
            </TouchableOpacity>

            <Text style={{ color: '#475569', fontSize: 13, textAlign: 'center', marginTop: 24, lineHeight: 20 }}>
              We'll send a 6-digit code to your email.{'\n'}No password needed.
            </Text>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}
