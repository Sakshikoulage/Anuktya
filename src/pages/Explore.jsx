
import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { supabase } from "../lib/supabase";
import Navbar from "../components/Navbar";

function Explore() {
 

  const [artworks, setArtworks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  

  const [searchParams, setSearchParams] = useSearchParams();
  const searchQuery = searchParams.get("search") || "";

  useEffect(() => {
    setQuery(searchQuery);

    const fetchArtworks = async () => {
      setLoading(true);
      setError("");

      let artworkQuery = supabase
        .from("artworks")
        .select(`
          *,
          artist_profiles (
            display_name
          ),
          artwork_images (
            storage_path,
            is_primary
          )
        `)
        .eq("availability", "AVAILABLE");

      if (searchQuery.trim()) {
        const {
          data: aiResult,
          error: aiError,
        } = await supabase.functions.invoke("ai-art-search", {
          body: {
            query: searchQuery.trim(),
          },
        });

        if (aiError) {
          console.error("AI error:", aiError);
          setError("Could not understand your search.");
          setLoading(false);
          return;
        }

        console.log("AI result:", aiResult);

        if (aiResult.style) {
          artworkQuery = artworkQuery.ilike(
            "style",
            `%${aiResult.style}%`
          );
        }

        if (aiResult.medium) {
          artworkQuery = artworkQuery.ilike(
            "medium",
            `%${aiResult.medium}%`
          );
        }

        if (aiResult.maxPrice) {
          artworkQuery = artworkQuery.lte(
            "price",
            aiResult.maxPrice
          );
        }

        if (
          Array.isArray(aiResult.keywords) &&
          aiResult.keywords.length > 0
        ) {
          const keywordConditions = aiResult.keywords
            .filter(
              (keyword) =>
                typeof keyword === "string" &&
                keyword.trim()
            )
            .map((keyword) => {
              const value = keyword.trim();

              return [
                `title.ilike.%${value}%`,
                `description.ilike.%${value}%`,
                `style.ilike.%${value}%`,
                `medium.ilike.%${value}%`,
              ].join(",");
            })
            .join(",");

          if (keywordConditions) {
            artworkQuery =
              artworkQuery.or(keywordConditions);
          }
        }
      }

      const {
        data,
        error: artworkError,
      } = await artworkQuery.order("created_at", {
        ascending: false,
      });

      if (artworkError) {
        console.error(
          "Artwork search error:",
          artworkError
        );

        setError("Could not search artworks.");
        setLoading(false);
        return;
      }

      setArtworks(data || []);
      setLoading(false);
    };

    fetchArtworks();
  }, [searchQuery]);

  const handleSearch = (e) => {
    e.preventDefault();

    const trimmedQuery = query.trim();

    if (!trimmedQuery) {
      setSearchParams({});
      return;
    }

    setSearchParams({
      search: trimmedQuery,
    });
  };

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

        {/* CONTENT */}
        <div className="relative z-10">

          
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

        {/* ===================================================
            NAVBAR
        =================================================== */}
<Navbar/>

        {/* ===================================================
            MAIN
        =================================================== */}

        <main className="px-6 pb-28 pt-36 md:px-10 lg:px-16">

          <div className="mx-auto max-w-7xl">

            {/* HEADER */}

            <section>
              <p className="text-sm font-bold uppercase tracking-[0.35em] text-white/70">
                Discover
              </p>

              <h1 className="mt-5 max-w-5xl text-6xl font-black leading-[0.9] tracking-[-0.05em] text-white sm:text-7xl md:text-8xl">
                Explore
                <br />
                Artwork.
              </h1>

              <p className="mt-7 max-w-2xl text-lg font-semibold leading-8 text-white/70 md:text-xl">
                Discover artwork from independent artists and
                find something that speaks to you.
              </p>
            </section>

            {/* SEARCH */}

            <section className="mt-14">
              <form
                onSubmit={handleSearch}
                className="group flex max-w-5xl items-center rounded-full border border-white/20 bg-black/35 p-2 shadow-2xl backdrop-blur-xl transition-all duration-300 focus-within:border-[#b16ed7] focus-within:shadow-[0_0_40px_rgba(161,92,205,0.18)]"
              >
                <div className="flex flex-1 items-center px-5">
                  <span className="mr-4 text-2xl text-white/60">
                    ⌕
                  </span>

                  <input
                    value={query}
                    onChange={(e) =>
                      setQuery(e.target.value)
                    }
                    placeholder="Describe the artwork you're looking for..."
                    className="w-full bg-transparent py-4 text-base font-semibold text-white outline-none placeholder:text-white/45 md:text-lg"
                  />
                </div>

                <button
                  type="submit"
                  className="rounded-full bg-[#8e4fc0] px-7 py-4 text-sm font-bold text-white shadow-lg shadow-purple-950/30 transition-all duration-300 hover:bg-[#a867d4] hover:shadow-[0_0_25px_rgba(168,103,212,0.45)]"
                >
                  Search
                </button>
              </form>
            </section>

            {/* SEARCH RESULTS */}

            {searchQuery && (
              <section className="mt-14">
                <p className="text-xs font-bold uppercase tracking-[0.3em] text-white/50">
                  Search results for
                </p>

                <p className="mt-3 text-3xl font-black text-white md:text-4xl">
                  "{searchQuery}"
                </p>
              </section>
            )}

            {/* ERROR */}

            {error && (
              <div className="mt-8 rounded-2xl border border-red-400/20 bg-red-950/20 px-6 py-5 backdrop-blur-md">
                <p className="font-semibold text-red-200">
                  {error}
                </p>
              </div>
            )}

            {/* =================================================
                ARTWORK GRID
            ================================================= */}

            {artworks.length > 0 ? (
              <section className="mt-16">

                <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">

                  {artworks.map((artwork) => {
                    const primaryImage =
                      artwork.artwork_images?.find(
                        (image) =>
                          image.is_primary
                      );

                    const imageUrl =
                      primaryImage
                        ? supabase.storage
                            .from("artwork-images")
                            .getPublicUrl(
                              primaryImage.storage_path
                            ).data.publicUrl
                        : null;

                    return (
                      <Link
                        to={`/artwork/${artwork.id}`}
                        key={artwork.id}
                        className="group relative block"
                      >

                        {/* PURPLE GLOW */}

                        <div className="absolute -inset-4 rounded-[2rem] bg-[#963fd0]/25 opacity-70 blur-2xl transition-all duration-500 group-hover:bg-[#bd63ed]/50 group-hover:opacity-100 group-hover:blur-3xl" />

                        {/* CARD */}

                        <div className="relative overflow-hidden rounded-2xl border border-white/15 bg-black/55 p-4 shadow-2xl backdrop-blur-xl transition-all duration-500 group-hover:-translate-y-2 group-hover:border-[#bd7be4]/60">

                          {/* IMAGE */}

                          <div className="relative aspect-[4/5] overflow-hidden rounded-xl bg-black">

                            {imageUrl ? (
                              <img
                                src={imageUrl}
                                alt={artwork.title}
                                className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                              />
                            ) : (
                              <div className="flex h-full items-center justify-center">
                                <span className="text-sm font-semibold text-white/30">
                                  Artwork image
                                </span>
                              </div>
                            )}

                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-70" />

                            <div className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100">
                              <div className="absolute inset-0 shadow-[inset_0_0_50px_rgba(180,95,230,0.3)]" />
                            </div>

                          </div>

                          {/* DETAILS */}

                          <div className="px-1 pb-1 pt-5">

                            <div className="flex items-start justify-between gap-4">

                              <div>
                                <h2 className="text-xl font-black leading-tight text-white">
                                  {artwork.title}
                                </h2>

                                <p className="mt-2 text-sm font-semibold text-white/55">
                                  {
                                    artwork
                                      .artist_profiles
                                      ?.display_name
                                  }
                                </p>
                              </div>

                              {artwork.price && (
                                <p className="whitespace-nowrap text-sm font-bold text-[#d09be9]">
                                  ₹ {artwork.price}
                                </p>
                              )}

                            </div>

                            {artwork.style && (
                              <p className="mt-4 text-xs font-bold uppercase tracking-[0.18em] text-white/40">
                                {artwork.style}
                              </p>
                            )}

                            {artwork.medium && (
                              <p className="mt-2 text-sm font-medium text-white/45">
                                {artwork.medium}
                              </p>
                            )}

                            <div className="mt-5 flex items-center justify-between border-t border-white/10 pt-4">
                              <span className="text-xs font-bold uppercase tracking-[0.2em] text-white/35 transition group-hover:text-[#d09be9]">
                                View artwork
                              </span>

                              <span className="text-white/40 transition group-hover:translate-x-1 group-hover:text-white">
                                →
                              </span>
                            </div>

                          </div>
                        </div>
                      </Link>
                    );
                  })}

                </div>

              </section>
            ) : (
              <section className="mt-16">

                <div className="rounded-3xl border border-white/15 bg-black/40 px-6 py-24 text-center backdrop-blur-xl">

                  <p className="text-2xl font-black text-white">
                    {searchQuery
                      ? "No artworks found."
                      : "No artworks available."}
                  </p>

                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() =>
                        setSearchParams({})
                      }
                      className="mt-7 rounded-full bg-[#8e4fc0] px-7 py-3 text-sm font-bold text-white transition hover:bg-[#a867d4]"
                    >
                      View all artwork
                    </button>
                  )}

                </div>

              </section>
            )}

          </div>

        </main>

        {/* ===================================================
            FOOTER
        =================================================== */}

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
              Discover art worth keeping.
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

export default Explore;