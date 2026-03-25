/**
 * Hook for managing table layout configuration.
 *
 * Measures the ACTUAL parent container (via ref) and passes its dimensions
 * to the geometry engine. Uses useLayoutEffect for synchronous measurement
 * before first paint, and reads ref directly to avoid stale state.
 */

import { useState, useLayoutEffect, useCallback, useMemo, type RefObject } from "react";
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

export const useTableLayout = (
    tableSize: TableSize,
    containerRef?: RefObject<HTMLDivElement | null>
): UseTableLayoutReturn => {
    const [viewportMode, setViewportMode] = useState(getViewportMode());
    // State only used to trigger re-renders on resize — actual values read from ref
    const [, setResizeTick] = useState(0);
    const [isLandscape, setIsLandscape] = useState(window.innerWidth > window.innerHeight);

    const refreshLayout = useCallback(() => {
        setViewportMode(getViewportMode());
        setIsLandscape(window.innerWidth > window.innerHeight);
        setResizeTick(t => t + 1); // Force re-render so zoom/transform recalculate from ref
    }, []);

    // useLayoutEffect fires synchronously BEFORE the browser paints.
    // This ensures the first visible frame uses the real container dimensions.
    useLayoutEffect(() => {
        refreshLayout();

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

    // Read container dimensions DIRECTLY from the ref on every render.
    // This avoids stale state — the ref always has the current DOM value.
    const el = containerRef?.current;
    const cw = el?.offsetWidth ?? window.innerWidth;
    const ch = el?.offsetHeight ?? window.innerHeight;

    const zoom = calculateZoom(tableSize, cw, ch);
    const tableTransform = getTableTransform(zoom, tableSize, cw, ch);

    return {
        viewportMode,
        positions,
        zoom,
        tableTransform,
        isLandscape,
        refreshLayout
    };
};
