export enum CellState {
  FILLED = "filled",
  CROSSED_OUT = "crossedOut",
  BLANK = "blank",
}

export type Nonogram = {
  rowCounts: Array<Array<number>>;
  colCounts: Array<Array<number>>;
  cells: Array<Array<CellState>>;
};

export type NonogramSolution = {
  cells: Array<Array<CellState>>;
};
