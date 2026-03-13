import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuthStore } from '../store/authStore';
import type { StockItem, ChangeLogEntry } from '../types';
import { STOCK_ITEMS } from '../data/stockItems';

/**
 * Returns stock items from DB. Falls back to static data if DB is empty or
 * user is not authenticated. On first load, if DB is empty, seeds with static data.
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
      .select('code, name, name_en, additional_text, price, group, supplier, bom_condition, bom_qty_logic')
      .order('name');

    setLoading(false);

    if (error) {
      console.error('[Stock] Load error:', error.message);
      return;
    }

    // Always sync: upsert any static items missing from DB (admin only)
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', currentUser.id)
      .single();

    if (profile?.role === 'admin') {
      const dbCodes = new Set((data ?? []).map((r) => r.code));
      const missing = STOCK_ITEMS.filter((item) => !dbCodes.has(item.code));
      if (missing.length > 0) {
        console.log('[Stock] Syncing', missing.length, 'missing items to DB...');
        const batchSize = 20;
        for (let i = 0; i < missing.length; i += batchSize) {
          const batch = missing.slice(i, i + batchSize).map((item) => ({
            code: item.code,
            name: item.nameSk,
            additional_text: item.nameEn,
            price: item.price ?? 0,
            group: item.warehouse,
            supplier: item.warehouse,
            created_by: currentUser.id,
            updated_by: currentUser.id,
          }));
          await supabase.from('stock_items').upsert(batch);
        }
        console.log('[Stock] Sync complete');
        // Reload after sync
        const { data: fresh } = await supabase
          .from('stock_items')
          .select('code, name, name_en, additional_text, price, group, supplier, bom_condition, bom_qty_logic')
          .order('name');
        if (fresh && fresh.length > 0) {
          setItems(
            fresh.map((row) => ({
              code: row.code,
              nameSk: row.name,
              nameEn: row.name_en ?? row.additional_text ?? '',
              unit: 'pcs',
              unitSk: 'ks',
              price: row.price != null ? Number(row.price) : null,
              warehouse: (row.supplier === 'NORMIST' ? 'NORMIST' : 'ATTI') as 'ATTI' | 'NORMIST',
              bomCondition: row.bom_condition ?? '',
              bomQtyLogic: row.bom_qty_logic ?? '',
            }))
          );
        }
        return;
      }
    }

    if (data && data.length > 0) {
      setItems(
        data.map((row) => ({
          code: row.code,
          nameSk: row.name,
          nameEn: row.name_en ?? row.additional_text ?? '',
          unit: 'pcs',
          unitSk: 'ks',
          price: row.price != null ? Number(row.price) : null,
          warehouse: (row.supplier === 'NORMIST' ? 'NORMIST' : 'ATTI') as 'ATTI' | 'NORMIST',
          bomCondition: row.bom_condition ?? '',
          bomQtyLogic: row.bom_qty_logic ?? '',
        }))
      );
    } else {
      setItems(STOCK_ITEMS);
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

      const { error: itemErr } = await supabase.from('stock_items').insert({
        code: item.code,
        name: item.nameSk,
        additional_text: item.nameEn,
        price: item.price ?? 0,
        group: item.warehouse,
        supplier: item.warehouse,
        created_by: currentUser.id,
        updated_by: currentUser.id,
      });

      if (itemErr) return { ok: false, error: itemErr.message };

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase as any).from('change_log').insert({
        user_id: currentUser.id,
        user_name: currentUser.name,
        action: 'create',
        item_code: item.code,
        item_name: item.nameSk,
        after_data: item,
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
          name: changes.nameSk,
          additional_text: changes.nameEn,
          price: changes.price ?? 0,
          group: changes.warehouse,
          supplier: changes.warehouse,
          updated_by: currentUser.id,
        })
        .eq('code', code);

      if (updErr) return { ok: false, error: updErr.message };

      const after = { ...before, ...changes };

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase as any).from('change_log').insert({
        user_id: currentUser.id,
        user_name: currentUser.name,
        action: 'update',
        item_code: code,
        item_name: after.nameSk ?? before.nameSk,
        before_data: before,
        after_data: after,
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

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase as any).from('change_log').insert({
        user_id: currentUser.id,
        user_name: currentUser.name,
        action: 'delete',
        item_code: code,
        item_name: item.nameSk,
        before_data: item,
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
