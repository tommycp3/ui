import React from "react";
import { colors, hexToRgba } from "../../utils/colorConfig";
import { formatMicroAsUsdc } from "../../constants/currency";
import { DepositSession } from "../../types";

interface SessionStatusCardProps {
    session: DepositSession;
}

/**
 * Displays current deposit session status
 */
export const SessionStatusCard: React.FC<SessionStatusCardProps> = ({ session }) => {
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
            <h2 className="text-lg font-semibold mb-2" style={{ color: "white" }}>
                Session Status
            </h2>
            <p className="text-sm" style={{ color: colors.ui.textSecondary + "dd" }}>
                Status: {session.status}
            </p>
            <p className="text-sm" style={{ color: colors.ui.textSecondary + "dd" }}>
                Session ID: {session._id}
            </p>
            {session.amount && (
                <p className="text-sm" style={{ color: colors.ui.textSecondary + "dd" }}>
                    Amount: ${formatMicroAsUsdc(session.amount, 2)} USDC
                </p>
            )}
        </div>
    );
};

export default SessionStatusCard;
