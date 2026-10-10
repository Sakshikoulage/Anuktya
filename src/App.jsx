import { useEffect, useState } from "react";
import { Navigate, BrowserRouter, Routes, Route } from "react-router-dom";
import { supabase } from "./lib/supabase";

import Login from "./components/Login";
import Signup from "./components/Signup";

import Home from "./pages/Home";
import Explore from "./pages/Explore";
import Artists from "./pages/Artists";

import Favourites from "./pages/Favourites";
import ArtworkDetails from "./pages/ArtworkDetails";
import ArtistProfile from "./pages/ArtistProfile";
import ArtistDashboard from "./pages/ArtistDashboard";
import Profiles from "./pages/Profiles";
import BecomeArtist from "./pages/BecomeArtist";
import AddArtworks from "./pages/AddArtworks";
import EditArtwork from "./pages/EditArtwork";
import Cart from "./pages/Cart";
import Checkout from "./pages/Checkout";
import MyCommisions from "./pages/MyCommisions";
import Orders from "./pages/orders";
import ArtistOrders from "./pages/ArtistOrder";

import AdminDashboard from "./pages/AdminDashboard";
import AdminUsers from "./pages/AdminUsers";
import AdminArtists from "./pages/AdminArtists";
import AdminArtworks from "./pages/AdminArtworks";
import AdminOrders from "./pages/AdminOrders";
import AdminCommissions from "./pages/AdminCommissions";



function AdminRoute({ children }) {
  const [checking, setChecking] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    let mounted = true;

    const checkAdmin = async () => {
      try {
        const {
          data: { user },
          error: authError,
        } = await supabase.auth.getUser();

        if (authError || !user) {
          if (mounted) setIsAdmin(false);
          return;
        }

        const { data, error } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", user.id)
          .maybeSingle();

        if (error) throw error;

        if (mounted) {
          setIsAdmin(data?.role?.toUpperCase() === "ADMIN");
        }
      } catch (error) {
        console.error("Admin check failed:", error);
        if (mounted) setIsAdmin(false);
      } finally {
        if (mounted) setChecking(false);
      }
    };

    checkAdmin();

    return () => {
      mounted = false;
    };
  }, []);

  if (checking) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-black text-white">
        <p className="font-serif text-xl">Checking Anuktya access...</p>
      </div>
    );
  }

  if (!isAdmin) {
    return <Navigate to="/" replace />;
  }

  return children;
}


function App() {
  const [session, setSession] = useState(null);

  useEffect(() => {
    // Get current session
    const getSession = async () => {
      const { data } = await supabase.auth.getSession();
      setSession(data.session);
    };

    getSession();

    // Listen for login/logout changes
    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
      }
    );

    // Cleanup
    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

  return (
    <BrowserRouter>
      {!session ? (
        // =========================
        // AUTH ROUTES
        // =========================
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />

          {/* Any unknown route while logged out */}
          <Route path="*" element={<Login />} />
        </Routes>
      ) : (
        // =========================
        // APPLICATION ROUTES
        // =========================
        <Routes>
          <Route path="/" element={<Home />} />

          <Route path="/explore" element={<Explore />} />

          <Route path="/artists" element={<Artists />} />

          

          <Route
            path="/artwork/:id"
            element={<ArtworkDetails />}
          />

          <Route
            path="/favourites"
            element={<Favourites />}
          />

          <Route
            path="/profile"
            element={<Profiles />}
          />

          <Route
            path="/artists/:id"
            element={<ArtistProfile />}
          />

          <Route
            path="/artist/dashboard"
            element={<ArtistDashboard />}
          />

          <Route
            path="/become-artist"
            element={<BecomeArtist />}
          />

          <Route
            path="/artist/add-artwork"
            element={<AddArtworks />}
          />

          <Route
            path="/artist/edit-artwork/:id"
            element={<EditArtwork />}
          />

          <Route
            path="/cart"
            element={<Cart />}
          />

          <Route
            path="/checkout"
            element={<Checkout />}
          />

          <Route
            path="/my-commissions"
            element={<MyCommisions />}
          />

          <Route
            path="/orders"
            element={<Orders />}
          />

          <Route
            path="/artist/orders"
            element={<ArtistOrders />}
          />


          {/* =========================
              ADMIN ROUTES
              ========================= */}

          <Route
            path="/admin"
            element={
              <AdminRoute>
                <AdminDashboard />
              </AdminRoute>
            }
          />

          <Route
            path="/admin/users"
            element={
              <AdminRoute>
                <AdminUsers />
              </AdminRoute>
            }
          />

          <Route
            path="/admin/artists"
            element={
              <AdminRoute>
                <AdminArtists />
              </AdminRoute>
            }
          />

          <Route
            path="/admin/artworks"
            element={
              <AdminRoute>
                <AdminArtworks />
              </AdminRoute>
            }
          />

          <Route
            path="/admin/orders"
            element={
              <AdminRoute>
                <AdminOrders />
              </AdminRoute>
            }
          />

          <Route
            path="/admin/commissions"
            element={
              <AdminRoute>
                <AdminCommissions />
              </AdminRoute>
            }
          />

          {/* Fallback */}
          <Route
            path="*"
            element={<Navigate to="/" replace />}
          />
        </Routes>
      )}
    </BrowserRouter>
  );
}

export default App;