import React from "react";
import { colors, hexToRgba } from "../../utils/colorConfig";
import { formatBalance } from "../../utils/numberUtils";

interface BalanceDisplayProps {
    balance: string;
    nonce?: number | null;
    clubName: string;
}

/**
 * Displays the user's Block52 balance and nonce
 */
export const BalanceDisplay: React.FC<BalanceDisplayProps> = ({ balance, nonce, clubName }) => {
    return (
        <div
            className="backdrop-blur-sm rounded-lg p-4 mb-6 shadow-lg transition-all duration-300"
            style={{
                backgroundColor: colors.ui.bgMedium,
                border: `1px solid ${hexToRgba(colors.brand.primary, 0.2)}`
            }}
            onMouseEnter={e => {
                e.currentTarget.style.borderColor = hexToRgba(colors.brand.primary, 0.2);
            }}
            onMouseLeave={e => {
                e.currentTarget.style.borderColor = hexToRgba(colors.brand.primary, 0.1);
            }}
        >
            <p className="text-lg mb-2" style={{ color: "white" }}>
                {clubName} Balance:
            </p>
            <p className="text-xl font-bold" style={{ color: colors.brand.primary }}>
                ${formatBalance(balance)} USDC
            </p>
            {nonce != null && (
                <p
                    className="text-sm mt-2 border-t pt-2"
                    style={{
                        color: colors.ui.textSecondary + "dd",
                        borderColor: colors.ui.textSecondary
                    }}
                >
                    <span style={{ color: colors.brand.primary + "cc" }}>Nonce:</span> {nonce}
                </p>
            )}
        </div>
    );
};

export default BalanceDisplay;
