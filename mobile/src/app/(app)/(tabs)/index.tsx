import React, { useState, useRef, useCallback, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  Keyboard,
  Alert,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useColorScheme } from '@/lib/useColorScheme';
import { usePurchases, useAddPurchaseItem, useUpdatePurchaseQty, useRemovePurchaseItem, useClearAllPurchases } from '@/lib/hooks/use-purchases';
import { PurchaseItem } from '@/lib/hooks/use-purchases';
import { useOrderStore } from '@/lib/state/order-store';
import { useOrders, useCreateOrder, Order } from '@/lib/hooks/use-orders';
import { useCatalog } from '@/lib/hooks/use-catalog';
import { getCatalogItemByName, getSupplierColor } from '@/lib/catalog';
import { Plus, Minus, Trash2, Send, Package, ChevronDown, User } from 'lucide-react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

// Parse a bulk entry string like "tomatoes-5, chicken breast-3, eggs-12"
// Supports separators: comma, semicolon, newline
// Each token: "item name-qty" or "item name qty"
function parseBulkInput(text: string): Array<{ name: string; qty: number }> {
  const tokens = text.split(/[,;\n]+/).map((t) => t.trim()).filter(Boolean);
  const results: Array<{ name: string; qty: number }> = [];
  for (const token of tokens) {
    // Try "name-qty" pattern first (e.g. "tomatoes-5")
    const dashMatch = token.match(/^(.+?)-(\d+)$/);
    if (dashMatch) {
      const name = dashMatch[1].trim();
      const qty = parseInt(dashMatch[2], 10);
      if (name && qty > 0) results.push({ name, qty });
      continue;
    }
    // Try "name qty" pattern (e.g. "tomatoes 5")
    const spaceMatch = token.match(/^(.+?)\s+(\d+)$/);
    if (spaceMatch) {
      const name = spaceMatch[1].trim();
      const qty = parseInt(spaceMatch[2], 10);
      if (name && qty > 0) results.push({ name, qty });
      continue;
    }
    // Try "qty name" pattern (e.g. "5 tomatoes")
    const reverseMatch = token.match(/^(\d+)\s+(.+)$/);
    if (reverseMatch) {
      const qty = parseInt(reverseMatch[1], 10);
      const name = reverseMatch[2].trim();
      if (name && qty > 0) results.push({ name, qty });
    }
  }
  return results;
}

export default function OrdersScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const { data: orders = [] } = useOrders();
  const createOrder = useCreateOrder();
  const activeOrderId = useOrderStore((s) => s.activeOrderId);
  const setActiveOrderId = useOrderStore((s) => s.setActiveOrderId);

  const drafts = useMemo(() => orders.filter((o) => o.status === 'draft'), [orders]);
  const activeOrder = useMemo(
    () => orders.find((o) => o.id === activeOrderId) ?? null,
    [orders, activeOrderId]
  );

  const isCreatingRef = useRef(false);

  useEffect(() => {
    if (isCreatingRef.current || createOrder.isPending) return;

    const draftOrders = orders.filter((o) => o.status === 'draft');

    if (!activeOrderId || !draftOrders.find((o) => o.id === activeOrderId)) {
      if (draftOrders.length > 0) {
        setActiveOrderId(draftOrders[0].id);
      } else if (draftOrders.length === 0) {
        isCreatingRef.current = true;
        createOrder.mutate(
          { name: 'Order #1' },
          {
            onSuccess: (newOrder: Order) => {
              setActiveOrderId(newOrder.id);
              isCreatingRef.current = false;
            },
            onError: () => {
              isCreatingRef.current = false;
            },
          }
        );
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orders, activeOrderId]);

  const { data: items = [] } = usePurchases(activeOrderId);
  const addPurchaseItem = useAddPurchaseItem();
  const updatePurchaseQty = useUpdatePurchaseQty();
  const removePurchaseItem = useRemovePurchaseItem();
  const clearAllPurchases = useClearAllPurchases();

  const { data: catalogData } = useCatalog();
  const catalogItems = catalogData?.items ?? [];
  const suppliers = catalogData?.suppliers ?? [];

  // Build color lookup map keyed by supplier name
  const supplierColorMap = useMemo(() => {
    const map: Record<string, string> = {};
    suppliers.forEach(s => { map[s.name] = s.color; });
    return map;
  }, [suppliers]);

  const [bulkText, setBulkText] = useState('');
  const inputRef = useRef<TextInput>(null);

  const handleSubmit = useCallback(() => {
    if (!bulkText.trim()) return;

    const parsed = parseBulkInput(bulkText);
    if (parsed.length === 0) {
      Alert.alert(
        'Could not parse input',
        'Use format: tomatoes-5, chicken-3\nOr separate items with commas.'
      );
      return;
    }

    const notFound: string[] = [];
    let addedCount = 0;

    for (const { name, qty } of parsed) {
      const entry = getCatalogItemByName(name, catalogItems);
      if (!entry) {
        notFound.push(name);
        continue;
      }
      if (!activeOrderId) continue;
      addPurchaseItem.mutate({ name: entry.name, supplier: entry.supplierName, quantity: qty, unit: entry.unit, orderId: activeOrderId });
      addedCount++;
    }

    if (addedCount > 0) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setBulkText('');
      inputRef.current?.focus();
    }

    if (notFound.length > 0) {
      Alert.alert(
        `${notFound.length} item${notFound.length > 1 ? 's' : ''} not found`,
        `Not in catalog: ${notFound.join(', ')}\n\nCheck spelling or add them to the catalog.`
      );
    }
  }, [bulkText, addPurchaseItem, catalogItems]);

  const handleClearAll = useCallback(() => {
    Alert.alert('Clear All Orders', 'Are you sure you want to clear all items?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Clear',
        style: 'destructive',
        onPress: () => {
          if (activeOrderId) clearAllPurchases.mutate(activeOrderId);
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        },
      },
    ]);
  }, [clearAllPurchases]);

  const handleIncrease = useCallback(
    (item: PurchaseItem) => {
      updatePurchaseQty.mutate({ id: item.id, quantity: item.quantity + 1 });
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    },
    [updatePurchaseQty]
  );

  const handleDecrease = useCallback(
    (item: PurchaseItem) => {
      if (item.quantity <= 1) {
        removePurchaseItem.mutate(item.id);
      } else {
        updatePurchaseQty.mutate({ id: item.id, quantity: item.quantity - 1 });
      }
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    },
    [updatePurchaseQty, removePurchaseItem]
  );

  const handleDelete = useCallback(
    (item: PurchaseItem) => {
      removePurchaseItem.mutate(item.id);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    },
    [removePurchaseItem]
  );

  const totalItems = useMemo(() => items.reduce((sum, i) => sum + i.quantity, 0), [items]);

  const colors = useMemo(
    () => ({
      bg: isDark ? '#0F172A' : '#F8FAFC',
      card: isDark ? '#1E293B' : '#FFFFFF',
      cardBorder: isDark ? '#334155' : '#E2E8F0',
      text: isDark ? '#F1F5F9' : '#0F172A',
      textSecondary: isDark ? '#94A3B8' : '#64748B',
      accent: '#2563EB',
      accentLight: isDark ? '#1E3A5F' : '#DBEAFE',
      danger: '#EF4444',
    }),
    [isDark]
  );

  const renderItem = useCallback(
    ({ item }: { item: PurchaseItem }) => {
      const supplierColor = getSupplierColor(item.supplier, supplierColorMap[item.supplier]);

      return (
        <Animated.View entering={FadeIn.duration(200)} exiting={FadeOut.duration(150)}>
          <View
            style={{
              backgroundColor: colors.card,
              borderRadius: 14,
              padding: 14,
              marginBottom: 8,
              borderWidth: 1,
              borderColor: colors.cardBorder,
              borderLeftWidth: 4,
              borderLeftColor: supplierColor.accent,
            }}>
            <View className="flex-row items-center justify-between">
              <View className="flex-1 mr-3">
                <Text
                  style={{ color: colors.text, fontSize: 16, fontWeight: '600' }}
                  numberOfLines={1}>
                  {item.name}
                </Text>
                <View className="flex-row items-center mt-1">
                  <View
                    style={{
                      backgroundColor: supplierColor.bg,
                      paddingHorizontal: 8,
                      paddingVertical: 2,
                      borderRadius: 6,
                    }}>
                    <Text style={{ color: supplierColor.text, fontSize: 11, fontWeight: '600' }}>
                      {item.supplier}
                    </Text>
                  </View>
                  <Text style={{ color: colors.textSecondary, fontSize: 12, marginLeft: 8 }}>
                    {item.unit}
                  </Text>
                </View>
              </View>

              <View className="flex-row items-center">
                <TouchableOpacity
                  onPress={() => handleDecrease(item)}
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 8,
                    backgroundColor: colors.accentLight,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}>
                  <Minus size={16} color={colors.accent} />
                </TouchableOpacity>

                <Text
                  style={{
                    color: colors.text,
                    fontSize: 18,
                    fontWeight: '700',
                    minWidth: 40,
                    textAlign: 'center',
                  }}>
                  {item.quantity}
                </Text>

                <TouchableOpacity
                  onPress={() => handleIncrease(item)}
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 8,
                    backgroundColor: colors.accent,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}>
                  <Plus size={16} color="#FFFFFF" />
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => handleDelete(item)}
                  style={{ marginLeft: 12, padding: 4 }}>
                  <Trash2 size={18} color={colors.danger} />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Animated.View>
      );
    },
    [colors, handleDecrease, handleIncrease, handleDelete, supplierColorMap]
  );

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        {/* Header */}
        <View className="px-5 pt-2 pb-3">
          <View className="flex-row items-center justify-between">
            <View>
              <Text style={{ color: colors.text, fontSize: 28, fontWeight: '800' }}>
                Purchases
              </Text>
              <Text style={{ color: colors.textSecondary, fontSize: 14, marginTop: 2 }}>
                {items.length} items{totalItems > 0 ? ` \u00B7 ${totalItems} total qty` : ''}
              </Text>
            </View>
            {items.length > 0 && (
              <TouchableOpacity
                onPress={handleClearAll}
                style={{
                  paddingHorizontal: 14,
                  paddingVertical: 8,
                  borderRadius: 10,
                  backgroundColor: isDark ? '#3B1A1A' : '#FEE2E2',
                }}>
                <Text style={{ color: colors.danger, fontSize: 13, fontWeight: '600' }}>
                  Clear All
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Order Picker Banner */}
        <TouchableOpacity
          onPress={() => router.push('/order-picker')}
          className="mx-4 mb-3 flex-row items-center justify-between px-4 py-3 rounded-xl bg-slate-800 border border-slate-700"
          activeOpacity={0.7}
        >
          <View className="flex-row items-center gap-2 flex-1">
            <View className="w-2 h-2 rounded-full bg-blue-500" />
            <View style={{ flex: 1 }}>
              <Text className="text-slate-100 font-semibold text-base" numberOfLines={1}>
                {activeOrder?.name ?? 'No Order Selected'}
              </Text>
              {activeOrder?.customer ? (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 1 }}>
                  <User size={10} color="#94a3b8" />
                  <Text style={{ color: '#94a3b8', fontSize: 12 }} numberOfLines={1}>
                    {activeOrder.customer}
                  </Text>
                </View>
              ) : null}
            </View>
            <View className="px-2 py-0.5 rounded-full bg-blue-500/20">
              <Text className="text-blue-400 text-xs font-medium">
                {activeOrder?.status === 'draft' ? 'Draft' : activeOrder?.status ?? ''}
              </Text>
            </View>
          </View>
          <View className="flex-row items-center gap-2">
            <Text className="text-slate-400 text-sm">{items.length} items</Text>
            <ChevronDown size={16} color="#94a3b8" />
          </View>
        </TouchableOpacity>

        {/* Bulk Insert Bar */}
        <View
          style={{
            marginHorizontal: 16,
            marginBottom: 12,
            backgroundColor: colors.card,
            borderRadius: 16,
            borderWidth: 1,
            borderColor: colors.cardBorder,
          }}>
          <View style={{ padding: 10 }}>
            <Text style={{ color: colors.textSecondary, fontSize: 11, fontWeight: '600', marginBottom: 6, letterSpacing: 0.5 }}>
              QUICK INSERT — e.g. tomatoes-5, chicken-3, eggs-12
            </Text>
            <View className="flex-row items-center" style={{ gap: 8 }}>
              <TextInput
                ref={inputRef}
                value={bulkText}
                onChangeText={setBulkText}
                placeholder="tomatoes-5, chicken-3, eggs-12"
                placeholderTextColor={colors.textSecondary}
                style={{
                  flex: 1,
                  fontSize: 15,
                  color: colors.text,
                  backgroundColor: isDark ? '#334155' : '#F1F5F9',
                  borderRadius: 10,
                  paddingHorizontal: 12,
                  paddingVertical: Platform.OS === 'ios' ? 10 : 8,
                }}
                returnKeyType="done"
                onSubmitEditing={handleSubmit}
                autoCorrect={false}
                autoCapitalize="none"
                multiline={false}
              />
              <TouchableOpacity
                onPress={handleSubmit}
                style={{
                  backgroundColor: bulkText.trim() ? colors.accent : (isDark ? '#334155' : '#E2E8F0'),
                  width: 44,
                  height: 44,
                  borderRadius: 12,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                <Send size={20} color={bulkText.trim() ? '#FFFFFF' : colors.textSecondary} />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Items List */}
        {items.length === 0 ? (
          <View className="flex-1 items-center justify-center px-10">
            <View
              style={{
                width: 72,
                height: 72,
                borderRadius: 20,
                backgroundColor: colors.accentLight,
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 16,
              }}>
              <Package size={36} color={colors.accent} />
            </View>
            <Text
              style={{
                color: colors.text,
                fontSize: 18,
                fontWeight: '700',
                textAlign: 'center',
              }}>
              No items yet
            </Text>
            <Text
              style={{
                color: colors.textSecondary,
                fontSize: 14,
                textAlign: 'center',
                marginTop: 6,
                lineHeight: 20,
              }}>
              Type items above using format: tomatoes-5, chicken-3{'\n'}Supplier fills automatically.
            </Text>
          </View>
        ) : (
          <FlatList
            data={items}
            renderItem={renderItem}
            keyExtractor={(item) => item.id}
            contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 20 }}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            onScrollBeginDrag={Keyboard.dismiss}
          />
        )}
      </SafeAreaView>
    </View>
  );
}
