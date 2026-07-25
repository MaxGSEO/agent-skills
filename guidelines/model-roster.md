# Model Roster

Who does what. The planner orchestrates and decides; executors implement one scoped session at
a time. This is the roster the `ai-loop` methodology dispatches against.

## Planner — Claude Opus 5 (`effort: high`)

Sole orchestrator. Authors specs, builds kickoff prompts, evaluates executor reports, decides
the next move. **Does not implement product code.**

Opus 5 tuning that matters for this role:

- **Don't add self-verification instructions.** Opus 5 verifies its own work and catches its
  own mistakes without being told. Prompts that say "include a final verification step",
  "double-check your answer", or "use a subagent to verify" cause over-verification and cost
  tokens with no quality gain. Spec-defined verification commands are a different thing and
  stay.
- **Cap delegation.** Opus 5 delegates readily. Delegate only for large, genuinely independent
  and parallelizable tracks — a wide multi-file investigation. Don't delegate what you can
  finish in a handful of tool calls, and never use a subagent to double-check your own work.
  If one subagent suffices, use one.
- **Ask for everything, filter after.** On review passes, don't write "only report
  high-severity issues" or "be conservative" — Opus 5 follows that literally and reports less.
  Ask for the full list and filter in a separate step.
- **Effort:** `high` is the default. Step to `xhigh` only for the most demanding agentic work;
  `low`/`medium` are genuinely good for routine passes.

## Executors

| Executor | Model | Selection | Effort | Notes |
|---|---|---|---|---|
| **Codex — Sol** | GPT‑5.6 | **default** | always `high` | Cross-family critique, resumable sessions. Main risk: over-engineering — §5 of the guidelines is aimed at it. |
| **Codex — Terra** | GPT‑5.5 | alternate | always `high` | Same binding as Sol; pick when Sol is unavailable or a cheaper pass is wanted. |
| **Claude subagent** | Fable 5 | available | `high` | Strongest read-only pre-flight gate (tool allowlist). **Same family as the planner** — correlated blindspots, so cross-family review is still required. May refuse security-adjacent work mid-session. |
| **Kimi** | Kimi K3 | **opt-in, per session, on explicit request only** | — | Mechanical, well-scoped, wide-context work. **Never for security-adjacent sessions.** Never selected on the agent's own initiative; does not change the loop default. |

Rules that hold whichever executor is dispatched:

- The methodology, gates, and report contract do not bend for the executor.
- An executor refusal is `blocked`, never `partial`: stop, revert to the pre-session commit,
  escalate verbatim, re-dispatch on a different executor.
- Security-adjacent sessions go to a Codex executor. Neither Kimi (by policy) nor Fable 5 (by
  refusal behavior) is eligible.

## Second opinion (planner-invoked, always available)

The planner may call **Sol** or **Fable 5** for a second opinion at any point, independent of
which executor holds the implementation. This is a capability check — pressure-testing a
design, sanity-checking a reading of the runtime — and it is *not* governance.

Keep it distinct from the **Council on Uncertainty**:

| | Second opinion | Council |
|---|---|---|
| Trigger | any time the planner wants one | bounded — genuine judgment calls only |
| Output | prose advice | structured verdicts, tallied deterministically |
| Ends at | the planner | the **human**, with the full council table |

**Family caveat:** with Opus 5 planning, Fable 5 is the *same* family. A Fable 5 second opinion
does not satisfy the council's cross-family requirement, and must never be recorded as if it
did. Cross-family critique means Codex, GLM, or MiniMax.
