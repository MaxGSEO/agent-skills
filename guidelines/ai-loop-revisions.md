# ai-loop revisions — Opus 5 roster + Claude 5-class prompting

Exact edits to apply to the personal `ai-loop` skill (`~/.claude/skills/ai-loop/`). They were
authored against the version synced on 2026-07-25 and are not applied automatically: the skill
lives outside this repository, so apply them there and keep this file as the record of why.

Two things drive the changes: the planner is now **Claude Opus 5**, and Anthropic's prompting
guidance for Claude 5-class models changes what a good kickoff prompt looks like.

## Audit first — what does NOT need changing

Anthropic warns that skills written for earlier models are often too prescriptive for Claude
5-class models and can degrade output. I checked `ai-loop` for the three specific hazards and
it came back clean:

| Hazard | Grep | Result |
|---|---|---|
| Reasoning-extraction refusals on Fable 5 (prompts asking the model to echo or explain its internal reasoning) | `your reasoning`, `show your`, `chain of thought`, `transcribe` | **none found** |
| Over-verification on Opus 5 (`double-check`, `use a subagent to verify`) | `double-check`, `re-verify`, `subagent to verify` | only `executor_kimi.md:53`, which is hook re-verification — a real gate, keep it |
| Under-reporting on review passes (`only report high-severity`, `be conservative`) | `high-severity`, `only report`, `be conservative` | **none found** |

The ten hard rules are **governance**, not model-babysitting: the human gate, the ownership
boundary, the fixture rule, and the hand-computed-metric rule exist because of what they
protect, not because a model needed hand-holding. Keep all ten. The prescriptiveness warning
applies to instructions that manage the model's process; it does not license loosening an
audit trail.

---

## R1 — `SKILL.md` › Topology › planner

**Old**

```markdown
- **Planner = Claude Code Desktop.** Sole orchestrator. Auto-loads this skill on session start. Does not implement product code.
```

**New**

```markdown
- **Planner = Claude Code Desktop running Claude Opus 5 (`effort: high`).** Sole orchestrator. Auto-loads this skill on session start. Does not implement product code. Three Opus 5 behaviors shape this role: it verifies its own work unprompted (so do not add "double-check" or "verify with a subagent" steps — the spec's §5 verification commands are a different thing and stay), it delegates readily (cap subagent spawning to genuinely independent, sizeable tracks), and it follows review-scoping instructions literally (ask a review pass for everything and filter afterwards, never "only report high-severity issues").
```

## R2 — `SKILL.md` › Topology › executor sentence

In the second Topology bullet, replace the Codex clause:

**Old**

```markdown
**Codex** is dispatched from Claude Code via the `codex-plugin-cc` plugin (`/codex:rescue`, `/codex:review`, `/codex:adversarial-review`, `/codex:status`, `/codex:result`).
```

**New**

```markdown
**Codex** is dispatched from Claude Code via the `codex-plugin-cc` plugin (`/codex:rescue`, `/codex:review`, `/codex:adversarial-review`, `/codex:status`, `/codex:result`), running **GPT‑5.6 (Sol)** by default or **GPT‑5.5 (Terra)** as the alternate, always at `--effort high`.
```

## R3 — `SKILL.md` › Choosing an executor › comparison table

Add a **Model** row directly under the `Selection` row:

```markdown
| Model | **GPT‑5.6 (Sol)** default, GPT‑5.5 (Terra) alternate | Cursor-hosted | Fable 5 | Kimi K3 |
```

And change the Kimi cell of the `Refusal risk` row from `not characterized` to:

```markdown
not characterized — **excluded from security-adjacent sessions by policy**
```

## R4 — `SKILL.md` › Choosing an executor › default heuristic

**Old**

```markdown
- **Codex** — the general default: full reasoning trace, `--effort` control, cross-family critique, resumable sessions.
```

**New**

```markdown
- **Codex** — the general default, on **GPT‑5.6 (Sol)**, always `--effort high` (**GPT‑5.5 / Terra** as the alternate): full reasoning trace, cross-family critique, resumable sessions. Its characteristic failure mode is over-engineering, so the §5 "Search before you build" guardrails in the repo's engineering guidelines are aimed squarely at it and must be carried into the kickoff.
```

In the **Kimi** bullet, append to the "Not for" sentence:

**Old**

```markdown
Not for architectural judgment, pre-flight on an unfamiliar runtime, or evaluator/scoring sessions.
```

**New**

```markdown
Not for architectural judgment, pre-flight on an unfamiliar runtime, or evaluator/scoring sessions. **Never for security-adjacent sessions** — that is an operator policy, not a capability claim.
```

Then add a closing line to the section:

```markdown
**Security-adjacent sessions go to a Codex executor.** Kimi is excluded by policy and Fable 5 by refusal behavior, which leaves Sol or Terra as the only eligible executors for that work.
```

## R5 — `council_on_uncertainty.md` › default voices

The planner is now Opus 5, which makes Fable 5 a *same-family* voice. Left unfixed, a Fable 5
opinion would be recorded as if it were cross-family critique — quietly defeating the one
mechanism in the loop designed to catch correlated blindspots.

**Old**

```markdown
- **Fable 5** — capable on hard reasoning, but it refuses or reroutes on security-flavored decisions — exactly the cases you'd most want a second opinion on. Keep it **optional and never the sole or escalation voice**; on security-adjacent decisions expect abstention/routing and do not block on it.
```

**New**

```markdown
- **Fable 5** — capable on hard reasoning, but it refuses or reroutes on security-flavored decisions — exactly the cases you'd most want a second opinion on. Keep it **optional and never the sole or escalation voice**; on security-adjacent decisions expect abstention/routing and do not block on it. **It is also the same model family as the Opus 5 planner**, so a Fable 5 verdict never satisfies the council's cross-family requirement and must not be tallied as if it did. Cross-family means Codex, GLM, or MiniMax.
```

## R6 — `council_on_uncertainty.md` › new section

Add after "When to convene", to keep the always-available second opinion from being mistaken
for governance:

```markdown
## Second opinion ≠ council

The planner may call **Sol** or **Fable 5** for a second opinion whenever it wants one, independently of which executor holds the implementation. That is a capability check — pressure-testing a design, sanity-checking a reading of the runtime — and it ends at the planner.

The council is different: bounded trigger, structured verdicts, deterministic tally, and it ends at the **human**. Never record a second opinion as a council verdict, and never let one substitute for convening the council on a decision the trigger list covers.
```

## R7 — `kickoff_prompt_template.md` › §8 opening prompt

Retitle the section — the loop has been executor-neutral since the adapters landed, but the
heading still says Cursor:

**Old:** `## 8. Opening Prompt for Cursor (MANDATORY — PASTE VERBATIM)`
**New:** `## 8. Opening Prompt for the executor (MANDATORY — PASTE VERBATIM)`

Then, inside the fenced anatomy block, insert immediately before the final "If at any point you
are uncertain" line:

```markdown
The repository's engineering guidelines (`AGENTS.md` / `CLAUDE.md`) apply in full. Two of them are load-bearing for this session:

Don't add features, refactor, or introduce abstractions beyond what the task requires. A bug fix doesn't need surrounding cleanup and a one-shot operation usually doesn't need a helper. Don't design for hypothetical future requirements: do the simplest thing that works well. Don't add error handling, fallbacks, or validation for scenarios that cannot happen. Only validate at system boundaries.

Before adding a new behavior, search for an existing implementation by domain concept, synonyms, and adjacent flows — not only by the wording of this spec. In your report, state which areas you searched and why reuse or extension was not suitable.
```

Rationale for carrying the text rather than only the pointer: the executor runs in its own
process and reads the *target repository's* instruction files, not the planner's. The pointer
works only where `sync-guidelines.js` has installed those files; the inlined paragraphs work
unconditionally, and they are the specific counter to Sol's over-engineering tendency.

## R8 — `kickoff_prompt_template.md` › §9 completion-report contract

Add as the first line inside the fenced contract block, above `- **Status**`:

```markdown
Before writing this report, audit each claim against a tool result from this session. Report only work you can point to evidence for; if something is not yet verified, say so explicitly. If tests fail, say so with the output; if a step was skipped, say that.
```

This is the single highest-value Claude 5-class addition to the loop: in Anthropic's testing it
nearly eliminated fabricated status reports on tasks designed to elicit them. It also
strengthens hard rule 9 — an unverified metric can no longer be quoted in a report that claims
its numbers are grounded.

---

## What this changes about writing specs

The good news first: Opus 5 "performs best when given the complete task specification up front
and left to run", and Fable 5 shows first-shot correctness on complex, well-specified problems.
That is a direct endorsement of the loop's core bet — a full spec beats an iterative dialogue.
Nothing structural needs to change.

Three adjustments follow from the guidance:

1. **Keep §1 Purpose genuinely explanatory.** Claude 5-class models perform better when they
   understand *why* a task is being asked, because intent lets them connect the work to
   relevant context rather than inferring it. A §1 that states the goal but not the reason is
   now leaving capability unused.
2. **Spend the words on §4 "Do NOT" blocks and §6 handoff bullets, not on process
   choreography.** Instruction-following is strong enough that a brief constraint works as well
   as an enumerated list of behaviors; what still earns its length is anything mechanically
   checkable.
3. **Write §5 verification commands as commands with expected outputs**, never as "verify your
   work". The first is a spec artifact; the second is the phrasing that triggers
   over-verification on Opus 5.
