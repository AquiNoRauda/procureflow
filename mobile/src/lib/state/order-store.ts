import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";

interface OrderStore {
  activeOrderId: string | null;
  setActiveOrderId: (id: string | null) => void;
}

export const useOrderStore = create<OrderStore>()(
  persist(
    (set) => ({
      activeOrderId: null,
      setActiveOrderId: (id) => set({ activeOrderId: id }),
    }),
    { name: "active-order", storage: createJSONStorage(() => AsyncStorage) }
  )
);
