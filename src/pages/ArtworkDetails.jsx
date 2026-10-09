
import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { supabase } from "../lib/supabase";
import Navbar from "../components/Navbar";

function ArtworkDetails() {
    const { id } = useParams();

    const [artwork, setArtwork] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [isFavourite, setIsFavourite] = useState(false);

    const [showCommissionForm, setShowCommissionForm] = useState(false);
    const [commissionMessage, setCommissionMessage] = useState("");
    const [commissionStyle, setCommissionStyle] = useState("");
    const [commissionMedium, setCommissionMedium] = useState("");
    const [commissionDimensions, setCommissionDimensions] = useState("");
    const [commissionBudget, setCommissionBudget] = useState("");
    const [commissionLoading, setCommissionLoading] = useState(false);
    const [commissionSuccess, setCommissionSuccess] = useState("");

    const primaryImage = artwork?.artwork_images?.find(
        (image) => image.is_primary
    );

    const imageUrl = primaryImage
        ? supabase.storage
              .from("artwork-images")
              .getPublicUrl(primaryImage.storage_path).data.publicUrl
        : null;

    useEffect(() => {
        const fetchArtwork = async () => {
            setLoading(true);

            const { data, error } = await supabase
                .from("artworks")
                .select(`
                    *,
                    artist_profiles (
                        display_name,
                        id
                    ),
                    artwork_images (
                        storage_path,
                        is_primary,
                        display_order
                    )
                `)
                .eq("id", id)
                .single();

            if (error) {
                setError(error.message);
                setLoading(false);
                return;
            }

            const {
                data: { user },
            } = await supabase.auth.getUser();

            if (user) {
                const { data: favourite } = await supabase
                    .from("favourites")
                    .select("id")
                    .eq("user_id", user.id)
                    .eq("artwork_id", id)
                    .maybeSingle();

                setIsFavourite(!!favourite);
            }

            setArtwork(data);
            setLoading(false);
        };

        fetchArtwork();
    }, [id]);

    const toggleFavourite = async () => {
        const {
            data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
            setError("Please sign in to manage your favourites.");
            return;
        }

        if (isFavourite) {
            const { error } = await supabase
                .from("favourites")
                .delete()
                .eq("user_id", user.id)
                .eq("artwork_id", id);

            if (!error) {
                setIsFavourite(false);
            }
        } else {
            const { error } = await supabase.from("favourites").insert({
                user_id: user.id,
                artwork_id: id,
            });

            if (!error) {
                setIsFavourite(true);
            }
        }
    };

    const addToCart = async () => {
        const {
            data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
            setError("Please sign in before adding artwork to your cart.");
            return;
        }

        if (artwork.listing_type !== "SALE") {
            return;
        }

        const { data: existingItem } = await supabase
            .from("cart_items")
            .select("id, quantity")
            .eq("user_id", user.id)
            .eq("artwork_id", artwork.id)
            .maybeSingle();

        if (existingItem) {
            const { error } = await supabase
                .from("cart_items")
                .update({
                    quantity: existingItem.quantity + 1,
                })
                .eq("id", existingItem.id);

            if (error) {
                setError(error.message);
                return;
            }
        } else {
            const { error } = await supabase.from("cart_items").insert({
                user_id: user.id,
                artwork_id: artwork.id,
                quantity: 1,
            });

            if (error) {
                setError(error.message);
                return;
            }
        }

        setError("");
        alert("Artwork added to your cart.");
    };

    const submitCommission = async (event) => {
        event.preventDefault();

        setCommissionLoading(true);
        setCommissionSuccess("");
        setError("");

        const {
            data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
            setError("Please sign in before requesting a commission.");
            setCommissionLoading(false);
            return;
        }

        if (!commissionMessage.trim()) {
            setError(
                "Please describe what you would like the artist to create."
            );
            setCommissionLoading(false);
            return;
        }

        const { error } = await supabase
            .from("commission_requests")
            .insert({
                buyer_id: user.id,
                artwork_id: artwork.id,
                artist_id: artwork.artist_profiles.id,
                customer_message: commissionMessage.trim(),
                requested_style: commissionStyle.trim() || null,
                requested_medium: commissionMedium.trim() || null,
                requested_dimensions:
                    commissionDimensions.trim() || null,
                budget: commissionBudget
                    ? Number(commissionBudget)
                    : null,
            });

        if (error) {
            console.error("Commission request error:", error);
            setError(error.message);
            setCommissionLoading(false);
            return;
        }

        setCommissionSuccess(
            "Your commission request has been sent to the artist."
        );

        setCommissionMessage("");
        setCommissionStyle("");
        setCommissionMedium("");
        setCommissionDimensions("");
        setCommissionBudget("");
        setCommissionLoading(false);
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-black text-white">
                <Navbar />

                <main className="px-6 pb-20 pt-32 sm:px-10 lg:px-16">
                    <div className="mx-auto max-w-7xl">
                        <p className="text-white/50">
                            Loading artwork...
                        </p>
                    </div>
                </main>
            </div>
        );
    }

    if (error && !artwork) {
        return (
            <div className="min-h-screen bg-black text-white">
                <Navbar />

                <main className="px-6 pb-20 pt-32 sm:px-10 lg:px-16">
                    <div className="mx-auto max-w-7xl">
                        <p className="rounded-2xl border border-red-400/20 bg-red-500/10 p-5 text-red-300">
                            Error: {error}
                        </p>
                    </div>
                </main>
            </div>
        );
    }

    if (!artwork) {
        return (
            <div className="min-h-screen bg-black text-white">
                <Navbar />

                <main className="px-6 pb-20 pt-32 sm:px-10 lg:px-16">
                    <div className="mx-auto max-w-7xl">
                        <p className="text-white/50">
                            Artwork not found.
                        </p>
                    </div>
                </main>
            </div>
        );
    }

    const isSale = artwork.listing_type === "SALE";
    const isCommission = artwork.listing_type === "COMMISSION";
    const isReference = artwork.listing_type === "REFERENCE";

    return (
        <div className="min-h-screen bg-black text-white">
            <Navbar />

            <main className="relative px-6 pb-24 pt-32 sm:px-10 lg:px-16">
                {/* Ambient purple glow */}
                <div className="pointer-events-none fixed left-[20%] top-40 -z-0 h-96 w-96 rounded-full bg-[#8f5bb7]/10 blur-[150px]" />

                <div className="relative z-10 mx-auto max-w-7xl">
                    <div className="grid gap-12 lg:grid-cols-[1.1fr_0.9fr] lg:items-start">
                        {/* IMAGE */}
                        <div className="relative">
                            <div className="absolute -inset-5 rounded-[2rem] bg-[#8f5bb7]/20 blur-3xl" />

                            <div className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.03] shadow-2xl">
                                {imageUrl ? (
                                    <img
                                        src={imageUrl}
                                        alt={artwork.title}
                                        className="aspect-[4/5] h-full w-full object-cover"
                                    />
                                ) : (
                                    <div className="flex aspect-[4/5] items-center justify-center text-white/30">
                                        Artwork image
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* INFORMATION */}
                        <div className="lg:pt-4">
                            <div className="flex items-center justify-between gap-4">
                                <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[#b58bd0]">
                                    {isSale && "Available artwork"}
                                    {isCommission && "Commission artwork"}
                                    {isReference && "Reference artwork"}
                                </p>

                                <span className="rounded-full border border-[#8f5bb7]/30 bg-[#8f5bb7]/10 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.15em] text-[#d8b8ed]">
                                    {artwork.listing_type}
                                </span>
                            </div>

                            <h1
                                className="mt-5 text-5xl leading-[0.95] tracking-tight text-white sm:text-6xl"
                                style={{
                                    fontFamily:
                                        '"Cormorant Garamond", Georgia, serif',
                                }}
                            >
                                {artwork.title}
                            </h1>

                            <Link
                                to={`/artists/${artwork.artist_profiles?.id}`}
                                className="mt-5 inline-block text-lg text-white/50 transition hover:text-[#c99ee5]"
                            >
                                {artwork.artist_profiles?.display_name}
                            </Link>

                            <div className="my-8 h-px bg-white/10" />

                            {/* DESCRIPTION */}
                            {artwork.description && (
                                <div>
                                    <h2 className="text-[10px] font-semibold uppercase tracking-[0.25em] text-white/35">
                                        About the artwork
                                    </h2>

                                    <p className="mt-4 max-w-xl text-base leading-8 text-white/65">
                                        {artwork.description}
                                    </p>
                                </div>
                            )}

                            {/* DETAILS */}
                            <div className="mt-10 grid gap-5 sm:grid-cols-2">
                                {artwork.medium && (
                                    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                                        <p className="text-[10px] uppercase tracking-[0.2em] text-white/35">
                                            Medium
                                        </p>

                                        <p className="mt-2 text-sm text-white/80">
                                            {artwork.medium}
                                        </p>
                                    </div>
                                )}

                                {artwork.style && (
                                    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                                        <p className="text-[10px] uppercase tracking-[0.2em] text-white/35">
                                            Style
                                        </p>

                                        <p className="mt-2 text-sm text-white/80">
                                            {artwork.style}
                                        </p>
                                    </div>
                                )}

                                {artwork.dimensions && (
                                    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                                        <p className="text-[10px] uppercase tracking-[0.2em] text-white/35">
                                            Dimensions
                                        </p>

                                        <p className="mt-2 text-sm text-white/80">
                                            {artwork.dimensions}
                                        </p>
                                    </div>
                                )}

                                <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                                    <p className="text-[10px] uppercase tracking-[0.2em] text-white/35">
                                        Type
                                    </p>

                                    <p className="mt-2 text-sm text-white/80">
                                        {artwork.is_original
                                            ? "Original artwork"
                                            : "Print"}
                                    </p>
                                </div>
                            </div>

                            {/* SALE */}
                            {isSale && (
                                <div className="mt-10 border-t border-white/10 pt-8">
                                    <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-white/35">
                                        Price
                                    </p>

                                    <p
                                        className="mt-3 text-4xl text-white"
                                        style={{
                                            fontFamily:
                                                '"Cormorant Garamond", Georgia, serif',
                                        }}
                                    >
                                        ₹{" "}
                                        {Number(
                                            artwork.price
                                        ).toLocaleString("en-IN")}
                                    </p>

                                    <button
                                        onClick={addToCart}
                                        className="mt-7 w-full rounded-full bg-[#8f5bb7] px-6 py-4 text-sm font-semibold text-white transition hover:bg-[#a66bd0]"
                                    >
                                        Add to cart
                                    </button>
                                </div>
                            )}

                            {/* COMMISSION */}
                            {isCommission && (
                                <div className="mt-10 border-t border-white/10 pt-8">
                                    <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-[#b58bd0]">
                                        Custom artwork
                                    </p>

                                    <p className="mt-3 text-sm leading-7 text-white/50">
                                        Request a custom artwork from this
                                        artist. The final price will be agreed
                                        with the artist before payment.
                                    </p>

                                    {!showCommissionForm ? (
                                        <button
                                            onClick={() =>
                                                setShowCommissionForm(true)
                                            }
                                            className="mt-7 w-full rounded-full bg-[#8f5bb7] px-6 py-4 text-sm font-semibold text-white transition hover:bg-[#a66bd0]"
                                        >
                                            Request a commission
                                        </button>
                                    ) : (
                                        <form
                                            onSubmit={submitCommission}
                                            className="mt-7 space-y-5"
                                        >
                                            <div>
                                                <label className="text-[10px] uppercase tracking-[0.2em] text-white/35">
                                                    What would you like created?
                                                </label>

                                                <textarea
                                                    value={commissionMessage}
                                                    onChange={(event) =>
                                                        setCommissionMessage(
                                                            event.target.value
                                                        )
                                                    }
                                                    rows={5}
                                                    placeholder="Describe your idea..."
                                                    className="mt-2 w-full resize-none rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white outline-none placeholder:text-white/25 focus:border-[#8f5bb7]"
                                                />
                                            </div>

                                            <div className="grid gap-4 sm:grid-cols-2">
                                                <input
                                                    value={commissionStyle}
                                                    onChange={(event) =>
                                                        setCommissionStyle(
                                                            event.target.value
                                                        )
                                                    }
                                                    placeholder="Preferred style"
                                                    className="rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white outline-none placeholder:text-white/25 focus:border-[#8f5bb7]"
                                                />

                                                <input
                                                    value={commissionMedium}
                                                    onChange={(event) =>
                                                        setCommissionMedium(
                                                            event.target.value
                                                        )
                                                    }
                                                    placeholder="Preferred medium"
                                                    className="rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white outline-none placeholder:text-white/25 focus:border-[#8f5bb7]"
                                                />

                                                <input
                                                    value={commissionDimensions}
                                                    onChange={(event) =>
                                                        setCommissionDimensions(
                                                            event.target.value
                                                        )
                                                    }
                                                    placeholder="Dimensions"
                                                    className="rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white outline-none placeholder:text-white/25"
                                                />

                                                <input
                                                    type="number"
                                                    min="0"
                                                    value={commissionBudget}
                                                    onChange={(event) =>
                                                        setCommissionBudget(
                                                            event.target.value
                                                        )
                                                    }
                                                    placeholder="Budget (₹)"
                                                    className="rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white outline-none placeholder:text-white/25 focus:border-[#8f5bb7]"
                                                />
                                            </div>

                                            <button
                                                type="submit"
                                                disabled={commissionLoading}
                                                className="w-full rounded-full bg-[#8f5bb7] px-6 py-4 text-sm font-semibold text-white transition hover:bg-[#a66bd0] disabled:opacity-50"
                                            >
                                                {commissionLoading
                                                    ? "Sending..."
                                                    : "Send commission request"}
                                            </button>
                                        </form>
                                    )}

                                    {commissionSuccess && (
                                        <p className="mt-5 rounded-2xl border border-[#8f5bb7]/30 bg-[#8f5bb7]/10 p-4 text-sm text-[#d8b8ed]">
                                            {commissionSuccess}
                                        </p>
                                    )}
                                </div>
                            )}

                            {/* REFERENCE */}
                            {isReference && (
                                <div className="mt-10 border-t border-white/10 pt-8">
                                    <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-[#b58bd0]">
                                        Reference only
                                    </p>

                                    <p className="mt-3 text-sm leading-7 text-white/50">
                                        This artwork is available for inspiration
                                        and reference. It is not currently
                                        available for purchase.
                                    </p>
                                </div>
                            )}

                            {/* FAVOURITE */}
                            <button
                                onClick={toggleFavourite}
                                className={`mt-6 w-full rounded-full border px-6 py-3 text-sm font-semibold transition ${
                                    isFavourite
                                        ? "border-[#8f5bb7]/50 bg-[#8f5bb7]/15 text-[#d8b8ed]"
                                        : "border-white/10 bg-white/[0.03] text-white/60 hover:border-[#8f5bb7]/40 hover:bg-[#8f5bb7]/10 hover:text-white"
                                }`}
                            >
                                {isFavourite
                                    ? "♥ Remove from favourites"
                                    : "♡ Add to favourites"}
                            </button>

                            {error && (
                                <p className="mt-5 rounded-xl border border-red-400/20 bg-red-500/10 p-4 text-sm text-red-300">
                                    {error}
                                </p>
                            )}
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}

export default ArtworkDetails;
