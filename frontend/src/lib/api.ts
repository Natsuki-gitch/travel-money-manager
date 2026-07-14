import { Purchase } from "@/types/purchase";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3002";
const TOKEN_KEY = "authToken";

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
}

function setToken(token: string) {
  localStorage.setItem(TOKEN_KEY, token);
}

function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
}

export async function login(email: string, password: string): Promise<void> {
  const res = await fetch(`${API_BASE_URL}/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ user: { email, password } }),
  });

  if (!res.ok) {
    throw new Error("メールアドレスまたはパスワードが違います");
  }

  const token = res.headers.get("Authorization");
  if (!token) {
    throw new Error("認証トークンの取得に失敗しました");
  }
  setToken(token);
}

export async function logout(): Promise<void> {
  const token = getToken();
  if (token) {
    await fetch(`${API_BASE_URL}/logout`, {
      method: "DELETE",
      headers: { Authorization: token },
    }).catch(() => {});
  }
  clearToken();
}

type RawPurchase = {
  id: number;
  item_name: string;
  currency: string;
  foreign_amount: string;
  exchange_rate: string;
  card_name: string;
  fee_rate: string;
  jpy_amount: number;
  purchase_date: string;
};

function toPurchase(raw: RawPurchase): Purchase {
  return {
    id: raw.id,
    itemName: raw.item_name,
    currency: raw.currency,
    foreignAmount: Number(raw.foreign_amount),
    exchangeRate: Number(raw.exchange_rate),
    cardName: raw.card_name,
    feeRate: Number(raw.fee_rate),
    jpyAmount: raw.jpy_amount,
    purchaseDate: raw.purchase_date,
  };
}

async function authorizedFetch(path: string, options: RequestInit = {}): Promise<Response> {
  const token = getToken();
  const res = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      ...(options.headers || {}),
      ...(token ? { Authorization: token } : {}),
    },
  });

  if (res.status === 401) {
    clearToken();
  }

  return res;
}

export async function fetchPurchases(): Promise<Purchase[]> {
  const res = await authorizedFetch("/purchases");
  if (!res.ok) throw new Error("購入履歴の取得に失敗しました");
  const data: RawPurchase[] = await res.json();
  return data.map(toPurchase);
}

export type NewPurchaseInput = {
  itemName: string;
  currency: string;
  foreignAmount: number;
  exchangeRate: number;
  cardName: string;
  feeRate: number;
  purchaseDate: string;
};

export async function createPurchase(input: NewPurchaseInput): Promise<Purchase> {
  const res = await authorizedFetch("/purchases", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      purchase: {
        item_name: input.itemName,
        currency: input.currency,
        foreign_amount: input.foreignAmount,
        exchange_rate: input.exchangeRate,
        card_name: input.cardName,
        fee_rate: input.feeRate,
        purchase_date: input.purchaseDate,
      },
    }),
  });
  if (!res.ok) throw new Error("登録に失敗しました");
  return toPurchase(await res.json());
}

export async function updatePurchaseItemName(id: number, itemName: string): Promise<Purchase> {
  const res = await authorizedFetch(`/purchases/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ purchase: { item_name: itemName } }),
  });
  if (!res.ok) throw new Error("更新に失敗しました");
  return toPurchase(await res.json());
}

export async function deletePurchase(id: number): Promise<void> {
  const res = await authorizedFetch(`/purchases/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error("削除に失敗しました");
}
