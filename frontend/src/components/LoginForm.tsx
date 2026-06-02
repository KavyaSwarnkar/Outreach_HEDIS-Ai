"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { login } from "@/lib/api";

export default function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const data = await login(email, password);
      // backend sets HttpOnly cookie; redirect when login returns user info
      if (data?.email) {
        // store session token in sessionStorage as a fallback for local dev
        if (data?.session_token) {
          try { 
            sessionStorage.setItem('hedis_token', data.session_token);
          } catch (e) {
            // ignore storage error
          }
        }
        router.push("/dashboard");
      } else {
        setError("Invalid response from server");
      }
    } catch (err: any) {
      setError(err.message || "Login failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-md w-full mx-auto mt-8 bg-white p-6 rounded-lg shadow">
      <h2 className="text-2xl font-bold mb-4 text-center">Sign in to HEDIS.Ai</h2>
      {error && <div className="mb-3 text-sm text-red-600">{error}</div>}
      <label className="block mb-2 text-sm font-medium">Email</label>
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
        className="w-full mb-4 p-2 border rounded"
      />

      <label className="block mb-2 text-sm font-medium">Password</label>
      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
        className="w-full mb-4 p-2 border rounded"
      />

      <button
        type="submit"
        className="w-full bg-primary text-white py-2 rounded font-semibold hover:opacity-95"
        disabled={loading}
      >
        {loading ? "Signing in..." : "Sign In"}
      </button>
      <div className="mt-4 text-center text-sm">
        Don't have an account? <a href="/signup" className="text-primary font-semibold">Sign up</a>
      </div>
    </form>
  );
}
