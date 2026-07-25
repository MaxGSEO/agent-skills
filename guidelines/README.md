# guidelines/

Personal agent instructions, kept in one place and distributed to every tool that needs them.
This is operator configuration, not part of the public skills collection — it is versioned here
because this repository is already the distribution mechanism for my agent setup.

## Files

| File | What it is |
|---|---|
| `engineering-guidelines.md` | The behavioral constitution. Karpathy-inspired spine, Anthropic's Claude 5-class scope and simplicity language, my anti-overengineering guardrails. Goes to every tool. |
| `model-roster.md` | Who plans, who implements, who gives a second opinion. Goes to Claude Code only — it is planner-facing. |
| `targets.json` | Where the above get installed. Edit the paths to match the machine. |
| `ai-loop-revisions.md` | Exact edits for the personal `ai-loop` skill, which lives outside this repository. |

## Distribution

```bash
node scripts/sync-guidelines.js            # report what is installed, stale, or missing (exit 1 if anything is pending)
node scripts/sync-guidelines.js --write    # install or refresh
```

Shared files (`CLAUDE.md`, `AGENTS.md`) keep their project-specific content: the guidelines go
into a managed block, delimited by HTML comments, that is replaced in place on every sync.
Anything above or below the markers is left untouched, so a project's own context and these
guidelines coexist in one file. Cursor's `.cursor/rules/engineering-guidelines.mdc` is a
dedicated file and is written whole, with `alwaysApply: true` frontmatter.

Targets whose project root does not exist on the current machine are reported as `unreachable`
rather than failing — the same config works from a container that only has this repository
checked out.

## Coverage

| Tool | Global | Per project |
|---|---|---|
| Claude Code | `~/.claude/CLAUDE.md` | `<root>/CLAUDE.md` |
| Codex | `~/.codex/AGENTS.md` | `<root>/AGENTS.md` |
| Cursor | not file-based — User Rules live in Cursor's settings UI, so paste `engineering-guidelines.md` there once | `<root>/.cursor/rules/engineering-guidelines.mdc` |

Executors dispatched by `ai-loop` run in their own processes and read the *target repository's*
instruction files, not the planner's. Per-project installation is therefore what actually puts
these guidelines in front of Codex, Cursor, and Kimi during a loop session — the global files
only cover the planner.

## Editing

Edit the source files here and re-run the sync. Never edit the managed block in a destination
file: the next sync overwrites it.
