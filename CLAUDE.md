# CLAUDE.md — Hefjam.github.io

## Project

**The Taproom Pizza** — a table-side pizza ordering web app.
Static HTML/CSS/JS, deployed via Cloudflare Workers (`wrangler.jsonc`).
No build step. No framework. Ship directly from the repo root.

Key files:
- `index.html` — main app (self-contained, all logic bundled inline)
- `QR Codes.html` — per-table QR entry points
- `The Taproom Pizza _standalone_.html` — standalone version
- `privacy.html` — GDPR privacy policy
- `wrangler.jsonc` — Cloudflare Workers config (project name: `pizza`)

---

## Agent Workflow Rules

### Before writing any code

1. **Ask, don't assume.** If the goal is ambiguous, state your interpretation and ask for confirmation before touching anything.
2. **Read first.** Open and read every file you intend to change. Never edit from memory.
3. **State your plan in one sentence.** What will change and why. If the plan touches more than 2 files, list them.

### While coding

4. **Surgical edits only.** Change the minimum required. Do not refactor, rename, or reformat code outside the immediate task.
5. **No speculative features.** If it wasn't asked for, don't add it — not even "while I'm in here."
6. **No clever abstractions.** Three repeated lines beat a premature helper function. Keep it readable.
7. **No comments unless the why is non-obvious.** Good naming is the comment.

### Definition of done

8. **Goal-driven, not completion-driven.** A task isn't done when code is written — it's done when the stated goal is met.
9. **Verify in the browser.** For any UI change, confirm it renders and functions correctly before reporting complete.
10. **Report what actually changed**, not what you intended to change.

---

## Multi-Agent Orchestration

When tasks are large enough to parallelize, split into focused agents:

| Agent role | Scope |
|---|---|
| **Research** | Read files, understand current state, no writes |
| **Implement** | Single focused change, guided by research findings |
| **Test/Verify** | Open browser, confirm behavior, check regressions |
| **Review** | Read the diff, flag correctness issues only |

Never combine research and implementation in the same agent turn without an explicit checkpoint.

---

## Code Style

- Vanilla JS only — no frameworks, no bundlers, no build step
- CSS inline or in `<style>` blocks — no external stylesheets
- Mobile-first layout (customers order on phones)
- Cloudflare Workers compatibility (`nodejs_compat` flag is set)
- Keep the app self-contained — avoid external runtime dependencies

---

## Success Criteria Template

When starting a task, define:

```
Goal: [what the feature/fix achieves for the user]
Constraints: [what must not change or break]
Verification: [how to confirm it works]
```

Don't start coding until all three are clear.
