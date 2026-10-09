import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../lib/supabase";
import Navbar from "../components/Navbar";

function Orders() {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        const fetchOrders = async () => {
            setLoading(true);
            setError("");

            const {
                data: { user },
            } = await supabase.auth.getUser();

            if (!user) {
                setError("Please sign in to view your orders.");
                setLoading(false);
                return;
            }

            const { data, error } = await supabase
                .from("orders")
                .select(`
                    id,
                    total_amount,
                    status,
                    payment_status,
                    razorpay_payment_id,
                    paid_at,
                    created_at,
                    order_items (
                        id,
                        artwork_id,
                        quantity,
                        unit_price,
                        artworks (
                            id,
                            title,
                            artist_profiles (
                                display_name
                            ),
                            artwork_images (
                                storage_path,
                                is_primary
                            )
                        )
                    )
                `)
                .eq("user_id", user.id)
                .order("created_at", {
                    ascending: false,
                });

            if (error) {
                console.error("Orders error:", error);
                setError(error.message);
                setLoading(false);
                return;
            }

            setOrders(data || []);
            setLoading(false);
        };

        fetchOrders();
    }, []);

    if (loading) {
        return (
            <div className="min-h-screen bg-black text-white">
                <Navbar />

                <main className="px-6 pb-20 pt-32 sm:px-10 lg:px-16">
                    <div className="mx-auto max-w-7xl">
                        <p className="text-white/50">
                            Loading your orders...
                        </p>
                    </div>
                </main>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-black text-white">
            <Navbar />

            <main className="relative px-6 pb-20 pt-32 sm:px-10 lg:px-16">
                {/* subtle purple ambient glow */}
                <div className="pointer-events-none fixed left-1/2 top-40 -z-0 h-96 w-96 -translate-x-1/2 rounded-full bg-[#8f5bb7]/10 blur-[140px]" />

                <div className="relative z-10 mx-auto max-w-7xl">
                    {/* HEADER */}
                    <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[#b58bd0]">
                            Your collection
                        </p>

                        <h1
                            className="mt-4 text-5xl font-medium tracking-tight text-white sm:text-6xl"
                            style={{
                                fontFamily:
                                    '"Cormorant Garamond", Georgia, serif',
                            }}
                        >
                            Your Orders
                        </h1>

                        <p className="mt-4 max-w-xl text-sm leading-7 text-white/50">
                            View your artwork purchases, payment details and
                            delivery progress.
                        </p>
                    </div>

                    {/* ERROR */}
                    {error && (
                        <div className="mt-8 rounded-2xl border border-red-400/20 bg-red-500/10 px-5 py-4 text-sm text-red-300">
                            {error}
                        </div>
                    )}

                    {/* EMPTY */}
                    {orders.length === 0 ? (
                        <div className="mt-12 rounded-[2rem] border border-white/10 bg-white/[0.04] px-8 py-20 text-center backdrop-blur-xl">
                            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border border-[#8f5bb7]/30 bg-[#8f5bb7]/10 text-2xl">
                                🖼️
                            </div>

                            <p
                                className="mt-6 text-3xl text-white"
                                style={{
                                    fontFamily:
                                        '"Cormorant Garamond", Georgia, serif',
                                }}
                            >
                                No orders yet.
                            </p>

                            <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-white/45">
                                Your purchased artworks will appear here.
                            </p>

                            <Link
                                to="/explore"
                                className="mt-8 inline-flex rounded-full bg-[#8f5bb7] px-7 py-3 text-sm font-semibold text-white transition hover:bg-[#a66bd0]"
                            >
                                Explore Artwork
                            </Link>
                        </div>
                    ) : (
                        <div className="mt-12 space-y-7">
                            {orders.map((order) => (
                                <div
                                    key={order.id}
                                    className="overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.04] shadow-2xl backdrop-blur-xl"
                                >
                                    {/* ORDER HEADER */}
                                    <div className="border-b border-white/10 p-6 sm:p-8">
                                        <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
                                            <div>
                                                <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-[#b58bd0]">
                                                    Order
                                                </p>

                                                <p className="mt-2 break-all text-xs text-white/40">
                                                    {order.id}
                                                </p>
                                            </div>

                                            <div className="sm:text-right">
                                                <p
                                                    className="text-3xl text-white"
                                                    style={{
                                                        fontFamily:
                                                            '"Cormorant Garamond", Georgia, serif',
                                                    }}
                                                >
                                                    ₹{" "}
                                                    {Number(
                                                        order.total_amount
                                                    ).toLocaleString("en-IN")}
                                                </p>

                                                <p className="mt-1 text-xs text-white/40">
                                                    {new Date(
                                                        order.created_at
                                                    ).toLocaleDateString(
                                                        "en-IN"
                                                    )}
                                                </p>
                                            </div>
                                        </div>

                                        {/* STATUS */}
                                        <div className="mt-6 flex flex-wrap gap-2">
                                            <span className="rounded-full border border-[#8f5bb7]/30 bg-[#8f5bb7]/10 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.15em] text-[#d8b8ed]">
                                                {order.status}
                                            </span>

                                            <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.15em] text-white/50">
                                                Payment: {order.payment_status}
                                            </span>
                                        </div>
                                    </div>

                                    {/* TRACKING */}
                                    <div className="border-b border-white/10 p-6 sm:p-8">
                                        <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-white/40">
                                            Order progress
                                        </p>

                                        <div className="mt-7">
                                            <div className="flex items-center">
                                                {[
                                                    "CONFIRMED",
                                                    "PROCESSING",
                                                    "SHIPPED",
                                                    "DELIVERED",
                                                ].map((step, index, steps) => {
                                                    const currentIndex =
                                                        steps.indexOf(
                                                            order.status
                                                        );

                                                    const stepIndex =
                                                        steps.indexOf(step);

                                                    const completed =
                                                        stepIndex <=
                                                        currentIndex;

                                                    return (
                                                        <div
                                                            key={step}
                                                            className="flex flex-1 items-center"
                                                        >
                                                            <div
                                                                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-semibold transition ${
                                                                    completed
                                                                        ? "bg-[#8f5bb7] text-white shadow-lg shadow-[#8f5bb7]/20"
                                                                        : "border border-white/10 bg-white/[0.04] text-white/30"
                                                                }`}
                                                            >
                                                                {completed
                                                                    ? "✓"
                                                                    : index +
                                                                      1}
                                                            </div>

                                                            {index <
                                                                steps.length -
                                                                    1 && (
                                                                <div
                                                                    className={`mx-2 h-px flex-1 ${
                                                                        stepIndex <
                                                                        currentIndex
                                                                            ? "bg-[#8f5bb7]"
                                                                            : "bg-white/10"
                                                                    }`}
                                                                />
                                                            )}
                                                        </div>
                                                    );
                                                })}
                                            </div>

                                            <div className="mt-3 flex justify-between text-[9px] uppercase tracking-[0.12em] text-white/30 sm:text-[10px]">
                                                <span>Confirmed</span>
                                                <span>Processing</span>
                                                <span>Shipped</span>
                                                <span>Delivered</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* ITEMS */}
                                    <div className="space-y-4 p-6 sm:p-8">
                                        {order.order_items?.map((item) => {
                                            const artwork = Array.isArray(
                                                item.artworks
                                            )
                                                ? item.artworks[0]
                                                : item.artworks;

                                            const primaryImage =
                                                artwork?.artwork_images?.find(
                                                    (image) =>
                                                        image.is_primary
                                                );

                                            const imageUrl = primaryImage
                                                ? supabase.storage
                                                      .from(
                                                          "artwork-images"
                                                      )
                                                      .getPublicUrl(
                                                          primaryImage.storage_path
                                                      ).data.publicUrl
                                                : null;

                                            return (
                                                <div
                                                    key={item.id}
                                                    className="flex gap-5 rounded-2xl border border-white/10 bg-black/30 p-4 transition hover:border-[#8f5bb7]/30"
                                                >
                                                    <Link
                                                        to={`/artwork/${artwork?.id}`}
                                                        className="h-24 w-20 shrink-0 overflow-hidden rounded-xl bg-white/[0.05]"
                                                    >
                                                        {imageUrl ? (
                                                            <img
                                                                src={imageUrl}
                                                                alt={
                                                                    artwork?.title
                                                                }
                                                                className="h-full w-full object-cover transition duration-500 hover:scale-105"
                                                            />
                                                        ) : (
                                                            <div className="flex h-full items-center justify-center text-xs text-white/20">
                                                                —
                                                            </div>
                                                        )}
                                                    </Link>

                                                    <div className="min-w-0">
                                                        <Link
                                                            to={`/artwork/${artwork?.id}`}
                                                            className="text-xl text-white transition hover:text-[#c99ee5]"
                                                            style={{
                                                                fontFamily:
                                                                    '"Cormorant Garamond", Georgia, serif',
                                                            }}
                                                        >
                                                            {artwork?.title}
                                                        </Link>

                                                        <p className="mt-1 text-sm text-white/40">
                                                            {
                                                                artwork
                                                                    ?.artist_profiles
                                                                    ?.display_name
                                                            }
                                                        </p>

                                                        <p className="mt-3 text-xs text-white/45">
                                                            Qty{" "}
                                                            {item.quantity}{" "}
                                                            <span className="mx-1 text-white/20">
                                                                ·
                                                            </span>{" "}
                                                            ₹{" "}
                                                            {Number(
                                                                item.unit_price
                                                            ).toLocaleString(
                                                                "en-IN"
                                                            )}
                                                        </p>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* CONTINUE SHOPPING */}
                    <Link
                        to="/explore"
                        className="mt-8 inline-flex rounded-full border border-white/10 bg-white/[0.04] px-6 py-3 text-sm text-white/60 transition hover:border-[#8f5bb7]/40 hover:bg-[#8f5bb7]/10 hover:text-white"
                    >
                        ← Continue shopping
                    </Link>
                </div>
            </main>
        </div>
    );
}

export default Orders;