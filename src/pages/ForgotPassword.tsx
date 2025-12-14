import React, { useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import { useSignIn } from "@clerk/clerk-react";
import { ArrowLeft, Loader2 } from "lucide-react";

const ForgotPassword = () => {
  const { isLoaded, signIn } = useSignIn();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [step, setStep] = useState<"email" | "reset">("email");

  if (!isLoaded) return <div>Loading...</div>;

  // Step 1: Request password reset
  const handleRequestReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await signIn?.create({
        strategy: "reset_password_email_code",
        identifier: email,
      });
      setSuccess(true);
      setStep("reset");
    } catch (err: any) {
      console.error("Reset request error:", err);
      setError(err.errors?.[0]?.message || "Failed to send reset email");
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Reset password with code
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (newPassword.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }

    setLoading(true);

    try {
      await signIn?.attemptFirstFactor({
        strategy: "reset_password_email_code",
        code,
        password: newPassword,
      });
      setSuccess(true);
      setTimeout(() => navigate("/login"), 2000);
    } catch (err: any) {
      console.error("Reset password error:", err);
      setError(err.errors?.[0]?.message || "Failed to reset password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.8 }}
      className="font-sans bg-gradient-to-r from-white to-teal-50 min-h-screen flex flex-col"
    >
      <Navbar />

      <div className="flex flex-1 items-center justify-center p-8">
        <div className="w-full max-w-md bg-white shadow-lg rounded-xl p-8">
          {/* Back Button */}
          <button
            onClick={() => navigate("/login")}
            className="flex items-center gap-2 text-teal-600 hover:text-teal-700 mb-6 transition"
          >
            <ArrowLeft size={18} />
            <span className="text-sm font-medium">Back to Login</span>
          </button>

          <h1 className="text-2xl font-bold mb-2 text-gray-600">Reset Password</h1>
          <p className="text-sm text-gray-500 mb-6">
            {step === "email"
              ? "Enter your email to receive a reset code"
              : "Enter the code and your new password"}
          </p>

          {success && step === "reset" && (
            <div className="mb-4 p-3 bg-green-100 text-green-700 rounded-md text-sm">
              ✓ Password reset successfully! Redirecting to login...
            </div>
          )}

          {success && step === "email" && (
            <div className="mb-4 p-3 bg-blue-100 text-blue-700 rounded-md text-sm">
              ✓ Reset code sent to your email. Check your inbox!
            </div>
          )}

          {error && <p className="text-red-500 text-sm mb-4">{error}</p>}

          {step === "email" ? (
            <form onSubmit={handleRequestReset} className="space-y-4">
              <div>
                <input
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-teal-400"
                  required
                />
              </div>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.95 }}
                type="submit"
                disabled={loading}
                className="w-full py-2 bg-teal-500 text-white rounded-md font-medium hover:bg-teal-600 transition disabled:opacity-70"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Sending...
                  </span>
                ) : (
                  "Send Reset Code"
                )}
              </motion.button>
            </form>
          ) : (
            <form onSubmit={handleResetPassword} className="space-y-4">
              <div>
                <input
                  type="text"
                  placeholder="Enter reset code"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-teal-400"
                  required
                />
              </div>

              <div>
                <input
                  type="password"
                  placeholder="New password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-teal-400"
                  required
                />
              </div>

              <div>
                <input
                  type="password"
                  placeholder="Confirm password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-teal-400"
                  required
                />
              </div>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.95 }}
                type="submit"
                disabled={loading}
                className="w-full py-2 bg-teal-500 text-white rounded-md font-medium hover:bg-teal-600 transition disabled:opacity-70"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Resetting...
                  </span>
                ) : (
                  "Reset Password"
                )}
              </motion.button>
            </form>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default ForgotPassword;

