# Contributing to tailwind-theme-sweep

First off — thanks for taking the time to contribute. This is a small but focused tool and every improvement matters.

## Before you open a PR

- Check existing [issues](https://github.com/Taofik01/tailwind-theme-sweep/issues) to avoid duplicate work
- For significant changes, open an issue first to discuss the approach before writing code
- Keep PRs focused — one change per PR where possible

## What we're looking for

### High priority contributions
- Support for `cn()`, `clsx()`, and `cva()` call expressions
- Watch mode for incremental sweeps during development
- Config file validation with clear error messages
- Test cases with fixture codebases

### Good first issues
- Improving error messages
- Adding more examples to the README
- Edge cases in template literal handling
- Documentation improvements

## Setup

```bash
git clone https://github.com/Taofik01/tailwind-theme-sweep.git
cd tailwind-theme-sweep
npm install
```

## Running the tool locally

```bash
# Dry run against a test project
node sweep.js --dry-run --src ./test-fixtures

# With a custom color map
node sweep.js --config ./color-map.example.json --dry-run
```

## Code style

- Plain JavaScript — no TypeScript for the CLI itself (ironic, we know)
- Clear variable names over clever one-liners
- Comment anything non-obvious, especially AST traversal logic
- Keep the deny list configurable — don't hardcode opinions

## Submitting a PR

1. Fork the repo
2. Create a branch: `git checkout -b feat/your-feature-name`
3. Make your changes
4. Test manually with `--dry-run` on a real project
5. Commit with a clear message: `feat: add clsx support` or `fix: handle nested template literals`
6. Push and open a PR against `main`

## PR checklist

- [ ] Tested with `--dry-run` on a real React/TypeScript codebase
- [ ] No breaking changes to existing CLI flags
- [ ] README updated if new flags or behavior added
- [ ] Commit message is clear and descriptive

## Reporting bugs

Open an issue with:
- Node.js version
- Command you ran
- Expected vs actual output
- A minimal reproduction if possible

## Questions

Open an issue or reach out on X: [@TaofikSulaimon](https://x.com/TaofikSulaimon)

---

Built by [Sulaimon Taofik](https://taofik.vercel.app) — raid.dev