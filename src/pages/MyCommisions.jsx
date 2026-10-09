import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../lib/supabase";
import Navbar from "../components/Navbar";

function MyCommisions() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionLoading, setActionLoading] = useState(null);

  const fetchRequests = async () => {
    setLoading(true);
    setError("");

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setError("Please log in to view your commissions.");
        setLoading(false);
        return;
      }

      // Get commission requests
      const { data: requestData, error: requestError } = await supabase
        .from("commission_requests")
        .select(`
          id,
          buyer_id,
          artist_id,
          artwork_id,
          status,
          customer_message,
          requested_style,
          requested_medium,
          requested_dimensions,
          budget,
          agreed_price,
          created_at,
          artist_profiles (
            id,
            display_name,
            profile_image
          ),
          artworks (
            id,
            title
          )
        `)
        .eq("buyer_id", user.id)
        .order("created_at", { ascending: false });

      if (requestError) {
        throw requestError;
      }

      // Get commission orders for these requests
      const requestIds = (requestData || []).map(
        (request) => request.id
      );

      let orderData = [];

      if (requestIds.length > 0) {
        const { data, error: orderError } = await supabase
          .from("commission_orders")
          .select(`
            id,
            commission_request_id,
            buyer_id,
            artist_id,
            agreed_price,
            status,
            payment_status,
            created_at
          `)
          .in("commission_request_id", requestIds);

        if (orderError) {
          throw orderError;
        }

        orderData = data || [];
      }

      // Attach the order to its commission request
      const requestsWithOrders = (requestData || []).map(
        (request) => ({
          ...request,
          commission_order:
            orderData.find(
              (order) =>
                order.commission_request_id === request.id
            ) || null,
        })
      );

      console.log(
        "MY COMMISSIONS:",
        requestsWithOrders
      );

      setRequests(requestsWithOrders);
    } catch (err) {
      console.error("Commission fetch error:", err);
      setError(err.message || "Could not load commissions.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const loadRazorpay = () => {
    return new Promise((resolve, reject) => {
      if (window.Razorpay) {
        resolve(true);
        return;
      }

      const script = document.createElement("script");

      script.src =
        "https://checkout.razorpay.com/v1/checkout.js";

      script.onload = () => resolve(true);

      script.onerror = () =>
        reject(
          new Error("Could not load Razorpay Checkout.")
        );

      document.body.appendChild(script);
    });
  };

  const payCommission = async (order) => {
    setActionLoading(order.id);
    setError("");

    try {
      // Load Razorpay Checkout
      await loadRazorpay();

      // Ask Edge Function to create/reuse Razorpay order
      const { data, error } = await supabase.functions.invoke(
        "create-commison-search",
        {
          body: {
            commission_order_id: order.id,
          },
        }
      );

      if (error) {
        throw error;
      }

      if (!data?.razorpay_order_id) {
        throw new Error("Could not create Razorpay order.");
      }

      // Open Razorpay Checkout
      const options = {
        key: data.key_id,
        amount: data.amount,
        currency: data.currency,
        name: "Anuktya",
        description: "Commission artwork",
        order_id: data.razorpay_order_id,

        handler: async function (response) {
          try {
            setError("");

            const {
              data: verificationData,
              error: verificationError,
            } = await supabase.functions.invoke(
              "verify-commission-payment",
              {
                body: {
                  commission_order_id: order.id,
                  razorpay_order_id:
                    response.razorpay_order_id,
                  razorpay_payment_id:
                    response.razorpay_payment_id,
                  razorpay_signature:
                    response.razorpay_signature,
                },
              }
            );

            if (verificationError) {
              throw verificationError;
            }

            if (!verificationData?.success) {
              throw new Error(
                verificationData?.error ||
                  "Payment verification failed."
              );
            }

            // Update the correct commission request in the UI
            setRequests((current) =>
              current.map((item) =>
                item.id === order.commission_request_id
                  ? {
                      ...item,
                      commission_order: {
                        ...item.commission_order,
                        status: "IN_PROGRESS",
                        payment_status: "PAID",
                        razorpay_payment_id:
                          response.razorpay_payment_id,
                      },
                    }
                  : item
              )
            );

            setActionLoading(null);
          } catch (err) {
            console.error(
              "Payment verification error:",
              err
            );

            setError(
              err.message ||
                "Payment verification failed."
            );

            setActionLoading(null);
          }
        },

        prefill: {
          name: "",
          email: "",
        },

        theme: {
          color: "#8f5bb7",
        },

        modal: {
          ondismiss: function () {
            setActionLoading(null);
          },
        },
      };

      const razorpay = new window.Razorpay(options);

      razorpay.on(
        "payment.failed",
        function (response) {
          console.error(
            "Razorpay payment failed:",
            response.error
          );

          setError(
            response.error?.description ||
              "Payment failed. Please try again."
          );

          setActionLoading(null);
        }
      );

      razorpay.open();
    } catch (err) {
      console.error("Payment error:", err);

      setError(
        err.message || "Could not start the payment."
      );

      setActionLoading(null);
    }
  };

  // BUYER ACCEPTS ARTIST OFFER
  const acceptOffer = async (request) => {
    setActionLoading(request.id);
    setError("");

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        throw new Error("Please log in to continue.");
      }

      if (!request.agreed_price) {
        throw new Error(
          "The artist has not set a final price yet."
        );
      }

      // Check if an order already exists
      const {
        data: existingOrder,
        error: existingError,
      } = await supabase
        .from("commission_orders")
        .select(`
          id,
          commission_request_id,
          buyer_id,
          artist_id,
          agreed_price,
          status,
          payment_status,
          created_at
        `)
        .eq("commission_request_id", request.id)
        .maybeSingle();

      if (existingError) {
        throw existingError;
      }

      let order = existingOrder;

      // Create the commission order
      if (!order) {
        const {
          data: newOrder,
          error: orderError,
        } = await supabase
          .from("commission_orders")
          .insert({
            commission_request_id: request.id,
            buyer_id: user.id,
            artist_id: request.artist_id,
            agreed_price: request.agreed_price,
            status: "AWAITING_PAYMENT",
            payment_status: "PENDING",
          })
          .select()
          .single();

        if (orderError) {
          throw orderError;
        }

        order = newOrder;
      }

      // Update UI using persisted order
      setRequests((current) =>
        current.map((item) =>
          item.id === request.id
            ? {
                ...item,
                commission_order: order,
              }
            : item
        )
      );
    } catch (err) {
      console.error("Accept offer error:", err);

      setError(
        err.message || "Could not accept offer."
      );
    } finally {
      setActionLoading(null);
    }
  };

  // BUYER DECLINES OFFER
  const cancelCommission = async (requestId) => {
    setActionLoading(requestId);
    setError("");

    try {
      const { error } = await supabase
        .from("commission_requests")
        .update({
          status: "CANCELLED",
          updated_at: new Date().toISOString(),
        })
        .eq("id", requestId);

      if (error) {
        throw error;
      }

      setRequests((current) =>
        current.map((request) =>
          request.id === requestId
            ? {
                ...request,
                status: "CANCELLED",
              }
            : request
        )
      );
    } catch (err) {
      console.error(
        "Cancel commission error:",
        err
      );

      setError(
        err.message ||
          "Could not cancel commission."
      );
    } finally {
      setActionLoading(null);
    }
  };

  // LOADING
  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white">
        <Navbar />

        <main className="mx-auto max-w-6xl px-6 pb-20 pt-32 sm:px-10 lg:px-16">
          <div className="flex min-h-[50vh] items-center justify-center">
            <div className="text-center">
              <div className="mx-auto mb-5 h-10 w-10 animate-spin rounded-full border-2 border-white/10 border-t-[#b58bd0]" />

              <p className="text-sm tracking-wide text-white/50">
                Loading your commissions...
              </p>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <Navbar />

      <main className="mx-auto max-w-6xl px-6 pb-24 pt-32 sm:px-10 lg:px-16">

        {/* PAGE HEADER */}
        <section className="mb-12">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[#b58bd0]">
            Your Artwork
          </p>

          <div className="mt-4 flex flex-col justify-between gap-6 md:flex-row md:items-end">
            <div>
              <h1
                className="text-5xl font-semibold tracking-tight text-white md:text-6xl"
                style={{
                  fontFamily:
                    '"Cormorant Garamond", "Bodoni 72", Didot, Georgia, serif',
                }}
              >
                My Commissions
              </h1>

              <p className="mt-4 max-w-2xl text-base leading-7 text-white/50">
                Track your commission requests and review
                offers from artists.
              </p>
            </div>

            <Link
              to="/artists"
              className="inline-flex w-fit items-center rounded-full border border-[#b58bd0]/40 bg-[#8f5bb7]/15 px-6 py-3 text-sm font-semibold text-[#dfc7ef] transition hover:border-[#b58bd0] hover:bg-[#8f5bb7]/25"
            >
              Explore Artists
            </Link>
          </div>
        </section>

        {/* ERROR */}
        {error && (
          <div className="mb-8 rounded-2xl border border-red-400/20 bg-red-500/10 p-4 text-sm text-red-300">
            {error}
          </div>
        )}

        {/* EMPTY STATE */}
        {requests.length === 0 ? (
          <div className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-12 text-center shadow-2xl backdrop-blur-xl">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border border-[#b58bd0]/30 bg-[#8f5bb7]/10 text-2xl text-[#d8b8ed]">
              ✦
            </div>

            <h2
              className="mt-6 text-3xl font-semibold text-white"
              style={{
                fontFamily:
                  '"Cormorant Garamond", "Bodoni 72", Didot, Georgia, serif',
              }}
            >
              No commission requests yet
            </h2>

            <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-white/45">
              Find an artist and request a custom artwork.
            </p>

            <Link
              to="/artists"
              className="mt-7 inline-flex rounded-full bg-[#8f5bb7] px-7 py-3 text-sm font-semibold text-white transition hover:bg-[#a66dcc]"
            >
              Explore Artists
            </Link>
          </div>
        ) : (
          <div className="space-y-6">

            {requests.map((request) => {
              const artist = request.artist_profiles;
              const artwork = request.artworks;
              const order = request.commission_order;

              const hasOffer =
                request.agreed_price !== null &&
                request.agreed_price !== undefined;

              const offerAccepted = !!order;

              return (
                <div
                  key={request.id}
                  className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.04] p-6 shadow-2xl backdrop-blur-xl transition duration-300 hover:border-white/15 hover:bg-white/[0.055] md:p-8"
                >
                  {/* SUBTLE PURPLE GLOW */}
                  <div className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full bg-[#8f5bb7]/10 blur-3xl" />

                  <div className="relative flex flex-col gap-10 lg:flex-row lg:justify-between">

                    {/* COMMISSION INFORMATION */}
                    <div className="min-w-0 flex-1">

                      {/* TITLE + STATUS */}
                      <div className="flex flex-wrap items-center gap-3">
                        <h2
                          className="text-3xl font-semibold text-white"
                          style={{
                            fontFamily:
                              '"Cormorant Garamond", "Bodoni 72", Didot, Georgia, serif',
                          }}
                        >
                          {artwork?.title ||
                            "Commission Request"}
                        </h2>

                        <span className="rounded-full border border-[#b58bd0]/30 bg-[#8f5bb7]/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-[#d8b8ed]">
                          {request.status}
                        </span>
                      </div>

                      {/* ARTIST */}
                      {artist && (
                        <Link
                          to={`/artists/${artist.id}`}
                          className="mt-3 inline-block text-sm text-white/45 transition hover:text-[#d8b8ed]"
                        >
                          Artist:{" "}
                          <span className="text-white/70">
                            {artist.display_name}
                          </span>
                        </Link>
                      )}

                      {/* REQUEST MESSAGE */}
                      {request.customer_message && (
                        <div className="mt-7 rounded-2xl border border-white/8 bg-black/20 p-5">
                          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-white/35">
                            Your request
                          </p>

                          <p className="mt-3 leading-7 text-white/65">
                            {request.customer_message}
                          </p>
                        </div>
                      )}

                      {/* DETAILS */}
                      <div className="mt-6 grid gap-3 sm:grid-cols-2">

                        {request.requested_style && (
                          <div className="rounded-2xl border border-white/8 bg-black/20 p-4">
                            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/30">
                              Style
                            </p>

                            <p className="mt-2 text-sm text-white/75">
                              {request.requested_style}
                            </p>
                          </div>
                        )}

                        {request.requested_medium && (
                          <div className="rounded-2xl border border-white/8 bg-black/20 p-4">
                            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/30">
                              Medium
                            </p>

                            <p className="mt-2 text-sm text-white/75">
                              {request.requested_medium}
                            </p>
                          </div>
                        )}

                        {request.requested_dimensions && (
                          <div className="rounded-2xl border border-white/8 bg-black/20 p-4">
                            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/30">
                              Dimensions
                            </p>

                            <p className="mt-2 text-sm text-white/75">
                              {request.requested_dimensions}
                            </p>
                          </div>
                        )}

                        {request.budget && (
                          <div className="rounded-2xl border border-white/8 bg-black/20 p-4">
                            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/30">
                              Your budget
                            </p>

                            <p className="mt-2 text-sm font-medium text-white/80">
                              ₹{" "}
                              {Number(
                                request.budget
                              ).toLocaleString("en-IN")}
                            </p>
                          </div>
                        )}

                      </div>

                      {/* ARTIST OFFER */}
                      {hasOffer &&
                        request.status === "ACCEPTED" && (
                          <div className="mt-7 rounded-2xl border border-[#b58bd0]/20 bg-[#8f5bb7]/[0.08] p-6">
                            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#c7a8dc]">
                              Artist's offer
                            </p>

                            <p
                              className="mt-2 text-4xl font-semibold text-white"
                              style={{
                                fontFamily:
                                  '"Cormorant Garamond", "Bodoni 72", Didot, Georgia, serif',
                              }}
                            >
                              ₹{" "}
                              {Number(
                                request.agreed_price
                              ).toLocaleString("en-IN")}
                            </p>

                            <p className="mt-2 text-sm leading-6 text-white/45">
                              The artist has accepted your
                              request and submitted a final
                              price.
                            </p>
                          </div>
                        )}

                      {/* ACCEPTED CONFIRMATION */}
                      {offerAccepted && (
                        <div className="mt-7 rounded-2xl border border-[#b58bd0]/20 bg-[#8f5bb7]/[0.06] p-6">
                          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#c7a8dc]">
                            Offer accepted
                          </p>

                          <p className="mt-2 text-sm leading-6 text-white/50">
                            You accepted the artist's offer.
                            Your commission order is awaiting
                            payment.
                          </p>

                          <p
                            className="mt-4 text-2xl font-semibold text-white"
                            style={{
                              fontFamily:
                                '"Cormorant Garamond", "Bodoni 72", Didot, Georgia, serif',
                            }}
                          >
                            ₹{" "}
                            {Number(
                              order.agreed_price
                            ).toLocaleString("en-IN")}
                          </p>
                        </div>
                      )}

                      {/* CANCELLED */}
                      {request.status === "CANCELLED" && (
                        <div className="mt-7 rounded-2xl border border-white/8 bg-black/20 p-5">
                          <p className="text-sm text-white/45">
                            This commission request has been
                            cancelled.
                          </p>
                        </div>
                      )}

                      {/* REJECTED */}
                      {request.status === "REJECTED" && (
                        <div className="mt-7 rounded-2xl border border-red-400/15 bg-red-500/[0.06] p-5">
                          <p className="text-sm text-red-300/80">
                            The artist declined this commission
                            request.
                          </p>
                        </div>
                      )}
                    </div>

                    {/* ACTIONS */}
                    <div className="flex flex-col gap-3 lg:w-52 lg:shrink-0">

                      {/* WAITING FOR ARTIST */}
                      {request.status === "PENDING" && (
                        <div className="rounded-2xl border border-white/8 bg-black/20 p-4 text-sm leading-6 text-white/40">
                          Waiting for the artist to review your
                          request.
                        </div>
                      )}

                      {/* ACCEPT / DECLINE */}
                      {hasOffer &&
                        request.status === "ACCEPTED" &&
                        !offerAccepted && (
                          <>
                            <button
                              type="button"
                              disabled={
                                actionLoading === request.id
                              }
                              onClick={() =>
                                acceptOffer(request)
                              }
                              className="rounded-full bg-[#8f5bb7] px-5 py-4 text-xs font-semibold uppercase tracking-[0.16em] text-white transition hover:bg-[#a66dcc] disabled:opacity-50"
                            >
                              {actionLoading === request.id
                                ? "Accepting..."
                                : "Accept offer"}
                            </button>

                            <button
                              type="button"
                              disabled={
                                actionLoading === request.id
                              }
                              onClick={() =>
                                cancelCommission(request.id)
                              }
                              className="rounded-full border border-white/15 bg-white/[0.03] px-5 py-4 text-xs font-semibold uppercase tracking-[0.16em] text-white/65 transition hover:border-red-400/30 hover:bg-red-500/10 hover:text-red-300 disabled:opacity-50"
                            >
                              {actionLoading === request.id
                                ? "Cancelling..."
                                : "Decline offer"}
                            </button>
                          </>
                        )}

                      {/* PAY NOW */}
                      {offerAccepted &&
                        order.status === "AWAITING_PAYMENT" &&
                        order.payment_status === "PENDING" && (
                          <button
                            type="button"
                            disabled={
                              actionLoading === order.id
                            }
                            className="rounded-full bg-[#8f5bb7] px-5 py-4 text-xs font-semibold uppercase tracking-[0.16em] text-white transition hover:bg-[#a66dcc] disabled:opacity-50"
                            onClick={() =>
                              payCommission(order)
                            }
                          >
                            {actionLoading === order.id
                              ? "Opening payment..."
                              : `Pay ₹${Number(
                                  order.agreed_price
                                ).toLocaleString("en-IN")}`}
                          </button>
                        )}

                    </div>
                  </div>
                </div>
              );
            })}

          </div>
        )}
      </main>
    </div>
  );
}

export default MyCommisions;