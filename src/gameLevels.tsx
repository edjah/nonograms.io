type GameLevel = {
  id: string;
  title: string;
  secondaryTitle: string;
  difficulty: "easy" | "medium" | "hard" | "expert";
};

export const gameLevels: Array<GameLevel> = [
  { title: "Level 1", secondaryTitle: "Cactus", difficulty: "easy", id: "Bu8RJQdt" },
  { title: "Level 2", secondaryTitle: "Dog", difficulty: "easy", id: "I0lC6UIL" },
  { title: "Level 3", secondaryTitle: "Alien", difficulty: "medium", id: "wUfeTbQ4" },
  { title: "Level 4", secondaryTitle: "Earth", difficulty: "medium", id: "ogmEqSCX" },
  { title: "Level 5", secondaryTitle: "Ninja", difficulty: "medium", id: "hvXZfb7L" },
  { title: "Level 6", secondaryTitle: "Pikachu", difficulty: "hard", id: "MeVTzOby" },
  { title: "Level 7", secondaryTitle: "Among Us", difficulty: "hard", id: "r7OUUZl6" },
  // TODO: implement more levels
];
