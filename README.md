# tailwind-theme-sweep

A Node.js CLI tool that automates Tailwind CSS class replacement across large React and TypeScript codebases using AST-level parsing via [ts-morph](https://ts-morph.com/).

Built out of necessity: tasked with migrating a 150+ file React codebase from hardcoded Tailwind color classes to a new design system. Doing it manually would have taken days. This script did 80% of the work in seconds.

---

## Why AST and not find-and-replace?

Simple find-and-replace breaks things. It matches text blindly — inside comments, strings, variable names, anywhere.

ts-morph parses your TypeScript/JSX as an AST (Abstract Syntax Tree). It understands the structure of your code, so it only touches `className` attributes — exactly where Tailwind classes live. Nothing else is touched.

---

## What it handles

- `className="bg-gray-900 text-white"` — static string classNames
- `className={"bg-gray-900 text-white"}` — JSX expression strings
- `` className={`bg-gray-900 ${condition}`} `` — template literals
- Responsive and state prefixes: `dark:bg-gray-900`, `hover:text-white`, `md:bg-gray-800`
- Skips semantic/status colors automatically (red, green, blue, emerald, etc.)
- Dry-run mode to preview all changes before writing anything

---

## Installation

```bash
git clone https://github.com/Taofik01/tailwind-theme-sweep
cd tailwind-theme-sweep
npm install
```

---

## Setup

### 1. Create your color map

Copy the example and edit it to match your migration:

```bash
cp color-map.example.json color-map.json
```

`color-map.json` maps **old class → new class**:

```json
{
  "bg-gray-900": "bg-surface",
  "bg-gray-800": "bg-surface-elevated",
  "text-white": "text-primary",
  "text-gray-300": "text-secondary",
  "border-gray-800": "border-default"
}
```

Any class not in the map is left untouched.

### 2. Run a dry run first

Always preview before writing:

```bash
node sweep.js --dry-run
```

This shows every change that would be made without touching any files.

### 3. Run the sweep

```bash
node sweep.js
```

### 4. Review the diff

```bash
git diff
```

Commit what looks good. Fix the edge cases manually.

---

## CLI Options

| Flag | Default | Description |
|------|---------|-------------|
| `--dry-run` | false | Preview changes without writing files |
| `--config <path>` | `./color-map.json` | Path to your color map JSON |
| `--src <path>` | `./src` | Source directory to scan |
| `--ext <exts>` | `ts,tsx` | Comma-separated file extensions |

### Examples

```bash
# Dry run with default config
node sweep.js --dry-run

# Use a custom color map
node sweep.js --config ./my-theme-map.json

# Scan a different directory
node sweep.js --src ./components

# Include JS files
node sweep.js --ext ts,tsx,js,jsx

# Combine flags
node sweep.js --dry-run --config ./my-map.json --src ./src --ext ts,tsx
```

---

## Output

```
 tailwind-theme-sweep
   Mode     : DRY RUN (no files will be written)
   Source   : ./src
   Config   : ./color-map.json
   Patterns : **/*.ts, **/*.tsx
   Mappings : 12 entries

─────────────────────────────────────────

 src/components/Dashboard.tsx
   - "bg-gray-900 text-white border-gray-800"
   + "bg-surface text-primary border-default"

 src/components/Sidebar.tsx
   - "bg-gray-800 text-gray-300"
   + "bg-surface-elevated text-secondary"

─────────────────────────────────────────
 DRY RUN — no files written
   Files modified : 2
   Nodes updated  : 4
```

---

## Limitations

- Does not handle dynamic class generation (e.g. computed class names from variables)
- Does not process `cn()`, `clsx()`, or `cva()` call arguments yet — manual review needed for those
- Template literal handling covers simple cases; complex nested expressions may need manual touch

These edge cases are intentional — the script handles the bulk (typically 80%+) and flags the rest for human review.

---

## Recommended workflow

```bash
# 1. Stash or commit your current work
git add . && git commit -m "chore: before theme sweep"

# 2. Dry run to preview
node sweep.js --dry-run

# 3. Run the sweep
node sweep.js

# 4. Review changes
git diff

# 5. Stage selectively
git add -p

# 6. Commit
git commit -m "chore: automated theme class migration"
```

---

## Contributing

PRs welcome. Especially interested in:
- Support for `cn()` / `clsx()` / `cva()` call expressions
- Watch mode for incremental sweeps during development
- Config file validation and better error messages

---

## Author

**Sulaimon Taofik** — [taofik.vercel.app](https://taofik.vercel.app) · [GitHub](https://github.com/Taofik01) · [LinkedIn](https://linkedin.com/in/sulaimontaofik)

Built while migrating a 150+ file React codebase. Reduced manual theme migration work by 80%.

---

## License

MIT