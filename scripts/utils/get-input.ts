import readline from 'node:readline'

export function getInput(promptText: string): Promise<string> {
  return new Promise((resolve) => {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    })
    rl.question(promptText, (input) => {
      rl.close()
      resolve(input)
    })
  })
}
