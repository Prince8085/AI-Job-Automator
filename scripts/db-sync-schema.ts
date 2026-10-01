/**
 * Schema drift repair: adds any columns the live DB is missing.
 * Runs idempotently (checks information_schema before ALTERing).
 */
import { neon } from '@neondatabase/serverless';

async function main() {
  const sql = neon(process.env.DATABASE_URL!);

  const table = 'user_profiles';
  const cols = await (sql as any).query(
    `SELECT column_name FROM information_schema.columns WHERE table_name = '${table}'`
  );

  const existing = new Set((cols as any[]).map((c: any) => c.column_name));

  const wanted: Array<[string, string]> = [
    ['phone', 'varchar(50)'],
    ['bio', 'text'],
    ['base_resume', 'text'],
    ['profile_picture_url', 'text'],
    ['cover_photo_url', 'text'],
    ['linkedin_url', 'text'],
    ['github_url', 'text'],
    ['portfolio_url', 'text'],
    ['location', 'varchar(255)'],
    ['experience', 'json'],
    ['skills', 'json'],
    ['sync_data', 'json'],
  ];

  let added = 0;
  for (const [name, type] of wanted) {
    if (!existing.has(name)) {
      await (sql as any).query(`ALTER TABLE ${table} ADD COLUMN IF NOT EXISTS ${name} ${type}`);
      console.log(`  + added ${table}.${name} (${type})`);
      added++;
    }
  }
  console.log(added === 0 ? 'Schema already in sync — nothing to add.' : `Done: ${added} column(s) added.`);
}

main().catch((e) => { console.error('Migration failed:', e); process.exit(1); });
