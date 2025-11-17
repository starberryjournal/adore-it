import React, { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { account, databases, Query } from "../appwrite";
import { OAuthProvider } from "appwrite";
import { useToast } from "../Components/ToastContext";
import EyeOpen from "../assets/EyeShowSvgrepoCom.svg";
import EyeClosed from "../assets/EyeHideSvgrepoCom.svg";
import { uploadGoogleAvatar } from "./useGoogleProfileImage";
import enveLope from "/src/assets/SVG/envelope-svgrepo-com (1).svg";
import lockUp from "/src/assets/SVG/lock-svgrepo-com.svg";
import contactCard from "/src/assets/SVG/contact-card-svgrepo-com.svg";
import googleIcon from "/src/assets/SVG/social-google-plus-svgrepo-com.svg";

const Register: React.FC = () => {
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [confirmPassword, setConfirmPassword] = useState<string>("");
  const [name, setName] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [isCheckingUsername, setIsCheckingUsername] = useState(false);
  const typingTimeout = useRef<NodeJS.Timeout | null>(null);

  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword] = useState(false);
  useToast(); // ✅ this makes showToast usable
  const databaseId = import.meta.env.VITE_DATABASE_ID;
  const collectionId = import.meta.env.VITE_USER_PREF_COLLECTION_ID;

  const defaultProfilePictureId = "67bcb7f900374bd0324e";
  const defaultBackgroundImageId = "67bcb808000adb02953e";

  const isFormValid =
    email &&
    password &&
    confirmPassword &&
    name &&
    password === confirmPassword;

  useEffect(() => {
    if (!name) return;

    if (typingTimeout.current) {
      clearTimeout(typingTimeout.current);
    }

    typingTimeout.current = setTimeout(() => {
      handleUsernameCheck();
    }, 500);

    return () => clearTimeout(typingTimeout.current!);
  }, [name]);

  const handleUsernameCheck = async () => {
    try {
      setIsCheckingUsername(true);
      const exists = await isUsernameTaken(name);
      setError(exists ? "Oops, this username has already been taken." : "");
    } catch (err) {
      console.error("Error checking username:", err);
      setError("Failed to check username.");
    } finally {
      setIsCheckingUsername(false);
    }
  };

  const isUsernameTaken = async (name: string) => {
    if (!databaseId || !collectionId) {
      throw new Error("Missing environment configuration.");
    }

    const response = await databases.listDocuments(databaseId, collectionId, [
      Query.equal("userName", name),
    ]);
    return response.total > 0;
  };

  const getPasswordStrength = (password: string) => {
    if (password.length >= 8 && /[A-Z]/.test(password) && /\d/.test(password)) {
      return "Strong";
    } else if (password.length >= 6) {
      return "Moderate";
    }
    return "Weak";
  };

  const handleOAuthLogin = (provider: OAuthProvider) => {
    account.createOAuth2Session(
      provider,
      "https://adore-it.vercel.app", // success redirect
      "https://adore-it.vercel.app/Register" // failure redirect
    );
  };
  useEffect(() => {
    const run = async () => {
      try {
        const user = await account.get();

        // Check if user already has a profile picture
        if (!user.prefs?.profilePictureId) {
          const fileId = await uploadGoogleAvatar({
            bucketId: "67bcb7d50038b0f4f5ba",
            databaseId: databaseId,
            collectionId: collectionId,
            defaultBackgroundImageId: defaultBackgroundImageId,
          });

          // If upload fails, assign default avatar manually
          const finalAvatarId = fileId || "67bcb7f900374bd0324e";

          await account.updatePrefs({
            userName: user.name,
            profilePictureId: finalAvatarId,
            backgroundImageId: defaultBackgroundImageId,
            bioId: "",
          });

          console.log("Avatar assigned:", finalAvatarId);
        }

        navigate("/home", { replace: true });
        window.location.reload();
      } catch (err) {
        console.error("Error during avatar setup:", err);
      }
    };

    run();
  }, []);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!databaseId || !collectionId) {
      setError("Missing environment configuration.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    try {
      const usernameExists = await isUsernameTaken(name);
      if (usernameExists) {
        setError("Oops, this username has already been taken.");
        return;
      }

      const user = await account.create("unique()", email, password, name);
      await account.createEmailPasswordSession(email, password);

      const prefsDocId = "unique()";
      await databases.createDocument(databaseId, collectionId, prefsDocId, {
        userId: user.$id,
        followId: user.$id,
        userName: user.name,
        bioId: "",
        profilePictureId: defaultProfilePictureId,
        backgroundImageId: defaultBackgroundImageId,
      });

      await account.updatePrefs({
        prefsDocId,
        bioId: "",
        profilePictureId: defaultProfilePictureId,
        backgroundImageId: defaultBackgroundImageId,
      });

      alert("User registered and signed in successfully!");
      navigate("/home", { replace: true });
      window.location.reload(); // Refresh the page
    } catch (err: any) {
      console.error("Error creating user or session:", err);
      setError("Registration failed: " + err.message);
    }
  };

  useEffect(() => {
    if (name || password || confirmPassword || email) {
      setError("");
    }
  }, [name, password, confirmPassword, email]);

  return (
    <div className="outside-register">
      <div className="Register">
        <div className="inside-register">
          <div className="box-inside-register">
            <div className="header-welcome">
              <h2>Welcome to j'ADORE</h2>
              <div className="link-under">
                Already have an account? <Link to="/SignIn">Sign In!</Link>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="formulation">
              <div className="centre-side2">
                <img src={contactCard} alt="username" className="mini-svg" />
                <input
                  type="text"
                  value={name}
                  placeholder="Username"
                  className="button-register"
                  onChange={(e) => setName(e.target.value)}
                  required
                  autoComplete="off"
                />
              </div>

              <div className="centre-side2">
                <img src={enveLope} alt="email" className="mini-svg" />
                <input
                  type="email"
                  value={email}
                  placeholder="Email"
                  className="button-register"
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="off"
                />
              </div>

              <div className="middle-center-side">
                <div className="centre-side2">
                  <img src={lockUp} alt="password" className="mini-svg" />
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    placeholder="Password"
                    className="button-register"
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="toggle-password"
                  >
                    <img
                      src={showPassword ? EyeClosed : EyeOpen}
                      alt={showPassword ? "Hide password" : "Show password"}
                      className="eye-icon"
                    />
                  </button>
                </div>
              </div>

              <div className="middle-center-side">
                <div className="centre-side2">
                  <img src={lockUp} alt="password" className="mini-svg" />
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    value={confirmPassword}
                    placeholder="Confirm Password"
                    className="button-register"
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="toggle-password"
                  >
                    <img
                      src={showPassword ? EyeClosed : EyeOpen}
                      alt={showPassword ? "Hide password" : "Show password"}
                      className="eye-icon"
                    />
                  </button>
                </div>
              </div>

              {error && <span className="error-message">{error}</span>}

              <button
                type="submit"
                className={`button-submit ${isFormValid ? "active" : ""}`}
                disabled={!isFormValid || isCheckingUsername}
              >
                {isCheckingUsername ? "Checking..." : "Register"}
              </button>
            </form>
            {password && (
              <div
                className={`password-strength ${getPasswordStrength(
                  password
                ).toLowerCase()}`}
              >
                Strength: {getPasswordStrength(password)}
              </div>
            )}

            <div className="banner-divider">
              <p>OR</p>
            </div>

            <div className="social-media-logo">
              <div className="inside-social-media">
                <div
                  className="google"
                  onClick={() => handleOAuthLogin("google" as OAuthProvider)}
                >
                  <img src={googleIcon} alt="Google" className="social-svg" />
                  Sign up with Google
                </div>
              </div>
            </div>

            <div className="warning">
              <p>
                By creating your account you confirm that you've read <br />
                and accepted the{" "}
                <a href="#" style={{ color: "#ff4477" }}>
                  Terms of Service
                </a>{" "}
                and{" "}
                <a href="#" style={{ color: "#ff4477" }}>
                  Privacy Policy
                </a>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
