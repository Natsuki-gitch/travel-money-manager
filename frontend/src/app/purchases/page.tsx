"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { CURRENCIES } from "@/lib/currencies";
import { CARD_OPTIONS, getCardFeeRate } from "@/lib/cardFees";
import { fetchJpyRates } from "@/lib/exchangeRates";
import {
  createPurchase,
  deletePurchase,
  fetchPurchases,
  getToken,
  logout,
  updatePurchaseItemName,
} from "@/lib/api";
import { Purchase } from "@/types/purchase";

const numberFormat = new Intl.NumberFormat("ja-JP");

type FormState = {
  itemName: string;
  currency: string;
  foreignAmount: string;
  exchangeRate: string;
  cardName: string;
  purchaseDate: string;
};

const initialForm: FormState = {
  itemName: "",
  currency: CURRENCIES[0],
  foreignAmount: "",
  exchangeRate: "",
  cardName: CARD_OPTIONS[0].name,
  purchaseDate: "",
};

function getTodayDateString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export default function PurchasesPage() {
  const router = useRouter();
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [form, setForm] = useState<FormState>(initialForm);
  const [jpyRates, setJpyRates] = useState<Record<string, number> | null>(null);
  const [ratesError, setRatesError] = useState("");
  const [loadError, setLoadError] = useState("");
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingValue, setEditingValue] = useState("");

  // サーバー/クライアントの日付ずれ(hydrationミスマッチ)を避けるため、
  // 今日の日付はマウント後にセットする。
  useEffect(() => {
    setForm((prev) => ({ ...prev, purchaseDate: getTodayDateString() }));
  }, []);

  useEffect(() => {
    if (!getToken()) {
      router.push("/login");
      return;
    }

    fetchPurchases()
      .then(setPurchases)
      .catch(() => {
        setLoadError("購入履歴の取得に失敗しました");
        if (!getToken()) router.push("/login");
      })
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    fetchJpyRates()
      .then(setJpyRates)
      .catch((err: Error) => setRatesError(err.message));
  }, []);

  async function handleLogout() {
    await logout();
    router.push("/login");
  }

  // 選択中の通貨のレートが取得できたら、本日時点のレートを為替レート欄に反映する
  useEffect(() => {
    const rate = jpyRates?.[form.currency];
    if (rate !== undefined) {
      setForm((prev) => ({ ...prev, exchangeRate: rate.toFixed(4) }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [jpyRates, form.currency]);

  function handleChange(
    field: keyof FormState
  ): (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void {
    return (e) => setForm((prev) => ({ ...prev, [field]: e.target.value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoadError("");
    try {
      const created = await createPurchase({
        itemName: form.itemName,
        currency: form.currency,
        foreignAmount: Number(form.foreignAmount),
        exchangeRate: Number(form.exchangeRate),
        cardName: form.cardName,
        feeRate: getCardFeeRate(form.cardName),
        purchaseDate: form.purchaseDate,
      });
      setPurchases((prev) => [...prev, created]);
      const resetRate = jpyRates?.[initialForm.currency];
      setForm({
        ...initialForm,
        purchaseDate: getTodayDateString(),
        exchangeRate: resetRate !== undefined ? resetRate.toFixed(4) : "",
      });
    } catch {
      setLoadError("登録に失敗しました");
    }
  }

  async function handleDelete(id: number) {
    setLoadError("");
    try {
      await deletePurchase(id);
      setPurchases((prev) => prev.filter((p) => p.id !== id));
    } catch {
      setLoadError("削除に失敗しました");
    }
  }

  async function handleItemNameSave(id: number, itemName: string) {
    setEditingId(null);
    setLoadError("");
    try {
      const updated = await updatePurchaseItemName(id, itemName);
      setPurchases((prev) => prev.map((p) => (p.id === id ? updated : p)));
    } catch {
      setLoadError("商品名の更新に失敗しました");
    }
  }

  function renderItemName(p: Purchase) {
    if (editingId === p.id) {
      return (
        <input
          type="text"
          autoFocus
          value={editingValue}
          onChange={(e) => setEditingValue(e.target.value)}
          onBlur={() => handleItemNameSave(p.id, editingValue)}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleItemNameSave(p.id, editingValue);
            if (e.key === "Escape") setEditingId(null);
          }}
          className="w-full rounded-md border border-indigo-400 px-2 py-1 text-sm focus:outline-none"
        />
      );
    }
    return (
      <button
        type="button"
        onClick={() => {
          setEditingId(p.id);
          setEditingValue(p.itemName);
        }}
        className="text-left hover:underline"
        title="クリックして編集"
      >
        {p.itemName || <span className="text-gray-400">（商品名未設定）</span>}
      </button>
    );
  }

  const foreignTotals = useMemo(() => {
    const totals = new Map<string, number>();
    for (const p of purchases) {
      totals.set(p.currency, (totals.get(p.currency) ?? 0) + p.foreignAmount);
    }
    return Array.from(totals.entries());
  }, [purchases]);

  const jpyTotal = useMemo(
    () => purchases.reduce((sum, p) => sum + p.jpyAmount, 0),
    [purchases]
  );

  if (loading) {
    return (
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8">
        <p className="text-gray-500">読み込み中...</p>
      </main>
    );
  }

  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900">購入履歴</h1>
        <button
          onClick={handleLogout}
          className="text-sm text-gray-500 hover:text-gray-700 hover:underline"
        >
          ログアウト
        </button>
      </div>

      {loadError && (
        <p className="mb-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-600">
          {loadError}
        </p>
      )}

      <form
        onSubmit={handleSubmit}
        className="mb-8 grid grid-cols-1 gap-4 rounded-lg bg-white p-4 shadow sm:grid-cols-2 sm:p-6 lg:grid-cols-3"
      >
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">商品名（任意）</label>
          <input
            type="text"
            value={form.itemName}
            onChange={handleChange("itemName")}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-base focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 sm:text-sm"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">現地通貨</label>
          <select
            value={form.currency}
            onChange={handleChange("currency")}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-base focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 sm:text-sm"
          >
            {CURRENCIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">現地金額</label>
          <input
            type="number"
            inputMode="decimal"
            step="0.01"
            required
            value={form.foreignAmount}
            onChange={handleChange("foreignAmount")}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-base focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 sm:text-sm"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">為替レート</label>
          <input
            type="number"
            inputMode="decimal"
            step="0.0001"
            required
            value={form.exchangeRate}
            onChange={handleChange("exchangeRate")}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-base focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 sm:text-sm"
          />
          {ratesError ? (
            <p className="mt-1 text-xs text-red-600">
              自動取得に失敗しました。手動で入力してください。
            </p>
          ) : (
            <p className="mt-1 text-xs text-gray-400">
              {jpyRates ? "本日のレートを自動反映（編集可）" : "本日のレートを取得中..."}
            </p>
          )}
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            カード（海外事務手数料）
          </label>
          <select
            value={form.cardName}
            onChange={handleChange("cardName")}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-base focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 sm:text-sm"
          >
            {CARD_OPTIONS.map((c) => (
              <option key={c.name} value={c.name}>
                {c.name}（{c.feeRate}%）
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">購入日</label>
          <input
            type="date"
            required
            value={form.purchaseDate}
            onChange={handleChange("purchaseDate")}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-base focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 sm:text-sm"
          />
        </div>

        <div className="sm:col-span-2 lg:col-span-3">
          <button
            type="submit"
            className="w-full rounded-md bg-indigo-600 px-4 py-3 text-base font-semibold text-white hover:bg-indigo-500 sm:w-auto sm:py-2 sm:text-sm"
          >
            円換算して登録
          </button>
        </div>
      </form>

      {purchases.length === 0 ? (
        <p className="rounded-lg bg-white px-4 py-6 text-center text-gray-400 shadow">
          購入履歴はまだありません
        </p>
      ) : (
        <>
          {/* スマホ: カード表示 */}
          <div className="space-y-3 sm:hidden">
            {purchases.map((p) => (
              <div key={p.id} className="rounded-lg bg-white p-4 shadow">
                <div className="flex items-start justify-between gap-2">
                  <div className="text-base font-medium text-gray-900">
                    {renderItemName(p)}
                  </div>
                  <button
                    onClick={() => handleDelete(p.id)}
                    className="shrink-0 text-sm text-red-600 hover:underline"
                  >
                    削除
                  </button>
                </div>
                <p className="mt-1 text-2xl font-bold text-gray-900">
                  ¥{numberFormat.format(p.jpyAmount)}
                </p>
                <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 text-sm text-gray-600">
                  <div>
                    <dt className="text-xs text-gray-400">現地金額</dt>
                    <dd>
                      {numberFormat.format(p.foreignAmount)} {p.currency}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs text-gray-400">使用レート</dt>
                    <dd>{p.exchangeRate}</dd>
                  </div>
                  <div>
                    <dt className="text-xs text-gray-400">カード</dt>
                    <dd>
                      {p.cardName}（{p.feeRate}%）
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs text-gray-400">購入日</dt>
                    <dd>{p.purchaseDate}</dd>
                  </div>
                </dl>
              </div>
            ))}
          </div>

          {/* sm以上: テーブル表示 */}
          <div className="hidden overflow-x-auto rounded-lg bg-white shadow sm:block">
            <table className="min-w-full divide-y divide-gray-200 text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">商品名</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">現地通貨</th>
                  <th className="px-4 py-3 text-right font-medium text-gray-600">現地金額</th>
                  <th className="px-4 py-3 text-right font-medium text-gray-600">日本円換算額</th>
                  <th className="px-4 py-3 text-right font-medium text-gray-600">使用レート</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">カード</th>
                  <th className="px-4 py-3 text-right font-medium text-gray-600">手数料率</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">購入日</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {purchases.map((p) => (
                  <tr key={p.id}>
                    <td className="whitespace-nowrap px-4 py-3">{renderItemName(p)}</td>
                    <td className="whitespace-nowrap px-4 py-3">{p.currency}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-right">
                      {numberFormat.format(p.foreignAmount)}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-right">
                      ¥{numberFormat.format(p.jpyAmount)}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-right">{p.exchangeRate}</td>
                    <td className="whitespace-nowrap px-4 py-3">{p.cardName}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-right">{p.feeRate}%</td>
                    <td className="whitespace-nowrap px-4 py-3">{p.purchaseDate}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-right">
                      <button
                        onClick={() => handleDelete(p.id)}
                        className="text-red-600 hover:underline"
                      >
                        削除
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      <div className="mt-6 flex flex-col gap-2 rounded-lg bg-white p-6 shadow sm:flex-row sm:justify-end sm:gap-8">
        <div>
          <p className="text-sm text-gray-500">現地通貨合計</p>
          {foreignTotals.length === 0 ? (
            <p className="text-lg font-semibold text-gray-900">-</p>
          ) : (
            foreignTotals.map(([currency, total]) => (
              <p key={currency} className="text-lg font-semibold text-gray-900">
                {numberFormat.format(total)} {currency}
              </p>
            ))
          )}
        </div>
        <div>
          <p className="text-sm text-gray-500">日本円合計（手数料込み）</p>
          <p className="text-lg font-semibold text-gray-900">
            ¥{numberFormat.format(jpyTotal)}
          </p>
        </div>
      </div>
    </main>
  );
}
