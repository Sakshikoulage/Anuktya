
import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

const getArtworkImageUrl = (storagePath) => {
    if (!storagePath) return null;

    if (
        storagePath.startsWith("http://") ||
        storagePath.startsWith("https://")
    ) {
        return storagePath;
    }

    const { data } = supabase.storage
        .from("artwork-images")
        .getPublicUrl(storagePath);

    return data?.publicUrl || null;
};

const getRelatedRecord = (record) => {
    return Array.isArray(record) ? record[0] : record;
};

const formatDate = (value, includeTime = false) => {
    if (!value) return "—";

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) return "—";

    return includeTime
        ? date.toLocaleString("en-IN")
        : date.toLocaleDateString("en-IN");
};

const statusClass = (status) => {
    switch (status) {
        case "PAID":
        case "DELIVERED":
            return "border-emerald-400/25 bg-emerald-400/10 text-emerald-300";

        case "CANCELLED":
        case "FAILED":
            return "border-red-400/25 bg-red-400/10 text-red-300";

        case "SHIPPED":
        case "PROCESSING":
            return "border-purple-400/25 bg-purple-400/10 text-purple-200";

        default:
            return "border-white/10 bg-white/[0.05] text-white/65";
    }
};

export default function ArtistOrders() {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [updatingOrderId, setUpdatingOrderId] = useState(null);

    useEffect(() => {
        fetchArtistOrders();
    }, []);

    const fetchArtistOrders = async () => {
        try {
            setLoading(true);
            setError("");

            const {
                data: { user },
                error: userError,
            } = await supabase.auth.getUser();

            if (userError) throw userError;

            if (!user) {
                setError("You must be logged in.");
                return;
            }

            const { data: artistProfile, error: artistError } =
                await supabase
                    .from("artist_profiles")
                    .select("id")
                    .eq("user_id", user.id)
                    .single();

            if (artistError) throw artistError;

            const { data, error: orderError } = await supabase
                .from("order_items")
                .select(`
                    id,
                    order_id,
                    artwork_id,
                    quantity,
                    unit_price,
                    created_at,
                    orders (
                        id,
                        user_id,
                        total_amount,
                        status,
                        payment_status,
                        created_at,
                        paid_at,
                        shipping_full_name,
                        shipping_phone,
                        shipping_address,
                        shipping_city,
                        shipping_state,
                        shipping_postal_code
                    ),
                    artworks (
                        id,
                        title,
                        artwork_images (
                            storage_path,
                            is_primary,
                            display_order
                        )
                    )
                `)
                .eq("artist_id", artistProfile.id)
                .order("created_at", { ascending: false });
                console.log("Artist profile:", artistProfile);
console.log("Artist profile error:", artistError);
console.log("Order items:", data);
console.log("Order query error:", orderError);
                console.log("Full order item:", JSON.stringify(data, null, 2));
                

            if (orderError) throw orderError;

            setOrders(data || []);
        } catch (err) {
            console.error("Artist orders error:", err);
            setError(err.message || "Failed to load orders.");
        } finally {
            setLoading(false);
        }
    };

    const updateOrderStatus = async (orderId, newStatus) => {
        try {
            setError("");
            setUpdatingOrderId(orderId);

            const { error: updateError } = await supabase
                .from("orders")
                .update({
                    status: newStatus,
                    updated_at: new Date().toISOString(),
                })
                .eq("id", orderId);

            if (updateError) throw updateError;

            setOrders((currentOrders) =>
                currentOrders.map((item) => {
                    const order = getRelatedRecord(item.orders);

                    if (order?.id !== orderId) return item;

                    const updatedOrder = {
                        ...order,
                        status: newStatus,
                        updated_at: new Date().toISOString(),
                    };

                    return {
                        ...item,
                        orders: Array.isArray(item.orders)
                            ? [updatedOrder]
                            : updatedOrder,
                    };
                })
            );
        } catch (err) {
            console.error("Order status update error:", err);
            setError(err.message || "Failed to update order status.");
        } finally {
            setUpdatingOrderId(null);
        }
    };

    const fulfillmentAction = (order) => {
        switch (order?.status) {
            case "CONFIRMED":
                return {
                    label: "Start Processing",
                    nextStatus: "PROCESSING",
                };

            case "PROCESSING":
                return {
                    label: "Mark as Shipped",
                    nextStatus: "SHIPPED",
                };

            case "SHIPPED":
                return {
                    label: "Mark as Delivered",
                    nextStatus: "DELIVERED",
                };

            default:
                return null;
        }
    };

    if (loading) {
        return (
            <section className="text-white">
                <div className="h-8 w-48 animate-pulse rounded bg-white/[0.06]" />
                <div className="mt-6 h-40 animate-pulse rounded-2xl border border-white/10 bg-white/[0.03]" />
            </section>
        );
    }

    return (
        <section className="text-white">
            {/* Header */}
            <div className="mb-8">
                <p className="text-xs uppercase tracking-[0.2em] text-[#b58bd0]">
                    Orders & Fulfillment
                </p>

                <div className="mt-3 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                        <h2 className="font-serif text-3xl sm:text-4xl">
                            Sale Orders
                        </h2>
                        <p className="mt-2 text-white/55">
                            Manage purchases containing your artworks.
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={fetchArtistOrders}
                        className="rounded-full border border-white/15 px-5 py-2.5 text-sm transition hover:border-[#8f5bb7] hover:bg-white/[0.05]"
                    >
                        Refresh Orders
                    </button>
                </div>
            </div>

            {error && (
                <div className="mb-6 rounded-xl border border-red-400/25 bg-red-500/10 p-4 text-sm text-red-200">
                    {error}
                </div>
            )}

            {/* Summary */}
            <div className="mb-8 grid gap-4 sm:grid-cols-3">
                <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-5">
                    <p className="text-sm text-white/50">Order items</p>
                    <p className="mt-2 text-3xl font-semibold">
                        {orders.length}
                    </p>
                </div>

                <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-5">
                    <p className="text-sm text-white/50">Paid items</p>
                    <p className="mt-2 text-3xl font-semibold text-emerald-300">
                        {
                            orders.filter(
                                (item) =>
                                    getRelatedRecord(item.orders)
                                        ?.payment_status === "PAID"
                            ).length
                        }
                    </p>
                </div>

                <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-5">
                    <p className="text-sm text-white/50">Awaiting payment</p>
                    <p className="mt-2 text-3xl font-semibold text-[#c49be0]">
                        {
                            orders.filter(
                                (item) =>
                                    getRelatedRecord(item.orders)
                                        ?.payment_status !== "PAID"
                            ).length
                        }
                    </p>
                </div>
            </div>

            {/* Empty state */}
            {!error && orders.length === 0 && (
                <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-6 py-14 text-center">
                    <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#8f5bb7]/15 text-2xl">
                        📦
                    </div>

                    <h3 className="mt-5 font-serif text-2xl">
                        No sale orders yet
                    </h3>

                    <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-white/50">
                        Orders for your artworks will appear here after a
                        customer completes a purchase.
                    </p>
                </div>
            )}

            {/* Orders */}
            <div className="space-y-6">
                {orders.map((item) => {
                    const order = getRelatedRecord(item.orders);
                    const artwork = getRelatedRecord(item.artworks);

                    const images = Array.isArray(artwork?.artwork_images)
                        ? artwork.artwork_images
                        : [];

                    const primaryImage =
                        images.find((image) => image.is_primary) ||
                        [...images].sort(
                            (a, b) =>
                                (a.display_order || 0) -
                                (b.display_order || 0)
                        )[0];

                    const imageUrl = getArtworkImageUrl(
                        primaryImage?.storage_path
                    );

                    const saleTotal =
                        Number(item.unit_price || 0) *
                        Number(item.quantity || 0);

                    const action = fulfillmentAction(order);

                    return (
                        <article
                            key={item.id}
                            className="overflow-hidden rounded-2xl border border-white/10 bg-[#09070b] shadow-[0_20px_70px_rgba(0,0,0,0.2)]"
                        >
                            {/* Order heading */}
                            <div className="flex flex-col gap-4 border-b border-white/10 px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
                                <div>
                                    <p className="text-xs uppercase tracking-[0.15em] text-white/45">
                                        Order ID
                                    </p>
                                    <p className="mt-1 font-mono text-sm text-white/80">
                                        #{order?.id?.slice(0, 8) || "—"}
                                    </p>
                                    <p className="mt-1 text-xs text-white/40">
                                        Placed {formatDate(order?.created_at)}
                                    </p>
                                </div>

                                <div className="flex flex-wrap gap-2">
                                    <span
                                        className={`rounded-full border px-3 py-1.5 text-xs ${statusClass(order?.payment_status)}`}
                                    >
                                        Payment: {order?.payment_status || "PENDING"}
                                    </span>

                                    <span
                                        className={`rounded-full border px-3 py-1.5 text-xs ${statusClass(order?.status)}`}
                                    >
                                        {order?.status || "PENDING"}
                                    </span>
                                </div>
                            </div>

                            {/* Artwork and pricing */}
                            <div className="p-5 sm:p-6">
                                <div className="flex flex-col gap-5 sm:flex-row">
                                    <div className="h-52 w-full shrink-0 overflow-hidden rounded-xl bg-white/[0.04] sm:h-36 sm:w-36">
                                        {imageUrl ? (
                                            <img
                                                src={imageUrl}
                                                alt={artwork?.title || "Artwork"}
                                                className="h-full w-full object-cover transition duration-300 hover:scale-105"
                                            />
                                        ) : (
                                            <div className="flex h-full items-center justify-center text-sm text-white/35">
                                                No image
                                            </div>
                                        )}
                                    </div>

                                    <div className="min-w-0 flex-1">
                                        <p className="text-xs uppercase tracking-[0.15em] text-[#b58bd0]">
                                            Purchased Artwork
                                        </p>

                                        <h3 className="mt-2 font-serif text-2xl">
                                            {artwork?.title || "Untitled artwork"}
                                        </h3>

                                        <div className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-3">
                                            <div>
                                                <p className="text-xs text-white/45">
                                                    Quantity
                                                </p>
                                                <p className="mt-1 font-medium">
                                                    {item.quantity || 0}
                                                </p>
                                            </div>

                                            <div>
                                                <p className="text-xs text-white/45">
                                                    Unit price
                                                </p>
                                                <p className="mt-1 font-medium">
                                                    ₹{Number(item.unit_price || 0).toLocaleString("en-IN")}
                                                </p>
                                            </div>

                                            <div>
                                                <p className="text-xs text-white/45">
                                                    Item total
                                                </p>
                                                <p className="mt-1 font-semibold text-[#c49be0]">
                                                    ₹{saleTotal.toLocaleString("en-IN")}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Payment date */}
                                {order?.paid_at && (
                                    <div className="mt-6 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 sm:flex sm:items-center sm:justify-between">
                                        <span className="text-sm text-white/50">
                                            Payment completed
                                        </span>
                                        <span className="mt-1 block text-sm text-white/80 sm:mt-0">
                                            {formatDate(order.paid_at, true)}
                                        </span>
                                    </div>
                                )}

                                {/* Shipping */}
                                {order?.shipping_full_name && (
                                    <div className="mt-6 border-t border-white/10 pt-6">
                                        <p className="text-xs uppercase tracking-[0.18em] text-white/50">
                                            Shipping Details
                                        </p>

                                        <div className="mt-4 grid gap-5 rounded-xl border border-white/10 bg-white/[0.025] p-4 sm:grid-cols-2 sm:p-5">
                                            <div>
                                                <p className="text-xs text-white/40">
                                                    Customer
                                                </p>
                                                <p className="mt-1 font-medium">
                                                    {order.shipping_full_name}
                                                </p>
                                            </div>

                                            <div>
                                                <p className="text-xs text-white/40">
                                                    Phone
                                                </p>
                                                <p className="mt-1 font-medium">
                                                    {order.shipping_phone || "—"}
                                                </p>
                                            </div>

                                            <div className="sm:col-span-2">
                                                <p className="text-xs text-white/40">
                                                    Delivery address
                                                </p>
                                                <p className="mt-1 whitespace-pre-line text-sm leading-6 text-white/75">
                                                    {[
                                                        order.shipping_address,
                                                        order.shipping_city,
                                                        order.shipping_state,
                                                        order.shipping_postal_code,
                                                    ]
                                                        .filter(Boolean)
                                                        .join(", ")}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Fulfillment */}
                                {order?.payment_status === "PAID" && (
                                    <div className="mt-6 border-t border-white/10 pt-6">
                                        <p className="mb-3 text-xs uppercase tracking-[0.18em] text-white/50">
                                            Fulfillment
                                        </p>

                                        <div className="flex flex-wrap items-center gap-3">
                                            {action && (
                                                <button
                                                    type="button"
                                                    disabled={updatingOrderId === order.id}
                                                    onClick={() =>
                                                        updateOrderStatus(
                                                            order.id,
                                                            action.nextStatus
                                                        )
                                                    }
                                                    className="rounded-full bg-[#8f5bb7] px-5 py-3 text-sm font-medium transition hover:bg-[#a875ce] disabled:cursor-not-allowed disabled:opacity-50"
                                                >
                                                    {updatingOrderId === order.id
                                                        ? "Updating..."
                                                        : action.label}
                                                </button>
                                            )}

                                            {order.status === "DELIVERED" && (
                                                <span className="rounded-full border border-emerald-400/25 bg-emerald-400/10 px-4 py-2 text-sm text-emerald-300">
                                                    ✓ Order delivered
                                                </span>
                                            )}

                                            {order.status === "CANCELLED" && (
                                                <span className="rounded-full border border-red-400/25 bg-red-400/10 px-4 py-2 text-sm text-red-300">
                                                    Order cancelled
                                                </span>
                                            )}

                                            {!action &&
                                                !["DELIVERED", "CANCELLED"].includes(
                                                    order.status
                                                ) && (
                                                    <span className="text-sm text-white/45">
                                                        No fulfillment action available.
                                                    </span>
                                                )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </article>
                    );
                })}
            </div>
        </section>
    );
}
