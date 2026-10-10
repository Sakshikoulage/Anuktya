
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";

function Navbar() {
  const navigate = useNavigate();
  const [cartCount, setCartCount] = useState(0);

  const [menuOpen, setMenuOpen] = useState(false);
  const [role, setRole] = useState(null);

  useEffect(() => {
    let mounted = true;

    const checkUserRole = async () => {
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError || !user) {
        if (mounted) setRole(null);
        return;
      }

      const { data, error } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .maybeSingle();

      if (error) {
        console.error("Role lookup failed:", error);
        if (mounted) setRole(null);
        return;
      }

      if (mounted) {
        setRole(data?.role?.toLowerCase() ?? null);
      }
    };

    checkUserRole();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => {
      checkUserRole();
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);
  useEffect(() => {
    let mounted = true;

    const fetchCartCount = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        if (mounted) setCartCount(0);
        return;
      }

      const { data, error } = await supabase
        .from("cart_items")
        .select("quantity")
        .eq("user_id", user.id);

      if (error) {
        console.error("Cart count error:", error);
        return;
      }

      const count = (data || []).reduce(
        (total, item) => total + (Number(item.quantity) || 0),
        0
      );

      if (mounted) setCartCount(count);
    };

    fetchCartCount();

    window.addEventListener("cartUpdated", fetchCartCount);

    return () => {
      mounted = false;
      window.removeEventListener("cartUpdated", fetchCartCount);
    };
  }, []);

  const handleLogout = async () => {
    setMenuOpen(false);
    await supabase.auth.signOut();
    setRole(null);
    navigate("/login");
  };

  const dashboardPath =
    role === "admin"
      ? "/admin"
      : role === "artist"
        ? "/artist/dashboard"
        : null;

  const dashboardLabel =
    role === "admin" ? "Admin Dashboard" : "Artist Dashboard";

  return (
    <header className="fixed left-0 right-0 top-0 z-50 px-4 pt-4 md:px-8">
      <nav className="mx-auto flex max-w-7xl items-center justify-between rounded-full border border-white/15 bg-black/30 px-4 py-3 shadow-2xl backdrop-blur-xl md:px-6">
        {/* LEFT — MENU + LOGO */}
        <div className="relative flex items-center gap-4">
          <button
            type="button"
            onClick={() => setMenuOpen((prev) => !prev)}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-white/15 text-white transition-all duration-300 hover:border-[#b58bd0] hover:bg-white/10"
            aria-label="Open menu"
            aria-expanded={menuOpen}
          >
            <span className="flex flex-col gap-[4px]">
              <span className="block h-[1.5px] w-4 bg-white" />
              <span className="block h-[1.5px] w-4 bg-white" />
              <span className="block h-[1.5px] w-4 bg-white" />
            </span>
          </button>

          <button
            type="button"
            onClick={() => navigate("/")}
            className="font-serif text-2xl italic tracking-[0.08em] text-white transition-opacity hover:opacity-80 md:text-3xl"
            style={{
              fontFamily:
                '"Cormorant Garamond", "Bodoni 72", Didot, Georgia, serif',
            }}
          >
            anuktya
          </button>

          {/* HAMBURGER MENU */}
          {menuOpen && (
            <div className="absolute left-0 top-14 w-52 overflow-hidden rounded-2xl border border-white/15 bg-black/90 p-2 shadow-2xl backdrop-blur-2xl">
              <button
                type="button"
                onClick={() => {
                  setMenuOpen(false);
                  navigate("/profile");
                }}
                className="flex w-full rounded-xl px-4 py-3 text-left text-sm font-medium text-white/75 transition hover:bg-white/10 hover:text-white"
              >
                Profile
              </button>

              <button
                type="button"
                onClick={() => {
                  setMenuOpen(false);
                  navigate("/favourites");
                }}
                className="flex w-full rounded-xl px-4 py-3 text-left text-sm font-medium text-white/75 transition hover:bg-white/10 hover:text-white"
              >
                Favourites
              </button>

              <button
                type="button"
                onClick={() => {
                  setMenuOpen(false);
                  navigate("/orders");
                }}
                className="flex w-full rounded-xl px-4 py-3 text-left text-sm font-medium text-white/75 transition hover:bg-white/10 hover:text-white"
              >
                Orders
              </button>

              {dashboardPath && (
                <button
                  type="button"
                  onClick={() => {
                    setMenuOpen(false);
                    navigate(dashboardPath);
                  }}
                  className="flex w-full rounded-xl px-4 py-3 text-left text-sm font-medium text-[#cba6e8] transition hover:bg-[#8f5bb7]/15 hover:text-white"
                >
                  {role === "admin" ? "🛡️" : "🎨"} {dashboardLabel}
                </button>
              )}

              <div className="my-1 border-t border-white/10" />

              <button
                type="button"
                onClick={handleLogout}
                className="flex w-full rounded-xl px-4 py-3 text-left text-sm font-medium text-white/75 transition hover:bg-red-500/10 hover:text-red-300"
              >
                Logout
              </button>
            </div>
          )}
        </div>

        {/* CENTER NAVIGATION */}
        <div className="hidden items-center gap-5 lg:flex xl:gap-8">
          <button
            type="button"
            onClick={() => navigate("/explore")}
            className="text-sm font-semibold text-white/70 transition hover:text-white"
          >
            Explore
          </button>

          <button
            type="button"
            onClick={() => navigate("/artists")}
            className="text-sm font-semibold text-white/70 transition hover:text-white"
          >
            Artists
          </button>

          {dashboardPath ? (
            <button
              type="button"
              onClick={() => navigate(dashboardPath)}
              className="text-sm font-semibold text-[#cba6e8] transition hover:text-white"
            >
              {dashboardLabel}
            </button>
          ) : (
            <button
              type="button"
              onClick={() => navigate("/my-commissions")}
              className="text-sm font-semibold text-white/70 transition hover:text-white"
            >
              My Commission
            </button>
          )}
        </div>

        {/* RIGHT — FAVOURITES + CART */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => navigate("/favourites")}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-white/15 text-xl text-white transition-all duration-300 hover:border-[#b58bd0] hover:bg-[#8f5bb7]/15 hover:text-[#d8b8ed]"
            aria-label="Favourites"
          >
            ♡
          </button>

          <button
            type="button"
            onClick={() => navigate("/cart")}
            className="relative flex h-10 w-10 items-center justify-center rounded-full border border-white/15 text-lg text-white transition-all duration-300 hover:border-[#b58bd0] hover:bg-[#8f5bb7]/15"
            aria-label={`Cart${cartCount > 0 ? `, ${cartCount} items` : ""}`}
          >
            🛒

            {cartCount > 0 && (
              <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-[#cba6e8] px-1 text-[10px] font-bold leading-none text-black">
                {cartCount > 99 ? "99+" : cartCount}
              </span>
            )}
          </button>
        </div>
      </nav>
    </header>
  );
}

export default Navbar;

