import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { STOCK_ITEMS } from '../data/stockItems';
import type { StockItem, ChangeLogEntry } from '../types';

interface StockStore {
  items: StockItem[];
  changelog: ChangeLogEntry[];
  initialized: boolean;
  ensureInit: () => void;
  addItem: (item: StockItem, userId: string, userName: string) => void;
  updateItem: (code: string, changes: Omit<Partial<StockItem>, 'code'>, userId: string, userName: string) => void;
  deleteItem: (code: string, userId: string, userName: string) => void;
}

export const useStockStore = create<StockStore>()(
  persist(
    (set, get) => ({
      items: [],
      changelog: [],
      initialized: false,

      ensureInit: () => {
        if (get().initialized) return;
        set({ items: [...STOCK_ITEMS], initialized: true });
      },

      addItem: (item, userId, userName) => {
        const entry: ChangeLogEntry = {
          id: crypto.randomUUID(),
          timestamp: new Date().toISOString(),
          userId,
          userName,
          action: 'create',
          itemCode: item.code,
          itemName: item.name,
          after: { ...item },
        };
        set(s => ({ items: [...s.items, item], changelog: [entry, ...s.changelog] }));
      },

      updateItem: (code, changes, userId, userName) => {
        const existing = get().items.find(i => i.code === code);
        if (!existing) return;
        const updated: StockItem = { ...existing, ...changes };
        const entry: ChangeLogEntry = {
          id: crypto.randomUUID(),
          timestamp: new Date().toISOString(),
          userId,
          userName,
          action: 'update',
          itemCode: code,
          itemName: updated.name,
          before: { ...existing },
          after: { ...updated },
        };
        set(s => ({
          items: s.items.map(i => i.code === code ? updated : i),
          changelog: [entry, ...s.changelog],
        }));
      },

      deleteItem: (code, userId, userName) => {
        const existing = get().items.find(i => i.code === code);
        if (!existing) return;
        const entry: ChangeLogEntry = {
          id: crypto.randomUUID(),
          timestamp: new Date().toISOString(),
          userId,
          userName,
          action: 'delete',
          itemCode: code,
          itemName: existing.name,
          before: { ...existing },
        };
        set(s => ({
          items: s.items.filter(i => i.code !== code),
          changelog: [entry, ...s.changelog],
        }));
      },
    }),
    { name: 'greenhouse-stock' }
  )
);
