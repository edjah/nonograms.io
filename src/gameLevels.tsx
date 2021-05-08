type GameLevel = {
  level: number;
  firebaseObjectId: string;
  difficulty: "easy" | "medium" | "hard" | "expert";
};

export const gameLevels: Array<GameLevel> = [
  { level: 1, firebaseObjectId: "EmFdVTkn", difficulty: "easy" },
  { level: 2, firebaseObjectId: "EmFdVTkn", difficulty: "medium" },
  { level: 3, firebaseObjectId: "EmFdVTkn", difficulty: "hard" },
  // TODO: implement more levels
];
