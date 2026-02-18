/**
 * Prompt user for y/N confirmation (TTY only).
 * @param header - Prompt text
 * @returns true if y/yes, false otherwise or if non-TTY
 */
export async function promptYesNo(header: string): Promise<boolean> {
  if (!process.stdin.isTTY) return false;
  const readline = await import("node:readline/promises");
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  try {
    const ans = await rl.question(header + "\nProceed? (y/N) ");
    return ans.trim().toLowerCase() === "y" || ans.trim().toLowerCase() === "yes";
  } finally {
    rl.close();
  }
}

export interface PromptConfirmOptions {
  yes?: boolean;
}

/**
 * Show plan as JSON and prompt for confirmation.
 * @param plan - Plan object to display
 * @param question - Confirmation question
 * @param options - yes to skip prompt (when --yes)
 * @returns true if confirmed or --yes, false if non-TTY or declined
 */
export async function promptConfirmWithPlan(
  plan: unknown,
  question: string,
  options: PromptConfirmOptions
): Promise<boolean> {
  if (options.yes && process.stdin.isTTY) return true;
  if (options.yes && !process.stdin.isTTY) return true;
  if (!process.stdin.isTTY) return false;

  console.log(JSON.stringify({ plan }, null, 2));
  const readline = await import("node:readline/promises");
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  try {
    const ans = await rl.question(question + " ");
    return ans.trim().toLowerCase() === "y" || ans.trim().toLowerCase() === "yes";
  } finally {
    rl.close();
  }
}
