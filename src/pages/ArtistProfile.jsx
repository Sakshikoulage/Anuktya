
import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "../lib/supabase";
import Navbar from "../components/Navbar";

function ArtistProfile() {
    const { id } = useParams();

    const [artist, setArtist] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        const fetchArtist = async () => {
            const { data, error } = await supabase
                .from("artist_profiles")
                .select(`
                    id,
                    display_name,
                    bio,
                    profile_image,
                    location,
                    commission_enabled,
                    artworks (
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
                    )
                `)
                .eq("id", id)
                .single();

            if (error) {
                setError(error.message);
                setLoading(false);
                return;
            }

            setArtist(data);
            setLoading(false);
        };

        fetchArtist();
    }, [id]);

    if (loading) {
        return (
            <div className="min-h-screen bg-[#08070d] px-6 py-24 text-white">
                <Navbar />
                <div className="mx-auto mt-20 max-w-7xl text-center">
                    <div className="mx-auto h-10 w-10 animate-spin rounded-full border-2 border-purple-400/30 border-t-purple-400" />
                    <p className="mt-5 text-sm tracking-wide text-white/60">
                        Loading artist profile...
                    </p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-[#08070d] px-6 py-24 text-white">
                <Navbar />
                <div className="mx-auto mt-16 max-w-3xl rounded-3xl border border-red-400/20 bg-white/[0.04] p-8">
                    <p className="text-sm uppercase tracking-[0.25em] text-red-300">
                        Unable to load profile
                    </p>

                    <p className="mt-4 text-white/70">{error}</p>

                    <Link
                        to="/artists"
                        className="mt-6 inline-flex rounded-full border border-white/15 px-5 py-3 text-sm text-white transition hover:border-purple-300/60 hover:bg-purple-400/10"
                    >
                        Back to artists
                    </Link>
                </div>
            </div>
        );
    }

    if (!artist) {
        return (
            <div className="min-h-screen bg-[#08070d] px-6 py-24 text-white">
                <Navbar />
                <div className="mx-auto mt-16 max-w-3xl rounded-3xl border border-white/10 bg-white/[0.04] p-8 text-center">
                    <p className="font-serif text-3xl">
                        Artist not found
                    </p>

                    <p className="mt-3 text-white/60">
                        This artist profile may no longer be available.
                    </p>

                    <Link
                        to="/artists"
                        className="mt-6 inline-flex rounded-full bg-purple-500 px-5 py-3 text-sm font-medium text-white transition hover:bg-purple-400"
                    >
                        Explore artists
                    </Link>
                </div>
            </div>
        );
    }

    const artworks = artist.artworks || [];

    return (
        <div className="relative min-h-screen overflow-hidden bg-[#08070d] px-5 pb-20 pt-24 text-white sm:px-8">
            <Navbar />

            {/* Background glow effects */}
            <div
                aria-hidden="true"
                className="pointer-events-none absolute -left-32 top-32 h-96 w-96 rounded-full bg-purple-700/20 blur-[120px]"
            />

            <div
                aria-hidden="true"
                className="pointer-events-none absolute -right-24 top-[30rem] h-80 w-80 rounded-full bg-fuchsia-600/10 blur-[120px]"
            />

            <main className="relative mx-auto max-w-7xl">
                <Link
                    to="/artists"
                    className="inline-flex items-center gap-2 text-sm text-white/55 transition hover:text-purple-200"
                >
                    <span aria-hidden="true">←</span>
                    All artists
                </Link>

                {/* Artist information */}
                <section className="mt-8 overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.045] p-7 shadow-2xl shadow-purple-950/20 backdrop-blur-xl sm:p-10 lg:p-14">
                    <div className="flex flex-col gap-8 md:flex-row md:items-start">
                        <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-3xl border border-purple-300/25 bg-gradient-to-br from-purple-500/30 to-fuchsia-500/10 text-4xl font-serif text-purple-100 shadow-lg shadow-purple-950/30 sm:h-28 sm:w-28">
                            {(artist.display_name || "A")
                                .trim()
                                .charAt(0)
                                .toUpperCase()}
                        </div>

                        <div className="min-w-0 flex-1">
                            <p className="text-xs font-medium uppercase tracking-[0.3em] text-purple-300">
                                Meet the artist
                            </p>

                            <h1 className="mt-4 break-words font-serif text-4xl leading-tight sm:text-5xl lg:text-6xl">
                                {artist.display_name}
                            </h1>

                            {artist.location && (
                                <p className="mt-4 flex items-center gap-2 text-sm text-white/55">
                                    <span aria-hidden="true">⌖</span>
                                    {artist.location}
                                </p>
                            )}

                            {artist.bio && (
                                <p className="mt-6 max-w-3xl whitespace-pre-line text-base leading-8 text-white/70 sm:text-lg">
                                    {artist.bio}
                                </p>
                            )}

                            {artist.commission_enabled && (
                                <div className="mt-7 inline-flex items-center gap-2 rounded-full border border-emerald-300/20 bg-emerald-300/[0.08] px-4 py-2 text-xs font-medium uppercase tracking-[0.12em] text-emerald-200">
                                    <span className="h-2 w-2 rounded-full bg-emerald-300" />
                                    Commissions available
                                </div>
                            )}
                        </div>
                    </div>
                </section>

                {/* Artist artwork gallery */}
                <section className="mt-16 sm:mt-20">
                    <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
                        <div>
                            <p className="text-xs uppercase tracking-[0.28em] text-purple-300">
                                Selected works
                            </p>

                            <h2 className="mt-3 font-serif text-3xl sm:text-4xl">
                                Artwork by {artist.display_name}
                            </h2>
                        </div>

                        <p className="text-sm text-white/45">
                            {artworks.length}{" "}
                            {artworks.length === 1 ? "piece" : "pieces"}
                        </p>
                    </div>

                    {artworks.length === 0 ? (
                        <div className="mt-8 rounded-3xl border border-dashed border-white/15 bg-white/[0.025] px-6 py-16 text-center">
                            <p className="font-serif text-2xl text-white/85">
                                The canvas is waiting
                            </p>

                            <p className="mt-3 text-sm text-white/50">
                                This artist hasn’t added any artwork yet.
                                Check back soon.
                            </p>
                        </div>
                    ) : (
                        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                            {artworks.map((artwork) => {
                                const primaryImage =
                                    artwork.artwork_images?.find(
                                        (image) => image.is_primary
                                    ) ||
                                    [...(artwork.artwork_images || [])].sort(
                                        (a, b) =>
                                            (a.display_order ?? 0) -
                                            (b.display_order ?? 0)
                                    )[0];

                                const imageUrl = primaryImage
                                    ? supabase.storage
                                          .from("artwork-images")
                                          .getPublicUrl(
                                              primaryImage.storage_path
                                          ).data.publicUrl
                                    : null;

                                return (
                                    <Link
                                        key={artwork.id}
                                        to={`/artwork/${artwork.id}`}
                                        className="group overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04] transition duration-300 hover:-translate-y-1 hover:border-purple-300/35 hover:bg-white/[0.07] hover:shadow-xl hover:shadow-purple-950/30"
                                    >
                                        <div className="relative overflow-hidden bg-white/[0.03]">
                                            {imageUrl ? (
                                                <img
                                                    src={imageUrl}
                                                    alt={artwork.title}
                                                    loading="lazy"
                                                    className="aspect-[4/5] w-full object-cover transition duration-500 group-hover:scale-[1.04]"
                                                />
                                            ) : (
                                                <div className="flex aspect-[4/5] items-center justify-center bg-gradient-to-br from-purple-950/60 to-white/[0.03]">
                                                    <span className="font-serif text-lg text-white/35">
                                                        Artwork image
                                                    </span>
                                                </div>
                                            )}

                                            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#08070d]/35 via-transparent to-transparent opacity-70" />
                                        </div>

                                        <div className="p-5">
                                            <h3 className="line-clamp-2 font-serif text-xl text-white transition group-hover:text-purple-200">
                                                {artwork.title}
                                            </h3>

                                            {(artwork.style || artwork.medium) && (
                                                <p className="mt-2 text-sm text-white/45">
                                                    {[
                                                        artwork.style,
                                                        artwork.medium,
                                                    ]
                                                        .filter(Boolean)
                                                        .join(" · ")}
                                                </p>
                                            )}

                                            {artwork.price !== null &&
                                                artwork.price !== undefined && (
                                                    <p className="mt-4 text-base font-medium text-purple-200">
                                                        ₹
                                                        {Number(
                                                            artwork.price
                                                        ).toLocaleString(
                                                            "en-IN"
                                                        )}
                                                    </p>
                                                )}
                                        </div>
                                    </Link>
                                );
                            })}
                        </div>
                    )}
                </section>
            </main>
        </div>
    );
}

export default ArtistProfile;
