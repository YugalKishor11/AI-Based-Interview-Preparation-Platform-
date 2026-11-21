/**
 * PrepSphere Database Reset & Reseed Utility
 * Resets local or remote database schema and re-applies all versioned migrations and seeds.
 */
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

console.log('--- PrepSphere Database Reset & Reseed ---');

const migrationsDir = path.resolve('supabase/migrations');
const seedFile = path.resolve('supabase/seed.sql');
const setupAll = path.resolve('supabase/setup_all.sql');

if (!fs.existsSync(migrationsDir) || !fs.existsSync(seedFile)) {
  console.error('Error: Migration files or seed.sql not found in /supabase.');
  process.exit(1);
}

// 1. Check if Supabase CLI is locally runnable
try {
  console.log('Checking Supabase CLI status...');
  execSync('npx supabase --version', { stdio: 'pipe' });
  console.log('Running npx supabase db reset...');
  execSync('npx supabase db reset', { stdio: 'inherit' });
  console.log('✓ Local Supabase database successfully reset and reseeded.');
} catch {
  console.log('Notice: Supabase CLI is not running a local Docker daemon.');
  console.log('Compiled unified migration script is ready at:');
  console.log('  ' + setupAll);
  console.log('You can apply this file directly in your Supabase SQL Editor:');
  console.log('  https://supabase.com/dashboard/project/_/sql');
}
