import React from "react";
import { useParams } from "react-router-dom";
import { useTableAnimations } from "../../../hooks/animations/useTableAnimations";
import { useWinnerInfo } from "../../../hooks/game/useWinnerInfo";
import { useTableLayout } from "../../../hooks/game/useTableLayout";
import { WinAnimationProps } from "../../../types/index";
import "./WinAnimation.css";

const WinAnimation: React.FC<WinAnimationProps> = React.memo(({ index }) => {
    const { id: _id } = useParams<{ id: string }>();
    const { tableSize } = useTableAnimations();
    const { winnerInfo } = useWinnerInfo();
    const tableLayout = useTableLayout(tableSize as 2 | 6 | 9 || 9);

    const position = tableLayout.positions.winAnimations?.[index];

    // Only render for the winner
    const isWinner = !!winnerInfo?.some(w => w.seat === index + 1);
    if (!isWinner || !position) return null;

    return (
        <div className="win-animation-container" style={{ left: position.left, top: position.top }}>
            {/* Ripple rings */}
            {[0, 1, 2, 3].map(i => (
                <div key={`ring-${i}`} className={`win-animation-ring win-animation-ring-${i}`} />
            ))}

            {/* Placeholder bubbles (will become SVG icons) */}
            <ul className="bubbles">
                {[0, 1, 2, 3, 4].map((_, i) => (
                    <li key={i} className="bubble" />
                ))}
            </ul>
        </div>
    );
});

WinAnimation.displayName = "WinAnimation";
export default WinAnimation;
