
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../lib/supabase";
import Navbar from "../components/Navbar";

function Profile() {
    const [user, setUser] = useState(null);
    const [profile, setProfile] = useState(null);
    const [isArtist, setIsArtist] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [isEditing, setIsEditing] = useState(false);
    const [fullName, setFullName] = useState("");
    const [saving, setSaving] = useState(false);
    const [avatarFile, setAvatarFile] = useState(null);
    const [avatarUrl, setAvatarUrl] = useState("");
    const [avatarPreview, setAvatarPreview] = useState("");

    useEffect(() => {
        const fetchProfile = async () => {
            const {
                data: { user },
            } = await supabase.auth.getUser();

            if (!user) {
                setError("You must be logged in to view your profile.");
                setLoading(false);
                return;
            }

            setUser(user);

            const { data, error } = await supabase
                .from("profiles")
                .select("*")
                .eq("id", user.id)
                .single();

            if (error) {
                setError(error.message);
                setLoading(false);
                return;
            }

            setProfile(data);
            setFullName(data.full_name || "");
            setAvatarUrl(data.avatar_url || "");

            // Check whether the user already has an artist profile.
            const {
                data: artistProfile,
                error: artistProfileError,
            } = await supabase
                .from("artist_profiles")
                .select("user_id")
                .eq("user_id", user.id)
                .maybeSingle();

            if (artistProfileError) {
                console.error(
                    "Could not check artist profile:",
                    artistProfileError
                );
            }

            setIsArtist(Boolean(artistProfile));
            setLoading(false);
        };

        fetchProfile();
    }, []);

    const handleLogout = async () => {
        await supabase.auth.signOut();
    };

    const handleSave = async () => {
        if (!user) {
            return;
        }

        setSaving(true);
        setError("");

        let newAvatarPath = avatarUrl;

        if (avatarFile) {
            const fileExt = avatarFile.name.split(".").pop();
            const fileName = `${user.id}.${fileExt}`;

            const { error: uploadError } = await supabase.storage
                .from("profile-images")
                .upload(fileName, avatarFile, {
                    upsert: true,
                });

            if (uploadError) {
                setError(uploadError.message);
                setSaving(false);
                return;
            }

            newAvatarPath = fileName;
        }

        const { data, error } = await supabase
            .from("profiles")
            .update({
                full_name: fullName,
                avatar_url: newAvatarPath,
                updated_at: new Date().toISOString(),
            })
            .eq("id", user.id)
            .select()
            .single();

        if (error) {
            setError(error.message);
            setSaving(false);
            return;
        }

        setProfile(data);
        setAvatarUrl(newAvatarPath);
        setAvatarFile(null);
        setAvatarPreview("");
        setIsEditing(false);
        setSaving(false);
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-black text-white">
                <Navbar />

                <div className="flex min-h-screen items-center justify-center">
                    <div className="text-center">
                        <div className="mx-auto mb-6 h-10 w-10 animate-spin rounded-full border-2 border-white/10 border-t-[#a867d4]" />

                        <p className="text-lg font-semibold">
                            Loading profile...
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-black text-white">
                <Navbar />

                <div className="flex min-h-screen items-center justify-center px-6">
                    <div className="w-full max-w-lg rounded-3xl border border-red-500/20 bg-[#09070b] p-10 text-center">
                        <p className="text-xl font-black">
                            Something went wrong
                        </p>

                        <p className="mt-3 text-sm text-white/50">
                            {error}
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-black text-white">
            <Navbar />

            <main className="px-5 pb-28 pt-36 sm:px-8 lg:px-12">
                <div className="mx-auto max-w-7xl">
                    {/* PAGE HEADER */}
                    <section>
                        <p className="text-sm font-bold uppercase tracking-[0.35em] text-white/45">
                            Account
                        </p>

                        <h1 className="mt-5 text-6xl font-black leading-[0.9] tracking-[-0.05em] text-white sm:text-7xl md:text-8xl">
                            My
                            <br />
                            Profile.
                        </h1>

                        <p className="mt-7 max-w-2xl text-lg font-semibold leading-8 text-white/45 md:text-xl">
                            Manage your personal information and
                            account preferences.
                        </p>
                    </section>

                    {/* CONTENT */}
                    <div className="mt-16 grid gap-8 lg:grid-cols-[240px_1fr]">
                        {/* SIDEBAR */}
                        <aside className="h-fit rounded-2xl border border-white/10 bg-[#09070b] p-5 shadow-2xl">
                            <p className="px-4 pb-4 text-xs font-bold uppercase tracking-[0.2em] text-white/30">
                                Account
                            </p>

                            <nav className="space-y-1">
                                <Link
                                    to="/profile"
                                    className="block rounded-xl border border-[#9d5bc7]/40 bg-[#8e4fc0]/15 px-4 py-3 text-sm font-semibold text-white"
                                >
                                    Profile
                                </Link>

                                <Link
                                    to="/favourites"
                                    className="block rounded-xl px-4 py-3 text-sm font-semibold text-white/45 transition hover:bg-white/5 hover:text-white"
                                >
                                    Favourites
                                </Link>

                                <button
                                    type="button"
                                    onClick={handleLogout}
                                    className="block w-full rounded-xl px-4 py-3 text-left text-sm font-semibold text-white/45 transition hover:bg-white/5 hover:text-white"
                                >
                                    Logout
                                </button>
                            </nav>
                        </aside>

                        {/* PROFILE CONTENT */}
                        <main>
                            {/* PERSONAL INFORMATION */}
                            <section className="relative overflow-hidden rounded-3xl border border-white/10 bg-[#09070b] p-6 shadow-2xl sm:p-8">
                                <div className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full bg-[#8e4fc0]/15 blur-[80px]" />

                                <div className="relative">
                                    <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
                                        <div>
                                            <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#a867d4]">
                                                Account
                                            </p>

                                            <h2 className="mt-2 text-3xl font-black tracking-tight text-white">
                                                Personal Information
                                            </h2>
                                        </div>

                                        {!isEditing && (
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    setIsEditing(true)
                                                }
                                                className="rounded-full border border-white/10 bg-white/[0.03] px-6 py-3 text-xs font-bold uppercase tracking-[0.15em] text-white/60 transition hover:border-[#9d5bc7] hover:bg-[#8e4fc0]/15 hover:text-white"
                                            >
                                                Edit
                                            </button>
                                        )}
                                    </div>

                                    <div className="mt-10 grid gap-10 sm:grid-cols-2">
                                        {/* PROFILE IMAGE */}
                                        <div>
                                            <p className="text-xs font-bold uppercase tracking-[0.18em] text-white/35">
                                                Profile Image
                                            </p>

                                            {avatarPreview ? (
                                                <img
                                                    src={avatarPreview}
                                                    alt="New profile preview"
                                                    className="mt-5 h-28 w-28 rounded-full border-2 border-[#9d5bc7]/50 object-cover shadow-lg shadow-purple-950/30"
                                                />
                                            ) : avatarUrl ? (
                                                <img
                                                    src={
                                                        supabase.storage
                                                            .from("profile-images")
                                                            .getPublicUrl(
                                                                avatarUrl
                                                            ).data.publicUrl
                                                    }
                                                    alt="Profile"
                                                    className="mt-5 h-28 w-28 rounded-full border-2 border-white/10 object-cover"
                                                />
                                            ) : (
                                                <div className="mt-5 flex h-28 w-28 items-center justify-center rounded-full border border-white/10 bg-white/[0.03]">
                                                    <span className="text-xs font-medium text-white/30">
                                                        No image
                                                    </span>
                                                </div>
                                            )}

                                            {isEditing && (
                                                <input
                                                    type="file"
                                                    accept="image/*"
                                                    onChange={(e) => {
                                                        const file =
                                                            e.target.files[0];

                                                        if (!file) {
                                                            return;
                                                        }

                                                        setAvatarFile(file);
                                                        setAvatarPreview(
                                                            URL.createObjectURL(
                                                                file
                                                            )
                                                        );
                                                    }}
                                                    className="mt-5 block w-full max-w-xs text-sm text-white/50 file:mr-4 file:rounded-full file:border-0 file:bg-[#8e4fc0] file:px-4 file:py-2 file:font-semibold file:text-white hover:file:bg-[#a867d4]"
                                                />
                                            )}
                                        </div>

                                        {/* NAME */}
                                        <div>
                                            <p className="text-xs font-bold uppercase tracking-[0.18em] text-white/35">
                                                Name
                                            </p>

                                            {isEditing ? (
                                                <input
                                                    type="text"
                                                    value={fullName}
                                                    onChange={(e) =>
                                                        setFullName(
                                                            e.target.value
                                                        )
                                                    }
                                                    className="mt-3 w-full border-b border-white/20 bg-transparent px-1 py-3 text-white outline-none transition focus:border-[#a867d4]"
                                                    placeholder="Enter your name"
                                                />
                                            ) : (
                                                <p className="mt-3 text-lg font-semibold text-white">
                                                    {profile?.full_name ||
                                                        "Not provided"}
                                                </p>
                                            )}
                                        </div>

                                        {/* EMAIL */}
                                        <div>
                                            <p className="text-xs font-bold uppercase tracking-[0.18em] text-white/35">
                                                Email
                                            </p>

                                            <p className="mt-3 break-all text-lg font-semibold text-white">
                                                {user?.email}
                                            </p>
                                        </div>
                                    </div>

                                    {/* EDIT ACTIONS */}
                                    {isEditing && (
                                        <div className="mt-10 flex flex-wrap gap-4 border-t border-white/10 pt-7">
                                            <button
                                                type="button"
                                                onClick={handleSave}
                                                disabled={saving}
                                                className="rounded-full bg-[#8e4fc0] px-7 py-3 text-sm font-bold text-white shadow-lg shadow-purple-950/30 transition hover:bg-[#a867d4] disabled:cursor-not-allowed disabled:opacity-50"
                                            >
                                                {saving
                                                    ? "Saving..."
                                                    : "Save Changes"}
                                            </button>

                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setFullName(
                                                        profile?.full_name ||
                                                            ""
                                                    );
                                                    setAvatarFile(null);
                                                    setAvatarPreview("");
                                                    setIsEditing(false);
                                                }}
                                                disabled={saving}
                                                className="rounded-full border border-white/10 px-7 py-3 text-sm font-bold text-white/50 transition hover:border-white/25 hover:text-white disabled:opacity-50"
                                            >
                                                Cancel
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </section>

                            {/* ORDERS */}
                            <section className="mt-8 rounded-3xl border border-white/10 bg-[#09070b] p-6 shadow-2xl sm:p-8">
                                <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#a867d4]">
                                    Orders
                                </p>

                                <h2 className="mt-2 text-3xl font-black tracking-tight text-white">
                                    My Orders
                                </h2>

                                <p className="mt-4 max-w-xl text-sm font-medium leading-6 text-white/40">
                                    Your purchases will appear here.
                                </p>

                                <Link
                                    to="/orders"
                                    className="mt-7 inline-flex rounded-full border border-white/10 bg-white/[0.03] px-6 py-3 text-sm font-bold text-white/60 transition hover:border-[#9d5bc7] hover:bg-[#8e4fc0]/15 hover:text-white"
                                >
                                    View Orders
                                </Link>
                            </section>

                            {/* BECOME AN ARTIST */}
                            {!isArtist && (
                                <section className="relative mt-8 overflow-hidden rounded-3xl border border-[#9d5bc7]/25 bg-[#09070b] p-6 shadow-2xl sm:p-8">
                                    <div className="pointer-events-none absolute -right-16 -top-20 h-56 w-56 rounded-full bg-[#8e4fc0]/20 blur-[80px]" />

                                    <div className="relative flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
                                        <div className="max-w-xl">
                                            <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#a867d4]">
                                                For Creators
                                            </p>

                                            <h2 className="mt-3 font-serif text-3xl text-white sm:text-4xl">
                                                Your art deserves to be seen.
                                            </h2>

                                            <p className="mt-3 text-sm font-medium leading-7 text-white/45">
                                                Create your artist profile and share your work with the Anuktya community.
                                            </p>
                                        </div>

                                        <Link
                                            to="/become-artist"
                                            className="inline-flex shrink-0 items-center justify-center gap-2 self-start rounded-full bg-[#8e4fc0] px-6 py-3 text-sm font-bold text-white transition hover:bg-[#a867d4] sm:self-center"
                                        >
                                            Become an Artist
                                            <span aria-hidden="true">
                                                →
                                            </span>
                                        </Link>
                                    </div>
                                </section>
                            )}

                            {/* SETTINGS */}
                            <section className="mt-8 rounded-3xl border border-white/10 bg-[#09070b] p-6 shadow-2xl sm:p-8">
                                <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#a867d4]">
                                    Settings
                                </p>

                                <h2 className="mt-2 text-3xl font-black tracking-tight text-white">
                                    Account Settings
                                </h2>

                                <p className="mt-4 max-w-xl text-sm font-medium leading-6 text-white/40">
                                    Account preferences will appear here.
                                </p>
                            </section>
                        </main>
                    </div>
                </div>
            </main>

            {/* FOOTER */}
            <footer className="border-t border-white/10 bg-[#050505] px-6 py-10 md:px-10 lg:px-16">
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

                    <p className="text-sm font-medium text-white/30">
                        Your account.
                    </p>
                </div>
            </footer>
        </div>
    );
}

export default Profile;
