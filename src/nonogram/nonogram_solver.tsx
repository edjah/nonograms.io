import { CellState, Nonogram, NonogramSolution } from "src/nonogram/nonogram_types";
import * as utils from "src/utils/common";

// This is a collection of functions that take in a nonogram by reference, mutate it to fill in the
// blank cell values that it knows to be correct, and returns the number of cells filled in by the
// rule.
const nonogramSolvingRules: Array<(nonogram: Nonogram) => number> = [
  function rule1(nonogram) {
    // TODO: implement
    return 0;
  },

  function rule2(nonogram) {
    return 0;
  },
];

export function solveNonogramUsingLogic(nonogram: Nonogram): NonogramSolution | null {
  const workingCopy = utils.deepClone(nonogram);
  let numBlankCells = 0;
  for (const row of workingCopy.cells) {
    for (const cellState of row) {
      numBlankCells += Number(cellState === CellState.BLANK);
    }
  }

  // The solving process involves going through our collection of rules multiple times and
  // incrementally updating the nonogram solution until we're done.
  let lastNumBlankCells = numBlankCells;
  while (numBlankCells > 0) {
    for (const solvingRule of nonogramSolvingRules) {
      const numCellsFilledIn = solvingRule(workingCopy);
      numBlankCells -= numCellsFilledIn;
    }

    // If none of the rules we had made any progress on the nonogram, we give up and consider the
    // nonogram to be unsolveable (at least by the using the ruleset we have defined so far).
    if (numBlankCells === lastNumBlankCells) {
      return null;
    }
    lastNumBlankCells = numBlankCells;
  }

  for (const row of workingCopy.cells) {
    for (const cellState of row) {
      utils.assert(cellState === CellState.FILLED || cellState === CellState.CROSSED_OUT);
    }
  }
  return { cells: workingCopy.cells };
}

// TODO: implement a "solveNonogramUsingBacktracking" function that will simply return whether a
// nonogram CAN be solved or not. This function would not make any statements about whether
// guessing or very advanced solving logic would be required.
