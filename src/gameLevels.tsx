type GameLevel = {
  level: number;
  firebaseObjectId: string;
  difficulty: "easy" | "medium" | "hard" | "expert";
};

export const gameLevels: Array<GameLevel> = [
  { level: 1, firebaseObjectId: "EmFdVTknkvhmG7M0tGWs", difficulty: "easy" },
  { level: 2, firebaseObjectId: "EmFdVTknkvhmG7M0tGWs", difficulty: "medium" },
  { level: 3, firebaseObjectId: "EmFdVTknkvhmG7M0tGWs", difficulty: "hard" },
  // TODO: implement more levels
];
