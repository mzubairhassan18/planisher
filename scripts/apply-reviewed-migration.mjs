import { readFile } from "node:fs/promises";
import { resolve, sep } from "node:path";

import postgres from "postgres";

const projectRef = "qsvihkcxlcvprgtlkrnk";
const requestedFile = process.argv[2];

if (!requestedFile) {
  throw new Error("Provide a reviewed migration path, for example drizzle/0004_name.sql.");
}

const workspace = process.cwd();
const migrationPath = resolve(workspace, requestedFile);
const migrationRoot = resolve(workspace, "drizzle") + sep;

if (
  !migrationPath.startsWith(migrationRoot) ||
  !/^\d{4}_[a-z0-9_]+\.sql$/i.test(migrationPath.split(sep).at(-1) ?? "")
) {
  throw new Error("Only numbered SQL files inside drizzle/ can be applied.");
}

const databaseUrl = process.env.DIRECT_URL || process.env.DATABASE_URL;
if (!databaseUrl) {
  throw new Error("DIRECT_URL or DATABASE_URL is required in .env.local.");
}
if (!databaseUrl.includes(projectRef)) {
  throw new Error(`The database URL does not target the approved project ${projectRef}.`);
}

const migration = await readFile(migrationPath, "utf8");
const client = postgres(databaseUrl, {
  connect_timeout: 15,
  idle_timeout: 5,
  max: 1,
  prepare: false,
  ssl: "require",
});

try {
  await client.begin(async (transaction) => {
    await transaction.unsafe(migration);
  });
  process.stdout.write(`Applied ${requestedFile} to ${projectRef}.\n`);
} finally {
  await client.end({ timeout: 5 });
}
