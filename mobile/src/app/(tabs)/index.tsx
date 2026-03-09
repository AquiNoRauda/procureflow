import React, { useState, useRef, useCallback, useMemo } from 'react';
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
import { useColorScheme } from '@/lib/useColorScheme';
import usePurchasingStore, { PurchaseItem } from '@/lib/state/purchasing-store';
import { searchCatalog, getCatalogEntry, SUPPLIER_COLORS, CatalogEntry } from '@/lib/catalog';
import { Plus, Minus, Trash2, Search, Package } from 'lucide-react-native';
import Animated, { FadeIn, FadeOut, SlideInDown } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

export default function OrdersScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const items = usePurchasingStore((s) => s.items);
  const addItem = usePurchasingStore((s) => s.addItem);
  const updateQuantity = usePurchasingStore((s) => s.updateQuantity);
  const removeItem = usePurchasingStore((s) => s.removeItem);
  const clearAll = usePurchasingStore((s) => s.clearAll);

  const [itemText, setItemText] = useState('');
  const [qtyText, setQtyText] = useState('');
  const [suggestions, setSuggestions] = useState<CatalogEntry[]>([]);
  const [selectedEntry, setSelectedEntry] = useState<CatalogEntry | null>(null);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const qtyRef = useRef<TextInput>(null);
  const itemRef = useRef<TextInput>(null);

  const handleItemChange = useCallback((text: string) => {
    setItemText(text);
    setSelectedEntry(null);
    if (text.length >= 1) {
      const results = searchCatalog(text);
      setSuggestions(results);
      setShowSuggestions(results.length > 0);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  }, []);

  const handleSelectSuggestion = useCallback((entry: CatalogEntry) => {
    setItemText(entry.item);
    setSelectedEntry(entry);
    setSuggestions([]);
    setShowSuggestions(false);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    qtyRef.current?.focus();
  }, []);

  const handleSubmit = useCallback(() => {
    const entry = selectedEntry || getCatalogEntry(itemText);
    if (!entry) {
      Alert.alert('Item not found', 'Please select an item from the suggestions.');
      return;
    }
    const qty = parseInt(qtyText, 10);
    if (!qty || qty <= 0) {
      Alert.alert('Invalid quantity', 'Please enter a valid quantity.');
      return;
    }

    addItem(entry.item, entry.supplier, qty, entry.unit);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    setItemText('');
    setQtyText('');
    setSelectedEntry(null);
    setSuggestions([]);
    setShowSuggestions(false);
    itemRef.current?.focus();
  }, [itemText, qtyText, selectedEntry, addItem]);

  const handleClearAll = useCallback(() => {
    Alert.alert('Clear All Orders', 'Are you sure you want to clear all items?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Clear',
        style: 'destructive',
        onPress: () => {
          clearAll();
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        },
      },
    ]);
  }, [clearAll]);

  const handleIncrease = useCallback(
    (item: PurchaseItem) => {
      updateQuantity(item.id, item.quantity + 1);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    },
    [updateQuantity]
  );

  const handleDecrease = useCallback(
    (item: PurchaseItem) => {
      if (item.quantity <= 1) {
        removeItem(item.id);
      } else {
        updateQuantity(item.id, item.quantity - 1);
      }
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    },
    [updateQuantity, removeItem]
  );

  const handleDelete = useCallback(
    (item: PurchaseItem) => {
      removeItem(item.id);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    },
    [removeItem]
  );

  const totalItems = useMemo(() => items.reduce((sum, i) => sum + i.quantity, 0), [items]);

  const colors = useMemo(
    () => ({
      bg: isDark ? '#0F172A' : '#F8FAFC',
      card: isDark ? '#1E293B' : '#FFFFFF',
      cardBorder: isDark ? '#334155' : '#E2E8F0',
      text: isDark ? '#F1F5F9' : '#0F172A',
      textSecondary: isDark ? '#94A3B8' : '#64748B',
      inputBg: isDark ? '#1E293B' : '#FFFFFF',
      inputBorder: isDark ? '#475569' : '#CBD5E1',
      accent: '#2563EB',
      accentLight: isDark ? '#1E3A5F' : '#DBEAFE',
      danger: '#EF4444',
      suggestionBg: isDark ? '#1E293B' : '#FFFFFF',
      suggestionBorder: isDark ? '#334155' : '#E2E8F0',
    }),
    [isDark]
  );

  const renderItem = useCallback(
    ({ item }: { item: PurchaseItem }) => {
      const supplierColor = SUPPLIER_COLORS[item.supplier] || {
        bg: '#F3F4F6',
        text: '#374151',
        accent: '#6B7280',
      };

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
    [colors, handleDecrease, handleIncrease, handleDelete]
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

        {/* Quick Insert Bar */}
        <View
          style={{
            marginHorizontal: 16,
            marginBottom: 12,
            backgroundColor: colors.card,
            borderRadius: 16,
            borderWidth: 1,
            borderColor: colors.cardBorder,
            overflow: 'visible',
            zIndex: 100,
          }}>
          <View className="flex-row items-center p-3">
            <Search size={18} color={colors.textSecondary} />
            <TextInput
              ref={itemRef}
              value={itemText}
              onChangeText={handleItemChange}
              placeholder="Type item name..."
              placeholderTextColor={colors.textSecondary}
              style={{
                flex: 1,
                marginLeft: 8,
                fontSize: 16,
                color: colors.text,
                paddingVertical: Platform.OS === 'ios' ? 4 : 2,
              }}
              returnKeyType="next"
              onSubmitEditing={() => qtyRef.current?.focus()}
              autoCorrect={false}
            />
            {selectedEntry != null && (
              <View
                style={{
                  backgroundColor:
                    SUPPLIER_COLORS[selectedEntry.supplier]?.bg || '#F3F4F6',
                  paddingHorizontal: 8,
                  paddingVertical: 3,
                  borderRadius: 6,
                  marginRight: 8,
                }}>
                <Text
                  style={{
                    color:
                      SUPPLIER_COLORS[selectedEntry.supplier]?.text || '#374151',
                    fontSize: 10,
                    fontWeight: '700',
                  }}>
                  {selectedEntry.supplier}
                </Text>
              </View>
            )}
            <TextInput
              ref={qtyRef}
              value={qtyText}
              onChangeText={setQtyText}
              placeholder="Qty"
              placeholderTextColor={colors.textSecondary}
              keyboardType="number-pad"
              style={{
                width: 52,
                fontSize: 16,
                fontWeight: '700',
                color: colors.text,
                textAlign: 'center',
                backgroundColor: isDark ? '#334155' : '#F1F5F9',
                borderRadius: 10,
                paddingVertical: Platform.OS === 'ios' ? 6 : 4,
                marginRight: 8,
              }}
              returnKeyType="done"
              onSubmitEditing={handleSubmit}
            />
            <TouchableOpacity
              onPress={handleSubmit}
              style={{
                backgroundColor: colors.accent,
                width: 40,
                height: 40,
                borderRadius: 12,
                alignItems: 'center',
                justifyContent: 'center',
              }}>
              <Plus size={22} color="#FFFFFF" />
            </TouchableOpacity>
          </View>

          {/* Suggestions dropdown */}
          {showSuggestions === true && (
            <Animated.View
              entering={SlideInDown.duration(150)}
              style={{
                position: 'absolute',
                top: '100%',
                left: 0,
                right: 0,
                backgroundColor: colors.suggestionBg,
                borderRadius: 14,
                borderWidth: 1,
                borderColor: colors.suggestionBorder,
                marginTop: 4,
                maxHeight: 240,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: isDark ? 0.4 : 0.12,
                shadowRadius: 12,
                elevation: 8,
                zIndex: 200,
              }}>
              {suggestions.map((entry, idx) => {
                const supplierColor = SUPPLIER_COLORS[entry.supplier] || {
                  bg: '#F3F4F6',
                  text: '#374151',
                  accent: '#6B7280',
                };
                return (
                  <TouchableOpacity
                    key={`${entry.item}-${entry.supplier}`}
                    onPress={() => handleSelectSuggestion(entry)}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      paddingHorizontal: 14,
                      paddingVertical: 12,
                      borderBottomWidth: idx < suggestions.length - 1 ? 1 : 0,
                      borderBottomColor: colors.cardBorder,
                    }}>
                    <View style={{ flex: 1 }}>
                      <Text style={{ color: colors.text, fontSize: 15, fontWeight: '500' }}>
                        {entry.item}
                      </Text>
                    </View>
                    <View
                      style={{
                        backgroundColor: supplierColor.bg,
                        paddingHorizontal: 8,
                        paddingVertical: 3,
                        borderRadius: 6,
                        marginLeft: 8,
                      }}>
                      <Text style={{ color: supplierColor.text, fontSize: 11, fontWeight: '600' }}>
                        {entry.supplier}
                      </Text>
                    </View>
                    <Text
                      style={{
                        color: colors.textSecondary,
                        fontSize: 12,
                        marginLeft: 8,
                        minWidth: 30,
                        textAlign: 'right',
                      }}>
                      {entry.unit}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </Animated.View>
          )}
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
              Type an item name above and the supplier fills automatically. Add a quantity and hit
              the + button.
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
            onScrollBeginDrag={() => {
              Keyboard.dismiss();
              setShowSuggestions(false);
            }}
          />
        )}
      </SafeAreaView>
    </View>
  );
}
