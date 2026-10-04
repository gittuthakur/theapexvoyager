/**
 * One-time, explicit creation of the first OWNER admin. There is no signup page.
 *
 *   npx tsx scripts/bootstrapOwner.ts --email=owner@example.com --confirm-database=<dbname> [--dry-run]
 *
 * - The password is read from an interactive, hidden prompt (twice). It is never a CLI
 *   argument, never printed, never logged, never stored in plaintext (scrypt-hashed).
 * - --confirm-database must equal the connected database name, so the wrong database
 *   (e.g. a local .env.local pointing at production) can never be written by accident.
 * - Refuses if an OWNER already exists, so repeated execution is safe.
 * - --dry-run validates everything and checks for an existing OWNER without writing.
 */
import mongoose from 'mongoose';
import { pathToFileURL } from 'node:url';
import { connectDB } from '../lib/mongodb';
import { bootstrapOwner } from '../services/auth/adminBootstrap.service';

function arg(name: string): string | undefined {
  return process.argv.find(a => a.startsWith(`--${name}=`))?.slice(name.length + 3);
}

function promptHidden(question: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const { stdin, stdout } = process;
    if (!stdin.isTTY) return reject(new Error('An interactive terminal is required (the password is never accepted via arguments or pipes).'));
    stdout.write(question);
    let value = '';
    stdin.setRawMode(true);
    stdin.resume();
    stdin.setEncoding('utf8');
    const onData = (chunk: string) => {
      for (const ch of chunk) {
        if (ch === '\u0003') { stdin.setRawMode(false); stdout.write('\n'); process.exit(130); }
        if (ch === '\r' || ch === '\n') { stdin.setRawMode(false); stdin.pause(); stdin.off('data', onData); stdout.write('\n'); return resolve(value); }
        if (ch === '\u007f' || ch === '\b') value = value.slice(0, -1);
        else value += ch;
      }
    };
    stdin.on('data', onData);
  });
}

async function main() {
  try { process.loadEnvFile('.env.local'); } catch { /* MONGODB_URI may already be set */ }
  const email = arg('email');
  const confirmDb = arg('confirm-database');
  const dryRun = process.argv.includes('--dry-run');
  if (!email || !confirmDb) throw new Error('Usage: --email=<email> --confirm-database=<database name> [--dry-run]');

  const password = await promptHidden('Password: ');
  if (password !== (await promptHidden('Repeat password: '))) throw new Error('Passwords do not match.');

  await connectDB();
  const dbName = mongoose.connection.db?.databaseName;
  if (dbName !== confirmDb) throw new Error(`Connected database is "${dbName}", not "${confirmDb}". Nothing was changed.`);

  const result = await bootstrapOwner({ email, password }, { dryRun });
  if (!result.ok) throw new Error(result.message);
  console.log(dryRun ? `Dry run OK for database "${dbName}": an OWNER could be created. Nothing was written.` : `OWNER created in database "${dbName}".`);
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) {
  main().catch(e => { console.error((e as Error).message); process.exitCode = 1; }).finally(() => mongoose.disconnect());
}
