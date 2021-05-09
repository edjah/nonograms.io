export enum CellState {
  FILLED = "filled",
  CROSSED_OUT = "crossedOut",
  BLANK = "blank",
}

export type Nonogram = {
  title: string;
  rowCounts: Array<Array<number>>;
  colCounts: Array<Array<number>>;
  cells: Array<Array<CellState>>;
  /** This only gets revealed after the nonogram is solved. */
  secondaryTitle?: string;
  /** If present, the colors will be filled in with a fancy animation after the board is solved. */
  solutionColors?: Array<Array<Color>>;
};

export type NonogramSolution = {
  cells: Array<Array<CellState>>;
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
  /** Percentage based mouse coords. Example: {x: 0.123, y: 0.992} */
  cursor: { x: number; y: number };
};

export type ChatMessage = {
  timestamp: TimestampMs;
  userId: UserId;
  message: string;
};

export type GameSessionState = {
  lastUpdatedTime: TimestampMs;
  users: Record<UserId, GameSessionUserState>;
  gameState: {
    nonogram: Nonogram;
    actionLog: Array<CellUpdateAction>;
    numAppliedActionsInLog: number;
  };
  chatLog: Array<ChatMessage>;
};
