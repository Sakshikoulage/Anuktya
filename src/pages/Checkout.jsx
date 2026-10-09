import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import Navbar from "../components/Navbar";

function Checkout() {
    const navigate = useNavigate();

    const [items, setItems] = useState([]);
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [processing, setProcessing] = useState(false);

    const [form, setForm] = useState({
        fullName: "",
        phone: "",
        address: "",
        city: "",
        state: "",
        postalCode: "",
    });

    useEffect(() => {
        const loadCheckout = async () => {
            setLoading(true);
            setError("");

            const {
                data: { user },
            } = await supabase.auth.getUser();

            if (!user) {
                navigate("/login");
                return;
            }

            setUser(user);

            const { data, error } = await supabase
                .from("cart_items")
                .select(`
                    id,
                    quantity,
                    artwork_id,
                    artworks (
                        id,
                        title,
                        price,
                        quantity,
                        availability,
                        listing_type,
                        artist_profiles (
                            display_name
                        ),
                        artwork_images (
                            storage_path,
                            is_primary
                        )
                    )
                `)
                .eq("user_id", user.id)
                .order("created_at", { ascending: false });

            if (error) {
                console.error("Checkout cart error:", error);
                setError(error.message);
                setLoading(false);
                return;
            }

            if (!data || data.length === 0) {
                navigate("/cart");
                return;
            }

            setItems(data);
            setLoading(false);
        };

        loadCheckout();
    }, [navigate]);

    const handleChange = (event) => {
        const { name, value } = event.target;

        setForm((current) => ({
            ...current,
            [name]: value,
        }));
    };

    const subtotal = items.reduce((total, item) => {
        const price = Number(item.artworks?.price) || 0;
        return total + price * item.quantity;
    }, 0);

    const totalItems = items.reduce(
        (total, item) => total + item.quantity,
        0
    );

    const loadRazorpay = () => {
        return new Promise((resolve) => {
            if (window.Razorpay) {
                resolve(true);
                return;
            }

            const script = document.createElement("script");
            script.src = "https://checkout.razorpay.com/v1/checkout.js";
            script.onload = () => resolve(true);
            script.onerror = () => resolve(false);

            document.body.appendChild(script);
        });
    };

    const handleSubmit = async (event) => {
        event.preventDefault();

        setError("");
        setProcessing(true);

        try {
            if (!user) {
                setError("Please sign in before continuing.");
                setProcessing(false);
                return;
            }

            if (!form.fullName.trim()) {
                setError("Please enter your full name.");
                setProcessing(false);
                return;
            }

            if (!form.phone.trim()) {
                setError("Please enter your phone number.");
                setProcessing(false);
                return;
            }

            if (!form.address.trim()) {
                setError("Please enter your address.");
                setProcessing(false);
                return;
            }

            if (!form.city.trim()) {
                setError("Please enter your city.");
                setProcessing(false);
                return;
            }

            if (!form.state.trim()) {
                setError("Please enter your state.");
                setProcessing(false);
                return;
            }

            if (!form.postalCode.trim()) {
                setError("Please enter your postal code.");
                setProcessing(false);
                return;
            }

            const razorpayLoaded = await loadRazorpay();

            if (!razorpayLoaded) {
                setError("Unable to load the payment system.");
                setProcessing(false);
                return;
            }

            const {
                data,
                error: functionError,
            } = await supabase.functions.invoke(
                "create-sale-order",
                {
                    body: {
                        shipping: {
                            fullName: form.fullName.trim(),
                            phone: form.phone.trim(),
                            address: form.address.trim(),
                            city: form.city.trim(),
                            state: form.state.trim(),
                            postalCode: form.postalCode.trim(),
                        },
                    },
                }
            );

            if (functionError) {
                console.error(
                    "Create sale order error:",
                    functionError
                );

                throw new Error(
                    functionError.message ||
                    "Unable to create your order."
                );
            }

            if (!data?.success) {
                throw new Error(
                    data?.error || "Unable to create your order."
                );
            }

            const options = {
                key: data.key_id,
                amount: data.amount,
                currency: data.currency,
                name: "Anuktya",
                description: "Artwork purchase",
                order_id: data.razorpay_order_id,

                prefill: {
                    name: form.fullName.trim(),
                    contact: form.phone.trim(),
                },

                notes: {
                    order_id: data.order_id,
                },

                theme: {
                    color: "#8f5bb7",
                },

                handler: async (response) => {
                    try {
                        const {
                            data: verifyData,
                            error: verifyError,
                        } = await supabase.functions.invoke(
                            "verify-sale-payment",
                            {
                                body: {
                                    order_id: data.order_id,
                                    razorpay_order_id:
                                        response.razorpay_order_id,
                                    razorpay_payment_id:
                                        response.razorpay_payment_id,
                                    razorpay_signature:
                                        response.razorpay_signature,
                                },
                            }
                        );

                        if (verifyError) {
                            console.error(
                                "Payment verification error:",
                                verifyError
                            );

                            setError(
                                "Payment was received, but verification failed. Please contact support."
                            );
                            return;
                        }

                        if (!verifyData?.success) {
                            setError(
                                verifyData?.error ||
                                "Payment verification failed."
                                 );
                            return;
                        }

                        navigate("/orders");
                    } catch (verificationError) {
                        console.error(
                            "Payment verification exception:",
                            verificationError
                        );

                        setError(
                            "Payment verification failed. Please contact support."
                        );
                    } finally {
                        setProcessing(false);
                    }
                },

                modal: {
                    ondismiss: () => {
                        setProcessing(false);
                        setError(
                            "Payment was cancelled. Your order is still pending."
                        );
                    },
                },
            };

            const razorpay = new window.Razorpay(options);

            razorpay.on("payment.failed", (response) => {
                console.error(
                    "Razorpay payment failed:",
                    response.error
                );

                setProcessing(false);

                setError(
                    response.error?.description ||
                    "Payment failed. Please try again."
                );
            });

            razorpay.open();
        } catch (submitError) {
            console.error(
                "Checkout submission error:",
                submitError
            );

            setError(
                submitError.message ||
                "Something went wrong while starting payment."
            );

            setProcessing(false);
        }
    };

    const inputClass =
        "mt-2 w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-white placeholder:text-white/30 outline-none transition focus:border-[#8f5bb7] focus:ring-1 focus:ring-[#8f5bb7]/40";

    const labelClass =
        "text-xs uppercase tracking-[0.16em] text-white/55";

    if (loading) {
        return (
            <div className="min-h-screen bg-black text-white">
                <Navbar />

                <main className="mx-auto flex min-h-[70vh] max-w-7xl items-center justify-center px-6 pt-28 sm:px-10">
                    <div className="flex items-center gap-3 text-white/60">
                        <span className="h-2 w-2 animate-pulse rounded-full bg-[#b58bd0]" />
                        Preparing checkout...
                    </div>
                </main>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-black text-white">
            <Navbar />

            <main className="relative mx-auto max-w-7xl overflow-hidden px-5 pb-20 pt-28 sm:px-8 lg:px-10">
                <div className="pointer-events-none absolute -left-32 top-24 h-80 w-80 rounded-full bg-[#8f5bb7]/10 blur-[110px]" />
                <div className="pointer-events-none absolute right-0 top-72 h-72 w-72 rounded-full bg-[#8f5bb7]/[0.08] blur-[100px]" />

                <header className="relative max-w-3xl">
                    <p className="text-xs uppercase tracking-[0.28em] text-[#b58bd0]">
                        Anuktya / Secure checkout
                    </p>

                    <h1 className="mt-4 font-serif text-5xl tracking-tight text-white sm:text-6xl">
                        Checkout
                    </h1>

                    <p className="mt-4 max-w-xl text-sm leading-7 text-white/55 sm:text-base">
                        Complete your delivery details and continue to secure payment.
                    </p>
                </header>

                {error && (
                    <div
                        role="alert"
                        className="relative mt-8 rounded-2xl border border-red-400/25 bg-red-500/[0.08] px-5 py-4 text-sm leading-6 text-red-200"
                    >
                        {error}
                    </div>
                )}

                <div className="relative mt-10 grid items-start gap-7 lg:grid-cols-[minmax(0,1fr)_380px] lg:gap-8">
                    <form
                        onSubmit={handleSubmit}
                        className="rounded-3xl border border-white/10 bg-white/[0.04] p-5 shadow-2xl shadow-black/20 backdrop-blur-xl sm:p-8 lg:p-9"
                    >
                        <div className="flex items-start gap-4 border-b border-white/10 pb-6">
                            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[#8f5bb7]/40 bg-[#8f5bb7]/15 font-serif text-lg text-[#d8b8ed]">
                                01
                            </span>

                            <div>
                                <h2 className="font-serif text-3xl text-white">
                                    Delivery details
                                </h2>

                                <p className="mt-2 text-sm leading-6 text-white/45">
                                    Where should your artwork be delivered?
                                </p>
                            </div>
                        </div>

                        <div className="mt-7 grid gap-x-5 gap-y-5 sm:grid-cols-2">
                            <div className="sm:col-span-2">
                                <label htmlFor="fullName" className={labelClass}>
                                    Full name
                                </label>

                                <input
                                    id="fullName"
                                    name="fullName"
                                    autoComplete="name"
                                    value={form.fullName}
                                    onChange={handleChange}
                                    placeholder="Your full name"
                                    className={inputClass}
                                    required
                                />
                            </div>

                            <div className="sm:col-span-2">
                                <label htmlFor="phone" className={labelClass}>
                                    Phone number
                                </label>

                                <input
                                    id="phone"
                                    name="phone"
                                    type="tel"
                                    autoComplete="tel"
                                    value={form.phone}
                                    onChange={handleChange}
                                    placeholder="Phone number"
                                    className={inputClass}
                                    required
                                />
                            </div>

                            <div className="sm:col-span-2">
                                <label htmlFor="address" className={labelClass}>
                                    Street address
                                </label>

                                <textarea
                                    id="address"
                                    name="address"
                                    autoComplete="street-address"
                                    value={form.address}
                                    onChange={handleChange}
                                    placeholder="House number, street, area"
                                    rows={4}
                                    className={`${inputClass} resize-none`}
                                    required
                                />
                            </div>

                            <div>
                                <label htmlFor="city" className={labelClass}>
                                    City
                                </label>

                                <input
                                    id="city"
                                    name="city"
                                    autoComplete="address-level2"
                                    value={form.city}
                                    onChange={handleChange}
                                    placeholder="City"
                                    className={inputClass}
                                    required
                                />
                            </div>

                            <div>
                                <label htmlFor="state" className={labelClass}>
                                    State
                                </label>

                                <input
                                    id="state"
                                    name="state"
                                    autoComplete="address-level1"
                                    value={form.state}
                                    onChange={handleChange}
                                    placeholder="State"
                                    className={inputClass}
                                    required
                                />
                            </div>

                            <div className="sm:col-span-2">
                                <label htmlFor="postalCode" className={labelClass}>
                                    Postal code
                                </label>

                                <input
                                    id="postalCode"
                                    name="postalCode"
                                    autoComplete="postal-code"
                                    value={form.postalCode}
                                    onChange={handleChange}
                                    placeholder="Postal code"
                                    className={inputClass}
                                    required
                                />
                            </div>
                        </div>

                        <div className="mt-8 border-t border-white/10 pt-7">
                            <p className={labelClass}>02 / Payment</p>

                            <div className="mt-4 flex items-start gap-4 rounded-2xl border border-[#8f5bb7]/25 bg-[#8f5bb7]/[0.08] p-5">
                                <span
                                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#8f5bb7]/20 text-[#d8b8ed]"
                                    aria-hidden="true"
                                >
                                    <svg
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        className="h-5 w-5"
                                        stroke="currentColor"
                                        strokeWidth="1.6"
                                    >
                                        <rect
                                            x="4"
                                            y="10"
                                            width="16"
                                            height="11"
                                            rx="2"
                                        />
                                        <path d="M8 10V7a4 4 0 0 1 8 0v3" />
                                    </svg>
                                </span>

                                <div>
                                    <p className="font-medium text-white">
                                        Secure payment with Razorpay
                                    </p>

                                    <p className="mt-1 text-sm leading-6 text-white/50">
                                        Your payment details are handled securely by Razorpay. You’ll be asked to complete payment after continuing.
                                    </p>
                                </div>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={processing}
                            className="mt-7 inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#8f5bb7] px-6 py-4 text-sm font-semibold tracking-wide text-white transition hover:bg-[#a66bd0] disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            {processing ? (
                                <>
                                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                                    Starting secure payment...
                                </>
                            ) : (
                                <>
                                    Continue to payment
                                    <span aria-hidden="true">→</span>
                                </>
                            )}
                        </button>

                        <p className="mt-4 text-center text-xs leading-5 text-white/35">
                            Please review your delivery information before proceeding.
                        </p>
                    </form>

                    <aside className="h-fit rounded-3xl border border-white/10 bg-white/[0.04] p-5 backdrop-blur-xl sm:p-7 lg:sticky lg:top-28">
                        <p className={labelClass}>Your order</p>

                        <h2 className="mt-2 font-serif text-3xl text-white">
                            Summary
                        </h2>

                        <div className="mt-7 space-y-5">
                            {items.map((item) => {
                                const artwork = item.artworks;

                                const primaryImage =
                                    artwork?.artwork_images?.find(
                                        (image) => image.is_primary
                                    );

                                const imageUrl = primaryImage
                                    ? supabase.storage
                                          .from("artwork-images")
                                          .getPublicUrl(
                                              primaryImage.storage_path
                                          ).data.publicUrl
                                    : null;

                                const price = Number(artwork?.price) || 0;

                                return (
                                    <div key={item.id} className="flex gap-4">
                                        <div className="h-24 w-[76px] shrink-0 overflow-hidden rounded-xl border border-white/10 bg-white/[0.05]">
                                            {imageUrl ? (
                                                <img
                                                    src={imageUrl}
                                                    alt={artwork?.title || "Artwork"}
                                                    className="h-full w-full object-cover"
                                                />
                                            ) : (
                                                <div className="flex h-full items-center justify-center text-xs text-white/30">
                                                    No image
                                                </div>
                                            )}
                                        </div>

                                        <div className="min-w-0 flex-1">
                                            <p className="font-serif text-lg leading-tight text-white">
                                                {artwork?.title}
                                            </p>

                                            <p className="mt-1 text-sm text-white/45">
                                                {artwork?.artist_profiles?.display_name ||
                                                    "Independent artist"}
                                            </p>

                                            <div className="mt-3 flex items-center justify-between gap-3 text-sm">
                                                <span className="text-white/40">
                                                    Qty {item.quantity}
                                                </span>

                                                <span className="text-white">
                                                    ₹{" "}
                                                    {(
                                                        price * item.quantity
                                                    ).toLocaleString("en-IN")}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        <div className="mt-7 space-y-4 border-t border-white/10 pt-6 text-sm">
                            <div className="flex justify-between text-white/50">
                                <span>Items</span>
                                <span className="tabular-nums text-white/80">
                                    {totalItems}
                                </span>
                            </div>

                            <div className="flex justify-between text-white/50">
                                <span>Subtotal</span>
                                <span className="tabular-nums text-white/80">
                                    ₹ {subtotal.toLocaleString("en-IN")}
                                </span>
                            </div>

                            <div className="flex items-end justify-between border-t border-white/10 pt-5">
                                <span className="text-xs uppercase tracking-[0.18em] text-white/55">
                                    Total
                                </span>

                                <span className="font-serif text-3xl text-[#d8b8ed]">
                                    ₹ {subtotal.toLocaleString("en-IN")}
                                </span>
                            </div>
                        </div>

                        <Link
                            to="/cart"
                            className="mt-6 flex items-center justify-center gap-2 rounded-full border border-white/10 px-5 py-3 text-sm text-white/65 transition hover:border-[#8f5bb7]/50 hover:text-white"
                        >
                            <span aria-hidden="true">←</span>
                            Back to cart
                        </Link>
                    </aside>
                </div>
            </main>
        </div>
    );
}

export default Checkout;
                            