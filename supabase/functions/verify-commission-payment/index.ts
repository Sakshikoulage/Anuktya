import "@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "@supabase/supabase-js";

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers":
        "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve(async (req) => {
    if (req.method === "OPTIONS") {
        return new Response("ok", {
            headers: corsHeaders,
        });
    }

    try {
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

        const razorpayKeySecret =
            Deno.env.get("razorpay_secret");

        if (!razorpayKeySecret) {
            return new Response(
                JSON.stringify({
                    error: "Razorpay secret is not configured.",
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

        const supabase = createClient(
            Deno.env.get("SUPABASE_URL")!,
            Deno.env.get("SUPABASE_ANON_KEY")!,
            {
                global: {
                    headers: {
                        Authorization:
                            req.headers.get("Authorization") || "",
                    },
                },
            }
        );
        
        const {
            data: { user },
            error: userError,
        } = await supabase.auth.getUser();

        if (userError || !user) {
            return new Response(
                JSON.stringify({
                    error: "Unauthorized.",
                }),
                {
                    status: 401,
                    headers: {
                        ...corsHeaders,
                        "Content-Type": "application/json",
                    },
                }
            );
        }

        const {
            commission_order_id,
            razorpay_order_id,
            razorpay_payment_id,
            razorpay_signature,
        } = await req.json();

        if (
            !commission_order_id ||
            !razorpay_order_id ||
            !razorpay_payment_id ||
            !razorpay_signature
        ) {
            return new Response(
                JSON.stringify({
                    error: "Missing payment verification details.",
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

        // Find the buyer's commission order
        const { data: commissionOrder, error: orderError } =
            await supabase
                .from("commission_orders")
                .select(`
                    id,
                    buyer_id,
                    razorpay_order_id,
                    payment_status,
                    status
                `)
                .eq("id", commission_order_id)
                .eq("buyer_id", user.id)
                .single();

        if (orderError || !commissionOrder) {
            return new Response(
                JSON.stringify({
                    error: "Commission order not found.",
                }),
                {
                    status: 404,
                    headers: {
                        ...corsHeaders,
                        "Content-Type": "application/json",
                    },
                }
            );
        }

        if (
            commissionOrder.razorpay_order_id !==
            razorpay_order_id
        ) {
            return new Response(
                JSON.stringify({
                    error: "Razorpay order mismatch.",
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

        // Create HMAC-SHA256 signature
        const encoder = new TextEncoder();

        const key = await crypto.subtle.importKey(
            "raw",
            encoder.encode(razorpayKeySecret),
            {
                name: "HMAC",
                hash: "SHA-256",
            },
            false,
            ["sign"]
        );

        const signaturePayload =
            `${razorpay_order_id}|${razorpay_payment_id}`;

        const signatureBuffer = await crypto.subtle.sign(
            "HMAC",
            key,
            encoder.encode(signaturePayload)
        );

        const expectedSignature = Array.from(
            new Uint8Array(signatureBuffer)
        )
            .map((byte) =>
                byte.toString(16).padStart(2, "0")
            )
            .join("");

        if (expectedSignature !== razorpay_signature) {
            return new Response(
                JSON.stringify({
                    error: "Invalid Razorpay payment signature.",
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

        // Payment is verified
        const { data: updatedOrder, error: updateError } =
            await supabase
                .from("commission_orders")
                .update({
                    razorpay_payment_id,
                    payment_status: "PAID",
                    status: "IN_PROGRESS",
                    paid_at: new Date().toISOString(),
                    updated_at: new Date().toISOString(),
                })
                .eq("id", commission_order_id)
                .eq("buyer_id", user.id)
                .select()
                .single();

        if (updateError) {
            throw updateError;
        }

        return new Response(
            JSON.stringify({
                success: true,
                order: updatedOrder,
            }),
            {
                status: 200,
                headers: {
                    ...corsHeaders,
                    "Content-Type": "application/json",
                },
            }
        );
    } catch (error) {
        console.error(
            "Verify payment error:",
            error
        );

        return new Response(
            JSON.stringify({
                error:
                    error instanceof Error
                        ? error.message
                        : "Something went wrong.",
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