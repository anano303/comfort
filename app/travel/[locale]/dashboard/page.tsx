"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useLocale } from "@/app/context/LocaleContext";

interface ApplicationItem {
  id: string;
  firstName: string;
  lastName: string;
  product: string;
  plan: string;
  premium: number;
  status: "pending" | "approved" | "rejected";
  createdAt: string;
  agentName: string;
  agentEmail: string;
  passportNumber: string;
  idNumber: string;
  nationality: string;
  email: string;
  phone: string;
  startDate: string;
  endDate: string;
  coverageLimit: number;
  visitPurpose: string;
}

export default function DashboardPage() {
  const { locale, t } = useLocale();
  const { data: session, status } = useSession();
  const router = useRouter();
  const [applications, setApplications] = useState<ApplicationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedApp, setSelectedApp] = useState<ApplicationItem | null>(null);

  const user = session?.user as
    | { role?: string; id?: string; name?: string }
    | undefined;
  const isAdmin = user?.role === "admin";

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push(`/travel/${locale}/auth/login`);
    }
  }, [status, router, locale]);

  useEffect(() => {
    if (status === "authenticated") {
      fetchApplications();
    }
  }, [status]);

  const fetchApplications = async () => {
    try {
      const res = await fetch("/api/travel-applications");
      if (res.ok) {
        const data = await res.json();
        setApplications(data);
      }
    } catch {
      console.error("Failed to fetch applications");
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (
    id: string,
    newStatus: "approved" | "rejected",
  ) => {
    try {
      const res = await fetch(`/api/travel-applications/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        fetchApplications();
      }
    } catch {
      console.error("Failed to update status");
    }
  };

  if (status === "loading" || loading) {
    return (
      <div className="dashboardPage">
        <p>Loading...</p>
      </div>
    );
  }

  const pendingCount = applications.filter(
    (a) => a.status === "pending",
  ).length;
  const approvedCount = applications.filter(
    (a) => a.status === "approved",
  ).length;

  return (
    <div className="dashboardPage animate-fadeIn">
      {/* Header */}
      <div className="dashboardHeader">
        <div>
          <h1>{isAdmin ? t.dashboard.adminTitle : t.dashboard.title}</h1>
          <p style={{ color: "var(--text-muted)", fontSize: "14px" }}>
            {user?.name} ({user?.role})
          </p>
        </div>
        <Link href={`/travel/${locale}`} className="btnPrimary">
          + {t.dashboard.newApplication}
        </Link>
      </div>

      {/* Stats */}
      <div className="statsRow">
        <div className="statCard">
          <div className="statNumber">{applications.length}</div>
          <div className="statLabel">{t.dashboard.total}</div>
        </div>
        <div className="statCard" style={{ borderLeftColor: "#ffc107" }}>
          <div className="statNumber">{pendingCount}</div>
          <div className="statLabel">{t.dashboard.pending}</div>
        </div>
        <div className="statCard" style={{ borderLeftColor: "#28a745" }}>
          <div className="statNumber">{approvedCount}</div>
          <div className="statLabel">{t.dashboard.approved}</div>
        </div>
      </div>

      {/* Table */}
      {applications.length === 0 ? (
        <div className="emptyState">
          <svg
            width="60"
            height="60"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1"
          >
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
            <polyline points="14 2 14 8 20 8"></polyline>
            <line x1="16" y1="13" x2="8" y2="13"></line>
            <line x1="16" y1="17" x2="8" y2="17"></line>
          </svg>
          <p>{t.dashboard.noApplications}</p>
        </div>
      ) : (
        <div className="tableContainer">
          <table className="dataTable">
            <thead>
              <tr>
                <th>{t.dashboard.date}</th>
                <th>{t.dashboard.client}</th>
                <th>{t.dashboard.product}</th>
                <th>{t.calculator.premium}</th>
                <th>{t.dashboard.status}</th>
                {isAdmin && <th>{t.dashboard.agent}</th>}
                <th>{t.dashboard.actions}</th>
              </tr>
            </thead>
            <tbody>
              {applications.map((app) => (
                <tr key={app.id}>
                  <td>{new Date(app.createdAt).toLocaleDateString()}</td>
                  <td>
                    <strong>
                      {app.firstName} {app.lastName}
                    </strong>
                    <br />
                    <span
                      style={{ fontSize: "12px", color: "var(--text-muted)" }}
                    >
                      {app.passportNumber}
                    </span>
                  </td>
                  <td>
                    <span className="productBadge">{app.product}</span>
                  </td>
                  <td>
                    <strong>{app.premium} ₾</strong>
                  </td>
                  <td>
                    <span className={`statusBadge ${app.status}`}>
                      {t.dashboard[app.status]}
                    </span>
                  </td>
                  {isAdmin && (
                    <td>
                      <span style={{ fontSize: "13px" }}>{app.agentName}</span>
                      <br />
                      <span
                        style={{ fontSize: "11px", color: "var(--text-muted)" }}
                      >
                        {app.agentEmail}
                      </span>
                    </td>
                  )}
                  <td>
                    <div
                      style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}
                    >
                      <button
                        className="viewBtn"
                        onClick={() => setSelectedApp(app)}
                      >
                        {t.dashboard.view}
                      </button>
                      {isAdmin && app.status === "pending" && (
                        <>
                          <button
                            className="viewBtn"
                            style={{ background: "#28a745" }}
                            onClick={() => updateStatus(app.id, "approved")}
                          >
                            ✓
                          </button>
                          <button
                            className="viewBtn"
                            style={{ background: "#dc3545" }}
                            onClick={() => updateStatus(app.id, "rejected")}
                          >
                            ✗
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Detail Modal */}
      {selectedApp && (
        <div className="modalOverlay" onClick={() => setSelectedApp(null)}>
          <div
            className="modalContent animate-fadeIn"
            onClick={(e) => e.stopPropagation()}
          >
            <button className="modalClose" onClick={() => setSelectedApp(null)}>
              ✕
            </button>
            <h2 style={{ color: "var(--primary-navy)", marginBottom: "20px" }}>
              {selectedApp.firstName} {selectedApp.lastName}
            </h2>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "12px",
                fontSize: "14px",
              }}
            >
              <div>
                <strong>{t.form.passportNumber}:</strong>{" "}
                {selectedApp.passportNumber}
              </div>
              <div>
                <strong>{t.form.idNumber}:</strong> {selectedApp.idNumber}
              </div>
              <div>
                <strong>{t.form.nationality}:</strong> {selectedApp.nationality}
              </div>
              <div>
                <strong>{t.form.email}:</strong> {selectedApp.email}
              </div>
              <div>
                <strong>{t.form.phone}:</strong> {selectedApp.phone}
              </div>
              <div>
                <strong>{t.calculator.selectProduct}:</strong>{" "}
                {selectedApp.product} ({selectedApp.plan})
              </div>
              <div>
                <strong>{t.calculator.period}:</strong> {selectedApp.startDate}{" "}
                → {selectedApp.endDate}
              </div>
              <div>
                <strong>{t.calculator.coverageLimit}:</strong>{" "}
                {selectedApp.coverageLimit?.toLocaleString()} ₾
              </div>
              <div>
                <strong>{t.calculator.premium}:</strong> {selectedApp.premium} ₾
              </div>
              <div>
                <strong>{t.form.visitPurpose}:</strong>{" "}
                {selectedApp.visitPurpose}
              </div>
              <div>
                <strong>{t.dashboard.status}:</strong>{" "}
                <span className={`statusBadge ${selectedApp.status}`}>
                  {t.dashboard[selectedApp.status]}
                </span>
              </div>
              {isAdmin && (
                <div style={{ gridColumn: "1 / -1" }}>
                  <strong>{t.dashboard.agent}:</strong> {selectedApp.agentName}{" "}
                  ({selectedApp.agentEmail})
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
