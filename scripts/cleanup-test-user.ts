import { neon } from '@neondatabase/serverless';
const sql = neon(process.env.DATABASE_URL!);
(async () => {
  const r = await (sql as any).query(`DELETE FROM user_profiles WHERE clerk_user_id = 'test-user-123' RETURNING id`);
  console.log('Deleted test rows:', r.length || 0);
})().catch(e => { console.error(e.message); process.exit(1); });
