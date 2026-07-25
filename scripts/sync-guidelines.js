#!/usr/bin/env node
/**
 * Distribute the engineering guidelines to every agent instruction file.
 *
 *   node scripts/sync-guidelines.js            # check only (default), exits 1 if anything is out of date
 *   node scripts/sync-guidelines.js --write    # install or refresh
 *   node scripts/sync-guidelines.js --targets other-targets.json
 *
 * Shared files (CLAUDE.md, AGENTS.md) keep their project-specific content: the guidelines live
 * inside a managed block that is replaced in place. Dedicated files (Cursor .mdc) are written whole.
 */

const fs = require('fs');
const os = require('os');
const path = require('path');

const REPO_ROOT = path.resolve(__dirname, '..');
const args = process.argv.slice(2);
const WRITE = args.includes('--write');
const targetsArg = args.indexOf('--targets');
const TARGETS_FILE = targetsArg !== -1 && args[targetsArg + 1]
  ? path.resolve(args[targetsArg + 1])
  : path.join(REPO_ROOT, 'guidelines', 'targets.json');

const config = JSON.parse(fs.readFileSync(TARGETS_FILE, 'utf8'));
const BLOCK_ID = config.blockId || 'engineering-guidelines';
const BEGIN = `<!-- BEGIN MANAGED: ${BLOCK_ID} -->`;
const END = `<!-- END MANAGED: ${BLOCK_ID} -->`;

function expandHome(p) {
  return p.startsWith('~') ? path.join(os.homedir(), p.slice(1)) : p;
}

function readSources(tool) {
  return tool.sources
    .map((name) => fs.readFileSync(path.join(REPO_ROOT, 'guidelines', name), 'utf8').trim())
    .join('\n\n');
}

function buildBlock(tool) {
  const notice = 'Synced from agent-skills/guidelines — edit there, not here, then re-run scripts/sync-guidelines.js';
  return `${BEGIN}\n<!-- ${notice} -->\n\n${readSources(tool)}\n\n${END}`;
}

function buildDedicated(tool) {
  const fm = tool.frontmatter || {};
  const lines = Object.entries(fm).map(([k, v]) => `${k}: ${typeof v === 'string' ? v : JSON.stringify(v)}`);
  const header = lines.length ? `---\n${lines.join('\n')}\n---\n\n` : '';
  return `${header}${readSources(tool)}\n`;
}

function desiredContent(tool, existing) {
  if (tool.dedicated) return buildDedicated(tool);
  const block = buildBlock(tool);
  if (!existing) return `${block}\n`;
  const start = existing.indexOf(BEGIN);
  const end = existing.indexOf(END);
  if (start !== -1 && end !== -1 && end > start) {
    return existing.slice(0, start) + block + existing.slice(end + END.length);
  }
  return `${existing.replace(/\s*$/, '')}\n\n${block}\n`;
}

function resolveTargets() {
  const out = [];
  for (const entry of config.global || []) {
    out.push({ label: entry.name, tool: config.tools[entry.tool], file: expandHome(entry.path), scope: null });
  }
  for (const project of config.projects || []) {
    const root = expandHome(project.root);
    for (const toolName of project.tools) {
      const tool = config.tools[toolName];
      out.push({
        label: `${project.name} → ${tool.label}`,
        tool,
        file: path.join(root, tool.file),
        scope: root,
      });
    }
  }
  return out;
}

const STATUS = { OK: 'ok', STALE: 'stale', MISSING: 'missing', UNREACHABLE: 'unreachable' };

function inspect(target) {
  if (target.scope && !fs.existsSync(target.scope)) return { status: STATUS.UNREACHABLE };
  const exists = fs.existsSync(target.file);
  const existing = exists ? fs.readFileSync(target.file, 'utf8') : '';
  const desired = desiredContent(target.tool, existing);
  if (!exists || (!target.tool.dedicated && !existing.includes(BEGIN))) {
    return { status: STATUS.MISSING, desired };
  }
  return { status: existing === desired ? STATUS.OK : STATUS.STALE, desired };
}

const MARK = { ok: 'ok        ', stale: 'STALE     ', missing: 'MISSING   ', unreachable: 'unreachable' };
const targets = resolveTargets();
const counts = { ok: 0, stale: 0, missing: 0, unreachable: 0 };

for (const target of targets) {
  const { status, desired } = inspect(target);
  counts[status]++;
  if (WRITE && (status === STATUS.MISSING || status === STATUS.STALE)) {
    fs.mkdirSync(path.dirname(target.file), { recursive: true });
    fs.writeFileSync(target.file, desired, 'utf8');
    console.log(`written    ${target.label}  (${target.file})`);
  } else {
    console.log(`${MARK[status]} ${target.label}  (${target.file})`);
  }
}

const pending = counts.stale + counts.missing;
console.log(
  `\n${targets.length} targets: ${counts.ok} up to date, ${pending} ${WRITE ? 'written' : 'pending'}, ` +
  `${counts.unreachable} unreachable (project root not found on this machine).`
);

if (counts.unreachable) {
  console.log('Unreachable targets are normal when running away from the machine that holds those projects.');
}
if (!WRITE && pending > 0) {
  console.log('Run with --write to install.');
  process.exit(1);
}
