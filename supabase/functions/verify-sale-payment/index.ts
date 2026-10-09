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

  try {
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
    const adminSupabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
);


    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return new Response(
        JSON.stringify({
          error: "You must be signed in.",
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
      order_id,
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
    } = await req.json();

    if (
      !order_id ||
      !razorpay_order_id ||
      !razorpay_payment_id ||
      !razorpay_signature
    ) {
      return new Response(
        JSON.stringify({
          error: "Missing payment information.",
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

    // Get the order belonging to the authenticated buyer.
    const { data: order, error: orderError } =
      await supabase
        .from("orders")
        .select("*")
        .eq("id", order_id)
        .eq("user_id", user.id)
        .single();

    if (orderError || !order) {
      return new Response(
        JSON.stringify({
          error: "Order not found.",
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

    // Make sure the Razorpay order belongs to our order.
    if (
      order.razorpay_order_id !==
      razorpay_order_id
    ) {
      return new Response(
        JSON.stringify({
          error: "Payment order mismatch.",
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

    // Don't process the same order twice.
    if (order.payment_status === "PAID") {
      return new Response(
        JSON.stringify({
          success: true,
          already_paid: true,
        }),
        {
          status: 200,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    // Verify Razorpay signature.
    const payload =
      `${razorpay_order_id}|${razorpay_payment_id}`;

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

    const signatureBuffer =
      await crypto.subtle.sign(
        "HMAC",
        key,
        encoder.encode(payload)
      );

    const expectedSignature = Array.from(
      new Uint8Array(signatureBuffer)
    )
      .map((byte) =>
        byte.toString(16).padStart(2, "0")
      )
      .join("");

    if (
      expectedSignature !== razorpay_signature
    ) {
      return new Response(
        JSON.stringify({
          error: "Invalid payment signature.",
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

    // Re-read the order items and artworks before marking
    // the order as paid.
    const { data: orderItems, error: itemsError } =
      await supabase
        .from("order_items")
        .select(`
          id,
          artwork_id,
          quantity,
          unit_price,
          artworks (
            id,
            title,
            quantity,
            availability,
            listing_type
          )
        `)
        .eq("order_id", order.id);

    if (itemsError) {
      console.error(
        "Order items fetch error:",
        itemsError
      );

      return new Response(
        JSON.stringify({
          error:
            "Unable to validate the purchased artworks.",
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

    if (!orderItems || orderItems.length === 0) {
      return new Response(
        JSON.stringify({
          error: "This order has no items.",
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

    // Validate availability one more time.
    for (const item of orderItems) {
      const artwork = Array.isArray(item.artworks)
        ? item.artworks[0]
        : item.artworks;

      if (!artwork) {
        return new Response(
          JSON.stringify({
            error:
              "One of the purchased artworks no longer exists.",
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

      if (artwork.listing_type !== "SALE") {
        return new Response(
          JSON.stringify({
            error:
              `"${artwork.title}" is not a sale artwork.`,
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

      if (artwork.availability !== "AVAILABLE") {
        return new Response(
          JSON.stringify({
            error:
              `"${artwork.title}" is no longer available.`,
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

      if (
        Number(item.quantity) >
        Number(artwork.quantity)
      ) {
        return new Response(
          JSON.stringify({
            error:
              `"${artwork.title}" no longer has enough stock.`,
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
    }

    // Mark the order as paid.
    const { error: updateOrderError } =
      await adminSupabase
        .from("orders")
        .update({
          razorpay_payment_id:
            razorpay_payment_id,
          payment_status: "PAID",
          status: "CONFIRMED",
          paid_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("id", order.id)
        .eq("user_id", user.id);

    if (updateOrderError) {
      console.error(
        "Order payment update error:",
        updateOrderError
      );

      return new Response(
        JSON.stringify({
          error:
            "Payment was verified, but the order could not be updated.",
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

    // Update artwork inventory.
    for (const item of orderItems) {
      const artwork = Array.isArray(item.artworks)
        ? item.artworks[0]
        : item.artworks;

      const remainingQuantity =
        Number(artwork.quantity) -
        Number(item.quantity);

      const newAvailability =
        remainingQuantity <= 0
          ? "SOLD"
          : "AVAILABLE";

      const { error: artworkUpdateError } =
        await adminSupabase
          .from("artworks")
          .update({
            quantity: Math.max(
              remainingQuantity,
              0
            ),
            availability: newAvailability,
          })
          .eq("id", artwork.id);

      if (artworkUpdateError) {
        console.error(
          "Artwork update error:",
          artworkUpdateError
        );

        return new Response(
          JSON.stringify({
            error:
              "Payment succeeded, but artwork inventory could not be updated.",
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
    }

    // Remove the purchased items from the buyer's cart.
    const { error: cartDeleteError } =
      await adminSupabase
        .from("cart_items")
        .delete()
        .eq("user_id", user.id);

    if (cartDeleteError) {
      console.error(
        "Cart cleanup error:",
        cartDeleteError
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        order_id: order.id,
        payment_status: "PAID",
        status: "CONFIRMED",
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
      "Verify sale payment error:",
      error
    );

    return new Response(
      JSON.stringify({
        error:
          "Something went wrong while verifying the payment.",
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