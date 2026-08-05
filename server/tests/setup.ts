import { execSync } from 'node:child_process';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { PrismaClient } from '@prisma/client';

let dir: string;

export function createTestPrisma() {
  dir = mkdtempSync(join(tmpdir(), 'jobtrackr-test-'));
  const url = `file:${join(dir, 'test.db')}`;
  execSync('npx prisma db push --skip-generate', {
    env: { ...process.env, DATABASE_URL: url },
    stdio: 'ignore',
  });
  return new PrismaClient({ datasources: { db: { url } } });
}

export async function destroyTestPrisma(prisma: PrismaClient) {
  await prisma.$disconnect();
  if (dir) rmSync(dir, { recursive: true, force: true });
}
