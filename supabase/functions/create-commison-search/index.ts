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

        const razorpayKeyId =
            Deno.env.get("razaorpay_key_id");

        const razorpayKeySecret =
            Deno.env.get("razorpay_secret");

        if (!razorpayKeyId || !razorpayKeySecret) {
            return new Response(
                JSON.stringify({
                    error: "Razorpay keys are not configured.",
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

        // Get logged-in user
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

        const { commission_order_id } =
            await req.json();

        if (!commission_order_id) {
            return new Response(
                JSON.stringify({
                    error:
                        "Commission order ID is required.",
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
        const { data: commissionOrder, error } =
            await supabase
                .from("commission_orders")
                .select(`
                    id,
                    buyer_id,
                    artist_id,
                    agreed_price,
                    status,
                    payment_status,
                    razorpay_order_id
                `)
                .eq("id", commission_order_id)
                .eq("buyer_id", user.id)
                .single();

        if (error || !commissionOrder) {
            console.error(
                "Commission order error:",
                error
            );

            return new Response(
                JSON.stringify({
                    error:
                        "Commission order not found.",
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

        // Reuse existing Razorpay order
        if (commissionOrder.razorpay_order_id) {
            return new Response(
                JSON.stringify({
                    razorpay_order_id:
                        commissionOrder.razorpay_order_id,
                    amount:
                        Math.round(
                            Number(
                                commissionOrder.agreed_price
                            ) * 100
                        ),
                    currency: "INR",
                    key_id: razorpayKeyId,
                }),
                {
                    status: 200,
                    headers: {
                        ...corsHeaders,
                        "Content-Type":
                            "application/json",
                    },
                }
            );
        }

        if (
            commissionOrder.status !==
            "AWAITING_PAYMENT"
        ) {
            return new Response(
                JSON.stringify({
                    error:
                        "This commission is not awaiting payment.",
                }),
                {
                    status: 400,
                    headers: {
                        ...corsHeaders,
                        "Content-Type":
                            "application/json",
                    },
                }
            );
        }

        if (
            commissionOrder.payment_status !==
            "PENDING"
        ) {
            return new Response(
                JSON.stringify({
                    error:
                        "This commission has already been paid.",
                }),
                {
                    status: 400,
                    headers: {
                        ...corsHeaders,
                        "Content-Type":
                            "application/json",
                    },
                }
            );
        }

        const amount = Math.round(
            Number(commissionOrder.agreed_price) * 100
        );

        if (!amount || amount <= 0) {
            return new Response(
                JSON.stringify({
                    error: "Invalid commission amount.",
                }),
                {
                    status: 400,
                    headers: {
                        ...corsHeaders,
                        "Content-Type":
                            "application/json",
                    },
                }
            );
        }

        // Create Razorpay order
        const razorpayResponse = await fetch(
            "https://api.razorpay.com/v1/orders",
            {
                method: "POST",

                headers: {
                    "Content-Type":
                        "application/json",

                    Authorization:
                        "Basic " +
                        btoa(
                            `${razorpayKeyId}:${razorpayKeySecret}`
                        ),
                },

                body: JSON.stringify({
                    amount,
                    currency: "INR",
                    receipt:
                        `commission_${commissionOrder.id}`,
                }),
            }
        );

        const razorpayOrder =
            await razorpayResponse.json();

        if (!razorpayResponse.ok) {
            console.error(
                "Razorpay error:",
                razorpayOrder
            );

            return new Response(
                JSON.stringify({
                    error:
                        razorpayOrder?.error
                            ?.description ||
                        "Razorpay order creation failed.",
                }),
                {
                    status: 500,
                    headers: {
                        ...corsHeaders,
                        "Content-Type":
                            "application/json",
                    },
                }
            );
        }

        // Save Razorpay order ID
        const { error: updateError } =
            await supabase
                .from("commission_orders")
                .update({
                    razorpay_order_id:
                        razorpayOrder.id,

                    updated_at:
                        new Date().toISOString(),
                })
                .eq("id", commissionOrder.id)
                .eq("buyer_id", user.id);

        if (updateError) {
            throw updateError;
        }

        return new Response(
            JSON.stringify({
                razorpay_order_id:
                    razorpayOrder.id,

                amount,

                currency: "INR",

                key_id: razorpayKeyId,
            }),
            {
                status: 200,
                headers: {
                    ...corsHeaders,
                    "Content-Type":
                        "application/json",
                },
            }
        );
    } catch (error) {
        console.error(
            "Create payment error:",
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
                    "Content-Type":
                        "application/json",
                },
            }
        );
    }
});