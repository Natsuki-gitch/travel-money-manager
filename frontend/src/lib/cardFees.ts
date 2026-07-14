export const CARD_OPTIONS = [
  { name: "アメックス", feeRate: 3.5 },
  { name: "楽天カード", feeRate: 3.63 },
  { name: "楽天デビット", feeRate: 3.08 },
] as const;

export type CardName = (typeof CARD_OPTIONS)[number]["name"];

export function getCardFeeRate(cardName: string): number {
  return CARD_OPTIONS.find((c) => c.name === cardName)?.feeRate ?? 0;
}
