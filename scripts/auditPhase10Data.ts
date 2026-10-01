/** Read-only Phase 10 source snapshot; writes catalogue data to the OS temp directory. */
import mongoose from 'mongoose';
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { Journey } from '../models/Journey';
import { Destination } from '../models/Destination';
import { Region } from '../models/Region';
import { connectDB } from '../lib/mongodb';

async function main() {
  if (process.argv.length > 2) throw new Error('No arguments accepted');
  try { process.loadEnvFile('.env.local'); } catch { /* Supplied environment supported. */ }
  await connectDB();
  const data = {
    journeys: await Journey.find().sort({ slug: 1 }).lean(),
    destinations: await Destination.find().sort({ slug: 1 }).lean(),
    regions: await Region.find().sort({ slug: 1 }).lean()
  };
  writeFileSync(join(tmpdir(), 'phase10-source.json'), JSON.stringify(data, null, 2));
  console.log(JSON.stringify({ total: data.journeys.length, published: data.journeys.filter(j => j.status === 'published').length }));
}
main().catch(() => { console.error('Phase 10 source audit failed'); process.exitCode = 1; }).finally(() => mongoose.disconnect());
