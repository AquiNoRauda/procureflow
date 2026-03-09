import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";

export interface PurchaseItem {
  id: string;
  name: string;
  supplier: string;
  quantity: number;
  unit: string;
  createdAt: number;
}

interface PurchasingStore {
  items: PurchaseItem[];
  addItem: (name: string, supplier: string, quantity: number, unit: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  removeItem: (id: string) => void;
  clearAll: () => void;
  clearSupplier: (supplier: string) => void;
}

const usePurchasingStore = create<PurchasingStore>()(
  persist(
    (set, get) => ({
      items: [],

      addItem: (name, supplier, quantity, unit) => {
        const existing = get().items.find(
          (i) => i.name.toLowerCase() === name.toLowerCase() && i.supplier === supplier
        );
        if (existing) {
          // If item already exists for this supplier, increase quantity
          set({
            items: get().items.map((i) =>
              i.id === existing.id ? { ...i, quantity: i.quantity + quantity } : i
            ),
          });
        } else {
          const newItem: PurchaseItem = {
            id: Date.now().toString() + Math.random().toString(36).slice(2, 7),
            name,
            supplier,
            quantity,
            unit,
            createdAt: Date.now(),
          };
          set({ items: [...get().items, newItem] });
        }
      },

      updateQuantity: (id, quantity) => {
        if (quantity <= 0) {
          set({ items: get().items.filter((i) => i.id !== id) });
        } else {
          set({
            items: get().items.map((i) => (i.id === id ? { ...i, quantity } : i)),
          });
        }
      },

      removeItem: (id) => {
        set({ items: get().items.filter((i) => i.id !== id) });
      },

      clearAll: () => {
        set({ items: [] });
      },

      clearSupplier: (supplier) => {
        set({ items: get().items.filter((i) => i.supplier !== supplier) });
      },
    }),
    {
      name: "purchasing-storage",
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);

export default usePurchasingStore;
