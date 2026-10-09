
import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../lib/supabase";

const navItems = [
  { label: "Overview", to: "/admin" },
  { label: "Users", to: "/admin/users" },
  { label: "Artists", to: "/admin/artists" },
  { label: "Artworks", to: "/admin/artworks" },
  { label: "Orders", to: "/admin/orders", active: true },
  { label: "Commissions", to: "/admin/commissions" },
  { label: "Categories", to: "/admin/categories" },
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
      <p className="mt-3 font-serif text-3xl text-[#c59ae5]">{value}</p>
      <p className="mt-2 text-xs text-gray-500">{description}</p>
    </div>
  );
}

function StatusBadge({ status, type = "order" }) {
  if (!status) return null;

  const styles =
    type === "payment"
      ? {
          PAID: "border-emerald-400/20 bg-emerald-400/10 text-emerald-300",
          FAILED: "border-red-400/20 bg-red-400/10 text-red-300",
          REFUNDED: "border-purple-400/20 bg-purple-400/10 text-purple-300",
          PENDING: "border-amber-400/20 bg-amber-400/10 text-amber-300",
        }
      : {
          CONFIRMED:
            "border-emerald-400/20 bg-emerald-400/10 text-emerald-300",
          PROCESSING: "border-blue-400/20 bg-blue-400/10 text-blue-300",
          SHIPPED: "border-violet-400/20 bg-violet-400/10 text-violet-300",
          DELIVERED:
            "border-green-400/20 bg-green-400/10 text-green-300",
          CANCELLED: "border-red-400/20 bg-red-400/10 text-red-300",
          PENDING: "border-amber-400/20 bg-amber-400/10 text-amber-300",
        };

  return (
    <span
      className={`inline-flex rounded-full border px-3 py-1 text-xs font-medium ${
        styles[status] ||
        "border-white/10 bg-white/[0.04] text-gray-400"
      }`}
    >
      {type === "payment" ? "Payment: " : ""}
      {status.replaceAll("_", " ")}
    </span>
  );
}

function InfoPanel({ label, children }) {
  return (
    <div className="rounded-xl border border-white/[0.06] bg-black/20 p-4">
      <p className="text-[10px] uppercase tracking-[0.18em] text-gray-500">
        {label}
      </p>
      <div className="mt-2 text-sm leading-6 text-gray-300">{children}</div>
    </div>
  );
}

export default function AdminOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  const fetchOrders = useCallback(async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    setError("");

    try {
      const { data, error: fetchError } = await supabase
        .from("orders")
        .select(`
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
          shipping_postal_code,
          order_items (
            id,
            quantity,
            unit_price,
            artwork_id,
            artist_id,
            artworks (
              id,
              title
            ),
            artist_profiles (
              display_name
            )
          )
        `)
        .order("created_at", { ascending: false });

      if (fetchError) throw fetchError;

      setOrders(data || []);
    } catch (err) {
      console.error("Admin orders error:", err);
      setError(err.message || "Failed to load orders.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const formatCurrency = (amount) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(Number(amount || 0));

  const formatDate = (date) => {
    if (!date) return "—";

    const parsed = new Date(date);
    if (Number.isNaN(parsed.getTime())) return "—";

    return parsed.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const filteredOrders = orders.filter((order) => {
    const query = search.trim().toLowerCase();

    const matchesSearch =
      !query ||
      order.id?.toLowerCase().includes(query) ||
      order.user_id?.toLowerCase().includes(query) ||
      order.shipping_full_name?.toLowerCase().includes(query) ||
      order.shipping_city?.toLowerCase().includes(query);

    const matchesStatus =
      statusFilter === "ALL" || order.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const paidOrders = orders.filter(
    (order) => order.payment_status === "PAID"
  ).length;

  const totalRevenue = orders.reduce(
    (sum, order) =>
      order.payment_status === "PAID"
        ? sum + Number(order.total_amount || 0)
        : sum,
    0
  );

  const pendingOrders = orders.filter(
    (order) => order.status === "PENDING"
  ).length;

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
                  Orders
                </h1>

                <p className="mt-3 max-w-xl text-sm leading-6 text-gray-400 sm:text-base">
                  Monitor customer orders, payment status, and delivery
                  information from one place.
                </p>
              </div>

              <button
                type="button"
                onClick={() => fetchOrders(true)}
                disabled={loading || refreshing}
                className="inline-flex items-center justify-center gap-2 self-start rounded-xl border border-[#8f5bb7]/40 bg-[#8f5bb7]/15 px-5 py-3 text-sm font-medium text-purple-100 transition hover:border-[#a867d4]/70 hover:bg-[#8f5bb7]/25 disabled:cursor-not-allowed disabled:opacity-50 sm:self-auto"
              >
                <span className={refreshing ? "animate-spin" : ""}>↻</span>
                {refreshing ? "Refreshing..." : "Refresh orders"}
              </button>
            </div>

            {/* Stats */}
            <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <StatCard
                label="Total orders"
                value={loading ? "—" : orders.length}
                description="All registered orders"
              />
              <StatCard
                label="Paid orders"
                value={loading ? "—" : paidOrders}
                description="Orders with confirmed payment"
              />
              <StatCard
                label="Pending orders"
                value={loading ? "—" : pendingOrders}
                description="Orders awaiting processing"
              />
              <StatCard
                label="Paid revenue"
                value={loading ? "—" : formatCurrency(totalRevenue)}
                description="Total from paid orders"
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
                  aria-label="Search orders"
                  placeholder="Search order ID, customer, city..."
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-[#111016] py-3.5 pl-11 pr-16 text-sm text-white outline-none transition placeholder:text-gray-600 focus:border-[#8f5bb7]/70 focus:ring-2 focus:ring-[#8f5bb7]/10"
                />

                {search && (
                  <button
                    type="button"
                    onClick={() => setSearch("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg px-2 py-1.5 text-xs text-gray-400 hover:bg-white/[0.06] hover:text-white"
                  >
                    Clear
                  </button>
                )}
              </div>

              <select
                aria-label="Filter by order status"
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value)}
                className="rounded-xl border border-white/10 bg-[#111016] px-4 py-3.5 text-sm text-gray-300 outline-none focus:border-[#8f5bb7]/70"
              >
                <option value="ALL" className="bg-[#111016]">
                  All statuses
                </option>
                {[
                  "PENDING",
                  "CONFIRMED",
                  "PROCESSING",
                  "SHIPPED",
                  "DELIVERED",
                  "CANCELLED",
                ].map((status) => (
                  <option key={status} value={status} className="bg-[#111016]">
                    {status.replaceAll("_", " ")}
                  </option>
                ))}
              </select>
            </div>

            {/* Errors */}
            {error && (
              <div className="mt-6 rounded-xl border border-red-400/20 bg-red-500/[0.08] p-4 text-sm text-red-300">
                <p>{error}</p>
                <button
                  type="button"
                  onClick={() => fetchOrders()}
                  className="mt-2 font-medium underline underline-offset-4 hover:text-white"
                >
                  Try again
                </button>
              </div>
            )}

            {/* Orders */}
            <div className="mt-6 overflow-hidden rounded-2xl border border-white/[0.09] bg-[#0e0d12] shadow-2xl shadow-black/20">
              <div className="flex flex-col gap-1 border-b border-white/[0.08] px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
                <div>
                  <h2 className="font-serif text-xl text-white">
                    Customer orders
                  </h2>
                  <p className="mt-1 text-xs text-gray-500">
                    Payments, shipping details, and purchased artworks
                  </p>
                </div>

                {!loading && (
                  <span className="mt-2 inline-flex w-fit rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs text-gray-300 sm:mt-0">
                    {filteredOrders.length} results
                  </span>
                )}
              </div>

              {loading ? (
                <div className="space-y-4 p-6">
                  {[1, 2, 3, 4].map((item) => (
                    <div
                      key={item}
                      className="h-32 animate-pulse rounded-xl bg-white/[0.04]"
                    />
                  ))}
                </div>
              ) : filteredOrders.length === 0 ? (
                <div className="px-6 py-20 text-center">
                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-[#8f5bb7]/20 bg-[#8f5bb7]/10 text-2xl text-[#b58bd0]">
                    ⌕
                  </div>
                  <h3 className="mt-5 font-serif text-2xl text-white">
                    No orders found
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
                  {filteredOrders.map((order) => (
                    <article key={order.id} className="p-5 sm:p-6">
                      {/* Order header */}
                      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                        <div className="min-w-0">
                          <p className="font-medium text-white">
                            Order #{order.id.slice(0, 8)}
                          </p>
                          <p className="mt-1 text-sm text-gray-500">
                            Placed {formatDate(order.created_at)}
                          </p>
                          <p
                            title={order.id}
                            className="mt-2 break-all font-mono text-[10px] text-gray-600"
                          >
                            {order.id}
                          </p>
                        </div>

                        <div className="flex flex-wrap gap-2">
                          <StatusBadge status={order.status} />
                          <StatusBadge
                            status={order.payment_status}
                            type="payment"
                          />
                        </div>
                      </div>

                      {/* Order details */}
                      <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                        <InfoPanel label="Customer">
                          <p className="font-medium text-gray-100">
                            {order.shipping_full_name ||
                              "Customer information unavailable"}
                          </p>
                          {order.shipping_phone && (
                            <p className="mt-1 text-gray-400">
                              {order.shipping_phone}
                            </p>
                          )}
                          <p className="mt-2 break-all font-mono text-[10px] text-gray-600">
                            User ID: {order.user_id || "—"}
                          </p>
                        </InfoPanel>

                        <InfoPanel label="Delivery address">
                          {order.shipping_address ? (
                            <>
                              <p>{order.shipping_address}</p>
                              <p>
                                {[order.shipping_city, order.shipping_state]
                                  .filter(Boolean)
                                  .join(", ")}
                              </p>
                              {order.shipping_postal_code && (
                                <p>{order.shipping_postal_code}</p>
                              )}
                            </>
                          ) : (
                            <p className="text-gray-500">
                              No shipping information
                            </p>
                          )}
                        </InfoPanel>

                        <InfoPanel label="Order total">
                          <p className="font-serif text-2xl text-[#c59ae5]">
                            {formatCurrency(order.total_amount)}
                          </p>
                          {order.paid_at && (
                            <p className="mt-2 text-xs text-gray-500">
                              Paid {formatDate(order.paid_at)}
                            </p>
                          )}
                        </InfoPanel>
                      </div>

                      {/* Items */}
                      <div className="mt-6 border-t border-white/[0.08] pt-5">
                        <p className="text-[10px] uppercase tracking-[0.2em] text-gray-500">
                          Order items ({order.order_items?.length || 0})
                        </p>

                        <div className="mt-3 space-y-3">
                          {(order.order_items || []).map((item) => {
                            const artwork = Array.isArray(item.artworks)
                              ? item.artworks[0]
                              : item.artworks;

                            const artist = Array.isArray(item.artist_profiles)
                              ? item.artist_profiles[0]
                              : item.artist_profiles;

                            return (
                              <div
                                key={item.id}
                                className="flex flex-col gap-3 rounded-xl border border-white/[0.06] bg-black/20 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
                              >
                                <div className="min-w-0">
                                  <p className="font-medium text-gray-100">
                                    {artwork?.title || "Artwork"}
                                  </p>
                                  <p className="mt-1 text-xs text-gray-500">
                                    {artist?.display_name || "Unknown artist"}
                                    {" · "}
                                    Qty {item.quantity}
                                  </p>
                                </div>

                                <div className="shrink-0 sm:text-right">
                                  <p className="font-medium text-gray-200">
                                    {formatCurrency(
                                      Number(item.unit_price) *
                                        Number(item.quantity)
                                    )}
                                  </p>
                                  <p className="mt-1 text-xs text-gray-500">
                                    {formatCurrency(item.unit_price)} each
                                  </p>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </div>

            {!loading && (
              <p className="mt-4 text-xs text-gray-500">
                Showing{" "}
                <span className="font-medium text-gray-300">
                  {filteredOrders.length}
                </span>{" "}
                of{" "}
                <span className="font-medium text-gray-300">
                  {orders.length}
                </span>{" "}
                orders
              </p>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
