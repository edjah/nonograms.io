import admin from "firebase-admin";

export async function uploadNonogramsToFirebase() {
  const boards = await admin.firestore().collection("nonogram-boards").get();
  for (const board of boards.docs) {
    console.log(board);
  }
  // TODO: actually add uploading
}
