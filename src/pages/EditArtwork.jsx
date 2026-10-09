

import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { useNavigate, useParams } from "react-router-dom";
import Navbar from "../components/Navbar";

function EditArtwork() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [artist, setArtist] = useState(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [style, setStyle] = useState("");
  const [medium, setMedium] = useState("");
  const [dimensions, setDimensions] = useState("");
  const [listingType, setListingType] = useState("SALE");
  const [isOriginal, setIsOriginal] = useState(true);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [currentImage, setCurrentImage] = useState(null);
  const [newImageFile, setNewImageFile] = useState(null);
  const [newImagePreview, setNewImagePreview] = useState("");

  useEffect(() => {
    const fetchArtwork = async () => {
      try {
        const {
          data: { user },
          error: authError,
        } = await supabase.auth.getUser();

        if (authError) throw authError;

        if (!user) {
          setError("You must be logged in.");
          setLoading(false);
          return;
        }

        // Find the logged-in user's artist profile.
        const { data: artistData, error: artistError } =
          await supabase
            .from("artist_profiles")
            .select("id")
            .eq("user_id", user.id)
            .maybeSingle();

        if (artistError) throw artistError;

        if (!artistData) {
          setError("Artist profile not found.");
          setLoading(false);
          return;
        }

        setArtist(artistData);

        // Only fetch artwork owned by this artist.
        const { data: artwork, error: artworkError } =
          await supabase
            .from("artworks")
            .select(`
              id,
              title,
              description,
              price,
              style,
              medium,
              dimensions,
              listing_type,
              is_original
            `)
            .eq("id", id)
            .eq("artist_id", artistData.id)
            .maybeSingle();

        if (artworkError) throw artworkError;

        if (!artwork) {
          setError("Artwork not found.");
          setLoading(false);
          return;
        }

        const { data: imageData, error: imageError } =
          await supabase
            .from("artwork_images")
            .select(`
              id,
              storage_path,
              is_primary,
              display_order
            `)
            .eq("artwork_id", artwork.id)
            .eq("is_primary", true)
            .maybeSingle();

        if (imageError) throw imageError;

        setCurrentImage(imageData);
        setTitle(artwork.title || "");
        setDescription(artwork.description || "");
        setPrice(
          artwork.price !== null && artwork.price !== undefined
            ? String(artwork.price)
            : ""
        );
        setStyle(artwork.style || "");
        setMedium(artwork.medium || "");
        setDimensions(artwork.dimensions || "");
        setListingType(artwork.listing_type || "SALE");
        setIsOriginal(artwork.is_original ?? true);
      } catch (err) {
        setError(err.message || "Unable to load artwork.");
      } finally {
        setLoading(false);
      }
    };

    fetchArtwork();
  }, [id]);

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];

    if (!file) return;

    setNewImageFile(file);
    setNewImagePreview(URL.createObjectURL(file));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!artist) return;

    setSaving(true);
    setError("");

    try {
      const { error: updateError } = await supabase
        .from("artworks")
        .update({
          title: title.trim(),
          description: description.trim() || null,
          price: price !== "" ? Number(price) : null,
          style: style.trim() || null,
          medium: medium.trim() || null,
          dimensions: dimensions.trim() || null,
          listing_type: listingType,
          is_original: isOriginal,
        })
        .eq("id", id)
        .eq("artist_id", artist.id);

      if (updateError) throw updateError;

      // Replace the image only if a new file was selected.
      if (newImageFile) {
        const fileExt = newImageFile.name.split(".").pop();
        const newFileName = `${id}-${Date.now()}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from("artwork-images")
          .upload(newFileName, newImageFile);

        if (uploadError) throw uploadError;

        if (currentImage) {
          const oldStoragePath = currentImage.storage_path;

          const { error: imageUpdateError } = await supabase
            .from("artwork_images")
            .update({
              storage_path: newFileName,
            })
            .eq("id", currentImage.id);

          if (imageUpdateError) throw imageUpdateError;

          if (oldStoragePath) {
            const { error: deleteOldImageError } =
              await supabase.storage
                .from("artwork-images")
                .remove([oldStoragePath]);

            if (deleteOldImageError) {
              console.error(
                "Could not delete old image:",
                deleteOldImageError.message
              );
            }
          }
        } else {
          const { error: imageInsertError } = await supabase
            .from("artwork_images")
            .insert({
              artwork_id: id,
              storage_path: newFileName,
              is_primary: true,
              display_order: 0,
            });

          if (imageInsertError) throw imageInsertError;
        }
      }

      navigate(`/artwork/${id}`);
    } catch (err) {
      setError(err.message || "Unable to save artwork changes.");
    } finally {
      setSaving(false);
    }
  };

  const inputClass =
    "mt-3 w-full rounded-xl border border-white/10 bg-[#0d0a10] px-4 py-3 text-white outline-none transition placeholder:text-white/30 focus:border-[#8f5bb7] focus:ring-1 focus:ring-[#8f5bb7]/30";

  const labelClass =
    "block text-xs uppercase tracking-[0.16em] text-white/55";

  const imageUrl = currentImage?.storage_path
    ? currentImage.storage_path.startsWith("http")
      ? currentImage.storage_path
      : supabase.storage
          .from("artwork-images")
          .getPublicUrl(currentImage.storage_path).data.publicUrl
    : null;

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen bg-[#09070b] px-6 py-24 text-center text-white/60">
          Loading artwork...
        </div>
      </>
    );
  }

  if (error && !artist) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen bg-[#09070b] px-5 py-16 sm:px-8">
          <div className="mx-auto max-w-3xl rounded-2xl border border-red-400/20 bg-red-500/5 p-6 text-red-300">
            {error}
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar />

      <main className="min-h-screen bg-[#09070b] px-5 py-12 text-white sm:px-8 lg:px-12">
        <div className="mx-auto max-w-4xl">
          {/* Page heading */}
          <div className="mb-9">
            <p className="text-xs uppercase tracking-[0.22em] text-[#b58bd0]">
              Artist Workspace
            </p>

            <h1 className="mt-3 font-serif text-4xl text-white sm:text-5xl">
              Edit Artwork
            </h1>

            <p className="mt-3 max-w-xl text-sm leading-6 text-white/50">
              Refine your artwork details, update its presentation, and
              keep your collection up to date.
            </p>
          </div>

          {/* Form card */}
          <form
            onSubmit={handleSubmit}
            className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] shadow-2xl shadow-black/20"
          >
            <div className="space-y-9 p-5 sm:p-8 lg:p-10">
              {/* Artwork image */}
              <section>
                <div className="mb-4">
                  <p className={labelClass}>Artwork Image</p>
                  <p className="mt-2 text-sm text-white/40">
                    Upload a replacement image if you want to update
                    the artwork's appearance.
                  </p>
                </div>

                {newImagePreview ? (
                  <div className="mb-5">
                    <p className="mb-3 text-xs uppercase tracking-widest text-[#b58bd0]">
                      New Image Preview
                    </p>
                    <img
                      src={newImagePreview}
                      alt="New artwork preview"
                      className="aspect-[4/5] w-full max-w-xs rounded-xl border border-[#8f5bb7]/30 object-cover"
                    />
                  </div>
                ) : imageUrl ? (
                  <div className="mb-5">
                    <p className="mb-3 text-xs uppercase tracking-widest text-white/40">
                      Current Image
                    </p>
                    <img
                      src={imageUrl}
                      alt={title || "Current artwork"}
                      className="aspect-[4/5] w-full max-w-xs rounded-xl border border-white/10 object-cover"
                    />
                  </div>
                ) : (
                  <div className="mb-5 flex aspect-[4/5] w-full max-w-xs items-center justify-center rounded-xl border border-dashed border-white/15 bg-white/[0.02] text-sm text-white/35">
                    No image uploaded
                  </div>
                )}

                <label className="flex cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-white/15 bg-white/[0.02] px-5 py-6 text-center transition hover:border-[#8f5bb7]/60 hover:bg-[#8f5bb7]/5">
                  <span className="text-sm font-medium text-white">
                    Choose a new image
                  </span>
                  <span className="mt-1 text-xs text-white/40">
                    Select an image from your device
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="mt-4 block w-full max-w-xs text-sm text-white/60 file:mr-4 file:rounded-full file:border-0 file:bg-[#8f5bb7]/20 file:px-4 file:py-2 file:text-sm file:text-[#d0afe8] hover:file:bg-[#8f5bb7]/30"
                  />
                </label>
              </section>

              <div className="border-t border-white/10" />

              {/* Title */}
              <div>
                <label className={labelClass}>Title</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                  className={inputClass}
                  placeholder="Enter artwork title"
                />
              </div>

              {/* Description */}
              <div>
                <label className={labelClass}>Description</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={5}
                  className={`${inputClass} resize-y`}
                  placeholder="Tell the story behind your artwork..."
                />
              </div>

              {/* Price */}
              <div>
                <label className={labelClass}>Price (₹)</label>
                <input
                  type="number"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  min="0"
                  step="0.01"
                  className={inputClass}
                  placeholder="Enter price"
                />
              </div>

              {/* Style and medium */}
              <div className="grid grid-cols-1 gap-8 sm:grid-cols-2">
                <div>
                  <label className={labelClass}>Style</label>
                  <input
                    type="text"
                    value={style}
                    onChange={(e) => setStyle(e.target.value)}
                    className={inputClass}
                    placeholder="e.g. Abstract"
                  />
                </div>

                <div>
                  <label className={labelClass}>Medium</label>
                  <input
                    type="text"
                    value={medium}
                    onChange={(e) => setMedium(e.target.value)}
                    className={inputClass}
                    placeholder="e.g. Acrylic on canvas"
                  />
                </div>
              </div>

              {/* Dimensions */}
              <div>
                <label className={labelClass}>Dimensions</label>
                <input
                  type="text"
                  value={dimensions}
                  onChange={(e) => setDimensions(e.target.value)}
                  className={inputClass}
                  placeholder="e.g. 24 × 36 inches"
                />
              </div>

              {/* Listing type */}
              <div>
                <label className={labelClass}>Listing Type</label>
                <select
                  value={listingType}
                  onChange={(e) => setListingType(e.target.value)}
                  className={inputClass}
                >
                  <option value="SALE" className="bg-[#0d0a10]">
                    For Sale
                  </option>
                  <option value="COMMISSION" className="bg-[#0d0a10]">
                    Commission
                  </option>
                  <option value="REFERENCE" className="bg-[#0d0a10]">
                    Reference
                  </option>
                </select>
              </div>

              {/* Original artwork */}
              <div className="rounded-xl border border-white/10 bg-white/[0.02] p-5">
                <p className={labelClass}>Artwork Type</p>

                <label className="mt-4 flex cursor-pointer items-center gap-3">
                  <input
                    type="checkbox"
                    checked={isOriginal}
                    onChange={(e) => setIsOriginal(e.target.checked)}
                    className="h-4 w-4 accent-[#8f5bb7]"
                  />
                  <span className="text-sm text-white/75">
                    This is an original artwork
                  </span>
                </label>
              </div>

              {/* Error message */}
              {error && (
                <div className="rounded-xl border border-red-400/20 bg-red-500/5 p-4 text-sm text-red-300">
                  {error}
                </div>
              )}
            </div>

            {/* Form actions */}
            <div className="flex flex-col-reverse gap-3 border-t border-white/10 bg-black/20 px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-8 lg:px-10">
              <button
                type="button"
                onClick={() => navigate(`/artwork/${id}`)}
                className="rounded-full border border-white/15 px-6 py-3 text-sm text-white/75 transition hover:border-white/30 hover:bg-white/5 hover:text-white"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={saving}
                className="rounded-full bg-[#8f5bb7] px-7 py-3 text-sm font-medium text-white transition hover:bg-[#a875ce] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {saving ? "Saving Changes..." : "Save Changes"}
              </button>
            </div>
          </form>

          <p className="mt-6 text-center text-xs text-white/30">
            Your artwork updates will be reflected in your collection.
          </p>
        </div>
      </main>
    </>
  );
}

export default EditArtwork;
