
import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";

function AddArtwork() {
    const navigate = useNavigate();

    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [price, setPrice] = useState("");
    const [style, setStyle] = useState("");
    const [medium, setMedium] = useState("");
    const [dimensions, setDimensions] = useState("");
    const [isOriginal, setIsOriginal] = useState(true);

    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [listingType, setListingType] = useState("SALE");
    const [imageFile, setImageFile] = useState(null);
    const [imagePreview, setImagePreview] = useState("");
    const [quantity, setQuantity] = useState("1");

    useEffect(() => {
        return () => {
            if (imagePreview) {
                URL.revokeObjectURL(imagePreview);
            }
        };
    }, [imagePreview]);

    const handleImageChange = (e) => {
        const file = e.target.files?.[0];

        if (!file) return;

        if (!file.type.startsWith("image/")) {
            setError("Please select a valid image file.");
            return;
        }

        if (file.size > 10 * 1024 * 1024) {
            setError("Image size must be 10MB or less.");
            return;
        }

        setError("");
        setImageFile(file);
        setImagePreview(URL.createObjectURL(file));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        setSaving(true);
        setError("");

        try {
            // 1. Get logged-in user
            const {
                data: { user },
                error: authError,
            } = await supabase.auth.getUser();

            if (authError) throw authError;

            if (!user) {
                setError("You must be logged in.");
                return;
            }

            if (!imageFile) {
                setError("Please select an artwork image.");
                return;
            }

            // 2. Find artist profile
            const { data: artist, error: artistError } =
                await supabase
                    .from("artist_profiles")
                    .select("id")
                    .eq("user_id", user.id)
                    .maybeSingle();

            if (artistError) throw artistError;

            if (!artist) {
                setError("Artist profile not found.");
                return;
            }

            // 3. Create artwork
            const { data: artwork, error: artworkError } =
                await supabase
                    .from("artworks")
                    .insert({
                        artist_id: artist.id,
                        title: title.trim(),
                        description: description.trim() || null,
                        quantity: Number(quantity),
                        price: price !== "" ? Number(price) : null,
                        style: style.trim() || null,
                        medium: medium.trim() || null,
                        dimensions: dimensions.trim() || null,
                        is_original: isOriginal,
                        listing_type: listingType,
                    })
                    .select()
                    .single();

            if (artworkError) throw artworkError;

            // 4. Upload artwork image
            const fileExt = imageFile.name.split(".").pop();
            const fileName = `${artwork.id}.${fileExt}`;

            const { error: uploadError } = await supabase.storage
                .from("artwork-images")
                .upload(fileName, imageFile);

            if (uploadError) throw uploadError;

            // 5. Save image record
            const { error: imageError } = await supabase
                .from("artwork_images")
                .insert({
                    artwork_id: artwork.id,
                    storage_path: fileName,
                    is_primary: true,
                    display_order: 0,
                });

            if (imageError) throw imageError;

            // 6. Open the newly created artwork
            navigate(`/artwork/${artwork.id}`);
        } catch (err) {
            console.error("Artwork creation failed:", err);
            setError(err.message || "Could not create artwork. Please try again.");
        } finally {
            setSaving(false);
        }
    };

    const inputClass =
        "mt-3 w-full rounded-xl border border-white/15 bg-white/[0.04] px-4 py-3.5 text-sm text-white outline-none transition placeholder:text-white/30 focus:border-[#a867d4] focus:bg-white/[0.06] focus:ring-2 focus:ring-[#8e4fc0]/20";

    const labelClass =
        "text-xs font-bold uppercase tracking-[0.18em] text-white/65";

    return (
        <div className="relative min-h-screen overflow-hidden bg-black text-white">
            <Navbar />

            {/* BLURRED BACKGROUND */}
            <div className="fixed inset-0 z-0 overflow-hidden">
                <img
                    src="/anuktya-bg.jpg"
                    alt=""
                    aria-hidden="true"
                    className="absolute -inset-6 h-[calc(100%+48px)] w-[calc(100%+48px)] scale-105 object-cover blur-[18px]"
                />

                <div className="absolute inset-0 bg-black/40" />

                <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-[#100a16]/45 to-black/80" />

                <div className="absolute -left-32 top-1/4 h-96 w-96 rounded-full bg-[#8e4fc0]/15 blur-[140px]" />

                <div className="absolute -right-32 bottom-0 h-96 w-96 rounded-full bg-[#8e4fc0]/15 blur-[140px]" />
            </div>

            {/* PAGE CONTENT */}
            <main className="relative z-10 px-4 pb-20 pt-32 sm:px-8 sm:pt-36">
                <div className="mx-auto max-w-4xl">
                    {/* HEADING */}
                    <div className="mb-9 text-center sm:mb-12">
                        <p className="text-xs font-bold uppercase tracking-[0.35em] text-[#b58bd0]">
                            Artist Workspace
                        </p>

                        <h1 className="mt-4 font-serif text-5xl tracking-tight text-white sm:text-6xl md:text-7xl">
                            Share Your Art
                        </h1>

                        <p className="mx-auto mt-4 max-w-xl text-sm leading-7 text-white/55 sm:text-base">
                            Give your creativity a place to shine.
                            Add your artwork to the Anuktya community.
                        </p>
                    </div>

                    {/* FORM CARD */}
                    <form
                        onSubmit={handleSubmit}
                        className="relative overflow-hidden rounded-3xl border border-[#9d5bc7]/30 bg-[#070609]/90 p-5 shadow-2xl shadow-black/50 backdrop-blur-xl sm:p-8 md:p-10"
                    >
                        <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-[#8e4fc0]/15 blur-[100px]" />

                        <div className="relative">
                            <div className="mb-8 border-b border-white/10 pb-6">
                                <p className="text-xs font-bold uppercase tracking-[0.25em] text-[#b58bd0]">
                                    Artwork Details
                                </p>

                                <h2 className="mt-3 text-2xl font-semibold text-white">
                                    New Artwork
                                </h2>

                                <p className="mt-2 text-sm leading-6 text-white/40">
                                    Add the details below to prepare your artwork listing.
                                </p>
                            </div>

                            {/* IMAGE UPLOAD */}
                            <div className="mb-8">
                                <label className={labelClass}>
                                    Artwork Image
                                    <span className="ml-1 text-[#b58bd0]">*</span>
                                </label>

                                <label className="group mt-3 flex min-h-56 cursor-pointer flex-col items-center justify-center overflow-hidden rounded-2xl border border-dashed border-[#9d5bc7]/50 bg-white/[0.025] px-5 py-8 text-center transition hover:border-[#b58bd0] hover:bg-[#8e4fc0]/[0.06]">
                                    {imagePreview ? (
                                        <div className="w-full">
                                            <img
                                                src={imagePreview}
                                                alt="Artwork preview"
                                                className="mx-auto max-h-80 max-w-full rounded-xl object-contain shadow-xl"
                                            />

                                            <p className="mt-4 break-all text-sm font-medium text-[#d8b8ed]">
                                                {imageFile?.name}
                                            </p>

                                            <p className="mt-1 text-xs text-white/40">
                                                Click to choose a different image
                                            </p>
                                        </div>
                                    ) : (
                                        <>
                                            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-[#9d5bc7]/30 bg-[#8e4fc0]/10 text-3xl text-[#b58bd0] transition group-hover:bg-[#8e4fc0]/20">
                                                ↑
                                            </div>

                                            <p className="text-lg font-semibold text-white">
                                                Upload your artwork
                                            </p>

                                            <p className="mt-2 text-sm text-white/45">
                                                Click to browse your files
                                            </p>

                                            <p className="mt-3 text-xs text-white/30">
                                                Images only · Maximum 10MB
                                            </p>
                                        </>
                                    )}

                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={handleImageChange}
                                        className="sr-only"
                                    />
                                </label>
                            </div>

                            {/* TITLE */}
                            <div>
                                <label htmlFor="artwork-title" className={labelClass}>
                                    Title <span className="text-red-300">*</span>
                                </label>

                                <input
                                    id="artwork-title"
                                    type="text"
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    placeholder="Enter your artwork title"
                                    required
                                    className={inputClass}
                                />
                            </div>

                            {/* DESCRIPTION */}
                            <div className="mt-7">
                                <label htmlFor="artwork-description" className={labelClass}>
                                    Description
                                </label>

                                <textarea
                                    id="artwork-description"
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    placeholder="Describe your artwork, inspiration, and creative process..."
                                    rows={4}
                                    className={`${inputClass} resize-y leading-7`}
                                />
                            </div>

                            {/* PRICE + STYLE */}
                            <div className="mt-7 grid gap-6 sm:grid-cols-2">
                                <div>
                                    <label htmlFor="artwork-price" className={labelClass}>
                                        Price
                                    </label>

                                    <input
                                        id="artwork-price"
                                        type="number"
                                        value={price}
                                        onChange={(e) => setPrice(e.target.value)}
                                        placeholder="Enter price (₹)"
                                        min="0"
                                        step="0.01"
                                        className={inputClass}
                                    />
                                </div>




                                <div>
                                    <label htmlFor="artwork-style" className={labelClass}>
                                        Style
                                    </label>

                                    <input
                                        id="artwork-style"
                                        type="text"
                                        value={style}
                                        onChange={(e) => setStyle(e.target.value)}
                                        placeholder="e.g. Abstract, Contemporary"
                                        className={inputClass}
                                    />
                                </div>
                                <div className="mt-7">
                                    <label htmlFor="quantity" className={labelClass}>
                                        Quantity
                                        <span className="ml-1 text-[#b58bd0]">*</span>
                                    </label>

                                    <input
                                        id="quantity"
                                        type="number"
                                        value={quantity}
                                        onChange={(e) => setQuantity(e.target.value)}
                                        min="1"
                                        step="1"
                                        required
                                        placeholder="Enter available quantity"
                                        className={inputClass}
                                    />

                                    <p className="mt-2 text-xs text-white/35">
                                        How many pieces are available for purchase?
                                    </p>
                                </div>
                            </div>

                            {/* MEDIUM + DIMENSIONS */}
                            <div className="mt-7 grid gap-6 sm:grid-cols-2">
                                <div>
                                    <label htmlFor="artwork-medium" className={labelClass}>
                                        Medium
                                    </label>

                                    <input
                                        id="artwork-medium"
                                        type="text"
                                        value={medium}
                                        onChange={(e) => setMedium(e.target.value)}
                                        placeholder="e.g. Oil on canvas"
                                        className={inputClass}
                                    />
                                </div>

                                <div>
                                    <label htmlFor="artwork-dimensions" className={labelClass}>
                                        Dimensions
                                    </label>

                                    <input
                                        id="artwork-dimensions"
                                        type="text"
                                        value={dimensions}
                                        onChange={(e) => setDimensions(e.target.value)}
                                        placeholder="e.g. 24 × 36 inches"
                                        className={inputClass}
                                    />
                                </div>
                            </div>

                            {/* LISTING TYPE */}
                            <div className="mt-7">
                                <label htmlFor="listing-type" className={labelClass}>
                                    Listing Type
                                </label>

                                <select
                                    id="listing-type"
                                    value={listingType}
                                    onChange={(e) => setListingType(e.target.value)}
                                    className={inputClass}
                                >
                                    <option value="SALE" className="bg-[#09070b]">
                                        For Sale
                                    </option>

                                    <option value="COMMISSION" className="bg-[#09070b]">
                                        Commission
                                    </option>

                                    <option value="REFERENCE" className="bg-[#09070b]">
                                        Reference
                                    </option>
                                </select>
                            </div>

                            {/* ORIGINAL ARTWORK */}
                            <div className="mt-7 rounded-2xl border border-white/10 bg-white/[0.025] p-5">
                                <label className="flex cursor-pointer items-center gap-4">
                                    <input
                                        type="checkbox"
                                        checked={isOriginal}
                                        onChange={(e) => setIsOriginal(e.target.checked)}
                                        className="h-4 w-4 accent-[#9d5bc7]"
                                    />

                                    <span>
                                        <span className="block text-sm font-semibold text-white">
                                            Original Artwork
                                        </span>

                                        <span className="mt-1 block text-xs leading-5 text-white/40">
                                            This piece is an original artwork created by me.
                                        </span>
                                    </span>
                                </label>
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

                            {/* ACTION BUTTONS */}
                            <div className="mt-9 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                                <button
                                    type="button"
                                    onClick={() => navigate("/artist/dashboard")}
                                    disabled={saving}
                                    className="rounded-xl border border-white/15 px-7 py-3.5 text-sm font-semibold text-white/65 transition hover:border-[#b58bd0]/60 hover:bg-white/[0.04] hover:text-white disabled:opacity-50"
                                >
                                    Cancel
                                </button>

                                <button
                                    type="submit"
                                    disabled={saving}
                                    className="group inline-flex items-center justify-center gap-3 rounded-xl bg-gradient-to-r from-[#8950d5] to-[#a05be0] px-8 py-3.5 text-sm font-bold text-white shadow-lg shadow-purple-950/40 transition duration-300 hover:-translate-y-0.5 hover:from-[#9a62e5] hover:to-[#b06beb] hover:shadow-xl hover:shadow-purple-900/30 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0"
                                >
                                    {saving ? "Creating Artwork..." : "Create Artwork"}

                                    {!saving && (
                                        <span className="transition-transform group-hover:translate-x-1">
                                            →
                                        </span>
                                    )}
                                </button>
                            </div>

                            <p className="mt-5 text-center text-xs leading-6 text-white/30">
                                Your creativity belongs in the spotlight.
                            </p>
                        </div>
                    </form>
                </div>
            </main>

            {/* FOOTER */}
            <footer className="relative z-10 border-t border-white/10 bg-black/65 px-6 py-8 backdrop-blur-lg sm:px-10">
                <div className="mx-auto flex max-w-7xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <button
                        type="button"
                        onClick={() => navigate("/")}
                        className="self-start font-serif text-3xl italic text-white"
                    >
                        anuktya
                    </button>

                    <p className="text-sm text-white/40">
                        Art for a more human tomorrow.
                    </p>

                    <button
                        type="button"
                        onClick={() => navigate("/artist/dashboard")}
                        className="self-start text-sm font-medium text-white/50 transition hover:text-[#b58bd0] sm:self-auto"
                    >
                        Back to Dashboard ↑
                    </button>
                </div>
            </footer>
        </div>
    );
}

export default AddArtwork;
