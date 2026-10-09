
import "@supabase/functions-js/edge-runtime.d.ts";

const GROQ_API_KEY = Deno.env.get("GROQ_API_KEY");

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers":
        "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve(async (req) => {
    // Handle browser CORS preflight
    if (req.method === "OPTIONS") {
        return new Response("ok", {
            headers: corsHeaders,
        });
    }

    try {
        // Only allow POST requests
        if (req.method !== "POST") {
            return new Response(
                JSON.stringify({
                    error: "Method not allowed",
                }),
                {
                    status: 405,
                    headers: {
                        ...corsHeaders,
                        "Content-Type": "application/json",
                    },
                }
            );
        }

        // Check API key
        if (!GROQ_API_KEY) {
            return new Response(
                JSON.stringify({
                    error: "Groq API key is not configured.",
                }),
                {
                    status: 500,
                    headers: {
                        ...corsHeaders,
                        "Content-Type": "application/json",
                    },
                }
            );
        }

        // Read request body
        const { query } = await req.json();

        if (!query || typeof query !== "string") {
            return new Response(
                JSON.stringify({
                    error: "Search query is required.",
                }),
                {
                    status: 400,
                    headers: {
                        ...corsHeaders,
                        "Content-Type": "application/json",
                    },
                }
            );
        }

        // Ask Groq to understand the artwork search
        const groqResponse = await fetch(
            "https://api.groq.com/openai/v1/chat/completions",
            {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${GROQ_API_KEY}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    model: "openai/gpt-oss-20b",

                    messages: [
                        {
                            role: "system",
                            content: `
You are the art search assistant for Anuktya.

Convert the user's natural-language artwork request into structured
search criteria.

Return:
- keywords: useful descriptive words from the request
- style: an art style if explicitly mentioned
- medium: an art medium if explicitly mentioned
- maxPrice: maximum price if explicitly mentioned

Do not invent information.

Use null when a field is not specified.
`,
                        },
                        {
                            role: "user",
                            content: query,
                        },
                    ],

                    response_format: {
                        type: "json_schema",
                        json_schema: {
                            name: "art_search",
                            strict: true,
                            schema: {
                                type: "object",

                                properties: {
                                    keywords: {
                                        type: "array",
                                        items: {
                                            type: "string",
                                        },
                                    },

                                    style: {
                                        type: ["string", "null"],
                                    },

                                    medium: {
                                        type: ["string", "null"],
                                    },

                                    maxPrice: {
                                        type: ["number", "null"],
                                    },
                                },

                                required: [
                                    "keywords",
                                    "style",
                                    "medium",
                                    "maxPrice",
                                ],

                                additionalProperties: false,
                            },
                        },
                    },
                }),
            }
        );

        // Handle Groq errors
        if (!groqResponse.ok) {
            const errorText = await groqResponse.text();

            console.error("Groq error:", errorText);

            return new Response(
                JSON.stringify({
                    error: "Groq request failed.",
                }),
                {
                    status: groqResponse.status,
                    headers: {
                        ...corsHeaders,
                        "Content-Type": "application/json",
                    },
                }
            );
        }

        // Read Groq response
        const groqData = await groqResponse.json();

        const text =
            groqData.choices?.[0]?.message?.content;

        if (!text) {
            console.error("Groq returned no content:", groqData);

            return new Response(
                JSON.stringify({
                    error: "No response received from Groq.",
                }),
                {
                    status: 500,
                    headers: {
                        ...corsHeaders,
                        "Content-Type": "application/json",
                    },
                }
            );
        }

        // Convert JSON string into an object
        const searchCriteria = JSON.parse(text);

        // Return structured search criteria to React
        return new Response(
            JSON.stringify(searchCriteria),
            {
                status: 200,
                headers: {
                    ...corsHeaders,
                    "Content-Type": "application/json",
                },
            }
        );

    } catch (error) {
        console.error("AI search error:", error);

        return new Response(
            JSON.stringify({
                error: "Something went wrong while processing the search.",
            }),
            {
                status: 500,
                headers: {
                    ...corsHeaders,
                    "Content-Type": "application/json",
                },
            }
        );
    }
});

