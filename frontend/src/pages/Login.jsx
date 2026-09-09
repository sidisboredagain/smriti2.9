import { useState } from "react";
import { HeartHandshake } from "lucide-react";

import { Alert } from "../components/ui/alert";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { Input, Label } from "../components/ui/input";
import GradientBackdrop from "../components/GradientBackdrop";

const API_URL = "http://127.0.0.1:8000";

function Login({ onLoginSuccess }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const handleLogin = async (event) => {
    event.preventDefault();

    setLoading(true);
    setMessage("");

    try {
      const formData = new URLSearchParams();

      formData.append("username", email);
      formData.append("password", password);

      const response = await fetch(`${API_URL}/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Login failed.");
      }

      localStorage.setItem("smriti_token", data.access_token);

      setMessage("✓ Login successful!");

      if (onLoginSuccess) {
        onLoginSuccess();
      }
    } catch (error) {
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen w-full flex-col bg-background font-body lg:flex-row">
      <div className="relative flex min-h-[320px] w-full items-center overflow-hidden px-8 py-16 sm:px-12 lg:min-h-screen lg:w-1/2 lg:px-16">
        <GradientBackdrop className="opacity-90" />
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-gradient-to-b from-black/10 via-transparent to-black/40"
        />

        <div className="relative z-10 mx-auto w-full max-w-md animate-fade-up">
          <div className="mb-8 flex h-[64px] w-[64px] items-center justify-center rounded-2xl bg-logo font-heading text-2xl font-bold text-accent-foreground shadow-brand-md">
            स्मृति
          </div>

          <Badge className="mb-6 border-white/25 bg-white/15 text-white backdrop-blur-sm">
            <HeartHandshake className="h-3.5 w-3.5" aria-hidden="true" />
            Caregiver Portal
          </Badge>

          <h1 className="mb-4 text-[clamp(2.25rem,4.5vw,3.25rem)] leading-[1.1] text-white">
            Smriti AI
          </h1>

          <p className="max-w-sm text-lg leading-relaxed text-white/85">
            Sign in to keep every memory, routine, and moment of care close
            at hand for the people you look after.
          </p>
        </div>
      </div>

      <div className="flex w-full flex-1 items-center justify-center px-6 py-12 sm:px-10 lg:w-1/2 lg:px-16">
        <Card className="w-full max-w-md animate-fade-up p-8 sm:p-10">
          <p className="mb-2 text-sm font-bold uppercase tracking-wider text-primary">
            Welcome back
          </p>

          <h2 className="mb-2 text-3xl text-foreground">Caregiver Login</h2>

          <p className="mb-8 leading-relaxed text-muted-foreground">
            Sign in to access your caregiver dashboard.
          </p>

          <form onSubmit={handleLogin}>
            <Label htmlFor="login-email">Email</Label>
            <Input
              id="login-email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="Enter your email"
              required
              className="mb-5"
            />

            <Label htmlFor="login-password">Password</Label>
            <Input
              id="login-password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Enter your password"
              required
              className="mb-6"
            />

            <Button
              type="submit"
              variant="primary"
              size="lg"
              disabled={loading}
              className="w-full"
            >
              {loading ? "Signing in..." : "Sign In"}
            </Button>
          </form>

          {message && (
            <Alert
              variant={message.startsWith("✓") ? "success" : "destructive"}
              className="mt-6 justify-center text-center"
            >
              {message}
            </Alert>
          )}
        </Card>
      </div>
    </div>
  );
}

export default Login;
