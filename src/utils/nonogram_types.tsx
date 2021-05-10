export enum CellState {
  FILLED = "filled",
  CROSSED_OUT = "crossedOut",
  BLANK = "blank",
}

export type Nonogram = {
  id: string;
  title: string;
  /** This only gets revealed after the nonogram is solved. */
  secondaryTitle?: string;
  rowCounts: Array<Array<number>>;
  colCounts: Array<Array<number>>;
  cells: Array<Array<CellState>>;
  // NOTE: having a single "solution" field assumes that the nonogram has a unique solution.
  // TODO: Write a script to verify that this is true for all boards on the site.
  solution: Array<Array<CellState>>;
  /** These colors will be filled in with a fancy animation after the board is solved. */
  solutionColors: Array<Array<Color>>;
  nextBoardId?: string;
};

export type NonogramSolution = {
  cells: Array<Array<CellState>>;
};

export type SolutionCorrectnessStatus = {
  isSolved: boolean;
  isNotCompleteBecauseHasMistakes: boolean;
  numMistakes: number;
  numFilledCells: number;
  totalNumCellsToFill: number;
};

export type CellUpdateAction = {
  originalCellState: CellState;
  updatedCellState: CellState;
  startRow: number;
  startCol: number;
  affectedCells: Array<{ row: number; col: number }>;
  dragDirection: "vertical" | "horizontal" | null;
};

export type GameSessionUserState = {
  name: string;
  color: Color;
  lastActiveTime: TimestampMs;
};

export type ChatMessage = {
  timestamp: TimestampMs;
  userId: UserId;
  message: string;
};

export type GameSessionState = {
  boardId: string;
  lastUpdatedTime: TimestampMs;
  users: Record<UserId, GameSessionUserState>;
  gameState: {
    nonogram: Nonogram;
    actionLog: Array<CellUpdateAction>;
    numAppliedActionsInLog: number;
  };
  chatLog: Array<ChatMessage>;
};

/**
 * Map from UserId -> Percentage based mouse coords. Example: {x: 0.123, y: 0.992}.
 * Note that even though these are technically part of the GameSessionState, since they change
 * so frequently, we store the React state associated with them outside of the main GameSessionState
 * to minimize the performance impact.
 */
export type UserCursorPositions = Record<UserId, { x: number; y: number }>;
