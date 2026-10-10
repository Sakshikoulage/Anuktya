import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../lib/supabase";
import Navbar from "../components/Navbar";
import ArtistOrder from "./ArtistOrder";

function ArtistDashboard() {
  const [artist, setArtist] = useState(null);
  const [artworks, setArtworks] = useState([]);
  const [commissionRequests, setCommissionRequests] = useState([]);

  const [loading, setLoading] = useState(true);
  const [commissionLoading, setCommissionLoading] = useState(false);
  const [pricingLoading, setPricingLoading] = useState(false);

  const [pricingRequest, setPricingRequest] = useState(null);
  const [agreedPrice, setAgreedPrice] = useState("");

  const [error, setError] = useState("");
 
  const [shippingLoading, setShippingLoading] = useState(false);






  const handleDeleteArtwork = async (artworkId) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this artwork?"
    );

    if (!confirmed) return;

    setError("");

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setError("You must be logged in.");
      return;
    }

    const { data: artistProfile, error: artistError } =
      await supabase
        .from("artist_profiles")
        .select("id")
        .eq("user_id", user.id)
        .maybeSingle();

    if (artistError) {
      setError(artistError.message);
      return;
    }

    if (!artistProfile) {
      setError("Artist profile not found.");
      return;
    }

    const { data: images, error: imageFetchError } =
      await supabase
        .from("artwork_images")
        .select("id, storage_path")
        .eq("artwork_id", artworkId);

    if (imageFetchError) {
      setError(imageFetchError.message);
      return;
    }

    if (images && images.length > 0) {
      const storagePaths = images.map(
        (image) => image.storage_path
      );

      const { error: storageError } = await supabase.storage
        .from("artwork-images")
        .remove(storagePaths);

      if (storageError) {
        setError(storageError.message);
        return;
      }
    }

    const { error: deleteError } = await supabase
      .from("artworks")
      .delete()
      .eq("id", artworkId)
      .eq("artist_id", artistProfile.id);

    if (deleteError) {
      setError(deleteError.message);
      return;
    }

    setArtworks((current) =>
      current.filter((artwork) => artwork.id !== artworkId)
    );
  };

  const updateCommissionStatus = async (requestId, status) => {
    setCommissionLoading(true);
    setError("");

    const { error } = await supabase
      .from("commission_requests")
      .update({
        status,
        updated_at: new Date().toISOString(),
      })
      .eq("id", requestId);

    if (error) {
      console.error("Commission update error:", error);
      setError(error.message);
      setCommissionLoading(false);
      return;
    }

    setCommissionRequests((current) =>
      current.map((request) =>
        request.id === requestId
          ? {
            ...request,
            status,
          }
          : request
      )
    );

    setCommissionLoading(false);
  };

  

const markCommissionShipped = async (request) => {
  const order = request.commission_order;

  if (!order?.id) {
    setError("Commission order not found.");
    return;
  }

  setShippingLoading(true);
  setError("");

  try {
    const { data, error } = await supabase
      .from("commission_orders")
      .update({
        status: "SHIPPED",
        shipped_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", order.id)
      .eq("artist_id", artist.id)
      .eq("payment_status", "PAID")
      .eq("status", "IN_PROGRESS")
      .select()
      .maybeSingle();

    if (error) throw error;

    if (!data) {
      throw new Error(
        "Order could not be updated. Check its status and database permissions."
      );
    }

    setCommissionRequests((current) =>
      current.map((item) =>
        item.id === request.id
          ? {
              ...item,
              commission_order: {
                ...item.commission_order,
                ...data,
              },
            }
          : item
      )
    );
  } catch (err) {
    console.error("Mark commission shipped error:", err);
    setError(err.message || "Could not update commission status.");
  } finally {
    setShippingLoading(false);
  }
};


  const saveCommissionPrice = async (requestId) => {
    const price = Number(agreedPrice);

    if (!price || price <= 0) {
      setError("Please enter a valid commission price.");
      return;
    }

    setPricingLoading(true);
    setError("");

    const { error } = await supabase
      .from("commission_requests")
      .update({
        agreed_price: price,
        status: "ACCEPTED",
        updated_at: new Date().toISOString(),
      })
      .eq("id", requestId);

    if (error) {
      console.error("Commission price error:", error);
      setError(error.message);
      setPricingLoading(false);
      return;
    }

    setCommissionRequests((current) =>
      current.map((request) =>
        request.id === requestId
          ? {
            ...request,
            agreed_price: price,
            status: "ACCEPTED",
          }
          : request
      )
    );

    setPricingRequest(null);
    setAgreedPrice("");
    setPricingLoading(false);
  };

  useEffect(() => {
    const fetchArtist = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setError("You must be logged in.");
        setLoading(false);
        return;
      }

      const {
        data: artistData,
        error: artistError,
      } = await supabase
        .from("artist_profiles")
        .select(`
          id,
          display_name,
          bio,
          location,
          profile_image,
          commission_enabled
        `)
        .eq("user_id", user.id)
        .maybeSingle();

      if (artistError) {
        setError(artistError.message);
        setLoading(false);
        return;
      }

      if (!artistData) {
        setError("You don't have an artist profile yet.");
        setLoading(false);
        return;
      }

      setArtist(artistData);

      // Fetch artworks
      const {
        data: artworkData,
        error: artworkError,
      } = await supabase
        .from("artworks")
        .select(`
          id,
          title,
          price,
          style,
          medium,
          artwork_images (
            storage_path,
            is_primary,
            display_order
          )
        `)
        .eq("artist_id", artistData.id)
        .order("created_at", { ascending: false });

      if (artworkError) {
        setError(artworkError.message);
        setLoading(false);
        return;
      }

      setArtworks(artworkData || []);

      // Fetch commission requests
      const {
        data: commissionData,
        error: commissionError,
      } = await supabase
        .from("commission_requests")
        .select(`
          id,
          status,
          customer_message,
          requested_style,
          requested_medium,
          requested_dimensions,
          budget,
          agreed_price,
          created_at,
          artwork_id,
          artworks (
            id,
            title
          )
        `)
        .eq("artist_id", artistData.id)
        .order("created_at", { ascending: false });

      if (commissionError) {
        console.error("Commission requests error:", commissionError);
      } else {
        // Fetch commission orders associated with these requests
        const requestIds = (commissionData || []).map(
          (request) => request.id
        );

        let orderData = [];

        if (requestIds.length > 0) {
          const {
            data,
            error: orderError,
          } = await supabase
            .from("commission_orders")
            .select(`
              id,
              commission_request_id,
              status,
              payment_status,
              agreed_price,
              created_at,
              
shipped_at,
completed_at
            `)
            .in("commission_request_id", requestIds);

          if (orderError) {
            console.error("Commission orders error:", orderError);
            setError(orderError.message);
          } else {
            orderData = data || [];
          }
        }

        const requestsWithOrders = (commissionData || []).map(
          (request) => ({
            ...request,
            commission_order:
              orderData.find(
                (order) =>
                  order.commission_request_id === request.id
              ) || null,
          })
        );

        setCommissionRequests(requestsWithOrders);
      }


      setLoading(false);
    };

    fetchArtist();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white">
        <Navbar />

        <main className="mx-auto flex min-h-screen max-w-7xl items-center justify-center px-6 pt-24">
          <div className="text-center">
            <div className="mx-auto mb-5 h-10 w-10 animate-spin rounded-full border-2 border-white/10 border-t-[#b58bd0]" />

            <p className="text-sm tracking-wide text-white/50">
              Loading artist dashboard...
            </p>
          </div>
        </main>
      </div>
    );
  }

  if (error && !artist) {
    return (
      <div className="min-h-screen bg-black text-white">
        <Navbar />

        <main className="mx-auto flex min-h-screen max-w-7xl items-center justify-center px-6 pt-24">
          <div className="rounded-3xl border border-red-400/20 bg-red-500/10 p-8 text-center">
            <p className="text-sm text-red-300">
              {error}
            </p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <Navbar />

      <main className="mx-auto max-w-7xl px-6 pb-24 pt-32 sm:px-10 lg:px-16">

        {/* HEADER */}
        <section className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.04] p-7 shadow-2xl backdrop-blur-xl md:p-10">
          <div className="pointer-events-none absolute -right-32 -top-32 h-80 w-80 rounded-full bg-[#8f5bb7]/15 blur-3xl" />

          <div className="relative flex flex-col gap-8 md:flex-row md:items-center md:justify-between">

            <div className="flex items-center gap-5">
              {artist.profile_image ? (
                <img
                  src={artist.profile_image}
                  alt={artist.display_name}
                  className="h-20 w-20 rounded-full border border-white/15 object-cover"
                />
              ) : (
                <div className="flex h-20 w-20 items-center justify-center rounded-full border border-[#b58bd0]/30 bg-[#8f5bb7]/10 text-2xl">
                  🎨
                </div>
              )}

              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[#b58bd0]">
                  Artist Workspace
                </p>

                <h1
                  className="mt-2 text-4xl font-semibold tracking-tight text-white md:text-5xl"
                  style={{
                    fontFamily:
                      '"Cormorant Garamond", "Bodoni 72", Didot, Georgia, serif',
                  }}
                >
                  {artist.display_name}
                </h1>

                {artist.location && (
                  <p className="mt-2 text-sm text-white/40">
                    {artist.location}
                  </p>
                )}
              </div>
            </div>

            <Link
              to="/artist/add-artwork"
              className="inline-flex w-fit items-center rounded-full bg-[#8f5bb7] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#a66dcc]"
            >
              + Add Artwork
            </Link>
          </div>

          {artist.bio && (
            <p className="relative mt-8 max-w-3xl text-sm leading-7 text-white/50">
              {artist.bio}
            </p>
          )}

          {/* QUICK STATS */}
          <div className="relative mt-8 grid gap-3 sm:grid-cols-3">
            <div className="rounded-2xl border border-white/8 bg-black/20 p-5">
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-white/30">
                Artworks
              </p>

              <p className="mt-2 text-3xl font-semibold text-white">
                {artworks.length}
              </p>
            </div>

            <div className="rounded-2xl border border-white/8 bg-black/20 p-5">
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-white/30">
                Requests
              </p>

              <p className="mt-2 text-3xl font-semibold text-white">
                {commissionRequests.length}
              </p>
            </div>

            <div className="rounded-2xl border border-white/8 bg-black/20 p-5">
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-white/30">
                Commissions
              </p>

              <p className="mt-2 text-3xl font-semibold text-white">
                {artist.commission_enabled ? "Open" : "Closed"}
              </p>
            </div>
          </div>
        </section>

        {/* ERROR */}
        {error && (
          <div className="mt-8 rounded-2xl border border-red-400/20 bg-red-500/10 p-4 text-sm text-red-300">
            {error}
          </div>
        )}

        {/* COMMISSION REQUESTS */}
        <section className="mt-16">
          <div className="mb-8">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[#b58bd0]">
              Client Requests
            </p>

            <h2
              className="mt-3 text-4xl font-semibold text-white md:text-5xl"
              style={{
                fontFamily:
                  '"Cormorant Garamond", "Bodoni 72", Didot, Georgia, serif',
              }}
            >
              Commission Requests
            </h2>

            <p className="mt-3 max-w-2xl text-sm leading-6 text-white/40">
              Review requests, respond to clients and send
              your final commission price.
            </p>
          </div>

          {commissionRequests.length === 0 ? (
            <div className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-10 text-center backdrop-blur-xl">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border border-[#b58bd0]/25 bg-[#8f5bb7]/10 text-xl">
                ✦
              </div>

              <p className="mt-5 text-sm text-white/40">
                No commission requests yet.
              </p>
            </div>
          ) : (
            <div className="space-y-5">
              {commissionRequests.map((request) => (
                <div
                  key={request.id}
                  className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.04] p-6 shadow-2xl backdrop-blur-xl md:p-8"
                >
                  <div className="pointer-events-none absolute -right-20 -top-20 h-56 w-56 rounded-full bg-[#8f5bb7]/10 blur-3xl" />

                  <div className="relative flex flex-col gap-8 lg:flex-row lg:items-start lg:justify-between">

                    <div className="min-w-0 flex-1">

                      {/* TITLE + STATUS */}
                      <div className="flex flex-wrap items-center gap-3">
                        <h3
                          className="text-3xl font-semibold text-white"
                          style={{
                            fontFamily:
                              '"Cormorant Garamond", "Bodoni 72", Didot, Georgia, serif',
                          }}
                        >
                          {request.artworks?.title ||
                            "Commission Request"}
                        </h3>

                        <span className="rounded-full border border-[#b58bd0]/30 bg-[#8f5bb7]/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-[#d8b8ed]">
                          {request.status}
                        </span>
                      </div>

                      {/* CLIENT MESSAGE */}
                      {request.customer_message && (
                        <div className="mt-6 rounded-2xl border border-white/8 bg-black/20 p-5">
                          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-white/30">
                            Client message
                          </p>

                          <p className="mt-3 max-w-3xl leading-7 text-white/65">
                            {request.customer_message}
                          </p>
                        </div>
                      )}

                      {/* DETAILS */}
                      <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">

                        {request.requested_style && (
                          <div className="rounded-2xl border border-white/8 bg-black/20 p-4">
                            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/30">
                              Style
                            </p>

                            <p className="mt-2 text-sm text-white/70">
                              {request.requested_style}
                            </p>
                          </div>
                        )}

                        {request.requested_medium && (
                          <div className="rounded-2xl border border-white/8 bg-black/20 p-4">
                            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/30">
                              Medium
                            </p>

                            <p className="mt-2 text-sm text-white/70">
                              {request.requested_medium}
                            </p>
                          </div>
                        )}

                        {request.requested_dimensions && (
                          <div className="rounded-2xl border border-white/8 bg-black/20 p-4">
                            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/30">
                              Dimensions
                            </p>

                            <p className="mt-2 text-sm text-white/70">
                              {request.requested_dimensions}
                            </p>
                          </div>
                        )}

                        {request.budget && (
                          <div className="rounded-2xl border border-white/8 bg-black/20 p-4">
                            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/30">
                              Client budget
                            </p>

                            <p className="mt-2 text-sm text-white/70">
                              ₹{" "}
                              {Number(
                                request.budget
                              ).toLocaleString("en-IN")}
                            </p>
                          </div>
                        )}
                      </div>

                      {/* AGREED PRICE */}
                      {request.agreed_price && (
                        <div className="mt-6 rounded-2xl border border-[#b58bd0]/20 bg-[#8f5bb7]/[0.07] p-5">
                          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#c7a8dc]">
                            Final price
                          </p>

                          <p
                            className="mt-2 text-3xl font-semibold text-white"
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

                          <p className="mt-1 text-sm text-white/40">
                            {request.commission_order?.payment_status?.toUpperCase() === "PAID"
                              ? "Payment received — commission in progress."
                              : request.commission_order?.status?.toUpperCase() === "AWAITING_PAYMENT"
                                ? "Client accepted your offer — awaiting payment."
                                : request.agreed_price
                                  ? "Offer sent — awaiting client action."
                                  : "Waiting for your response."}
                          </p>
                        </div>
                      )}
                      
{request.commission_order?.payment_status?.toUpperCase() === "PAID" && (
  <div className="mt-4 rounded-2xl border border-white/10 bg-black/20 p-4">
    <p className="text-xs font-semibold uppercase tracking-widest text-purple-300">
      Fulfillment Status
    </p>

    
<p className="mt-2 text-sm font-semibold text-white">
  {{
    IN_PROGRESS: "In Progress",
    SHIPPED: "Shipped",
    COMPLETED: "Completed",
  }[request.commission_order.status?.toUpperCase()] ||
    request.commission_order.status}
</p>

{request.commission_order.status?.toUpperCase() === "IN_PROGRESS" && (
  <button
    type="button"
    onClick={() => markCommissionShipped(request)}
    disabled={shippingLoading}
    className="mt-4 w-full rounded-full bg-[#8f5bb7] px-4 py-3 text-xs font-semibold uppercase tracking-widest text-white hover:bg-[#a66dcc] disabled:opacity-50"
  >
    {shippingLoading ? "Updating..." : "Mark as Shipped"}
  </button>
)}

{request.commission_order.status?.toUpperCase() === "SHIPPED" && (
  <p className="mt-3 text-sm text-white/50">
    Waiting for the customer to confirm delivery.
  </p>
)}

{request.commission_order.status?.toUpperCase() === "COMPLETED" && (
  <p className="mt-3 text-sm text-emerald-300">
    Customer confirmed delivery.
  </p>
)}
</div>
)}
</div>


                    {/* ACTIONS */}
                    <div className="flex flex-wrap gap-3 lg:w-48 lg:flex-col">

                      {request.status === "PENDING" && (
                        <>
                          <button
                            type="button"
                            disabled={commissionLoading}
                            onClick={() =>
                              updateCommissionStatus(
                                request.id,
                                "ACCEPTED"
                              )
                            }
                            className="rounded-full bg-[#8f5bb7] px-5 py-3 text-xs font-semibold uppercase tracking-[0.16em] text-white transition hover:bg-[#a66dcc] disabled:opacity-50"
                          >
                            {commissionLoading
                              ? "Updating..."
                              : "Accept"}
                          </button>

                          <button
                            type="button"
                            disabled={commissionLoading}
                            onClick={() =>
                              updateCommissionStatus(
                                request.id,
                                "REJECTED"
                              )
                            }
                            className="rounded-full border border-red-400/20 bg-red-500/[0.05] px-5 py-3 text-xs font-semibold uppercase tracking-[0.16em] text-red-300 transition hover:bg-red-500/10 disabled:opacity-50"
                          >
                            {commissionLoading
                              ? "Updating..."
                              : "Reject"}
                          </button>
                        </>
                      )}

                      {request.status === "ACCEPTED" &&
                        !request.agreed_price && (
                          <button
                            type="button"
                            onClick={() => {
                              setPricingRequest(request);
                              setAgreedPrice(
                                request.budget
                                  ? String(request.budget)
                                  : ""
                              );
                            }}
                            className="rounded-full bg-[#8f5bb7] px-5 py-3 text-xs font-semibold uppercase tracking-[0.16em] text-white transition hover:bg-[#a66dcc]"
                          >
                            Set final price
                          </button>
                        )}

                      {request.status === "ACCEPTED" &&
                        request.agreed_price && (
                          <div>
                            <p>
                              {request.commission_order?.payment_status?.toUpperCase() === "PAID"
                                ? "PAYMENT RECEIVED"
                                : request.commission_order?.status?.toUpperCase() === "AWAITING_PAYMENT"
                                  ? "AWAITING PAYMENT"
                                  : request.agreed_price
                                    ? "OFFER SENT"
                                    : "REQUEST RECEIVED"}
                            </p>

                            <p>
                              {request.commission_order?.payment_status?.toUpperCase() === "PAID"
                                ? "Commission in progress."
                                : request.commission_order?.status?.toUpperCase() === "AWAITING_PAYMENT"
                                  ? "Client accepted. Waiting for payment."
                                  : request.agreed_price
                                    ? "Waiting for client."
                                    : "Review this request."}
                            </p>
                          </div>
                        )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
        




        {/* Sales Orders Card */}
        <section className="mt-10">
          <div className="mb-5">
            <p className="text-xs uppercase tracking-[0.2em] text-[#b58bd0]">
              Orders & Fulfillment
            </p>
            <h2 className="mt-2 font-serif text-3xl text-white">
              Sales Orders
            </h2>
            <p className="mt-2 text-sm text-white/50">
              Manage purchases containing your artworks.
            </p>
          </div>

          <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#09070b] p-4 sm:p-6">
            <ArtistOrder />
          </div>
        </section>



        {/* ARTWORKS */}
        <section className="mt-20">
          <div className="mb-8 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[#b58bd0]">
                Your Work
              </p>

              <h2
                className="mt-3 text-4xl font-semibold text-white md:text-5xl"
                style={{
                  fontFamily:
                    '"Cormorant Garamond", "Bodoni 72", Didot, Georgia, serif',
                }}
              >
                My Artworks
              </h2>
            </div>

            <Link
              to="/artist/add-artwork"
              className="inline-flex w-fit rounded-full bg-[#8f5bb7] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#a66dcc]"
            >
              + Add Artwork
            </Link>
          </div>

          {artworks.length === 0 ? (
            <div className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-10 text-center backdrop-blur-xl">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border border-[#b58bd0]/25 bg-[#8f5bb7]/10 text-xl">
                ✦
              </div>

              <p className="mt-5 text-sm text-white/40">
                You haven't added any artworks yet.
              </p>

              <Link
                to="/artist/add-artwork"
                className="mt-6 inline-flex rounded-full border border-[#b58bd0]/30 bg-[#8f5bb7]/10 px-6 py-3 text-sm font-semibold text-[#d8b8ed] transition hover:bg-[#8f5bb7]/20"
              >
                Add your first artwork
              </Link>
            </div>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {artworks.map((artwork) => {
                const primaryImage =
                  artwork.artwork_images?.find(
                    (image) => image.is_primary
                  );

                const imageUrl = primaryImage
                  ? supabase.storage
                    .from("artwork-images")
                    .getPublicUrl(
                      primaryImage.storage_path
                    ).data.publicUrl
                  : null;

                return (
                  <div
                    key={artwork.id}
                    className="group relative overflow-hidden rounded-[1.5rem] border border-white/10 bg-white/[0.04] p-4 shadow-xl backdrop-blur-xl transition duration-300 hover:-translate-y-1 hover:border-[#b58bd0]/30"
                  >
                    {/* PURPLE GLOW */}
                    <div className="pointer-events-none absolute -inset-4 rounded-[2rem] bg-[#8f5bb7]/10 opacity-0 blur-2xl transition duration-500 group-hover:opacity-100" />

                    <div className="relative">
                      {imageUrl ? (
                        <img
                          src={imageUrl}
                          alt={artwork.title}
                          className="aspect-[4/5] w-full rounded-xl object-cover transition duration-500 group-hover:scale-[1.02]"
                        />
                      ) : (
                        <div className="flex aspect-[4/5] items-center justify-center rounded-xl bg-white/[0.05]">
                          <span className="text-sm text-white/25">
                            No image
                          </span>
                        </div>
                      )}

                      <h3
                        className="mt-5 text-2xl font-semibold text-white"
                        style={{
                          fontFamily:
                            '"Cormorant Garamond", "Bodoni 72", Didot, Georgia, serif',
                        }}
                      >
                        {artwork.title}
                      </h3>

                      {artwork.style && (
                        <p className="mt-2 text-sm text-white/40">
                          {artwork.style}
                        </p>
                      )}

                      {artwork.medium && (
                        <p className="mt-1 text-sm text-white/30">
                          {artwork.medium}
                        </p>
                      )}

                      {artwork.price && (
                        <p className="mt-4 text-sm font-semibold text-white">
                          ₹{" "}
                          {Number(
                            artwork.price
                          ).toLocaleString("en-IN")}
                        </p>
                      )}

                      <Link
                        to={`/artwork/${artwork.id}`}
                        className="mt-5 block rounded-full border border-[#b58bd0]/30 bg-[#8f5bb7]/10 px-4 py-3 text-center text-xs font-semibold uppercase tracking-[0.14em] text-[#d8b8ed] transition hover:bg-[#8f5bb7]/20"
                      >
                        View Artwork
                      </Link>

                      <Link
                        to={`/artist/edit-artwork/${artwork.id}`}
                        className="mt-3 block rounded-full border border-white/10 bg-white/[0.03] px-4 py-3 text-center text-xs font-semibold uppercase tracking-[0.14em] text-white/60 transition hover:border-white/20 hover:bg-white/[0.08] hover:text-white"
                      >
                        Edit Artwork
                      </Link>

                      <button
                        type="button"
                        onClick={() =>
                          handleDeleteArtwork(artwork.id)
                        }
                        className="mt-3 w-full rounded-full border border-red-400/20 bg-red-500/[0.04] px-4 py-3 text-xs font-semibold uppercase tracking-[0.14em] text-red-300 transition hover:bg-red-500/10"
                      >
                        Delete Artwork
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </main>

      {/* PRICE MODAL */}
      {pricingRequest && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/75 px-6 backdrop-blur-md">
          <div className="w-full max-w-lg rounded-[2rem] border border-white/10 bg-[#111011] p-7 shadow-2xl md:p-8">

            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[#b58bd0]">
              Commission Offer
            </p>

            <h2
              className="mt-3 text-4xl font-semibold text-white"
              style={{
                fontFamily:
                  '"Cormorant Garamond", "Bodoni 72", Didot, Georgia, serif',
              }}
            >
              Set your final price
            </h2>

            <p className="mt-3 text-sm text-white/45">
              {pricingRequest.artworks?.title}
            </p>

            {pricingRequest.budget && (
              <div className="mt-5 rounded-2xl border border-white/8 bg-white/[0.03] p-4">
                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/30">
                  Client budget
                </p>

                <p className="mt-2 text-sm text-white/70">
                  ₹{" "}
                  {Number(
                    pricingRequest.budget
                  ).toLocaleString("en-IN")}
                </p>
              </div>
            )}

            <div className="mt-6">
              <label className="text-xs font-semibold uppercase tracking-[0.18em] text-white/40">
                Final price
              </label>

              <div className="mt-2 flex items-center overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04]">
                <span className="px-4 text-white/40">
                  ₹
                </span>

                <input
                  type="number"
                  min="1"
                  value={agreedPrice}
                  onChange={(event) =>
                    setAgreedPrice(event.target.value)
                  }
                  placeholder="Enter amount"
                  className="w-full bg-transparent px-2 py-4 text-white outline-none placeholder:text-white/20"
                />
              </div>
            </div>

            <div className="mt-8 flex gap-3">
              <button
                type="button"
                onClick={() => {
                  setPricingRequest(null);
                  setAgreedPrice("");
                }}
                className="flex-1 rounded-full border border-white/10 bg-white/[0.03] px-5 py-3 text-xs font-semibold uppercase tracking-[0.16em] text-white/60 transition hover:bg-white/[0.08] hover:text-white"
              >
                Cancel
              </button>

              <button
                type="button"
                disabled={pricingLoading}
                onClick={() =>
                  saveCommissionPrice(
                    pricingRequest.id
                  )
                }
                className="flex-1 rounded-full bg-[#8f5bb7] px-5 py-3 text-xs font-semibold uppercase tracking-[0.16em] text-white transition hover:bg-[#a66dcc] disabled:opacity-50"
              >
                {pricingLoading
                  ? "Saving..."
                  : "Send offer"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ArtistDashboard;