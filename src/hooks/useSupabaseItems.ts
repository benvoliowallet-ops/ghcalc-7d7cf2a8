import { useState, useEffect } from 'react';
import type { StockItem } from '../types';
import { supabase } from '@/integrations/supabase/client';
import { STOCK_ITEMS } from '../data/stockItems';

export function useItemsByGroup(group: string): StockItem[] {
  const [items, setItems] = useState<StockItem[]>([]);

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
              nameSk: row.name,
              nameEn: row.additional_text ?? '',
              unit: 'pcs',
              unitSk: 'ks',
              price: row.price != null ? Number(row.price) : null,
              warehouse: (row.supplier === 'NORMIST' ? 'NORMIST' : 'ATTI') as 'ATTI' | 'NORMIST',
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
            STOCK_ITEMS.filter(i => i.warehouse === 'NORMIST').map(i => i.code)
          );
          setNormistCodes(staticNormist);
        }
        setLoaded(true);
      });
  }, []);

  const isNormist = (code: string): boolean => {
    if (loaded) {
      return normistCodes.has(code);
    }
    // Pre-load fallback: check static data first
    const localItem = STOCK_ITEMS.find(i => i.code === code);
    if (localItem) return localItem.warehouse === 'NORMIST';
    // Last resort prefix check
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
