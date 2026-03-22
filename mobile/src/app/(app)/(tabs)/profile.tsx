import React, { useState, useEffect } from 'react';
import {
  View, Text, Pressable, Modal, ActivityIndicator, ScrollView, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { authClient } from '@/lib/auth/auth-client';
import { useSession, useInvalidateSession } from '@/lib/auth/use-session';
import { useColorScheme } from '@/lib/useColorScheme';
import { useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api/api';
import {
  User, LogOut, Trash2, AlertTriangle, X,
  Download, Upload, Database, CheckCircle,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as DocumentPicker from 'expo-document-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';

const LAST_BACKUP_KEY = 'lastAutoBackup';

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days === 1) return 'yesterday';
  if (days < 30) return `${days} days ago`;
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export default function ProfileScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const { data: session } = useSession();
  const invalidateSession = useInvalidateSession();
  const queryClient = useQueryClient();

  const [signingOut, setSigningOut] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const [backingUp, setBackingUp] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const [showRestoreModal, setShowRestoreModal] = useState(false);
  const [pendingRestoreUri, setPendingRestoreUri] = useState<string | null>(null);
  const [backupMessage, setBackupMessage] = useState<string | null>(null);
  const [lastBackup, setLastBackup] = useState<string | null>(null);

  const bg = isDark ? '#0F172A' : '#F8FAFC';
  const card = isDark ? '#1E293B' : '#FFFFFF';
  const cardBorder = isDark ? '#334155' : '#E2E8F0';
  const text = isDark ? '#F1F5F9' : '#0F172A';
  const textSecondary = isDark ? '#94A3B8' : '#64748B';

  // Load last backup time and auto-backup if needed
  useEffect(() => {
    const checkAutoBackup = async () => {
      const stored = await AsyncStorage.getItem(LAST_BACKUP_KEY);
      setLastBackup(stored);
      if (stored) {
        const diff = Date.now() - new Date(stored).getTime();
        const hoursElapsed = diff / (1000 * 60 * 60);
        if (hoursElapsed > 24) {
          await performBackup(false);
        }
      }
    };
    checkAutoBackup().catch(() => null);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const performBackup = async (share: boolean) => {
    setBackingUp(true);
    setBackupMessage(null);
    try {
      const backup = await api.get<object>('/api/backup');
      const dateStr = new Date().toISOString().split('T')[0];
      const fileName = `backup-${dateStr}.json`;
      const filePath = (FileSystem.documentDirectory ?? '') + fileName;
      await FileSystem.writeAsStringAsync(filePath, JSON.stringify(backup), {
        encoding: FileSystem.EncodingType.UTF8,
      });
      const now = new Date().toISOString();
      await AsyncStorage.setItem(LAST_BACKUP_KEY, now);
      setLastBackup(now);
      if (share) {
        const canShare = await Sharing.isAvailableAsync();
        if (canShare) {
          await Sharing.shareAsync(filePath, {
            mimeType: 'application/json',
            dialogTitle: 'Save Backup',
            UTI: 'public.json',
          });
        }
        setBackupMessage('Backup saved successfully.');
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    } catch {
      if (share) {
        setBackupMessage('Backup failed. Please try again.');
      }
    }
    setBackingUp(false);
  };

  const handlePickRestoreFile = async () => {
    setBackupMessage(null);
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'application/json',
        copyToCacheDirectory: true,
      });
      if (result.canceled || result.assets.length === 0) return;
      const fileUri = result.assets[0].uri;
      setPendingRestoreUri(fileUri);
      setShowRestoreModal(true);
    } catch {
      setBackupMessage('Could not open file picker. Try again.');
    }
  };

  const handleConfirmRestore = async () => {
    if (!pendingRestoreUri) return;
    setShowRestoreModal(false);
    setRestoring(true);
    setBackupMessage(null);
    try {
      const content = await FileSystem.readAsStringAsync(pendingRestoreUri, {
        encoding: FileSystem.EncodingType.UTF8,
      });
      const parsed = JSON.parse(content);
      await api.post<object>('/api/backup/restore', parsed);
      await queryClient.invalidateQueries();
      setBackupMessage('Data restored successfully.');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {
      setBackupMessage('Restore failed. Make sure the file is a valid backup.');
    }
    setRestoring(false);
    setPendingRestoreUri(null);
  };

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

  const iconBg = (color: string) => ({
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: isDark ? `${color}22` : `${color}18`,
    alignItems: 'center' as const, justifyContent: 'center' as const, marginRight: 14,
  });

  return (
    <View style={{ flex: 1, backgroundColor: bg }}>
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <ScrollView showsVerticalScrollIndicator={false}>
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
                : <View style={iconBg('#2563EB')}>
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

          {/* Data & Backup section */}
          <View style={{ marginHorizontal: 16, marginTop: 28 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12, gap: 8 }}>
              <Database size={16} color={textSecondary} />
              <Text style={{ color: textSecondary, fontSize: 12, fontWeight: '700', letterSpacing: 0.6 }}>
                DATA & BACKUP
              </Text>
            </View>

            <View style={{
              backgroundColor: card, borderRadius: 16,
              borderWidth: 1, borderColor: cardBorder, overflow: 'hidden',
            }}>
              {/* Status row */}
              <View style={{
                paddingHorizontal: 16, paddingVertical: 14,
                borderBottomWidth: 1, borderBottomColor: cardBorder,
                flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
              }}>
                <View>
                  <Text style={{ color: text, fontSize: 14, fontWeight: '600' }}>Auto-backup</Text>
                  <Text style={{ color: textSecondary, fontSize: 12, marginTop: 2 }}>
                    {lastBackup != null ? `Last backup: ${timeAgo(lastBackup)}` : 'Never backed up'}
                  </Text>
                </View>
                <View style={{
                  backgroundColor: isDark ? '#0F2A1A' : '#DCFCE7',
                  paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20,
                  flexDirection: 'row', alignItems: 'center', gap: 4,
                }}>
                  <CheckCircle size={12} color="#22C55E" />
                  <Text style={{ color: '#22C55E', fontSize: 11, fontWeight: '700' }}>On</Text>
                </View>
              </View>

              {/* Backup button */}
              <Pressable
                onPress={() => performBackup(true)}
                disabled={backingUp || restoring}
                testID="backup-button"
                style={{
                  padding: 16, flexDirection: 'row', alignItems: 'center',
                  borderBottomWidth: 1, borderBottomColor: cardBorder,
                  opacity: (backingUp || restoring) ? 0.6 : 1,
                }}>
                {backingUp
                  ? <ActivityIndicator color="#2563EB" size="small" style={{ marginRight: 14, width: 36 }} />
                  : <View style={iconBg('#2563EB')}>
                      <Download size={18} color="#2563EB" />
                    </View>
                }
                <View style={{ flex: 1 }}>
                  <Text style={{ color: text, fontSize: 16, fontWeight: '600' }}>Back Up Now</Text>
                  <Text style={{ color: textSecondary, fontSize: 12, marginTop: 2 }}>
                    Save and share a backup file
                  </Text>
                </View>
              </Pressable>

              {/* Restore button */}
              <Pressable
                onPress={handlePickRestoreFile}
                disabled={backingUp || restoring}
                testID="restore-button"
                style={{
                  padding: 16, flexDirection: 'row', alignItems: 'center',
                  opacity: (backingUp || restoring) ? 0.6 : 1,
                }}>
                {restoring
                  ? <ActivityIndicator color="#7C3AED" size="small" style={{ marginRight: 14, width: 36 }} />
                  : <View style={iconBg('#7C3AED')}>
                      <Upload size={18} color="#7C3AED" />
                    </View>
                }
                <View style={{ flex: 1 }}>
                  <Text style={{ color: text, fontSize: 16, fontWeight: '600' }}>Restore Data</Text>
                  <Text style={{ color: textSecondary, fontSize: 12, marginTop: 2 }}>
                    Import from a backup file
                  </Text>
                </View>
              </Pressable>
            </View>

            {/* Feedback message */}
            {backupMessage != null && (
              <View style={{
                marginTop: 10, borderRadius: 10, padding: 12,
                backgroundColor: backupMessage.includes('failed') || backupMessage.includes('Failed')
                  ? (isDark ? '#2D1515' : '#FEE2E2')
                  : (isDark ? '#0F2A1A' : '#DCFCE7'),
                borderWidth: 1,
                borderColor: backupMessage.includes('failed') || backupMessage.includes('Failed')
                  ? (isDark ? '#7F1D1D' : '#FECACA')
                  : (isDark ? '#166534' : '#BBF7D0'),
              }}>
                <Text style={{
                  fontSize: 13, textAlign: 'center',
                  color: backupMessage.includes('failed') || backupMessage.includes('Failed') ? '#F87171' : '#22C55E',
                }}>
                  {backupMessage}
                </Text>
              </View>
            )}
          </View>

          <View style={{ height: 40 }} />
        </ScrollView>
      </SafeAreaView>

      {/* Restore confirmation modal */}
      <Modal
        visible={showRestoreModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowRestoreModal(false)}>
        <View style={{
          flex: 1, backgroundColor: 'rgba(0,0,0,0.6)',
          justifyContent: 'center', alignItems: 'center', paddingHorizontal: 24,
        }}>
          <View style={{
            backgroundColor: isDark ? '#1E293B' : '#FFFFFF',
            borderRadius: 20, padding: 28, width: '100%',
            borderWidth: 1, borderColor: isDark ? '#334155' : '#E2E8F0',
          }}>
            <Pressable
              onPress={() => setShowRestoreModal(false)}
              style={{ position: 'absolute', top: 16, right: 16 }}>
              <X size={20} color={textSecondary} />
            </Pressable>

            <View style={{
              width: 56, height: 56, borderRadius: 16,
              backgroundColor: isDark ? '#2D1A3E' : '#EDE9FE',
              alignItems: 'center', justifyContent: 'center', marginBottom: 16,
            }}>
              <Upload size={28} color="#7C3AED" />
            </View>

            <Text style={{ color: text, fontSize: 20, fontWeight: '800', marginBottom: 10 }}>
              Restore Data?
            </Text>
            <Text style={{ color: textSecondary, fontSize: 15, lineHeight: 22, marginBottom: 20 }}>
              This will replace ALL your current data with the contents of the backup file. This action cannot be undone.
            </Text>

            <Pressable
              onPress={handleConfirmRestore}
              testID="confirm-restore-button"
              style={{
                backgroundColor: '#7C3AED', borderRadius: 12,
                paddingVertical: 14, alignItems: 'center', marginBottom: 12,
              }}>
              <Text style={{ color: '#fff', fontWeight: '700', fontSize: 16 }}>Yes, Restore My Data</Text>
            </Pressable>

            <Pressable
              onPress={() => { setShowRestoreModal(false); setPendingRestoreUri(null); }}
              style={{
                borderWidth: 1, borderColor: isDark ? '#334155' : '#E2E8F0',
                borderRadius: 12, paddingVertical: 14, alignItems: 'center',
              }}>
              <Text style={{ color: text, fontWeight: '600', fontSize: 16 }}>Cancel</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

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
