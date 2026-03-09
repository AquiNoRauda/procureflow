import React, { useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { X, ChevronRight, Clock, PackageOpen, Trash2 } from 'lucide-react-native';
import { useOrders, useDeleteOrder } from '@/lib/hooks/use-orders';
import type { Order } from '@/lib/hooks/use-orders';

const COLORS = {
  bg: '#0F172A',
  card: '#1E293B',
  cardBorder: '#334155',
  text: '#F1F5F9',
  textSecondary: '#94A3B8',
  accent: '#2563EB',
  accentLight: '#1E3A5F',
};

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export default function OrderHistoryScreen() {
  const { data: orders = [], isLoading } = useOrders();
  const deleteOrder = useDeleteOrder();

  const handleDelete = (order: Order) => {
    Alert.alert(
      'Delete Order',
      `Delete "${order.name}"? This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => deleteOrder.mutate(order.id),
        },
      ]
    );
  };

  const completed = useMemo(
    () =>
      orders
        .filter((o) => o.status === 'completed')
        .sort((a, b) => {
          const dateA = new Date(a.completedAt ?? a.createdAt).getTime();
          const dateB = new Date(b.completedAt ?? b.createdAt).getTime();
          return dateB - dateA;
        }),
    [orders]
  );

  const handleOrderPress = (order: Order) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    router.push({ pathname: '/order-detail' as any, params: { id: order.id, name: order.name } });
  };

  const renderItem = ({ item }: { item: Order }) => {
    const itemCount = item._count?.items ?? 0;
    const dateLabel = item.completedAt ? formatDate(item.completedAt) : formatDate(item.createdAt);

    return (
      <TouchableOpacity
        onPress={() => handleOrderPress(item)}
        onLongPress={() => handleDelete(item)}
        delayLongPress={400}
        testID={`history-order-${item.id}`}
        style={{
          backgroundColor: COLORS.card,
          borderRadius: 14,
          padding: 16,
          marginBottom: 10,
          borderWidth: 1,
          borderColor: COLORS.cardBorder,
          flexDirection: 'row',
          alignItems: 'center',
        }}>
        <View style={{ flex: 1 }}>
          <Text
            style={{ color: COLORS.text, fontSize: 16, fontWeight: '600' }}
            numberOfLines={1}>
            {item.name}
          </Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 6, gap: 10 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <Clock size={12} color={COLORS.textSecondary} />
              <Text style={{ color: COLORS.textSecondary, fontSize: 13 }}>{dateLabel}</Text>
            </View>
            <View
              style={{
                backgroundColor: COLORS.accentLight,
                paddingHorizontal: 8,
                paddingVertical: 2,
                borderRadius: 6,
              }}>
              <Text style={{ color: COLORS.accent, fontSize: 12, fontWeight: '600' }}>
                {itemCount} {itemCount === 1 ? 'item' : 'items'}
              </Text>
            </View>
          </View>
        </View>
        <TouchableOpacity
          onPress={() => handleDelete(item)}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          style={{ padding: 6, marginRight: 4 }}>
          <Trash2 size={16} color="#EF4444" />
        </TouchableOpacity>
        <ChevronRight size={20} color={COLORS.textSecondary} />
      </TouchableOpacity>
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.bg }} testID="order-history-screen">
      <SafeAreaView style={{ flex: 1 }} edges={['top', 'bottom']}>
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
          <Text style={{ color: COLORS.text, fontSize: 24, fontWeight: '800' }}>
            Order History
          </Text>
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

        {isLoading ? (
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
            <ActivityIndicator color={COLORS.accent} testID="loading-indicator" />
          </View>
        ) : completed.length === 0 ? (
          <View
            style={{
              flex: 1,
              alignItems: 'center',
              justifyContent: 'center',
              paddingHorizontal: 40,
            }}>
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
              <PackageOpen size={36} color={COLORS.accent} />
            </View>
            <Text
              style={{
                color: COLORS.text,
                fontSize: 18,
                fontWeight: '700',
                textAlign: 'center',
              }}>
              No completed orders yet
            </Text>
            <Text
              style={{
                color: COLORS.textSecondary,
                fontSize: 14,
                textAlign: 'center',
                marginTop: 6,
                lineHeight: 20,
              }}>
              Completed orders will appear here once you finish a draft order.
            </Text>
          </View>
        ) : (
          <FlatList
            data={completed}
            renderItem={renderItem}
            keyExtractor={(item) => item.id}
            contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 24 }}
            showsVerticalScrollIndicator={false}
            testID="history-list"
          />
        )}
      </SafeAreaView>
    </View>
  );
}
