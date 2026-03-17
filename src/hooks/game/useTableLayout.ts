/**
 * Hook for managing table layout configuration
 *
 * Uses the stageGeometry engine to calculate positions from the spec's
 * stadium-intersection model instead of hardcoded position arrays.
 */

import { useState, useEffect, useCallback, useMemo } from "react";
import {
    type TableSize,
    type PositionArrays,
    getViewportMode,
    calculateZoom,
    getTableTransform,
    getAllPositions
} from "../../config/stageGeometry";

export interface UseTableLayoutReturn {
    viewportMode: string;
    positions: PositionArrays;
    zoom: number;
    tableTransform: string;
    isLandscape: boolean;
    refreshLayout: () => void;
}

export const useTableLayout = (tableSize: TableSize): UseTableLayoutReturn => {
    const [viewportMode, setViewportMode] = useState(getViewportMode());
    const [zoom, setZoom] = useState(calculateZoom());
    const [isLandscape, setIsLandscape] = useState(window.innerWidth > window.innerHeight);

    const refreshLayout = useCallback(() => {
        setViewportMode(getViewportMode());
        setZoom(calculateZoom());
        setIsLandscape(window.innerWidth > window.innerHeight);
    }, []);

    useEffect(() => {
        const handleResize = () => refreshLayout();
        const handleOrientationChange = () => setTimeout(refreshLayout, 100);

        window.addEventListener("resize", handleResize);
        window.addEventListener("orientationchange", handleOrientationChange);

        return () => {
            window.removeEventListener("resize", handleResize);
            window.removeEventListener("orientationchange", handleOrientationChange);
        };
    }, [refreshLayout]);

    const positions = useMemo(() => getAllPositions(tableSize), [tableSize]);

    const tableTransform = getTableTransform(zoom);

    return {
        viewportMode,
        positions,
        zoom,
        tableTransform,
        isLandscape,
        refreshLayout
    };
};
