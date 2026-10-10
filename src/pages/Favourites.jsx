import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";

function Favourites() {
    const navigate = useNavigate();

    const [favourites, setFavourites] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [menuOpen, setMenuOpen] = useState(false);

    const removeFavourite = async (favouriteId) => {
        const { error } = await supabase
            .from("favourites")
            .delete()
            .eq("id", favouriteId);

        if (error) {
            setError(error.message);
            return;
        }

        setFavourites((currentFavourites) =>
            currentFavourites.filter(
                (favourite) => favourite.id !== favouriteId
            )
        );
    };

    useEffect(() => {
        const fetchFavourites = async () => {
            const {
                data: { user },
            } = await supabase.auth.getUser();

            if (!user) {
                setLoading(false);
                return;
            }

            const { data, error } = await supabase
                .from("favourites")
                .select(`
                    id,
                    artwork_id,
                    artworks (
                        title,
                        price,
                        style,
                        medium,

                        artist_profiles (
                            display_name
                        ),

                        artwork_images (
                            storage_path,
                            is_primary,
                            display_order
                        )
                    )
                `)
                .eq("user_id", user.id)
                .order("created_at", { ascending: false });

            if (error) {
                setError(error.message);
                setLoading(false);
                return;
            }

            setFavourites(data || []);
            setLoading(false);
        };

        fetchFavourites();
    }, []);

    /* =========================================================
       LOADING
    ========================================================= */

    if (loading) {
        return (
            <div className="relative min-h-screen overflow-hidden bg-black text-white">

                <div className="fixed inset-0 z-0 overflow-hidden">
                    <img
                        src="/anuktya-bg.jpg"
                        alt=""
                        className="absolute -inset-6 h-[calc(100%+48px)] w-[calc(100%+48px)] scale-105 object-cover blur-[18px]"
                    />

                    <div className="absolute inset-0 bg-black/30" />

                    <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-transparent to-black/60" />
                </div>

                <div className="relative z-10">

                    {/* NAVBAR */}

                    <header className="fixed left-0 right-0 top-0 z-50 px-4 pt-4 md:px-8">

                        <nav className="mx-auto flex max-w-7xl items-center justify-between rounded-full border border-white/15 bg-black/30 px-4 py-3 shadow-2xl backdrop-blur-xl md:px-6">

                            <div className="relative flex items-center gap-4">

                                <button
                                    type="button"
                                    onClick={() =>
                                        setMenuOpen((prev) => !prev)
                                    }
                                    className="flex h-10 w-10 items-center justify-center rounded-full border border-white/15 text-white transition hover:border-[#b58bd0] hover:bg-white/10"
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
                                    className="text-sm font-semibold text-white/75 transition hover:text-white"
                                >
                                    Explore
                                </button>

                                <button
                                    type="button"
                                    onClick={() => navigate("/artists")}
                                    className="text-sm font-semibold text-white/75 transition hover:text-white"
                                >
                                    Artists
                                </button>

                                <button
                                    type="button"
                                    onClick={() =>
                                        navigate("/collections")
                                    }
                                    className="text-sm font-semibold text-white/75 transition hover:text-white"
                                >
                                    Collections
                                </button>

                                <button
                                    type="button"
                                    onClick={() =>
                                        navigate("/my-commissions")
                                    }
                                    className="text-sm font-semibold text-white/75 transition hover:text-white"
                                >
                                    My Commission
                                </button>

                            </div>

                            <div className="flex items-center gap-2">

                                <button
                                    type="button"
                                    onClick={() =>
                                        navigate("/favourites")
                                    }
                                    className="flex h-10 w-10 items-center justify-center rounded-full border border-[#b58bd0]/60 bg-[#8e4fc0]/20 text-xl text-white"
                                    aria-label="Favourites"
                                >
                                    ♡
                                </button>

                                <button
                                    type="button"
                                    onClick={() => navigate("/cart")}
                                    className="flex h-10 w-10 items-center justify-center rounded-full border border-white/15 text-lg text-white transition hover:border-[#b58bd0] hover:bg-white/10"
                                    aria-label="Cart"
                                >
                                    🛒
                                </button>

                            </div>

                        </nav>

                        {menuOpen && (
                            <div className="mx-auto mt-2 w-[calc(100%-2rem)] max-w-7xl md:hidden">
                                <div className="w-52 overflow-hidden rounded-2xl border border-white/15 bg-black/80 p-2 shadow-2xl backdrop-blur-2xl">

                                    <button
                                        type="button"
                                        onClick={() => {
                                            setMenuOpen(false);
                                            navigate("/profile");
                                        }}
                                        className="flex w-full rounded-xl px-4 py-3 text-left text-sm font-medium text-white/75 transition hover:bg-white/10 hover:text-white"
                                    >
                                        Profile
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => {
                                            setMenuOpen(false);
                                            supabase.auth.signOut();
                                        }}
                                        className="flex w-full rounded-xl px-4 py-3 text-left text-sm font-medium text-white/75 transition hover:bg-white/10 hover:text-white"
                                    >
                                        Logout
                                    </button>

                                </div>
                            </div>
                        )}

                    </header>

                    <div className="flex min-h-screen items-center justify-center">
                        <div className="text-center">

                            <div className="mx-auto mb-6 h-10 w-10 animate-spin rounded-full border-2 border-white/20 border-t-[#a76dcc]" />

                            <p className="text-lg font-bold text-white">
                                Loading favourites...
                            </p>

                        </div>
                    </div>

                </div>
            </div>
        );
    }

    /* =========================================================
       ERROR
    ========================================================= */

    if (error) {
        return (
            <div className="relative min-h-screen overflow-hidden bg-black text-white">

                <div className="fixed inset-0 z-0 overflow-hidden">
                    <img
                        src="/anuktya-bg.jpg"
                        alt=""
                        className="absolute -inset-6 h-[calc(100%+48px)] w-[calc(100%+48px)] scale-105 object-cover blur-[18px]"
                    />

                    <div className="absolute inset-0 bg-black/40" />
                </div>

                <div className="relative z-10 flex min-h-screen items-center justify-center px-6">

                    <div className="rounded-3xl border border-red-400/20 bg-black/50 px-10 py-12 text-center backdrop-blur-xl">

                        <p className="text-xl font-black text-white">
                            Something went wrong
                        </p>

                        <p className="mt-3 max-w-md text-sm font-medium text-white/50">
                            {error}
                        </p>

                        <button
                            type="button"
                            onClick={() => navigate("/")}
                            className="mt-7 rounded-full bg-[#8e4fc0] px-7 py-3 text-sm font-bold text-white transition hover:bg-[#a867d4]"
                        >
                            Back home
                        </button>

                    </div>

                </div>
            </div>
        );
    }

    return (
        <div className="relative min-h-screen overflow-x-hidden bg-black text-white">

            {/* =====================================================
                BACKGROUND
            ===================================================== */}

            <div className="fixed inset-0 z-0 overflow-hidden">

                <img
                    src="/anuktya-bg.jpg"
                    alt=""
                    className="absolute -inset-6 h-[calc(100%+48px)] w-[calc(100%+48px)] scale-105 object-cover blur-[18px]"
                />

                <div className="absolute inset-0 bg-black/30" />

                <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-transparent to-black/60" />

            </div>

            {/* =====================================================
                CONTENT
            ===================================================== */}

            <div className="relative z-10">

                {/* =================================================
                    NAVBAR
                ================================================= */}

                <header className="fixed left-0 right-0 top-0 z-50 px-4 pt-4 md:px-8">

                    <nav className="mx-auto flex max-w-7xl items-center justify-between rounded-full border border-white/15 bg-black/30 px-4 py-3 shadow-2xl backdrop-blur-xl md:px-6">

                        {/* LEFT */}

                        <div className="relative flex items-center gap-4">

                            <button
                                type="button"
                                onClick={() =>
                                    setMenuOpen((prev) => !prev)
                                }
                                className="flex h-10 w-10 items-center justify-center rounded-full border border-white/15 text-white transition hover:border-[#b58bd0] hover:bg-white/10"
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
                                <div className="absolute left-0 top-14 w-52 overflow-hidden rounded-2xl border border-white/15 bg-black/80 p-2 shadow-2xl backdrop-blur-2xl">

                                    <button
                                        type="button"
                                        onClick={() => {
                                            setMenuOpen(false);
                                            navigate("/profile");
                                        }}
                                        className="flex w-full rounded-xl px-4 py-3 text-left text-sm font-medium text-white/75 transition hover:bg-white/10 hover:text-white"
                                    >
                                        Profile
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => {
                                            setMenuOpen(false);
                                            supabase.auth.signOut();
                                        }}
                                        className="flex w-full rounded-xl px-4 py-3 text-left text-sm font-medium text-white/75 transition hover:bg-white/10 hover:text-white"
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
                                className="text-sm font-semibold text-white/75 transition hover:text-white"
                            >
                                Explore
                            </button>

                            <button
                                type="button"
                                onClick={() => navigate("/artists")}
                                className="text-sm font-semibold text-white/75 transition hover:text-white"
                            >
                                Artists
                            </button>

                            

                            <button
                                type="button"
                                onClick={() =>
                                    navigate("/my-commissions")
                                }
                                className="text-sm font-semibold text-white/75 transition hover:text-white"
                            >
                                My Commission
                            </button>

                        </div>

                        {/* RIGHT */}

                        <div className="flex items-center gap-2">

                            <button
                                type="button"
                                onClick={() =>
                                    navigate("/favourites")
                                }
                                className="flex h-10 w-10 items-center justify-center rounded-full border border-[#b58bd0]/60 bg-[#8e4fc0]/20 text-xl text-white"
                                aria-label="Favourites"
                            >
                                ♡
                            </button>

                            <button
                                type="button"
                                onClick={() => navigate("/cart")}
                                className="flex h-10 w-10 items-center justify-center rounded-full border border-white/15 text-lg text-white transition hover:border-[#b58bd0] hover:bg-white/10"
                                aria-label="Cart"
                            >
                                🛒
                            </button>

                        </div>

                    </nav>

                </header>

                {/* =================================================
                    MAIN
                ================================================= */}

                <main className="px-6 pb-28 pt-36 md:px-10 lg:px-16">

                    <div className="mx-auto max-w-7xl">

                        {/* PAGE HEADER */}

                        <section>

                            <p className="text-sm font-bold uppercase tracking-[0.35em] text-white/70">
                                Your personal collection
                            </p>

                            <h1 className="mt-5 max-w-5xl text-6xl font-black leading-[0.9] tracking-[-0.05em] text-white sm:text-7xl md:text-8xl">
                                Your
                                <br />
                                Favourites.
                            </h1>

                            <p className="mt-7 max-w-2xl text-lg font-semibold leading-8 text-white/70 md:text-xl">
                                Artwork you've saved and want to
                                keep close.
                            </p>

                        </section>

                        {/* =================================================
                            EMPTY STATE
                        ================================================= */}

                        {favourites.length === 0 ? (

                            <div className="relative mt-16 overflow-hidden rounded-3xl border border-white/15 bg-black/45 px-6 py-24 text-center shadow-2xl backdrop-blur-xl">

                                <div className="absolute left-1/2 top-1/2 h-48 w-48 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#963fd0]/20 blur-3xl" />

                                <div className="relative">

                                    <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border border-white/15 bg-white/5 text-3xl text-white/70">
                                        ♡
                                    </div>

                                    <h2 className="mt-7 text-3xl font-black text-white">
                                        Nothing saved yet.
                                    </h2>

                                    <p className="mx-auto mt-3 max-w-md text-sm font-medium leading-6 text-white/45">
                                        Explore the collection and save
                                        artwork that speaks to you.
                                    </p>

                                    <button
                                        type="button"
                                        onClick={() => navigate("/explore")}
                                        className="mt-8 rounded-full bg-[#8e4fc0] px-7 py-3 text-sm font-bold text-white shadow-lg shadow-purple-950/30 transition hover:bg-[#a867d4]"
                                    >
                                        Explore artwork
                                    </button>

                                </div>

                            </div>

                        ) : (

                            /* =================================================
                               FAVOURITE CARDS
                            ================================================= */

                            <section className="mt-16">

                                <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">

                                    {favourites.map((favourite) => {

                                        const primaryImage =
                                            favourite.artworks?.artwork_images?.find(
                                                (image) =>
                                                    image.is_primary
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
                                                key={favourite.id}
                                                className="group relative"
                                            >

                                                {/* PURPLE CARD GLOW */}

                                                <div className="absolute -inset-4 rounded-[2rem] bg-[#963fd0]/20 opacity-70 blur-2xl transition-all duration-500 group-hover:bg-[#bd63ed]/45 group-hover:opacity-100 group-hover:blur-3xl" />

                                                {/* CARD */}

                                                <div className="relative overflow-hidden rounded-2xl border border-white/15 bg-black/50 shadow-2xl backdrop-blur-xl transition-all duration-500 group-hover:-translate-y-2 group-hover:border-[#bd7be4]/60">

                                                    {/* ARTWORK */}

                                                    <Link
                                                        to={`/artwork/${favourite.artwork_id}`}
                                                        className="block"
                                                    >

                                                        <div className="relative overflow-hidden bg-black/40">

                                                            {imageUrl ? (

                                                                <img
                                                                    src={imageUrl}
                                                                    alt={
                                                                        favourite
                                                                            .artworks
                                                                            ?.title
                                                                    }
                                                                    className="aspect-[4/5] h-full w-full object-cover transition duration-700 group-hover:scale-[1.04]"
                                                                />

                                                            ) : (

                                                                <div className="flex aspect-[4/5] items-center justify-center bg-white/5">

                                                                    <span className="text-sm font-medium text-white/30">
                                                                        Artwork
                                                                        image
                                                                    </span>

                                                                </div>

                                                            )}

                                                            {/* IMAGE OVERLAY */}

                                                            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-70" />

                                                        </div>

                                                        {/* DETAILS */}

                                                        <div className="p-5">

                                                            <h2 className="line-clamp-2 text-2xl font-black leading-tight tracking-[-0.02em] text-white">
                                                                {favourite.artworks?.title}
                                                            </h2>

                                                            <p className="mt-2 text-sm font-semibold text-[#c998df]">
                                                                {favourite.artworks?.artist_profiles?.display_name}
                                                            </p>

                                                            <div className="mt-4 flex flex-wrap gap-2">

                                                                {favourite.artworks?.style && (
                                                                    <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-white/50">
                                                                        {favourite.artworks.style}
                                                                    </span>
                                                                )}

                                                                {favourite.artworks?.medium && (
                                                                    <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-white/50">
                                                                        {favourite.artworks.medium}
                                                                    </span>
                                                                )}

                                                            </div>

                                                            {favourite.artworks?.price && (
                                                                <p className="mt-5 text-lg font-black text-white">
                                                                    ₹{" "}
                                                                    {favourite.artworks.price}
                                                                </p>
                                                            )}

                                                        </div>

                                                    </Link>

                                                    {/* REMOVE BUTTON */}

                                                    <div className="px-5 pb-5">

                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                removeFavourite(
                                                                    favourite.id
                                                                )
                                                            }
                                                            className="w-full rounded-full border border-white/15 bg-white/5 px-4 py-3 text-xs font-bold uppercase tracking-[0.15em] text-white/60 transition hover:border-[#bd63ed]/60 hover:bg-[#8e4fc0]/20 hover:text-white"
                                                        >
                                                            Remove from favourites
                                                        </button>

                                                    </div>

                                                </div>

                                            </div>
                                        );
                                    })}

                                </div>

                            </section>

                        )}

                    </div>

                </main>

                {/* =================================================
                    FOOTER
                ================================================= */}

                <footer className="border-t border-white/10 bg-black/35 px-6 py-10 backdrop-blur-xl md:px-10 lg:px-16">

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

                        <p className="text-sm font-medium text-white/40">
                            Your saved collection.
                        </p>

                    </div>

                </footer>

            </div>

            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;0,700;1,400;1,500;1,600&display=swap');
            `}</style>

        </div>
    );
}

export default Favourites;