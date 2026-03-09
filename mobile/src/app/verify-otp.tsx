import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import { ChevronLeft, Mail } from 'lucide-react-native';
import { OtpInput } from 'react-native-otp-entry';
import { authClient } from '@/lib/auth/auth-client';
import { useInvalidateSession } from '@/lib/auth/use-session';

export default function VerifyOtpScreen() {
  const { email } = useLocalSearchParams<{ email: string }>();
  const invalidateSession = useInvalidateSession();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);

  const handleVerify = async (otp: string) => {
    if (!email) return;
    setLoading(true);
    setError(null);
    const result = await authClient.signIn.emailOtp({
      email: email.trim(),
      otp,
    });
    setLoading(false);
    if (result.error) {
      setError(result.error.message ?? 'Invalid code. Please try again.');
    } else {
      await invalidateSession();
    }
  };

  const handleResend = async () => {
    if (!email || resendLoading) return;
    setResendLoading(true);
    setResendSuccess(false);
    setError(null);
    const result = await authClient.emailOtp.sendVerificationOtp({
      email: email,
      type: 'sign-in',
    });
    setResendLoading(false);
    if (result.error) {
      setError(result.error.message ?? 'Failed to resend code. Try again.');
    } else {
      setResendSuccess(true);
      setTimeout(() => setResendSuccess(false), 3000);
    }
  };

  const maskedEmail = email
    ? email.replace(/(.{2})(.*)(@.*)/, (_: string, a: string, b: string, c: string) =>
        a + b.replace(/./g, '*') + c
      )
    : '';

  return (
    <View style={{ flex: 1, backgroundColor: '#0F172A' }}>
      <SafeAreaView style={{ flex: 1 }}>
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          {/* Back button */}
          <TouchableOpacity
            onPress={() => router.back()}
            testID="back-button"
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              paddingHorizontal: 20,
              paddingVertical: 12,
            }}>
            <ChevronLeft size={22} color="#64748B" />
            <Text style={{ color: '#64748B', fontSize: 15, marginLeft: 4 }}>Back</Text>
          </TouchableOpacity>

          <View style={{ flex: 1, justifyContent: 'center', paddingHorizontal: 32 }}>
            {/* Header */}
            <View style={{ alignItems: 'center', marginBottom: 48 }}>
              <View style={{
                width: 72,
                height: 72,
                borderRadius: 20,
                backgroundColor: '#1E3A5F',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 20,
              }}>
                <Mail size={36} color="#60A5FA" />
              </View>
              <Text style={{
                color: '#F1F5F9',
                fontSize: 28,
                fontWeight: '800',
                letterSpacing: -0.5,
                marginBottom: 10,
              }}>
                Check your email
              </Text>
              <Text style={{
                color: '#64748B',
                fontSize: 15,
                textAlign: 'center',
                lineHeight: 22,
              }}>
                We sent a 6-digit code to
              </Text>
              <Text style={{
                color: '#94A3B8',
                fontSize: 15,
                fontWeight: '600',
                textAlign: 'center',
                marginTop: 4,
              }}>
                {maskedEmail}
              </Text>
            </View>

            {/* OTP Input */}
            <View style={{ marginBottom: 28 }}>
              <OtpInput
                numberOfDigits={6}
                onFilled={handleVerify}
                disabled={loading}
                theme={{
                  containerStyle: {
                    gap: 10,
                  },
                  inputsContainerStyle: {
                    gap: 10,
                  },
                  pinCodeContainerStyle: {
                    backgroundColor: '#1E293B',
                    borderColor: '#334155',
                    borderWidth: 1,
                    borderRadius: 14,
                    width: 46,
                    height: 56,
                  },
                  focusedPinCodeContainerStyle: {
                    borderColor: '#2563EB',
                    borderWidth: 2,
                  },
                  pinCodeTextStyle: {
                    color: '#F1F5F9',
                    fontSize: 22,
                    fontWeight: '700',
                  },
                  focusStickStyle: {
                    backgroundColor: '#2563EB',
                  },
                }}
              />
            </View>

            {/* Loading indicator */}
            {loading ? (
              <View style={{ alignItems: 'center', marginBottom: 16 }}>
                <ActivityIndicator color="#2563EB" size="small" />
                <Text style={{ color: '#64748B', fontSize: 13, marginTop: 8 }}>
                  Verifying...
                </Text>
              </View>
            ) : null}

            {/* Error message */}
            {error != null && (
              <View style={{
                backgroundColor: '#2D1515',
                borderRadius: 12,
                paddingVertical: 12,
                paddingHorizontal: 16,
                marginBottom: 16,
                borderWidth: 1,
                borderColor: '#7F1D1D',
              }}>
                <Text style={{ color: '#F87171', fontSize: 14, textAlign: 'center' }}>
                  {error}
                </Text>
              </View>
            )}

            {/* Resend success */}
            {resendSuccess ? (
              <View style={{
                backgroundColor: '#0D2B1A',
                borderRadius: 12,
                paddingVertical: 12,
                paddingHorizontal: 16,
                marginBottom: 16,
                borderWidth: 1,
                borderColor: '#14532D',
              }}>
                <Text style={{ color: '#4ADE80', fontSize: 14, textAlign: 'center' }}>
                  A new code has been sent to your email.
                </Text>
              </View>
            ) : null}

            {/* Resend button */}
            <View style={{ alignItems: 'center', marginTop: 8 }}>
              <Text style={{ color: '#64748B', fontSize: 14, marginBottom: 12 }}>
                Didn't receive the code?
              </Text>
              <TouchableOpacity
                onPress={handleResend}
                disabled={resendLoading}
                testID="resend-button"
                style={{
                  paddingVertical: 12,
                  paddingHorizontal: 32,
                  borderRadius: 12,
                  borderWidth: 1,
                  borderColor: '#334155',
                  backgroundColor: '#1E293B',
                  opacity: resendLoading ? 0.6 : 1,
                }}>
                {resendLoading
                  ? <ActivityIndicator color="#60A5FA" size="small" />
                  : (
                    <Text style={{ color: '#60A5FA', fontSize: 15, fontWeight: '600' }}>
                      Resend Code
                    </Text>
                  )
                }
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}
