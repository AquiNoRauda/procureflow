import React, { useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  SectionList,
  Alert,
  Modal,
  ScrollView,
  Platform,
  KeyboardAvoidingView,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useColorScheme } from '@/lib/useColorScheme';
import useCatalogStore, {
  CatalogSupplier,
  CatalogItem,
  SUPPLIER_PALETTE,
} from '@/lib/state/catalog-store';
import { Plus, Trash2, ChevronRight, X, Check, BookOpen, Tag, FileDown } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import Animated, { FadeIn } from 'react-native-reanimated';
import { exportCatalogPDF } from '@/lib/pdf-export';

interface Section {
  supplier: CatalogSupplier;
  data: CatalogItem[];
}

// ── Color picker ─────────────────────────────────────────────────────────────
function ColorPicker({
  selected,
  onSelect,
}: {
  selected: string;
  onSelect: (c: string) => void;
}) {
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 8 }}>
      {SUPPLIER_PALETTE.map((c) => (
        <TouchableOpacity
          key={c}
          onPress={() => onSelect(c)}
          style={{
            width: 34,
            height: 34,
            borderRadius: 17,
            backgroundColor: c,
            alignItems: 'center',
            justifyContent: 'center',
            borderWidth: selected === c ? 3 : 0,
            borderColor: '#fff',
            shadowColor: selected === c ? c : 'transparent',
            shadowOpacity: 0.6,
            shadowRadius: 4,
            elevation: selected === c ? 4 : 0,
          }}>
          {selected === c && <Check size={16} color="#fff" />}
        </TouchableOpacity>
      ))}
    </View>
  );
}

// ── Add/Edit Supplier Modal ───────────────────────────────────────────────────
function SupplierModal({
  visible,
  existing,
  onClose,
  onSave,
}: {
  visible: boolean;
  existing: CatalogSupplier | null;
  onClose: () => void;
  onSave: (name: string, color: string) => void;
}) {
  const isDark = useColorScheme() === 'dark';
  const [name, setName] = useState(existing?.name ?? '');
  const [color, setColor] = useState(existing?.color ?? SUPPLIER_PALETTE[0]);

  React.useEffect(() => {
    setName(existing?.name ?? '');
    setColor(existing?.color ?? SUPPLIER_PALETTE[0]);
  }, [existing, visible]);

  const colors = {
    bg: isDark ? '#1E293B' : '#FFFFFF',
    text: isDark ? '#F1F5F9' : '#0F172A',
    textSecondary: isDark ? '#94A3B8' : '#64748B',
    inputBg: isDark ? '#334155' : '#F1F5F9',
    border: isDark ? '#475569' : '#E2E8F0',
    overlay: isDark ? 'rgba(0,0,0,0.7)' : 'rgba(0,0,0,0.4)',
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: colors.overlay }}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <View style={{ backgroundColor: colors.bg, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
              <Text style={{ color: colors.text, fontSize: 18, fontWeight: '700' }}>
                {existing ? 'Edit Supplier' : 'New Supplier'}
              </Text>
              <TouchableOpacity onPress={onClose}>
                <X size={22} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <Text style={{ color: colors.textSecondary, fontSize: 12, fontWeight: '600', marginBottom: 6 }}>
              SUPPLIER NAME
            </Text>
            <TextInput
              value={name}
              onChangeText={setName}
              placeholder="e.g. Green Valley Co"
              placeholderTextColor={colors.textSecondary}
              autoFocus
              style={{
                backgroundColor: colors.inputBg,
                borderRadius: 12,
                paddingHorizontal: 14,
                paddingVertical: 12,
                fontSize: 16,
                color: colors.text,
                marginBottom: 20,
              }}
            />

            <Text style={{ color: colors.textSecondary, fontSize: 12, fontWeight: '600', marginBottom: 4 }}>
              COLOR
            </Text>
            <ColorPicker selected={color} onSelect={setColor} />

            <TouchableOpacity
              onPress={() => {
                if (!name.trim()) return;
                onSave(name.trim(), color);
              }}
              style={{
                marginTop: 24,
                backgroundColor: color,
                borderRadius: 14,
                paddingVertical: 14,
                alignItems: 'center',
              }}>
              <Text style={{ color: '#fff', fontSize: 16, fontWeight: '700' }}>
                {existing ? 'Save Changes' : 'Add Supplier'}
              </Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

// ── Add Item Modal ────────────────────────────────────────────────────────────
function ItemModal({
  visible,
  supplier,
  onClose,
  onSave,
}: {
  visible: boolean;
  supplier: CatalogSupplier | null;
  onClose: () => void;
  onSave: (name: string, unit: string, category: string) => void;
}) {
  const isDark = useColorScheme() === 'dark';
  const [name, setName] = useState('');
  const [unit, setUnit] = useState('');
  const [category, setCategory] = useState('');

  React.useEffect(() => {
    if (visible) { setName(''); setUnit(''); setCategory(''); }
  }, [visible]);

  const colors = {
    bg: isDark ? '#1E293B' : '#FFFFFF',
    text: isDark ? '#F1F5F9' : '#0F172A',
    textSecondary: isDark ? '#94A3B8' : '#64748B',
    inputBg: isDark ? '#334155' : '#F1F5F9',
    overlay: isDark ? 'rgba(0,0,0,0.7)' : 'rgba(0,0,0,0.4)',
  };

  const accent = supplier?.color ?? '#2563EB';

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: colors.overlay }}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <View style={{ backgroundColor: colors.bg, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
              <View>
                <Text style={{ color: colors.text, fontSize: 18, fontWeight: '700' }}>New Item</Text>
                {supplier != null && (
                  <Text style={{ color: accent, fontSize: 13, marginTop: 2 }}>{supplier.name}</Text>
                )}
              </View>
              <TouchableOpacity onPress={onClose}>
                <X size={22} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            {[
              { label: 'ITEM NAME', value: name, onChange: setName, placeholder: 'e.g. Cherry Tomatoes', autoFocus: true },
              { label: 'UNIT', value: unit, onChange: setUnit, placeholder: 'e.g. kg, pcs, liters, boxes', autoFocus: false },
              { label: 'CATEGORY (optional)', value: category, onChange: setCategory, placeholder: 'e.g. Produce, Meat…', autoFocus: false },
            ].map(({ label, value, onChange, placeholder, autoFocus }) => (
              <View key={label} style={{ marginBottom: 16 }}>
                <Text style={{ color: colors.textSecondary, fontSize: 12, fontWeight: '600', marginBottom: 6 }}>
                  {label}
                </Text>
                <TextInput
                  value={value}
                  onChangeText={onChange}
                  placeholder={placeholder}
                  placeholderTextColor={colors.textSecondary}
                  autoFocus={autoFocus}
                  style={{
                    backgroundColor: colors.inputBg,
                    borderRadius: 12,
                    paddingHorizontal: 14,
                    paddingVertical: 12,
                    fontSize: 15,
                    color: colors.text,
                  }}
                />
              </View>
            ))}

            <TouchableOpacity
              onPress={() => {
                if (!name.trim() || !unit.trim()) return;
                onSave(name.trim(), unit.trim(), category.trim() || 'General');
              }}
              style={{
                marginTop: 4,
                backgroundColor: accent,
                borderRadius: 14,
                paddingVertical: 14,
                alignItems: 'center',
              }}>
              <Text style={{ color: '#fff', fontSize: 16, fontWeight: '700' }}>Add Item</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

// ── Main Screen ───────────────────────────────────────────────────────────────
export default function CatalogScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const suppliers = useCatalogStore((s) => s.suppliers);
  const catalogItems = useCatalogStore((s) => s.items);
  const addSupplier = useCatalogStore((s) => s.addSupplier);
  const updateSupplier = useCatalogStore((s) => s.updateSupplier);
  const removeSupplier = useCatalogStore((s) => s.removeSupplier);
  const addItem = useCatalogStore((s) => s.addItem);
  const removeItem = useCatalogStore((s) => s.removeItem);

  const [supplierModal, setSupplierModal] = useState<{ visible: boolean; existing: CatalogSupplier | null }>({ visible: false, existing: null });
  const [itemModal, setItemModal] = useState<{ visible: boolean; supplier: CatalogSupplier | null }>({ visible: false, supplier: null });
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [exporting, setExporting] = useState(false);

  const handleExportCatalog = useCallback(async () => {
    if (suppliers.length === 0) return;
    setExporting(true);
    try {
      await exportCatalogPDF(suppliers, catalogItems);
    } catch {
      Alert.alert('Export failed', 'Could not generate the PDF. Please try again.');
    } finally {
      setExporting(false);
    }
  }, [suppliers, catalogItems]);

  const colors = useMemo(() => ({
    bg: isDark ? '#0F172A' : '#F8FAFC',
    card: isDark ? '#1E293B' : '#FFFFFF',
    cardBorder: isDark ? '#334155' : '#E2E8F0',
    text: isDark ? '#F1F5F9' : '#0F172A',
    textSecondary: isDark ? '#94A3B8' : '#64748B',
    accent: '#2563EB',
    danger: '#EF4444',
    rowBorder: isDark ? '#1E293B' : '#F1F5F9',
  }), [isDark]);

  const sections: Section[] = useMemo(() =>
    suppliers.map((s) => ({
      supplier: s,
      data: catalogItems.filter((i) => i.supplierId === s.id),
    })), [suppliers, catalogItems]);

  const toggleExpand = useCallback((id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, []);

  const handleAddSupplier = useCallback((name: string, color: string) => {
    addSupplier(name, color);
    setSupplierModal({ visible: false, existing: null });
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }, [addSupplier]);

  const handleEditSupplier = useCallback((name: string, color: string) => {
    const { existing } = supplierModal;
    if (!existing) return;
    updateSupplier(existing.id, name, color);
    setSupplierModal({ visible: false, existing: null });
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }, [supplierModal, updateSupplier]);

  const handleRemoveSupplier = useCallback((supplier: CatalogSupplier) => {
    const itemCount = catalogItems.filter((i) => i.supplierId === supplier.id).length;
    Alert.alert(
      `Remove ${supplier.name}?`,
      itemCount > 0
        ? `This will also remove ${itemCount} item${itemCount !== 1 ? 's' : ''} from the catalog.`
        : 'This supplier has no items.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => {
            removeSupplier(supplier.id);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
          },
        },
      ]
    );
  }, [catalogItems, removeSupplier]);

  const handleAddItem = useCallback((name: string, unit: string, category: string) => {
    const { supplier } = itemModal;
    if (!supplier) return;
    addItem(supplier.id, supplier.name, name, unit, category);
    setItemModal({ visible: false, supplier: null });
    // Keep supplier expanded
    setExpandedIds((prev) => new Set(prev).add(supplier.id));
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }, [itemModal, addItem]);

  const handleRemoveItem = useCallback((item: CatalogItem) => {
    Alert.alert(`Remove "${item.name}"?`, 'It will be removed from the catalog.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: () => {
          removeItem(item.id);
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        },
      },
    ]);
  }, [removeItem]);

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        {/* Header */}
        <View style={{ paddingHorizontal: 20, paddingTop: 8, paddingBottom: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <View>
            <Text style={{ color: colors.text, fontSize: 28, fontWeight: '800' }}>Catalog</Text>
            <Text style={{ color: colors.textSecondary, fontSize: 14, marginTop: 2 }}>
              {suppliers.length} suppliers · {catalogItems.length} items
            </Text>
          </View>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            {suppliers.length > 0 && (
              <TouchableOpacity
                onPress={handleExportCatalog}
                disabled={exporting}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 5,
                  backgroundColor: isDark ? '#1E293B' : '#F1F5F9',
                  borderWidth: 1,
                  borderColor: colors.cardBorder,
                  paddingHorizontal: 12,
                  paddingVertical: 9,
                  borderRadius: 12,
                  opacity: exporting ? 0.6 : 1,
                }}>
                {exporting
                  ? <ActivityIndicator size="small" color={colors.accent} />
                  : <FileDown size={15} color={colors.accent} />}
                <Text style={{ color: colors.accent, fontSize: 13, fontWeight: '600' }}>
                  {exporting ? 'Exporting…' : 'PDF'}
                </Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              onPress={() => setSupplierModal({ visible: true, existing: null })}
              style={{ flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: colors.accent, paddingHorizontal: 14, paddingVertical: 9, borderRadius: 12 }}>
              <Plus size={16} color="#fff" />
              <Text style={{ color: '#fff', fontSize: 13, fontWeight: '700' }}>Supplier</Text>
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 32 }}>
          {sections.length === 0 ? (
            <View style={{ alignItems: 'center', justifyContent: 'center', paddingTop: 80 }}>
              <View style={{ width: 72, height: 72, borderRadius: 20, backgroundColor: isDark ? '#1E3A5F' : '#DBEAFE', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
                <BookOpen size={36} color={colors.accent} />
              </View>
              <Text style={{ color: colors.text, fontSize: 18, fontWeight: '700' }}>No suppliers yet</Text>
              <Text style={{ color: colors.textSecondary, fontSize: 14, textAlign: 'center', marginTop: 6, lineHeight: 20 }}>
                Tap "Supplier" to add your first supplier and start building your catalog.
              </Text>
            </View>
          ) : (
            sections.map(({ supplier, data: supplierItems }) => {
              const expanded = expandedIds.has(supplier.id);
              return (
                <Animated.View key={supplier.id} entering={FadeIn.duration(200)} style={{ marginBottom: 10 }}>
                  {/* Supplier row */}
                  <TouchableOpacity
                    onPress={() => toggleExpand(supplier.id)}
                    style={{
                      backgroundColor: colors.card,
                      borderRadius: expanded ? 14 : 14,
                      borderBottomLeftRadius: expanded ? 0 : 14,
                      borderBottomRightRadius: expanded ? 0 : 14,
                      padding: 14,
                      borderWidth: 1,
                      borderColor: colors.cardBorder,
                      borderLeftWidth: 4,
                      borderLeftColor: supplier.color,
                      flexDirection: 'row',
                      alignItems: 'center',
                    }}>
                    <View style={{ flex: 1 }}>
                      <Text style={{ color: colors.text, fontSize: 16, fontWeight: '700' }}>{supplier.name}</Text>
                      <Text style={{ color: colors.textSecondary, fontSize: 12, marginTop: 2 }}>
                        {supplierItems.length} item{supplierItems.length !== 1 ? 's' : ''}
                      </Text>
                    </View>
                    <TouchableOpacity
                      onPress={() => setSupplierModal({ visible: true, existing: supplier })}
                      style={{ paddingHorizontal: 8, paddingVertical: 4 }}>
                      <Text style={{ color: supplier.color, fontSize: 12, fontWeight: '600' }}>Edit</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => handleRemoveSupplier(supplier)}
                      style={{ paddingHorizontal: 8, paddingVertical: 4 }}>
                      <Trash2 size={16} color={colors.danger} />
                    </TouchableOpacity>
                    <ChevronRight
                      size={18}
                      color={colors.textSecondary}
                      style={{ transform: [{ rotate: expanded ? '90deg' : '0deg' }] }}
                    />
                  </TouchableOpacity>

                  {/* Expanded items */}
                  {expanded === true && (
                    <View style={{ backgroundColor: colors.card, borderWidth: 1, borderTopWidth: 0, borderColor: colors.cardBorder, borderBottomLeftRadius: 14, borderBottomRightRadius: 14, overflow: 'hidden' }}>
                      {supplierItems.map((item, idx) => (
                        <View
                          key={item.id}
                          style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            paddingHorizontal: 14,
                            paddingVertical: 11,
                            borderTopWidth: idx === 0 ? 1 : 1,
                            borderTopColor: colors.rowBorder,
                          }}>
                          <Tag size={13} color={supplier.color} style={{ marginRight: 10 }} />
                          <View style={{ flex: 1 }}>
                            <Text style={{ color: colors.text, fontSize: 14, fontWeight: '500' }}>{item.name}</Text>
                            <Text style={{ color: colors.textSecondary, fontSize: 11, marginTop: 1 }}>
                              {item.unit} · {item.category}
                            </Text>
                          </View>
                          <TouchableOpacity onPress={() => handleRemoveItem(item)} style={{ padding: 6 }}>
                            <Trash2 size={15} color={colors.danger} />
                          </TouchableOpacity>
                        </View>
                      ))}

                      {/* Add item row */}
                      <TouchableOpacity
                        onPress={() => setItemModal({ visible: true, supplier })}
                        style={{
                          flexDirection: 'row',
                          alignItems: 'center',
                          paddingHorizontal: 14,
                          paddingVertical: 12,
                          borderTopWidth: 1,
                          borderTopColor: colors.rowBorder,
                          gap: 8,
                        }}>
                        <Plus size={15} color={supplier.color} />
                        <Text style={{ color: supplier.color, fontSize: 14, fontWeight: '600' }}>Add item to {supplier.name}</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </Animated.View>
              );
            })
          )}
        </ScrollView>
      </SafeAreaView>

      <SupplierModal
        visible={supplierModal.visible}
        existing={supplierModal.existing}
        onClose={() => setSupplierModal({ visible: false, existing: null })}
        onSave={supplierModal.existing ? handleEditSupplier : handleAddSupplier}
      />

      <ItemModal
        visible={itemModal.visible}
        supplier={itemModal.supplier}
        onClose={() => setItemModal({ visible: false, supplier: null })}
        onSave={handleAddItem}
      />
    </View>
  );
}
