import * as utils from "src/utils/common";
import { Nonogram, CellState } from "src/nonogram/nonogram_types";
import { solveNonogramUsingLogic } from "src/nonogram/nonogram_solver";

/** This is not guaranteed to generate a solveable game. */
function generateRandomNonogram(size: number): Nonogram {
  const nonogram: Nonogram = { rowCounts: [], colCounts: [], cells: [] };

  function generateCellSectionSizes() {
    const numSections = utils.randInt(1, Math.ceil(size / 2));
    const sectionSizes: Array<number> = [];
    let spacesRemaining = size;

    for (let i = 0; i < numSections && spacesRemaining > 0; ++i) {
      const sectionSize = utils.randInt(1, spacesRemaining + 1);
      sectionSizes.push(sectionSize);
      spacesRemaining -= sectionSize;

      // Subtract an additional 1 because we need a space between sections
      spacesRemaining -= 1;
    }

    return sectionSizes;
  }

  for (let i = 0; i < size; ++i) {
    // TODO: generate nonograms that have some crossed out cells to start
    nonogram.cells.push(Array(size).fill(CellState.BLANK));
    nonogram.rowCounts.push(generateCellSectionSizes());
    nonogram.colCounts.push(generateCellSectionSizes());
  }

  return nonogram;
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
    return nonogram; // TODO: remove
  }
}
