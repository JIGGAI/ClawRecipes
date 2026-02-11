import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';

function sh(cmd, args, opts={}){
  return execFileSync(cmd, args, { stdio: 'pipe', encoding: 'utf8', ...opts });
}

function assert(cond, msg){
  if(!cond){
    console.error(`ASSERT FAIL: ${msg}`);
    process.exit(1);
  }
}

const recipeId = process.env.RECIPE_ID || 'development-team';
const teamId = process.env.TEAM_ID || `smoke-${Date.now()}-team`;

// workspace dir naming convention
const workspaceDir = path.join(os.homedir(), `.openclaw/workspace-${teamId}`);

console.log(`Scaffolding team recipe=${recipeId} teamId=${teamId}`);
console.log(`Workspace: ${workspaceDir}`);

// Clean any previous leftovers
try { fs.rmSync(workspaceDir, { recursive: true, force: true }); } catch {}

// Run scaffold
const out = sh('openclaw', ['recipes','scaffold-team', recipeId, '-t', teamId, '--overwrite']);
// Print a tiny bit for debugging
console.log(out.trim().slice(0, 400));

// Assertions: dirs
const testingDir = path.join(workspaceDir, 'work', 'testing');
assert(fs.existsSync(testingDir), `Expected directory to exist: ${testingDir}`);

// Assertions: files contain key strings
function read(p){
  return fs.readFileSync(p, 'utf8');
}

// TEAM.md location: team root
const teamMd = path.join(workspaceDir, 'TEAM.md');
const ticketsMd = path.join(workspaceDir, 'TICKETS.md');
assert(fs.existsSync(teamMd), 'TEAM.md should exist');
assert(fs.existsSync(ticketsMd), 'TICKETS.md should exist');

const teamTxt = read(teamMd);
const ticketsTxt = read(ticketsMd);

const mustContain = [
  'work/testing',
  'backlog',
  'in-progress',
  'testing',
  'done',
];
for(const s of mustContain){
  assert(teamTxt.includes(s) || ticketsTxt.includes(s), `Expected TEAM.md or TICKETS.md to mention: ${s}`);
}

// Stronger: look for the lane flow phrase (allow simple variants)
const flowOk = /backlog\s*→\s*in-?progress\s*→\s*testing\s*→\s*done/i.test(teamTxt + '\n' + ticketsTxt);
assert(flowOk, 'Expected explicit stage flow: backlog → in-progress → testing → done');

const handoffOk = /(assign(ed)?\s+to\s+test|owner:\s*test|move.*work\/testing)/i.test(teamTxt + '\n' + ticketsTxt);
assert(handoffOk, 'Expected QA handoff guidance (assign to test / move to work/testing)');

console.log('OK: scaffold smoke assertions passed');

// Cleanup
if(process.env.KEEP_WORKSPACE !== '1'){
  fs.rmSync(workspaceDir, { recursive: true, force: true });
  console.log('Cleaned up workspace');
}
