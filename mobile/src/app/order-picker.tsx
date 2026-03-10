import React, { useMemo, useCallback, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  Alert,
  ActivityIndicator,
  Modal,
  KeyboardAvoidingView,
  Platform,
  Pressable,
} from 'react-native';
import { router } from 'expo-router';
import { X, Check, Plus, History, Package, User } from 'lucide-react-native';
import { useOrders, useCreateOrder, useUpdateOrder, useDeleteOrder } from '@/lib/hooks/use-orders';
import { useOrderStore } from '@/lib/state/order-store';
import type { Order } from '@/lib/hooks/use-orders';

const COLORS = {
  bg: '#0F172A',
  card: '#1E293B',
  cardBorder: '#334155',
  text: '#F1F5F9',
  textSecondary: '#94A3B8',
  accent: '#2563EB',
  accentLight: '#1E3A5F',
  danger: '#EF4444',
  dangerBg: '#3B1A1A',
  success: '#22C55E',
  successBg: '#14532D',
  outline: '#334155',
  overlay: 'rgba(0,0,0,0.6)',
  inputBg: '#0F172A',
};

interface NewOrderModalProps {
  visible: boolean;
  defaultName: string;
  onConfirm: (name: string, customer: string) => void;
  onCancel: () => void;
  isPending: boolean;
}

function NewOrderModal({ visible, defaultName, onConfirm, onCancel, isPending }: NewOrderModalProps) {
  const [name, setName] = useState(defaultName);
  const [customer, setCustomer] = useState('');

  // Reset fields when modal becomes visible
  React.useEffect(() => {
    if (visible) {
      setName(defaultName);
      setCustomer('');
    }
  }, [visible, defaultName]);

  const handleConfirm = () => {
    if (!name.trim()) return;
    onConfirm(name.trim(), customer.trim());
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}>
        <Pressable
          style={{ flex: 1, backgroundColor: COLORS.overlay, justifyContent: 'flex-end' }}
          onPress={onCancel}>
          <Pressable
            onPress={() => {}}
            style={{
              backgroundColor: COLORS.card,
              borderTopLeftRadius: 24,
              borderTopRightRadius: 24,
              padding: 24,
              paddingBottom: Platform.OS === 'ios' ? 40 : 24,
            }}>
            {/* Handle bar */}
            <View
              style={{
                width: 36,
                height: 4,
                borderRadius: 2,
                backgroundColor: COLORS.cardBorder,
                alignSelf: 'center',
                marginBottom: 20,
              }}
            />

            <Text style={{ color: COLORS.text, fontSize: 20, fontWeight: '700', marginBottom: 20 }}>
              New Order
            </Text>

            {/* Order Name */}
            <Text style={{ color: COLORS.textSecondary, fontSize: 12, fontWeight: '600', marginBottom: 6, letterSpacing: 0.5 }}>
              ORDER NAME
            </Text>
            <TextInput
              value={name}
              onChangeText={setName}
              placeholder="e.g. Order #3"
              placeholderTextColor={COLORS.textSecondary}
              style={{
                backgroundColor: COLORS.inputBg,
                borderRadius: 12,
                paddingHorizontal: 14,
                paddingVertical: 12,
                fontSize: 16,
                color: COLORS.text,
                borderWidth: 1,
                borderColor: COLORS.cardBorder,
                marginBottom: 16,
              }}
              autoCapitalize="words"
              returnKeyType="next"
              testID="new-order-name-input"
            />

            {/* Customer Name */}
            <Text style={{ color: COLORS.textSecondary, fontSize: 12, fontWeight: '600', marginBottom: 6, letterSpacing: 0.5 }}>
              CUSTOMER <Text style={{ color: COLORS.textSecondary, fontWeight: '400' }}>(optional)</Text>
            </Text>
            <TextInput
              value={customer}
              onChangeText={setCustomer}
              placeholder="e.g. Brooklyn, Washington"
              placeholderTextColor={COLORS.textSecondary}
              style={{
                backgroundColor: COLORS.inputBg,
                borderRadius: 12,
                paddingHorizontal: 14,
                paddingVertical: 12,
                fontSize: 16,
                color: COLORS.text,
                borderWidth: 1,
                borderColor: COLORS.cardBorder,
                marginBottom: 24,
              }}
              autoCapitalize="words"
              returnKeyType="done"
              onSubmitEditing={handleConfirm}
              testID="new-order-customer-input"
            />

            {/* Buttons */}
            <View style={{ flexDirection: 'row', gap: 12 }}>
              <TouchableOpacity
                onPress={onCancel}
                style={{
                  flex: 1,
                  borderRadius: 14,
                  paddingVertical: 14,
                  alignItems: 'center',
                  borderWidth: 1.5,
                  borderColor: COLORS.cardBorder,
                }}
                testID="new-order-cancel-button">
                <Text style={{ color: COLORS.textSecondary, fontSize: 16, fontWeight: '600' }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleConfirm}
                disabled={!name.trim() || isPending}
                style={{
                  flex: 2,
                  borderRadius: 14,
                  paddingVertical: 14,
                  alignItems: 'center',
                  backgroundColor: !name.trim() ? COLORS.accentLight : COLORS.accent,
                  opacity: isPending ? 0.6 : 1,
                }}
                testID="new-order-confirm-button">
                {isPending ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={{ color: '#FFFFFF', fontSize: 16, fontWeight: '700' }}>Create Order</Text>
                )}
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </KeyboardAvoidingView>
    </Modal>
  );
}

interface SetCustomerModalProps {
  visible: boolean;
  order: Order | null;
  onConfirm: (customer: string) => void;
  onCancel: () => void;
  isPending: boolean;
}

function SetCustomerModal({ visible, order, onConfirm, onCancel, isPending }: SetCustomerModalProps) {
  const [customer, setCustomer] = useState('');

  React.useEffect(() => {
    if (visible && order) {
      setCustomer(order.customer ?? '');
    }
  }, [visible, order]);

  const handleConfirm = () => {
    onConfirm(customer.trim());
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}>
        <Pressable
          style={{ flex: 1, backgroundColor: COLORS.overlay, justifyContent: 'flex-end' }}
          onPress={onCancel}>
          <Pressable
            onPress={() => {}}
            style={{
              backgroundColor: COLORS.card,
              borderTopLeftRadius: 24,
              borderTopRightRadius: 24,
              padding: 24,
              paddingBottom: Platform.OS === 'ios' ? 40 : 24,
            }}>
            <View
              style={{
                width: 36,
                height: 4,
                borderRadius: 2,
                backgroundColor: COLORS.cardBorder,
                alignSelf: 'center',
                marginBottom: 20,
              }}
            />

            <Text style={{ color: COLORS.text, fontSize: 20, fontWeight: '700', marginBottom: 4 }}>
              Set Customer
            </Text>
            {order ? (
              <Text style={{ color: COLORS.textSecondary, fontSize: 14, marginBottom: 20 }}>
                {order.name}
              </Text>
            ) : null}

            <Text style={{ color: COLORS.textSecondary, fontSize: 12, fontWeight: '600', marginBottom: 6, letterSpacing: 0.5 }}>
              CUSTOMER NAME <Text style={{ color: COLORS.textSecondary, fontWeight: '400' }}>(leave blank to clear)</Text>
            </Text>
            <TextInput
              value={customer}
              onChangeText={setCustomer}
              placeholder="e.g. Brooklyn, Washington"
              placeholderTextColor={COLORS.textSecondary}
              style={{
                backgroundColor: COLORS.inputBg,
                borderRadius: 12,
                paddingHorizontal: 14,
                paddingVertical: 12,
                fontSize: 16,
                color: COLORS.text,
                borderWidth: 1,
                borderColor: COLORS.cardBorder,
                marginBottom: 24,
              }}
              autoCapitalize="words"
              returnKeyType="done"
              onSubmitEditing={handleConfirm}
              autoFocus
              testID="set-customer-input"
            />

            <View style={{ flexDirection: 'row', gap: 12 }}>
              <TouchableOpacity
                onPress={onCancel}
                style={{
                  flex: 1,
                  borderRadius: 14,
                  paddingVertical: 14,
                  alignItems: 'center',
                  borderWidth: 1.5,
                  borderColor: COLORS.cardBorder,
                }}
                testID="set-customer-cancel-button">
                <Text style={{ color: COLORS.textSecondary, fontSize: 16, fontWeight: '600' }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleConfirm}
                disabled={isPending}
                style={{
                  flex: 2,
                  borderRadius: 14,
                  paddingVertical: 14,
                  alignItems: 'center',
                  backgroundColor: COLORS.accent,
                  opacity: isPending ? 0.6 : 1,
                }}
                testID="set-customer-confirm-button">
                {isPending ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={{ color: '#FFFFFF', fontSize: 16, fontWeight: '700' }}>Save</Text>
                )}
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </KeyboardAvoidingView>
    </Modal>
  );
}

export default function OrderPickerScreen() {
  const activeOrderId = useOrderStore((s) => s.activeOrderId);
  const setActiveOrderId = useOrderStore((s) => s.setActiveOrderId);

  const { data: orders = [], isLoading } = useOrders();
  const createOrder = useCreateOrder();
  const updateOrder = useUpdateOrder();
  const deleteOrder = useDeleteOrder();

  const drafts = useMemo(() => orders.filter((o) => o.status === 'draft'), [orders]);
  const activeOrder = useMemo(() => orders.find((o) => o.id === activeOrderId) ?? null, [orders, activeOrderId]);
  const activeOrderItemCount = activeOrder?._count?.items ?? 0;

  const [showNewOrderModal, setShowNewOrderModal] = useState(false);
  const [showSetCustomerModal, setShowSetCustomerModal] = useState(false);
  const [customerTargetOrder, setCustomerTargetOrder] = useState<Order | null>(null);

  const handleSelectOrder = useCallback(
    (order: Order) => {
      setActiveOrderId(order.id);
      router.back();
    },
    [setActiveOrderId]
  );

  const handleLongPress = useCallback(
    (order: Order) => {
      Alert.alert(order.name, 'What would you like to do?', [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Rename',
          onPress: () => {
            Alert.prompt(
              'Rename Order',
              'Enter a new name for this order:',
              (newName) => {
                if (newName && newName.trim()) {
                  updateOrder.mutate({ id: order.id, name: newName.trim() });
                }
              },
              'plain-text',
              order.name
            );
          },
        },
        {
          text: 'Set Customer',
          onPress: () => {
            setCustomerTargetOrder(order);
            setShowSetCustomerModal(true);
          },
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            Alert.alert(
              'Delete Order',
              `Delete "${order.name}"? This cannot be undone.`,
              [
                { text: 'Cancel', style: 'cancel' },
                {
                  text: 'Delete',
                  style: 'destructive',
                  onPress: () => {
                    deleteOrder.mutate(order.id, {
                      onSuccess: () => {
                        if (activeOrderId === order.id) {
                          const remaining = drafts.filter((d) => d.id !== order.id);
                          setActiveOrderId(remaining.length > 0 ? remaining[0].id : null);
                        }
                      },
                    });
                  },
                },
              ]
            );
          },
        },
      ]);
    },
    [activeOrderId, drafts, updateOrder, deleteOrder, setActiveOrderId]
  );

  const handleCompleteOrder = useCallback(() => {
    if (!activeOrderId) return;
    const nextNumber = orders.length + 1;
    updateOrder.mutate(
      { id: activeOrderId, status: 'completed' },
      {
        onSuccess: () => {
          createOrder.mutate(
            { name: `Order #${nextNumber}` },
            {
              onSuccess: (newOrder) => {
                setActiveOrderId(newOrder.id);
                router.back();
              },
            }
          );
        },
      }
    );
  }, [activeOrderId, orders.length, updateOrder, createOrder, setActiveOrderId]);

  const handleNewOrder = useCallback(() => {
    setShowNewOrderModal(true);
  }, []);

  const handleNewOrderConfirm = useCallback(
    (name: string, customer: string) => {
      createOrder.mutate(
        { name, customer: customer || undefined },
        {
          onSuccess: (newOrder) => {
            setActiveOrderId(newOrder.id);
            setShowNewOrderModal(false);
            router.back();
          },
        }
      );
    },
    [createOrder, setActiveOrderId]
  );

  const handleSetCustomerConfirm = useCallback(
    (customer: string) => {
      if (!customerTargetOrder) return;
      updateOrder.mutate(
        { id: customerTargetOrder.id, customer: customer || null },
        {
          onSuccess: () => {
            setShowSetCustomerModal(false);
            setCustomerTargetOrder(null);
          },
        }
      );
    },
    [customerTargetOrder, updateOrder]
  );

  const handleViewHistory = useCallback(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    router.push('/order-history' as any);
  }, []);

  const nextOrderNumber = orders.length + 1;

  const renderDraftItem = useCallback(
    ({ item }: { item: Order }) => {
      const isActive = item.id === activeOrderId;
      const itemCount = item._count?.items ?? 0;
      return (
        <TouchableOpacity
          onPress={() => handleSelectOrder(item)}
          onLongPress={() => handleLongPress(item)}
          testID={`draft-order-${item.id}`}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: isActive ? COLORS.accentLight : COLORS.card,
            borderRadius: 14,
            padding: 16,
            marginBottom: 8,
            borderWidth: 1,
            borderColor: isActive ? COLORS.accent : COLORS.cardBorder,
          }}>
          <View style={{ flex: 1 }}>
            <Text
              style={{
                color: COLORS.text,
                fontSize: 16,
                fontWeight: isActive ? '700' : '500',
              }}
              numberOfLines={1}>
              {item.name}
            </Text>
            {item.customer ? (
              <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 2, gap: 4 }}>
                <User size={11} color={COLORS.textSecondary} />
                <Text
                  style={{
                    color: COLORS.textSecondary,
                    fontSize: 13,
                  }}
                  numberOfLines={1}>
                  {item.customer}
                </Text>
              </View>
            ) : null}
            <Text
              style={{
                color: COLORS.textSecondary,
                fontSize: 13,
                marginTop: item.customer ? 2 : 2,
              }}>
              {itemCount} {itemCount === 1 ? 'item' : 'items'}
            </Text>
          </View>
          {isActive ? (
            <View
              style={{
                width: 28,
                height: 28,
                borderRadius: 14,
                backgroundColor: COLORS.accent,
                alignItems: 'center',
                justifyContent: 'center',
              }}>
              <Check size={16} color="#FFFFFF" />
            </View>
          ) : null}
        </TouchableOpacity>
      );
    },
    [activeOrderId, handleSelectOrder, handleLongPress]
  );

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.bg }} testID="order-picker-screen">
        {/* Header */}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingHorizontal: 20,
            paddingTop: 8,
            paddingBottom: 16,
          }}>
          <Text style={{ color: COLORS.text, fontSize: 24, fontWeight: '800' }}>My Orders</Text>
          <TouchableOpacity
            onPress={() => router.back()}
            testID="close-button"
            style={{
              width: 36,
              height: 36,
              borderRadius: 18,
              backgroundColor: COLORS.card,
              alignItems: 'center',
              justifyContent: 'center',
            }}>
            <X size={20} color={COLORS.textSecondary} />
          </TouchableOpacity>
        </View>

        {/* Top actions — always visible */}
        <View style={{ paddingHorizontal: 20, gap: 10, marginBottom: 16 }}>
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <TouchableOpacity
              onPress={handleNewOrder}
              disabled={createOrder.isPending}
              testID="new-order-button"
              style={{
                flex: 1,
                borderRadius: 14,
                paddingVertical: 14,
                alignItems: 'center',
                borderWidth: 1.5,
                borderColor: COLORS.cardBorder,
                opacity: createOrder.isPending ? 0.6 : 1,
                flexDirection: 'row',
                justifyContent: 'center',
                gap: 6,
              }}>
              {createOrder.isPending ? (
                <ActivityIndicator color={COLORS.text} />
              ) : (
                <>
                  <Plus size={16} color={COLORS.text} />
                  <Text style={{ color: COLORS.text, fontSize: 15, fontWeight: '600' }}>
                    New Order
                  </Text>
                </>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleViewHistory}
              testID="view-history-button"
              style={{
                flex: 1,
                borderRadius: 14,
                paddingVertical: 14,
                alignItems: 'center',
                borderWidth: 1.5,
                borderColor: COLORS.cardBorder,
                flexDirection: 'row',
                justifyContent: 'center',
                gap: 6,
              }}>
              <History size={16} color={COLORS.textSecondary} />
              <Text style={{ color: COLORS.textSecondary, fontSize: 15, fontWeight: '500' }}>
                History
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {isLoading ? (
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
            <ActivityIndicator color={COLORS.accent} testID="loading-indicator" />
          </View>
        ) : drafts.length === 0 ? (
          /* Empty state */
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 40 }}>
            <View
              style={{
                width: 72,
                height: 72,
                borderRadius: 20,
                backgroundColor: COLORS.accentLight,
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 16,
              }}>
              <Package size={36} color={COLORS.accent} />
            </View>
            <Text
              style={{
                color: COLORS.text,
                fontSize: 18,
                fontWeight: '700',
                textAlign: 'center',
              }}>
              No orders yet
            </Text>
            <Text
              style={{
                color: COLORS.textSecondary,
                fontSize: 14,
                textAlign: 'center',
                marginTop: 6,
                lineHeight: 20,
              }}>
              Create your first order to start adding items.
            </Text>
            <TouchableOpacity
              onPress={handleNewOrder}
              testID="create-first-order-button"
              style={{
                marginTop: 24,
                backgroundColor: COLORS.accent,
                borderRadius: 14,
                paddingHorizontal: 28,
                paddingVertical: 14,
              }}>
              {createOrder.isPending ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={{ color: '#FFFFFF', fontSize: 16, fontWeight: '700' }}>
                  Create First Order
                </Text>
              )}
            </TouchableOpacity>
          </View>
        ) : null}

        {/* Draft list */}
        {!isLoading && drafts.length > 0 && (
          <View style={{ flex: 1 }}>
            <View style={{ paddingHorizontal: 20, marginBottom: 8 }}>
              <Text
                style={{
                  color: COLORS.textSecondary,
                  fontSize: 11,
                  fontWeight: '700',
                  letterSpacing: 1,
                  textTransform: 'uppercase',
                  marginBottom: 10,
                }}>
                Draft Orders
              </Text>
            </View>
            <FlatList
              data={drafts}
              renderItem={renderDraftItem}
              keyExtractor={(item) => item.id}
              contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40 }}
              showsVerticalScrollIndicator={true}
              testID="drafts-list"
              style={{ flex: 1 }}
            />
          </View>
        )}

        {/* Complete Current Order — sticky footer */}
        {activeOrderItemCount > 0 && (
          <View
            style={{
              paddingHorizontal: 20,
              paddingBottom: 32,
              paddingTop: 12,
              borderTopWidth: 1,
              borderTopColor: COLORS.cardBorder,
            }}>
            <TouchableOpacity
              onPress={handleCompleteOrder}
              disabled={updateOrder.isPending || createOrder.isPending}
              testID="complete-order-button"
              style={{
                backgroundColor: COLORS.accent,
                borderRadius: 14,
                paddingVertical: 16,
                alignItems: 'center',
                opacity: updateOrder.isPending || createOrder.isPending ? 0.6 : 1,
              }}>
              {updateOrder.isPending || createOrder.isPending ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={{ color: '#FFFFFF', fontSize: 16, fontWeight: '700' }}>
                  Complete Current Order
                </Text>
              )}
            </TouchableOpacity>
          </View>
        )}

      <NewOrderModal
        visible={showNewOrderModal}
        defaultName={`Order #${nextOrderNumber}`}
        onConfirm={handleNewOrderConfirm}
        onCancel={() => setShowNewOrderModal(false)}
        isPending={createOrder.isPending}
      />

      <SetCustomerModal
        visible={showSetCustomerModal}
        order={customerTargetOrder}
        onConfirm={handleSetCustomerConfirm}
        onCancel={() => {
          setShowSetCustomerModal(false);
          setCustomerTargetOrder(null);
        }}
        isPending={updateOrder.isPending}
      />
    </View>
  );
}
