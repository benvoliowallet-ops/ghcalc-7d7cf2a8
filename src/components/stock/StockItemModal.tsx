import { useState } from 'react';
import { useStockStore } from '../../store/stockStore';
import { useAuthStore } from '../../store/authStore';
import type { StockItem } from '../../types';

interface Props {
  mode: 'add' | 'edit';
  item?: StockItem;
  groups: string[];
  onClose: () => void;
}

export function StockItemModal({ mode, item, groups, onClose }: Props) {
  const { items, addItem, updateItem } = useStockStore();
  const { currentUser } = useAuthStore();

  const [code, setCode] = useState(item?.code ?? '');
  const [name, setName] = useState(item?.name ?? '');
  const [additionalText, setAdditionalText] = useState(item?.additionalText ?? '');
  const [price, setPrice] = useState(item?.price?.toString() ?? '');
  const [group, setGroup] = useState(item?.group ?? '');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;

    const trimmedCode = code.trim();
    const priceNum = parseFloat(price);

    if (!trimmedCode) return setError('Kód je povinný');
    if (isNaN(priceNum) || priceNum < 0) return setError('Zadajte platnú cenu (≥ 0)');
    if (!name.trim()) return setError('Názov je povinný');
    if (!group.trim()) return setError('Skupina je povinná');

    if (mode === 'add') {
      if (items.some((i) => i.code === trimmedCode)) {
        return setError('Položka s týmto kódom už existuje');
      }
      addItem(
        {
          code: trimmedCode,
          name: name.trim(),
          additionalText: additionalText.trim(),
          price: priceNum,
          group: group.trim(),
        },
        currentUser.id,
        currentUser.name
      );
    } else {
      updateItem(
        item!.code,
        {
          name: name.trim(),
          additionalText: additionalText.trim(),
          price: priceNum,
          group: group.trim(),
        },
        currentUser.id,
        currentUser.name
      );
    }

    onClose();
  };

  return (
    <div
      className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg border border-gray-100">

        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-base font-bold text-gray-800">
            {mode === 'add' ? '＋ Pridať položku' : '✏️ Upraviť položku'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl leading-none w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100"
          >
            ×
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">

          <div className="grid grid-cols-2 gap-4">
            {/* Code */}
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">
                Kód *
              </label>
              <input
                value={code}
                onChange={(e) => setCode(e.target.value)}
                disabled={mode === 'edit'}
                required
                placeholder="NOR 0311018"
                className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-green-500 disabled:bg-gray-50 disabled:text-gray-400"
              />
              {mode === 'edit' && (
                <p className="text-xs text-gray-400 mt-1">Kód sa nedá zmeniť</p>
              )}
            </div>

            {/* Group */}
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">
                Skupina *
              </label>
              <input
                list="modal-groups-list"
                value={group}
                onChange={(e) => setGroup(e.target.value)}
                required
                placeholder="napr. Trysky"
                className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
              />
              <datalist id="modal-groups-list">
                {groups.map((g) => (
                  <option key={g} value={g} />
                ))}
              </datalist>
            </div>
          </div>

          {/* Name */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Názov *</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              placeholder="Rura D10x1.5-3000 AK"
              className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>

          {/* Additional text */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">
              Doplnkový text
            </label>
            <input
              value={additionalText}
              onChange={(e) => setAdditionalText(e.target.value)}
              placeholder="Voliteľný popis alebo part number"
              className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>

          {/* Price */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Cena (€) *</label>
            <input
              type="number"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              required
              step="0.001"
              min="0"
              placeholder="0.000"
              className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>

          {/* Error */}
          {error && (
            <div className="px-3 py-2 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700">
              ⚠️ {error}
            </div>
          )}

          {/* Buttons */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-lg border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 transition-colors"
            >
              Zrušiť
            </button>
            <button
              type="submit"
              className="flex-1 py-2.5 rounded-lg bg-green-600 hover:bg-green-700 text-white text-sm font-semibold transition-colors"
            >
              {mode === 'add' ? 'Pridať položku' : 'Uložiť zmeny'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
