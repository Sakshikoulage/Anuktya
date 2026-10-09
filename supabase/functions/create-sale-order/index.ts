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
      JSON.stringify({ error: "Method not allowed" }),
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
    const {
  shipping,
} = await req.json();

const {
  fullName,
  phone,
  address,
  city,
  state,
  postalCode,
} = shipping || {};
    const razorpayKeyId = Deno.env.get("razaorpay_key_id");
    const razorpayKeySecret = Deno.env.get("razorpay_secret");

    if (!razorpayKeyId || !razorpayKeySecret) {
      return new Response(
        JSON.stringify({
          error: "Razorpay credentials are not configured.",
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

    // Get the user's current cart.
    const { data: cartItems, error: cartError } = await supabase
      .from("cart_items")
      .select(`
        id,
        quantity,
        artwork_id,
        artworks (
          id,
          title,
          price,
          quantity,
          availability,
          listing_type,
          artist_id
        )
      `)
      .eq("user_id", user.id);

    if (cartError) {
      console.error("Cart fetch error:", cartError);

      return new Response(
        JSON.stringify({
          error: "Unable to read your cart.",
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

    if (!cartItems || cartItems.length === 0) {
      return new Response(
        JSON.stringify({
          error: "Your cart is empty.",
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

    // Validate the cart and calculate the total on the server.
    let totalAmount = 0;

    const orderItems = [];

    for (const cartItem of cartItems) {
      const artwork = Array.isArray(cartItem.artworks)
  ? cartItem.artworks[0]
  : cartItem.artworks;

      if (!artwork) {
        return new Response(
          JSON.stringify({
            error: "One of the artworks in your cart no longer exists.",
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
            error: `"${artwork.title}" is not available for sale.`,
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
            error: `"${artwork.title}" is no longer available.`,
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

      const requestedQuantity = Number(cartItem.quantity);
      const availableQuantity = Number(artwork.quantity);

      if (
        !Number.isInteger(requestedQuantity) ||
        requestedQuantity < 1
      ) {
        return new Response(
          JSON.stringify({
            error: `Invalid quantity for "${artwork.title}".`,
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

      if (requestedQuantity > availableQuantity) {
        return new Response(
          JSON.stringify({
            error: `Only ${availableQuantity} unit(s) of "${artwork.title}" are available.`,
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

      const unitPrice = Number(artwork.price);

      if (!Number.isFinite(unitPrice) || unitPrice < 0) {
        return new Response(
          JSON.stringify({
            error: `Invalid price for "${artwork.title}".`,
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

      totalAmount += unitPrice * requestedQuantity;

      orderItems.push({
        artwork_id: artwork.id,
        artist_id: artwork.artist_id,
        quantity: requestedQuantity,
        unit_price: unitPrice,
      });
    }

    totalAmount = Number(totalAmount.toFixed(2));

    // Create the order.
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .insert({
  user_id: user.id,
  total_amount: totalAmount,
  status: "PENDING",
  payment_status: "PENDING",

  shipping_full_name: fullName?.trim() || null,
  shipping_phone: phone?.trim() || null,
  shipping_address: address?.trim() || null,
  shipping_city: city?.trim() || null,
  shipping_state: state?.trim() || null,
  shipping_postal_code: postalCode?.trim() || null,
})
      .select()
      .single();

    if (orderError || !order) {
      console.error("Order creation error:", orderError);

      return new Response(
        JSON.stringify({
          error: "Unable to create your order.",
          details: orderError?.message,
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

    // Attach all cart items to the new order.
    const orderItemsToInsert = orderItems.map((item) => ({
      order_id: order.id,
      artwork_id: item.artwork_id,
      artist_id: item.artist_id,
      quantity: item.quantity,
      unit_price: item.unit_price,
    }));

    const { error: orderItemsError } = await supabase
      .from("order_items")
      .insert(orderItemsToInsert);

    if (orderItemsError) {
      console.error(
        "Order items creation error:",
        orderItemsError
      );

      await supabase
        .from("orders")
        .delete()
        .eq("id", order.id);

      return new Response(
        JSON.stringify({
          error: "Unable to create the order items.",
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

    // Create the Razorpay order.
    const razorpayResponse = await fetch(
      "https://api.razorpay.com/v1/orders",
      {
        method: "POST",
        headers: {
          Authorization:
            "Basic " +
            btoa(`${razorpayKeyId}:${razorpayKeySecret}`),
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          amount: Math.round(totalAmount * 100),
          currency: "INR",
          receipt: order.id,
        }),
      }
    );

    const razorpayData = await razorpayResponse.json();

    if (!razorpayResponse.ok) {
      console.error(
        "Razorpay order error:",
        razorpayData
      );

      await supabase
        .from("order_items")
        .delete()
        .eq("order_id", order.id);

      await supabase
        .from("orders")
        .delete()
        .eq("id", order.id);

      return new Response(
        JSON.stringify({
          error:
            razorpayData?.error?.description ||
            "Unable to create Razorpay order.",
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

    // Save the Razorpay order ID.
    const { error: updateError } = await supabase
      .from("orders")
      .update({
        razorpay_order_id: razorpayData.id,
        updated_at: new Date().toISOString(),
      })
      .eq("id", order.id);

    if (updateError) {
      console.error(
        "Order Razorpay ID update error:",
        updateError
      );

      return new Response(
        JSON.stringify({
          error: "Unable to save payment information.",
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

    return new Response(
      JSON.stringify({
        success: true,
        order_id: order.id,
        razorpay_order_id: razorpayData.id,
        amount: Math.round(totalAmount * 100),
        currency: "INR",
        key_id: razorpayKeyId,
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
    console.error("Create sale order error:", error);

    return new Response(
      JSON.stringify({
        error: "Something went wrong while creating the order.",
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