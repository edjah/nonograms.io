// TODO: also store the actual GameSessionState here and load it back
type LocalGameState = {
  status: "notStarted" | "inProgress" | "solved";
};

export function saveLocalGameState(boardId: string, state: LocalGameState) {
  localStorage.setItem(boardId, JSON.stringify(state));
}

export function getLocalGameState(boardId: string): LocalGameState | null {
  const state = localStorage.getItem(boardId);
  if (!state) {
    return null;
  }
  return JSON.parse(state);
}
