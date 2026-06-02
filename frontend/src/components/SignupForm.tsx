"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signup } from "@/lib/api";

export default function SignupForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await signup(email, name, password);
      router.push('/login');
    } catch (err: any) {
      setError(err.message || 'Signup failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-md w-full mx-auto mt-8 bg-white p-6 rounded-lg shadow">
      <h2 className="text-2xl font-bold mb-4 text-center">Create an account</h2>
      {error && <div className="mb-3 text-sm text-red-600">{error}</div>}
      <label className="block mb-2 text-sm font-medium">Name</label>
      <input
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        required
        className="w-full mb-4 p-2 border rounded"
      />
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
        {loading ? "Creating account..." : "Sign Up"}
      </button>
    </form>
  );
}
