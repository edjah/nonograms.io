import { colors } from "src/theme";
import * as utils from "src/utils/common";
import { fruits } from "src/utils/fake_data";
import { useRef } from "react";

export type User = {
  id: UserId;
  color: Color;
  name: string;
};

export function useOfflineUser(): User {
  const userRef = useRef<User | null>(null);
  if (userRef.current) {
    return userRef.current;
  }

  const userJson = localStorage.getItem("offlineUser");
  if (userJson) {
    userRef.current = JSON.parse(userJson);
    return userRef.current!;
  }

  const user: User = {
    id: utils.generateRandomBase62String(8),
    color: utils.randomChoice(Object.values(utils.omit(colors, ["black", "white", "gray"]))),
    name: "Anonymous " + utils.randomChoice(fruits),
  };
  localStorage.setItem("offlineUser", JSON.stringify(user));
  userRef.current = user;
  return userRef.current;
}
