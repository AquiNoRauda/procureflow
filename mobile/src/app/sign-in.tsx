import React, { useState } from 'react';
import {
  View, Text, TextInput, Pressable,
  KeyboardAvoidingView, Platform, ActivityIndicator, ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { authClient } from '@/lib/auth/auth-client';
import { useInvalidateSession } from '@/lib/auth/use-session';
import { ShoppingCart, Eye, EyeOff } from 'lucide-react-native';

export default function SignInScreen() {
  const router = useRouter();
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const invalidateSession = useInvalidateSession();

  const handleSubmit = async () => {
    if (!email.trim() || !password.trim()) return;
    if (mode === 'signup' && !name.trim()) return;
    setLoading(true);
    setError(null);

    if (mode === 'signin') {
      const result = await authClient.signIn.email({
        email: email.trim().toLowerCase(),
        password,
      });
      if (result.error) {
        setError(result.error.message ?? 'Invalid email or password.');
      } else {
        await invalidateSession();
      }
    } else {
      const result = await authClient.signUp.email({
        email: email.trim().toLowerCase(),
        password,
        name: name.trim(),
      });
      if (result.error) {
        setError(result.error.message ?? 'Could not create account. Try again.');
      } else {
        await invalidateSession();
      }
    }
    setLoading(false);
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
    marginBottom: 12,
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#0F172A' }}>
      <SafeAreaView style={{ flex: 1 }}>
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <ScrollView
            contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', paddingHorizontal: 32 }}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}>

            {/* Logo */}
            <View style={{ alignItems: 'center', marginBottom: 40 }}>
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
              <Text style={{ color: '#64748B', fontSize: 15, marginTop: 8, textAlign: 'center' }}>
                {mode === 'signin' ? 'Welcome back' : 'Create your account'}
              </Text>
            </View>

            {/* Mode toggle */}
            <View style={{
              flexDirection: 'row',
              backgroundColor: '#1E293B',
              borderRadius: 14,
              padding: 4,
              marginBottom: 28,
            }}>
              {(['signin', 'signup'] as const).map((m) => (
                <Pressable
                  key={m}
                  onPress={() => { setMode(m); setError(null); }}
                  style={{
                    flex: 1, paddingVertical: 10, borderRadius: 11,
                    alignItems: 'center',
                    backgroundColor: mode === m ? '#2563EB' : 'transparent',
                  }}>
                  <Text style={{
                    color: mode === m ? '#fff' : '#64748B',
                    fontWeight: '700', fontSize: 14,
                  }}>
                    {m === 'signin' ? 'Sign In' : 'Create Account'}
                  </Text>
                </Pressable>
              ))}
            </View>

            {/* Name (signup only) */}
            {mode === 'signup' && (
              <>
                <Text style={{ color: '#94A3B8', fontSize: 12, fontWeight: '600', marginBottom: 8, letterSpacing: 0.5 }}>
                  FULL NAME
                </Text>
                <TextInput
                  value={name}
                  onChangeText={setName}
                  placeholder="Your name"
                  placeholderTextColor="#475569"
                  autoCapitalize="words"
                  autoCorrect={false}
                  returnKeyType="next"
                  style={inputStyle}
                  testID="name-input"
                />
              </>
            )}

            {/* Email */}
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
              returnKeyType="next"
              style={inputStyle}
              testID="email-input"
            />

            {/* Password */}
            <Text style={{ color: '#94A3B8', fontSize: 12, fontWeight: '600', marginBottom: 8, letterSpacing: 0.5 }}>
              PASSWORD
            </Text>
            <View style={{ position: 'relative', marginBottom: 12 }}>
              <TextInput
                value={password}
                onChangeText={setPassword}
                placeholder="••••••••"
                placeholderTextColor="#475569"
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                autoCorrect={false}
                returnKeyType="done"
                onSubmitEditing={handleSubmit}
                style={[inputStyle, { marginBottom: 0, paddingRight: 50 }]}
                testID="password-input"
              />
              <Pressable
                onPress={() => setShowPassword(!showPassword)}
                style={{ position: 'absolute', right: 16, top: 14 }}>
                {showPassword
                  ? <EyeOff size={20} color="#475569" />
                  : <Eye size={20} color="#475569" />}
              </Pressable>
            </View>

            {/* Forgot password (sign in only) */}
            {mode === 'signin' && (
              <Pressable
                onPress={() => router.push('/forgot-password')}
                testID="forgot-password-link"
                style={{ alignSelf: 'flex-end', marginTop: 8, marginBottom: 4 }}>
                <Text style={{ color: '#60A5FA', fontSize: 13, fontWeight: '600' }}>Forgot Password?</Text>
              </Pressable>
            )}

            {error != null && (
              <View style={{
                backgroundColor: '#2D1515', borderRadius: 12,
                paddingVertical: 12, paddingHorizontal: 16,
                marginBottom: 12, borderWidth: 1, borderColor: '#7F1D1D',
              }}>
                <Text style={{ color: '#F87171', fontSize: 14, textAlign: 'center' }}>{error}</Text>
              </View>
            )}

            <Pressable
              onPress={handleSubmit}
              disabled={loading}
              testID="submit-button"
              style={{
                backgroundColor: '#2563EB', borderRadius: 14,
                paddingVertical: 15, alignItems: 'center', marginTop: 8,
                opacity: loading ? 0.7 : 1,
              }}>
              {loading
                ? <ActivityIndicator color="#fff" />
                : <Text style={{ color: '#fff', fontSize: 16, fontWeight: '700' }}>
                    {mode === 'signin' ? 'Sign In' : 'Create Account'}
                  </Text>
              }
            </Pressable>

            <View style={{ height: 40 }} />
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}
