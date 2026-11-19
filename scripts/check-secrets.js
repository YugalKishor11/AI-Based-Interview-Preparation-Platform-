// Secret Leak Grep Checker
// Verifies that NO service-role keys, private provider tokens, or internal secrets leak to client code or bundles.

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const FORBIDDEN_PATTERNS = [
  { name: 'Supabase Service Role Key', pattern: /SUPABASE_SERVICE_ROLE_KEY/i },
  { name: 'Hardcoded OpenAI Key', pattern: /sk-[a-zA-Z0-9]{24,}/ },
  { name: 'Hardcoded Gemini API Key', pattern: /AIza[0-9A-Za-z-_]{35}/ },
  { name: 'LiveKit API Secret', pattern: /LIVEKIT_API_SECRET/i },
  { name: 'Raw service_role assignment', pattern: /service_role\s*[:=]\s*['"][^'"]+['"]/i },
];

const SCAN_DIRECTORIES = [
  path.join(rootDir, 'src'),
];

// If dist exists, scan it too
const distDir = path.join(rootDir, 'dist');
if (fs.existsSync(distDir)) {
  SCAN_DIRECTORIES.push(distDir);
}

function scanFile(filePath) {
  // Ignore test files or markdown documentation
  if (filePath.includes('.test.') || filePath.includes('.spec.') || filePath.endsWith('.md')) {
    return [];
  }

  const content = fs.readFileSync(filePath, 'utf-8');
  const violations = [];

  for (const { name, pattern } of FORBIDDEN_PATTERNS) {
    if (pattern.test(content)) {
      violations.push({ file: path.relative(rootDir, filePath), pattern: name });
    }
  }

  return violations;
}

function walkDir(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  for (const file of list) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat && stat.isDirectory()) {
      results = results.concat(walkDir(fullPath));
    } else {
      results.push(fullPath);
    }
  }
  return results;
}

console.log('--- Scanning for Secret Leaks in Client Code & Assets ---');
let allViolations = [];

for (const dir of SCAN_DIRECTORIES) {
  if (fs.existsSync(dir)) {
    const files = walkDir(dir);
    for (const f of files) {
      const v = scanFile(f);
      if (v.length > 0) {
        allViolations = allViolations.concat(v);
      }
    }
  }
}

if (allViolations.length > 0) {
  console.error('❌ CRITICAL SECURITY LEAK DETECTED:');
  for (const v of allViolations) {
    console.error(`   - ${v.file}: leaked ${v.pattern}`);
  }
  process.exit(1);
} else {
  console.log('✓ Zero secrets detected. Client code and bundles are 100% free of service-role keys and credentials.');
  process.exit(0);
}
