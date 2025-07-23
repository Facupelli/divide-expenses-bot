export interface PayoutTransaction {
	debtor: { user: string; balance: number };
	payerAmount: number;
	creditor: { user: string; balance: number };
}
