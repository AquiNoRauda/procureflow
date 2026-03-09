import React, { useMemo, useCallback, useState } from 'react';
import {
  View,
  Text,
  SectionList,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useColorScheme } from '@/lib/useColorScheme';
import { usePurchases, useUpdatePurchaseQty, useRemovePurchaseItem, useClearSupplierPurchases } from '@/lib/hooks/use-purchases';
import { PurchaseItem } from '@/lib/hooks/use-purchases';
import { useCatalog } from '@/lib/hooks/use-catalog';
import { getSupplierColor } from '@/lib/catalog';
import { Minus, Plus, Truck, PackageOpen, FileDown } from 'lucide-react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { exportOrderPDF } from '@/lib/pdf-export';

interface SupplierSection {
  title: string;
  totalQty: number;
  itemCount: number;
  data: PurchaseItem[];
}

export default function SupplierScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const { data: items = [] } = usePurchases();
  const updatePurchaseQty = useUpdatePurchaseQty();
  const removePurchaseItem = useRemovePurchaseItem();
  const clearSupplierPurchases = useClearSupplierPurchases();

  const { data: catalogData } = useCatalog();
  const suppliers = catalogData?.suppliers ?? [];
  const supplierColorMap = useMemo(() => {
    const map: Record<string, string> = {};
    suppliers.forEach(s => { map[s.name] = s.color; });
    return map;
  }, [suppliers]);

  const [exporting, setExporting] = useState(false);

  const handleExport = useCallback(async () => {
    if (items.length === 0) return;
    setExporting(true);
    try {
      await exportOrderPDF(items);
    } catch (e) {
      Alert.alert('Export failed', 'Could not generate the PDF. Please try again.');
    } finally {
      setExporting(false);
    }
  }, [items]);

  const sections: SupplierSection[] = useMemo(() => {
    const grouped: Record<string, PurchaseItem[]> = {};
    for (const item of items) {
      if (!grouped[item.supplier]) grouped[item.supplier] = [];
      grouped[item.supplier].push(item);
    }
    return Object.entries(grouped)
      .map(([supplier, supplierItems]) => ({
        title: supplier,
        totalQty: supplierItems.reduce((sum, i) => sum + i.quantity, 0),
        itemCount: supplierItems.length,
        data: supplierItems,
      }))
      .sort((a, b) => a.title.localeCompare(b.title));
  }, [items]);

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
      sectionBg: isDark ? '#0F172A' : '#F8FAFC',
    }),
    [isDark]
  );

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

  const handleClearSupplier = useCallback(
    (supplier: string) => {
      Alert.alert(
        `Clear ${supplier}`,
        `Remove all items from ${supplier}?`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Clear',
            style: 'destructive',
            onPress: () => {
              clearSupplierPurchases.mutate(supplier);
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
            },
          },
        ]
      );
    },
    [clearSupplierPurchases]
  );

  const renderSectionHeader = useCallback(
    ({ section }: { section: SupplierSection }) => {
      const supplierColor = getSupplierColor(section.title, supplierColorMap[section.title]);

      return (
        <View
          style={{
            backgroundColor: colors.sectionBg,
            paddingTop: 16,
            paddingBottom: 8,
            paddingHorizontal: 16,
          }}>
          <View
            style={{
              backgroundColor: supplierColor.bg,
              borderRadius: 14,
              padding: 14,
              borderLeftWidth: 4,
              borderLeftColor: supplierColor.accent,
            }}>
            <View className="flex-row items-center justify-between">
              <View className="flex-row items-center flex-1">
                <Truck size={20} color={supplierColor.accent} />
                <Text
                  style={{
                    color: supplierColor.text,
                    fontSize: 17,
                    fontWeight: '700',
                    marginLeft: 10,
                  }}>
                  {section.title}
                </Text>
              </View>
              <TouchableOpacity onPress={() => handleClearSupplier(section.title)}>
                <Text style={{ color: supplierColor.text, fontSize: 13, fontWeight: '600' }}>Clear</Text>
              </TouchableOpacity>
            </View>
            <View className="flex-row items-center mt-2" style={{ gap: 12 }}>
              <View
                style={{
                  backgroundColor: supplierColor.accent + '20',
                  paddingHorizontal: 10,
                  paddingVertical: 4,
                  borderRadius: 8,
                }}>
                <Text style={{ color: supplierColor.text, fontSize: 13, fontWeight: '600' }}>
                  {section.itemCount} {section.itemCount === 1 ? 'item' : 'items'}
                </Text>
              </View>
              <View
                style={{
                  backgroundColor: supplierColor.accent + '20',
                  paddingHorizontal: 10,
                  paddingVertical: 4,
                  borderRadius: 8,
                }}>
                <Text style={{ color: supplierColor.text, fontSize: 13, fontWeight: '600' }}>
                  {section.totalQty} total qty
                </Text>
              </View>
            </View>
          </View>
        </View>
      );
    },
    [colors, handleClearSupplier, supplierColorMap]
  );

  const renderItem = useCallback(
    ({ item }: { item: PurchaseItem }) => {
      return (
        <Animated.View entering={FadeIn.duration(200)}>
          <View
            style={{
              marginHorizontal: 16,
              backgroundColor: colors.card,
              borderRadius: 12,
              padding: 12,
              marginTop: 6,
              borderWidth: 1,
              borderColor: colors.cardBorder,
            }}>
            <View className="flex-row items-center justify-between">
              <View className="flex-1 mr-3">
                <Text
                  style={{ color: colors.text, fontSize: 15, fontWeight: '500' }}
                  numberOfLines={1}>
                  {item.name}
                </Text>
                <Text style={{ color: colors.textSecondary, fontSize: 12, marginTop: 2 }}>
                  {item.unit}
                </Text>
              </View>

              <View className="flex-row items-center">
                <TouchableOpacity
                  onPress={() => handleDecrease(item)}
                  style={{
                    width: 30,
                    height: 30,
                    borderRadius: 8,
                    backgroundColor: colors.accentLight,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}>
                  <Minus size={14} color={colors.accent} />
                </TouchableOpacity>

                <Text
                  style={{
                    color: colors.text,
                    fontSize: 17,
                    fontWeight: '700',
                    minWidth: 36,
                    textAlign: 'center',
                  }}>
                  {item.quantity}
                </Text>

                <TouchableOpacity
                  onPress={() => handleIncrease(item)}
                  style={{
                    width: 30,
                    height: 30,
                    borderRadius: 8,
                    backgroundColor: colors.accent,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}>
                  <Plus size={14} color="#FFFFFF" />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Animated.View>
      );
    },
    [colors, handleDecrease, handleIncrease]
  );

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        {/* Header */}
        <View className="px-5 pt-2 pb-3">
          <View className="flex-row items-center justify-between">
            <View>
              <Text style={{ color: colors.text, fontSize: 28, fontWeight: '800' }}>
                By Supplier
              </Text>
              <Text style={{ color: colors.textSecondary, fontSize: 14, marginTop: 2 }}>
                {sections.length} {sections.length === 1 ? 'supplier' : 'suppliers'} with orders
              </Text>
            </View>
            {sections.length > 0 && (
              <TouchableOpacity
                onPress={handleExport}
                disabled={exporting}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 6,
                  paddingHorizontal: 14,
                  paddingVertical: 9,
                  borderRadius: 12,
                  backgroundColor: colors.accent,
                  opacity: exporting ? 0.6 : 1,
                }}>
                {exporting ? (
                  <ActivityIndicator size="small" color="#ffffff" />
                ) : (
                  <FileDown size={16} color="#ffffff" />
                )}
                <Text style={{ color: '#ffffff', fontSize: 13, fontWeight: '700' }}>
                  {exporting ? 'Exporting…' : 'Export PDF'}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {sections.length === 0 ? (
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
              <PackageOpen size={36} color={colors.accent} />
            </View>
            <Text
              style={{
                color: colors.text,
                fontSize: 18,
                fontWeight: '700',
                textAlign: 'center',
              }}>
              No orders yet
            </Text>
            <Text
              style={{
                color: colors.textSecondary,
                fontSize: 14,
                textAlign: 'center',
                marginTop: 6,
                lineHeight: 20,
              }}>
              Add items from the Orders tab and they will automatically group here by supplier.
            </Text>
          </View>
        ) : (
          <SectionList
            sections={sections}
            renderSectionHeader={renderSectionHeader}
            renderItem={renderItem}
            keyExtractor={(item) => item.id}
            contentContainerStyle={{ paddingBottom: 24 }}
            showsVerticalScrollIndicator={false}
            stickySectionHeadersEnabled={false}
          />
        )}
      </SafeAreaView>
    </View>
  );
}
