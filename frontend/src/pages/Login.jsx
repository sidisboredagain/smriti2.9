import { useState } from "react";

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
    <div
      style={{
        minHeight: "100vh",
        background: "#faf5eb",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "40px 20px",
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "460px",
          background: "#fffcf6",
          border: "1px solid #e6d9bf",
          borderRadius: "24px",
          padding: "40px",
          boxShadow: "0 18px 50px rgba(48, 59, 52, 0.08)",
        }}
      >
        <p
          style={{
            color: "#bd5b34",
            fontWeight: "700",
            fontSize: "14px",
            letterSpacing: "1px",
            margin: "0 0 10px",
          }}
        >
          SMRITI AI
        </p>

        <h1
          style={{
            color: "#2a2119",
            fontSize: "38px",
            margin: "0 0 10px",
          }}
        >
          Caregiver Login
        </h1>

        <p
          style={{
            color: "#6e6153",
            lineHeight: "1.6",
            marginBottom: "30px",
          }}
        >
          Sign in to access your caregiver dashboard.
        </p>

        <form onSubmit={handleLogin}>
          <label
            style={{
              display: "block",
              color: "#9a4728",
              fontWeight: "600",
              marginBottom: "8px",
            }}
          >
            Email
          </label>

          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="Enter your email"
            required
            style={{
              width: "100%",
              padding: "14px",
              marginBottom: "20px",
              border: "1px solid #e6d9bf",
              borderRadius: "10px",
              fontSize: "16px",
              outline: "none",
            }}
          />

          <label
            style={{
              display: "block",
              color: "#9a4728",
              fontWeight: "600",
              marginBottom: "8px",
            }}
          >
            Password
          </label>

          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Enter your password"
            required
            style={{
              width: "100%",
              padding: "14px",
              marginBottom: "24px",
              border: "1px solid #e6d9bf",
              borderRadius: "10px",
              fontSize: "16px",
              outline: "none",
            }}
          />

          <button
            type="submit"
            disabled={loading}
            style={{
              width: "100%",
              padding: "15px",
              border: "none",
              borderRadius: "12px",
              background: "#bd5b34",
              color: "#ffffff",
              fontSize: "17px",
              fontWeight: "700",
              cursor: "pointer",
            }}
          >
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>

        {message && (
          <p
            style={{
              marginTop: "20px",
              color: message.startsWith("✓") ? "#2f7a4d" : "#b3261e",
              fontWeight: "700",
              textAlign: "center",
            }}
          >
            {message}
          </p>
        )}
      </div>
    </div>
  );
}

export default Login;
