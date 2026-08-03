export interface PayoutsResponse {
	transactions: PayoutTransaction[];
	total: bigint;
	eachShare: bigint | null;
	accumulatedShares: Array<{ user: string; amount: bigint }>;
}

export interface PayoutTransaction {
	debtor: { user: string; balance: bigint };
	payerAmount: bigint;
	creditor: { user: string; balance: bigint };
}
