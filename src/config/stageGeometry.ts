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

/** How far dealer button sits from seat toward table center */
const DEALER_DISTANCE = 0.3;

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

/** Scaling parameters per viewport mode */
const VIEWPORT_PARAMS: Record<ViewportMode, {
    maxScale: number;
    paddingH: number;
    paddingV: number;
    translateY: string;
}> = {
    "desktop": {
        maxScale: 1.2,
        paddingH: 200,
        paddingV: 300,
        translateY: "-30%"
    },
    "tablet": {
        maxScale: 0.8,
        paddingH: 100,
        paddingV: 200,
        translateY: "-30%"
    },
    "mobile-landscape": {
        maxScale: 0.7,
        paddingH: 50,
        paddingV: 100,
        translateY: "-50%"
    },
    "mobile-portrait": {
        maxScale: 0.5,
        paddingH: 20,
        paddingV: 150,
        translateY: "-50%"
    }
};

const MIN_SCALE = 0.3;
const MAX_GLOBAL_SCALE = 2.0;

/** Calculate zoom level for the current viewport */
export function calculateZoom(): number {
    const mode = getViewportMode();
    const params = VIEWPORT_PARAMS[mode];

    const availableWidth = window.innerWidth - params.paddingH;
    const availableHeight = window.innerHeight - params.paddingV;

    const scaleByWidth = availableWidth / TABLE_WIDTH;
    const scaleByHeight = availableHeight / TABLE_HEIGHT;
    const fitScale = Math.min(scaleByWidth, scaleByHeight);

    let finalScale: number;

    if (mode === "desktop") {
        if (window.innerWidth > 1920) {
            finalScale = Math.min(fitScale, params.maxScale);
        } else if (window.innerWidth > 1440) {
            finalScale = Math.min(fitScale, 0.8);
        } else {
            finalScale = Math.max(Math.min(fitScale, 0.8), MIN_SCALE);
        }
    } else {
        finalScale = Math.min(fitScale, params.maxScale);
    }

    return Math.max(MIN_SCALE, Math.min(finalScale, MAX_GLOBAL_SCALE));
}

/** Build CSS transform string for the table wrapper */
export function getTableTransform(zoom: number): string {
    const mode = getViewportMode();
    const params = VIEWPORT_PARAMS[mode];
    return `translate(-50%, ${params.translateY}) scale(${zoom})`;
}
