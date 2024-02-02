import type { APIContext } from "astro";

export async function GET(context: APIContext): Promise<Response> {
    const body = await context.request.json();

    if (!body?.url) {
        return new Response("Missing url", {
            status: 400,
            headers: {
                "content-type": "text/plain",
            },
        });
    }

    const url = body.url;

    console.log("Capturing image from", url);

    const results = {
        imageUrl: url,
    };

    return new Response(JSON.stringify(results), {
        status: 200,
        headers: {
            "content-type": "application/json",
        },
    });
}
