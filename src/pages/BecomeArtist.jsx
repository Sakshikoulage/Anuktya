
import { useState } from "react";
import { Link,useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import Navbar from "../components/Navbar";

function BecomeArtist() {
    const navigate = useNavigate();

    const [displayName, setDisplayName] = useState("");
    const [bio, setBio] = useState("");
    const [location, setLocation] = useState("");
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const handleSubmit = async (e) => {
        e.preventDefault();

        setSaving(true);
        setError("");
        setSuccess("");

        const {
            data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
            setError("You must be logged in.");
            setSaving(false);
            return;
        }

        if (!displayName.trim()) {
            setError("Please enter your artist name.");
            setSaving(false);
            return;
        }

        const { error: insertError } = await supabase
            .from("artist_profiles")
            .insert({
                user_id: user.id,
                display_name: displayName.trim(),
                bio: bio.trim() || null,
                location: location.trim() || null,
            });

        if (insertError) {
            setError(insertError.message);
            setSaving(false);
            return;
        }

        setSuccess("Your artist profile has been created.");

        
const { error: roleError } = await supabase
    .from("profiles")
    .update({ role: "ARTIST" })
    .eq("id", user.id);

if (roleError) {
    console.error("Could not update profile role:", roleError);
    setError(
        "Your artist profile was created, but your account role could not be updated. Please contact support."
    );
    setSaving(false);
    return;
}

navigate("/artist/dashboard");

    };

    return (
        <div className="relative min-h-screen overflow-hidden bg-black text-white">
            <Navbar />

            {/* BACKGROUND IMAGE */}
            <div className="fixed inset-0 z-0 overflow-hidden">
                    <img
                        src="/anuktya-bg.jpg"
                        alt=""
                        className="absolute -inset-6 h-[calc(100%+48px)] w-[calc(100%+48px)] scale-105 object-cover blur-[18px]"
                    />

                    <div className="absolute inset-0 bg-black/30" />

                    <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-transparent to-black/60" />
                </div>


            {/* MAIN CONTENT */}
            <main className="relative z-10 px-5 pb-24 pt-36 sm:px-8 sm:pt-40">
                <div className="mx-auto max-w-3xl">
                    {/* PAGE INTRO */}
                    <div className="mb-10 text-center sm:mb-12">
                        <p className="text-xs font-bold uppercase tracking-[0.35em] text-[#b58bd0]">
                            For Creators
                        </p>

                        <h1 className="mt-5 font-serif text-5xl leading-tight tracking-tight text-white sm:text-6xl md:text-7xl">
                            Become an Artist
                        </h1>

                        <p className="mx-auto mt-5 max-w-xl text-base font-medium leading-7 text-white/60 sm:text-lg">
                            Create your artist profile and start sharing
                            your artwork with the Anuktya community.
                        </p>
                    </div>

                    {/* FORM CARD */}
                    <form
                        onSubmit={handleSubmit}
                        className="relative overflow-hidden rounded-3xl border border-[#9d5bc7]/35 bg-[#070609]/90 p-6 shadow-2xl shadow-black/50 backdrop-blur-xl sm:p-10 md:p-12"
                    >
                        <div className="pointer-events-none absolute -right-20 -top-24 h-64 w-64 rounded-full bg-[#8e4fc0]/15 blur-[90px]" />

                        <div className="relative">
                            <div className="border-b border-white/10 pb-6">
                                <p className="text-xs font-bold uppercase tracking-[0.28em] text-[#b58bd0]">
                                    Artist Information
                                </p>

                                <h2 className="mt-3 text-2xl font-semibold text-white">
                                    Tell us about yourself
                                </h2>

                                <p className="mt-2 text-sm leading-6 text-white/45">
                                    Introduce your creative practice and
                                    help art lovers discover your work.
                                </p>
                            </div>

                            {/* ARTIST NAME */}
                            <div className="mt-8">
                                <label
                                    htmlFor="displayName"
                                    className="text-xs font-bold uppercase tracking-[0.2em] text-white/65"
                                >
                                    Artist / Studio Name
                                    <span className="ml-1 text-[#b58bd0]">
                                        *
                                    </span>
                                </label>

                                <input
                                    id="displayName"
                                    type="text"
                                    value={displayName}
                                    onChange={(e) =>
                                        setDisplayName(e.target.value)
                                    }
                                    placeholder="Your artist name"
                                    maxLength={100}
                                    required
                                    className="mt-3 w-full rounded-xl border border-white/15 bg-white/[0.04] px-5 py-4 text-sm text-white outline-none transition placeholder:text-white/30 focus:border-[#a867d4] focus:bg-white/[0.06] focus:ring-2 focus:ring-[#8e4fc0]/20"
                                />
                            </div>

                            {/* BIO */}
                            <div className="mt-7">
                                <div className="flex items-center justify-between gap-4">
                                    <label
                                        htmlFor="bio"
                                        className="text-xs font-bold uppercase tracking-[0.2em] text-white/65"
                                    >
                                        About You
                                    </label>

                                    <span className="text-xs tabular-nums text-white/35">
                                        {bio.length}/500
                                    </span>
                                </div>

                                <textarea
                                    id="bio"
                                    value={bio}
                                    onChange={(e) =>
                                        setBio(e.target.value.slice(0, 500))
                                    }
                                    placeholder="Tell people about your work, your artistic journey, and what inspires you..."
                                    rows={5}
                                    maxLength={500}
                                    className="mt-3 w-full resize-y rounded-xl border border-white/15 bg-white/[0.04] px-5 py-4 text-sm leading-7 text-white outline-none transition placeholder:text-white/30 focus:border-[#a867d4] focus:bg-white/[0.06] focus:ring-2 focus:ring-[#8e4fc0]/20"
                                />
                            </div>

                            {/* LOCATION */}
                            <div className="mt-7">
                                <label
                                    htmlFor="location"
                                    className="text-xs font-bold uppercase tracking-[0.2em] text-white/65"
                                >
                                    Location
                                </label>

                                <input
                                    id="location"
                                    type="text"
                                    value={location}
                                    onChange={(e) =>
                                        setLocation(e.target.value)
                                    }
                                    placeholder="City, Country"
                                    maxLength={150}
                                    className="mt-3 w-full rounded-xl border border-white/15 bg-white/[0.04] px-5 py-4 text-sm text-white outline-none transition placeholder:text-white/30 focus:border-[#a867d4] focus:bg-white/[0.06] focus:ring-2 focus:ring-[#8e4fc0]/20"
                                />
                            </div>

                            {/* ERROR */}
                            {error && (
                                <div
                                    role="alert"
                                    className="mt-6 rounded-xl border border-red-400/20 bg-red-500/10 px-4 py-3 text-sm leading-6 text-red-300"
                                >
                                    {error}
                                </div>
                            )}

                            {/* SUCCESS */}
                            {success && (
                                <div
                                    role="status"
                                    className="mt-6 rounded-xl border border-purple-400/20 bg-purple-500/10 px-4 py-3 text-sm leading-6 text-purple-200"
                                >
                                    {success}
                                </div>
                            )}

                            {/* SUBMIT */}
                            <button
                                type="submit"
                                disabled={saving}
                                className="group mt-9 flex w-full items-center justify-center gap-3 rounded-xl bg-gradient-to-r from-[#8950d5] to-[#a05be0] px-6 py-4 text-sm font-bold text-white shadow-lg shadow-purple-950/40 transition duration-300 hover:-translate-y-0.5 hover:from-[#9a62e5] hover:to-[#b06beb] hover:shadow-xl hover:shadow-purple-900/30 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0"
                            >
                                <span>
                                    {saving
                                        ? "Creating Profile..."
                                        : "Create Artist Profile"}
                                </span>

                                {!saving && (
                                    <span className="transition-transform duration-300 group-hover:translate-x-1">
                                        →
                                    </span>
                                )}
                            </button>

                            <p className="mt-5 text-center text-xs leading-6 text-white/35">
                                Your creative journey with Anuktya starts here.
                            </p>
                        </div>
                    </form>
                </div>
            </main>

            {/* FOOTER */}
            <footer className="relative z-10 border-t border-white/10 bg-black/70 px-6 py-8 backdrop-blur-lg sm:px-10">
                <div className="mx-auto flex max-w-7xl flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <Link
                        to="/"
                        className="font-serif text-3xl italic text-white"
                    >
                        anuktya
                    </Link>

                    <p className="text-sm text-white/40">
                        Art for a more human tomorrow.
                    </p>

                    <Link
                        to="/"
                        className="text-sm font-medium text-white/50 transition hover:text-[#b58bd0]"
                    >
                        Back to Home ↑
                    </Link>
                </div>
            </footer>
        </div>
    );
}

export default BecomeArtist;

