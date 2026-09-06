import { spawn } from "node:child_process";
import { readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const files = readdirSync(join(root, "src/lib"))
  .filter((name) => name.endsWith(".test.ts"))
  .map((name) => join("src/lib", name));

const child = spawn("npx", ["tsx", "--test", ...files], {
  cwd: root,
  stdio: "inherit",
});

child.on("exit", (code) => {
  process.exit(code ?? 1);
});
