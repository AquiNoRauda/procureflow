import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api/api";

export interface CatalogSupplier {
  id: string;
  name: string;
  color: string;
  userId?: string;
}

export interface CatalogItem {
  id: string;
  name: string;
  supplierId: string;
  supplierName: string;
  unit: string;
  category: string;
  description?: string;
  userId: string;
}

export const CATALOG_KEY = ["catalog"] as const;

export function useCatalog() {
  return useQuery({
    queryKey: CATALOG_KEY,
    queryFn: async () => {
      const result = await api.get<{ suppliers: CatalogSupplier[]; items: CatalogItem[] }>("/api/catalog");
      return result ?? { suppliers: [], items: [] };
    },
  });
}

export function useAddSupplier() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { id: string; name: string; color: string }) =>
      api.post<CatalogSupplier>("/api/catalog/suppliers", body),
    onSuccess: () => qc.invalidateQueries({ queryKey: CATALOG_KEY }),
  });
}

export function useUpdateSupplier() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, name, color }: { id: string; name: string; color: string }) =>
      api.patch<CatalogSupplier>(`/api/catalog/suppliers/${id}`, { name, color }),
    onSuccess: () => qc.invalidateQueries({ queryKey: CATALOG_KEY }),
  });
}

export function useRemoveSupplier() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete<void>(`/api/catalog/suppliers/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: CATALOG_KEY }),
  });
}

export function useAddCatalogItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: {
      id: string;
      name: string;
      supplierId: string;
      supplierName: string;
      unit: string;
      category: string;
      description?: string;
    }) => api.post<CatalogItem>("/api/catalog/items", body),
    onSuccess: () => qc.invalidateQueries({ queryKey: CATALOG_KEY }),
  });
}

export function useUpdateCatalogItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, name, unit, category, description }: { id: string; name: string; unit: string; category: string; description?: string }) =>
      api.patch<CatalogItem>(`/api/catalog/items/${id}`, { name, unit, category, description }),
    onSuccess: () => qc.invalidateQueries({ queryKey: CATALOG_KEY }),
  });
}

export function useRemoveCatalogItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete<void>(`/api/catalog/items/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: CATALOG_KEY }),
  });
}
