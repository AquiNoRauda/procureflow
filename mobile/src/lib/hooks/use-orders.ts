import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api/api";
import type { PurchaseItem } from "@/lib/hooks/use-purchases";

export interface Order {
  id: string;
  name: string;
  status: "draft" | "completed";
  createdAt: string;
  completedAt: string | null;
  userId: string;
  _count: { items: number };
}

export const ORDERS_KEY = ["orders"] as const;

export function useOrders() {
  return useQuery({
    queryKey: ORDERS_KEY,
    queryFn: () => api.get<Order[]>("/api/orders"),
  });
}

export function useCreateOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { name: string }) => api.post<Order>("/api/orders", data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ORDERS_KEY }),
  });
}

export function useUpdateOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: { id: string; name?: string; status?: string }) =>
      api.patch<Order>(`/api/orders/${id}`, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ORDERS_KEY }),
  });
}

export function useDeleteOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/api/orders/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ORDERS_KEY }),
  });
}

export function useOrderItems(orderId: string | null) {
  return useQuery({
    queryKey: ["order-items", orderId],
    queryFn: () => api.get<PurchaseItem[]>(`/api/orders/${orderId}/items`),
    enabled: !!orderId,
  });
}
