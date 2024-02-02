import { Lucia } from "lucia";
import { adapter } from "./db";
import { GitHub } from "arctic";

import type { DatabaseUser } from "./db";

export const lucia = new Lucia(adapter, {
    sessionCookie: {
        attributes: {
            secure: import.meta.env.PROD,
        },
    },
    getUserAttributes: (attributes) => {
        return {
            username: attributes.username,
            githubId: attributes.github_id,
        };
    },
});

declare module "lucia" {
    interface Register {
        Lucia: typeof lucia;
        DatabaseUserAttributes: Omit<DatabaseUser, "id">;
    }
}

export const github = new GitHub(
    import.meta.env.PUBLIC_GITHUB_CLIENT_ID,
    import.meta.env.PRIVATE_GITHUB_CLIENT_SECRET,
);
