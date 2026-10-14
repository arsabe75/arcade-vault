/* eslint-env node */
"use strict";

// PostToolUse hook: after Write/Edit/MultiEdit, run Prettier and ESLint --fix
// on the touched file.
// Exit 0 = silent success. Exit 1 = non-blocking warning (stderr shown). Exit 2 = block (never used).

const fs = require("fs");
const path = require("path");
const { execFileSync } = require("child_process");

const SKIP_DIRS = new Set(["node_modules", ".next", ".git", "out", "build"]);
const LOCK_FILES = new Set([
  "package-lock.json",
  "yarn.lock",
  "pnpm-lock.yaml",
  "bun.lockb",
]);
const ESLINT_EXT = /\.[cm]?[jt]sx?$/i; // .js .jsx .ts .tsx .mjs .cjs .mts .cts
const MAX_OUTPUT = 2000;

function warn(msg) {
  process.stderr.write("format-on-write: " + msg + "\n");
  process.exit(1);
}

function runNode(bin, args, cwd) {
  return execFileSync(process.execPath, [bin, ...args], {
    cwd,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
    windowsHide: true,
    maxBuffer: 10 * 1024 * 1024,
  });
}

function main(input) {
  let payload;
  try {
    // Strip a leading BOM (U+FEFF) if present before parsing.
    const clean = input.charCodeAt(0) === 0xfeff ? input.slice(1) : input;
    payload = JSON.parse(clean || "{}");
  } catch (err) {
    return warn("could not parse stdin JSON: " + err.message);
  }

  const filePath = payload.tool_input && payload.tool_input.file_path;
  if (!filePath) {
    return warn("no file_path in tool_input (tool: " + payload.tool_name + ")");
  }

  const root = process.env.CLAUDE_PROJECT_DIR || process.cwd();
  const abs = path.isAbsolute(filePath)
    ? path.normalize(filePath)
    : path.resolve(root, filePath);

  // Silent skips: missing/not-a-file, outside the project, vendor/build trees, lockfiles.
  let stat;
  try {
    stat = fs.statSync(abs);
  } catch {
    return;
  }
  if (!stat.isFile()) return;

  const relParts = path.relative(root, abs).split(path.sep);
  if (relParts[0] === ".." || relParts.some((p) => SKIP_DIRS.has(p))) return;
  if (LOCK_FILES.has(path.basename(abs))) return;

  // 1) Prettier: formats every file type it knows; --ignore-unknown skips the rest silently.
  const prettierBin = path.join(
    root,
    "node_modules",
    "prettier",
    "bin",
    "prettier.cjs",
  );
  if (fs.existsSync(prettierBin)) {
    try {
      runNode(
        prettierBin,
        ["--write", "--ignore-unknown", "--end-of-line", "auto", abs],
        root,
      );
    } catch (err) {
      const detail = String(
        (err.stdout || "") + (err.stderr || "") || err.message,
      )
        .trim()
        .slice(0, MAX_OUTPUT);
      return warn(
        "prettier failed on " + path.relative(root, abs) + ": " + detail,
      );
    }
  }

  // 2) ESLint --fix: JS/TS family only.
  if (!ESLINT_EXT.test(path.extname(abs))) return;
  const eslintBin = path.join(
    root,
    "node_modules",
    "eslint",
    "bin",
    "eslint.js",
  );
  if (!fs.existsSync(eslintBin)) return;
  try {
    runNode(eslintBin, ["--fix", abs], root);
  } catch (err) {
    // ESLint exits 1 when unfixable problems remain: surface them as a non-blocking warning.
    const detail = String(err.stdout || err.stderr || err.message)
      .trim()
      .slice(0, MAX_OUTPUT);
    warn(
      "eslint found problems it could not auto-fix in " +
        path.relative(root, abs) +
        ":\n" +
        detail,
    );
  }
}

let input = "";
process.stdin.setEncoding("utf8");
process.stdin.on("data", (chunk) => {
  input += chunk;
});
process.stdin.on("end", () => main(input));
process.stdin.on("error", () => warn("failed to read stdin"));
