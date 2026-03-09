import { CatalogItem } from "@/lib/state/catalog-store";

// Supplier color mapping for display in order/supplier screens.
export const SUPPLIER_COLORS: Record<string, { bg: string; text: string; accent: string }> = {
  "Fresh Farms":    { bg: "#E8F5E9", text: "#1B5E20", accent: "#4CAF50" },
  "Prime Meats Co": { bg: "#FCE4EC", text: "#880E4F", accent: "#E91E63" },
  "Ocean Catch":    { bg: "#E3F2FD", text: "#0D47A1", accent: "#2196F3" },
  "Valley Dairy":   { bg: "#FFF8E1", text: "#E65100", accent: "#FF9800" },
  "Metro Supply":   { bg: "#F3E5F5", text: "#4A148C", accent: "#9C27B0" },
  "Drinks Direct":  { bg: "#E0F7FA", text: "#006064", accent: "#00BCD4" },
  "CleanPro":       { bg: "#ECEFF1", text: "#263238", accent: "#607D8B" },
};

// Returns a color theme for a supplier. Custom suppliers fall back to a tint
// derived from their hex accent color.
export function getSupplierColor(
  supplierName: string,
  accentHex?: string
): { bg: string; text: string; accent: string } {
  // Check static map first (legacy fallback)
  if (SUPPLIER_COLORS[supplierName]) return SUPPLIER_COLORS[supplierName];

  // If a real color was provided from DB, use it
  if (accentHex) {
    return {
      bg: accentHex + '20',  // 12% opacity version of the color (hex alpha)
      text: accentHex,
      accent: accentHex,
    };
  }

  // Ultimate fallback
  return { bg: '#EFF6FF', text: '#2563EB', accent: '#2563EB' };
}

// Fuzzy search catalog items (pass store items directly).
export function searchCatalogItems(query: string, items: CatalogItem[]): CatalogItem[] {
  if (!query.trim()) return [];
  const q = query.toLowerCase();
  return items.filter((e) => e.name.toLowerCase().includes(q)).slice(0, 8);
}

// Exact name lookup (case-insensitive).
export function getCatalogItemByName(
  name: string,
  items: CatalogItem[]
): CatalogItem | undefined {
  return items.find((e) => e.name.toLowerCase() === name.toLowerCase());
}
