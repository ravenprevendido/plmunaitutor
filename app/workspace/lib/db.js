// lib/db.js
import { drizzle } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';
import * as schema from '@/config/schema';

const sql = neon(process.env.DATABASE_URL);
export const db = drizzle(sql, { schema });