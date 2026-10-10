import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import Navbar from "../components/Navbar";

const FAMOUS_ARTISTS = [
  {
    name: "Vincent van Gogh",
    work: "The Starry Night",
    year: "1889",
    image: "/artists/starry-night.jpg",
    description:
      "A restless night sky transformed into one of the most recognisable paintings in the history of art.",
  },
  {
    name: "Leonardo da Vinci",
    work: "Mona Lisa",
    year: "1503–1519",
    image: "/artists/mona-lisa.jpg",
    description:
      "A quiet expression and mysterious presence that have fascinated viewers for centuries.",
  },
  {
    name: "Gustav Klimt",
    work: "The Kiss",
    year: "1907–1908",
    image: "/artists/the-kiss.jpg",
    description:
      "Gold, ornament and intimacy come together in one of Klimt's most celebrated works.",
  },
  {
    name: "Claude Monet",
    work: "Water Lilies",
    year: "1890s–1920s",
    image: "/artists/water-lilies.jpg",
    description:
      "Light, colour and reflection dissolve together in Monet's meditations on his garden pond.",
  },
];

export default function Home() {
  const navigate = useNavigate();

  
  const [search, setSearch] = useState("");
  const [artworks, setArtworks] = useState([]);
  const [loadingArtworks, setLoadingArtworks] = useState(true);

  useEffect(() => {
    fetchArtworks();
  }, []);

  async function fetchArtworks() {
    setLoadingArtworks(true);

    const { data, error } = await supabase
      .from("artworks")
      .select(`
        id,
        title,
        price,
        artist_id,
        artwork_images (
          image_url,
          is_primary
        ),
        artist_profiles (
          id,
          profiles (
            full_name
          )
        )
      `)
      .eq("status", "SALE")
      .limit(4);

    if (!error && data) {
      setArtworks(data);
    }

    setLoadingArtworks(false);
  }

  function handleSearch(e) {
    e.preventDefault();

    const query = search.trim();

    if (query) {
      navigate(`/explore?search=${encodeURIComponent(query)}`);
    } else {
      navigate("/explore");
    }
  }

  function getArtworkImage(artwork) {
    const images = artwork?.artwork_images || [];

    const primary = images.find((image) => image.is_primary);

    return (
      primary?.image_url ||
      images[0]?.image_url ||
      "/placeholder-art.jpg"
    );
  }

  function getArtistName(artwork) {
    return (
      artwork?.artist_profiles?.profiles?.full_name ||
      "Anuktya Artist"
    );
  }

  function formatPrice(price) {
    if (price === null || price === undefined) {
      return "Price on request";
    }

    return `₹${Number(price).toLocaleString("en-IN")}`;
  }

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-black text-white">
      {/* =========================================================
          FULL PAGE BACKGROUND
      ========================================================= */}

      <div className="fixed inset-0 z-0 overflow-hidden">
        <img
          src="/anuktya-bg.jpg"
          alt=""
          className="absolute -inset-6 h-[calc(100%+48px)] w-[calc(100%+48px)] object-cover scale-105 blur-[18px]"
        />

        <div className="absolute inset-0 bg-black/20" />

        <div className="absolute inset-0 bg-gradient-to-b from-black/15 via-transparent to-black/50" />
      </div>

      {/* =========================================================
          NAVBAR
      ========================================================= */}
      <div className="relative z-10">

        <Navbar />

        {/* =========================================================
          PAGE CONTENT
      ========================================================= */}

        <main>
          {/* =======================================================
            HERO
        ======================================================= */}

          <section className="relative flex min-h-screen items-center px-6 pb-24 pt-36 md:px-12 lg:px-20">
            <div className="mx-auto w-full max-w-7xl">
              <div className="max-w-5xl">
                <p className="mb-7 text-sm font-bold uppercase tracking-[0.4em] text-white/75">
                 ' Art speaks where words are unable to explain.'
                </p>

                <h1
                  className="text-6xl font-black leading-[0.9] tracking-[-0.055em] text-white sm:text-7xl md:text-8xl lg:text-[120px]"
                  style={{
                    textShadow: "0 8px 40px rgba(0,0,0,0.45)",
                  }}
                >
                  Art
                  <br />
                  that stays
                  <br />
                  <span className="text-white">
                    with you.
                  </span>
                </h1>

                <p className="mt-9 max-w-2xl text-lg font-medium leading-8 text-white/85 md:text-xl">
                  Discover original artworks, meet independent artists
                  and find pieces that make your space feel like yours.
                </p>

                <div className="mt-10 flex flex-wrap gap-4">
                  <button
                    type="button"
                    onClick={() => navigate("/explore")}
                    className="rounded-full bg-[#8e4fc0] px-8 py-4 text-sm font-bold text-white shadow-lg shadow-purple-950/30 transition hover:bg-[#a867d4] hover:shadow-purple-500/20"
                  >
                    Explore artwork
                  </button>

                  <button
                    type="button"
                    onClick={() => navigate("/artists")}
                    className="rounded-full border border-white/30 bg-black/20 px-8 py-4 text-sm font-bold text-white backdrop-blur-md transition hover:border-white/60 hover:bg-white/10"
                  >
                    Meet the artists
                  </button>
                </div>
              </div>

              {/* SEARCH */}
              <div className="mt-20 max-w-5xl">
                <form
                  onSubmit={handleSearch}
                  className="flex items-center rounded-full border border-white/20 bg-black/35 p-2 shadow-2xl backdrop-blur-xl transition focus-within:border-[#b579d8]"
                >
                  <div className="flex flex-1 items-center px-5">
                    <span className="mr-4 text-xl text-white/70">
                      ⌕
                    </span>

                    <input
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      placeholder="What are you looking for?"
                      className="w-full bg-transparent py-4 text-base font-semibold text-white outline-none placeholder:text-white/60"
                    />
                  </div>

                  <button
                    type="submit"
                    className="rounded-full bg-[#8e4fc0] px-7 py-4 text-sm font-bold text-white transition hover:bg-[#a867d4]"
                  >
                    Explore
                  </button>
                </form>
              </div>
            </div>
          </section>

          {/* =======================================================
            FAMOUS ARTISTS
        ======================================================= */}

          <section className="px-6 py-28 md:px-12 lg:px-20">
            <div className="mx-auto max-w-7xl">
              <div className="mb-14">
                <p className="mb-4 text-sm font-bold uppercase tracking-[0.35em] text-white/70">
                  Remembrance corner
                </p>

                <h2 className="text-5xl font-black tracking-[-0.04em] text-white sm:text-6xl md:text-7xl">
                  Artists who changed
                  <br />
                  the way we see.
                </h2>

                <p className="mt-6 max-w-2xl text-base font-medium leading-7 text-white/70 md:text-lg">
                  A collection of artists whose work continues to shape
                  the language of art.
                </p>
              </div>

              {/* STATIONARY CARDS */}
              <div className="grid grid-cols-1 gap-7 sm:grid-cols-2 lg:grid-cols-4">
                {FAMOUS_ARTISTS.map((artist) => (
                  <article
                    key={artist.name}
                    className="group overflow-hidden rounded-2xl border border-white/15 bg-black/35 shadow-2xl backdrop-blur-md transition-all duration-500 hover:-translate-y-1 hover:border-white/30"
                  >
                    <div className="aspect-[4/5] overflow-hidden bg-black">
                      <img
                        src={artist.image}
                        alt={artist.work}
                        loading="lazy"
                        decoding="async"
                        className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.035]"
                      />
                    </div>

                    <div className="p-6">
                      <div className="flex items-start justify-between gap-3">
                        <h3 className="text-xl font-black text-white">
                          {artist.name}
                        </h3>

                        <span className="pt-1 text-xs font-semibold text-white/45">
                          {artist.year}
                        </span>
                      </div>

                      <p className="mt-2 text-sm font-bold text-[#d2a9e9]">
                        {artist.work}
                      </p>

                      <p className="mt-4 text-sm font-medium leading-6 text-white/65">
                        {artist.description}
                      </p>
                    </div>
                  </article>
                ))}
              </div>
            </div>
          </section>

          {/* =======================================================
            ART WORTH DISCOVERING
        ======================================================= */}

          <section className="px-6 py-28 md:px-12 lg:px-20">
            <div className="mx-auto max-w-7xl">
              <div className="mb-14 flex items-end justify-between gap-6">
                <div>
                  <p className="mb-4 text-sm font-bold uppercase tracking-[0.35em] text-white/70">
                    From Anuktya
                  </p>

                  <h2 className="text-5xl font-black tracking-[-0.04em] text-white sm:text-6xl">
                    Art worth discovering.
                  </h2>
                </div>

                <button
                  type="button"
                  onClick={() => navigate("/explore")}
                  className="hidden rounded-full border border-white/20 bg-black/20 px-6 py-3 text-sm font-bold text-white backdrop-blur-md transition hover:border-white/50 hover:bg-white/10 md:block"
                >
                  View all
                </button>
              </div>

              {loadingArtworks ? (
                <div className="grid grid-cols-1 gap-7 sm:grid-cols-2 lg:grid-cols-4">
                  {[1, 2, 3, 4].map((item) => (
                    <div
                      key={item}
                      className="overflow-hidden rounded-2xl border border-white/10 bg-black/30 backdrop-blur-md"
                    >
                      <div className="aspect-[4/5] animate-pulse bg-white/10" />

                      <div className="space-y-3 p-6">
                        <div className="h-5 w-2/3 animate-pulse rounded bg-white/10" />
                        <div className="h-4 w-1/2 animate-pulse rounded bg-white/10" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : artworks.length > 0 ? (
                <div className="grid grid-cols-1 gap-7 sm:grid-cols-2 lg:grid-cols-4">
                  {artworks.map((artwork) => (
                    <article
                      key={artwork.id}
                      onClick={() => navigate(`/artwork/${artwork.id}`)}
                      className="group cursor-pointer overflow-hidden rounded-2xl border border-white/15 bg-black/35 shadow-2xl backdrop-blur-md transition-all duration-500 hover:-translate-y-1 hover:border-white/30"
                    >
                      <div className="aspect-[4/5] overflow-hidden bg-black">
                        <img
                          src={getArtworkImage(artwork)}
                          alt={artwork.title}
                          className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.04]"
                        />
                      </div>

                      <div className="p-6">
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <h3 className="text-lg font-black text-white">
                              {artwork.title}
                            </h3>

                            <p className="mt-1 text-sm font-semibold text-white/55">
                              {getArtistName(artwork)}
                            </p>
                          </div>

                          <span className="whitespace-nowrap text-sm font-bold text-[#d2a9e9]">
                            {formatPrice(artwork.price)}
                          </span>
                        </div>

                        <span className="mt-5 inline-block text-xs font-bold uppercase tracking-[0.2em] text-white/45 transition group-hover:text-white">
                          View artwork →
                        </span>
                      </div>
                    </article>
                  ))}
                </div>
              ) : (
                <div className="rounded-2xl border border-white/15 bg-black/35 px-6 py-20 text-center backdrop-blur-md">
                  <p className="text-base font-semibold text-white/60">
                    New artwork is arriving soon.
                  </p>

                  <button
                    type="button"
                    onClick={() => navigate("/explore")}
                    className="mt-7 rounded-full bg-[#8e4fc0] px-7 py-3 text-sm font-bold text-white transition hover:bg-[#a867d4]"
                  >
                    Explore gallery
                  </button>
                </div>
              )}

              <button
                type="button"
                onClick={() => navigate("/explore")}
                className="mt-8 w-full rounded-full border border-white/20 bg-black/20 py-4 text-sm font-bold text-white backdrop-blur-md transition hover:border-white/50 hover:bg-white/10 md:hidden"
              >
                View all artwork
              </button>
            </div>
          </section>

          {/* =======================================================
            ABOUT
        ======================================================= */}

          <section className="px-6 py-28 md:px-12 lg:px-20">
            <div className="mx-auto max-w-7xl">
              <div className="overflow-hidden rounded-[2rem] border border-white/15 bg-[#7f3cae]/85 px-7 py-16 shadow-2xl backdrop-blur-md sm:px-12 md:px-16 md:py-24">
                <div className="grid gap-12 md:grid-cols-[1fr_0.8fr] md:items-end">
                  <div>
                    <p className="mb-5 text-sm font-bold uppercase tracking-[0.35em] text-white/70">
                      About Anuktya
                    </p>

                    <h2 className="text-5xl font-black leading-[0.95] tracking-[-0.04em] text-white sm:text-6xl md:text-7xl">
                      Where art finds
                      <br />
                      a place to belong.
                    </h2>
                  </div>

                  <div>
                    <p className="text-lg font-medium leading-8 text-white/85">
                      Anuktya brings artists and art lovers together in
                      one space. Discover original work, support artists
                      directly and find pieces that make your space feel
                      like yours.
                    </p>

                    <button
                      type="button"
                      onClick={() => navigate("/artists")}
                      className="mt-8 rounded-full bg-black px-7 py-4 text-sm font-bold text-white transition hover:bg-black/75"
                    >
                      Discover artists
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </main>

        {/* =========================================================
          FOOTER
      ========================================================= */}

        <footer className="border-t border-white/15 bg-black/45 px-6 py-12 backdrop-blur-xl md:px-12 lg:px-20">
          <div className="mx-auto flex max-w-7xl flex-col gap-7 md:flex-row md:items-center md:justify-between">
            <div>
              <p
                className="text-3xl italic tracking-[0.08em] text-white"
                style={{
                  fontFamily:
                    '"Cormorant Garamond", "Bodoni 72", Didot, Georgia, serif',
                }}
              >
                anuktya
              </p>

              <p className="mt-2 text-sm font-medium text-white/40">
                 Art for you,by you.
              </p>
            </div>

            <div className="flex flex-wrap gap-6 text-sm font-semibold text-white/55">
              <button
                type="button"
                onClick={() => navigate("/explore")}
                className="transition hover:text-white"
              >
                FAQs
              </button>

              <button
                type="button"
                onClick={() => navigate("/artists")}
                className="transition hover:text-white"
              >
                About us
              </button>

              <button
                type="button"
                onClick={() => navigate("/collections")}
                className="transition hover:text-white"
              >
                Contact Us
              </button>

              
            </div>
          </div>
        </footer>

        {/* =========================================================
          CLASSY FONT
      ========================================================= */}

        <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;0,700;1,400;1,500;1,600&display=swap');
      `}</style>
      </div>
    </div>
  );
}