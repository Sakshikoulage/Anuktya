
import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { supabase } from "../lib/supabase";
import Navbar from "../components/Navbar";

function Explore() {
  const [artworks, setArtworks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");

  const [selectedStyle, setSelectedStyle] = useState("");
  const [selectedMedium, setSelectedMedium] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [sortBy, setSortBy] = useState("newest");

  const [filterOpen, setFilterOpen] = useState(false);
  const [sortOpen, setSortOpen] = useState(false);

  const [searchParams, setSearchParams] = useSearchParams();
  const searchQuery = searchParams.get("search") || "";

  // Fetch available artworks once.
  useEffect(() => {
    let isMounted = true;

    const fetchArtworks = async () => {
      setLoading(true);
      setError("");

      const { data, error: artworkError } = await supabase
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
        .eq("availability", "AVAILABLE")
        .order("created_at", { ascending: false });

      if (!isMounted) return;

      if (artworkError) {
        console.error("Artwork fetch error:", artworkError);
        setError("Could not load artworks. Please try again.");
        setArtworks([]);
      } else {
        setArtworks(data || []);
      }

      setLoading(false);
    };

    fetchArtworks();

    return () => {
      isMounted = false;
    };
  }, []);

  // Sync search input with the URL.
  useEffect(() => {
    setQuery(searchQuery);
  }, [searchQuery]);

  // Build filter dropdown options from loaded artworks.
  const styles = useMemo(
    () =>
      [
        ...new Set(
          artworks.map((artwork) => artwork.style).filter(Boolean)
        ),
      ].sort(),
    [artworks]
  );

  const mediums = useMemo(
    () =>
      [
        ...new Set(
          artworks.map((artwork) => artwork.medium).filter(Boolean)
        ),
      ].sort(),
    [artworks]
  );

  // Search, filter, and sort locally.
  const filteredArtworks = useMemo(() => {
    const terms = searchQuery
      .toLowerCase()
      .trim()
      .split(/\s+/)
      .filter(Boolean);

    const priceLimit =
      maxPrice.trim() === "" ? null : Number(maxPrice);

    const matches = artworks.filter((artwork) => {
      const searchableText = [
        artwork.title,
        artwork.description,
        artwork.style,
        artwork.medium,
        artwork.artist_profiles?.display_name,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      const matchesSearch = terms.every((term) =>
        searchableText.includes(term)
      );

      const matchesStyle =
        !selectedStyle || artwork.style === selectedStyle;

      const matchesMedium =
        !selectedMedium || artwork.medium === selectedMedium;

      const hasPrice =
        artwork.price != null && artwork.price !== "";

      const price = hasPrice
        ? Number(artwork.price)
        : Number.NaN;

      const matchesPrice =
        priceLimit === null ||
        (Number.isFinite(price) && price <= priceLimit);

      return (
        matchesSearch &&
        matchesStyle &&
        matchesMedium &&
        matchesPrice
      );
    });

    return matches.sort((a, b) => {
      const priceA =
        a.price != null && a.price !== ""
          ? Number(a.price)
          : Number.NaN;

      const priceB =
        b.price != null && b.price !== ""
          ? Number(b.price)
          : Number.NaN;

      if (sortBy === "price-low") {
        const safeA = Number.isFinite(priceA)
          ? priceA
          : Number.POSITIVE_INFINITY;

        const safeB = Number.isFinite(priceB)
          ? priceB
          : Number.POSITIVE_INFINITY;

        return safeA - safeB;
      }

      if (sortBy === "price-high") {
        const safeA = Number.isFinite(priceA)
          ? priceA
          : Number.NEGATIVE_INFINITY;

        const safeB = Number.isFinite(priceB)
          ? priceB
          : Number.NEGATIVE_INFINITY;

        return safeB - safeA;
      }

      const dateA = a.created_at
        ? new Date(a.created_at).getTime()
        : 0;

      const dateB = b.created_at
        ? new Date(b.created_at).getTime()
        : 0;

      return dateB - dateA;
    });
  }, [
    artworks,
    searchQuery,
    selectedStyle,
    selectedMedium,
    maxPrice,
    sortBy,
  ]);

  const handleSearch = (e) => {
    e.preventDefault();

    const trimmedQuery = query.trim();

    if (!trimmedQuery) {
      setSearchParams({});
      return;
    }

    setSearchParams({ search: trimmedQuery });
  };

  const clearFilters = () => {
    setSelectedStyle("");
    setSelectedMedium("");
    setMaxPrice("");
    setSortBy("newest");
  };

  const activeFilterCount = [
    selectedStyle,
    selectedMedium,
    maxPrice,
  ].filter(Boolean).length;

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

        <div className="relative z-10 flex min-h-screen items-center justify-center">
          <p className="text-sm font-semibold text-white/70">
            Loading artworks...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-black text-white">
      {/* Background */}
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
        <Navbar />

        {/* Extra bottom padding prevents the fixed bar from covering content */}
        <main className="px-6 pb-36 pt-36 md:px-10 lg:px-16">
          <div className="mx-auto max-w-7xl">
            {/* Header */}
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
                Discover artwork from independent artists and find something
                that speaks to you.
              </p>
            </section>

            {/* Search */}
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
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search artworks, artists, styles, or mediums..."
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

            {/* Search results heading */}
            {searchQuery && (
              <section className="mt-10">
                <p className="text-xs font-bold uppercase tracking-[0.3em] text-white/50">
                  Search results for
                </p>

                <p className="mt-3 text-3xl font-black text-white md:text-4xl">
                  “{searchQuery}”
                </p>
              </section>
            )}

            {error && (
              <div className="mt-8 rounded-2xl border border-red-400/20 bg-red-950/20 px-6 py-5 backdrop-blur-md">
                <p className="font-semibold text-red-200">{error}</p>
              </div>
            )}

            {/* Artwork grid */}
            {filteredArtworks.length > 0 ? (
              <section className="mt-12">
                <p className="mb-6 text-sm font-semibold text-white/50">
                  Showing {filteredArtworks.length}{" "}
                  {filteredArtworks.length === 1 ? "artwork" : "artworks"}
                </p>

                <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
                  {filteredArtworks.map((artwork) => {
                    const primaryImage = artwork.artwork_images?.find(
                      (image) => image.is_primary
                    );

                    const imageUrl = primaryImage
                      ? supabase.storage
                          .from("artwork-images")
                          .getPublicUrl(primaryImage.storage_path).data.publicUrl
                      : null;

                    return (
                      <Link
                        to={`/artwork/${artwork.id}`}
                        key={artwork.id}
                        className="group relative block"
                      >
                        <div className="absolute -inset-4 rounded-[2rem] bg-[#963fd0]/25 opacity-70 blur-2xl transition-all duration-500 group-hover:bg-[#bd63ed]/50 group-hover:opacity-100 group-hover:blur-3xl" />

                        <div className="relative overflow-hidden rounded-2xl border border-white/15 bg-black/55 p-4 shadow-2xl backdrop-blur-xl transition-all duration-500 group-hover:-translate-y-2 group-hover:border-[#bd7be4]/60">
                          <div className="relative aspect-[4/5] overflow-hidden rounded-xl bg-black">
                            {imageUrl ? (
                              <img
                                src={imageUrl}
                                alt={artwork.title || "Artwork"}
                                loading="lazy"
                                decoding="async"
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

                          <div className="px-1 pb-1 pt-5">
                            <div className="flex items-start justify-between gap-4">
                              <div>
                                <h2 className="text-xl font-black leading-tight text-white">
                                  {artwork.title}
                                </h2>

                                <p className="mt-2 text-sm font-semibold text-white/55">
                                  {artwork.artist_profiles?.display_name}
                                </p>
                              </div>

                              {artwork.price != null && artwork.price !== "" && (
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
              <section className="mt-12">
                <div className="rounded-3xl border border-white/15 bg-black/40 px-6 py-24 text-center backdrop-blur-xl">
                  <p className="text-2xl font-black text-white">
                    {searchQuery || selectedStyle || selectedMedium || maxPrice
                      ? "No artworks match your search or filters."
                      : "No artworks available."}
                  </p>

                  {(searchQuery || selectedStyle || selectedMedium || maxPrice) && (
                    <button
                      type="button"
                      onClick={() => {
                        setSearchParams({});
                        clearFilters();
                      }}
                      className="mt-7 rounded-full bg-[#8e4fc0] px-7 py-3 text-sm font-bold text-white transition hover:bg-[#a867d4]"
                    >
                      Clear search and filters
                    </button>
                  )}
                </div>
              </section>
            )}
          </div>
        </main>

        {/* Footer */}
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

      {/* Fixed bottom SORT / FILTER bar */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-white/15 bg-black/85 backdrop-blur-xl">
        <div className="mx-auto grid max-w-7xl grid-cols-2 px-6 pb-[max(12px,env(safe-area-inset-bottom))] pt-3 md:px-10 lg:px-16">
          <button
            type="button"
            onClick={() => {
              setFilterOpen(false);
              setSortOpen(true);
            }}
            className="flex items-center justify-center gap-2 border-r border-white/20 py-3 text-sm font-bold tracking-[0.18em] text-white transition hover:text-[#d09be9]"
          >
            <span aria-hidden="true">⇅</span> SORT
            {sortBy !== "newest" && (
              <span className="h-1.5 w-1.5 rounded-full bg-[#d09be9]" />
            )}
          </button>

          <button
            type="button"
            onClick={() => {
              setSortOpen(false);
              setFilterOpen(true);
            }}
            className="flex items-center justify-center gap-2 py-3 text-sm font-bold tracking-[0.18em] text-white transition hover:text-[#d09be9]"
          >
            <span aria-hidden="true">☷</span> FILTER
            {activeFilterCount > 0 && (
              <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-[#8e4fc0] px-1 text-[10px] tracking-normal">
                {activeFilterCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Sort options */}
      {sortOpen && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/65"
          onClick={() => setSortOpen(false)}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-label="Sort artworks"
            className="w-full max-w-2xl rounded-t-3xl border border-white/15 bg-[#17121c] px-6 pb-8 pt-4 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mx-auto mb-5 h-1 w-10 rounded-full bg-white/25" />

            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-bold tracking-wide text-white">
                SORT BY
              </h2>

              <button
                type="button"
                onClick={() => setSortOpen(false)}
                aria-label="Close sort options"
                className="px-2 py-1 text-white/60 hover:text-white"
              >
                ✕
              </button>
            </div>

            {[
              { label: "Newest first", value: "newest" },
              { label: "Price: low to high", value: "price-low" },
              { label: "Price: high to low", value: "price-high" },
            ].map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => {
                  setSortBy(option.value);
                  setSortOpen(false);
                }}
                className="flex w-full items-center justify-between border-t border-white/10 py-4 text-left text-sm font-semibold text-white/85 hover:text-[#d09be9]"
              >
                {option.label}

                <span
                  className={`flex h-5 w-5 items-center justify-center rounded-full border ${
                    sortBy === option.value
                      ? "border-[#d09be9]"
                      : "border-white/40"
                  }`}
                >
                  {sortBy === option.value && (
                    <span className="h-2.5 w-2.5 rounded-full bg-[#d09be9]" />
                  )}
                </span>
              </button>
            ))}
          </section>
        </div>
      )}

      {/* Filter options */}
      {filterOpen && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/65"
          onClick={() => setFilterOpen(false)}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-label="Filter artworks"
            className="flex max-h-[85vh] w-full max-w-2xl flex-col overflow-hidden rounded-t-3xl border border-white/15 bg-[#17121c] shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="shrink-0 border-b border-white/10 px-6 pb-4 pt-4">
              <div className="mx-auto mb-5 h-1 w-10 rounded-full bg-white/25" />

              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold tracking-wide text-white">
                    FILTERS
                  </h2>
                  <p className="mt-1 text-sm text-white/50">
                    Refine your artwork search
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setFilterOpen(false)}
                  aria-label="Close filters"
                  className="px-2 py-1 text-white/60 hover:text-white"
                >
                  ✕
                </button>
              </div>
            </div>

            <div className="flex-1 space-y-5 overflow-y-auto px-6 py-5">
              <label className="block text-sm font-semibold text-white/70">
                Style
                <select
                  value={selectedStyle}
                  onChange={(e) => setSelectedStyle(e.target.value)}
                  className="mt-2 w-full rounded-xl border border-white/15 bg-[#0d0a12] px-3 py-3 text-sm text-white outline-none focus:border-[#b16ed7]"
                >
                  <option value="">All styles</option>
                  {styles.map((style) => (
                    <option key={style} value={style}>
                      {style}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block text-sm font-semibold text-white/70">
                Medium
                <select
                  value={selectedMedium}
                  onChange={(e) => setSelectedMedium(e.target.value)}
                  className="mt-2 w-full rounded-xl border border-white/15 bg-[#0d0a12] px-3 py-3 text-sm text-white outline-none focus:border-[#b16ed7]"
                >
                  <option value="">All mediums</option>
                  {mediums.map((medium) => (
                    <option key={medium} value={medium}>
                      {medium}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block text-sm font-semibold text-white/70">
                Maximum price (₹)
                <input
                  type="number"
                  min="0"
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(e.target.value)}
                  placeholder="Any price"
                  className="mt-2 w-full rounded-xl border border-white/15 bg-[#0d0a12] px-3 py-3 text-sm text-white outline-none placeholder:text-white/35 focus:border-[#b16ed7]"
                />
              </label>
            </div>

            <div className="shrink-0 border-t border-white/10 px-6 pb-[max(16px,env(safe-area-inset-bottom))] pt-4">
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={clearFilters}
                  className="rounded-full border border-white/25 px-4 py-3 text-sm font-bold text-white transition hover:bg-white/5"
                >
                  CLEAR ALL
                </button>

                <button
                  type="button"
                  onClick={() => setFilterOpen(false)}
                  className="rounded-full bg-[#8e4fc0] px-4 py-3 text-sm font-bold text-white transition hover:bg-[#a867d4]"
                >
                  APPLY FILTERS
                </button>
              </div>
            </div>
          </section>
        </div>
      )}

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;0,700;1,400;1,500;1,600&display=swap');
      `}</style>
    </div>
  );
}

export default Explore;