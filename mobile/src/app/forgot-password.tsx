import React, { useState } from 'react';
import {
  View, Text, TextInput, Pressable,
  KeyboardAvoidingView, Platform, ActivityIndicator, ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Mail, ArrowLeft, CheckCircle, Lock, Eye, EyeOff } from 'lucide-react-native';

const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL as string;

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

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const [step, setStep] = useState<'email' | 'code'>('email');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSendCode = async () => {
    const trimmed = email.trim().toLowerCase();
    if (!trimmed) { setError('Please enter your email address.'); return; }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${BACKEND_URL}/api/auth/forget-password/email-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: trimmed }),
        credentials: 'include',
      });
      const data = await res.json().catch(() => ({})) as { message?: string };
      if (!res.ok) {
        setError((data as { message?: string }).message ?? 'Something went wrong. Please try again.');
      } else {
        setStep('code');
      }
    } catch {
      setError('Network error. Please check your connection.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!otp.trim()) { setError('Please enter the code from your email.'); return; }
    if (newPassword.length < 8) { setError('Password must be at least 8 characters.'); return; }
    if (newPassword !== confirmPassword) { setError('Passwords do not match.'); return; }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${BACKEND_URL}/api/auth/email-otp/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim().toLowerCase(), otp: otp.trim(), password: newPassword }),
        credentials: 'include',
      });
      const data = await res.json().catch(() => ({})) as { message?: string };
      if (!res.ok) {
        setError((data as { message?: string }).message ?? 'Invalid or expired code. Please try again.');
      } else {
        setSuccess(true);
      }
    } catch {
      setError('Network error. Please check your connection.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <View style={{ flex: 1, backgroundColor: '#0F172A' }}>
        <SafeAreaView style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 32 }}>
          <View style={{
            backgroundColor: '#0F2A1A', borderRadius: 20, padding: 32,
            borderWidth: 1, borderColor: '#166534', alignItems: 'center', gap: 16, width: '100%',
          }}>
            <CheckCircle size={56} color="#22C55E" />
            <Text style={{ color: '#86EFAC', fontSize: 22, fontWeight: '800', textAlign: 'center' }}>
              Password Reset!
            </Text>
            <Text style={{ color: '#4ADE80', fontSize: 15, textAlign: 'center', lineHeight: 22 }}>
              Your password has been updated. Sign in with your new password.
            </Text>
            <Pressable
              onPress={() => router.replace('/sign-in')}
              style={{
                backgroundColor: '#2563EB', borderRadius: 14,
                paddingVertical: 14, alignItems: 'center', width: '100%',
              }}>
              <Text style={{ color: '#fff', fontSize: 16, fontWeight: '700' }}>Sign In</Text>
            </Pressable>
          </View>
        </SafeAreaView>
      </View>
    );
  }

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

            <Pressable
              onPress={() => step === 'code' ? setStep('email') : router.back()}
              style={{ marginTop: 16, marginBottom: 32, flexDirection: 'row', alignItems: 'center', gap: 8, alignSelf: 'flex-start' }}>
              <ArrowLeft size={20} color="#60A5FA" />
              <Text style={{ color: '#60A5FA', fontSize: 15, fontWeight: '600' }}>
                {step === 'code' ? 'Back' : 'Back to Sign In'}
              </Text>
            </Pressable>

            <View style={{ alignItems: 'center', marginBottom: 32 }}>
              <View style={{
                width: 72, height: 72, borderRadius: 20,
                backgroundColor: '#1E3A5F',
                alignItems: 'center', justifyContent: 'center',
                marginBottom: 20,
              }}>
                {step === 'email' ? <Mail size={36} color="#60A5FA" /> : <Lock size={36} color="#60A5FA" />}
              </View>
              <Text style={{ color: '#F1F5F9', fontSize: 28, fontWeight: '800', letterSpacing: -0.5 }}>
                {step === 'email' ? 'Forgot Password' : 'Enter Code'}
              </Text>
              <Text style={{ color: '#64748B', fontSize: 15, marginTop: 8, textAlign: 'center', lineHeight: 22 }}>
                {step === 'email'
                  ? "Enter your email and we'll send you a reset code."
                  : `We sent a 6-digit code to\n${email.trim().toLowerCase()}`}
              </Text>
            </View>

            {step === 'email' ? (
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
                  onSubmitEditing={handleSendCode}
                  style={inputStyle}
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
                  onPress={handleSendCode}
                  disabled={loading}
                  style={{
                    backgroundColor: '#2563EB', borderRadius: 14,
                    paddingVertical: 15, alignItems: 'center', marginTop: 20,
                    opacity: loading ? 0.7 : 1,
                  }}>
                  {loading
                    ? <ActivityIndicator color="#fff" />
                    : <Text style={{ color: '#fff', fontSize: 16, fontWeight: '700' }}>Send Code</Text>
                  }
                </Pressable>
              </>
            ) : (
              <>
                <Text style={{ color: '#94A3B8', fontSize: 12, fontWeight: '600', marginBottom: 8, letterSpacing: 0.5 }}>
                  RESET CODE
                </Text>
                <TextInput
                  value={otp}
                  onChangeText={setOtp}
                  placeholder="6-digit code"
                  placeholderTextColor="#475569"
                  keyboardType="number-pad"
                  autoCapitalize="none"
                  autoCorrect={false}
                  returnKeyType="next"
                  maxLength={6}
                  style={[inputStyle, { letterSpacing: 8, fontSize: 22, textAlign: 'center' }]}
                />

                <Text style={{ color: '#94A3B8', fontSize: 12, fontWeight: '600', marginBottom: 8, marginTop: 20, letterSpacing: 0.5 }}>
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
                  />
                  <Pressable onPress={() => setShowNew(!showNew)} style={{ position: 'absolute', right: 16, top: 14 }}>
                    {showNew ? <EyeOff size={20} color="#475569" /> : <Eye size={20} color="#475569" />}
                  </Pressable>
                </View>

                <Text style={{ color: '#94A3B8', fontSize: 12, fontWeight: '600', marginBottom: 8, letterSpacing: 0.5 }}>
                  CONFIRM PASSWORD
                </Text>
                <View style={{ position: 'relative' }}>
                  <TextInput
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    placeholder="Repeat your password"
                    placeholderTextColor="#475569"
                    secureTextEntry={!showConfirm}
                    autoCapitalize="none"
                    autoCorrect={false}
                    returnKeyType="done"
                    onSubmitEditing={handleResetPassword}
                    style={[inputStyle, { paddingRight: 50 }]}
                  />
                  <Pressable onPress={() => setShowConfirm(!showConfirm)} style={{ position: 'absolute', right: 16, top: 14 }}>
                    {showConfirm ? <EyeOff size={20} color="#475569" /> : <Eye size={20} color="#475569" />}
                  </Pressable>
                </View>

                {newPassword.length > 0 && newPassword.length < 8 && (
                  <Text style={{ color: '#F87171', fontSize: 12, marginTop: 6 }}>Password must be at least 8 characters</Text>
                )}
                {newPassword.length >= 8 && confirmPassword.length > 0 && newPassword !== confirmPassword && (
                  <Text style={{ color: '#F87171', fontSize: 12, marginTop: 6 }}>Passwords do not match</Text>
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
                  onPress={handleResetPassword}
                  disabled={loading}
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

                <Pressable onPress={handleSendCode} disabled={loading} style={{ alignItems: 'center', marginTop: 16 }}>
                  <Text style={{ color: '#60A5FA', fontSize: 14 }}>Resend code</Text>
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
