
import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../lib/supabase";

const navItems = [
  { label: "Overview", to: "/admin" },
  { label: "Users", to: "/admin/users" },
  { label: "Artists", to: "/admin/artists" },
  { label: "Artworks", to: "/admin/artworks" },
  { label: "Orders", to: "/admin/orders" },
  { label: "Commissions", to: "/admin/commissions", active: true },
  
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
            ← Back to Anuktya
          </Link>
        </div>
      </div>
    </aside>
  );
}

function StatCard({ label, value, description }) {
  return (
    <div className="rounded-2xl border border-white/[0.08] bg-white/[0.025] p-5">
      <p className="text-xs uppercase tracking-[0.18em] text-gray-500">
        {label}
      </p>
      <p className="mt-3 break-words font-serif text-3xl text-[#c59ae5]">
        {value}
      </p>
      <p className="mt-2 text-xs text-gray-500">{description}</p>
    </div>
  );
}

function StatusBadge({ value, type = "request" }) {
  if (!value) return null;

  const stylesByType = {
    request: {
      PENDING: "border-amber-400/20 bg-amber-400/10 text-amber-300",
      NEGOTIATING: "border-blue-400/20 bg-blue-400/10 text-blue-300",
      ACCEPTED:
        "border-emerald-400/20 bg-emerald-400/10 text-emerald-300",
      REJECTED: "border-red-400/20 bg-red-400/10 text-red-300",
      CANCELLED: "border-white/10 bg-white/[0.04] text-gray-400",
    },
    payment: {
      PENDING: "border-amber-400/20 bg-amber-400/10 text-amber-300",
      PAID: "border-emerald-400/20 bg-emerald-400/10 text-emerald-300",
      FAILED: "border-red-400/20 bg-red-400/10 text-red-300",
      REFUNDED:
        "border-purple-400/20 bg-purple-400/10 text-purple-300",
    },
    order: {
      AWAITING_PAYMENT:
        "border-amber-400/20 bg-amber-400/10 text-amber-300",
      IN_PROGRESS: "border-blue-400/20 bg-blue-400/10 text-blue-300",
      COMPLETED:
        "border-emerald-400/20 bg-emerald-400/10 text-emerald-300",
      CANCELLED: "border-red-400/20 bg-red-400/10 text-red-300",
    },
  };

  const styles =
    stylesByType[type]?.[value] ||
    "border-white/10 bg-white/[0.04] text-gray-400";

  return (
    <span
      className={`inline-flex rounded-full border px-3 py-1 text-xs font-medium ${styles}`}
    >
      {value.replaceAll("_", " ")}
    </span>
  );
}

function InfoBlock({ label, value }) {
  return (
    <div className="min-w-0 rounded-xl border border-white/[0.06] bg-black/20 p-4">
      <p className="text-[10px] uppercase tracking-[0.18em] text-gray-500">
        {label}
      </p>
      <p className="mt-2 break-words text-sm font-medium leading-6 text-gray-200">
        {value ?? "—"}
      </p>
    </div>
  );
}

function shortId(id) {
  if (!id) return "—";
  return `${id.slice(0, 8)}...`;
}

function formatDate(date) {
  if (!date) return "—";

  const parsedDate = new Date(date);
  if (Number.isNaN(parsedDate.getTime())) return "—";

  return parsedDate.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatCurrency(amount) {
  if (amount === null || amount === undefined) return "—";

  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Number(amount));
}

export default function AdminCommissions() {
  const [commissions, setCommissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  const fetchCommissions = useCallback(async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    setError("");

    try {
      const { data: requests, error: requestError } = await supabase
        .from("commission_requests")
        .select(`
          id,
          buyer_id,
          artist_id,
          status,
          agreed_price,
          created_at
        `)
        .order("created_at", { ascending: false });

      if (requestError) throw requestError;

      const requestRows = requests || [];

      if (requestRows.length === 0) {
        setCommissions([]);
        return;
      }

      const buyerIds = [
        ...new Set(
          requestRows.map((request) => request.buyer_id).filter(Boolean)
        ),
      ];

      const artistIds = [
        ...new Set(
          requestRows.map((request) => request.artist_id).filter(Boolean)
        ),
      ];

      const requestIds = requestRows.map((request) => request.id);

      const [
        { data: profiles, error: profilesError },
        { data: artists, error: artistsError },
        { data: orders, error: ordersError },
      ] = await Promise.all([
        buyerIds.length
          ? supabase
              .from("profiles")
              .select("id, full_name")
              .in("id", buyerIds)
          : Promise.resolve({ data: [], error: null }),

        artistIds.length
          ? supabase
              .from("artist_profiles")
              .select("id, display_name")
              .in("id", artistIds)
          : Promise.resolve({ data: [], error: null }),

        requestIds.length
          ? supabase
              .from("commission_orders")
              .select(`
                id,
                commission_request_id,
                agreed_price,
                status,
                payment_status,
                due_date,
                created_at,
                paid_at
              `)
              .in("commission_request_id", requestIds)
          : Promise.resolve({ data: [], error: null }),
      ]);

      if (profilesError) throw profilesError;
      if (artistsError) throw artistsError;
      if (ordersError) throw ordersError;

      const profileMap = new Map(
        (profiles || []).map((profile) => [profile.id, profile])
      );

      const artistMap = new Map(
        (artists || []).map((artist) => [artist.id, artist])
      );

      const orderMap = new Map(
        (orders || []).map((order) => [
          order.commission_request_id,
          order,
        ])
      );

      const merged = requestRows.map((request) => ({
        ...request,
        buyer: profileMap.get(request.buyer_id) || null,
        artist: artistMap.get(request.artist_id) || null,
        order: orderMap.get(request.id) || null,
      }));

      setCommissions(merged);
    } catch (err) {
      console.error("Admin commissions error:", err);
      setError(err.message || "Failed to load commissions.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchCommissions();
  }, [fetchCommissions]);

  const filteredCommissions = useMemo(() => {
    const query = search.trim().toLowerCase();

    return commissions.filter((commission) => {
      const order = commission.order;

      const matchesSearch =
        !query ||
        commission.id?.toLowerCase().includes(query) ||
        commission.buyer?.full_name?.toLowerCase().includes(query) ||
        commission.artist?.display_name?.toLowerCase().includes(query) ||
        commission.status?.toLowerCase().includes(query) ||
        order?.status?.toLowerCase().includes(query) ||
        order?.payment_status?.toLowerCase().includes(query);

      const matchesStatus =
        statusFilter === "ALL" || commission.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [commissions, search, statusFilter]);

  const stats = useMemo(() => {
    const total = commissions.length;

    const accepted = commissions.filter(
      (commission) => commission.status === "ACCEPTED"
    ).length;

    const pending = commissions.filter(
      (commission) =>
        commission.status === "PENDING" ||
        commission.status === "NEGOTIATING"
    ).length;

    const paid = commissions.filter(
      (commission) => commission.order?.payment_status === "PAID"
    ).length;

    const revenue = commissions.reduce((sum, commission) => {
      if (commission.order?.payment_status !== "PAID") return sum;

      return (
        sum +
        Number(
          commission.order?.agreed_price ??
            commission.agreed_price ??
            0
        )
      );
    }, 0);

    return { total, accepted, pending, paid, revenue };
  }, [commissions]);

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
                  Commissions
                </h1>

                <p className="mt-3 max-w-xl text-sm leading-6 text-gray-400 sm:text-base">
                  Manage custom artwork requests, review agreed prices,
                  and track commission payments and fulfillment.
                </p>
              </div>

              <button
                type="button"
                onClick={() => fetchCommissions(true)}
                disabled={loading || refreshing}
                className="inline-flex items-center justify-center gap-2 self-start rounded-xl border border-[#8f5bb7]/40 bg-[#8f5bb7]/15 px-5 py-3 text-sm font-medium text-purple-100 transition hover:border-[#a867d4]/70 hover:bg-[#8f5bb7]/25 disabled:cursor-not-allowed disabled:opacity-50 sm:self-auto"
              >
                <span className={refreshing ? "animate-spin" : ""}>↻</span>
                {refreshing ? "Refreshing..." : "Refresh commissions"}
              </button>
            </div>

            {/* Stats */}
            <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
              <StatCard
                label="Total requests"
                value={loading ? "—" : stats.total}
                description="All commission requests"
              />
              <StatCard
                label="Pending"
                value={loading ? "—" : stats.pending}
                description="Pending or negotiating"
              />
              <StatCard
                label="Accepted"
                value={loading ? "—" : stats.accepted}
                description="Accepted requests"
              />
              <StatCard
                label="Paid"
                value={loading ? "—" : stats.paid}
                description="Orders with paid status"
              />
              <StatCard
                label="Paid revenue"
                value={loading ? "—" : formatCurrency(stats.revenue)}
                description="Revenue from paid commissions"
              />
            </div>

            {/* Search and filters */}
            <div className="mt-8 flex flex-col gap-3 md:flex-row">
              <div className="relative min-w-0 flex-1">
                <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">
                  ⌕
                </span>

                <input
                  type="text"
                  aria-label="Search commissions"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search buyer, artist, commission ID..."
                  className="w-full rounded-xl border border-white/10 bg-[#111016] py-3.5 pl-11 pr-16 text-sm text-white outline-none transition placeholder:text-gray-600 focus:border-[#8f5bb7]/70 focus:ring-2 focus:ring-[#8f5bb7]/10"
                />

                {search && (
                  <button
                    type="button"
                    onClick={() => setSearch("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg px-2 py-1.5 text-xs text-gray-400 transition hover:bg-white/[0.06] hover:text-white"
                  >
                    Clear
                  </button>
                )}
              </div>

              <select
                aria-label="Filter by commission status"
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value)}
                className="rounded-xl border border-white/10 bg-[#111016] px-4 py-3.5 text-sm text-gray-300 outline-none focus:border-[#8f5bb7]/70"
              >
                <option value="ALL" className="bg-[#111016]">
                  All request statuses
                </option>
                {[
                  "PENDING",
                  "NEGOTIATING",
                  "ACCEPTED",
                  "REJECTED",
                  "CANCELLED",
                ].map((status) => (
                  <option key={status} value={status} className="bg-[#111016]">
                    {status.replaceAll("_", " ")}
                  </option>
                ))}
              </select>
            </div>

            {/* Error */}
            {error && (
              <div className="mt-6 rounded-xl border border-red-400/20 bg-red-500/[0.08] p-4 text-sm text-red-300">
                <p>{error}</p>
                <button
                  type="button"
                  onClick={() => fetchCommissions()}
                  className="mt-2 font-medium underline underline-offset-4 hover:text-white"
                >
                  Try again
                </button>
              </div>
            )}

            {/* Commission list */}
            <div className="mt-6 overflow-hidden rounded-2xl border border-white/[0.09] bg-[#0e0d12] shadow-2xl shadow-black/20">
              <div className="flex flex-col gap-1 border-b border-white/[0.08] px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
                <div>
                  <h2 className="font-serif text-xl text-white">
                    Commission requests
                  </h2>
                  <p className="mt-1 text-xs text-gray-500">
                    Request details, agreements, and payment status
                  </p>
                </div>

                {!loading && (
                  <span className="mt-2 inline-flex w-fit rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs text-gray-300 sm:mt-0">
                    {filteredCommissions.length} results
                  </span>
                )}
              </div>

              {loading ? (
                <div className="space-y-4 p-6">
                  {[1, 2, 3, 4].map((item) => (
                    <div
                      key={item}
                      className="h-44 animate-pulse rounded-xl bg-white/[0.04]"
                    />
                  ))}
                </div>
              ) : filteredCommissions.length === 0 ? (
                <div className="px-6 py-20 text-center">
                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-[#8f5bb7]/20 bg-[#8f5bb7]/10 text-2xl text-[#b58bd0]">
                    ⌕
                  </div>

                  <h3 className="mt-5 font-serif text-2xl text-white">
                    No commissions found
                  </h3>

                  <p className="mt-2 text-sm text-gray-500">
                    Try changing your search or status filter.
                  </p>

                  {(search || statusFilter !== "ALL") && (
                    <button
                      type="button"
                      onClick={() => {
                        setSearch("");
                        setStatusFilter("ALL");
                      }}
                      className="mt-5 rounded-lg px-4 py-2 text-sm text-[#c59ae5] transition hover:bg-[#8f5bb7]/10"
                    >
                      Clear filters
                    </button>
                  )}
                </div>
              ) : (
                <div className="divide-y divide-white/[0.07]">
                  {filteredCommissions.map((commission) => {
                    const order = commission.order;

                    const price =
                      order?.agreed_price ?? commission.agreed_price;

                    return (
                      <article key={commission.id} className="p-5 sm:p-6">
                        {/* Request heading */}
                        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                          <div className="min-w-0">
                            <p className="text-[10px] uppercase tracking-[0.2em] text-gray-500">
                              Commission request
                            </p>

                            <h3 className="mt-2 font-serif text-xl text-white">
                              {commission.artist?.display_name ||
                                "Unknown artist"}
                            </h3>

                            <p className="mt-1 text-sm text-gray-400">
                              Requested by{" "}
                              {commission.buyer?.full_name || "Unknown buyer"}
                            </p>

                            <p className="mt-2 font-mono text-xs text-gray-600">
                              ID: {shortId(commission.id)}
                            </p>
                          </div>

                          <div className="flex flex-wrap gap-2">
                            <StatusBadge value={commission.status} />

                            {order && (
                              <>
                                <StatusBadge
                                  value={order.payment_status}
                                  type="payment"
                                />
                                <StatusBadge
                                  value={order.status}
                                  type="order"
                                />
                              </>
                            )}
                          </div>
                        </div>

                        {/* Request details */}
                        <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                          <InfoBlock
                            label="Buyer"
                            value={
                              commission.buyer?.full_name || "Unknown buyer"
                            }
                          />

                          <InfoBlock
                            label="Artist"
                            value={
                              commission.artist?.display_name ||
                              "Unknown artist"
                            }
                          />

                          <InfoBlock
                            label="Agreed price"
                            value={formatCurrency(price)}
                          />

                          <InfoBlock
                            label="Request date"
                            value={formatDate(commission.created_at)}
                          />

                          <InfoBlock
                            label="Commission order"
                            value={
                              order ? shortId(order.id) : "Not created"
                            }
                          />

                          <InfoBlock
                            label="Due date"
                            value={formatDate(order?.due_date)}
                          />

                          <InfoBlock
                            label="Paid date"
                            value={formatDate(order?.paid_at)}
                          />

                          <InfoBlock
                            label="Order created"
                            value={formatDate(order?.created_at)}
                          />
                        </div>

                        {/* IDs footer */}
                        <div className="mt-5 rounded-xl border border-white/[0.06] bg-black/20 px-4 py-3">
                          <div className="flex flex-col gap-3 text-xs sm:flex-row sm:items-start sm:justify-between">
                            <div className="min-w-0">
                              <p className="text-gray-500">Request ID</p>
                              <p className="mt-1 break-all font-mono text-gray-400">
                                {commission.id}
                              </p>
                            </div>

                            {order?.id && (
                              <div className="min-w-0 sm:text-right">
                                <p className="text-gray-500">Order ID</p>
                                <p className="mt-1 break-all font-mono text-gray-400">
                                  {order.id}
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
                      </article>
                    );
                  })}
                </div>
              )}
            </div>

            {!loading && (
              <p className="mt-4 text-xs text-gray-500">
                Showing{" "}
                <span className="font-medium text-gray-300">
                  {filteredCommissions.length}
                </span>{" "}
                of{" "}
                <span className="font-medium text-gray-300">
                  {commissions.length}
                </span>{" "}
                commissions
              </p>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
