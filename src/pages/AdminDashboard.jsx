
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../lib/supabase";

const AdminDashboard = () => {
  const [stats, setStats] = useState({
    users: 0,
    artists: 0,
    artworks: 0,
    orders: 0,
    revenue: 0,
    pendingCommissions: 0,
  });

  const [recentOrders, setRecentOrders] = useState([]);
  const [recentArtworks, setRecentArtworks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      setError("");

      const [
        usersResult,
        artistsResult,
        artworksResult,
        ordersResult,
        revenueResult,
        commissionsResult,
        recentOrdersResult,
        recentArtworksResult,
      ] = await Promise.all([
        supabase
          .from("profiles")
          .select("id", { count: "exact", head: true }),

        supabase
          .from("artist_profiles")
          .select("id", { count: "exact", head: true }),

        supabase
          .from("artworks")
          .select("id", { count: "exact", head: true }),

        supabase
          .from("orders")
          .select("id", { count: "exact", head: true }),

        supabase
          .from("orders")
          .select("total_amount")
          .eq("payment_status", "PAID"),

        supabase
          .from("commission_requests")
          .select("id", { count: "exact", head: true })
          .eq("status", "PENDING"),

        supabase
          .from("orders")
          .select(`
            id,
            total_amount,
            status,
            payment_status,
            created_at
          `)
          .order("created_at", { ascending: false })
          .limit(5),

        supabase
          .from("artworks")
          .select(`
            id,
            title,
            price,
            availability,
            created_at,
            artist_profiles (
              display_name
            )
          `)
          .order("created_at", { ascending: false })
          .limit(5),
      ]);

      const results = [
        usersResult,
        artistsResult,
        artworksResult,
        ordersResult,
        revenueResult,
        commissionsResult,
        recentOrdersResult,
        recentArtworksResult,
      ];

      const failed = results.find((result) => result.error);

      if (failed) {
        throw failed.error;
      }

      const revenue =
        revenueResult.data?.reduce(
          (total, order) =>
            total + Number(order.total_amount || 0),
          0
        ) || 0;

      setStats({
        users: usersResult.count || 0,
        artists: artistsResult.count || 0,
        artworks: artworksResult.count || 0,
        orders: ordersResult.count || 0,
        revenue,
        pendingCommissions: commissionsResult.count || 0,
      });

      setRecentOrders(recentOrdersResult.data || []);
      setRecentArtworks(recentArtworksResult.data || []);
    } catch (err) {
      console.error("Admin dashboard error:", err);
      setError(err.message || "Failed to load dashboard.");
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const statCards = [
    { label: "Total Users", value: stats.users },
    { label: "Artists", value: stats.artists },
    { label: "Artworks", value: stats.artworks },
    { label: "Orders", value: stats.orders },
    { label: "Revenue", value: formatCurrency(stats.revenue) },
    {
      label: "Pending Commissions",
      value: stats.pendingCommissions,
    },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-[#08070a] px-6 py-12">
        <div className="mx-auto max-w-7xl">
          <div className="animate-pulse">
            <div className="h-10 w-64 rounded bg-white/10" />
            <div className="mt-3 h-5 w-96 rounded bg-white/10" />

            <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3, 4, 5, 6].map((item) => (
                <div
                  key={item}
                  className="h-32 rounded-2xl bg-[#100d13]"
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#08070a] px-6 py-12 text-white">
        <div className="mx-auto max-w-3xl rounded-2xl border border-red-500/30 bg-red-950/20 p-6">
          <h2 className="font-serif text-2xl text-red-300">
            Dashboard Error
          </h2>

          <p className="mt-2 text-sm text-red-200">{error}</p>

          <button
            onClick={fetchDashboard}
            className="mt-5 rounded-lg bg-[#8f5bb7] px-5 py-2.5 text-sm font-medium text-white transition hover:bg-[#a867d4]"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#08070a] text-white">
      <div className="flex min-h-screen">
        {/* SIDEBAR */}
        <aside className="hidden w-64 shrink-0 border-r border-white/10 bg-[#0b090e] lg:block">
          <div className="sticky top-0 flex h-screen flex-col">
            <div className="border-b border-white/10 px-6 py-7">
              <p className="font-serif text-2xl italic tracking-wide text-white">
                Anuktya
              </p>
              <p className="mt-1 text-[10px] uppercase tracking-[0.25em] text-white/40">
                Administration
              </p>
            </div>

            <nav className="flex-1 px-4 py-6">
              <p className="px-3 text-[10px] font-medium uppercase tracking-[0.2em] text-white/40">
                Management
              </p>

              <div className="mt-4 space-y-1">
                <Link
                  to="/admin"
                  className="flex items-center rounded-xl bg-[#8f5bb7]/20 px-4 py-3 text-sm font-medium text-[#c9a5e8]"
                >
                  Overview
                </Link>

                {[
                  { to: "/admin/users", label: "Users" },
                  { to: "/admin/artists", label: "Artists" },
                  { to: "/admin/artworks", label: "Artworks" },
                  { to: "/admin/orders", label: "Orders" },
                  { to: "/admin/commissions", label: "Commissions" },
                  
                ].map((item) => (
                  <Link
                    key={item.to}
                    to={item.to}
                    className="flex items-center rounded-xl px-4 py-3 text-sm text-white/70 transition hover:bg-white/[0.06] hover:text-white"
                  >
                    {item.label}
                  </Link>
                ))}
              </div>
            </nav>

            <div className="border-t border-white/10 p-4">
              <Link
                to="/"
                className="block rounded-xl px-4 py-3 text-sm text-white/55 transition hover:bg-white/[0.06] hover:text-white"
              >
                ← Back to Anuktya
              </Link>
            </div>
          </div>
        </aside>

        {/* MAIN */}
        <main className="min-w-0 flex-1 px-6 py-10">
          <div className="mx-auto max-w-7xl">
            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
              <div>
                <p className="text-xs uppercase tracking-[0.25em] text-white/55">
                  Anuktya Administration
                </p>

                <h1 className="mt-2 font-serif text-4xl text-white md:text-5xl">
                  Dashboard
                </h1>

                <p className="mt-2 text-white/55">
                  Overview of your marketplace activity.
                </p>
              </div>

              <button
                onClick={fetchDashboard}
                className="rounded-xl border border-white/10 bg-[#100d13] px-5 py-2.5 text-sm font-medium text-white/80 transition hover:border-[#8f5bb7]/50 hover:bg-white/[0.04]"
              >
                Refresh
              </button>
            </div>

            {/* STATS */}
            <div className="mt-10 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
              {statCards.map((card) => (
                <div
                  key={card.label}
                  className="rounded-2xl border border-white/10 bg-white/[0.035] p-6 shadow-[0_18px_60px_rgba(0,0,0,0.18)] transition hover:border-[#8f5bb7]/40"
                >
                  <p className="text-xs uppercase tracking-widest text-white/40">
                    {card.label}
                  </p>

                  <p className="mt-3 font-serif text-3xl text-white">
                    {card.value}
                  </p>
                </div>
              ))}
            </div>

            {/* RECENT ACTIVITY */}
            <div className="mt-10 grid gap-6 xl:grid-cols-2">
              {/* RECENT ORDERS */}
              <section className="rounded-2xl border border-white/10 bg-white/[0.035] shadow-[0_18px_60px_rgba(0,0,0,0.18)]">
                <div className="flex items-center justify-between border-b border-white/10 px-6 py-5">
                  <div>
                    <p className="text-xs uppercase tracking-widest text-white/40">
                      Marketplace
                    </p>
                    <h2 className="mt-1 font-serif text-2xl text-white">
                      Recent Orders
                    </h2>
                  </div>

                  <Link
                    to="/admin/orders"
                    className="text-sm font-medium text-white/55 hover:text-[#c9a5e8]"
                  >
                    View all →
                  </Link>
                </div>

                <div className="divide-y divide-white/10">
                  {recentOrders.length === 0 ? (
                    <p className="px-6 py-8 text-sm text-white/55">
                      No orders yet.
                    </p>
                  ) : (
                    recentOrders.map((order) => (
                      <div
                        key={order.id}
                        className="flex items-center justify-between gap-4 px-6 py-5"
                      >
                        <div>
                          <p className="font-medium text-white/90">
                            Order #{order.id.slice(0, 8)}
                          </p>
                          <p className="mt-1 text-sm text-white/55">
                            {formatDate(order.created_at)}
                          </p>
                        </div>

                        <div className="text-right">
                          <p className="font-medium text-white">
                            {formatCurrency(order.total_amount)}
                          </p>
                          <span className="mt-1 inline-block rounded-full border border-white/10 bg-white/[0.06] px-3 py-1 text-[10px] font-medium uppercase tracking-wider text-white/70">
                            {order.status}
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </section>

              {/* RECENT ARTWORKS */}
              <section className="rounded-2xl border border-white/10 bg-white/[0.035] shadow-[0_18px_60px_rgba(0,0,0,0.18)]">
                <div className="flex items-center justify-between border-b border-white/10 px-6 py-5">
                  <div>
                    <p className="text-xs uppercase tracking-widest text-white/40">
                      Marketplace
                    </p>
                    <h2 className="mt-1 font-serif text-2xl text-white">
                      Recent Artworks
                    </h2>
                  </div>

                  <Link
                    to="/admin/artworks"
                    className="text-sm font-medium text-white/55 hover:text-[#c9a5e8]"
                  >
                    View all →
                  </Link>
                </div>

                <div className="divide-y divide-white/10">
                  {recentArtworks.length === 0 ? (
                    <p className="px-6 py-8 text-sm text-white/55">
                      No artworks yet.
                    </p>
                  ) : (
                    recentArtworks.map((artwork) => {
                      const artist = Array.isArray(artwork.artist_profiles)
                        ? artwork.artist_profiles[0]
                        : artwork.artist_profiles;

                      return (
                        <div
                          key={artwork.id}
                          className="flex items-center justify-between gap-4 px-6 py-5"
                        >
                          <div className="min-w-0">
                            <p className="truncate font-medium text-white/90">
                              {artwork.title}
                            </p>
                            <p className="mt-1 text-sm text-white/55">
                              {artist?.display_name || "Unknown artist"}
                            </p>
                          </div>

                          <div className="shrink-0 text-right">
                            <p className="font-medium text-white">
                              {formatCurrency(artwork.price)}
                            </p>
                            <span className="mt-1 inline-block text-[10px] uppercase tracking-wider text-white/40">
                              {artwork.availability}
                            </span>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </section>
            </div>

            {/* QUICK MANAGEMENT */}
            <section className="mt-6 rounded-2xl border border-white/10 bg-[#100d13] p-6">
              <p className="text-xs uppercase tracking-widest text-white/40">
                Administration
              </p>

              <h2 className="mt-1 font-serif text-2xl text-white">
                Quick Management
              </h2>

              <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {[
                  {
                    to: "/admin/users",
                    title: "Manage Users",
                    description: "View platform users",
                  },
                  {
                    to: "/admin/artists",
                    title: "Manage Artists",
                    description: "Review artist accounts",
                  },
                  {
                    to: "/admin/artworks",
                    title: "Manage Artworks",
                    description: "Review marketplace listings",
                  },
                  {
                    to: "/admin/commissions",
                    title: "Manage Commissions",
                    description: "Review commission requests",
                  },
                ].map((item) => (
                  <Link
                    key={item.to}
                    to={item.to}
                    className="rounded-xl border border-white/10 p-4 transition hover:border-[#8f5bb7]/60 hover:bg-white/[0.04]"
                  >
                    <p className="font-medium text-white/90">
                      {item.title}
                    </p>
                    <p className="mt-1 text-sm text-white/55">
                      {item.description}
                    </p>
                  </Link>
                ))}
              </div>
            </section>
          </div>
        </main>
      </div>
    </div>
  );
};

export default AdminDashboard;
