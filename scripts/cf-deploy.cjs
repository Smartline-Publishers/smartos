// Deploys the OpenNext bundle, attaching CLERK_SECRET_KEY from the environment.
//
// Why this exists
// ---------------
// `wrangler deploy` uploads the binding list from wrangler.jsonc. Plaintext
// dashboard variables are not part of that list, so they are dropped on every
// deploy -- which is why CLERK_SECRET_KEY kept vanishing from the Worker and
// clerkMiddleware() threw on every request (generic 500). Worker *secrets* are
// preserved across deploys, but adding one is a manual dashboard step that is
// easy to skip.
//
// Cloudflare's build environment already provides CLERK_SECRET_KEY to the build
// and deploy steps, so we hand it to Wrangler with `--secrets-file` instead.
// The value is written to an ephemeral, git-ignored file inside the bundle's
// own directory and deleted as soon as the deploy finishes.
//
// If the variable is missing (e.g. someone runs this locally without it), we do
// not touch the file and let Wrangler's `secrets.required` guard report the
// problem instead of silently deploying a Worker that 500s.
//
// Extra CLI arguments are forwarded, e.g. `node scripts/cf-deploy.cjs --dry-run`.
const { spawnSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');

const SECRET_NAME = 'CLERK_SECRET_KEY';
const SECRETS_FILE = path.join('.open-next', '.cf-secrets.json');

function cleanup() {
  try {
    fs.rmSync(SECRETS_FILE, { force: true });
  } catch {
    /* nothing to clean up */
  }
}

process.on('exit', cleanup);
for (const signal of ['SIGINT', 'SIGTERM']) {
  process.on(signal, () => {
    cleanup();
    process.exit(1);
  });
}

function isClerkSecret(value) {
  return typeof value === 'string' && /^sk_(test|live)_[A-Za-z0-9_-]{20,}$/.test(value.trim());
}

function resolveOpenNextCli() {
  const pkgPath = require.resolve('@opennextjs/cloudflare/package.json');
  return path.join(path.dirname(pkgPath), 'dist', 'cli', 'index.js');
}

const value = (process.env[SECRET_NAME] || '').trim();
const passthrough = process.argv.slice(2);
const args = [resolveOpenNextCli(), 'deploy', ...passthrough];

if (isClerkSecret(value)) {
  fs.mkdirSync(path.dirname(SECRETS_FILE), { recursive: true });
  fs.writeFileSync(SECRETS_FILE, JSON.stringify({ [SECRET_NAME]: value }), { mode: 0o600 });
  args.push('--secrets-file', SECRETS_FILE);
  console.log(`cf-deploy: attaching ${SECRET_NAME} from the build environment`);
} else if (process.env[SECRET_NAME]) {
  console.warn(
    `cf-deploy: ${SECRET_NAME} is set but is not a valid Clerk secret key; falling back to the Worker's existing secret.`,
  );
} else {
  console.warn(
    `cf-deploy: ${SECRET_NAME} is not set in this environment; falling back to the Worker's existing secret.`,
  );
}

console.log(`cf-deploy: ${args.slice(1).join(' ')}`);

let status = 1;
try {
  const result = spawnSync(process.execPath, args, { stdio: 'inherit' });
  if (result.error) {
    console.error('cf-deploy: failed to start OpenNext:', result.error.message);
  }
  status = result.status ?? 1;
} finally {
  cleanup();
}

process.exit(status);
