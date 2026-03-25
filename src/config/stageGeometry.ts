/**
 * Stage Geometry Engine
 *
 * Calculates all table layout positions from the spec's stadium-intersection model.
 * Replaces ~1700 lines of hardcoded position arrays with calculated positions.
 *
 * ═══════════════════════════════════════════════════════════════════════
 * HOW IT WORKS
 * ═══════════════════════════════════════════════════════════════════════
 *
 * 1. SPEC COORDINATES (from issue #142)
 *    TexasHODL provided exact seat positions on a 1600×850 "stage" using
 *    a stadium-intersection model (radial angles from table center).
 *
 * 2. COORDINATE CONVERSION
 *    stageToTable() converts those absolute stage coordinates into
 *    positions relative to the 900×450 table div:
 *      Stage (1282.2, 683.5) → Table-relative { left: "932.2px", top: "373.5px" }
 *
 * 3. DERIVED POSITIONS
 *    Chips, dealer buttons, and animations are calculated from seat positions:
 *      - Chips:      40% from seat toward table center (adjust CHIP_DISTANCE)
 *      - Dealer:     30% from seat toward table center (adjust DEALER_DISTANCE)
 *      - Turn anim:  seat position + 80px down (adjust TURN_ANIM_Y_OFFSET)
 *      - Win anim:   same as seat position
 *
 * 4. VIEWPORT SCALING
 *    Positions are FIXED on the table. Screen-size adaptation is handled by
 *    zoom/scale on the table container (calculateZoom + getTableTransform).
 *
 * ═══════════════════════════════════════════════════════════════════════
 * HOW TO FINE-TUNE POSITIONS
 * ═══════════════════════════════════════════════════════════════════════
 *
 * To move ALL chips/dealers/animations globally:
 *   → Change the distance constants: CHIP_DISTANCE, DEALER_DISTANCE, TURN_ANIM_Y_OFFSET
 *
 * To nudge ONE specific seat's element by a few pixels:
 *   → Add an entry to GLOBAL_OFFSETS (applies on all screen sizes)
 *     Example: GLOBAL_OFFSETS = { 9: { chips: { 3: { dx: -5, dy: 10 } } } }
 *
 * To nudge ONE specific seat on ONE specific screen size:
 *   → Add an entry to VIEWPORT_OFFSETS
 *     Example: VIEWPORT_OFFSETS["mobile-portrait"] = { 9: { chips: { 5: { dy: -8 } } } }
 *
 * dx = horizontal offset (positive = right, negative = left)
 * dy = vertical offset (positive = down, negative = up)
 *
 * References:
 * - Issue #142: https://github.com/block52/ui/issues/142
 * - Issue #46:  https://github.com/block52/ui/issues/46
 */

// ─── Types ───────────────────────────────────────────────────────────

export interface Position {
    left: string;
    top: string;
    color?: string;
}

export interface ChipPosition {
    left: string;
    bottom: string;
}

// ─── Stage Constants (from spec) ─────────────────────────────────────

export const STAGE_WIDTH = 1600;
export const STAGE_HEIGHT = 850;
export const TABLE_WIDTH = 900;
export const TABLE_HEIGHT = 450;
export const TABLE_SURFACE_HEIGHT = 450; // Match spec: table surface fills the full 900x450 table div
export const TABLE_CENTER_X = 800;
export const TABLE_CENTER_Y = 535;
export const SEAT_OFFSET = 72;

// Table div origin in stage coordinates
const TABLE_ORIGIN_X = TABLE_CENTER_X - TABLE_WIDTH / 2;   // 350
const TABLE_ORIGIN_Y = TABLE_CENTER_Y - TABLE_HEIGHT / 2;  // 310

// ─── Seat Colors ─────────────────────────────────────────────────────

const SEAT_COLORS_2 = ["#4ade80", "#3b82f6"];

const SEAT_COLORS_6 = [
    "#4ade80", "#f97316", "#ef4444",
    "#3b82f6", "#8b5cf6", "#ec4899"
];

const SEAT_COLORS_9 = [
    "#4ade80", "#f97316", "#ef4444",
    "#3b82f6", "#8b5cf6", "#212529",
    "#FFD700", "#ec4899", "#6b7280"
];

const SEAT_COLORS: Record<number, string[]> = {
    2: SEAT_COLORS_2,
    6: SEAT_COLORS_6,
    9: SEAT_COLORS_9
};

// ─── Seat Coordinates (from spec JSON, stage px) ─────────────────────

// Each entry is [stageX, stageY] from the issue #142 spec files
const SEAT_COORDS: Record<number, [number, number][]> = {
    2: [
        [800, 832],     // Seat 1 - bottom-center
        [800, 238]      // Seat 2 - top-center
    ],
    6: [
        [800, 832],     // Seat 1 - bottom-center
        [1282.2, 683.5],// Seat 2 - right arc 120deg
        [1282.2, 386.5],// Seat 3 - right arc 60deg
        [800, 238],     // Seat 4 - top-center
        [317.8, 386.5], // Seat 5 - left arc 60deg
        [317.8, 683.5]  // Seat 6 - left arc 120deg
    ],
    9: [
        [800, 832],     // Seat 1 - bottom-center
        [575, 832],     // Seat 2 - bottom-left
        [295.9, 636.6], // Seat 3 - left arc +70deg
        [384.1, 307.5], // Seat 4 - left arc +140deg
        [680, 238],     // Seat 5 - top-left
        [920, 238],     // Seat 6 - top-right
        [1215.9, 307.5],// Seat 7 - right arc +140deg
        [1304.1, 636.6],// Seat 8 - right arc +70deg
        [1025, 832]     // Seat 9 - bottom-right
    ]
};

// ─── Coordinate Conversion ───────────────────────────────────────────

/** Convert stage coordinates to table-div-relative pixel values */
function stageToTable(stageX: number, stageY: number): [number, number] {
    return [
        Math.round((stageX - TABLE_ORIGIN_X) * 10) / 10,
        Math.round((stageY - TABLE_ORIGIN_Y) * 10) / 10
    ];
}

/** Convert stage coordinates to Position (left/top px strings) */
function stageToPosition(stageX: number, stageY: number, color?: string): Position {
    const [x, y] = stageToTable(stageX, stageY);
    return {
        left: `${x}px`,
        top: `${y}px`,
        ...(color ? { color } : {})
    };
}

// ─── Derivation Constants (tweak these to move ALL positions globally) ──

/** How far chips sit from seat toward table center (0 = at seat, 1 = at center) */
const CHIP_DISTANCE = 0.4;

/** How far dealer button sits from seat toward table center.
 *  0.5 = halfway between seat and center — ensures button is ON the table surface
 *  for all seats including top (5,6) and edge (7,8) positions. */
const DEALER_DISTANCE = 0.45;

/** How many pixels down the turn animation ring sits below the player */
const TURN_ANIM_Y_OFFSET = 80;

// ─── Position Generators ─────────────────────────────────────────────

export type TableSize = 2 | 6 | 9;

/** Map any player count to the nearest supported table layout */
export function normalizeTableSize(raw: number): TableSize {
    if (raw <= 2) return 2;
    if (raw <= 6) return 6;
    return 9;
}

/** Get player seat positions for a given table size */
export function getSeatPositions(tableSize: TableSize): Position[] {
    const coords = SEAT_COORDS[tableSize];
    const colors = SEAT_COLORS[tableSize];
    return coords.map(([x, y], i) => stageToPosition(x, y, colors[i]));
}

/** Get vacant seat positions (same as seat positions) */
export function getVacantPositions(tableSize: TableSize): Position[] {
    const coords = SEAT_COORDS[tableSize];
    return coords.map(([x, y]) => stageToPosition(x, y));
}

/**
 * Get chip positions derived from seat positions.
 * Chips sit between the seat and table center, inside the 900x350 surface div.
 * They use { left, bottom } instead of { left, top }.
 */
export function getChipPositions(tableSize: TableSize): ChipPosition[] {
    const coords = SEAT_COORDS[tableSize];

    return coords.map(([sx, sy]) => {
        // Vector from seat toward table center
        const dx = TABLE_CENTER_X - sx;
        const dy = TABLE_CENTER_Y - sy;

        // Move CHIP_DISTANCE of the way from seat toward center
        const chipStageX = sx + dx * CHIP_DISTANCE;
        const chipStageY = sy + dy * CHIP_DISTANCE;

        // Convert to table-div-relative
        const [chipX] = stageToTable(chipStageX, chipStageY);

        // Chips are inside the 900x350 surface div, using "bottom" positioning.
        // The surface div starts at y=0 within the table div and is 350px tall.
        // bottom = TABLE_SURFACE_HEIGHT - (chipStageY - TABLE_ORIGIN_Y)
        const chipRelY = chipStageY - TABLE_ORIGIN_Y;
        const chipBottom = TABLE_SURFACE_HEIGHT - chipRelY;

        return {
            left: `${Math.round(chipX)}px`,
            bottom: `${Math.round(chipBottom)}px`
        };
    });
}

/**
 * Get dealer button positions.
 * Placed between seat and table edge, offset toward table center.
 */
export function getDealerPositions(tableSize: TableSize): Position[] {
    const coords = SEAT_COORDS[tableSize];

    return coords.map(([sx, sy]) => {
        const dx = TABLE_CENTER_X - sx;
        const dy = TABLE_CENTER_Y - sy;

        // Move DEALER_DISTANCE from seat toward center
        const dealerX = sx + dx * DEALER_DISTANCE;
        const dealerY = sy + dy * DEALER_DISTANCE;

        return stageToPosition(dealerX, dealerY);
    });
}

/**
 * Get turn animation positions.
 * Placed at the seat with a slight downward offset for the ring animation.
 */
export function getTurnAnimationPositions(tableSize: TableSize): Position[] {
    const coords = SEAT_COORDS[tableSize];

    return coords.map(([sx, sy]) => {
        // Shift down slightly so the ring appears below the player
        return stageToPosition(sx, sy + TURN_ANIM_Y_OFFSET);
    });
}

/**
 * Get win animation positions.
 * Same as seat positions (animation overlays the player).
 */
export function getWinAnimationPositions(tableSize: TableSize): Position[] {
    const coords = SEAT_COORDS[tableSize];
    return coords.map(([x, y]) => stageToPosition(x, y));
}

// ─── Fine-Tuning Offsets ─────────────────────────────────────────────
//
// Add entries here to nudge individual elements by a few pixels after
// visual QA. Leave empty by default — only add what needs adjustment.
//
// HOW TO USE:
//
// 1. Nudge seat 3's chips 5px left, 10px down on ALL screens:
//    GLOBAL_OFFSETS = { 9: { chips: { 3: { dx: -5, dy: 10 } } } }
//
// 2. Nudge seat 5's chips 8px up on MOBILE PORTRAIT only:
//    VIEWPORT_OFFSETS["mobile-portrait"] = { 9: { chips: { 5: { dy: -8 } } } }
//
// 3. Move dealer button for seat 7 right 10px on tablet:
//    VIEWPORT_OFFSETS["tablet"] = { 9: { dealers: { 7: { dx: 10 } } } }
//
// dx = horizontal (positive = right, negative = left)
// dy = vertical (positive = down, negative = up)

interface Offset { dx?: number; dy?: number; }

type ElementType = "players" | "vacantPlayers" | "chips" | "dealers"
                 | "turnAnimations" | "winAnimations";

/** Global offsets — apply to all screen sizes */
const GLOBAL_OFFSETS: Partial<Record<TableSize,
    Partial<Record<ElementType, Record<number, Offset>>>>> = {
    // Add entries here. Example:
    // 9: { chips: { 3: { dx: -5, dy: 10 } } }
};

/** Per-viewport offsets — override for specific screen sizes only */
const VIEWPORT_OFFSETS: Partial<Record<ViewportMode, typeof GLOBAL_OFFSETS>> = {
    // Add entries here. Example:
    // "mobile-portrait": { 9: { chips: { 5: { dx: 0, dy: -8 } } } }
};

/** Apply global + viewport offsets to a Position array */
function applyPositionOffsets(
    positions: Position[],
    tableSize: TableSize,
    element: ElementType
): Position[] {
    const mode = getViewportMode();
    const globalOffs = GLOBAL_OFFSETS[tableSize]?.[element];
    const vpOffs = VIEWPORT_OFFSETS[mode]?.[tableSize]?.[element];

    if (!globalOffs && !vpOffs) return positions;

    return positions.map((pos, i) => {
        const g = globalOffs?.[i];
        const v = vpOffs?.[i];
        if (!g && !v) return pos;

        const dx = (g?.dx ?? 0) + (v?.dx ?? 0);
        const dy = (g?.dy ?? 0) + (v?.dy ?? 0);

        return {
            ...pos,
            left: `${parseFloat(pos.left) + dx}px`,
            top: `${parseFloat(pos.top) + dy}px`
        };
    });
}

/** Apply global + viewport offsets to a ChipPosition array */
function applyChipOffsets(
    positions: ChipPosition[],
    tableSize: TableSize
): ChipPosition[] {
    const mode = getViewportMode();
    const globalOffs = GLOBAL_OFFSETS[tableSize]?.["chips"];
    const vpOffs = VIEWPORT_OFFSETS[mode]?.[tableSize]?.["chips"];

    if (!globalOffs && !vpOffs) return positions;

    return positions.map((pos, i) => {
        const g = globalOffs?.[i];
        const v = vpOffs?.[i];
        if (!g && !v) return pos;

        const dx = (g?.dx ?? 0) + (v?.dx ?? 0);
        const dy = (g?.dy ?? 0) + (v?.dy ?? 0);

        // Chips use "bottom" not "top", so dy inverts: positive dy = down = decrease bottom
        return {
            left: `${parseFloat(pos.left) + dx}px`,
            bottom: `${parseFloat(pos.bottom) - dy}px`
        };
    });
}

// ─── All Positions Bundle ────────────────────────────────────────────

export interface PositionArrays {
    players: Position[];
    vacantPlayers: Position[];
    chips: ChipPosition[];
    dealers: Position[];
    turnAnimations: Position[];
    winAnimations: Position[];
}

/** Get all position arrays for a given table size, with offsets applied */
export function getAllPositions(tableSize: TableSize): PositionArrays {
    return {
        players: applyPositionOffsets(getSeatPositions(tableSize), tableSize, "players"),
        vacantPlayers: applyPositionOffsets(getVacantPositions(tableSize), tableSize, "vacantPlayers"),
        chips: applyChipOffsets(getChipPositions(tableSize), tableSize),
        dealers: applyPositionOffsets(getDealerPositions(tableSize), tableSize, "dealers"),
        turnAnimations: applyPositionOffsets(getTurnAnimationPositions(tableSize), tableSize, "turnAnimations"),
        winAnimations: applyPositionOffsets(getWinAnimationPositions(tableSize), tableSize, "winAnimations")
    };
}

// ─── Viewport Scaling ────────────────────────────────────────────────

export type ViewportMode = "mobile-portrait" | "mobile-landscape" | "tablet" | "desktop";

export function getViewportMode(): ViewportMode {
    const width = window.innerWidth;
    const height = window.innerHeight;
    const isLandscape = width > height;

    if (width <= 414 && !isLandscape) return "mobile-portrait";
    if (width <= 926 && isLandscape) return "mobile-landscape";
    if (width <= 1024) return "tablet";
    return "desktop";
}

/**
 * Viewport parameters — PURE FUNCTIONAL.
 *
 * paddingH:      horizontal breathing room within the container (total, split left/right)
 * paddingV:      vertical breathing room within the container (total, split top/bottom)
 * footerOverlay: px height of any FIXED overlay footer that sits ON TOP of the container.
 *                Only mobile-landscape has this (80px fixed footer). All other viewports
 *                have the footer in normal flex flow, so the container already excludes it.
 *
 * Container dimensions are MEASURED from the actual parent div (via ref),
 * not guessed from window.innerHeight. This eliminates all header/footer guesswork.
 */
const VIEWPORT_PARAMS: Record<ViewportMode, {
    paddingH: number;
    paddingV: number;
    footerOverlay: number;
}> = {
    "desktop": {
        paddingH: 40,
        paddingV: 20,
        footerOverlay: 160      // footer is fixed overlay (160px) on desktop
    },
    "tablet": {
        paddingH: 40,
        paddingV: 20,
        footerOverlay: 160      // same as desktop
    },
    "mobile-landscape": {
        paddingH: 20,
        paddingV: 10,
        footerOverlay: 80       // mobile landscape footer is 80px
    },
    "mobile-portrait": {
        paddingH: 20,
        paddingV: 10,
        footerOverlay: 160      // footer is fixed overlay (160px) on portrait too
    }
};

const MIN_SCALE = 0.3;
const MAX_GLOBAL_SCALE = 2.0;

// ─── Auto-Fit: Dynamic Content Bounds ───────────────────────────────
//
// Calculates the bounding box from SEAT_COORDS for the current table size.
// Includes padding for player UI components that extend beyond seat points.
// 9-seat, 6-seat, and 2-seat tables all auto-fit correctly.

/**
 * Padding for player UI that extends beyond seat coordinate points.
 * x:      player component width extending left/right of outermost seats
 * top:    cards (80px) + component centering (70px) + margin above topmost seat
 * bottom: badge + stack + progress bar below bottommost seat
 */
const PLAYER_UI_PADDING = {
    x: 80,
    top: 160,
    bottom: 100
};

export interface ContentBounds {
    width: number;
    height: number;
    centerX: number;   // content center in stage coords (for pixel-based positioning)
    centerY: number;
}

/** Calculate the bounding box + center of all seat positions + player UI */
export function getContentBounds(tableSize: TableSize): ContentBounds {
    const coords = SEAT_COORDS[tableSize];
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    for (const [x, y] of coords) {
        minX = Math.min(minX, x);
        maxX = Math.max(maxX, x);
        minY = Math.min(minY, y);
        maxY = Math.max(maxY, y);
    }
    return {
        width: (maxX - minX) + PLAYER_UI_PADDING.x * 2,
        height: (maxY - minY) + PLAYER_UI_PADDING.top + PLAYER_UI_PADDING.bottom,
        // Center of the PADDED bounds (not just seats). Accounts for asymmetric
        // padding — more above (cards) than below (badges). Without this offset,
        // the top player cards get clipped by the header.
        centerX: (minX + maxX) / 2,
        centerY: ((minY - PLAYER_UI_PADDING.top) + (maxY + PLAYER_UI_PADDING.bottom)) / 2
    };
}

/**
 * Calculate zoom level to fit all content within the container.
 * containerWidth/Height come from the ACTUAL measured parent div (via ref).
 * footerOverlay is subtracted for mobile-landscape where the footer overlays the container.
 */
export function calculateZoom(
    tableSize: TableSize,
    containerWidth: number,
    containerHeight: number
): number {
    const mode = getViewportMode();
    const params = VIEWPORT_PARAMS[mode];
    const bounds = getContentBounds(tableSize);

    // Usable space = container minus any fixed overlay minus breathing room
    const usableWidth = containerWidth - params.paddingH;
    const usableHeight = containerHeight - params.footerOverlay - params.paddingV;

    const scaleByWidth = usableWidth / bounds.width;
    const scaleByHeight = usableHeight / bounds.height;
    const fitScale = Math.min(scaleByWidth, scaleByHeight);

    const result = Math.max(MIN_SCALE, Math.min(fitScale, MAX_GLOBAL_SCALE));

    // DEBUG: remove once positioning is dialled in
    console.log(`[zoom] mode=${mode} tableSize=${tableSize} container=${containerWidth}x${containerHeight} usable=${usableWidth.toFixed(0)}x${usableHeight.toFixed(0)} bounds=${bounds.width.toFixed(0)}x${bounds.height.toFixed(0)} scaleW=${scaleByWidth.toFixed(3)} scaleH=${scaleByHeight.toFixed(3)} → zoom=${result.toFixed(3)}`);

    return result;
}

/**
 * Build CSS transform — pixel-based, no percentages.
 * Centers the content within the measured container.
 * CSS wrapper must have: top:0; left:0; transform-origin: 0 0;
 */
export function getTableTransform(
    zoom: number,
    tableSize: TableSize,
    containerWidth: number,
    containerHeight: number
): string {
    const mode = getViewportMode();
    const params = VIEWPORT_PARAMS[mode];
    const bounds = getContentBounds(tableSize);

    // Center of the usable area within the container
    const usableCenterX = containerWidth / 2;
    const usableCenterY = (containerHeight - params.footerOverlay) / 2;

    // Content center after scaling (transform-origin: 0 0)
    const scaledCenterX = bounds.centerX * zoom;
    const scaledCenterY = bounds.centerY * zoom;

    // Translate so content center lands at usable area center
    const tx = usableCenterX - scaledCenterX;
    const ty = usableCenterY - scaledCenterY;

    console.log(`[transform] container=${containerWidth}x${containerHeight} usableCenter=${usableCenterX.toFixed(0)},${usableCenterY.toFixed(0)} tx=${tx.toFixed(1)} ty=${ty.toFixed(1)} zoom=${zoom.toFixed(3)}`);

    return `translate(${tx.toFixed(1)}px, ${ty.toFixed(1)}px) scale(${zoom})`;
}
