/**
 * PlayerPopUpCard Component
 *
 * Popup menu for vacant seat actions. Returns null for occupied seats.
 *
 * Props:
 * - id: Seat number
 * - label: Action button text (e.g., "CHANGE SEAT")
 * - color: Player's color theme
 * - isVacant: Whether this is a vacant seat (returns null if false)
 * - onClose: Function to close the popup
 * - setStartIndex: Function to trigger join modal
 */

import { memo, useMemo, useCallback } from "react";
import type { PlayerCardProps } from "../../../types/index";

const PlayerPopUpCard: React.FC<PlayerCardProps> = memo(({
    id,
    label,
    color,
    isVacant = false,
    onClose,
    setStartIndex
}) => {
    // Memoize action button click handler
    const handleActionClick = useCallback(() => {
        setStartIndex(id - 1);
        onClose();
    }, [setStartIndex, id, onClose]);

    // Memoize container styles
    const containerStyle = useMemo(() => ({
        backgroundColor: color
    }), [color]);

    // Don't show popup for occupied seats - no functionality needed
    if (!isVacant) {
        return null;
    }

    return (
        <div className="absolute w-64 h-32 ml-[-72px] mt-[45px] rounded-2xl shadow-lg bg-[#c0d6d9] flex flex-col items-center px-1 py-1 z-[15]">
            {/* Header Section */}
            <div className="flex justify-between items-center w-full mb-2">
                <div
                    style={containerStyle}
                    className="flex items-center justify-center w-7 h-7 text-white text-sm font-bold rounded-full"
                >
                    {id}
                </div>
                <button
                    onClick={onClose}
                    className="text-xl text-gray-700 hover:text-red-500 transition mr-2"
                >
                    ✕
                </button>
            </div>
            <div className="px-2 w-64">
                {/* Action Button - Only show for vacant seats */}
                <div
                    className="font-bold text-lg text-black bg-white py-1 w-full mb-4 rounded-2xl cursor-pointer"
                    onClick={handleActionClick}
                >
                    {label}
                </div>
            </div>
        </div>
    );
}, (prevProps, nextProps) => {
    // Custom comparison function for memo
    return (
        prevProps.id === nextProps.id &&
        prevProps.label === nextProps.label &&
        prevProps.color === nextProps.color &&
        prevProps.isVacant === nextProps.isVacant
    );
});

PlayerPopUpCard.displayName = "PlayerPopUpCard";

export default PlayerPopUpCard;
