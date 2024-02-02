import { Lucia } from "lucia";
import { NodePostgresAdapter } from "@lucia-auth/adapter-postgresql";
import pg from "pg";

export const pool = new pg.Pool({
    host: import.meta.env.PGHOST,
    user: import.meta.env.PGUSER,
    password: import.meta.env.PGPASSWORD,
    database: import.meta.env.PGDATABASE,
    port: parseInt(import.meta.env.PGPORT),
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
});

export const adapter = new NodePostgresAdapter(pool, {
    user: "auth_user",
    session: "user_session",
});

export interface DatabaseUser {
    id: string;
    username: string;
    github_id: number;
}
