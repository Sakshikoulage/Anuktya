import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";

export default function Signup() {
  const navigate = useNavigate();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSignup = async (e) => {
    e.preventDefault();

    setMessage("");
    setLoading(true);

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
        },
      },
    });

    if (error) {
      setMessage(error.message);
      setLoading(false);
      return;
    }

    setMessage(
      "Account created successfully. Please check your email to verify your account."
    );

    setLoading(false);
  };

  const continueAsGuest = () => {
    navigate("/");
  };

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#151416]">

      {/* =====================================================
          FULL SCREEN BLURRED ARTWORK
      ====================================================== */}
      <div className="absolute inset-0 overflow-hidden">

  <img
    src="/art-login.jpg"
    alt=""
    className="
      absolute
      left-1/2
      top-1/2
      h-full
      w-[150%]
      max-w-none
      -translate-x-1/2
      -translate-y-1/2
      object-cover
      blur-[15px]
    "
  />

  {/* Soft darkening */}
  <div className="absolute inset-0 bg-[#151416]/30" />

  {/* Very subtle lavender tint */}
  <div className="absolute inset-0 bg-[#8d7ca8]/5" />

</div>


      {/* =====================================================
          CENTER CARD
      ====================================================== */}
      <div className="relative z-10 flex min-h-screen items-center justify-center px-5 py-6">

        <div
          className="
            flex
            w-full
            max-w-[900px]
            overflow-hidden
            rounded-[24px]
            border
            border-white/10
            bg-[#111112]
            shadow-[0_35px_100px_rgba(0,0,0,0.75)]
          "
        >

          {/* =================================================
              SHARP ARTWORK
          ================================================== */}
            <section className="relative hidden w-[46%] lg:block">

            <img
              src="/art-login.jpg"
              alt="Artwork"
              className="absolute inset-0 h-full w-full object-cover object-center"
            />

          </section>


          {/* =================================================
              SIGNUP PANEL
          ================================================== */}
          <section className="relative w-full bg-[#f1efeb] lg:w-[54%]">

            <div className="flex min-h-[570px] items-center justify-center px-8 py-8 sm:px-10">

              <div className="w-full max-w-[350px]">

                {/* Back */}
                <button
                  type="button"
                  onClick={() => navigate(-1)}
                  className="
                    mb-7
                    flex
                    items-center
                    gap-2
                    text-xs
                    text-[#68646a]
                    transition
                    hover:text-[#29272a]
                  "
                >
                  <span className="text-sm">
                    ←
                  </span>

                  Back
                </button>


                {/* =================================================
                    HEADING
                ================================================== */}
                <div className="mb-6">

                  <p
                    className="
                      mb-3
                      text-[9px]
                      font-medium
                      uppercase
                      tracking-[0.32em]
                      text-[#9180a9]
                    "
                  >
                    Create your account
                  </p>

                  <h1
                    className="
                      font-serif
                      text-[37px]
                      leading-[1.02]
                      tracking-tight
                      text-[#29272a]
                    "
                  >
                    Begin your
                    <br />
                    artistic journey.
                  </h1>

                  <p
                    className="
                      mt-4
                      max-w-[315px]
                      text-[12px]
                      leading-5
                      text-[#817d82]
                    "
                  >
                    Create an account to discover art, follow artists and
                    build your personal collection.
                  </p>

                </div>


                {/* =================================================
                    SIGNUP FORM
                ================================================== */}
                <form
                  onSubmit={handleSignup}
                  className="space-y-3"
                >

                  {/* Full Name */}
                  <div>

                    <label
                      className="
                        mb-1.5
                        block
                        text-[9px]
                        font-medium
                        uppercase
                        tracking-[0.22em]
                        text-[#777278]
                      "
                    >
                      Full name
                    </label>

                    <div
                      className="
                        flex
                        h-[46px]
                        items-center
                        rounded-[12px]
                        border
                        border-[#d9d5d1]
                        bg-[#e9e6e1]
                        px-3.5
                        transition
                        focus-within:border-[#9583aa]
                        focus-within:bg-white
                      "
                    >

                      <input
                        type="text"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder="Enter your name"
                        required
                        className="
                          w-full
                          bg-transparent
                          text-xs
                          text-[#29272a]
                          outline-none
                          placeholder:text-[#aaa6aa]
                        "
                      />

                    </div>

                  </div>


                  {/* Email */}
                  <div>

                    <label
                      className="
                        mb-1.5
                        block
                        text-[9px]
                        font-medium
                        uppercase
                        tracking-[0.22em]
                        text-[#777278]
                      "
                    >
                      Email
                    </label>

                    <div
                      className="
                        flex
                        h-[46px]
                        items-center
                        rounded-[12px]
                        border
                        border-[#d9d5d1]
                        bg-[#e9e6e1]
                        px-3.5
                        transition
                        focus-within:border-[#9583aa]
                        focus-within:bg-white
                      "
                    >

                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="Enter your email"
                        required
                        className="
                          w-full
                          bg-transparent
                          text-xs
                          text-[#29272a]
                          outline-none
                          placeholder:text-[#aaa6aa]
                        "
                      />

                    </div>

                  </div>


                  {/* Password */}
                  <div>

                    <label
                      className="
                        mb-1.5
                        block
                        text-[9px]
                        font-medium
                        uppercase
                        tracking-[0.22em]
                        text-[#777278]
                      "
                    >
                      Password
                    </label>

                    <div
                      className="
                        flex
                        h-[46px]
                        items-center
                        rounded-[12px]
                        border
                        border-[#d9d5d1]
                        bg-[#e9e6e1]
                        px-3.5
                        transition
                        focus-within:border-[#9583aa]
                        focus-within:bg-white
                      "
                    >

                      <input
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Create a password"
                        required
                        minLength={6}
                        className="
                          w-full
                          bg-transparent
                          text-xs
                          text-[#29272a]
                          outline-none
                          placeholder:text-[#aaa6aa]
                        "
                      />

                      <button
                        type="button"
                        onClick={() =>
                          setShowPassword(!showPassword)
                        }
                        className="
                          ml-2
                          text-[8px]
                          font-medium
                          tracking-wider
                          text-[#918c92]
                          transition
                          hover:text-[#514c53]
                        "
                      >
                        {showPassword ? "HIDE" : "SHOW"}
                      </button>

                    </div>

                  </div>


                  {/* Message */}
                  {message && (
                    <div
                      className="
                        rounded-xl
                        border
                        border-[#d4c9dc]
                        bg-[#eee9f1]
                        px-3
                        py-2
                        text-[11px]
                        leading-4
                        text-[#75627f]
                      "
                    >
                      {message}
                    </div>
                  )}


                  {/* =================================================
                      CREATE ACCOUNT
                  ================================================== */}
                  <button
                    type="submit"
                    disabled={loading}
                    className="
                      group
                      mt-1
                      flex
                      h-[49px]
                      w-full
                      items-center
                      justify-center
                      rounded-[12px]
                      bg-[#29272a]
                      text-xs
                      font-medium
                      text-white
                      transition
                      hover:bg-[#1d1b1e]
                      disabled:cursor-not-allowed
                      disabled:opacity-60
                    "
                  >
                    {loading ? "Creating account..." : "Create account"}

                    {!loading && (
                      <span className="ml-2 transition-transform group-hover:translate-x-1">
                        →
                      </span>
                    )}
                  </button>

                </form>


                {/* =================================================
                    DIVIDER
                ================================================== */}
                <div className="my-4 flex items-center gap-3">

                  <div className="h-px flex-1 bg-[#d9d5d1]" />

                  <span
                    className="
                      text-[8px]
                      uppercase
                      tracking-[0.3em]
                      text-[#aaa5aa]
                    "
                  >
                    Or
                  </span>

                  <div className="h-px flex-1 bg-[#d9d5d1]" />

                </div>


                {/* Guest */}
                <button
                  type="button"
                  onClick={continueAsGuest}
                  className="
                    h-[44px]
                    w-full
                    rounded-[12px]
                    border
                    border-[#d1ccc9]
                    bg-transparent
                    text-[11px]
                    text-[#6f6a70]
                    transition
                    hover:border-[#aaa1af]
                    hover:bg-[#e9e5e1]
                    hover:text-[#302d31]
                  "
                >
                  Continue without logging in
                </button>


                {/* Login */}
                <p
                  className="
                    mt-4
                    text-center
                    text-[11px]
                    text-[#999399]
                  "
                >
                  Already have an account?{" "}

                  <Link
                    to="/login"
                    className="
                      font-medium
                      text-[#89759f]
                      transition
                      hover:text-[#6f5c84]
                    "
                  >
                    Sign in
                  </Link>
                </p>

              </div>

            </div>

          </section>

        </div>

      </div>

    </main>
  );
}