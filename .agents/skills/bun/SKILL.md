---
name: Bun
description: Use when building, running, testing, or bundling JavaScript/TypeScript applications. Reach for Bun when you need to execute scripts, manage dependencies, run tests, bundle code for production, or build HTTP servers with native performance.
metadata:
    mintlify-proj: bun
    version: "1.0"
---

# Bun Skill Reference

## Product Summary

Bun is an all-in-one JavaScript/TypeScript runtime and toolkit written in Zig. It ships as a single binary (`bun`) and includes four core components: a runtime (Node.js-compatible), package manager (npm-compatible), test runner (Jest-compatible), and bundler (esbuild-inspired). Use Bun to execute TypeScript/JSX directly without transpilation overhead, install packages 25x faster than npm, run tests with built-in snapshots and DOM support, and bundle code for browsers or servers.

**Key files and commands:**
- `bunfig.toml` — Bun configuration file (optional, zero-config by default)
- `bun run <script>` — Execute scripts from package.json or files
- `bun install` — Install dependencies (creates `bun.lock` lockfile)
- `bun test` — Run tests matching `*.test.ts`, `*.spec.ts` patterns
- `bun build <entry>` — Bundle TypeScript/JSX for browsers or servers
- `Bun.serve()` — Start an HTTP server with native routing

**Primary docs:** https://bun.com/docs

---

## When to Use

Reach for this skill when:

- **Running code**: Agent needs to execute TypeScript, JSX, or JavaScript files directly without Node.js setup
- **Package management**: Installing, adding, or updating npm packages in a project
- **Testing**: Writing or running unit tests with Jest-like syntax and Bun's test runner
- **Bundling**: Building production bundles for browsers or servers, or creating standalone executables
- **HTTP servers**: Building REST APIs or full-stack apps with `Bun.serve()`
- **Scripts**: Running build scripts, migrations, or automation tasks from `package.json`
- **Performance-critical work**: When startup time, memory usage, or install speed matters
- **TypeScript-first projects**: When you want native TypeScript support without separate transpilation

Do not use Bun for:
- Projects that require Node.js-specific APIs not yet implemented in Bun (check [compatibility page](/runtime/nodejs-compat))
- Environments where you cannot install a new binary (use Node.js instead)

---

## Quick Reference

### Essential Commands

| Task | Command |
|------|---------|
| Run a file | `bun run index.ts` |
| Run a script | `bun run dev` (from package.json) |
| Install all deps | `bun install` |
| Add a package | `bun add react` |
| Add dev dependency | `bun add -d @types/node` |
| Remove a package | `bun remove lodash` |
| Run tests | `bun test` |
| Run specific test | `bun test --test-name-pattern add` |
| Build for browser | `bun build ./src/index.ts --outdir ./dist` |
| Build for server | `bun build ./src/index.ts --target bun --outdir ./dist` |
| Watch mode | `bun build ./src/index.ts --watch` |
| Create new project | `bun init my-app` |
| Run global package | `bunx cowsay "Hello"` |

### File Conventions

| Pattern | Purpose |
|---------|---------|
| `*.test.ts`, `*.test.js` | Test files (auto-discovered) |
| `*.spec.ts`, `*.spec.js` | Test files (auto-discovered) |
| `bunfig.toml` | Bun configuration (optional) |
| `bun.lock` | Lockfile (text format, commit to version control) |
| `.env`, `.env.local` | Environment variables (auto-loaded) |
| `package.json` | Project metadata and scripts |
| `tsconfig.json` | TypeScript configuration (respected by Bun) |

### Configuration Sections in bunfig.toml

```toml
# Runtime behavior
preload = ["./setup.ts"]
jsx = "react"
logLevel = "debug"

# Package manager
[install]
optional = true
dev = true
linker = "hoisted"  # or "isolated"

# Test runner
[test]
root = "./__tests__"
coverage = true
coverageThreshold = 0.9

# HTTP server
[serve]
port = 3000
```

---

## Decision Guidance

### When to Use Hoisted vs. Isolated Linker

| Aspect | Hoisted | Isolated |
|--------|---------|----------|
| **Default for** | Single-package projects, existing projects | New workspaces/monorepos |
| **node_modules structure** | Flat, shared directory | Nested per-package with symlinks |
| **Phantom dependencies** | Allowed (can access undeclared deps) | Prevented (strict isolation) |
| **Compatibility** | Better with legacy code | Better for monorepos, pnpm users |
| **Use when** | Migrating from npm/yarn | Building new monorepos or strict projects |

### When to Bundle vs. Run Directly

| Scenario | Approach |
|----------|----------|
| **Development** | `bun run index.ts` (direct execution, fast reload) |
| **Production server** | `bun build --target bun --outdir dist` (optimized, single file) |
| **Browser/client code** | `bun build --target browser --outdir dist` (tree-shaken, minified) |
| **Standalone CLI** | `bun build --compile --outfile mycli` (executable binary) |
| **Library/npm package** | `bun build --format esm --outdir dist` (ESM output) |

### When to Use External vs. Bundle

| Situation | Decision |
|-----------|----------|
| **Large framework** (React, Vue) | Mark as `external` if already in browser/runtime |
| **Utility library** (lodash) | Bundle unless it's huge or shared across multiple bundles |
| **Native module** (.node, .wasm) | Mark as `external` |
| **Code splitting** | Use `splitting: true` for shared chunks across entrypoints |

---

## Workflow

### 1. Set Up a New Project

```bash
bun init my-app
cd my-app
```

This creates a minimal project with `index.ts`, `package.json`, and `tsconfig.json`. Choose a template (Blank, React, or Library).

### 2. Install Dependencies

```bash
bun install
# or add specific packages
bun add react
bun add -d typescript @types/react
```

Bun reads `package.json`, resolves dependencies, and writes `bun.lock`. Check `bun.lock` into version control.

### 3. Configure Bun (Optional)

Create `bunfig.toml` in the project root if you need custom behavior:

```toml
[install]
linker = "isolated"

[test]
coverage = true
coverageThreshold = 0.8

[serve]
port = 3000
```

### 4. Write Code

Create TypeScript/JSX files. Bun transpiles on the fly:

```typescript
// src/index.ts
import { serve } from "bun";

const server = Bun.serve({
  port: 3000,
  fetch(req) {
    return new Response("Hello, Bun!");
  },
});

console.log(`Listening on ${server.url}`);
```

### 5. Run During Development

```bash
bun run src/index.ts
# or add to package.json scripts
bun run dev
```

### 6. Write Tests

Create test files matching `*.test.ts` or `*.spec.ts`:

```typescript
import { test, expect } from "bun:test";

test("addition", () => {
  expect(1 + 1).toBe(2);
});
```

Run with `bun test` or `bun test --watch`.

### 7. Build for Production

```bash
# For browsers
bun build ./src/index.tsx --outdir ./dist --minify

# For servers
bun build ./src/server.ts --target bun --outdir ./dist

# As standalone executable
bun build ./src/cli.ts --compile --outfile ./mycli
```

### 8. Verify and Deploy

Check `dist/` output, test in target environment, then deploy. For CI/CD, use `bun ci` instead of `bun install` to enforce lockfile consistency.

---

## Common Gotchas

- **TypeScript errors on `Bun` global**: Install `@types/bun` as a dev dependency and add `"lib": ["ESNext"]` to `tsconfig.json`.
- **Lifecycle scripts disabled by default**: Bun doesn't run `postinstall` scripts for security. Add trusted packages to `trustedDependencies` in `package.json` if needed.
- **Auto-install can mask missing deps**: Set `[install] auto = "disable"` in `bunfig.toml` if you want strict dependency checking.
- **Bundler always bundles**: Unlike esbuild, Bun's bundler bundles by default. Use `Bun.Transpiler` if you need per-file transpilation without bundling.
- **Environment variables not inlined by default**: Use `env: "inline"` in `Bun.build()` or `--env inline` in CLI to inject `process.env` values into bundles.
- **Peer dependencies installed by default**: If you don't want them, use `bun install --omit peer`.
- **Lockfile format changed in v1.2**: Old `bun.lockb` (binary) is now `bun.lock` (text). Migrate with `bun install --save-text-lockfile`.
- **Node.js compatibility incomplete**: Check [nodejs-compat](/runtime/nodejs-compat) before assuming a Node.js API works. Some modules like `fs.watch` have limited support.
- **JSX requires tsconfig.json or bunfig.toml**: Bun reads JSX config from `tsconfig.json` `compilerOptions` or `bunfig.toml` `[jsx]` section.
- **Minification doesn't downlevel syntax**: Bun's minifier doesn't convert modern JavaScript to ES5. If you need ES5 output, use a different tool.

---

## Verification Checklist

Before submitting work with Bun:

- [ ] **Dependencies locked**: `bun.lock` is committed to version control
- [ ] **Tests pass**: `bun test` runs without failures
- [ ] **No TypeScript errors**: `bun run tsc --noEmit` (if using tsc) or check IDE
- [ ] **Build succeeds**: `bun build` completes without errors
- [ ] **Scripts work**: `bun run <script>` executes expected behavior
- [ ] **Environment variables set**: `.env` file exists with required vars, or CI/CD provides them
- [ ] **Lockfile consistent**: `bun.lock` matches `package.json` (no manual edits to lockfile)
- [ ] **No deprecated patterns**: Not using `bun.lockb`, not relying on unimplemented Node.js APIs
- [ ] **Bundler output correct**: Check `dist/` or output directory for expected files and sizes
- [ ] **Performance acceptable**: Startup time and bundle size meet project requirements

---

## Resources

**Comprehensive navigation**: https://bun.com/docs/llms.txt — Full page-by-page listing of all Bun documentation.

**Critical reference pages**:
1. [Runtime Overview](https://bun.com/docs/runtime) — Core runtime APIs, file I/O, HTTP server
2. [Package Manager](https://bun.com/docs/pm/cli/install) — Install, add, remove, workspaces, lockfile
3. [Bundler](https://bun.com/docs/bundler) — Build options, plugins, code splitting, executables
4. [Test Runner](https://bun.com/docs/test) — Writing tests, mocks, snapshots, coverage
5. [bunfig.toml Reference](https://bun.com/docs/runtime/bunfig) — All configuration options

---

> For additional documentation and navigation, see: https://bun.com/docs/llms.txt