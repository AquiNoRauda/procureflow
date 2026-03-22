import React, { useState } from 'react';
import {
  View, Text, TextInput, Pressable,
  KeyboardAvoidingView, Platform, ActivityIndicator, ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { authClient } from '@/lib/auth/auth-client';
import { Mail, ArrowLeft, CheckCircle } from 'lucide-react-native';

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  const handleSend = async () => {
    const trimmed = email.trim().toLowerCase();
    if (!trimmed) {
      setError('Please enter your email address.');
      return;
    }
    setLoading(true);
    setError(null);
    const result = await authClient.requestPasswordReset({
      email: trimmed,
      redirectTo: 'vibecode://reset-password',
    });
    setLoading(false);
    if (result?.error) {
      setError(result.error.message ?? 'Something went wrong. Please try again.');
    } else {
      setSent(true);
    }
  };

  const inputStyle = {
    backgroundColor: '#1E293B',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#334155',
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#0F172A' }}>
      <SafeAreaView style={{ flex: 1 }}>
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <ScrollView
            contentContainerStyle={{ flexGrow: 1, paddingHorizontal: 24 }}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}>

            {/* Back button */}
            <Pressable
              onPress={() => router.back()}
              testID="back-button"
              style={{ marginTop: 16, marginBottom: 32, flexDirection: 'row', alignItems: 'center', gap: 8, alignSelf: 'flex-start' }}>
              <ArrowLeft size={20} color="#60A5FA" />
              <Text style={{ color: '#60A5FA', fontSize: 15, fontWeight: '600' }}>Back to Sign In</Text>
            </Pressable>

            {/* Icon */}
            <View style={{ alignItems: 'center', marginBottom: 32 }}>
              <View style={{
                width: 72, height: 72, borderRadius: 20,
                backgroundColor: '#1E3A5F',
                alignItems: 'center', justifyContent: 'center',
                marginBottom: 20,
              }}>
                <Mail size={36} color="#60A5FA" />
              </View>
              <Text style={{ color: '#F1F5F9', fontSize: 28, fontWeight: '800', letterSpacing: -0.5 }}>
                Forgot Password
              </Text>
              <Text style={{ color: '#64748B', fontSize: 15, marginTop: 8, textAlign: 'center', lineHeight: 22 }}>
                Enter your email and we'll send you a link to reset your password.
              </Text>
            </View>

            {sent ? (
              /* Success state */
              <View style={{
                backgroundColor: '#0F2A1A',
                borderRadius: 16, padding: 24,
                borderWidth: 1, borderColor: '#166534',
                alignItems: 'center', gap: 12,
              }}>
                <CheckCircle size={40} color="#22C55E" />
                <Text style={{ color: '#86EFAC', fontSize: 18, fontWeight: '700', textAlign: 'center' }}>
                  Check Your Email
                </Text>
                <Text style={{ color: '#4ADE80', fontSize: 14, textAlign: 'center', lineHeight: 21 }}>
                  We sent a password reset link to{'\n'}
                  <Text style={{ fontWeight: '700' }}>{email.trim().toLowerCase()}</Text>
                </Text>
                <Text style={{ color: '#64748B', fontSize: 13, textAlign: 'center', marginTop: 4 }}>
                  Tap the link in the email to create a new password.
                </Text>
              </View>
            ) : (
              /* Form */
              <>
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
                  style={inputStyle}
                  testID="email-input"
                />

                {error != null && (
                  <View style={{
                    backgroundColor: '#2D1515', borderRadius: 12,
                    paddingVertical: 12, paddingHorizontal: 16,
                    marginTop: 12, borderWidth: 1, borderColor: '#7F1D1D',
                  }}>
                    <Text style={{ color: '#F87171', fontSize: 14, textAlign: 'center' }}>{error}</Text>
                  </View>
                )}

                <Pressable
                  onPress={handleSend}
                  disabled={loading}
                  testID="send-reset-button"
                  style={{
                    backgroundColor: '#2563EB', borderRadius: 14,
                    paddingVertical: 15, alignItems: 'center', marginTop: 20,
                    opacity: loading ? 0.7 : 1,
                  }}>
                  {loading
                    ? <ActivityIndicator color="#fff" />
                    : <Text style={{ color: '#fff', fontSize: 16, fontWeight: '700' }}>Send Reset Link</Text>
                  }
                </Pressable>
              </>
            )}

            <View style={{ height: 40 }} />
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}
