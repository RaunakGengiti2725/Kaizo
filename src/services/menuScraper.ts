import { MenuItem, VeganRestaurant } from '@/services/googleMaps';

const READER = 'https://r.jina.ai/http://';

const CACHE_PREFIX = 'vegan_menu_cache:';

function normalize(url: string): string {
  try {
    const u = new URL(url);
    return u.toString();
  } catch {
    if (url.startsWith('http')) return url;
    return `https://${url}`;
  }
}

function readerUrl(target: string): string {
  const u = normalize(target).replace(/^https?:\/\//, '');
  return `${READER}${u}`;
}

function cacheKey(key: string): string {
  return `${CACHE_PREFIX}${key}`;
}

function getCached(key: string): MenuItem[] | null {
  try {
    const raw = localStorage.getItem(cacheKey(key));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { items: MenuItem[]; ts: number };
    return parsed.items || null;
  } catch {
    return null;
  }
}

function setCached(key: string, items: MenuItem[]): void {
  try {
    localStorage.setItem(cacheKey(key), JSON.stringify({ items, ts: Date.now() }));
  } catch {}
}

async function fetchText(url: string): Promise<string> {
  const res = await fetch(readerUrl(url));
  if (!res.ok) throw new Error('fetch_failed');
  return await res.text();
}

function extractMenuItems(text: string): MenuItem[] {
  const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
  const keywords = [
    'vegan','plant','tofu','tempeh','falafel','mushroom','lentil','bean','veg','bowl','salad','wrap','noodle','rice','curry','hummus','impossible','beyond'
  ];
  const items: MenuItem[] = [];
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const lc = line.toLowerCase();
    const hasKeyword = keywords.some(k => lc.includes(k));
    if (!hasKeyword) continue;
    const priceMatch = line.match(/\$\s?\d+(?:[\.,]\d{2})?/);
    const name = line.replace(/\s{2,}/g, ' ').trim();
    if (!name) continue;
    let desc = '';
    for (let j = 1; j <= 3 && i + j < lines.length; j++) {
      const next = lines[i + j];
      if (!next) break;
      const nlc = next.toLowerCase();
      const looksDesc = !/\$\s?\d+/.test(next) && next.length < 220 && !/^[A-Z\s]{2,}$/.test(next);
      if (looksDesc) {
        desc = `${desc ? desc + ' ' : ''}${next}`.trim();
      } else break;
    }
    const cat = lc.includes('salad') ? 'salad' : lc.includes('soup') ? 'soup' : lc.includes('bowl') ? 'main' : lc.includes('wrap') ? 'main' : lc.includes('burger') ? 'main' : 'main';
    items.push({
      name,
      description: desc,
      price: priceMatch ? priceMatch[0] : undefined,
      category: cat as MenuItem['category']
    });
  }
  const unique = new Map<string, MenuItem>();
  for (const it of items) {
    const key = `${it.name}|${it.price || ''}`.toLowerCase();
    if (!unique.has(key)) unique.set(key, it);
  }
  return Array.from(unique.values()).slice(0, 40);
}

function candidateUrls(base: string): string[] {
  const u = normalize(base);
  const url = new URL(u);
  const roots = [url.origin, u];
  const paths = ['menu','menus','our-menu','food','dining','eat','vegan','plant-based'];
  const out: string[] = [];
  roots.forEach(r => {
    out.push(r);
    paths.forEach(p => out.push(`${r.replace(/\/$/, '')}/${p}`));
  });
  return Array.from(new Set(out));
}

export async function scrapeVeganMenuForRestaurant(restaurant: VeganRestaurant): Promise<MenuItem[]> {
  const key = restaurant.website || restaurant.placeId || restaurant.id;
  if (!key) return [];
  const cached = getCached(key);
  if (cached && cached.length) return cached;
  const site = restaurant.website || '';
  if (!site) return [];
  const urls = candidateUrls(site);
  for (const u of urls) {
    try {
      const text = await fetchText(u);
      const items = extractMenuItems(text);
      if (items.length) {
        setCached(key, items);
        return items;
      }
    } catch {
      continue;
    }
  }
  return [];
}


