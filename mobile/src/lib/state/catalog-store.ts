import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";

export interface CatalogSupplier {
  id: string;
  name: string;
  color: string; // hex accent color
}

export interface CatalogItem {
  id: string;
  name: string;
  supplierId: string;
  supplierName: string;
  unit: string;
  category: string;
  description?: string;
}

// Preset palette for new suppliers
export const SUPPLIER_PALETTE = [
  "#2E7D32", "#AD1457", "#1565C0", "#E65100",
  "#6A1B9A", "#00838F", "#37474F", "#C62828",
  "#F57F17", "#1B5E20", "#880E4F", "#0D47A1",
];

interface CatalogStore {
  suppliers: CatalogSupplier[];
  items: CatalogItem[];

  addSupplier: (name: string, color: string) => CatalogSupplier;
  updateSupplier: (id: string, name: string, color: string) => void;
  removeSupplier: (id: string) => void;

  addItem: (supplierId: string, supplierName: string, name: string, unit: string, category: string, description?: string) => void;
  removeItem: (id: string) => void;
  updateItem: (id: string, name: string, unit: string, category: string, description?: string) => void;
}

function makeId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

// Built-in default suppliers & items (seeded on first load)
const DEFAULT_SUPPLIERS: CatalogSupplier[] = [
  { id: "fresh-farms", name: "Fresh Farms", color: "#2E7D32" },
  { id: "prime-meats", name: "Prime Meats Co", color: "#AD1457" },
  { id: "ocean-catch", name: "Ocean Catch", color: "#1565C0" },
  { id: "valley-dairy", name: "Valley Dairy", color: "#E65100" },
  { id: "metro-supply", name: "Metro Supply", color: "#6A1B9A" },
  { id: "drinks-direct", name: "Drinks Direct", color: "#00838F" },
  { id: "cleanpro", name: "CleanPro", color: "#37474F" },
];

const DEFAULT_ITEMS: CatalogItem[] = [
  // Fresh Farms
  { id: "i-tomatoes", name: "Tomatoes", supplierId: "fresh-farms", supplierName: "Fresh Farms", unit: "kg", category: "Produce" },
  { id: "i-lettuce", name: "Lettuce", supplierId: "fresh-farms", supplierName: "Fresh Farms", unit: "heads", category: "Produce" },
  { id: "i-onions", name: "Onions", supplierId: "fresh-farms", supplierName: "Fresh Farms", unit: "kg", category: "Produce" },
  { id: "i-potatoes", name: "Potatoes", supplierId: "fresh-farms", supplierName: "Fresh Farms", unit: "kg", category: "Produce" },
  { id: "i-carrots", name: "Carrots", supplierId: "fresh-farms", supplierName: "Fresh Farms", unit: "kg", category: "Produce" },
  { id: "i-peppers", name: "Peppers", supplierId: "fresh-farms", supplierName: "Fresh Farms", unit: "kg", category: "Produce" },
  { id: "i-cucumbers", name: "Cucumbers", supplierId: "fresh-farms", supplierName: "Fresh Farms", unit: "pcs", category: "Produce" },
  { id: "i-garlic", name: "Garlic", supplierId: "fresh-farms", supplierName: "Fresh Farms", unit: "kg", category: "Produce" },
  { id: "i-avocados", name: "Avocados", supplierId: "fresh-farms", supplierName: "Fresh Farms", unit: "pcs", category: "Produce" },
  { id: "i-lemons", name: "Lemons", supplierId: "fresh-farms", supplierName: "Fresh Farms", unit: "pcs", category: "Produce" },
  { id: "i-mushrooms", name: "Mushrooms", supplierId: "fresh-farms", supplierName: "Fresh Farms", unit: "kg", category: "Produce" },
  { id: "i-spinach", name: "Spinach", supplierId: "fresh-farms", supplierName: "Fresh Farms", unit: "kg", category: "Produce" },
  // Prime Meats
  { id: "i-chicken", name: "Chicken Breast", supplierId: "prime-meats", supplierName: "Prime Meats Co", unit: "kg", category: "Meat" },
  { id: "i-beef", name: "Ground Beef", supplierId: "prime-meats", supplierName: "Prime Meats Co", unit: "kg", category: "Meat" },
  { id: "i-pork", name: "Pork Chops", supplierId: "prime-meats", supplierName: "Prime Meats Co", unit: "kg", category: "Meat" },
  { id: "i-bacon", name: "Bacon", supplierId: "prime-meats", supplierName: "Prime Meats Co", unit: "kg", category: "Meat" },
  { id: "i-sausages", name: "Sausages", supplierId: "prime-meats", supplierName: "Prime Meats Co", unit: "kg", category: "Meat" },
  { id: "i-steak", name: "Steak", supplierId: "prime-meats", supplierName: "Prime Meats Co", unit: "kg", category: "Meat" },
  // Ocean Catch
  { id: "i-salmon", name: "Salmon", supplierId: "ocean-catch", supplierName: "Ocean Catch", unit: "kg", category: "Seafood" },
  { id: "i-shrimp", name: "Shrimp", supplierId: "ocean-catch", supplierName: "Ocean Catch", unit: "kg", category: "Seafood" },
  { id: "i-tuna", name: "Tuna", supplierId: "ocean-catch", supplierName: "Ocean Catch", unit: "kg", category: "Seafood" },
  { id: "i-cod", name: "Cod", supplierId: "ocean-catch", supplierName: "Ocean Catch", unit: "kg", category: "Seafood" },
  // Valley Dairy
  { id: "i-milk", name: "Milk", supplierId: "valley-dairy", supplierName: "Valley Dairy", unit: "liters", category: "Dairy" },
  { id: "i-butter", name: "Butter", supplierId: "valley-dairy", supplierName: "Valley Dairy", unit: "kg", category: "Dairy" },
  { id: "i-cheese", name: "Cheese", supplierId: "valley-dairy", supplierName: "Valley Dairy", unit: "kg", category: "Dairy" },
  { id: "i-eggs", name: "Eggs", supplierId: "valley-dairy", supplierName: "Valley Dairy", unit: "dozen", category: "Dairy" },
  { id: "i-cream", name: "Cream", supplierId: "valley-dairy", supplierName: "Valley Dairy", unit: "liters", category: "Dairy" },
  { id: "i-mozzarella", name: "Mozzarella", supplierId: "valley-dairy", supplierName: "Valley Dairy", unit: "kg", category: "Dairy" },
  // Metro Supply
  { id: "i-rice", name: "Rice", supplierId: "metro-supply", supplierName: "Metro Supply", unit: "kg", category: "Dry Goods" },
  { id: "i-pasta", name: "Pasta", supplierId: "metro-supply", supplierName: "Metro Supply", unit: "kg", category: "Dry Goods" },
  { id: "i-flour", name: "Flour", supplierId: "metro-supply", supplierName: "Metro Supply", unit: "kg", category: "Dry Goods" },
  { id: "i-sugar", name: "Sugar", supplierId: "metro-supply", supplierName: "Metro Supply", unit: "kg", category: "Dry Goods" },
  { id: "i-oliveoil", name: "Olive Oil", supplierId: "metro-supply", supplierName: "Metro Supply", unit: "liters", category: "Dry Goods" },
  { id: "i-tortillas", name: "Tortillas", supplierId: "metro-supply", supplierName: "Metro Supply", unit: "packs", category: "Dry Goods" },
  { id: "i-bread", name: "Bread", supplierId: "metro-supply", supplierName: "Metro Supply", unit: "loaves", category: "Dry Goods" },
  // Drinks Direct
  { id: "i-coffee", name: "Coffee", supplierId: "drinks-direct", supplierName: "Drinks Direct", unit: "kg", category: "Beverages" },
  { id: "i-tea", name: "Tea", supplierId: "drinks-direct", supplierName: "Drinks Direct", unit: "boxes", category: "Beverages" },
  { id: "i-oj", name: "Orange Juice", supplierId: "drinks-direct", supplierName: "Drinks Direct", unit: "liters", category: "Beverages" },
  { id: "i-water", name: "Water", supplierId: "drinks-direct", supplierName: "Drinks Direct", unit: "cases", category: "Beverages" },
  { id: "i-wine", name: "Wine", supplierId: "drinks-direct", supplierName: "Drinks Direct", unit: "bottles", category: "Beverages" },
  // CleanPro
  { id: "i-dishsoap", name: "Dish Soap", supplierId: "cleanpro", supplierName: "CleanPro", unit: "bottles", category: "Cleaning" },
  { id: "i-papertowels", name: "Paper Towels", supplierId: "cleanpro", supplierName: "CleanPro", unit: "rolls", category: "Cleaning" },
  { id: "i-trashbags", name: "Trash Bags", supplierId: "cleanpro", supplierName: "CleanPro", unit: "boxes", category: "Cleaning" },
  { id: "i-sanitizer", name: "Sanitizer", supplierId: "cleanpro", supplierName: "CleanPro", unit: "bottles", category: "Cleaning" },
  { id: "i-gloves", name: "Gloves", supplierId: "cleanpro", supplierName: "CleanPro", unit: "boxes", category: "Cleaning" },
];

const useCatalogStore = create<CatalogStore>()(
  persist(
    (set, get) => ({
      suppliers: DEFAULT_SUPPLIERS,
      items: DEFAULT_ITEMS,

      addSupplier: (name, color) => {
        const supplier: CatalogSupplier = { id: makeId(), name, color };
        set({ suppliers: [...get().suppliers, supplier] });
        return supplier;
      },

      updateSupplier: (id, name, color) => {
        set({
          suppliers: get().suppliers.map((s) => (s.id === id ? { ...s, name, color } : s)),
          // Also update cached supplierName on items
          items: get().items.map((i) => (i.supplierId === id ? { ...i, supplierName: name } : i)),
        });
      },

      removeSupplier: (id) => {
        set({
          suppliers: get().suppliers.filter((s) => s.id !== id),
          items: get().items.filter((i) => i.supplierId !== id),
        });
      },

      addItem: (supplierId, supplierName, name, unit, category, description) => {
        const item: CatalogItem = { id: makeId(), name, supplierId, supplierName, unit, category, description };
        set({ items: [...get().items, item] });
      },

      removeItem: (id) => {
        set({ items: get().items.filter((i) => i.id !== id) });
      },

      updateItem: (id, name, unit, category, description) => {
        set({
          items: get().items.map((i) => (i.id === id ? { ...i, name, unit, category, description } : i)),
        });
      },
    }),
    {
      name: "catalog-storage",
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);

export default useCatalogStore;
