import React, { useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  Modal,
  ScrollView,
  Platform,
  KeyboardAvoidingView,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useColorScheme } from '@/lib/useColorScheme';
import {
  useCatalog,
  useAddSupplier,
  useUpdateSupplier,
  useRemoveSupplier,
  useAddCatalogItem,
  useUpdateCatalogItem,
  useRemoveCatalogItem,
  CatalogSupplier,
  CatalogItem,
} from '@/lib/hooks/use-catalog';
import { Plus, Trash2, ChevronRight, X, Check, BookOpen, Tag, FileDown, Edit2 } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import Animated, { FadeIn } from 'react-native-reanimated';
import { exportCatalogPDF } from '@/lib/pdf-export';

const SUPPLIER_PALETTE = [
  "#2E7D32", "#AD1457", "#1565C0", "#E65100",
  "#6A1B9A", "#00838F", "#37474F", "#C62828",
  "#F57F17", "#1B5E20", "#880E4F", "#0D47A1",
];

function ColorPicker({ selected, onSelect }: { selected: string; onSelect: (c: string) => void }) {
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 8 }}>
      {SUPPLIER_PALETTE.map((c) => (
        <TouchableOpacity
          key={c}
          onPress={() => onSelect(c)}
          style={{
            width: 34, height: 34, borderRadius: 17,
            backgroundColor: c, alignItems: 'center', justifyContent: 'center',
            borderWidth: selected === c ? 3 : 0, borderColor: '#fff',
          }}>
          {selected === c && <Check size={16} color="#fff" />}
        </TouchableOpacity>
      ))}
    </View>
  );
}

function SupplierModal({
  visible, existing, onClose, onSave,
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

  const bg = isDark ? '#1E293B' : '#FFFFFF';
  const textColor = isDark ? '#F1F5F9' : '#0F172A';
  const secondary = isDark ? '#94A3B8' : '#64748B';
  const inputBg = isDark ? '#334155' : '#F1F5F9';

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.5)' }}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <View style={{ backgroundColor: bg, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
              <Text style={{ color: textColor, fontSize: 18, fontWeight: '700' }}>
                {existing != null ? 'Edit Supplier' : 'New Supplier'}
              </Text>
              <TouchableOpacity onPress={onClose}><X size={22} color={secondary} /></TouchableOpacity>
            </View>
            <Text style={{ color: secondary, fontSize: 12, fontWeight: '600', marginBottom: 6 }}>SUPPLIER NAME</Text>
            <TextInput
              value={name} onChangeText={setName} placeholder="e.g. Green Valley Co"
              placeholderTextColor={secondary} autoFocus
              style={{ backgroundColor: inputBg, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 16, color: textColor, marginBottom: 20 }}
            />
            <Text style={{ color: secondary, fontSize: 12, fontWeight: '600', marginBottom: 4 }}>COLOR</Text>
            <ColorPicker selected={color} onSelect={setColor} />
            <TouchableOpacity
              onPress={() => { if (name.trim()) onSave(name.trim(), color); }}
              style={{ marginTop: 24, backgroundColor: color, borderRadius: 14, paddingVertical: 14, alignItems: 'center' }}>
              <Text style={{ color: '#fff', fontSize: 16, fontWeight: '700' }}>
                {existing != null ? 'Save Changes' : 'Add Supplier'}
              </Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

function ItemModal({
  visible, supplier, existingItem, onClose, onSave,
}: {
  visible: boolean;
  supplier: CatalogSupplier | null;
  existingItem: CatalogItem | null;
  onClose: () => void;
  onSave: (name: string, unit: string, category: string, description: string) => void;
}) {
  const isDark = useColorScheme() === 'dark';
  const [name, setName] = useState('');
  const [unit, setUnit] = useState('');
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');

  const isEditing = existingItem != null;

  React.useEffect(() => {
    if (visible) {
      setName(existingItem?.name ?? '');
      setUnit(existingItem?.unit ?? '');
      setCategory(existingItem?.category ?? '');
      setDescription(existingItem?.description ?? '');
    }
  }, [visible, existingItem]);

  const bg = isDark ? '#1E293B' : '#FFFFFF';
  const textColor = isDark ? '#F1F5F9' : '#0F172A';
  const secondary = isDark ? '#94A3B8' : '#64748B';
  const inputBg = isDark ? '#334155' : '#F1F5F9';
  const accent = supplier?.color ?? '#2563EB';

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.5)' }}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <View style={{ backgroundColor: bg, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
              <View>
                <Text style={{ color: textColor, fontSize: 18, fontWeight: '700' }}>{isEditing ? 'Edit Item' : 'New Item'}</Text>
                {supplier != null && <Text style={{ color: accent, fontSize: 13, marginTop: 2 }}>{supplier.name}</Text>}
              </View>
              <TouchableOpacity onPress={onClose}><X size={22} color={secondary} /></TouchableOpacity>
            </View>
            {[
              { label: 'ITEM NAME', value: name, onChange: setName, placeholder: 'e.g. Cherry Tomatoes', autoFocus: true },
              { label: 'UNIT', value: unit, onChange: setUnit, placeholder: 'e.g. kg, pcs, liters', autoFocus: false },
              { label: 'CATEGORY (optional)', value: category, onChange: setCategory, placeholder: 'e.g. Produce, Meat…', autoFocus: false },
            ].map(({ label, value, onChange, placeholder, autoFocus: af }) => (
              <View key={label} style={{ marginBottom: 16 }}>
                <Text style={{ color: secondary, fontSize: 12, fontWeight: '600', marginBottom: 6 }}>{label}</Text>
                <TextInput value={value} onChangeText={onChange} placeholder={placeholder}
                  placeholderTextColor={secondary} autoFocus={af}
                  style={{ backgroundColor: inputBg, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, color: textColor }} />
              </View>
            ))}
            <View style={{ marginBottom: 16 }}>
              <Text style={{ color: secondary, fontSize: 12, fontWeight: '600', marginBottom: 6 }}>DESCRIPTION (optional)</Text>
              <TextInput
                value={description}
                onChangeText={setDescription}
                placeholder="e.g. Organic, refrigerated, 1L bottles…"
                placeholderTextColor={secondary}
                multiline
                numberOfLines={3}
                style={{ backgroundColor: inputBg, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, color: textColor, minHeight: 80, textAlignVertical: 'top' }}
              />
            </View>
            <TouchableOpacity
              onPress={() => { if (name.trim() && unit.trim()) onSave(name.trim(), unit.trim(), category.trim() || 'General', description.trim()); }}
              style={{ marginTop: 4, backgroundColor: accent, borderRadius: 14, paddingVertical: 14, alignItems: 'center' }}>
              <Text style={{ color: '#fff', fontSize: 16, fontWeight: '700' }}>{isEditing ? 'Save Changes' : 'Add Item'}</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

export default function CatalogScreen() {
  const isDark = useColorScheme() === 'dark';

  const { data } = useCatalog();
  const suppliers = data?.suppliers ?? [];
  const catalogItems = data?.items ?? [];

  const addSupplierMut = useAddSupplier();
  const updateSupplierMut = useUpdateSupplier();
  const removeSupplierMut = useRemoveSupplier();
  const addItemMut = useAddCatalogItem();
  const updateItemMut = useUpdateCatalogItem();
  const removeItemMut = useRemoveCatalogItem();

  const [supplierModal, setSupplierModal] = useState<{ visible: boolean; existing: CatalogSupplier | null }>({ visible: false, existing: null });
  const [itemModal, setItemModal] = useState<{ visible: boolean; supplier: CatalogSupplier | null; existingItem: CatalogItem | null }>({ visible: false, supplier: null, existingItem: null });
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [exporting, setExporting] = useState(false);

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

  const toggleExpand = useCallback((id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, []);

  const handleAddSupplier = useCallback((name: string, color: string) => {
    addSupplierMut.mutate({ id: Math.random().toString(36).slice(2), name, color });
    setSupplierModal({ visible: false, existing: null });
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }, [addSupplierMut]);

  const handleEditSupplier = useCallback((name: string, color: string) => {
    const { existing } = supplierModal;
    if (!existing) return;
    updateSupplierMut.mutate({ id: existing.id, name, color });
    setSupplierModal({ visible: false, existing: null });
  }, [supplierModal, updateSupplierMut]);

  const handleRemoveSupplier = useCallback((supplier: CatalogSupplier) => {
    const count = catalogItems.filter((i) => i.supplierId === supplier.id).length;
    Alert.alert(`Remove ${supplier.name}?`,
      count > 0 ? `This will also remove ${count} item${count !== 1 ? 's' : ''}.` : 'No items.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Remove', style: 'destructive', onPress: () => { removeSupplierMut.mutate(supplier.id); Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning); } },
      ]);
  }, [catalogItems, removeSupplierMut]);

  const handleAddItem = useCallback((name: string, unit: string, category: string, description: string) => {
    const { supplier } = itemModal;
    if (!supplier) return;
    addItemMut.mutate({ id: Math.random().toString(36).slice(2), name, supplierId: supplier.id, supplierName: supplier.name, unit, category, description: description || undefined });
    setItemModal({ visible: false, supplier: null, existingItem: null });
    setExpandedIds((prev) => new Set(prev).add(supplier.id));
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }, [itemModal, addItemMut]);

  const handleEditItem = useCallback((name: string, unit: string, category: string, description: string) => {
    const { existingItem } = itemModal;
    if (!existingItem) return;
    updateItemMut.mutate({ id: existingItem.id, name, unit, category, description: description || undefined });
    setItemModal({ visible: false, supplier: null, existingItem: null });
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }, [itemModal, updateItemMut]);

  const handleRemoveItem = useCallback((item: CatalogItem) => {
    Alert.alert(`Remove "${item.name}"?`, 'It will be removed from the catalog.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Remove', style: 'destructive', onPress: () => { removeItemMut.mutate(item.id); } },
      ]);
  }, [removeItemMut]);

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <View style={{ paddingHorizontal: 20, paddingTop: 8, paddingBottom: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <View>
            <Text style={{ color: colors.text, fontSize: 28, fontWeight: '800' }}>Catalog</Text>
            <Text style={{ color: colors.textSecondary, fontSize: 14, marginTop: 2 }}>
              {suppliers.length} suppliers · {catalogItems.length} items
            </Text>
          </View>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            {suppliers.length > 0 && (
              <TouchableOpacity onPress={handleExportCatalog} disabled={exporting}
                style={{ flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: isDark ? '#1E293B' : '#F1F5F9', borderWidth: 1, borderColor: colors.cardBorder, paddingHorizontal: 12, paddingVertical: 9, borderRadius: 12, opacity: exporting ? 0.6 : 1 }}>
                {exporting ? <ActivityIndicator size="small" color={colors.accent} /> : <FileDown size={15} color={colors.accent} />}
                <Text style={{ color: colors.accent, fontSize: 13, fontWeight: '600' }}>{exporting ? 'Exporting…' : 'PDF'}</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity onPress={() => setSupplierModal({ visible: true, existing: null })}
              style={{ flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: colors.accent, paddingHorizontal: 14, paddingVertical: 9, borderRadius: 12 }}>
              <Plus size={16} color="#fff" />
              <Text style={{ color: '#fff', fontSize: 13, fontWeight: '700' }}>Supplier</Text>
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 32 }}>
          {suppliers.length === 0 ? (
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
            suppliers.map((supplier) => {
              const expanded = expandedIds.has(supplier.id);
              const supplierItems = catalogItems.filter((i) => i.supplierId === supplier.id);
              return (
                <Animated.View key={supplier.id} entering={FadeIn.duration(200)} style={{ marginBottom: 10 }}>
                  <TouchableOpacity
                    onPress={() => toggleExpand(supplier.id)}
                    style={{ backgroundColor: colors.card, borderRadius: 14, borderBottomLeftRadius: expanded ? 0 : 14, borderBottomRightRadius: expanded ? 0 : 14, padding: 14, borderWidth: 1, borderColor: colors.cardBorder, borderLeftWidth: 4, borderLeftColor: supplier.color, flexDirection: 'row', alignItems: 'center' }}>
                    <View style={{ flex: 1 }}>
                      <Text style={{ color: colors.text, fontSize: 16, fontWeight: '700' }}>{supplier.name}</Text>
                      <Text style={{ color: colors.textSecondary, fontSize: 12, marginTop: 2 }}>{supplierItems.length} item{supplierItems.length !== 1 ? 's' : ''}</Text>
                    </View>
                    <TouchableOpacity onPress={() => setSupplierModal({ visible: true, existing: supplier })} style={{ paddingHorizontal: 8, paddingVertical: 4 }}>
                      <Text style={{ color: supplier.color, fontSize: 12, fontWeight: '600' }}>Edit</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => handleRemoveSupplier(supplier)} style={{ paddingHorizontal: 8, paddingVertical: 4 }}>
                      <Trash2 size={16} color={colors.danger} />
                    </TouchableOpacity>
                    <ChevronRight size={18} color={colors.textSecondary} style={{ transform: [{ rotate: expanded ? '90deg' : '0deg' }] }} />
                  </TouchableOpacity>

                  {expanded === true && (
                    <View style={{ backgroundColor: colors.card, borderWidth: 1, borderTopWidth: 0, borderColor: colors.cardBorder, borderBottomLeftRadius: 14, borderBottomRightRadius: 14, overflow: 'hidden' }}>
                      {supplierItems.map((item) => (
                        <View key={item.id} style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 11, borderTopWidth: 1, borderTopColor: colors.rowBorder }}>
                          <Tag size={13} color={supplier.color} style={{ marginRight: 10 }} />
                          <View style={{ flex: 1 }}>
                            <Text style={{ color: colors.text, fontSize: 14, fontWeight: '500' }}>{item.name}</Text>
                            <Text style={{ color: colors.textSecondary, fontSize: 11, marginTop: 1 }}>{item.unit} · {item.category}</Text>
                            {item.description != null && item.description.length > 0 && (
                              <Text style={{ color: colors.textSecondary, fontSize: 11, marginTop: 2, fontStyle: 'italic' }}>{item.description}</Text>
                            )}
                          </View>
                          <TouchableOpacity onPress={() => setItemModal({ visible: true, supplier, existingItem: item })} style={{ padding: 6 }}>
                            <Edit2 size={14} color={colors.textSecondary} />
                          </TouchableOpacity>
                          <TouchableOpacity onPress={() => handleRemoveItem(item)} style={{ padding: 6 }}>
                            <Trash2 size={15} color={colors.danger} />
                          </TouchableOpacity>
                        </View>
                      ))}
                      <TouchableOpacity
                        onPress={() => setItemModal({ visible: true, supplier, existingItem: null })}
                        style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 12, borderTopWidth: 1, borderTopColor: colors.rowBorder, gap: 8 }}>
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
        onSave={supplierModal.existing != null ? handleEditSupplier : handleAddSupplier}
      />
      <ItemModal
        visible={itemModal.visible}
        supplier={itemModal.supplier}
        existingItem={itemModal.existingItem}
        onClose={() => setItemModal({ visible: false, supplier: null, existingItem: null })}
        onSave={itemModal.existingItem != null ? handleEditItem : handleAddItem}
      />
    </View>
  );
}
