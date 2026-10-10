import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";

function Cart() {
    const navigate = useNavigate();

    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [menuOpen, setMenuOpen] = useState(false);

    const fetchCart = async () => {
        setLoading(true);
        setError("");

        const {
            data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
            setItems([]);
            setLoading(false);
            return;
        }

        const { data, error } = await supabase
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

                    artist_profiles (
                        display_name
                    ),

                    artwork_images (
                        storage_path,
                        is_primary
                    )
                )
            `)
            .eq("user_id", user.id)
            .order("created_at", { ascending: false });

        if (error) {
            console.error("Cart error:", error);
            setError(error.message);
            setLoading(false);
            return;
        }

        setItems(data || []);
        setLoading(false);
    };

    useEffect(() => {
        fetchCart();
    }, []);

    const updateQuantity = async (item, newQuantity) => {
        if (newQuantity < 1) {
            return;
        }

        const maximum = Number(item.artworks?.quantity) || 0;

        if (newQuantity > maximum) {
            return;
        }

        const { error } = await supabase
            .from("cart_items")
            .update({
                quantity: newQuantity,
                updated_at: new Date().toISOString(),
            })
            .eq("id", item.id);

        if (error) {
            console.error("Quantity update error:", error);
            setError(error.message);
            return;
        }

        setItems((currentItems) =>
            currentItems.map((cartItem) =>
                cartItem.id === item.id
                    ? { ...cartItem, quantity: newQuantity }
                    : cartItem
            )
        );
    };

    const removeItem = async (itemId) => {
        const { error } = await supabase
            .from("cart_items")
            .delete()
            .eq("id", itemId);

        if (error) {
            console.error("Remove cart item error:", error);
            setError(error.message);
            return;
        }

        setItems((currentItems) =>
            currentItems.filter((item) => item.id !== itemId)
        );
    };

    const subtotal = items.reduce((total, item) => {
        const price = Number(item.artworks?.price) || 0;
        return total + price * item.quantity;
    }, 0);

    const totalItems = items.reduce(
        (total, item) => total + item.quantity,
        0
    );

    /* =========================================================
       LOADING
    ========================================================= */

    if (loading) {
        return (
            <div className="min-h-screen bg-black text-white">

                <header className="fixed left-0 right-0 top-0 z-50 px-4 pt-4 md:px-8">
                    <nav className="mx-auto flex max-w-7xl items-center justify-between rounded-full border border-white/10 bg-[#080609]/80 px-4 py-3 shadow-2xl backdrop-blur-xl md:px-6">

                        <div className="relative flex items-center gap-4">

                            <button
                                type="button"
                                onClick={() =>
                                    setMenuOpen((prev) => !prev)
                                }
                                className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 text-white transition hover:border-[#9d5bc7] hover:bg-[#8e4fc0]/15"
                                aria-label="Open menu"
                            >
                                <span className="flex flex-col gap-[4px]">
                                    <span className="block h-[1.5px] w-4 bg-white" />
                                    <span className="block h-[1.5px] w-4 bg-white" />
                                    <span className="block h-[1.5px] w-4 bg-white" />
                                </span>
                            </button>

                            <button
                                type="button"
                                onClick={() => navigate("/")}
                                className="font-serif text-2xl italic tracking-[0.08em] text-white md:text-3xl"
                                style={{
                                    fontFamily:
                                        '"Cormorant Garamond", "Bodoni 72", Didot, Georgia, serif',
                                }}
                            >
                                anuktya
                            </button>

                        </div>

                        <div className="hidden items-center gap-8 md:flex">
                            <button
                                type="button"
                                onClick={() => navigate("/explore")}
                                className="text-sm font-semibold text-white/65 hover:text-white"
                            >
                                Explore
                            </button>

                            <button
                                type="button"
                                onClick={() => navigate("/artists")}
                                className="text-sm font-semibold text-white/65 hover:text-white"
                            >
                                Artists
                            </button>

                            <button
                                type="button"
                                onClick={() => navigate("/collections")}
                                className="text-sm font-semibold text-white/65 hover:text-white"
                            >
                                Collections
                            </button>

                            <button
                                type="button"
                                onClick={() => navigate("/my-commissions")}
                                className="text-sm font-semibold text-white/65 hover:text-white"
                            >
                                My Commission
                            </button>
                        </div>

                        <div className="flex items-center gap-2">

                            <button
                                type="button"
                                onClick={() => navigate("/favourites")}
                                className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 text-xl text-white hover:border-[#9d5bc7] hover:bg-[#8e4fc0]/15"
                            >
                                ♡
                            </button>

                            <button
                                type="button"
                                onClick={() => navigate("/cart")}
                                className="flex h-10 w-10 items-center justify-center rounded-full border border-[#9d5bc7]/60 bg-[#8e4fc0]/20 text-lg text-white"
                            >
                                🛒
                            </button>

                        </div>

                    </nav>
                </header>

                <div className="flex min-h-screen items-center justify-center">
                    <div className="text-center">

                        <div className="mx-auto mb-6 h-10 w-10 animate-spin rounded-full border-2 border-white/10 border-t-[#a867d4]" />

                        <p className="text-lg font-semibold">
                            Loading your cart...
                        </p>

                    </div>
                </div>

            </div>
        );
    }

    return (
        <div className="min-h-screen bg-black text-white">

            {/* =====================================================
                NAVBAR
            ===================================================== */}

            <header className="fixed left-0 right-0 top-0 z-50 px-4 pt-4 md:px-8">

                <nav className="mx-auto flex max-w-7xl items-center justify-between rounded-full border border-white/10 bg-[#080609]/80 px-4 py-3 shadow-2xl backdrop-blur-xl md:px-6">

                    {/* LEFT */}

                    <div className="relative flex items-center gap-4">

                        <button
                            type="button"
                            onClick={() =>
                                setMenuOpen((prev) => !prev)
                            }
                            className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 text-white transition hover:border-[#9d5bc7] hover:bg-[#8e4fc0]/15"
                            aria-label="Open menu"
                        >
                            <span className="flex flex-col gap-[4px]">
                                <span className="block h-[1.5px] w-4 bg-white" />
                                <span className="block h-[1.5px] w-4 bg-white" />
                                <span className="block h-[1.5px] w-4 bg-white" />
                            </span>
                        </button>

                        <button
                            type="button"
                            onClick={() => navigate("/")}
                            className="font-serif text-2xl italic tracking-[0.08em] text-white md:text-3xl"
                            style={{
                                fontFamily:
                                    '"Cormorant Garamond", "Bodoni 72", Didot, Georgia, serif',
                            }}
                        >
                            anuktya
                        </button>

                        {menuOpen && (
                            <div className="absolute left-0 top-14 w-52 overflow-hidden rounded-2xl border border-white/10 bg-[#0a080c]/95 p-2 shadow-2xl backdrop-blur-2xl">

                                <button
                                    type="button"
                                    onClick={() => {
                                        setMenuOpen(false);
                                        navigate("/profile");
                                    }}
                                    className="flex w-full rounded-xl px-4 py-3 text-left text-sm font-medium text-white/70 transition hover:bg-white/10 hover:text-white"
                                >
                                    Profile
                                </button>

                                <button
                                    type="button"
                                    onClick={() => {
                                        setMenuOpen(false);
                                        supabase.auth.signOut();
                                    }}
                                    className="flex w-full rounded-xl px-4 py-3 text-left text-sm font-medium text-white/70 transition hover:bg-white/10 hover:text-white"
                                >
                                    Logout
                                </button>

                            </div>
                        )}

                    </div>

                    {/* CENTER */}

                    <div className="hidden items-center gap-8 md:flex">

                        <button
                            type="button"
                            onClick={() => navigate("/explore")}
                            className="text-sm font-semibold text-white/65 transition hover:text-white"
                        >
                            Explore
                        </button>

                        <button
                            type="button"
                            onClick={() => navigate("/artists")}
                            className="text-sm font-semibold text-white/65 transition hover:text-white"
                        >
                            Artists
                        </button>

                       

                        <button
                            type="button"
                            onClick={() => navigate("/my-commissions")}
                            className="text-sm font-semibold text-white/65 transition hover:text-white"
                        >
                            My Commission
                        </button>

                    </div>

                    {/* RIGHT */}

                    <div className="flex items-center gap-2">

                        <button
                            type="button"
                            onClick={() => navigate("/favourites")}
                            className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 text-xl text-white transition hover:border-[#9d5bc7] hover:bg-[#8e4fc0]/15"
                            aria-label="Favourites"
                        >
                            ♡
                        </button>

                        <button
                            type="button"
                            onClick={() => navigate("/cart")}
                            className="flex h-10 w-10 items-center justify-center rounded-full border border-[#9d5bc7]/60 bg-[#8e4fc0]/20 text-lg text-white"
                            aria-label="Cart"
                        >
                            🛒
                        </button>

                    </div>

                </nav>

            </header>

            {/* =====================================================
                MAIN
            ===================================================== */}

            <main className="px-5 pb-28 pt-36 sm:px-8 lg:px-12">

                <div className="mx-auto max-w-7xl">

                    {/* HEADER */}

                    <section>

                        <p className="text-sm font-bold uppercase tracking-[0.35em] text-white/45">
                            Your collection
                        </p>

                        <h1 className="mt-5 text-6xl font-black leading-[0.9] tracking-[-0.05em] text-white sm:text-7xl md:text-8xl">
                            Your
                            <br />
                            Cart.
                        </h1>

                        <p className="mt-7 max-w-2xl text-lg font-semibold leading-8 text-white/45 md:text-xl">
                            Review the artworks you've selected
                            before bringing them into your collection.
                        </p>

                    </section>

                    {/* ERROR */}

                    {error && (
                        <div className="mt-10 rounded-2xl border border-red-500/20 bg-red-950/30 px-5 py-4 text-sm font-medium text-red-300">
                            {error}
                        </div>
                    )}

                    {/* EMPTY CART */}

                    {items.length === 0 ? (

                        <div className="relative mt-16 overflow-hidden rounded-3xl border border-white/10 bg-[#09070b] px-8 py-24 text-center shadow-2xl">

                            <div className="pointer-events-none absolute left-1/2 top-1/2 h-64 w-64 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#8e4fc0]/15 blur-[90px]" />

                            <div className="relative">

                                <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full border border-white/10 bg-white/[0.03] text-3xl">
                                    🛒
                                </div>

                                <h2 className="mt-8 text-3xl font-black text-white">
                                    Your cart is empty.
                                </h2>

                                <p className="mx-auto mt-4 max-w-md text-sm font-medium leading-6 text-white/40">
                                    Discover something meaningful from
                                    an independent artist and bring it
                                    into your collection.
                                </p>

                                <Link
                                    to="/explore"
                                    className="mt-8 inline-flex rounded-full bg-[#8e4fc0] px-8 py-4 text-sm font-bold text-white shadow-lg shadow-purple-950/30 transition hover:bg-[#a867d4] hover:shadow-purple-900/40"
                                >
                                    Explore Artwork
                                </Link>

                            </div>

                        </div>

                    ) : (

                        <div className="mt-16 grid gap-10 lg:grid-cols-[1fr_370px]">

                            {/* CART ITEMS */}

                            <div className="space-y-5">

                                {items.map((item) => {

                                    const artwork = item.artworks;

                                    const primaryImage =
                                        artwork?.artwork_images?.find(
                                            (image) => image.is_primary
                                        );

                                    const imageUrl = primaryImage
                                        ? supabase.storage
                                            .from("artwork-images")
                                            .getPublicUrl(
                                                primaryImage.storage_path
                                            ).data.publicUrl
                                        : null;

                                    const price =
                                        Number(artwork?.price) || 0;

                                    return (
                                        <div
                                            key={item.id}
                                            className="group relative overflow-hidden rounded-2xl border border-white/10 bg-[#09070b] p-4 shadow-2xl transition-all duration-300 hover:border-[#9d5bc7]/50 sm:p-5"
                                        >

                                            <div className="pointer-events-none absolute -right-20 -top-20 h-48 w-48 rounded-full bg-[#8e4fc0]/10 blur-3xl transition group-hover:bg-[#8e4fc0]/20" />

                                            <div className="relative grid gap-6 sm:grid-cols-[180px_1fr]">

                                                {/* IMAGE */}

                                                <Link
                                                    to={`/artwork/${artwork?.id}`}
                                                    className="group/image overflow-hidden rounded-xl bg-[#111]"
                                                >

                                                    {imageUrl ? (
                                                        <img
                                                            src={imageUrl}
                                                            alt={artwork?.title}
                                                            className="aspect-[4/5] h-full w-full object-cover transition duration-700 group-hover/image:scale-105"
                                                        />
                                                    ) : (
                                                        <div className="flex aspect-[4/5] items-center justify-center text-sm text-white/25">
                                                            Artwork image
                                                        </div>
                                                    )}

                                                </Link>

                                                {/* DETAILS */}

                                                <div className="flex min-h-full flex-col">

                                                    <div className="flex-1">

                                                        <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#a867d4]">
                                                            Artwork
                                                        </p>

                                                        <Link
                                                            to={`/artwork/${artwork?.id}`}
                                                            className="mt-3 block text-3xl font-black leading-tight tracking-[-0.03em] text-white transition hover:text-[#c990e7]"
                                                        >
                                                            {artwork?.title}
                                                        </Link>

                                                        <p className="mt-2 font-medium text-white/45">
                                                            {artwork?.artist_profiles?.display_name}
                                                        </p>

                                                        <p className="mt-6 text-xl font-black text-white">
                                                            ₹{" "}
                                                            {price.toLocaleString(
                                                                "en-IN"
                                                            )}
                                                        </p>

                                                    </div>

                                                    {/* ACTIONS */}

                                                    <div className="mt-8 flex flex-wrap items-center justify-between gap-5">

                                                        <div className="flex items-center overflow-hidden rounded-full border border-white/10 bg-white/[0.03]">

                                                            <button
                                                                type="button"
                                                                onClick={() =>
                                                                    item.quantity >
                                                                        1 &&
                                                                    updateQuantity(
                                                                        item,
                                                                        item.quantity -
                                                                            1
                                                                    )
                                                                }
                                                                disabled={
                                                                    item.quantity <=
                                                                    1
                                                                }
                                                                className="flex h-10 w-10 items-center justify-center text-lg text-white/70 transition hover:bg-[#8e4fc0]/20 hover:text-white disabled:cursor-not-allowed disabled:opacity-20"
                                                            >
                                                                −
                                                            </button>

                                                            <span className="flex min-w-10 items-center justify-center text-sm font-bold text-white">
                                                                {item.quantity}
                                                            </span>

                                                            <button
                                                                type="button"
                                                                onClick={() =>
                                                                    updateQuantity(
                                                                        item,
                                                                        item.quantity +
                                                                            1
                                                                    )
                                                                }
                                                                disabled={
                                                                    item.quantity >=
                                                                    Number(
                                                                        artwork?.quantity ||
                                                                            0
                                                                    )
                                                                }
                                                                className="flex h-10 w-10 items-center justify-center text-lg text-white/70 transition hover:bg-[#8e4fc0]/20 hover:text-white disabled:cursor-not-allowed disabled:opacity-20"
                                                            >
                                                                +
                                                            </button>

                                                        </div>

                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                removeItem(
                                                                    item.id
                                                                )
                                                            }
                                                            className="rounded-full border border-white/10 px-5 py-2.5 text-xs font-bold uppercase tracking-[0.15em] text-white/40 transition hover:border-red-400/30 hover:bg-red-500/10 hover:text-red-300"
                                                        >
                                                            Remove
                                                        </button>

                                                    </div>

                                                </div>

                                            </div>

                                        </div>
                                    );
                                })}

                            </div>

                            {/* ORDER SUMMARY */}

                            <aside className="h-fit lg:sticky lg:top-28">

                                <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-[#09070b] p-7 shadow-2xl">

                                    <div className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full bg-[#8e4fc0]/15 blur-[80px]" />

                                    <div className="relative">

                                        <p className="text-xs font-bold uppercase tracking-[0.25em] text-[#a867d4]">
                                            Order summary
                                        </p>

                                        <div className="mt-7 flex justify-between border-b border-white/10 pb-5">

                                            <span className="font-medium text-white/50">
                                                Subtotal
                                            </span>

                                            <span className="font-bold text-white">
                                                ₹{" "}
                                                {subtotal.toLocaleString(
                                                    "en-IN"
                                                )}
                                            </span>

                                        </div>

                                        <div className="mt-5 flex justify-between text-sm">

                                            <span className="font-medium text-white/35">
                                                Items
                                            </span>

                                            <span className="font-bold text-white/65">
                                                {totalItems}
                                            </span>

                                        </div>

                                        <div className="mt-7 border-t border-white/10 pt-6">

                                            <div className="flex items-end justify-between gap-4">

                                                <span className="text-xs font-bold uppercase tracking-[0.2em] text-white/45">
                                                    Total
                                                </span>

                                                <span className="text-3xl font-black tracking-tight text-white">
                                                    ₹{" "}
                                                    {subtotal.toLocaleString(
                                                        "en-IN"
                                                    )}
                                                </span>

                                            </div>

                                        </div>

                                        <Link
                                            to="/checkout"
                                            className="mt-8 block rounded-full bg-[#8e4fc0] px-6 py-4 text-center text-sm font-bold text-white shadow-lg shadow-purple-950/30 transition hover:bg-[#a867d4] hover:shadow-purple-900/40"
                                        >
                                            Proceed to Checkout
                                        </Link>

                                        <Link
                                            to="/explore"
                                            className="mt-5 block text-center text-sm font-semibold text-white/35 transition hover:text-white"
                                        >
                                            Continue shopping
                                        </Link>

                                    </div>

                                </div>

                            </aside>

                        </div>

                    )}

                </div>

            </main>

            {/* FOOTER */}

            <footer className="border-t border-white/10 bg-[#050505] px-6 py-10 md:px-10 lg:px-16">

                <div className="mx-auto flex max-w-7xl flex-col gap-4 md:flex-row md:items-center md:justify-between">

                    <p
                        className="text-3xl italic text-white"
                        style={{
                            fontFamily:
                                '"Cormorant Garamond", "Bodoni 72", Didot, Georgia, serif',
                        }}
                    >
                        anuktya
                    </p>

                    <p className="text-sm font-medium text-white/30">
                        Art worth bringing home.
                    </p>

                </div>

            </footer>

            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;0,700;1,400;1,500;1,600&display=swap');
            `}</style>

        </div>
    );
}

export default Cart;