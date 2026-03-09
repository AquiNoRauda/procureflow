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
import { router, useLocalSearchParams } from 'expo-router';
import { ChevronLeft, FileDown, PackageOpen } from 'lucide-react-native';
import { useOrderItems } from '@/lib/hooks/use-orders';
import { exportOrderPDF } from '@/lib/pdf-export';
import type { PurchaseItem } from '@/lib/hooks/use-purchases';
import { useCatalog } from '@/lib/hooks/use-catalog';
import { getSupplierColor } from '@/lib/catalog';

interface SupplierSection {
  title: string;
  totalQty: number;
  itemCount: number;
  data: PurchaseItem[];
}

const COLORS = {
  bg: '#0F172A',
  card: '#1E293B',
  cardBorder: '#334155',
  text: '#F1F5F9',
  textSecondary: '#94A3B8',
  accent: '#2563EB',
  accentLight: '#1E3A5F',
  sectionBg: '#0F172A',
};

export default function OrderDetailScreen() {
  const { id, name } = useLocalSearchParams<{ id: string; name: string }>();
  const [exporting, setExporting] = useState(false);

  const { data: items = [], isLoading } = useOrderItems(id ?? null);

  const { data: catalogData } = useCatalog();
  const supplierColorMap = useMemo(() => {
    const map: Record<string, string> = {};
    (catalogData?.suppliers ?? []).forEach(s => { map[s.name] = s.color; });
    return map;
  }, [catalogData?.suppliers]);

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

  const handleExport = useCallback(async () => {
    if (items.length === 0) return;
    setExporting(true);
    try {
      await exportOrderPDF(items);
    } catch {
      Alert.alert('Export failed', 'Could not generate the PDF. Please try again.');
    } finally {
      setExporting(false);
    }
  }, [items]);

  const renderSectionHeader = useCallback(
    ({ section }: { section: SupplierSection }) => {
      const color = getSupplierColor(section.title, supplierColorMap[section.title]);
      return (
      <View
        style={{
          backgroundColor: COLORS.sectionBg,
          paddingTop: 16,
          paddingBottom: 6,
          paddingHorizontal: 16,
        }}>
        <View
          style={{
            backgroundColor: color.accent + '20',
            borderRadius: 12,
            padding: 12,
            borderLeftWidth: 4,
            borderLeftColor: color.accent,
          }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <Text style={{ color: color.accent, fontSize: 15, fontWeight: '700' }}>
              {section.title}
            </Text>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <View
                style={{
                  backgroundColor: color.accent + '30',
                  paddingHorizontal: 8,
                  paddingVertical: 3,
                  borderRadius: 6,
                }}>
                <Text style={{ color: COLORS.text, fontSize: 12, fontWeight: '600' }}>
                  {section.itemCount} {section.itemCount === 1 ? 'item' : 'items'}
                </Text>
              </View>
              <View
                style={{
                  backgroundColor: color.accent + '30',
                  paddingHorizontal: 8,
                  paddingVertical: 3,
                  borderRadius: 6,
                }}>
                <Text style={{ color: COLORS.text, fontSize: 12, fontWeight: '600' }}>
                  {section.totalQty} qty
                </Text>
              </View>
            </View>
          </View>
        </View>
      </View>
      );
    },
    [supplierColorMap]
  );

  const renderItem = useCallback(
    ({ item }: { item: PurchaseItem }) => (
      <View
        style={{
          marginHorizontal: 16,
          backgroundColor: COLORS.card,
          borderRadius: 12,
          padding: 14,
          marginTop: 6,
          borderWidth: 1,
          borderColor: COLORS.cardBorder,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
        <View style={{ flex: 1, marginRight: 12 }}>
          <Text style={{ color: COLORS.text, fontSize: 15, fontWeight: '500' }} numberOfLines={1}>
            {item.name}
          </Text>
          <Text style={{ color: COLORS.textSecondary, fontSize: 12, marginTop: 2 }}>
            {item.unit}
          </Text>
        </View>
        <View
          style={{
            backgroundColor: COLORS.accentLight,
            paddingHorizontal: 12,
            paddingVertical: 6,
            borderRadius: 8,
          }}>
          <Text style={{ color: COLORS.text, fontSize: 16, fontWeight: '700' }}>
            {item.quantity}
          </Text>
        </View>
      </View>
    ),
    []
  );

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.bg }} testID="order-detail-screen">
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        {/* Header */}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingHorizontal: 16,
            paddingTop: 8,
            paddingBottom: 14,
          }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
            <TouchableOpacity
              onPress={() => router.back()}
              testID="back-button"
              style={{ marginRight: 10, padding: 4 }}>
              <ChevronLeft size={24} color={COLORS.text} />
            </TouchableOpacity>
            <Text
              style={{ color: COLORS.text, fontSize: 20, fontWeight: '700', flex: 1 }}
              numberOfLines={1}>
              {name ?? 'Order Detail'}
            </Text>
          </View>
          {items.length > 0 && (
            <TouchableOpacity
              onPress={handleExport}
              disabled={exporting}
              testID="export-pdf-button"
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 6,
                paddingHorizontal: 14,
                paddingVertical: 8,
                borderRadius: 10,
                backgroundColor: COLORS.accent,
                opacity: exporting ? 0.6 : 1,
              }}>
              {exporting ? (
                <ActivityIndicator size="small" color="#ffffff" />
              ) : (
                <FileDown size={15} color="#ffffff" />
              )}
              <Text style={{ color: '#ffffff', fontSize: 13, fontWeight: '700' }}>
                {exporting ? 'Exporting…' : 'Export PDF'}
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {isLoading ? (
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
            <ActivityIndicator color={COLORS.accent} testID="loading-indicator" />
          </View>
        ) : sections.length === 0 ? (
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
              <PackageOpen size={36} color={COLORS.accent} />
            </View>
            <Text style={{ color: COLORS.text, fontSize: 18, fontWeight: '700', textAlign: 'center' }}>
              No items in this order
            </Text>
            <Text
              style={{
                color: COLORS.textSecondary,
                fontSize: 14,
                textAlign: 'center',
                marginTop: 6,
                lineHeight: 20,
              }}>
              This completed order had no items recorded.
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
            testID="items-section-list"
          />
        )}
      </SafeAreaView>
    </View>
  );
}
