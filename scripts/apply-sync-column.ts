import { db } from '../db/connection';
const run = async () => {
  try {
    await db.execute("ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS sync_data jsonb DEFAULT '{}'::jsonb");
    const res = await db.execute("SELECT column_name FROM information_schema.columns WHERE table_name = 'user_profiles' AND column_name = 'sync_data'");
    console.log('sync_data column present:', (res.rows as any[]).length > 0);
  } catch (e) { console.error('ERR', (e as Error).message); process.exit(1); }
};
run();
