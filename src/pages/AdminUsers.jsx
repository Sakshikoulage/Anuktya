
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../lib/supabase";

const AdminUsers = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError("");

      const { data, error } = await supabase
        .from("profiles")
        .select(`
          id,
          full_name,
          avatar_url,
          role
        `)
        .order("full_name", { ascending: true });

      if (error) throw error;

      setUsers(data || []);
    } catch (err) {
      console.error("Admin users error:", err);
      setError(err.message || "Failed to load users.");
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = users.filter((user) => {
    const query = search.toLowerCase();

    return (
      user.full_name?.toLowerCase().includes(query) ||
      user.role?.toLowerCase().includes(query) ||
      user.id?.toLowerCase().includes(query)
    );
  });

  const roleBadge = (role) => {
    switch (role?.toUpperCase()) {
      case "ADMIN":
        return "border-purple-400/30 bg-purple-500/15 text-purple-200";
      case "ARTIST":
        return "border-fuchsia-400/30 bg-fuchsia-500/10 text-fuchsia-200";
      default:
        return "border-white/10 bg-white/5 text-gray-300";
    }
  };

  const navItems = [
    { label: "Overview", to: "/admin" },
    { label: "Users", to: "/admin/users", active: true },
    { label: "Artists", to: "/admin/artists" },
    { label: "Artworks", to: "/admin/artworks" },
    { label: "Orders", to: "/admin/orders" },
    { label: "Commissions", to: "/admin/commissions" },
    { label: "Categories", to: "/admin/categories" },
  ];

  return (
    <div className="min-h-screen bg-[#08080b] text-white">
      <div className="flex min-h-screen">
        {/* Sidebar */}
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

        {/* Main content */}
        <main className="min-w-0 flex-1 px-4 py-6 sm:px-6 sm:py-10 lg:px-10">
          <div className="mx-auto max-w-7xl">
            {/* Header */}
            <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.25em] text-[#b58bd0]">
                  Administration / Management
                </p>

                <h1 className="mt-3 font-serif text-4xl tracking-tight text-white sm:text-5xl">
                  Users
                </h1>

                <p className="mt-3 max-w-xl text-sm leading-6 text-gray-400 sm:text-base">
                  Manage registered users and review their platform roles.
                </p>
              </div>

              <button
                onClick={fetchUsers}
                disabled={loading}
                className="inline-flex items-center justify-center gap-2 self-start rounded-xl border border-[#8f5bb7]/40 bg-[#8f5bb7]/15 px-5 py-3 text-sm font-medium text-purple-100 transition hover:border-[#a867d4]/70 hover:bg-[#8f5bb7]/25 disabled:cursor-not-allowed disabled:opacity-50 sm:self-auto"
              >
                <span className={loading ? "animate-spin" : ""}>↻</span>
                {loading ? "Refreshing..." : "Refresh users"}
              </button>
            </div>

            {/* Stats */}
            <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div className="rounded-2xl border border-white/[0.08] bg-white/[0.025] p-5">
                <p className="text-xs uppercase tracking-[0.18em] text-gray-500">
                  Total users
                </p>
                <p className="mt-3 font-serif text-3xl text-white">
                  {users.length}
                </p>
              </div>

              <div className="rounded-2xl border border-white/[0.08] bg-white/[0.025] p-5">
                <p className="text-xs uppercase tracking-[0.18em] text-gray-500">
                  Artists
                </p>
                <p className="mt-3 font-serif text-3xl text-[#c59ae5]">
                  {users.filter(
                    (user) => user.role?.toUpperCase() === "ARTIST"
                  ).length}
                </p>
              </div>

              <div className="rounded-2xl border border-white/[0.08] bg-white/[0.025] p-5">
                <p className="text-xs uppercase tracking-[0.18em] text-gray-500">
                  Administrators
                </p>
                <p className="mt-3 font-serif text-3xl text-white">
                  {users.filter(
                    (user) => user.role?.toUpperCase() === "ADMIN"
                  ).length}
                </p>
              </div>
            </div>

            {/* Search */}
            <div className="mt-8">
              <label
                htmlFor="user-search"
                className="mb-2 block text-xs font-medium uppercase tracking-[0.16em] text-gray-400"
              >
                Search users
              </label>

              <div className="relative">
                <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">
                  ⌕
                </span>

                <input
                  id="user-search"
                  type="text"
                  placeholder="Search by name, role, or user ID..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-[#111016] py-3.5 pl-11 pr-4 text-sm text-white outline-none transition placeholder:text-gray-600 focus:border-[#8f5bb7]/70 focus:ring-2 focus:ring-[#8f5bb7]/10"
                />
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="mt-6 rounded-xl border border-red-400/20 bg-red-500/[0.08] p-4 text-sm text-red-300">
                <p>{error}</p>
                <button
                  onClick={fetchUsers}
                  className="mt-2 font-medium underline underline-offset-4 hover:text-white"
                >
                  Try again
                </button>
              </div>
            )}

            {/* Users table */}
            <div className="mt-6 overflow-hidden rounded-2xl border border-white/[0.09] bg-[#0e0d12] shadow-2xl shadow-black/20">
              <div className="flex flex-col gap-1 border-b border-white/[0.08] px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
                <div>
                  <h2 className="font-serif text-xl text-white">
                    Registered accounts
                  </h2>
                  <p className="mt-1 text-xs text-gray-500">
                    User profiles and assigned roles
                  </p>
                </div>

                {!loading && (
                  <span className="mt-2 inline-flex w-fit items-center rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs text-gray-300 sm:mt-0">
                    {filteredUsers.length} results
                  </span>
                )}
              </div>

              {loading ? (
                <div className="space-y-4 p-6">
                  {[1, 2, 3, 4, 5].map((item) => (
                    <div
                      key={item}
                      className="h-16 animate-pulse rounded-xl bg-white/[0.04]"
                    />
                  ))}
                </div>
              ) : filteredUsers.length === 0 ? (
                <div className="px-6 py-20 text-center">
                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-[#8f5bb7]/20 bg-[#8f5bb7]/10 text-2xl text-[#b58bd0]">
                    ⌕
                  </div>

                  <h3 className="mt-5 font-serif text-2xl text-white">
                    No users found
                  </h3>

                  <p className="mt-2 text-sm text-gray-500">
                    Try a different search term.
                  </p>

                  {search && (
                    <button
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
                          <th className="px-6 py-4 text-[10px] font-semibold uppercase tracking-[0.18em] text-gray-500">
                            User
                          </th>
                          <th className="px-6 py-4 text-[10px] font-semibold uppercase tracking-[0.18em] text-gray-500">
                            Role
                          </th>
                          <th className="px-6 py-4 text-[10px] font-semibold uppercase tracking-[0.18em] text-gray-500">
                            User ID
                          </th>
                          <th className="px-6 py-4 text-right text-[10px] font-semibold uppercase tracking-[0.18em] text-gray-500">
                            Status
                          </th>
                        </tr>
                      </thead>

                      <tbody className="divide-y divide-white/[0.06]">
                        {filteredUsers.map((user) => (
                          <tr
                            key={user.id}
                            className="transition hover:bg-white/[0.025]"
                          >
                            <td className="px-6 py-5">
                              <div className="flex items-center gap-3">
                                {user.avatar_url ? (
                                  <img
                                    src={user.avatar_url}
                                    alt=""
                                    className="h-11 w-11 rounded-full border border-white/10 object-cover"
                                  />
                                ) : (
                                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-[#8f5bb7]/25 bg-[#8f5bb7]/10 font-serif text-lg text-[#c59ae5]">
                                    {user.full_name?.charAt(0)?.toUpperCase() ||
                                      "U"}
                                  </div>
                                )}

                                <div className="min-w-0">
                                  <p className="font-medium text-gray-100">
                                    {user.full_name || "Unnamed user"}
                                  </p>
                                  <p className="mt-1 text-xs text-gray-500">
                                    Account holder
                                  </p>
                                </div>
                              </div>
                            </td>

                            <td className="px-6 py-5">
                              <span
                                className={`inline-flex rounded-full border px-3 py-1 text-xs font-medium ${roleBadge(
                                  user.role
                                )}`}
                              >
                                {user.role || "USER"}
                              </span>
                            </td>

                            <td className="px-6 py-5">
                              <p
                                title={user.id}
                                className="max-w-[220px] truncate font-mono text-xs text-gray-500"
                              >
                                {user.id}
                              </p>
                            </td>

                            <td className="px-6 py-5 text-right">
                              <span className="inline-flex items-center gap-2 text-xs text-gray-400">
                                <span className="h-2 w-2 rounded-full bg-emerald-400" />
                                Active
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Mobile cards */}
                  <div className="divide-y divide-white/[0.07] md:hidden">
                    {filteredUsers.map((user) => (
                      <div key={user.id} className="p-5">
                        <div className="flex items-center gap-3">
                          {user.avatar_url ? (
                            <img
                              src={user.avatar_url}
                              alt=""
                              className="h-12 w-12 shrink-0 rounded-full border border-white/10 object-cover"
                            />
                          ) : (
                            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-[#8f5bb7]/25 bg-[#8f5bb7]/10 font-serif text-lg text-[#c59ae5]">
                              {user.full_name?.charAt(0)?.toUpperCase() ||
                                "U"}
                            </div>
                          )}

                          <div className="min-w-0 flex-1">
                            <p className="truncate font-medium text-white">
                              {user.full_name || "Unnamed user"}
                            </p>

                            <p className="mt-1 text-xs text-gray-500">
                              Account holder
                            </p>
                          </div>

                          <span
                            className={`shrink-0 rounded-full border px-2.5 py-1 text-[10px] font-medium ${roleBadge(
                              user.role
                            )}`}
                          >
                            {user.role || "USER"}
                          </span>
                        </div>

                        <div className="mt-4 rounded-lg border border-white/[0.06] bg-black/20 px-3 py-2.5">
                          <p className="text-[10px] uppercase tracking-[0.16em] text-gray-600">
                            User ID
                          </p>
                          <p className="mt-1 break-all font-mono text-xs text-gray-400">
                            {user.id}
                          </p>
                        </div>

                        <div className="mt-3 flex items-center gap-2 text-xs text-gray-400">
                          <span className="h-2 w-2 rounded-full bg-emerald-400" />
                          Active
                        </div>
                      </div>
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
                    {filteredUsers.length}
                  </span>{" "}
                  of{" "}
                  <span className="font-medium text-gray-300">
                    {users.length}
                  </span>{" "}
                  users
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
};

export default AdminUsers;
