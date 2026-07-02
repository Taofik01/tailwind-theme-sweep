#!/usr/bin/env node

/**
 * tailwind-theme-sweep
 * Automates Tailwind CSS class replacement across large React/TypeScript codebases.
 * Uses ts-morph to parse and modify the TypeScript AST safely.
 *
 * Usage:
 *   node sweep.js                        # Run with default color-map.json
 *   node sweep.js --dry-run              # Preview changes without writing
 *   node sweep.js --config my-map.json   # Use a custom color map
 *   node sweep.js --src ./src            # Custom source directory
 *   node sweep.js --ext tsx,ts,jsx,js    # Custom file extensions
 */

const { Project, SyntaxKind } = require("ts-morph");
const path = require("path");
const fs = require("fs");

// ─── CLI ARGUMENT PARSING ────────────────────────────────────────────────────

const args = process.argv.slice(2);

const getArg = (flag) => {
  const idx = args.indexOf(flag);
  return idx !== -1 ? args[idx + 1] : null;
};

const isDryRun = args.includes("--dry-run");
const configPath = getArg("--config") || path.resolve(__dirname, "color-map.json");
const srcDir = getArg("--src") || "./src";
const extensions = (getArg("--ext") || "ts,tsx").split(",").map((e) => e.trim());

// ─── LOAD COLOR MAP ──────────────────────────────────────────────────────────

if (!fs.existsSync(configPath)) {
  console.error(`[error] Color map not found: ${configPath}`);
  console.error(`Create a color-map.json file. See color-map.example.json for reference.`);
  process.exit(1);
}

const COLOR_MAP = JSON.parse(fs.readFileSync(configPath, "utf-8"));

// ─── DENY LIST ───────────────────────────────────────────────────────────────
// Classes containing these substrings will be skipped to avoid replacing
// intentional semantic or status colors.

const DENY_SUBSTRINGS = [
  "red-", "green-", "blue-", "emerald-", "amber-",
  "yellow-", "orange-", "purple-", "indigo-", "cyan-",
  "gradient", "getStatusColor", "statusColor", "severityMap",
];

function isDenied(className) {
  return DENY_SUBSTRINGS.some((s) => className.includes(s));
}

// ─── REPLACE CLASSES IN A STRING ─────────────────────────────────────────────

function replaceClasses(rawValue) {
  const classes = rawValue.split(/\s+/).filter(Boolean);
  let changed = false;
  const result = classes.map((cls) => {
    if (isDenied(cls)) return cls;
    // Handle responsive/state prefixes: e.g. dark:bg-gray-900, hover:bg-gray-800, md:text-white
    const prefixMatch = cls.match(/^(.*?:)?(.+)$/);
    const prefix = prefixMatch[1] || "";
    const base = prefixMatch[2];
    if (COLOR_MAP[base]) {
      changed = true;
      return `${prefix}${COLOR_MAP[base]}`;
    }
    return cls;
  });
  return { value: result.join(" "), changed };
}

// ─── PROCESS STRING LITERAL NODE ─────────────────────────────────────────────

function processStringNode(node, report) {
  const raw = node.getLiteralValue();
  const { value, changed } = replaceClasses(raw);
  if (changed) {
    report.push({ before: raw, after: value });
    if (!isDryRun) node.setLiteralValue(value);
  }
}

// ─── MAIN ────────────────────────────────────────────────────────────────────

console.log(`\n🧹 tailwind-theme-sweep`);
console.log(`   Mode     : ${isDryRun ? "DRY RUN (no files will be written)" : "LIVE"}`);
console.log(`   Source   : ${srcDir}`);
console.log(`   Config   : ${configPath}`);
console.log(`   Patterns : ${extensions.map((e) => `**/*.${e}`).join(", ")}`);
console.log(`   Mappings : ${Object.keys(COLOR_MAP).length} entries\n`);

const tsConfigPath = path.resolve(process.cwd(), "tsconfig.json");
const projectOptions = fs.existsSync(tsConfigPath)
  ? { tsConfigFilePath: tsConfigPath }
  : { compilerOptions: { allowJs: true } };

const project = new Project(projectOptions);
const patterns = extensions.map((e) => `${srcDir}/**/*.${e}`);
project.addSourceFilesFromTsConfig?.(tsConfigPath);
patterns.forEach((p) => project.addSourceFilesAtPaths(p));

const sourceFiles = project.getSourceFiles();

let totalFiles = 0;
let totalNodes = 0;
const fileReports = [];

for (const sourceFile of sourceFiles) {
  const filePath = sourceFile.getFilePath();
  const fileReport = [];

  const jsxAttributes = sourceFile.getDescendantsOfKind(SyntaxKind.JsxAttribute);

  for (const attr of jsxAttributes) {
    if (attr.getNameNode().getText() !== "className") continue;

    const initializer = attr.getInitializer();
    if (!initializer) continue;

    const kind = initializer.getKind();

    // Handle: className="bg-gray-900 text-white"
    if (kind === SyntaxKind.StringLiteral) {
      processStringNode(initializer, fileReport);
    }

    // Handle: className={"bg-gray-900 text-white"}
    if (kind === SyntaxKind.JsxExpression) {
      const expr = initializer.getExpression();
      if (!expr) continue;

      if (expr.getKind() === SyntaxKind.StringLiteral) {
        processStringNode(expr, fileReport);
      }

      // Handle: className={`bg-gray-900 ${condition ? "text-white" : "text-gray-300"}`}
      if (expr.getKind() === SyntaxKind.TemplateExpression) {
        expr.getDescendantsOfKind(SyntaxKind.StringLiteral).forEach((n) =>
          processStringNode(n, fileReport)
        );
        expr.getDescendantsOfKind(SyntaxKind.NoSubstitutionTemplateLiteral).forEach((n) => {
          const raw = n.getLiteralValue();
          const { value, changed } = replaceClasses(raw);
          if (changed) {
            fileReport.push({ before: raw, after: value });
            if (!isDryRun) n.replaceWithText(`\`${value}\``);
          }
        });
      }
    }
  }

  if (fileReport.length > 0) {
    totalFiles++;
    totalNodes += fileReport.length;
    fileReports.push({ file: filePath, changes: fileReport });
  }
}

if (!isDryRun) {
  project.saveSync();
}

// ─── REPORT ──────────────────────────────────────────────────────────────────

console.log(`─────────────────────────────────────────`);
if (fileReports.length === 0) {
  console.log(`No changes needed. Your codebase is already using the target classes.`);
} else {
  for (const { file, changes } of fileReports) {
    console.log(`\n ${path.relative(process.cwd(), file)}`);
    for (const { before, after } of changes) {
      console.log(`   - "${before}"`);
      console.log(`   + "${after}"`);
    }
  }
  console.log(`\n─────────────────────────────────────────`);
  console.log(`${isDryRun ? "DRY RUN — no files written" : "Sweep complete"}`);
  console.log(`   Files modified : ${totalFiles}`);
  console.log(`   Nodes updated  : ${totalNodes}`);
  if (!isDryRun) {
    console.log(`\n⚠️  Review the diff carefully before committing.`);
    console.log(`   Recommended: git diff && git add -p`);
  }
}