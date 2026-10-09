
import { useState } from "react";
import { supabase } from "../lib/supabase";

function Collections() {
    const [query, setQuery] = useState("");
    const [artworks, setArtworks] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const searchArtwork = async () => {
        if (!query.trim()) {
            return;
        }

        setLoading(true);
        setError("");
        setArtworks([]);

        // 1. Ask AI to understand the user's search
        const { data: aiResult, error: aiError } =
            await supabase.functions.invoke("ai-art-search", {
                body: {
                    query: query.trim(),
                },
            });

        if (aiError) {
            console.error("AI error:", aiError);
            setError("Could not understand your search.");
            setLoading(false);
            return;
        }

        console.log("AI result:", aiResult);

        // 2. Start with available artworks
        let artworkQuery = supabase
            .from("artworks")
            .select(`
                *,
                artist_profiles (
                    display_name
                ),
                artwork_images (
                    storage_path,
                    is_primary
                )
            `)
            .eq("availability", "AVAILABLE");

        // 3. Apply style filter
        if (aiResult.style) {
            artworkQuery = artworkQuery.ilike(
                "style",
                `%${aiResult.style}%`
            );
        }

        // 4. Apply medium filter
        if (aiResult.medium) {
            artworkQuery = artworkQuery.ilike(
                "medium",
                `%${aiResult.medium}%`
            );
        }

        // 5. Apply maximum price
        if (aiResult.maxPrice) {
            artworkQuery = artworkQuery.lte(
                "price",
                aiResult.maxPrice
            );
        }

        // 6. Apply AI keywords
        //
        // Each keyword searches across:
        // - artwork title
        // - description
        // - style
        // - medium
        //
        // Example:
        //
        // keywords = ["peaceful", "earthy"]
        //
        // becomes a search across the artwork fields.
        if (
            Array.isArray(aiResult.keywords) &&
            aiResult.keywords.length > 0
        ) {
            const keywordConditions = aiResult.keywords
                .filter(
                    (keyword) =>
                        typeof keyword === "string" &&
                        keyword.trim()
                )
                .map((keyword) => {
                    const value = keyword.trim();

                    return [
                        `title.ilike.%${value}%`,
                        `description.ilike.%${value}%`,
                        `style.ilike.%${value}%`,
                        `medium.ilike.%${value}%`,
                    ].join(",");
                })
                .join(",");

            if (keywordConditions) {
                artworkQuery = artworkQuery.or(keywordConditions);
            }
        }

        // 7. Fetch matching artworks
        const { data, error: artworkError } =
            await artworkQuery.order(
                "created_at",
                { ascending: false }
            );

        if (artworkError) {
            console.error(
                "Artwork search error:",
                artworkError
            );

            setError("Could not search artworks.");
            setLoading(false);
            return;
        }

        setArtworks(data || []);
        setLoading(false);
    };

    return (
        <div className="min-h-screen bg-[#f8f6f1] px-8 py-16">

            <div className="mx-auto max-w-7xl">

                <p className="text-sm uppercase tracking-[0.2em] text-stone-500">
                    AI Artwork Search
                </p>

                <h1 className="mt-4 font-serif text-6xl">
                    What's on your mind?
                </h1>

                <div className="mt-8 flex max-w-2xl gap-3">

                    <input
                        value={query}
                        onChange={(e) =>
                            setQuery(e.target.value)
                        }
                        onKeyDown={(e) => {
                            if (e.key === "Enter") {
                                searchArtwork();
                            }
                        }}
                        placeholder="Describe the artwork you're looking for..."
                        className="flex-1 border border-stone-300 bg-white px-5 py-4 outline-none"
                    />

                    <button
                        onClick={searchArtwork}
                        disabled={loading}
                        className="bg-stone-900 px-6 py-4 text-sm uppercase tracking-widest text-white"
                    >
                        {loading
                            ? "Searching..."
                            : "Search"}
                    </button>

                </div>

                {error && (
                    <p className="mt-6 text-red-600">
                        {error}
                    </p>
                )}

                {artworks.length > 0 && (
                    <div className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">

                        {artworks.map((artwork) => {

                            const primaryImage =
                                artwork.artwork_images?.find(
                                    (image) =>
                                        image.is_primary
                                );

                            const imageUrl = primaryImage
                                ? supabase.storage
                                    .from("artwork-images")
                                    .getPublicUrl(
                                        primaryImage.storage_path
                                    ).data.publicUrl
                                : null;

                            return (
                                <div
                                    key={artwork.id}
                                    className="bg-white p-5"
                                >

                                    <div className="aspect-[4/5] overflow-hidden bg-stone-200">

                                        {imageUrl ? (
                                            <img
                                                src={imageUrl}
                                                alt={artwork.title}
                                                className="h-full w-full object-cover"
                                            />
                                        ) : (
                                            <div className="flex h-full items-center justify-center">
                                                Artwork image
                                            </div>
                                        )}

                                    </div>

                                    <h2 className="mt-5 font-serif text-2xl">
                                        {artwork.title}
                                    </h2>

                                    <p className="mt-2 text-stone-600">
                                        {artwork.artist_profiles?.display_name}
                                    </p>

                                    {artwork.price && (
                                        <p className="mt-4">
                                            ₹ {artwork.price}
                                        </p>
                                    )}

                                </div>
                            );
                        })}

                    </div>
                )}

                {!loading &&
                    !error &&
                    query &&
                    artworks.length === 0 && (
                        <p className="mt-12 text-stone-500">
                            No artworks found.
                        </p>
                    )}

            </div>
        </div>
    );
}

export default Collections;
