import React from "react";
import { colors } from "../../utils/colorConfig";
import { TransactionStatus } from "../../types";

interface DepositProgressBarProps {
    status: TransactionStatus;
    progressPercentage: number;
    txHash?: string;
}

/**
 * Get human-readable status message
 */
const getStatusMessage = (status: TransactionStatus): string => {
    switch (status) {
        case "DETECTED":
            return "Transaction Detected";
        case "PROCESSING":
            return "Processing...";
        case "CONFIRMING":
            return "Confirming...";
        case "CONFIRMED":
            return "Confirmed! Updating balance...";
        case "COMPLETED":
            return "Deposit Complete!";
        default:
            return "Waiting for transaction...";
    }
};

/**
 * Displays transaction progress with status and optional transaction link
 */
export const DepositProgressBar: React.FC<DepositProgressBarProps> = ({
    status,
    progressPercentage,
    txHash
}) => {
    if (!status) return null;

    return (
        <div className="mb-6">
            <div className="flex justify-between items-center mb-2">
                <h2 className="text-lg font-semibold" style={{ color: "white" }}>
                    Deposit Status
                </h2>
                <span className="text-sm" style={{ color: colors.accent.success }}>
                    {getStatusMessage(status)}
                </span>
            </div>
            <div className="w-full rounded-full h-4" style={{ backgroundColor: colors.ui.bgMedium }}>
                <div
                    className="h-4 rounded-full transition-all duration-500 ease-out"
                    style={{
                        width: `${progressPercentage}%`,
                        backgroundColor: colors.accent.success
                    }}
                ></div>
            </div>
            {txHash && (
                <div className="mt-2 text-xs text-gray-400">
                    TX:{" "}
                    <a
                        href={`https://etherscan.io/tx/${txHash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:underline"
                        style={{ color: colors.brand.primary }}
                    >
                        {txHash.substring(0, 10)}...{txHash.substring(txHash.length - 8)}
                    </a>
                </div>
            )}
        </div>
    );
};

export default DepositProgressBar;
