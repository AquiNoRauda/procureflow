// Shared request/response types for the backend API

export type UpdateCatalogItem = {
  name: string;
  unit: string;
  category: string;
  description?: string;
};
