import { createWriteStream, rename, rm } from "node:fs/promises";
import { spawn } from "node:child_process";
import { Readable } from "node:stream";
import { pipeline } from "node:stream/promises";

const projectId = process.env.SUPABASE_PROJECT_ID;
if (!projectId) {
  console.error("Set SUPABASE_PROJECT_ID to the Supabase project ref before generating types.");
  process.exit(1);
}

const cli = process.platform === "win32" ? "supabase.exe" : "supabase";
const child = spawn(cli, ["gen", "types", "--lang", "typescript", "--project-id", projectId, "--schema", "public"], { stdio: ["ignore", "pipe", "inherit"] });
const temporaryOutput = "src/lib/supabase/database.types.ts.tmp";
try {
  const [exitCode] = await Promise.all([
    new Promise((resolve) => child.on("close", resolve)),
    pipeline(Readable.from(child.stdout), createWriteStream(temporaryOutput)),
  ]);
  if (exitCode !== 0) throw new Error(`Supabase CLI exited with code ${exitCode}.`);
  await rename(temporaryOutput, "src/lib/supabase/database.types.ts");
} catch (error) {
  await rm(temporaryOutput, { force: true });
  throw error;
}
