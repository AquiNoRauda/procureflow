import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api/api";

export interface PurchaseItem {
  id: string;
  name: string;
  supplier: string;
  quantity: number;
  unit: string;
  createdAt: string;
  userId?: string;
}

export const PURCHASES_KEY = ["purchases"] as const;

export function usePurchases() {
  return useQuery({
    queryKey: PURCHASES_KEY,
    queryFn: () => api.get<PurchaseItem[]>("/api/purchases"),
  });
}

export function useAddPurchaseItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { name: string; supplier: string; quantity: number; unit: string }) =>
      api.post<PurchaseItem>("/api/purchases", body),
    onSuccess: () => qc.invalidateQueries({ queryKey: PURCHASES_KEY }),
  });
}

export function useUpdatePurchaseQty() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, quantity }: { id: string; quantity: number }) =>
      api.patch<void>(`/api/purchases/${id}`, { quantity }),
    onSuccess: () => qc.invalidateQueries({ queryKey: PURCHASES_KEY }),
  });
}

export function useRemovePurchaseItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete<void>(`/api/purchases/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: PURCHASES_KEY }),
  });
}

export function useClearAllPurchases() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => api.delete<void>("/api/purchases"),
    onSuccess: () => qc.invalidateQueries({ queryKey: PURCHASES_KEY }),
  });
}

export function useClearSupplierPurchases() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (supplier: string) =>
      api.delete<void>(`/api/purchases/supplier/${encodeURIComponent(supplier)}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: PURCHASES_KEY }),
  });
}
