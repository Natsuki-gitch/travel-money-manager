export const CARD_OPTIONS = [
  { name: "アメックス", feeRate: 3.5 },
  { name: "楽天カード", feeRate: 3.63 },
  { name: "楽天デビット", feeRate: 3.08 },
  { name: "JCB", feeRate: 1.6 },
] as const;

export type CardName = (typeof CARD_OPTIONS)[number]["name"];

export function getCardFeeRate(cardName: string): number {
  return CARD_OPTIONS.find((c) => c.name === cardName)?.feeRate ?? 0;
}

const USER_DEFAULT_CARD: Record<string, CardName> = {
  natsuki: "楽天デビット",
  shimada4: "楽天カード",
};

export function getDefaultCardForUser(userEmail: string | null): CardName {
  if (userEmail && userEmail in USER_DEFAULT_CARD) {
    return USER_DEFAULT_CARD[userEmail];
  }
  return CARD_OPTIONS[0].name;
}
