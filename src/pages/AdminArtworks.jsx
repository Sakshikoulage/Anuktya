
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../lib/supabase";
const StatCard = ({ label, value, description }) => (
    <div className="rounded-2xl border border-white/[0.08] bg-white/[0.035] p-5 transition hover:border-purple-400/30 hover:bg-white/[0.05]">
      <p className="text-xs font-medium uppercase tracking-[0.16em] text-gray-500">
        {label}
      </p>
      <p className="mt-3 font-serif text-3xl text-white">
        {value}
      </p>
      <p className="mt-2 text-xs text-gray-500">{description}</p>
    </div>
  );

const AdminArtworks = () => {
  const [artworks, setArtworks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [availabilityFilter, setAvailabilityFilter] = useState("ALL");
  const [updatingId, setUpdatingId] = useState(null);

  useEffect(() => {
    fetchArtworks();
  }, []);

  const fetchArtworks = async () => {
    try {
      setLoading(true);
      setError("");

      const { data, error } = await supabase
        .from("artworks")
        .select(`
          id,
          title,
          price,
          listing_type,
          availability,
          quantity,
          medium,
          style,
          is_original,
          created_at,
          artist_profiles (
            id,
            display_name
          ),
          artwork_images (
            storage_path,
            is_primary,
            display_order
          )
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;

      setArtworks(data || []);
    } catch (err) {
      console.error("Admin artworks error:", err);
      setError(err.message || "Failed to load artworks.");
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(Number(amount || 0));

  const formatDate = (date) => {
    if (!date) return "Date unavailable";

    const parsedDate = new Date(date);

    if (Number.isNaN(parsedDate.getTime())) {
      return "Date unavailable";
    }

    return parsedDate.toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const getArtist = (artwork) =>
    Array.isArray(artwork.artist_profiles)
      ? artwork.artist_profiles[0]
      : artwork.artist_profiles;

  const getImageUrl = (artwork) => {
    const images = artwork.artwork_images || [];

    if (!images.length) return null;

    const image =
      images.find((item) => item.is_primary) ||
      [...images].sort(
        (a, b) =>
          (a.display_order || 0) - (b.display_order || 0)
      )[0];

    if (!image?.storage_path) return null;

    return supabase.storage
      .from("artwork-images")
      .getPublicUrl(image.storage_path).data.publicUrl;
  };

  const filteredArtworks = artworks.filter((artwork) => {
    const artist = getArtist(artwork);
    const query = search.trim().toLowerCase();

    const matchesSearch = [
      artwork.title,
      artist?.display_name,
      artwork.medium,
      artwork.style,
      artwork.listing_type,
    ].some((value) => value?.toLowerCase().includes(query));

    const matchesAvailability =
      availabilityFilter === "ALL" ||
      artwork.availability === availabilityFilter;

    return matchesSearch && matchesAvailability;
  });

  const counts = {
    total: artworks.length,
    available: artworks.filter(
      (item) => item.availability === "AVAILABLE"
    ).length,
    sold: artworks.filter(
      (item) => item.availability === "SOLD"
    ).length,
    unavailable: artworks.filter(
      (item) => item.availability === "UNAVAILABLE"
    ).length,
  };

  const changeAvailability = async (artwork) => {
    if (
      artwork.availability !== "AVAILABLE" &&
      artwork.availability !== "UNAVAILABLE"
    ) {
      return;
    }

    const nextAvailability =
      artwork.availability === "AVAILABLE"
        ? "UNAVAILABLE"
        : "AVAILABLE";

    const action =
      nextAvailability === "UNAVAILABLE"
        ? "hide"
        : "make visible";

    const confirmed = window.confirm(
      `Are you sure you want to ${action} "${artwork.title}"?`
    );

    if (!confirmed) return;

    try {
      setUpdatingId(artwork.id);
      setError("");

      const { error } = await supabase
        .from("artworks")
        .update({
          availability: nextAvailability,
          updated_at: new Date().toISOString(),
        })
        .eq("id", artwork.id);

      if (error) throw error;

      setArtworks((current) =>
        current.map((item) =>
          item.id === artwork.id
            ? { ...item, availability: nextAvailability }
            : item
        )
      );
    } catch (err) {
      console.error("Artwork availability update error:", err);
      setError(err.message || "Failed to update artwork.");
    } finally {
      setUpdatingId(null);
    }
  };

  const badgeStyles = {
    AVAILABLE:
      "border-emerald-400/20 bg-emerald-400/10 text-emerald-300",
    SOLD: "border-amber-400/20 bg-amber-400/10 text-amber-300",
    UNAVAILABLE:
      "border-white/10 bg-white/5 text-gray-400",
  };

  const availabilityBadge = (availability) =>
    badgeStyles[availability] ||
    "border-white/10 bg-white/5 text-gray-400";

  const navItems = [
    { label: "Overview", to: "/admin" },
    { label: "Users", to: "/admin/users" },
    { label: "Artists", to: "/admin/artists" },
    { label: "Artworks", to: "/admin/artworks" },
    { label: "Orders", to: "/admin/orders" },
    { label: "Commissions", to: "/admin/commissions" },
    { label: "Categories", to: "/admin/categories" },
  ];

  

  const ArtworkImage = ({ artwork, className = "" }) => {
    const imageUrl = getImageUrl(artwork);

    return imageUrl ? (
      <img
        src={imageUrl}
        alt={artwork.title || "Artwork"}
        loading="lazy"
        className={`object-cover ${className}`}
      />
    ) : (
      <div
        className={`flex items-center justify-center bg-gradient-to-br from-[#21182b] to-[#111114] text-xs text-gray-500 ${className}`}
      >
        No image
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#09090b] text-white">
      <div className="flex min-h-screen">
        {/* Sidebar */}
        <aside className="hidden w-64 shrink-0 border-r border-white/[0.08] bg-[#0d0d10] lg:block">
          <div className="sticky top-0 flex h-screen flex-col">
            <div className="border-b border-white/[0.08] px-6 py-7">
              <Link
                to="/admin"
                className="font-serif text-3xl tracking-wide text-white"
              >
                Anuktya
              </Link>
              <p className="mt-2 text-[10px] uppercase tracking-[0.28em] text-purple-300/80">
                Administration
              </p>
            </div>

            <nav className="flex-1 overflow-y-auto px-4 py-6">
              <p className="px-3 text-[10px] uppercase tracking-[0.2em] text-gray-600">
                Management
              </p>

              <div className="mt-4 space-y-1">
                {navItems.map((item) => {
                  const active = item.to === "/admin/artworks";

                  return (
                    <Link
                      key={item.to}
                      to={item.to}
                      className={`block rounded-xl border px-4 py-3 text-sm transition ${
                        active
                          ? "border-purple-400/20 bg-purple-500/10 text-purple-200"
                          : "border-transparent text-gray-400 hover:border-white/[0.06] hover:bg-white/[0.04] hover:text-white"
                      }`}
                    >
                      {item.label}
                    </Link>
                  );
                })}
              </div>
            </nav>

            <div className="border-t border-white/[0.08] p-4">
              <Link
                to="/"
                className="block rounded-xl px-4 py-3 text-sm text-gray-500 transition hover:bg-white/[0.04] hover:text-white"
              >
                ← Back to Anuktya
              </Link>
            </div>
          </div>
        </aside>

        {/* Main content */}
        <main className="min-w-0 flex-1 px-4 py-6 sm:px-6 sm:py-9 xl:px-10">
          <div className="mx-auto max-w-7xl">
            {/* Mobile navigation */}
            <div className="mb-8 lg:hidden">
              <Link
                to="/admin"
                className="font-serif text-2xl text-white"
              >
                Anuktya
              </Link>

              <div className="mt-4 flex gap-2 overflow-x-auto pb-2">
                {navItems.map((item) => (
                  <Link
                    key={item.to}
                    to={item.to}
                    className={`shrink-0 rounded-full border px-4 py-2 text-xs transition ${
                      item.to === "/admin/artworks"
                        ? "border-purple-400/30 bg-purple-500/10 text-purple-200"
                        : "border-white/10 text-gray-400 hover:bg-white/5"
                    }`}
                  >
                    {item.label}
                  </Link>
                ))}
              </div>
            </div>

            {/* Page heading */}
            <header className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.25em] text-purple-300/80">
                  Administration / Catalogue
                </p>

                <h1 className="mt-3 font-serif text-4xl tracking-tight text-white sm:text-5xl">
                  Artworks
                </h1>

                <p className="mt-3 max-w-xl text-sm leading-6 text-gray-400">
                  Review artwork listings, monitor availability, and
                  manage what appears in the marketplace.
                </p>
              </div>

              <button
                type="button"
                onClick={fetchArtworks}
                disabled={loading}
                className="inline-flex items-center justify-center gap-2 self-start rounded-xl border border-white/10 bg-white/[0.04] px-5 py-3 text-sm text-gray-200 transition hover:border-purple-400/40 hover:bg-purple-500/10 disabled:cursor-not-allowed disabled:opacity-50 sm:self-auto"
              >
                <span aria-hidden="true">↻</span>
                {loading ? "Refreshing..." : "Refresh listings"}
              </button>
            </header>

            {/* Summary cards */}
            <section className="mt-8 grid grid-cols-2 gap-3 xl:grid-cols-4">
              <StatCard
                label="Total artworks"
                value={counts.total}
                description="All listings"
              />
              <StatCard
                label="Available"
                value={counts.available}
                description="Currently available"
              />
              <StatCard
                label="Sold"
                value={counts.sold}
                description="Marked as sold"
              />
              <StatCard
                label="Unavailable"
                value={counts.unavailable}
                description="Hidden listings"
              />
            </section>

            {/* Search and filters */}
            <section className="mt-8 rounded-2xl border border-white/[0.08] bg-[#101013] p-4 sm:p-5">
              <div className="flex flex-col gap-3 md:flex-row">
                <div className="relative min-w-0 flex-1">
                  <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">
                    ⌕
                  </span>

                  <input
                    type="search"
                    placeholder="Search by title, artist, medium or style..."
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-[#09090b] py-3 pl-11 pr-4 text-sm text-white outline-none transition placeholder:text-gray-600 focus:border-purple-400/60 focus:ring-2 focus:ring-purple-500/10"
                  />
                </div>

                <select
                  value={availabilityFilter}
                  onChange={(event) =>
                    setAvailabilityFilter(event.target.value)
                  }
                  className="rounded-xl border border-white/10 bg-[#09090b] px-4 py-3 text-sm text-gray-200 outline-none focus:border-purple-400/60"
                  aria-label="Filter by availability"
                >
                  <option value="ALL">All availability</option>
                  <option value="AVAILABLE">Available</option>
                  <option value="SOLD">Sold</option>
                  <option value="UNAVAILABLE">Unavailable</option>
                </select>
              </div>

              <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                <p className="text-xs text-gray-500">
                  Showing{" "}
                  <span className="font-medium text-gray-300">
                    {filteredArtworks.length}
                  </span>{" "}
                  of {artworks.length} artworks
                </p>

                {(search || availabilityFilter !== "ALL") && (
                  <button
                    type="button"
                    onClick={() => {
                      setSearch("");
                      setAvailabilityFilter("ALL");
                    }}
                    className="text-xs text-purple-300 transition hover:text-purple-200"
                  >
                    Clear filters
                  </button>
                )}
              </div>
            </section>

            {/* Errors */}
            {error && (
              <div
                role="alert"
                className="mt-5 flex flex-col gap-3 rounded-xl border border-red-400/20 bg-red-400/[0.07] p-4 text-sm text-red-200 sm:flex-row sm:items-center sm:justify-between"
              >
                <p>{error}</p>
                <button
                  type="button"
                  onClick={fetchArtworks}
                  className="shrink-0 text-left underline underline-offset-4 hover:text-white"
                >
                  Try again
                </button>
              </div>
            )}

            {/* Artwork listings */}
            <section className="mt-5 overflow-hidden rounded-2xl border border-white/[0.08] bg-[#101013]">
              {loading ? (
                <div className="space-y-4 p-5 sm:p-6">
                  {[1, 2, 3, 4].map((item) => (
                    <div
                      key={item}
                      className="h-24 animate-pulse rounded-xl bg-white/[0.04]"
                    />
                  ))}
                </div>
              ) : filteredArtworks.length === 0 ? (
                <div className="px-6 py-20 text-center">
                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-purple-400/20 bg-purple-500/[0.08] text-2xl text-purple-200">
                    ◇
                  </div>

                  <h2 className="mt-5 font-serif text-2xl text-white">
                    No artworks found
                  </h2>

                  <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-gray-500">
                    There are no listings matching your search or
                    selected availability filter.
                  </p>

                  {(search || availabilityFilter !== "ALL") && (
                    <button
                      type="button"
                      onClick={() => {
                        setSearch("");
                        setAvailabilityFilter("ALL");
                      }}
                      className="mt-5 rounded-xl bg-purple-500 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-purple-400"
                    >
                      Clear filters
                    </button>
                  )}
                </div>
              ) : (
                <>
                  {/* Desktop table */}
                  <div className="hidden overflow-x-auto md:block">
                    <table className="w-full text-left">
                      <thead>
                        <tr className="border-b border-white/[0.08] bg-white/[0.025]">
                          {[
                            "Artwork",
                            "Artist",
                            "Type",
                            "Price",
                            "Availability",
                            "Action",
                          ].map((heading) => (
                            <th
                              key={heading}
                              className="whitespace-nowrap px-5 py-4 text-[10px] font-medium uppercase tracking-[0.16em] text-gray-500 first:pl-6 last:pr-6"
                            >
                              {heading}
                            </th>
                          ))}
                        </tr>
                      </thead>

                      <tbody className="divide-y divide-white/[0.06]">
                        {filteredArtworks.map((artwork) => {
                          const artist = getArtist(artwork);

                          return (
                            <tr
                              key={artwork.id}
                              className="transition hover:bg-white/[0.025]"
                            >
                              <td className="min-w-[250px] px-6 py-4">
                                <div className="flex items-center gap-4">
                                  <ArtworkImage
                                    artwork={artwork}
                                    className="h-16 w-16 shrink-0 rounded-xl border border-white/[0.08]"
                                  />

                                  <div className="min-w-0">
                                    <Link
                                      to={`/artwork/${artwork.id}`}
                                      className="line-clamp-2 text-sm font-medium text-gray-100 transition hover:text-purple-300"
                                    >
                                      {artwork.title || "Untitled artwork"}
                                    </Link>

                                    <p className="mt-1 text-xs text-gray-500">
                                      {artwork.medium ||
                                        "Medium not specified"}
                                    </p>

                                    <p className="mt-1 text-[11px] text-gray-600">
                                      Added {formatDate(artwork.created_at)}
                                    </p>
                                  </div>
                                </div>
                              </td>

                              <td className="whitespace-nowrap px-5 py-4 text-sm text-gray-300">
                                {artist?.display_name || "Unknown artist"}
                              </td>

                              <td className="px-5 py-4">
                                <span className="inline-flex rounded-full border border-purple-400/15 bg-purple-400/[0.07] px-3 py-1 text-xs text-purple-200">
                                  {artwork.listing_type || "Unspecified"}
                                </span>

                                {artwork.is_original && (
                                  <p className="mt-2 text-[10px] uppercase tracking-wider text-gray-500">
                                    Original
                                  </p>
                                )}
                              </td>

                              <td className="whitespace-nowrap px-5 py-4">
                                <p className="text-sm font-medium text-gray-100">
                                  {formatCurrency(artwork.price)}
                                </p>

                                {artwork.quantity != null && (
                                  <p className="mt-1 text-xs text-gray-500">
                                    Qty: {artwork.quantity}
                                  </p>
                                )}
                              </td>

                              <td className="px-5 py-4">
                                <span
                                  className={`inline-flex whitespace-nowrap rounded-full border px-3 py-1 text-[11px] font-medium ${availabilityBadge(
                                    artwork.availability
                                  )}`}
                                >
                                  {artwork.availability || "UNKNOWN"}
                                </span>
                              </td>

                              <td className="whitespace-nowrap px-5 py-4 text-right">
                                {artwork.availability === "SOLD" ? (
                                  <span className="text-xs text-gray-600">
                                    Sold
                                  </span>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={() =>
                                      changeAvailability(artwork)
                                    }
                                    disabled={
                                      updatingId === artwork.id
                                    }
                                    className={`rounded-lg border px-3 py-2 text-xs font-medium transition disabled:cursor-not-allowed disabled:opacity-50 ${
                                      artwork.availability === "AVAILABLE"
                                        ? "border-red-400/20 text-red-300 hover:bg-red-400/10"
                                        : artwork.availability === "UNAVAILABLE"
                                          ? "border-purple-400/30 text-purple-200 hover:bg-purple-500/10"
                                          : "border-white/10 text-gray-500"
                                    }`}
                                  >
                                    {updatingId === artwork.id
                                      ? "Updating..."
                                      : artwork.availability === "AVAILABLE"
                                        ? "Hide listing"
                                        : artwork.availability === "UNAVAILABLE"
                                          ? "Make visible"
                                          : "Unavailable"}
                                  </button>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  {/* Mobile cards */}
                  <div className="grid gap-3 p-3 md:hidden">
                    {filteredArtworks.map((artwork) => {
                      const artist = getArtist(artwork);

                      return (
                        <article
                          key={artwork.id}
                          className="rounded-xl border border-white/[0.08] bg-[#0c0c0f] p-4"
                        >
                          <div className="flex gap-4">
                            <ArtworkImage
                              artwork={artwork}
                              className="h-24 w-24 shrink-0 rounded-xl border border-white/[0.08]"
                            />

                            <div className="min-w-0 flex-1">
                              <Link
                                to={`/artwork/${artwork.id}`}
                                className="line-clamp-2 font-medium text-white transition hover:text-purple-300"
                              >
                                {artwork.title || "Untitled artwork"}
                              </Link>

                              <p className="mt-1 text-xs text-gray-400">
                                {artist?.display_name || "Unknown artist"}
                              </p>

                              <p className="mt-1 text-xs text-gray-500">
                                {artwork.medium || "Medium not specified"}
                              </p>

                              <p className="mt-2 font-medium text-purple-200">
                                {formatCurrency(artwork.price)}
                              </p>
                            </div>
                          </div>

                          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-white/[0.07] pt-3">
                            <div>
                              <span
                                className={`inline-flex rounded-full border px-3 py-1 text-[11px] ${availabilityBadge(
                                  artwork.availability
                                )}`}
                              >
                                {artwork.availability || "UNKNOWN"}
                              </span>

                              <p className="mt-2 text-[11px] text-gray-600">
                                {artwork.listing_type || "Unspecified"}
                                {artwork.is_original ? " · Original" : ""}
                              </p>
                            </div>

                            {artwork.availability === "SOLD" ? (
                              <span className="text-xs text-gray-600">
                                Sold
                              </span>
                            ) : (
                              <button
                                type="button"
                                onClick={() =>
                                  changeAvailability(artwork)
                                }
                                disabled={
                                  updatingId === artwork.id ||
                                  !["AVAILABLE", "UNAVAILABLE"].includes(
                                    artwork.availability
                                  )
                                }
                                className="rounded-lg border border-purple-400/25 px-3 py-2 text-xs font-medium text-purple-200 transition hover:bg-purple-500/10 disabled:opacity-50"
                              >
                                {updatingId === artwork.id
                                  ? "Updating..."
                                  : artwork.availability === "AVAILABLE"
                                    ? "Hide listing"
                                    : artwork.availability === "UNAVAILABLE"
                                      ? "Make visible"
                                      : "Unavailable"}
                              </button>
                            )}
                          </div>

                          <p className="mt-3 text-[11px] text-gray-600">
                            Added {formatDate(artwork.created_at)}
                            {artwork.quantity != null
                              ? ` · Quantity: ${artwork.quantity}`
                              : ""}
                          </p>
                        </article>
                      );
                    })}
                  </div>
                </>
              )}
            </section>

            <footer className="py-6 text-center text-xs text-gray-600">
              Anuktya Admin · Artwork Management
            </footer>
          </div>
        </main>
      </div>
    </div>
  );
};

export default AdminArtworks;
