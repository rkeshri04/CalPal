// Central AI helper for CalPal
// - Wraps Cloudflare Workers AI HTTP calls
// - Provides high-level functions used by screens (e.g. "text -> food entry")
// - Knows about restaurant menus so prompts stay consistent as new restaurants are added.

import mcdonaldsMenu from '@/assets/restaurants/mcdonalds.json';
import chickfilaMenu from '@/assets/restaurants/chickfila.json';

export type AiFoodEntry = {
  name: string;
  barcode?: string;
  image?: string;
  cost?: number;
  weight?: number;
  calories?: number;
  fat?: number;
  carbs?: number;
  protein?: number;
};

export type RestaurantId = 'mcdonalds' | 'chickfila' | string;

// Map of restaurant id -> menu JSON. When you add a new restaurant file,
// 1) create the JSON in assets/restaurants
// 2) import it above
// 3) register it in this map with a stable id
export const RESTAURANT_MENUS: Record<RestaurantId, any[]> = {
  mcdonalds: mcdonaldsMenu as any[],
  chickfila: chickfilaMenu as any[],
};

// Helper to get menu JSON for a restaurant. Falls back to [] if missing.
export function getRestaurantMenu(restaurantId?: RestaurantId | null): any[] {
  if (!restaurantId) return [];
  const menu = RESTAURANT_MENUS[restaurantId];
  if (!Array.isArray(menu)) return [];
  return menu;
}

// --- Cloudflare Worker endpoint ---

// One place to configure the Worker URL so all screens use the same endpoint.
// Update this if you change your Worker route.
const CALPAL_WORKER_URL = 'https://calpalai.rishabh-1keshri.workers.dev/food-from-text';

// Simple numeric parser that tolerates strings like "780 kcal" or "45 g".
function parseNumber(value: any): number | undefined {
  if (value == null) return undefined;
  if (typeof value === 'number') return value;
  if (typeof value !== 'string') return undefined;
  const m = value.match(/-?\d+(\.\d+)?/);
  return m ? Number(m[0]) : undefined;
}

function clamp(value: number | undefined, min: number, max: number): number | undefined {
  if (value == null || Number.isNaN(value)) return undefined;
  return Math.min(max, Math.max(min, value));
}

function normaliseFoodResult(raw: any): AiFoodEntry {
  if (!raw || typeof raw !== 'object') raw = {};

  const calories = clamp(parseNumber(raw.calories), 0, 3000);
  const weight = clamp(parseNumber(raw.weight), 0, 1500);
  const fat = clamp(parseNumber(raw.fat), 0, 200);
  const carbs = clamp(parseNumber(raw.carbs), 0, 400);
  const protein = clamp(parseNumber(raw.protein), 0, 200);
  const cost = clamp(parseNumber(raw.cost), 0, 80);

  return {
    name: raw.name || 'Unknown Food',
    barcode: raw.barcode || '',
    image: raw.image || '',
    cost: cost ?? 0,
    weight: weight ?? 0,
    calories: calories ?? 0,
    fat: fat ?? 0,
    carbs: carbs ?? 0,
    protein: protein ?? 0,
  };
}

// High-level API: turn free-text description into a structured food entry.
// Optionally pass restaurantId so the Worker can use the right menu context.
export async function getFoodEntryFromText(
  description: string,
  opts?: { restaurantId?: RestaurantId | null }
): Promise<AiFoodEntry> {
  if (!description.trim()) {
    throw new Error('Description is empty');
  }

  const payload: any = {
    description,
  };

  if (opts?.restaurantId) {
    payload.restaurantId = opts.restaurantId;
    payload.menu = getRestaurantMenu(opts.restaurantId);
  }

  const response = await fetch(CALPAL_WORKER_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(`AI service failed with status ${response.status}`);
  }

  const data = await response.json();
  return normaliseFoodResult(data);
}
