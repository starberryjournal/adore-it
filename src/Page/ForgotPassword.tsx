import React, { useState } from "react";
import { account } from "../appwrite";
import { useNavigate } from "react-router-dom";
import { useToast } from "../Components/ToastContext"; // optional

const ForgotPassword: React.FC = () => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const { showToast } = useToast(); // optional
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await account.createRecovery(
        email,
        `${window.location.origin}/reset-password`
      );

      showToast("Recovery email sent! Check your inbox.", "success");

      navigate("/SignIn");
    } catch (err: any) {
      console.error("Recovery error:", err);
      showToast("Failed to send recovery email. Please try again.", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="outside-forget-password">
      <div className="ForgotPassword">
        <h2>Forgot your password?</h2>
        <p>Enter your email and we’ll send you a link to reset it.</p>
        <form onSubmit={handleSubmit} className="form-forget-password">
          <input
            type="email"
            placeholder="Email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="input-email"
          />
          <button type="submit" className="button-submit" disabled={loading}>
            {loading ? "Sending..." : "Send Reset Link"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ForgotPassword;
