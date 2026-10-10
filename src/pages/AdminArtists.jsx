

import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../lib/supabase";

const navItems = [
  { label: "Overview", to: "/admin" },
  { label: "Users", to: "/admin/users" },
  { label: "Artists", to: "/admin/artists", active: true },
  { label: "Artworks", to: "/admin/artworks" },
  { label: "Orders", to: "/admin/orders" },
  { label: "Commissions", to: "/admin/commissions" },
 
];

function Sidebar() {
  return (
    <aside className="hidden w-64 shrink-0 border-r border-white/[0.08] bg-[#0c0b10] lg:block">
      <div className="sticky top-0 flex h-screen flex-col">
        <div className="border-b border-white/[0.08] px-6 py-7">
          <Link
            to="/"
            className="font-serif text-3xl tracking-wide text-white"
          >
            Anuktya<span className="text-[#a867d4]">.</span>
          </Link>

          <p className="mt-2 text-[10px] uppercase tracking-[0.28em] text-gray-500">
            Administration
          </p>
        </div>

        <nav className="flex-1 px-4 py-6">
          <p className="px-3 text-[10px] font-semibold uppercase tracking-[0.22em] text-gray-500">
            Management
          </p>

          <div className="mt-4 space-y-1.5">
            {navItems.map((item) => (
              <Link
                key={item.label}
                to={item.to}
                className={`block rounded-xl border px-4 py-3 text-sm transition ${
                  item.active
                    ? "border-[#8f5bb7]/30 bg-[#8f5bb7]/15 font-medium text-white shadow-[inset_2px_0_0_0_#a867d4]"
                    : "border-transparent text-gray-400 hover:border-white/[0.06] hover:bg-white/[0.04] hover:text-white"
                }`}
              >
                {item.label}
              </Link>
            ))}
          </div>
        </nav>

        <div className="border-t border-white/[0.08] p-4">
          <Link
            to="/"
            className="block rounded-xl px-4 py-3 text-sm text-gray-400 transition hover:bg-white/[0.05] hover:text-white"
          >
            <span className="mr-2">←</span>
            Back to Anuktya
          </Link>
        </div>
      </div>
    </aside>
  );
}

function ArtistAvatar({ artist, large = false }) {
  const [imageFailed, setImageFailed] = useState(false);
  const imageUrl = artist.profile_image;
  const initial =
    artist.display_name?.trim()?.charAt(0)?.toUpperCase() || "A";

  useEffect(() => {
    setImageFailed(false);
  }, [imageUrl]);

  const size = large ? "h-14 w-14" : "h-11 w-11";

  if (imageUrl && !imageFailed) {
    return (
      <img
        src={imageUrl}
        alt={artist.display_name || "Artist"}
        onError={() => setImageFailed(true)}
        className={`${size} shrink-0 rounded-full border border-white/10 object-cover`}
      />
    );
  }

  return (
    <div
      className={`${size} flex shrink-0 items-center justify-center rounded-full border border-[#8f5bb7]/25 bg-[#8f5bb7]/10 font-serif text-lg text-[#c59ae5]`}
    >
      {initial}
    </div>
  );
}

function StatusBadge({ enabled }) {
  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium ${
        enabled
          ? "border-emerald-400/20 bg-emerald-400/10 text-emerald-300"
          : "border-white/10 bg-white/[0.04] text-gray-400"
      }`}
    >
      <span
        className={`h-2 w-2 rounded-full ${
          enabled ? "bg-emerald-400" : "bg-gray-500"
        }`}
      />
      {enabled ? "Active" : "Inactive"}
    </span>
  );
}

function CommissionBadge({ enabled }) {
  return (
    <span
      className={`inline-flex rounded-full border px-3 py-1 text-xs font-medium ${
        enabled
          ? "border-[#8f5bb7]/30 bg-[#8f5bb7]/15 text-[#c59ae5]"
          : "border-white/10 bg-white/[0.04] text-gray-400"
      }`}
    >
      {enabled ? "Accepting" : "Unavailable"}
    </span>
  );
}

function StatCard({ label, value, description }) {
  return (
    <div className="rounded-2xl border border-white/[0.08] bg-white/[0.025] p-5">
      <p className="text-xs uppercase tracking-[0.18em] text-gray-500">
        {label}
      </p>

      <p className="mt-3 font-serif text-3xl text-[#c59ae5]">
        {value}
      </p>

      <p className="mt-2 text-xs text-gray-500">{description}</p>
    </div>
  );
}

function ArtistCard({ artist, formatDate }) {
  return (
    <div className="border-b border-white/[0.07] p-5 last:border-b-0">
      <div className="flex items-start gap-3">
        <ArtistAvatar artist={artist} large />

        <div className="min-w-0 flex-1">
          <p className="truncate font-medium text-white">
            {artist.display_name || "Unnamed artist"}
          </p>

          <p className="mt-1 truncate text-xs text-gray-500">
            {artist.location || "Location not provided"}
          </p>

          <p className="mt-2 text-sm leading-6 text-gray-400">
            {artist.bio || "No biography provided."}
          </p>
        </div>
      </div>

      <div className="mt-4 rounded-lg border border-white/[0.06] bg-black/20 p-3">
        <p className="text-[10px] uppercase tracking-[0.16em] text-gray-600">
          Artist ID
        </p>
        <p className="mt-1 break-all font-mono text-xs text-gray-400">
          {artist.id}
        </p>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-4">
        <div>
          <p className="mb-2 text-[10px] uppercase tracking-wider text-gray-500">
            Commissions
          </p>
          <CommissionBadge enabled={artist.commission_enabled} />
        </div>

        <div>
          <p className="mb-2 text-[10px] uppercase tracking-wider text-gray-500">
            Status
          </p>
          <StatusBadge enabled />
        </div>
      </div>

      <p className="mt-4 text-xs text-gray-500">
        Joined {formatDate(artist.created_at)}
      </p>
    </div>
  );
}

export default function AdminArtists() {
  const [artists, setArtists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  const fetchArtists = useCallback(async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    setError("");

    try {
      const { data, error: fetchError } = await supabase
        .from("artist_profiles")
        .select(
          "id, user_id, display_name, bio, profile_image, location, commission_enabled, created_at"
        )
        .order("created_at", { ascending: false });

      if (fetchError) throw fetchError;

      setArtists(data || []);
    } catch (err) {
      console.error("Error fetching artists:", err);
      setError(err.message || "Unable to load artists. Please try again.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchArtists();
  }, [fetchArtists]);

  const filteredArtists = artists.filter((artist) => {
    const query = search.trim().toLowerCase();

    if (!query) return true;

    return [
      artist.display_name,
      artist.location,
      artist.bio,
      artist.id,
      artist.user_id,
    ].some((value) => value?.toLowerCase().includes(query));
  });

  const commissionEnabledCount = artists.filter(
    (artist) => artist.commission_enabled
  ).length;

  const formatDate = (date) => {
    if (!date) return "—";

    const parsedDate = new Date(date);

    if (Number.isNaN(parsedDate.getTime())) return "—";

    return parsedDate.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  return (
    <div className="min-h-screen bg-[#08080b] text-white">
      <div className="flex min-h-screen">
        <Sidebar />

        <main className="min-w-0 flex-1 px-4 py-6 sm:px-6 sm:py-10 lg:px-10">
          <div className="mx-auto max-w-7xl">
            {/* Header */}
            <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.25em] text-[#b58bd0]">
                  Administration / Management
                </p>

                <h1 className="mt-3 font-serif text-4xl tracking-tight text-white sm:text-5xl">
                  Artists
                </h1>

                <p className="mt-3 max-w-xl text-sm leading-6 text-gray-400 sm:text-base">
                  Manage artist profiles, explore creators, and review their
                  commission availability.
                </p>
              </div>

              <button
                type="button"
                onClick={() => fetchArtists(true)}
                disabled={loading || refreshing}
                className="inline-flex items-center justify-center gap-2 self-start rounded-xl border border-[#8f5bb7]/40 bg-[#8f5bb7]/15 px-5 py-3 text-sm font-medium text-purple-100 transition hover:border-[#a867d4]/70 hover:bg-[#8f5bb7]/25 disabled:cursor-not-allowed disabled:opacity-50 sm:self-auto"
              >
                <span className={refreshing ? "animate-spin" : ""}>↻</span>
                {refreshing ? "Refreshing..." : "Refresh artists"}
              </button>
            </div>

            {/* Statistics */}
            <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
              <StatCard
                label="Total artists"
                value={loading ? "—" : artists.length}
                description="Artist profiles registered"
              />

              <StatCard
                label="Accepting commissions"
                value={loading ? "—" : commissionEnabledCount}
                description="Artists accepting new work"
              />

              <StatCard
                label="Displayed artists"
                value={loading ? "—" : filteredArtists.length}
                description="Profiles matching your search"
              />
            </div>

            {/* Search */}
            <div className="mt-8">
              <label
                htmlFor="artist-search"
                className="mb-2 block text-xs font-medium uppercase tracking-[0.16em] text-gray-400"
              >
                Search artists
              </label>

              <div className="relative">
                <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">
                  ⌕
                </span>

                <input
                  id="artist-search"
                  type="text"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search by name, location, bio, or artist ID..."
                  className="w-full rounded-xl border border-white/10 bg-[#111016] py-3.5 pl-11 pr-20 text-sm text-white outline-none transition placeholder:text-gray-600 focus:border-[#8f5bb7]/70 focus:ring-2 focus:ring-[#8f5bb7]/10"
                />

                {search && (
                  <button
                    type="button"
                    onClick={() => setSearch("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg px-3 py-1.5 text-xs text-gray-400 transition hover:bg-white/[0.06] hover:text-white"
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="mt-6 rounded-xl border border-red-400/20 bg-red-500/[0.08] p-4 text-sm text-red-300">
                <p>{error}</p>

                <button
                  type="button"
                  onClick={() => fetchArtists()}
                  className="mt-2 font-medium underline underline-offset-4 hover:text-white"
                >
                  Try again
                </button>
              </div>
            )}

            {/* Artists table and mobile cards */}
            <div className="mt-6 overflow-hidden rounded-2xl border border-white/[0.09] bg-[#0e0d12] shadow-2xl shadow-black/20">
              <div className="flex flex-col gap-1 border-b border-white/[0.08] px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
                <div>
                  <h2 className="font-serif text-xl text-white">
                    Registered artists
                  </h2>

                  <p className="mt-1 text-xs text-gray-500">
                    Artist profiles and commission availability
                  </p>
                </div>

                {!loading && (
                  <span className="mt-2 inline-flex w-fit items-center rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs text-gray-300 sm:mt-0">
                    {filteredArtists.length} results
                  </span>
                )}
              </div>

              {/* Loading state */}
              {loading ? (
                <div className="space-y-4 p-6">
                  {[1, 2, 3, 4, 5].map((item) => (
                    <div
                      key={item}
                      className="h-16 animate-pulse rounded-xl bg-white/[0.04]"
                    />
                  ))}
                </div>
              ) : filteredArtists.length === 0 ? (
                /* Empty state */
                <div className="px-6 py-20 text-center">
                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-[#8f5bb7]/20 bg-[#8f5bb7]/10 text-2xl text-[#b58bd0]">
                    ⌕
                  </div>

                  <h3 className="mt-5 font-serif text-2xl text-white">
                    {search ? "No matching artists" : "No artists found"}
                  </h3>

                  <p className="mt-2 text-sm text-gray-500">
                    {search
                      ? "Try a different search term."
                      : "Artist profiles will appear here when available."}
                  </p>

                  {search && (
                    <button
                      type="button"
                      onClick={() => setSearch("")}
                      className="mt-5 rounded-lg px-4 py-2 text-sm text-[#c59ae5] transition hover:bg-[#8f5bb7]/10"
                    >
                      Clear search
                    </button>
                  )}
                </div>
              ) : (
                <>
                  {/* Desktop table */}
                  <div className="hidden overflow-x-auto md:block">
                    <table className="w-full text-left">
                      <thead>
                        <tr className="border-b border-white/[0.08] bg-white/[0.02]">
                          {[
                            "Artist",
                            "Location",
                            "Commissions",
                            "Joined",
                            "Status",
                          ].map((heading) => (
                            <th
                              key={heading}
                              className="whitespace-nowrap px-6 py-4 text-[10px] font-semibold uppercase tracking-[0.18em] text-gray-500"
                            >
                              {heading}
                            </th>
                          ))}
                        </tr>
                      </thead>

                      <tbody className="divide-y divide-white/[0.06]">
                        {filteredArtists.map((artist) => (
                          <tr
                            key={artist.id}
                            className="transition hover:bg-white/[0.025]"
                          >
                            <td className="min-w-[270px] px-6 py-5">
                              <div className="flex items-center gap-3">
                                <ArtistAvatar artist={artist} />

                                <div className="min-w-0">
                                  <p className="font-medium text-gray-100">
                                    {artist.display_name || "Unnamed artist"}
                                  </p>

                                  <p className="mt-1 max-w-[260px] truncate text-xs text-gray-500">
                                    {artist.bio || "No biography provided"}
                                  </p>

                                  <p
                                    title={artist.id}
                                    className="mt-1 max-w-[260px] truncate font-mono text-[10px] text-gray-600"
                                  >
                                    {artist.id}
                                  </p>
                                </div>
                              </div>
                            </td>

                            <td className="whitespace-nowrap px-6 py-5 text-sm text-gray-400">
                              {artist.location || "—"}
                            </td>

                            <td className="whitespace-nowrap px-6 py-5">
                              <CommissionBadge
                                enabled={artist.commission_enabled}
                              />
                            </td>

                            <td className="whitespace-nowrap px-6 py-5 text-sm text-gray-400">
                              {formatDate(artist.created_at)}
                            </td>

                            <td className="whitespace-nowrap px-6 py-5">
                              <StatusBadge enabled />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Mobile and tablet cards */}
                  <div className="divide-y divide-white/[0.07] md:hidden">
                    {filteredArtists.map((artist) => (
                      <ArtistCard
                        key={artist.id}
                        artist={artist}
                        formatDate={formatDate}
                      />
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* Footer count */}
            {!loading && (
              <div className="mt-4 flex flex-col gap-1 text-xs text-gray-500 sm:flex-row sm:items-center sm:justify-between">
                <p>
                  Showing{" "}
                  <span className="font-medium text-gray-300">
                    {filteredArtists.length}
                  </span>{" "}
                  of{" "}
                  <span className="font-medium text-gray-300">
                    {artists.length}
                  </span>{" "}
                  artists
                </p>

                <p className="text-gray-600">
                  Anuktya Administration
                </p>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

