import React, { useState } from 'react';
import {
  View, Text, Pressable, Modal, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { authClient } from '@/lib/auth/auth-client';
import { useSession, useInvalidateSession } from '@/lib/auth/use-session';
import { useColorScheme } from '@/lib/useColorScheme';
import { User, LogOut, Trash2, AlertTriangle, X } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';

export default function ProfileScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const { data: session } = useSession();
  const invalidateSession = useInvalidateSession();
  const [signingOut, setSigningOut] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const bg = isDark ? '#0F172A' : '#F8FAFC';
  const card = isDark ? '#1E293B' : '#FFFFFF';
  const cardBorder = isDark ? '#334155' : '#E2E8F0';
  const text = isDark ? '#F1F5F9' : '#0F172A';
  const textSecondary = isDark ? '#94A3B8' : '#64748B';

  const handleSignOut = async () => {
    setSigningOut(true);
    await authClient.signOut();
    await invalidateSession();
    setSigningOut(false);
  };

  const handleDeleteAccount = async () => {
    setDeleting(true);
    setDeleteError(null);
    try {
      const baseUrl = process.env.EXPO_PUBLIC_BACKEND_URL!;
      const response = await fetch(`${baseUrl}/api/account/delete`, {
        method: 'DELETE',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
      });
      if (response.status === 204 || response.ok) {
        await authClient.signOut();
        await invalidateSession();
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } else {
        const data = await response.json().catch(() => null) as { error?: { message?: string } } | null;
        setDeleteError(data?.error?.message ?? 'Failed to delete account. Try again.');
      }
    } catch {
      setDeleteError('Something went wrong. Please try again.');
    }
    setDeleting(false);
  };

  const user = session?.user;

  return (
    <View style={{ flex: 1, backgroundColor: bg }}>
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        {/* Header */}
        <View style={{ paddingHorizontal: 20, paddingTop: 8, paddingBottom: 16 }}>
          <Text style={{ color: text, fontSize: 28, fontWeight: '800' }}>Account</Text>
          <Text style={{ color: textSecondary, fontSize: 14, marginTop: 2 }}>
            Manage your account settings
          </Text>
        </View>

        {/* User card */}
        <View style={{
          marginHorizontal: 16, marginBottom: 24,
          backgroundColor: card, borderRadius: 16,
          padding: 20, borderWidth: 1, borderColor: cardBorder,
          flexDirection: 'row', alignItems: 'center',
        }}>
          <View style={{
            width: 52, height: 52, borderRadius: 26,
            backgroundColor: isDark ? '#1E3A5F' : '#DBEAFE',
            alignItems: 'center', justifyContent: 'center',
            marginRight: 14,
          }}>
            <User size={24} color="#2563EB" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ color: text, fontSize: 17, fontWeight: '700' }} numberOfLines={1}>
              {user?.name ?? 'User'}
            </Text>
            <Text style={{ color: textSecondary, fontSize: 14, marginTop: 2 }} numberOfLines={1}>
              {user?.email ?? ''}
            </Text>
          </View>
        </View>

        {/* Actions */}
        <View style={{ marginHorizontal: 16, gap: 12 }}>
          {/* Sign out */}
          <Pressable
            onPress={handleSignOut}
            disabled={signingOut}
            testID="sign-out-button"
            style={{
              backgroundColor: card, borderRadius: 14,
              padding: 16, borderWidth: 1, borderColor: cardBorder,
              flexDirection: 'row', alignItems: 'center',
              opacity: signingOut ? 0.6 : 1,
            }}>
            {signingOut
              ? <ActivityIndicator color="#2563EB" size="small" style={{ marginRight: 14 }} />
              : <View style={{
                  width: 36, height: 36, borderRadius: 10,
                  backgroundColor: isDark ? '#1E3A5F' : '#DBEAFE',
                  alignItems: 'center', justifyContent: 'center', marginRight: 14,
                }}>
                  <LogOut size={18} color="#2563EB" />
                </View>
            }
            <Text style={{ color: text, fontSize: 16, fontWeight: '600' }}>Sign Out</Text>
          </Pressable>

          {/* Delete account */}
          <Pressable
            onPress={() => { setShowDeleteModal(true); setDeleteError(null); }}
            testID="delete-account-button"
            style={{
              backgroundColor: card, borderRadius: 14,
              padding: 16, borderWidth: 1, borderColor: cardBorder,
              flexDirection: 'row', alignItems: 'center',
            }}>
            <View style={{
              width: 36, height: 36, borderRadius: 10,
              backgroundColor: isDark ? '#2D1515' : '#FEE2E2',
              alignItems: 'center', justifyContent: 'center', marginRight: 14,
            }}>
              <Trash2 size={18} color="#EF4444" />
            </View>
            <Text style={{ color: '#EF4444', fontSize: 16, fontWeight: '600' }}>Delete Account</Text>
          </Pressable>
        </View>
      </SafeAreaView>

      {/* Delete confirmation modal */}
      <Modal
        visible={showDeleteModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowDeleteModal(false)}>
        <View style={{
          flex: 1, backgroundColor: 'rgba(0,0,0,0.6)',
          justifyContent: 'center', alignItems: 'center', paddingHorizontal: 24,
        }}>
          <View style={{
            backgroundColor: isDark ? '#1E293B' : '#FFFFFF',
            borderRadius: 20, padding: 28, width: '100%',
            borderWidth: 1, borderColor: isDark ? '#334155' : '#E2E8F0',
          }}>
            {/* Close */}
            <Pressable
              onPress={() => setShowDeleteModal(false)}
              style={{ position: 'absolute', top: 16, right: 16 }}>
              <X size={20} color={textSecondary} />
            </Pressable>

            {/* Icon */}
            <View style={{
              width: 56, height: 56, borderRadius: 16,
              backgroundColor: isDark ? '#2D1515' : '#FEE2E2',
              alignItems: 'center', justifyContent: 'center', marginBottom: 16,
            }}>
              <AlertTriangle size={28} color="#EF4444" />
            </View>

            <Text style={{ color: text, fontSize: 20, fontWeight: '800', marginBottom: 10 }}>
              Delete Account?
            </Text>
            <Text style={{ color: textSecondary, fontSize: 15, lineHeight: 22, marginBottom: 20 }}>
              This will permanently delete your account and all your data, including orders and catalog items. This action cannot be undone.
            </Text>

            {deleteError != null && (
              <View style={{
                backgroundColor: isDark ? '#2D1515' : '#FEE2E2',
                borderRadius: 10, padding: 12, marginBottom: 16,
                borderWidth: 1, borderColor: isDark ? '#7F1D1D' : '#FECACA',
              }}>
                <Text style={{ color: '#EF4444', fontSize: 13, textAlign: 'center' }}>{deleteError}</Text>
              </View>
            )}

            <Pressable
              onPress={handleDeleteAccount}
              disabled={deleting}
              testID="confirm-delete-button"
              style={{
                backgroundColor: '#EF4444', borderRadius: 12,
                paddingVertical: 14, alignItems: 'center', marginBottom: 12,
                opacity: deleting ? 0.7 : 1,
              }}>
              {deleting
                ? <ActivityIndicator color="#fff" />
                : <Text style={{ color: '#fff', fontWeight: '700', fontSize: 16 }}>Yes, Delete My Account</Text>
              }
            </Pressable>

            <Pressable
              onPress={() => setShowDeleteModal(false)}
              style={{
                borderWidth: 1, borderColor: isDark ? '#334155' : '#E2E8F0',
                borderRadius: 12, paddingVertical: 14, alignItems: 'center',
              }}>
              <Text style={{ color: text, fontWeight: '600', fontSize: 16 }}>Cancel</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
}
