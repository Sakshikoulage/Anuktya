import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "../lib/supabase";

function ArtistProfile() {
    const { id } = useParams();

    const [artist, setArtist] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        const fetchArtist = async () => {
            const { data, error } = await supabase
                .from("artist_profiles")
                .select(`
    id,
    display_name,
    bio,
    profile_image,
    location,
    commission_enabled,
    artworks (
        id,
        title,
        price,
        style,
        medium,
        artwork_images (
            storage_path,
            is_primary,
            display_order
        )
    )
`)
                .eq("id", id)
                .single();

            if (error) {
                setError(error.message);
                setLoading(false);
                return;
            }

            setArtist(data);
            setLoading(false);
        };

        fetchArtist();
    }, [id]);

    if (loading) {
        return <p>Loading artist...</p>;
    }

    if (error) {
        return <p>Error: {error}</p>;
    }

    if (!artist) {
        return <p>Artist not found.</p>;
    }

    return (
        <div className="min-h-screen bg-[#f8f6f1] px-8 py-16">

            <div className="mx-auto max-w-7xl">

                <p className="text-sm uppercase tracking-[0.2em] text-stone-500">
                    Artist
                </p>

                <h1 className="mt-4 font-serif text-6xl">
                    {artist.display_name}
                </h1>
                {artist.bio && (
                    <p className="mt-6 max-w-2xl text-lg leading-8 text-stone-600">
                        {artist.bio}
                    </p>
                )}
                {artist.location && (
                    <p className="mt-4 text-sm uppercase tracking-widest text-stone-500">
                        {artist.location}
                    </p>
                )}
                {artist.commission_enabled && (
                    <p className="mt-6 text-sm uppercase tracking-widest text-stone-500">
                        Commissions available
                    </p>
                )}

                <div className="mt-16">

                    <h2 className="font-serif text-4xl">
                        Artwork
                    </h2>

                    {artist.artworks?.length === 0 ? (

                        <p className="mt-6 text-stone-500">
                            This artist hasn't added any artwork yet.
                        </p>

                    ) : (

                        <div className="mt-8 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">

                            {artist.artworks?.map((artwork) => {

                                const primaryImage =
                                    artwork.artwork_images?.find(
                                        (image) => image.is_primary
                                    );

                                const imageUrl = primaryImage
                                    ? supabase.storage
                                        .from("artwork-images")
                                        .getPublicUrl(
                                            primaryImage.storage_path
                                        ).data.publicUrl
                                    : null;

                                return (
                                    <Link
                                        key={artwork.id}
                                        to={`/artwork/${artwork.id}`}
                                        className="block bg-white p-5"
                                    >

                                        <div className="overflow-hidden bg-stone-200">

                                            {imageUrl ? (

                                                <img
                                                    src={imageUrl}
                                                    alt={artwork.title}
                                                    className="aspect-[4/5] h-full w-full object-cover"
                                                />

                                            ) : (

                                                <div className="flex aspect-[4/5] items-center justify-center">
                                                    <span className="text-stone-400">
                                                        Artwork image
                                                    </span>
                                                </div>

                                            )}

                                        </div>

                                        <h3 className="mt-5 font-serif text-2xl">
                                            {artwork.title}
                                        </h3>

                                        {artwork.style && (
                                            <p className="mt-1 text-sm text-stone-500">
                                                {artwork.style}
                                            </p>
                                        )}

                                        {artwork.medium && (
                                            <p className="mt-1 text-sm text-stone-500">
                                                {artwork.medium}
                                            </p>
                                        )}

                                        {artwork.price && (
                                            <p className="mt-4">
                                                ₹ {artwork.price}
                                            </p>
                                        )}

                                    </Link>
                                );
                            })}

                        </div>

                    )}

                </div>

                <div className="mt-12">
                    <p className="text-stone-500">
                        Artist profile
                    </p>
                </div>

            </div>

        </div>
    );
}

export default ArtistProfile;