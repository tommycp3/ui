import React from "react";
import { colors, hexToRgba } from "../../utils/colorConfig";

interface Web3DepositSectionProps {
    isConnected: boolean;
    web3Address?: string;
    web3Balance: string;
    depositAmount: string;
    isTransferring: boolean;
    onConnect: () => void;
    onDisconnect: () => void;
    onRefreshBalance: () => void;
    onAmountChange: (amount: string) => void;
    onTransfer: () => void;
}

/**
 * Web3 wallet deposit section with connect/disconnect and USDC transfer
 */
export const Web3DepositSection: React.FC<Web3DepositSectionProps> = ({
    isConnected,
    web3Address,
    web3Balance,
    depositAmount,
    isTransferring,
    onConnect,
    onDisconnect,
    onRefreshBalance,
    onAmountChange,
    onTransfer
}) => {
    const isTransferDisabled = !depositAmount || isTransferring || parseFloat(depositAmount) <= 0;

    return (
        <div className="mt-8 pt-6 border-t" style={{ borderColor: hexToRgba(colors.brand.primary, 0.1) }}>
            <div className="text-center mb-4">
                <div className="flex items-center justify-center gap-3">
                    <div className="h-px flex-1" style={{ backgroundColor: hexToRgba(colors.brand.primary, 0.1) }}></div>
                    <span className="text-gray-400 text-sm px-2">OR</span>
                    <div className="h-px flex-1" style={{ backgroundColor: hexToRgba(colors.brand.primary, 0.1) }}></div>
                </div>
            </div>

            <div
                className="backdrop-blur-sm rounded-xl p-5 shadow-lg transition-all duration-300"
                style={{
                    backgroundColor: hexToRgba(colors.ui.bgMedium, 0.9),
                    border: `1px solid ${hexToRgba(colors.brand.primary, 0.1)}`
                }}
                onMouseEnter={e => {
                    e.currentTarget.style.borderColor = hexToRgba(colors.brand.primary, 0.2);
                }}
                onMouseLeave={e => {
                    e.currentTarget.style.borderColor = hexToRgba(colors.brand.primary, 0.1);
                }}
            >
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                        <svg className="w-8 h-8" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
                            <g fill="none" fillRule="evenodd">
                                <circle cx="16" cy="16" r="16" fill="#2775CA" />
                                <path
                                    fill="#FFF"
                                    d="M15.75 27.5C9.26 27.5 4 22.24 4 15.75S9.26 4 15.75 4a11.75 11.75 0 110 23.5zm-.7-16.11a2.58 2.58 0 00-2.45 2.47c0 1.21.74 2 2.31 2.33 1.1.26 1.3.5 1.3.93s-.27.69-.9.69a4.46 4.46 0 01-2.44-.75l-.44 1.84a5.26 5.26 0 002.44.57v1.78h1.5V19c1.84-.17 2.87-1.33 2.87-2.69 0-1.17-.7-1.94-2.27-2.3-1.1-.23-1.34-.48-1.34-.91s.28-.66.83-.66a4.06 4.06 0 012 .54L19 11.3a5.66 5.66 0 00-2-.43v-1.8h-1.5v1.78a2.52 2.52 0 00-.45.04z"
                                />
                            </g>
                        </svg>
                        <div>
                            <h2 className="text-lg font-bold" style={{ color: "white" }}>
                                USDC via Web3 Wallet
                            </h2>
                            <p className="text-xs" style={{ color: colors.ui.textSecondary }}>
                                Metamask, Coinbase Wallet, etc.
                            </p>
                        </div>
                    </div>
                </div>

                <div
                    className="p-3 rounded-lg mb-4"
                    style={{
                        backgroundColor: hexToRgba(colors.ui.bgDark, 0.4),
                        border: `1px solid ${hexToRgba(colors.brand.primary, 0.2)}`
                    }}
                >
                    <p className="text-xs" style={{ color: colors.ui.textSecondary }}>
                        <strong>How it works:</strong> Connect wallet → Send USDC directly → No conversion fees → Credits your gaming account
                    </p>
                </div>

                {!isConnected ? (
                    <button
                        onClick={onConnect}
                        className="w-full py-3 px-4 rounded-lg transition duration-300 shadow-md hover:opacity-90"
                        style={{
                            background: `linear-gradient(135deg, ${hexToRgba(colors.brand.primary, 0.7)} 0%, ${hexToRgba(colors.brand.primary, 0.8)} 100%)`
                        }}
                    >
                        <div className="flex items-center justify-center gap-2">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                            </svg>
                            <span className="text-white">Connect Wallet</span>
                        </div>
                    </button>
                ) : (
                    <div className="space-y-4">
                        <div className="flex justify-between items-center" style={{ color: "white" }}>
                            <span>
                                Connected: {web3Address?.slice(0, 6)}...{web3Address?.slice(-4)}
                            </span>
                            <button
                                onClick={onDisconnect}
                                className="text-xs px-3 py-1 bg-gradient-to-br from-red-500 to-red-600 hover:from-red-400 hover:to-red-500 text-white rounded-lg transition duration-300 shadow-md"
                            >
                                Disconnect
                            </button>
                        </div>

                        <div
                            className="p-3 rounded-lg"
                            style={{
                                backgroundColor: hexToRgba(colors.ui.bgDark, 0.6),
                                border: `1px solid ${hexToRgba(colors.brand.primary, 0.1)}`
                            }}
                        >
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div
                                        className="w-10 h-10 rounded-full flex items-center justify-center"
                                        style={{ backgroundColor: hexToRgba(colors.brand.primary, 0.2) }}
                                    >
                                        <span className="font-bold text-lg" style={{ color: colors.brand.primary }}>$</span>
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold" style={{ color: "white" }}>Web3 Wallet USDC Balance</p>
                                        <p className="text-xs" style={{ color: colors.ui.textSecondary }}>Available on Ethereum Mainnet</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="text-right">
                                        <p className="text-lg font-bold" style={{ color: colors.brand.primary }}>${web3Balance || "0.00"}</p>
                                    </div>
                                    <button
                                        onClick={onRefreshBalance}
                                        className="p-1.5 bg-gray-700 rounded-md hover:bg-gray-600 transition-colors"
                                        title="Refresh balance"
                                    >
                                        <svg className="w-4 h-4" style={{ color: colors.brand.primary }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                        </svg>
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <p className="text-sm mb-2" style={{ color: colors.ui.textSecondary + "dd" }}>Enter amount in USD:</p>
                            <input
                                type="number"
                                value={depositAmount}
                                onChange={e => onAmountChange(e.target.value)}
                                placeholder="100.00"
                                className="w-full p-3 rounded-lg focus:outline-none focus:ring-2 transition-all"
                                style={{
                                    backgroundColor: hexToRgba(colors.ui.bgDark, 0.6),
                                    border: `1px solid ${hexToRgba(colors.brand.primary, 0.2)}`,
                                    color: "white"
                                }}
                                min="0"
                                step="0.01"
                            />

                            <button
                                onClick={onTransfer}
                                disabled={isTransferDisabled}
                                className="w-full py-3 px-4 rounded-lg transition duration-300 shadow-md"
                                style={{
                                    backgroundColor: isTransferDisabled ? colors.ui.textSecondary : colors.brand.primary,
                                    color: "white",
                                    cursor: isTransferDisabled ? "not-allowed" : "pointer"
                                }}
                                onMouseEnter={e => {
                                    if (!isTransferDisabled) {
                                        e.currentTarget.style.backgroundColor = colors.brand.secondary;
                                    }
                                }}
                                onMouseLeave={e => {
                                    if (!isTransferDisabled) {
                                        e.currentTarget.style.backgroundColor = colors.brand.primary;
                                    }
                                }}
                            >
                                {isTransferring ? "Processing..." : "Deposit USDC"}
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Web3DepositSection;
