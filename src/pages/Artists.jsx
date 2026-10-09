import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import Navbar from "../components/Navbar";

function Artists() {
    const navigate = useNavigate();

    const [artists, setArtists] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    
    useEffect(() => {
        const fetchArtists = async () => {
            const { data, error } = await supabase
                .from("artist_profiles")
                .select(`
                    id,
                    display_name
                `)
                .order("display_name", { ascending: true });

            if (error) {
                setError(error.message);
                setLoading(false);
                return;
            }

            setArtists(data || []);
            setLoading(false);
        };

        fetchArtists();
    }, []);

    if (loading) {
        return (
            <div className="relative min-h-screen overflow-hidden bg-black text-white">

                {/* BACKGROUND */}
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
                    <Navbar/>

                    <div className="flex min-h-screen items-center justify-center">
                        <div className="text-center">

                            <div className="mx-auto mb-6 h-10 w-10 animate-spin rounded-full border-2 border-white/20 border-t-[#a76dcc]" />

                            <p className="text-lg font-bold text-white">
                                Finding artists...
                            </p>

                        </div>
                    </div>

                </div>
            </div>
        );
    }

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
                FULL SCREEN BLURRED BACKGROUND
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

               <Navbar/>
                {/* =================================================
                    MAIN
                ================================================= */}

                <main className="px-6 pb-28 pt-36 md:px-10 lg:px-16">

                    <div className="mx-auto max-w-7xl">

                        {/* HEADER */}

                        <section>

                            <p className="text-sm font-bold uppercase tracking-[0.35em] text-white/70">
                                The people behind the work
                            </p>

                            <h1 className="mt-5 max-w-5xl text-6xl font-black leading-[0.9] tracking-[-0.05em] text-white sm:text-7xl md:text-8xl">
                                Discover
                                <br />
                                Artists.
                            </h1>

                            <p className="mt-7 max-w-2xl text-lg font-semibold leading-8 text-white/70 md:text-xl">
                                Explore the artists whose ideas,
                                stories and imagination shape the
                                work you discover on Anuktya.
                            </p>

                        </section>

                        {/* ARTISTS */}

                        {artists.length === 0 ? (

                            <div className="mt-16 rounded-3xl border border-white/15 bg-black/40 px-6 py-24 text-center backdrop-blur-xl">

                                <p className="text-2xl font-black text-white">
                                    No artists found.
                                </p>

                            </div>

                        ) : (

                            <section className="mt-16">

                                <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">

                                    {artists.map((artist) => (

                                        <Link
                                            key={artist.id}
                                            to={`/artists/${artist.id}`}
                                            className="group relative block"
                                        >

                                            {/* PURPLE GLOW */}

                                            <div className="absolute -inset-4 rounded-[2rem] bg-[#963fd0]/20 opacity-70 blur-2xl transition-all duration-500 group-hover:bg-[#bd63ed]/45 group-hover:opacity-100 group-hover:blur-3xl" />

                                            {/* CARD */}

                                            <div className="relative min-h-[260px] overflow-hidden rounded-2xl border border-white/15 bg-black/50 p-7 shadow-2xl backdrop-blur-xl transition-all duration-500 group-hover:-translate-y-2 group-hover:border-[#bd7be4]/60">

                                                {/* Decorative glow */}

                                                <div className="pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full bg-[#963fd0]/15 blur-3xl transition-all duration-500 group-hover:bg-[#bd63ed]/30" />

                                                <div className="relative flex h-full min-h-[210px] flex-col justify-between">

                                                    <div>

                                                        <div className="flex items-center justify-between">

                                                            <span className="text-xs font-bold uppercase tracking-[0.25em] text-[#c998df]">
                                                                Artist
                                                            </span>

                                                            <span className="text-2xl text-white/30 transition group-hover:translate-x-1 group-hover:text-white">
                                                                →
                                                            </span>

                                                        </div>

                                                        <h2 className="mt-8 max-w-sm text-4xl font-black leading-[0.95] tracking-[-0.035em] text-white md:text-5xl">
                                                            {artist.display_name}
                                                        </h2>

                                                    </div>

                                                    <div className="border-t border-white/10 pt-5">

                                                        <p className="text-sm font-semibold text-white/45 transition group-hover:text-white/70">
                                                            View artist profile
                                                        </p>

                                                    </div>

                                                </div>

                                            </div>

                                        </Link>

                                    ))}

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
                            Discover the people behind the art.
                        </p>

                    </div>

                </footer>

            </div>

            {/* CLASSY WORDMARK FONT */}

            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;0,700;1,400;1,500;1,600&display=swap');
            `}</style>

        </div>
    );
}

export default Artists;
