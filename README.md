# Purchasing System App

A simple but powerful purchasing system built with React Native (Expo) and a Hono backend.

## Features

### Orders Tab
- **Quick Insert Bar**: Type an item name and the supplier auto-fills from the built-in catalog
- Enter a quantity and tap + to instantly add items
- Each item shows its supplier (color-coded) and unit
- Increase/decrease quantities with +/- buttons
- Delete individual items or clear all at once
- If you add the same item again, quantities merge automatically

### By Supplier Tab
- All items automatically grouped under their supplier
- Each supplier section shows item count and total quantity
- Adjust quantities directly from the supplier view
- Clear an entire supplier's order with one tap

### Catalog
The app includes a pre-built catalog of 70+ items across 7 suppliers:
- **Fresh Farms** - Produce (tomatoes, lettuce, onions, etc.)
- **Prime Meats Co** - Meat (chicken, beef, pork, etc.)
- **Ocean Catch** - Seafood (salmon, shrimp, tuna, etc.)
- **Valley Dairy** - Dairy (milk, butter, cheese, eggs, etc.)
- **Metro Supply** - Dry goods (rice, pasta, flour, oil, etc.)
- **Drinks Direct** - Beverages (coffee, tea, juice, water, etc.)
- **CleanPro** - Cleaning supplies (soap, towels, sanitizer, etc.)

## Tech Stack
- **Frontend**: Expo SDK 53, React Native, NativeWind, Zustand (persisted), Reanimated
- **Backend**: Bun, Hono, TypeScript
- **Data**: Local persistence via AsyncStorage (no database needed)
