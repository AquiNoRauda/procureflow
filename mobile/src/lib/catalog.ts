// Item-to-Supplier catalog
// Maps item names to their default supplier and unit
// This auto-fills the supplier when you type an item name

export interface CatalogEntry {
  item: string;
  supplier: string;
  unit: string;
  category: string;
}

export const CATALOG: CatalogEntry[] = [
  // Produce - Fresh Farms
  { item: "Tomatoes", supplier: "Fresh Farms", unit: "kg", category: "Produce" },
  { item: "Lettuce", supplier: "Fresh Farms", unit: "heads", category: "Produce" },
  { item: "Onions", supplier: "Fresh Farms", unit: "kg", category: "Produce" },
  { item: "Potatoes", supplier: "Fresh Farms", unit: "kg", category: "Produce" },
  { item: "Carrots", supplier: "Fresh Farms", unit: "kg", category: "Produce" },
  { item: "Peppers", supplier: "Fresh Farms", unit: "kg", category: "Produce" },
  { item: "Cucumbers", supplier: "Fresh Farms", unit: "pcs", category: "Produce" },
  { item: "Garlic", supplier: "Fresh Farms", unit: "kg", category: "Produce" },
  { item: "Avocados", supplier: "Fresh Farms", unit: "pcs", category: "Produce" },
  { item: "Lemons", supplier: "Fresh Farms", unit: "pcs", category: "Produce" },
  { item: "Limes", supplier: "Fresh Farms", unit: "pcs", category: "Produce" },
  { item: "Mushrooms", supplier: "Fresh Farms", unit: "kg", category: "Produce" },
  { item: "Spinach", supplier: "Fresh Farms", unit: "kg", category: "Produce" },
  { item: "Broccoli", supplier: "Fresh Farms", unit: "kg", category: "Produce" },
  { item: "Celery", supplier: "Fresh Farms", unit: "bunches", category: "Produce" },

  // Meats - Prime Meats Co
  { item: "Chicken Breast", supplier: "Prime Meats Co", unit: "kg", category: "Meat" },
  { item: "Ground Beef", supplier: "Prime Meats Co", unit: "kg", category: "Meat" },
  { item: "Pork Chops", supplier: "Prime Meats Co", unit: "kg", category: "Meat" },
  { item: "Bacon", supplier: "Prime Meats Co", unit: "kg", category: "Meat" },
  { item: "Sausages", supplier: "Prime Meats Co", unit: "kg", category: "Meat" },
  { item: "Lamb Chops", supplier: "Prime Meats Co", unit: "kg", category: "Meat" },
  { item: "Turkey", supplier: "Prime Meats Co", unit: "kg", category: "Meat" },
  { item: "Steak", supplier: "Prime Meats Co", unit: "kg", category: "Meat" },
  { item: "Ribs", supplier: "Prime Meats Co", unit: "kg", category: "Meat" },

  // Seafood - Ocean Catch
  { item: "Salmon", supplier: "Ocean Catch", unit: "kg", category: "Seafood" },
  { item: "Shrimp", supplier: "Ocean Catch", unit: "kg", category: "Seafood" },
  { item: "Tuna", supplier: "Ocean Catch", unit: "kg", category: "Seafood" },
  { item: "Cod", supplier: "Ocean Catch", unit: "kg", category: "Seafood" },
  { item: "Lobster", supplier: "Ocean Catch", unit: "pcs", category: "Seafood" },
  { item: "Crab", supplier: "Ocean Catch", unit: "kg", category: "Seafood" },
  { item: "Scallops", supplier: "Ocean Catch", unit: "kg", category: "Seafood" },

  // Dairy - Valley Dairy
  { item: "Milk", supplier: "Valley Dairy", unit: "liters", category: "Dairy" },
  { item: "Butter", supplier: "Valley Dairy", unit: "kg", category: "Dairy" },
  { item: "Cheese", supplier: "Valley Dairy", unit: "kg", category: "Dairy" },
  { item: "Cream", supplier: "Valley Dairy", unit: "liters", category: "Dairy" },
  { item: "Yogurt", supplier: "Valley Dairy", unit: "pcs", category: "Dairy" },
  { item: "Eggs", supplier: "Valley Dairy", unit: "dozen", category: "Dairy" },
  { item: "Sour Cream", supplier: "Valley Dairy", unit: "pcs", category: "Dairy" },
  { item: "Mozzarella", supplier: "Valley Dairy", unit: "kg", category: "Dairy" },
  { item: "Parmesan", supplier: "Valley Dairy", unit: "kg", category: "Dairy" },

  // Dry Goods - Metro Supply
  { item: "Rice", supplier: "Metro Supply", unit: "kg", category: "Dry Goods" },
  { item: "Pasta", supplier: "Metro Supply", unit: "kg", category: "Dry Goods" },
  { item: "Flour", supplier: "Metro Supply", unit: "kg", category: "Dry Goods" },
  { item: "Sugar", supplier: "Metro Supply", unit: "kg", category: "Dry Goods" },
  { item: "Salt", supplier: "Metro Supply", unit: "kg", category: "Dry Goods" },
  { item: "Olive Oil", supplier: "Metro Supply", unit: "liters", category: "Dry Goods" },
  { item: "Vegetable Oil", supplier: "Metro Supply", unit: "liters", category: "Dry Goods" },
  { item: "Vinegar", supplier: "Metro Supply", unit: "liters", category: "Dry Goods" },
  { item: "Soy Sauce", supplier: "Metro Supply", unit: "bottles", category: "Dry Goods" },
  { item: "Canned Tomatoes", supplier: "Metro Supply", unit: "cans", category: "Dry Goods" },
  { item: "Beans", supplier: "Metro Supply", unit: "kg", category: "Dry Goods" },
  { item: "Lentils", supplier: "Metro Supply", unit: "kg", category: "Dry Goods" },
  { item: "Bread", supplier: "Metro Supply", unit: "loaves", category: "Dry Goods" },
  { item: "Tortillas", supplier: "Metro Supply", unit: "packs", category: "Dry Goods" },

  // Beverages - Drinks Direct
  { item: "Coffee", supplier: "Drinks Direct", unit: "kg", category: "Beverages" },
  { item: "Tea", supplier: "Drinks Direct", unit: "boxes", category: "Beverages" },
  { item: "Orange Juice", supplier: "Drinks Direct", unit: "liters", category: "Beverages" },
  { item: "Water", supplier: "Drinks Direct", unit: "cases", category: "Beverages" },
  { item: "Soda", supplier: "Drinks Direct", unit: "cases", category: "Beverages" },
  { item: "Beer", supplier: "Drinks Direct", unit: "cases", category: "Beverages" },
  { item: "Wine", supplier: "Drinks Direct", unit: "bottles", category: "Beverages" },

  // Cleaning - CleanPro
  { item: "Dish Soap", supplier: "CleanPro", unit: "bottles", category: "Cleaning" },
  { item: "Paper Towels", supplier: "CleanPro", unit: "rolls", category: "Cleaning" },
  { item: "Trash Bags", supplier: "CleanPro", unit: "boxes", category: "Cleaning" },
  { item: "Sanitizer", supplier: "CleanPro", unit: "bottles", category: "Cleaning" },
  { item: "Bleach", supplier: "CleanPro", unit: "bottles", category: "Cleaning" },
  { item: "Gloves", supplier: "CleanPro", unit: "boxes", category: "Cleaning" },
  { item: "Sponges", supplier: "CleanPro", unit: "packs", category: "Cleaning" },
];

// Get unique supplier names
export const SUPPLIERS = [...new Set(CATALOG.map((e) => e.supplier))];

// Get unique categories
export const CATEGORIES = [...new Set(CATALOG.map((e) => e.category))];

// Supplier color mapping for visual distinction
export const SUPPLIER_COLORS: Record<string, { bg: string; text: string; accent: string }> = {
  "Fresh Farms": { bg: "#E8F5E9", text: "#1B5E20", accent: "#4CAF50" },
  "Prime Meats Co": { bg: "#FCE4EC", text: "#880E4F", accent: "#E91E63" },
  "Ocean Catch": { bg: "#E3F2FD", text: "#0D47A1", accent: "#2196F3" },
  "Valley Dairy": { bg: "#FFF8E1", text: "#E65100", accent: "#FF9800" },
  "Metro Supply": { bg: "#F3E5F5", text: "#4A148C", accent: "#9C27B0" },
  "Drinks Direct": { bg: "#E0F7FA", text: "#006064", accent: "#00BCD4" },
  "CleanPro": { bg: "#ECEFF1", text: "#263238", accent: "#607D8B" },
};

// Search catalog by item name (fuzzy match)
export function searchCatalog(query: string): CatalogEntry[] {
  if (!query.trim()) return [];
  const q = query.toLowerCase();
  return CATALOG.filter((e) => e.item.toLowerCase().includes(q)).slice(0, 8);
}

// Get catalog entry by exact item name (case insensitive)
export function getCatalogEntry(itemName: string): CatalogEntry | undefined {
  return CATALOG.find((e) => e.item.toLowerCase() === itemName.toLowerCase());
}
