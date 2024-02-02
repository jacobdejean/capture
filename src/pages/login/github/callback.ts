import { github, lucia } from "../../../lib/auth";
import { OAuth2RequestError } from "arctic";
import { adapter, pool } from "../../../lib/db";
import { generateId } from "lucia";

import type { APIContext } from "astro";
import type { DatabaseUser } from "../../../lib/db";
import { posthog } from "../../../lib/posthog";

export async function GET(context: APIContext): Promise<Response> {
    const code = context.url.searchParams.get("code");
    const state = context.url.searchParams.get("state");
    const storedState =
        context.cookies.get("github_oauth_state")?.value ?? null;
    if (!code || !state || !storedState || state !== storedState) {
        return new Response(null, {
            status: 400,
        });
    }

    try {
        const tokens = await github.validateAuthorizationCode(code);
        const githubUserResponse = await fetch("https://api.github.com/user", {
            headers: {
                Authorization: `Bearer ${tokens.accessToken}`,
            },
        });
        const githubUser: GitHubUser = await githubUserResponse.json();

        // const existingUser = db
        //     .prepare("SELECT * FROM user WHERE github_id = ?")
        //     .get(githubUser.id) as DatabaseUser | undefined;
        const existingUserQuery = await pool.query(
            "SELECT * FROM auth_user WHERE github_id = $1",
            [githubUser.id],
        );

        console.log("queried user", existingUserQuery);

        const existingUser = existingUserQuery.rows[0] as
            | DatabaseUser
            | undefined;

        if (existingUser) {
            const session = await lucia.createSession(existingUser.id, {});
            const sessionCookie = lucia.createSessionCookie(session.id);

            context.cookies.set(
                sessionCookie.name,
                sessionCookie.value,
                sessionCookie.attributes,
            );

            posthog.capture({
                distinctId: existingUser.id,
                event: "user_signed_in",
                properties: {
                    provider: "github",
                },
            });

            return context.redirect("/");
        }

        const userId = generateId(15);
        // db.prepare(
        //     "INSERT INTO user (id, github_id, username) VALUES (?, ?, ?)",
        // ).run(userId, githubUser.id, githubUser.login);
        await pool.query(
            "INSERT INTO auth_user (id, github_id, username) VALUES ($1, $2, $3)",
            [userId, githubUser.id, githubUser.login],
        );

        const session = await lucia.createSession(userId, {});
        const sessionCookie = lucia.createSessionCookie(session.id);

        context.cookies.set(
            sessionCookie.name,
            sessionCookie.value,
            sessionCookie.attributes,
        );

        posthog.capture({
            distinctId: userId,
            event: "user_signed_up",
            properties: {
                provider: "github",
                $set: {
                    name: githubUser.login,
                },
            },
        });

        return context.redirect("/");
    } catch (e) {
        if (
            e instanceof OAuth2RequestError &&
            e.message === "bad_verification_code"
        ) {
            // invalid code
            return new Response(null, {
                status: 400,
            });
        }
        return new Response(null, {
            status: 500,
        });
    }
}

interface GitHubUser {
    id: string;
    login: string;
}
