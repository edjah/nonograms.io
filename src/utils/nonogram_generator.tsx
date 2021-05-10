import { Nonogram, CellState } from "src/utils/nonogram_types";
import { solveNonogramUsingLogic } from "src/utils/nonogram_solver";
import { colors } from "src/theme";
import * as utils from "src/utils/common";

/**
 * This will generate a solveable black and white nonogram, but it may not have a unique solution.
 * Additionally, it may generate a nonogram that requires guessing or very advanced techniques that
 * go beyond standard human abilities.
 */
export function generateRandomNonogram(size: number, fillProbability: number = 0.75): Nonogram {
  const solvedNonogramCells: Array<Array<CellState>> = [];
  for (let row = 0; row < size; ++row) {
    solvedNonogramCells.push([]);
    for (let col = 0; col < size; ++col) {
      solvedNonogramCells[row].push(
        Math.random() < fillProbability ? CellState.FILLED : CellState.CROSSED_OUT
      );
    }
  }

  const unsolvedNonogram: Nonogram = {
    id: utils.generateRandomBase62String(8),
    title: "Random Nonogram",
    rowCounts: [],
    colCounts: [],
    cells: [],
    solution: solvedNonogramCells,
    solutionColors: solvedNonogramCells.map((row) =>
      row.map((cellState) => (cellState === CellState.FILLED ? colors.gray : colors.white))
    ),
  };

  for (let i = 0; i < size; ++i) {
    const rowCounts: Array<number> = [];
    const colCounts: Array<number> = [];

    let rowStreak = 0;
    let colStreak = 0;

    for (let j = 0; j < size; ++j) {
      if (solvedNonogramCells[i][j] === CellState.FILLED) {
        rowStreak += 1;
      } else if (rowStreak > 0) {
        rowCounts.push(rowStreak);
        rowStreak = 0;
      }

      if (solvedNonogramCells[j][i] === CellState.FILLED) {
        colStreak += 1;
      } else if (colStreak > 0) {
        colCounts.push(colStreak);
        colStreak = 0;
      }
    }

    if (rowStreak > 0) {
      rowCounts.push(rowStreak);
    }
    if (colStreak > 0) {
      colCounts.push(colStreak);
    }

    // If we ended up generating a nonogram with a row or column that doesn't have any filled cells,
    // try again.
    if (rowCounts.length === 0 || colCounts.length === 0) {
      return generateRandomNonogram(size, fillProbability);
    }

    unsolvedNonogram.rowCounts.push(rowCounts);
    unsolvedNonogram.colCounts.push(colCounts);
    unsolvedNonogram.cells.push(Array(size).fill(CellState.BLANK));
  }

  return unsolvedNonogram;
}

/**
 * This will generate a nonogram that can be solved using standard logic. In other words,
 * a human would not have to guess or use very advanced logic in order to solve this nonogram.
 */
export function generateHumanSolveableNonogram(size: number): Nonogram {
  // TODO: if generation takes a long time, consider making this function async so that there are
  // some async gaps between attempts to generate a solevable nonogram.
  while (true) {
    const nonogram = generateRandomNonogram(size);
    const solution = solveNonogramUsingLogic(nonogram);
    if (solution) {
      return nonogram;
    }
  }
}
