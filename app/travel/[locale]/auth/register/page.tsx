"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { useLocale } from "@/app/context/LocaleContext";

export default function RegisterPage() {
  const { locale, t } = useLocale();
  const router = useRouter();
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords don't match");
      setLoading(false);
      return;
    }

    if (formData.password.length < 6) {
      setError("Password must be at least 6 characters");
      setLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
          firstName: formData.firstName,
          lastName: formData.lastName,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Registration failed");
      }

      router.push(`/travel/${locale}/auth/login?registered=true`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Registration failed");
    } finally {
      setLoading(false);
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
        <h1>{t.auth.register}</h1>
        <p className="authSubtitle">{t.auth.agentPanel}</p>

        {error && <div className="authError">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="formGrid">
            <div className="formField">
              <label>{t.auth.firstName}</label>
              <input
                type="text"
                value={formData.firstName}
                onChange={(e) =>
                  setFormData({ ...formData, firstName: e.target.value })
                }
                required
              />
            </div>
            <div className="formField">
              <label>{t.auth.lastName}</label>
              <input
                type="text"
                value={formData.lastName}
                onChange={(e) =>
                  setFormData({ ...formData, lastName: e.target.value })
                }
                required
              />
            </div>
          </div>
          <div className="formField" style={{ marginTop: "16px" }}>
            <label>{t.auth.email}</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) =>
                setFormData({ ...formData, email: e.target.value })
              }
              required
              placeholder="agent@example.com"
            />
          </div>
          <div className="formField" style={{ marginTop: "16px" }}>
            <label>{t.auth.password}</label>
            <input
              type="password"
              value={formData.password}
              onChange={(e) =>
                setFormData({ ...formData, password: e.target.value })
              }
              required
              placeholder="••••••••"
            />
          </div>
          <div className="formField" style={{ marginTop: "16px" }}>
            <label>{t.auth.confirmPassword}</label>
            <input
              type="password"
              value={formData.confirmPassword}
              onChange={(e) =>
                setFormData({ ...formData, confirmPassword: e.target.value })
              }
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
            {loading ? "..." : t.auth.register}
          </button>
        </form>

        <p className="authLink">
          {t.auth.alreadyHaveAccount}{" "}
          <Link href={`/travel/${locale}/auth/login`}>{t.auth.loginHere}</Link>
        </p>
      </div>
    </div>
  );
}
