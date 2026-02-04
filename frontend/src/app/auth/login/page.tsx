"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Mail, CheckCircle, Loader } from "lucide-react";

type Step = "email" | "otp" | "success";

export default function LoginPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [resendTimer, setResendTimer] = useState(0);


  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      setError("Please enter your email");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/auth/otp-login`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email }),
        }
      );

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to send OTP");
        return;
      }

      setStep("otp");
      setOtp("");
      // Start resend timer
      setResendTimer(60);
      const timer = setInterval(() => {
        setResendTimer((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otp.trim()) {
      setError("Please enter the OTP");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/auth/verify-otp`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, otp }),
        }
      );

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Invalid OTP");
        return;
      }

      localStorage.setItem("token", data.token);
      setStep("success");
      
      // Redirect after 1.5 seconds
      setTimeout(() => {
        router.push("/account");
      }, 1500);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (resendTimer > 0) return;
    setError("");
    await handleSendOtp(new Event("submit") as any);
  };


  return (
    <div className="min-h-screen flex overflow-hidden bg-black">
      {/* LEFT SIDE - IMAGE */}
      <div className="hidden lg:flex lg:w-3/5 relative overflow-hidden">
        <img
          src="https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=1200&h=1600&fit=crop"
          alt="Luxury jewellery"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-rose-900/40 via-pink-800/20 to-transparent" />

        <div className="absolute inset-0 flex flex-col justify-center items-start p-16 text-white">
          <div className="max-w-md">
            <h1 className="text-6xl font-serif font-light mb-2 tracking-wide">
              ORA
            </h1>
            <p className="text-2xl font-light mb-6 text-rose-100">
              Own. Radiate. Adorn.
            </p>
            <p className="text-lg leading-relaxed text-gray-100 font-light mb-8">
              Where elegance meets emotion. Discover timeless pieces crafted with love and precision.
            </p>
            <div className="space-y-4">
              <div className="flex items-center gap-3 text-sm">
                <div className="w-2 h-2 bg-rose-300 rounded-full" />
                <span>Premium crafted jewellery</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <div className="w-2 h-2 bg-rose-300 rounded-full" />
                <span>Certified authentic gemstones</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <div className="w-2 h-2 bg-rose-300 rounded-full" />
                <span>Lifetime jewellery care</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* RIGHT SIDE - FORM */}
      <div className="w-full lg:w-2/5 flex flex-col justify-center items-center p-8 lg:p-16 bg-gradient-to-br from-stone-950 via-stone-900 to-black">
        <div className="w-full max-w-sm">
          {/* MOBILE BRAND TEXT */}
          <div className="lg:hidden mb-8 text-center text-white">
            <h1 className="text-4xl font-serif font-light mb-2">ORA</h1>
            <p className="text-rose-300 text-sm">Own. Radiate. Adorn.</p>
          </div>

          {/* FORM CARD */}
          <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-3xl p-10 shadow-2xl">
            <div className="mb-8">
              <h2 className="text-3xl font-serif font-light text-white mb-2">
                {step === "success" ? "Welcome!" : "Login with OTP"}
              </h2>
              <p className="text-gray-300 text-sm">
                {step === "email" && "Enter your email to receive a login code"}
                {step === "otp" && `A login code has been sent to ${email}`}
                {step === "success" && "You are being logged in..."}
              </p>
            </div>

            {error && (
              <div className="mb-6 p-4 bg-red-500/20 border border-red-500/50 rounded-xl backdrop-blur-sm">
                <p className="text-red-200 text-sm font-medium">{error}</p>
              </div>
            )}

            {/* STEP 1: EMAIL */}
            {step === "email" && (
              <form onSubmit={handleSendOtp} className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-gray-200 mb-2">
                    Email Address
                  </label>
                  <div className="relative">
                    <input
                      type="email"
                      placeholder="your@email.com"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full bg-white/10 border border-white/20 rounded-xl px-5 py-3.5 pl-12 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-rose-400 focus:border-transparent transition-all duration-300 backdrop-blur-sm"
                    />
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-rose-400" />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-rose-500 to-pink-600 text-white font-semibold py-4 rounded-xl hover:from-rose-600 hover:to-pink-700 focus:outline-none focus:ring-2 focus:ring-rose-400 focus:ring-offset-2 focus:ring-offset-stone-950 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-xl hover:shadow-rose-500/50 mt-6 hover:scale-105 transform"
                >
                  {loading ? (
                    <span className="flex items-center justify-center">
                      <Loader className="animate-spin mr-2 h-5 w-5" />
                      Sending...
                    </span>
                  ) : (
                    "Send Login Code"
                  )}
                </button>
              </form>
            )}

            {/* STEP 2: OTP */}
            {step === "otp" && (
              <form onSubmit={handleVerifyOtp} className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-gray-200 mb-2">
                    Enter 6-Digit Code
                  </label>
                  <input
                    type="text"
                    placeholder="000000"
                    maxLength={6}
                    required
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                    className="w-full bg-white/10 border border-white/20 rounded-xl px-5 py-4 text-center text-2xl font-bold tracking-widest text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-rose-400 focus:border-transparent transition-all duration-300 backdrop-blur-sm"
                  />
                  <p className="text-xs text-gray-400 mt-2">
                    Check your email and your spam folder
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={loading || otp.length < 6}
                  className="w-full bg-gradient-to-r from-rose-500 to-pink-600 text-white font-semibold py-4 rounded-xl hover:from-rose-600 hover:to-pink-700 focus:outline-none focus:ring-2 focus:ring-rose-400 focus:ring-offset-2 focus:ring-offset-stone-950 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-xl hover:shadow-rose-500/50 mt-6 hover:scale-105 transform"
                >
                  {loading ? (
                    <span className="flex items-center justify-center">
                      <Loader className="animate-spin mr-2 h-5 w-5" />
                      Verifying...
                    </span>
                  ) : (
                    "Verify Code"
                  )}
                </button>

                <button
                  type="button"
                  onClick={handleResendOtp}
                  disabled={resendTimer > 0}
                  className="w-full text-center text-sm text-rose-300 hover:text-rose-200 disabled:text-gray-500 disabled:cursor-not-allowed transition-colors py-2"
                >
                  {resendTimer > 0 ? `Resend code in ${resendTimer}s` : "Didn't receive the code? Resend"}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setStep("email");
                    setOtp("");
                    setError("");
                  }}
                  className="w-full text-center text-sm text-gray-400 hover:text-gray-300 transition-colors py-2"
                >
                  Use a different email
                </button>
              </form>
            )}

            {/* STEP 3: SUCCESS */}
            {step === "success" && (
              <div className="flex flex-col items-center justify-center py-8">
                <div className="mb-6 p-4 bg-green-500/20 border border-green-500/50 rounded-full">
                  <CheckCircle className="w-12 h-12 text-green-400" />
                </div>
                <p className="text-gray-300 text-center">
                  Login successful! Redirecting you now...
                </p>
              </div>
            )}

            {/* FOOTER */}
            {step !== "success" && (
              <div className="mt-8 pt-6 border-t border-white/10">
                <p className="text-center text-sm text-gray-300">
                  New to ORA?{" "}
                  <Link
                    href="/auth/signup"
                    className="text-rose-300 hover:text-rose-200 font-semibold transition-colors"
                  >
                    Create account
                  </Link>
                </p>
              </div>
            )}
          </div>

          {/* FOOTER */}
          <p className="text-center text-xs text-gray-500 mt-8">
            © 2026 ORA Jewellery. Crafted with elegance.
          </p>
        </div>
      </div>
    </div>
  );
}
