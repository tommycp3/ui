import HTTPClient from "./HTTPClient";

export class PaymentApi extends HTTPClient {
    public createCryptoPayment = (data: { amount: number; currency: string; cosmosAddress: string }) => this.post("/api/nowpayments/create", data);
    public getCurrencies = () => this.get("/api/nowpayments/currencies");
    public getPaymentStatus = (paymentId: string) => this.get(`/api/nowpayments/payment/${paymentId}`);
    public getDepositSession = (userAddress: string) => this.get(`/deposit-sessions/user/${userAddress}`);
}

export class CosmosApi extends HTTPClient {
    public getSentTransactions = (senderQuery: string) => this.get(`/cosmos/tx/v1beta1/txs?query=${encodeURIComponent(senderQuery)}&order_by=2&limit=10`);
    public getReceivedTransactions = (recipientQuery: string) =>
        this.get(`/cosmos/tx/v1beta1/txs?query=${encodeURIComponent(recipientQuery)}&order_by=2&limit=10`);
    public getValidators = (limit?: number) => this.get(`/cosmos/staking/v1beta1/validators${limit ? `?pagination.limit=${limit}` : ""}`);
    public getValidatorsByStatus = (status: string, signal?: AbortSignal) =>
        this.get(`/cosmos/staking/v1beta1/validators?status=${status}&pagination.limit=100`, { signal });
    public getAccounts = (limit?: number) => this.get(`/cosmos/auth/v1beta1/accounts${limit ? `?pagination.limit=${limit}` : ""}`);
    public getBalanceByAddress = (address: string) => this.get(`/cosmos/bank/v1beta1/balances/${address}`);
    public getGameState = (gameId: string) => this.get(`block52/pokerchain/poker/v1/game_state/${gameId}`);
    public getWithdrawal = () => this.get("/pokerchain/poker/withdrawal_requests"); 
}
