import { db } from '../db/connection';
const run = async () => {
  try {
    const res = await db.execute("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name");
    console.log('tables:', JSON.stringify((res.rows as any[])?.map((r) => r.table_name) || []));
  } catch (e) { console.error('ERR', (e as Error).message); process.exit(1); }
};
run();
