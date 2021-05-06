// TODO: figure out why I can't use absolute imports with ts-node
import path from "path";
import inquirer from "inquirer";
import admin from "firebase-admin";
import { uploadNonogramsToFirebase } from "./upload_nonograms_to_firebase";

const scripts = [
  uploadNonogramsToFirebase,
  // TODO: add more scripts
];

admin.initializeApp({
  credential: admin.credential.cert(path.join(__dirname, "credential.json")),
});

async function mainAsync() {
  const { script } = await inquirer.prompt([
    {
      type: "list",
      name: "script",
      message: "Which script would you like to run?",
      choices: scripts.map((f) => ({ name: f.name, value: f })),
    },
  ]);

  const output = await script();
  if (output !== undefined) {
    console.log(output);
  }
}

mainAsync();
