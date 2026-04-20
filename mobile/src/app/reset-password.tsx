import React, { useState } from 'react';
import {
  View, Text, TextInput, Pressable,
  KeyboardAvoidingView, Platform, ActivityIndicator, ScrollView, useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { authClient } from '@/lib/auth/auth-client';
import { Lock, Eye, EyeOff, CheckCircle } from 'lucide-react-native';

export default function ResetPasswordScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const isDesktop = width >= 768;
  const { token } = useLocalSearchParams<{ token?: string }>();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleReset = async () => {
    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    if (!token) {
      setError('Invalid or missing reset token. Please request a new reset link.');
      return;
    }
    setLoading(true);
    setError(null);
    const result = await authClient.resetPassword({
      newPassword,
      token,
    });
    setLoading(false);
    if (result?.error) {
      setError(result.error.message ?? 'Failed to reset password. The link may have expired.');
    } else {
      setSuccess(true);
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

  if (success) {
    return (
      <View style={{ flex: 1, backgroundColor: '#0F172A' }}>
        <SafeAreaView style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 32 }}>
          <View style={{
            backgroundColor: '#0F2A1A', borderRadius: 20, padding: 32,
            borderWidth: 1, borderColor: '#166534', alignItems: 'center', gap: 16,
            width: isDesktop ? 420 : '100%',
          }}>
            <CheckCircle size={56} color="#22C55E" />
            <Text style={{ color: '#86EFAC', fontSize: 22, fontWeight: '800', textAlign: 'center' }}>
              Password Reset!
            </Text>
            <Text style={{ color: '#4ADE80', fontSize: 15, textAlign: 'center', lineHeight: 22 }}>
              Your password has been successfully updated. You can now sign in with your new password.
            </Text>
            <Pressable
              onPress={() => router.replace('/sign-in')}
              testID="go-to-signin-button"
              style={{
                backgroundColor: '#2563EB', borderRadius: 14,
                paddingVertical: 14, paddingHorizontal: 32, alignItems: 'center', width: '100%',
              }}>
              <Text style={{ color: '#fff', fontSize: 16, fontWeight: '700' }}>Back to Sign In</Text>
            </Pressable>
          </View>
        </SafeAreaView>
      </View>
    );
  }

  const formContent = (
    <>
      {/* Back button */}
      <Pressable
        onPress={() => router.replace('/sign-in')}
        testID="back-button"
        style={{ marginTop: 16, marginBottom: 32, alignSelf: 'flex-start' }}>
        <Text style={{ color: '#60A5FA', fontSize: 15, fontWeight: '600' }}>Back to Sign In</Text>
      </Pressable>

      {/* Icon */}
      <View style={{ alignItems: 'center', marginBottom: 36 }}>
        <View style={{
          width: 72, height: 72, borderRadius: 20,
          backgroundColor: '#1E3A5F',
          alignItems: 'center', justifyContent: 'center',
          marginBottom: 20,
        }}>
          <Lock size={36} color="#60A5FA" />
        </View>
        <Text style={{ color: '#F1F5F9', fontSize: 28, fontWeight: '800', letterSpacing: -0.5 }}>
          New Password
        </Text>
        <Text style={{ color: '#64748B', fontSize: 15, marginTop: 8, textAlign: 'center' }}>
          Create a strong password for your account.
        </Text>
      </View>

      {/* New Password */}
      <Text style={{ color: '#94A3B8', fontSize: 12, fontWeight: '600', marginBottom: 8, letterSpacing: 0.5 }}>
        NEW PASSWORD
      </Text>
      <View style={{ position: 'relative', marginBottom: 16 }}>
        <TextInput
          value={newPassword}
          onChangeText={setNewPassword}
          placeholder="At least 8 characters"
          placeholderTextColor="#475569"
          secureTextEntry={!showNew}
          autoCapitalize="none"
          autoCorrect={false}
          returnKeyType="next"
          style={[inputStyle, { paddingRight: 50 }]}
          testID="new-password-input"
        />
        <Pressable
          onPress={() => setShowNew(!showNew)}
          style={{ position: 'absolute', right: 16, top: 14 }}>
          {showNew
            ? <EyeOff size={20} color="#475569" />
            : <Eye size={20} color="#475569" />}
        </Pressable>
      </View>

      {/* Confirm Password */}
      <Text style={{ color: '#94A3B8', fontSize: 12, fontWeight: '600', marginBottom: 8, letterSpacing: 0.5 }}>
        CONFIRM PASSWORD
      </Text>
      <View style={{ position: 'relative', marginBottom: 4 }}>
        <TextInput
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          placeholder="Repeat your password"
          placeholderTextColor="#475569"
          secureTextEntry={!showConfirm}
          autoCapitalize="none"
          autoCorrect={false}
          returnKeyType="done"
          onSubmitEditing={handleReset}
          style={[inputStyle, { paddingRight: 50 }]}
          testID="confirm-password-input"
        />
        <Pressable
          onPress={() => setShowConfirm(!showConfirm)}
          style={{ position: 'absolute', right: 16, top: 14 }}>
          {showConfirm
            ? <EyeOff size={20} color="#475569" />
            : <Eye size={20} color="#475569" />}
        </Pressable>
      </View>

      {/* Validation hint */}
      {newPassword.length > 0 && newPassword.length < 8 && (
        <Text style={{ color: '#F87171', fontSize: 12, marginTop: 6, marginBottom: 4 }}>
          Password must be at least 8 characters
        </Text>
      )}
      {newPassword.length >= 8 && confirmPassword.length > 0 && newPassword !== confirmPassword && (
        <Text style={{ color: '#F87171', fontSize: 12, marginTop: 6, marginBottom: 4 }}>
          Passwords do not match
        </Text>
      )}

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
        onPress={handleReset}
        disabled={loading}
        testID="reset-password-button"
        style={{
          backgroundColor: '#2563EB', borderRadius: 14,
          paddingVertical: 15, alignItems: 'center', marginTop: 20,
          opacity: loading ? 0.7 : 1,
        }}>
        {loading
          ? <ActivityIndicator color="#fff" />
          : <Text style={{ color: '#fff', fontSize: 16, fontWeight: '700' }}>Reset Password</Text>
        }
      </Pressable>

      <View style={{ height: 40 }} />
    </>
  );

  return (
    <View style={{ flex: 1, backgroundColor: '#0F172A' }}>
      <SafeAreaView style={{ flex: 1 }}>
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <ScrollView
            contentContainerStyle={{
              flexGrow: 1,
              alignItems: isDesktop ? 'center' : undefined,
              justifyContent: isDesktop ? 'center' : undefined,
              paddingHorizontal: isDesktop ? 0 : 24,
            }}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}>
            {isDesktop ? (
              <View style={{
                width: 420,
                backgroundColor: '#1E293B',
                borderRadius: 24,
                padding: 32,
                borderWidth: 1,
                borderColor: '#334155',
              }}>
                {formContent}
              </View>
            ) : formContent}
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}
