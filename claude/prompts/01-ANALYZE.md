# Step 1: Codebase & Context Analysis

Analyze the project structure, read integration files, and extract metadata that will guide demo generation.

---

## 1. Detect Project Metadata

Run automated project detection:

```bash
node scripts/detect-project.js .
```

Expected output (captured into context):
- `name` — project name
- `language` — primary language (JavaScript, Python, Go, etc.)
- `framework` — detected framework (React, Vue, Express, FastAPI, etc.)
- `dependencies` — top dependencies list
- `entryPoint` — main file or package.json entry field
- `projectType` — inferred type (web-app, cli-tool, library, api, desktop-app, plugin)

If the script doesn't exist, manually inspect `package.json`, `Cargo.toml`, `pyproject.toml`, or equivalent and extract:
- Project name
- Main dependencies
- `scripts.start` command (if web app)
- Entry point

---

## 2. Read Case Study Integration (if exists)

If `.case-study/events.json` exists:

```bash
cat .case-study/events.json
```

Extract and store in context:
- **keyReflections** — developer's own words about what was hard, surprising, or elegant
- **decisions** — major architectural or design choices
- **buildNarrative** — the "why" behind the project

These will be used in the script to add authenticity (developer's own story).

---

## 3. Read Git Launcher Integration (if exists)

If `git-launch/README.md` exists:

```bash
cat git-launch/README.md
```

Extract:
- Product description (opening paragraph)
- Features list (bullet points)
- Any problem statement or use cases

---

If `git-launch/ARCHITECTURE.md` exists:

```bash
cat git-launch/ARCHITECTURE.md
```

Extract:
- System components overview
- Key abstractions or patterns
- Data flow diagram description (if present)

Store all as **systemArchitecture** in context.

---

## 4. Read Commit History

```bash
git log --oneline -30
```

Extract:
- Most recent commits (last 5-10) → understand what was just shipped
- Frequency of commits → stability signal
- Commit messages → feature themes

Store as **commitHistory** in context.

---

## 5. Detect Project Type & Start Info

Based on metadata, determine:

**If web-app:**
- Detect `scripts.start` from `package.json` (or equivalent build config)
- Detect port from start command (e.g., 3000, 8080, 5173)
- Detect if it's a frontend-only app (SPA) or full-stack

**If CLI tool:**
- Detect entry point (bin field, setup.py entry_points, cargo [[bin]], etc.)
- Confirm it runs without a browser

**If library:**
- Detect export structure (ESM, CommonJS, UMD, etc.)
- Note: library demos may require a generated demo page

**If API:**
- Detect if REST, GraphQL, or gRPC
- Note: API demos may require HTTP client UI (e.g., Insomnia, Postman mockup)

Store in context: `projectType`, `startCommand`, `port`

---

## 6. Build Analysis Summary

In context, create:

```json
{
  "projectMetadata": {
    "name": "...",
    "language": "...",
    "framework": "...",
    "projectType": "...",
    "entryPoint": "...",
    "startCommand": "...",
    "port": "..."
  },
  "analysis": {
    "codebaseFeatures": [...],
    "keyReflections": [...],
    "buildNarrative": "...",
    "commitHistory": [...],
    "systemArchitecture": "..."
  }
}
```

---

## 7. Report Findings to User

Present a summary:

```
📦 Project Detected: [NAME]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Language:     [LANGUAGE]
Framework:    [FRAMEWORK]
Type:         [TYPE]
Start cmd:    [CMD]
Port:         [PORT]

📚 Integration Files:
✓ Case Study (build narrative available)
✓ Git Launcher (features available)

🔍 Key Features Detected:
- [Feature 1]
- [Feature 2]
- [Feature 3]

Ready to move to Step 2: STRATEGY
```

---

## 8. Proceed to Next Step

Load and execute: `shared/prompts/02-STRATEGY.md`

The strategy conversation will ask the user to specify platform, tone, focus, and visual style.

---

## Error Handling

- **detect-project.js fails**: Manually provide language, framework, name, type
- **No commit history**: Note "new project" in context; continue
- **.case-study/ missing**: Note "case-study not found"; continue (demo will be feature-focused)
- **git-launch/ missing**: Note "git-launch not found"; continue
