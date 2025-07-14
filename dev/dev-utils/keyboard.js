import { sendKeys } from "../node_modules/@web/test-runner-commands"

export async function repeatKeys(command, iterations = 1) {
  if (!command) return
  for (let i = 0; i < iterations; i++) {
    await sendKeys(command);
  }
}
