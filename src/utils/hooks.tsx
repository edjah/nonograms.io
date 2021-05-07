import { generateRandomHexString } from "src/utils/common";

export function useUserId() {
  let userId = localStorage.getItem("userId");
  if (!userId) {
    userId = generateRandomHexString(32);
    localStorage.setItem("userId", userId);
  }
  return userId;
}
