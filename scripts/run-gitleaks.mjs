/**
 * run-gitleaks — graceful wrapper around the gitleaks CLI.
 *
 * Why a wrapper:
 *   - gitleaks is a Go binary that is NOT bundled with npm/pnpm. Developers
 *     install it once via Homebrew / a release download / `apt`, and CI
 *     installs it via the gitleaks/gitleaks-action step.
 *   - If a developer does not have gitleaks on PATH yet, the local gate
 *     should not block their work — but the script must still make it
 *     OBVIOUS that gitleaks did not actually run (otherwise a missing
 *     binary would silently bypass the check).
 *
 * Behavior:
 *   - If gitleaks is on PATH: run `gitleaks detect --config .gitleaks.toml
 *     --no-banner --redact --source .` and exit with the binary's exit code.
 *     Any finding (exit 1) fails the build, exactly like the custom regex
 *     guards do.
 *   - If gitleaks is NOT on PATH: log GITLEAKS_BINARY_NOT_INSTALLED with
 *     installation instructions, and exit 0. CI installs gitleaks before
 *     running this script, so a missing binary is a developer-only state.
 *
 * Custom guards stay in place — see .gitleaks.toml header for the split.
 */
import { execSync, spawnSync } from "node:child_process";

const isWindows = process.platform === "win32";

function hasBinary(name) {
  try {
    execSync(`${isWindows ? "where" : "which"} ${name}`, {
      stdio: ["ignore", "pipe", "pipe"],
    });
    return true;
  } catch {
    return false;
  }
}

if (!hasBinary("gitleaks")) {
  console.log("GITLEAKS_BINARY_NOT_INSTALLED");
  console.log(
    "gitleaks is not on PATH — local gate skipped (CI installs it via the gitleaks/gitleaks-action step).",
  );
  console.log("Install locally:");
  console.log("  macOS:   brew install gitleaks");
  console.log("  Linux:   https://github.com/gitleaks/gitleaks/releases");
  console.log("  Windows: scoop install gitleaks   (or choco install gitleaks)");
  console.log(
    "The PlatformaX-specific secret guards (check-secret-scan.mjs, check-local-secret-scan.mjs, check-env-safety.mjs) still run from rules:check / pre-push.",
  );
  process.exit(0);
}

const result = spawnSync(
  "gitleaks",
  [
    "detect",
    "--config",
    ".gitleaks.toml",
    "--no-banner",
    "--redact",
    "--source",
    ".",
  ],
  { stdio: "inherit" },
);

if (result.status === 0) {
  console.log("GITLEAKS_PASS");
  process.exit(0);
}
console.error(`GITLEAKS_FAIL (exit ${result.status})`);
process.exit(result.status ?? 1);
