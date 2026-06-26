import { readFileSync } from "fs";

/**
 * Load KEY=VALUE pairs from a .env.local file into process.env.
 * Existing env vars win (`??=`); a missing file is ignored (rely on real env).
 * Trailing ` # comments` are stripped from values.
 */
export function loadEnvLocal(envPath: string): void {
  try {
    for (const line of readFileSync(envPath, "utf8").split("\n")) {
      const m = line.match(/^([^#=\s][^=]*)=(.*)$/);
      if (m) process.env[m[1]!.trim()] ??= m[2]!.trim().replace(/\s+#.*$/, "");
    }
  } catch {
    // rely on actual env vars if .env.local not present
  }
}
