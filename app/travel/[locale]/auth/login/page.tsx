"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { useLocale } from "@/app/context/LocaleContext";

export default function LoginPage() {
  const { locale, t } = useLocale();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    if (result?.error) {
      setError("Invalid email or password");
      setLoading(false);
    } else {
      router.push(`/travel/${locale}/dashboard`);
    }
  };

  return (
    <div className="authPage">
      <div className="authCard animate-fadeIn">
        <div style={{ textAlign: "center", marginBottom: "20px" }}>
          <Image
            src="/primeLogo.png"
            alt="PRIME Insurance"
            width={140}
            height={40}
            style={{ objectFit: "contain", margin: "0 auto" }}
            priority
          />
        </div>
        <h1>{t.auth.login}</h1>
        <p className="authSubtitle">{t.auth.agentPanel}</p>

        {error && <div className="authError">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="formField">
            <label>{t.auth.email}</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="agent@example.com"
            />
          </div>
          <div className="formField" style={{ marginTop: "16px" }}>
            <label>{t.auth.password}</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="••••••••"
            />
          </div>
          <button
            type="submit"
            className="btnPrimary"
            style={{
              width: "100%",
              justifyContent: "center",
              marginTop: "24px",
            }}
            disabled={loading}
          >
            {loading ? "..." : t.auth.login}
          </button>
        </form>

        <p className="authLink">
          {t.auth.dontHaveAccount}{" "}
          <Link href={`/travel/${locale}/auth/register`}>
            {t.auth.registerHere}
          </Link>
        </p>
      </div>
    </div>
  );
}
