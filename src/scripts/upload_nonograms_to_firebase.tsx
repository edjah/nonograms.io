import fs from "fs";
import path from "path";
import admin from "firebase-admin";
import { Nonogram } from "src/utils/nonogram_types";

export async function uploadNonogramsToFirebase() {
  const data = fs.readFileSync(path.join(__dirname, "nonogramDefinitions.json"));
  const nonograms: Array<Nonogram> = JSON.parse(data.toString("utf8"));
  for (const nonogram of nonograms) {
    await admin
      .firestore()
      .collection("nonogram-boards")
      .doc(nonogram.id)
      .set({
        boardJson: JSON.stringify(nonogram),
        created: new Date(),
        creatorId: "system",
        title: nonogram.title,
        secondaryTitle: nonogram.secondaryTitle,
      });
  }
}
