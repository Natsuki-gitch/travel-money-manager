export type Purchase = {
  id: number;
  itemName: string;
  currency: string;
  foreignAmount: number;
  exchangeRate: number;
  cardName: string;
  feeRate: number;
  jpyAmount: number;
  purchaseDate: string;
};
