"use client";
import React, { useState, useContext } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import Lookup from "@/data/Lookup";
import { Button } from "../ui/button";
import { useGoogleLogin } from "@react-oauth/google";
import axios from "axios";
import { UserDetailContext } from "@/context/UserDetailContext";
import { toast } from "sonner";
import { useMutation, useConvex } from "convex/react";
import { api } from "@/convex/_generated/api";
import uuid4 from "uuid4";
import { Input } from "../ui/input";
import {
  Mail,
  Lock,
  User,
  Eye,
  EyeOff,
  ArrowLeft,
  Loader2,
  Chrome,
} from "lucide-react";

// ─── Hash password using SHA-256 (browser-native) ───
async function hashPassword(password) {
  const encoder = new TextEncoder();
  const data = encoder.encode(password + "__VIISEVEN_SALT__");
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

// ─── Google Sign In ───
const GoogleSignInContent = ({ closeDialog, onBack }) => {
  const { setUserDetail } = useContext(UserDetailContext);
  const createUser = useMutation(api.users.createUser);
  const convex = useConvex();

  const googleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      const userInfo = await axios.get(
        "https://www.googleapis.com/oauth2/v3/userinfo",
        {
          headers: {
            Authorization: "Bearer " + tokenResponse?.access_token,
          },
        }
      );

      const user = userInfo.data;

      try {
        await createUser({
          name: user?.name,
          email: user?.email,
          picture: user?.picture,
          uid: uuid4(),
        });

        const dbUser = await convex.query(api.users.getUsers, {
          email: user?.email,
        });

        const activeUser = {
          name: dbUser?.name || user?.name,
          email: dbUser?.email || user?.email,
          picture: dbUser?.picture || user?.picture,
          token: dbUser?.token ?? 50000,
          _id: dbUser?._id,
        };

        if (typeof window !== "undefined") {
          localStorage.setItem("user", JSON.stringify(activeUser));
        }

        setUserDetail(activeUser);
        closeDialog(false);
        toast.success("Signed in successfully!");
      } catch (error) {
        console.error("Error syncing user to Convex:", error);
        toast.error("Failed to sync user account. Please try again.");
      }
    },
    onError: (errorResponse) => {
      console.error("Google login error:", errorResponse);
      toast.error(
        "Google Sign-In failed. Make sure localhost is registered in Google Cloud Console."
      );
    },
  });

  return (
    <div className="flex flex-col gap-3">
      <button
        onClick={onBack}
        className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors cursor-pointer self-start"
      >
        <ArrowLeft size={14} /> Back
      </button>
      <h2 className="font-bold text-center text-xl">Sign in with Google</h2>
      <p className="text-center text-sm text-muted-foreground">
        Use your Google account to sign in instantly
      </p>
      <Button
        className="bg-blue-500 text-white hover:bg-blue-400 mt-2 cursor-pointer"
        onClick={googleLogin}
      >
        <Chrome size={18} />
        Continue with Google
      </Button>
      <p className="text-xs text-muted-foreground text-center mt-1">
        {Lookup?.SIGNIn_AGREEMENT_TEXT}
      </p>
    </div>
  );
};

// ─── Email Sign In / Sign Up ───
const EmailAuthContent = ({ closeDialog, onBack }) => {
  const { setUserDetail } = useContext(UserDetailContext);
  const signUpWithEmail = useMutation(api.users.signUpWithEmail);
  const convex = useConvex();
  const [mode, setMode] = useState("signin"); // "signin" | "signup"
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
  });

  const handleChange = (field) => (e) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.email || !form.password) {
      toast.error("Please fill in all fields.");
      return;
    }

    if (mode === "signup" && !form.name) {
      toast.error("Please enter your name.");
      return;
    }

    if (form.password.length < 6) {
      toast.error("Password must be at least 6 characters.");
      return;
    }

    setLoading(true);
    const passwordHash = await hashPassword(form.password);

    try {
      if (mode === "signup") {
        // Sign Up
        try {
          await signUpWithEmail({
            name: form.name,
            email: form.email,
            passwordHash,
            uid: uuid4(),
          });
        } catch (err) {
          if (err.message?.includes("ALREADY_EXISTS")) {
            toast.error(
              "An account with this email already exists. Please sign in."
            );
            setMode("signin");
            setLoading(false);
            return;
          }
          throw err;
        }

        // Fetch the created user
        const dbUser = await convex.query(api.users.getUsers, {
          email: form.email,
        });

        if (!dbUser?._id) {
          toast.error("Account creation failed. Please try again.");
          setLoading(false);
          return;
        }

        const activeUser = {
          name: dbUser.name,
          email: dbUser.email,
          picture: dbUser.picture || "",
          token: dbUser.token ?? 50000,
          _id: dbUser._id,
        };

        if (typeof window !== "undefined") {
          localStorage.setItem("user", JSON.stringify(activeUser));
        }
        setUserDetail(activeUser);
        closeDialog(false);
        toast.success("Account created successfully! Welcome to VIISEVEN 🎉");
      } else {
        // Sign In
        const result = await convex.query(api.users.signInWithEmail, {
          email: form.email,
          passwordHash,
        });

        if (result?.error) {
          switch (result.error) {
            case "NOT_FOUND":
              toast.error(
                "No account found with this email. Please sign up first."
              );
              setMode("signup");
              break;
            case "GOOGLE_ACCOUNT":
              toast.error(
                "This account was created with Google. Please use Google Sign-In."
              );
              break;
            case "WRONG_PASSWORD":
              toast.error("Incorrect password. Please try again.");
              break;
            default:
              toast.error("Sign in failed. Please try again.");
          }
          setLoading(false);
          return;
        }

        const activeUser = {
          name: result.name,
          email: result.email,
          picture: result.picture || "",
          token: result.token ?? 50000,
          _id: result._id,
        };

        if (typeof window !== "undefined") {
          localStorage.setItem("user", JSON.stringify(activeUser));
        }
        setUserDetail(activeUser);
        closeDialog(false);
        toast.success("Signed in successfully!");
      }
    } catch (error) {
      console.error("Auth error:", error);
      toast.error("Something went wrong. Please try again.");
    }
    setLoading(false);
  };

  return (
    <div className="flex flex-col gap-3">
      <button
        onClick={onBack}
        className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors cursor-pointer self-start"
      >
        <ArrowLeft size={14} /> Back
      </button>
      <h2 className="font-bold text-center text-xl">
        {mode === "signin" ? "Sign in with Email" : "Create Account"}
      </h2>
      <p className="text-center text-sm text-muted-foreground">
        {mode === "signin"
          ? "Enter your email and password"
          : "Fill in your details to get started"}
      </p>

      <form onSubmit={handleSubmit} className="flex flex-col gap-3 mt-2">
        {mode === "signup" && (
          <div className="relative">
            <User
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
            />
            <Input
              placeholder="Full Name"
              value={form.name}
              onChange={handleChange("name")}
              className="pl-10"
            />
          </div>
        )}

        <div className="relative">
          <Mail
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
          />
          <Input
            type="email"
            placeholder="Email address"
            value={form.email}
            onChange={handleChange("email")}
            className="pl-10"
          />
        </div>

        <div className="relative">
          <Lock
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
          />
          <Input
            type={showPassword ? "text" : "password"}
            placeholder="Password (min 6 characters)"
            value={form.password}
            onChange={handleChange("password")}
            className="pl-10 pr-10"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
          >
            {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>

        <Button
          type="submit"
          disabled={loading}
          className="bg-blue-500 text-white hover:bg-blue-400 mt-1 cursor-pointer"
        >
          {loading ? (
            <Loader2 size={18} className="animate-spin" />
          ) : mode === "signin" ? (
            "Sign In"
          ) : (
            "Create Account"
          )}
        </Button>
      </form>

      <div className="text-center mt-1">
        <button
          onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
          className="text-sm text-blue-500 hover:text-blue-400 transition-colors cursor-pointer"
        >
          {mode === "signin"
            ? "Don't have an account? Sign up"
            : "Already have an account? Sign in"}
        </button>
      </div>

      <p className="text-xs text-muted-foreground text-center">
        {Lookup?.SIGNIn_AGREEMENT_TEXT}
      </p>
    </div>
  );
};

// ─── Main Sign In Dialog ───
const SignInDialog = ({ openDialog, closeDialog }) => {
  const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_AUTH_CLIENT_ID_KEY;
  const [view, setView] = useState("choose"); // "choose" | "google" | "email"

  const handleOpenChange = (open) => {
    if (!open) {
      setView("choose");
    }
    closeDialog(open);
  };

  return (
    <Dialog open={openDialog} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[420px] border-white/10 bg-background/95 backdrop-blur-xl">
        <DialogHeader>
          <DialogTitle></DialogTitle>

          {view === "choose" && (
            <div className="flex flex-col justify-center gap-4">
              <h2 className="font-bold text-center text-2xl">
                {Lookup.SIGNIN_HEADING}
              </h2>
              <p className="text-center text-muted-foreground text-sm">
                {Lookup.SIGNIN_SUBHEADING}
              </p>

              {/* ─── Auth Options ─── */}
              <div className="flex flex-col gap-3 mt-2">
                {/* Email Sign In */}
                <Button
                  variant="outline"
                  className="w-full h-12 text-sm cursor-pointer justify-start gap-3 px-4"
                  onClick={() => setView("email")}
                >
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500/20 to-indigo-500/20 flex items-center justify-center shrink-0">
                    <Mail size={16} className="text-blue-500" />
                  </div>
                  Continue with Email
                </Button>

                {/* Google Sign In */}
                {googleClientId && (
                  <Button
                    variant="outline"
                    className="w-full h-12 text-sm cursor-pointer justify-start gap-3 px-4"
                    onClick={() => setView("google")}
                  >
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-red-500/10 to-yellow-500/10 flex items-center justify-center shrink-0">
                      <svg width="16" height="16" viewBox="0 0 24 24">
                        <path
                          d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
                          fill="#4285F4"
                        />
                        <path
                          d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                          fill="#34A853"
                        />
                        <path
                          d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                          fill="#FBBC05"
                        />
                        <path
                          d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                          fill="#EA4335"
                        />
                      </svg>
                    </div>
                    Continue with Google
                  </Button>
                )}

                {/* Guest Mode */}
                <div className="relative my-2">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-white/10"></div>
                  </div>
                  <div className="relative flex justify-center text-xs">
                    <span className="bg-background px-2 text-muted-foreground">
                      or
                    </span>
                  </div>
                </div>

                <Button
                  variant="ghost"
                  className="w-full text-sm cursor-pointer text-muted-foreground hover:text-foreground"
                  onClick={() => {
                    // Guest mode — create a local-only session
                    const guestUser = {
                      name: "Guest User",
                      email: `guest_${Date.now()}@viiseven.local`,
                      picture: "",
                      token: 10000,
                    };
                    if (typeof window !== "undefined") {
                      localStorage.setItem("user", JSON.stringify(guestUser));
                    }
                    // We need to set userDetail from context
                    // This will trigger the auto-sync in provider.jsx
                    window.location.reload();
                  }}
                >
                  Continue as Guest (limited)
                </Button>
              </div>

              <p className="text-xs text-muted-foreground text-center mt-1">
                {Lookup?.SIGNIn_AGREEMENT_TEXT}
              </p>
            </div>
          )}

          {view === "google" && googleClientId && (
            <GoogleSignInContent
              closeDialog={closeDialog}
              onBack={() => setView("choose")}
            />
          )}

          {view === "email" && (
            <EmailAuthContent
              closeDialog={closeDialog}
              onBack={() => setView("choose")}
            />
          )}
        </DialogHeader>
      </DialogContent>
    </Dialog>
  );
};

export default SignInDialog;