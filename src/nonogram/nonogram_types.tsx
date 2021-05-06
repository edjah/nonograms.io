export enum CellState {
  FILLED = "filled",
  CROSSED_OUT = "crossedOut",
  BLANK = "blank",
}

type Color = string; // colors are hex strings (e.g. #aabbcc)

export type Nonogram = {
  rowCounts: Array<Array<number>>;
  colCounts: Array<Array<number>>;
  cells: Array<Array<CellState>>;
  solutionColors?: Array<Array<Color>>;
};

export type NonogramSolution = {
  cells: Array<Array<CellState>>;
};
