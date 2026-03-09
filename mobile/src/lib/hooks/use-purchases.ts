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

export const purchasesKey = (orderId: string | null) =>
  ["purchases", orderId] as const;

export function usePurchases(orderId: string | null) {
  return useQuery({
    queryKey: purchasesKey(orderId),
    queryFn: () => api.get<PurchaseItem[]>(`/api/purchases?orderId=${orderId}`),
    enabled: !!orderId,
  });
}

export function useAddPurchaseItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: {
      name: string;
      supplier: string;
      quantity: number;
      unit: string;
      orderId: string;
    }) => api.post<PurchaseItem>("/api/purchases", body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["purchases"] }),
  });
}

export function useUpdatePurchaseQty() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, quantity }: { id: string; quantity: number }) =>
      api.patch<void>(`/api/purchases/${id}`, { quantity }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["purchases"] }),
  });
}

export function useRemovePurchaseItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete<void>(`/api/purchases/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["purchases"] }),
  });
}

export function useClearAllPurchases() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (orderId: string) =>
      api.delete<void>(`/api/purchases?orderId=${orderId}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["purchases"] }),
  });
}

export function useClearSupplierPurchases() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ orderId, supplier }: { orderId: string; supplier: string }) =>
      api.delete<void>(
        `/api/purchases/supplier/${encodeURIComponent(supplier)}?orderId=${orderId}`
      ),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["purchases"] }),
  });
}
