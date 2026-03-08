import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuthStore } from '../store/authStore';
import type { StockItem, ChangeLogEntry } from '../types';
import { STOCK_ITEMS } from '../data/stockItems';

/**
 * Returns stock items from DB. Falls back to static data if DB is empty or
 * user is not authenticated.
 */
export function useStockItems() {
  const { currentUser } = useAuthStore();
  const [items, setItems] = useState<StockItem[]>(STOCK_ITEMS);
  const [loading, setLoading] = useState(false);

  const reload = useCallback(async () => {
    if (!currentUser) return;
    setLoading(true);

    const { data, error } = await supabase
      .from('stock_items')
      .select('code, name, additional_text, price, group, supplier')
      .order('group')
      .order('name');

    setLoading(false);

    if (error) {
      console.error('[Stock] Load error:', error.message);
      return;
    }

    if (data && data.length > 0) {
      setItems(
        data.map((row) => ({
          code: row.code,
          name: row.name,
          additionalText: row.additional_text,
          price: Number(row.price),
          group: row.group,
          supplier: row.supplier ?? undefined,
        }))
      );
    }
  }, [currentUser]);

  useEffect(() => {
    reload();
  }, [reload]);

  return { items, loading, reload };
}

/** Add item to DB + local state */
export function useStockMutations(reload: () => void) {
  const { currentUser } = useAuthStore();

  const addItem = useCallback(
    async (item: StockItem) => {
      if (!currentUser) return { ok: false, error: 'Nie ste prihlásený' };

      // Insert stock item
      const { error: itemErr } = await supabase.from('stock_items').insert({
        code: item.code,
        name: item.name,
        additional_text: item.additionalText,
        price: item.price,
        group: item.group,
        supplier: item.supplier ?? null,
        created_by: currentUser.id,
        updated_by: currentUser.id,
      });

      if (itemErr) return { ok: false, error: itemErr.message };

      // Log the change
      await supabase.from('change_log').insert({
        user_id: currentUser.id,
        user_name: currentUser.name,
        action: 'create',
        item_code: item.code,
        item_name: item.name,
        after_data: item as unknown as Record<string, unknown>,
      });

      reload();
      return { ok: true };
    },
    [currentUser, reload]
  );

  const updateItem = useCallback(
    async (code: string, changes: Omit<Partial<StockItem>, 'code'>, before: StockItem) => {
      if (!currentUser) return { ok: false, error: 'Nie ste prihlásený' };

      const { error: updErr } = await supabase
        .from('stock_items')
        .update({
          name: changes.name,
          additional_text: changes.additionalText,
          price: changes.price,
          group: changes.group,
          supplier: changes.supplier ?? null,
          updated_by: currentUser.id,
        })
        .eq('code', code);

      if (updErr) return { ok: false, error: updErr.message };

      const after = { ...before, ...changes };

      await supabase.from('change_log').insert({
        user_id: currentUser.id,
        user_name: currentUser.name,
        action: 'update',
        item_code: code,
        item_name: after.name ?? before.name,
        before_data: before as unknown as Record<string, unknown>,
        after_data: after as unknown as Record<string, unknown>,
      });

      reload();
      return { ok: true };
    },
    [currentUser, reload]
  );

  const deleteItem = useCallback(
    async (code: string, item: StockItem) => {
      if (!currentUser) return { ok: false, error: 'Nie ste prihlásený' };

      const { error: delErr } = await supabase
        .from('stock_items')
        .delete()
        .eq('code', code);

      if (delErr) return { ok: false, error: delErr.message };

      await supabase.from('change_log').insert({
        user_id: currentUser.id,
        user_name: currentUser.name,
        action: 'delete',
        item_code: code,
        item_name: item.name,
        before_data: item as unknown as Record<string, unknown>,
      });

      reload();
      return { ok: true };
    },
    [currentUser, reload]
  );

  return { addItem, updateItem, deleteItem };
}

/** Load change log from DB */
export function useChangeLog() {
  const { currentUser } = useAuthStore();
  const [changelog, setChangelog] = useState<ChangeLogEntry[]>([]);

  useEffect(() => {
    if (!currentUser) return;

    supabase
      .from('change_log')
      .select('*')
      .order('timestamp', { ascending: false })
      .limit(500)
      .then(({ data, error }) => {
        if (error) {
          console.error('[ChangeLog] Load error:', error.message);
          return;
        }
        if (!data) return;

        setChangelog(
          data.map((row) => ({
            id: row.id,
            timestamp: row.timestamp,
            userId: row.user_id ?? '',
            userName: row.user_name,
            action: row.action as 'create' | 'update' | 'delete',
            itemCode: row.item_code,
            itemName: row.item_name,
            before: row.before_data as Partial<StockItem> | undefined,
            after: row.after_data as Partial<StockItem> | undefined,
          }))
        );
      });
  }, [currentUser]);

  return changelog;
}
