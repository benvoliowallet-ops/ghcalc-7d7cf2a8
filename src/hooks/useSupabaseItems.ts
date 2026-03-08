import { useState, useEffect } from 'react';
import type { StockItem } from '../types';
import { supabase } from '@/integrations/supabase/client';
import { STOCK_ITEMS } from '../data/stockItems';

export function useItemsByGroup(group: string): StockItem[] {
  const [items, setItems] = useState<StockItem[]>(() =>
    STOCK_ITEMS.filter(i => i.group === group)
  );

  useEffect(() => {
    supabase
      .from('stock_items')
      .select('*')
      .eq('group', group)
      .then(({ data, error }) => {
        if (error) {
          console.warn('[Stock] useItemsByGroup error:', error.message);
          return;
        }
        if (data && data.length > 0) {
          setItems(
            data.map((row) => ({
              code: row.code,
              name: row.name,
              additionalText: row.additional_text ?? '',
              price: Number(row.price ?? 0),
              group: row.group ?? group,
              supplier: row.supplier ?? undefined,
            }))
          );
        }
      });
  }, [group]);

  return items;
}

export function useNormistChecker() {
  const [normistCodes, setNormistCodes] = useState<Set<string>>(new Set());
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    supabase
      .from('stock_items')
      .select('code')
      .eq('supplier', 'NORMIST')
      .then(({ data, error }) => {
        if (error) {
          console.warn('[Stock] useNormistChecker error:', error.message);
          setLoaded(true);
          return;
        }
        if (data && data.length > 0) {
          setNormistCodes(new Set(data.map((r) => r.code as string)));
        } else {
          // DB empty or not seeded — fall back to static data
          const staticNormist = new Set(
            STOCK_ITEMS.filter(i => i.supplier === 'NORMIST').map(i => i.code)
          );
          setNormistCodes(staticNormist);
        }
        setLoaded(true);
      });
  }, []);

  const isNormist = (code: string): boolean => {
    // Always use loaded set (DB or static fallback) — never prefix-match alone
    if (loaded) {
      return normistCodes.has(code);
    }
    // Pre-load fallback: check static data first, then prefix heuristic
    const localItem = STOCK_ITEMS.find(i => i.code === code);
    if (localItem) return localItem.supplier === 'NORMIST';
    // Last resort prefix check (only covers items not in static list at all)
    return (
      code.startsWith('NOR ') ||
      code.startsWith('NORMIST ') ||
      code.startsWith('NMC') ||
      code.startsWith('NORMIST_PUMP') ||
      code.startsWith('NORMIST_UV') ||
      code.startsWith('NORMIST_30SS')
    );
  };

  return { isNormist, normistLoaded: loaded };
}
