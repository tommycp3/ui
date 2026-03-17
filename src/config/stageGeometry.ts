/**
 * Stage Geometry Engine
 *
 * Calculates all table layout positions from the spec's stadium-intersection model.
 * Replaces ~1700 lines of hardcoded position arrays with calculated positions.
 *
 * Coordinate system:
 * - Spec uses a 1600x850 "stage" with table centered at (800, 535)
 * - The 900x450 table div starts at stage (350, 310)
 * - Positions output here are relative to the 900x450 table div
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
export const TABLE_SURFACE_HEIGHT = 350; // The oval surface div inside the table div
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

// ─── Position Generators ─────────────────────────────────────────────

export type TableSize = 2 | 6 | 9;

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
        const dist = Math.sqrt(dx * dx + dy * dy);

        // Move 40% of the way from seat toward center
        const chipStageX = sx + dx * 0.4;
        const chipStageY = sy + dy * 0.4;

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

        // Move 30% from seat toward center
        const dealerX = sx + dx * 0.3;
        const dealerY = sy + dy * 0.3;

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
        return stageToPosition(sx, sy + 80);
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

// ─── All Positions Bundle ────────────────────────────────────────────

export interface PositionArrays {
    players: Position[];
    vacantPlayers: Position[];
    chips: ChipPosition[];
    dealers: Position[];
    turnAnimations: Position[];
    winAnimations: Position[];
}

/** Get all position arrays for a given table size */
export function getAllPositions(tableSize: TableSize): PositionArrays {
    return {
        players: getSeatPositions(tableSize),
        vacantPlayers: getVacantPositions(tableSize),
        chips: getChipPositions(tableSize),
        dealers: getDealerPositions(tableSize),
        turnAnimations: getTurnAnimationPositions(tableSize),
        winAnimations: getWinAnimationPositions(tableSize)
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
