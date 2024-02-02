import { PostHog } from "posthog-node";

export const posthog = new PostHog(import.meta.env.PUBLIC_POSTHOG_KEY, {
    host: import.meta.env.PUBLIC_POSTHOG_HOST,
});

process.on("SIGTERM", () => {
    posthog.shutdown();
});
