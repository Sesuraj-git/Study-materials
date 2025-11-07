import { Pool } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";

const pool = new Pool({
  connectionString:
    "postgresql://neondb_owner:npg_5QqvcROB2Eyi@ep-withered-cake-ahsiylou-pooler.c-3.us-east-1.aws.neon.tech/studybuddy?sslmode=require&channel_binding=require",
});
export const db = drizzle(pool);
