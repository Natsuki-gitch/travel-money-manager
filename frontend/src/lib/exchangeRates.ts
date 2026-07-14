const EXCHANGE_RATE_API_URL = "https://open.er-api.com/v6/latest/JPY";

type ExchangeRateApiResponse = {
  result: string;
  rates: Record<string, number>;
};

// 為替レート自動取得（無料API・APIキー不要）。取得元はJPY基準のため、
// 通貨ごとの対円レートは 1 / rates[currency] で算出する。
export async function fetchJpyRates(): Promise<Record<string, number>> {
  const res = await fetch(EXCHANGE_RATE_API_URL);
  if (!res.ok) {
    throw new Error(`為替レートの取得に失敗しました (status: ${res.status})`);
  }

  const data: ExchangeRateApiResponse = await res.json();
  if (data.result !== "success") {
    throw new Error("為替レートの取得に失敗しました");
  }

  const jpyRates: Record<string, number> = {};
  for (const [currency, jpyPerCurrency] of Object.entries(data.rates)) {
    jpyRates[currency] = jpyPerCurrency === 0 ? 0 : 1 / jpyPerCurrency;
  }
  return jpyRates;
}
