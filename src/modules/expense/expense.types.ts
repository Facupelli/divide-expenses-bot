export interface PayoutsResponse {
	transactions: PayoutTransaction[];
	total: number;
	eachShare: number;
}

export interface PayoutTransaction {
	debtor: { user: string; balance: number };
	payerAmount: number;
	creditor: { user: string; balance: number };
}
