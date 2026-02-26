"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useLocale } from "@/app/context/LocaleContext";
import {
  ProductType,
  GeomedPlan,
  calculateGEOTRIPPremium,
  calculateGEOMEDPremium,
  GEOMED_MAX_LIMITS,
  GEOTRIP_PRICING,
} from "@/app/lib/insurance-data";

function InsuranceContent() {
  const { t } = useLocale();
  const searchParams = useSearchParams();

  const [product, setProductState] = useState<ProductType>("GEOMED");
  const [geodmedPlan, setGeomedPlan] = useState<GeomedPlan>("id1301");
  const [days, setDays] = useState(30);
  const [isOver65, setIsOver65] = useState(false);
  const [isStudent, setIsStudent] = useState(false);
  const [step, setStep] = useState<1 | 2>(1);
  const [startDate, setStartDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [endDate, setEndDate] = useState("");

  // Wrap setProduct to also update URL hash
  const setProduct = (p: ProductType) => {
    setProductState(p);
    window.history.replaceState(null, "", `#${p.toLowerCase()}`);
  };

  // Form fields
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    passportNumber: "",
    idNumber: "",
    nationality: "",
    dateOfBirth: "",
    gender: "male",
    email: "",
    phone: "",
    address: "",
    visitPurpose: "tourist",
    visitDetail: "",
    passportFile: null as File | null,
  });

  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    // Read from hash first (e.g. #geomed or #geotrip)
    const hash = window.location.hash.replace("#", "").toUpperCase();
    if (hash === "GEOTRIP" || hash === "GEOMED") {
      setProductState(hash as ProductType);
    } else {
      // Fallback to search params
      const p = searchParams.get("product");
      if (p === "GEOTRIP" || p === "GEOMED") setProductState(p);
    }
    const plan = searchParams.get("plan");
    if (plan && ["id1301", "id1300", "id1299_4", "id1299_6"].includes(plan)) {
      setGeomedPlan(plan as GeomedPlan);
    }
    // Set initial hash if none
    if (!window.location.hash) {
      window.history.replaceState(null, "", "#geomed");
    }
  }, [searchParams]);

  useEffect(() => {
    if (startDate) {
      const start = new Date(startDate);
      if (product === "GEOTRIP") {
        const end = new Date(start);
        end.setDate(end.getDate() + days);
        setEndDate(end.toISOString().split("T")[0]);
      } else {
        const months =
          geodmedPlan === "id1301"
            ? 12
            : geodmedPlan === "id1300"
              ? 9
              : geodmedPlan === "id1299_6"
                ? 6
                : 4;
        const end = new Date(start);
        end.setMonth(end.getMonth() + months);
        setEndDate(end.toISOString().split("T")[0]);
      }
    }
  }, [startDate, days, product, geodmedPlan]);

  // Auto-detect 65+ from date of birth
  useEffect(() => {
    if (formData.dateOfBirth && formData.dateOfBirth.length === 10) {
      const birth = new Date(formData.dateOfBirth);
      if (!isNaN(birth.getTime())) {
        const today = new Date();
        let age = today.getFullYear() - birth.getFullYear();
        const m = today.getMonth() - birth.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
          age--;
        }
        if (age >= 65) {
          setIsOver65(true);
          setIsStudent(false);
        } else {
          setIsOver65(false);
        }
      }
    }
  }, [formData.dateOfBirth]);

  const premium =
    product === "GEOTRIP"
      ? calculateGEOTRIPPremium(days, isOver65)
      : {
          perDay: 0,
          total: calculateGEOMEDPremium(geodmedPlan, isStudent, isOver65),
        };

  const maxLimit =
    product === "GEOTRIP"
      ? GEOTRIP_PRICING.maxLimit
      : GEOMED_MAX_LIMITS[geodmedPlan];

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setFormData((prev) => ({ ...prev, passportFile: file }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    if (
      !formData.firstName ||
      !formData.lastName ||
      !formData.passportNumber ||
      !formData.email ||
      !formData.phone
    ) {
      setError(t.form.requiredField);
      setLoading(false);
      return;
    }

    try {
      const data = new FormData();
      Object.entries(formData).forEach(([key, value]) => {
        if (key === "passportFile" && value) {
          data.append("passportFile", value as File);
        } else if (value !== null) {
          data.append(key, value as string);
        }
      });

      data.append("product", product);
      data.append("plan", product === "GEOTRIP" ? "GEOTRIP" : geodmedPlan);
      data.append("days", days.toString());
      data.append("startDate", startDate);
      data.append("endDate", endDate);
      data.append("premium", premium.total.toString());
      data.append("isOver65", isOver65.toString());
      data.append("isStudent", isStudent.toString());
      data.append("coverageLimit", maxLimit.toString());

      const periodLabel =
        product === "GEOTRIP"
          ? `${days} ${t.calculator.days}`
          : geodmedPlan === "id1301"
            ? "12 " + t.common.months
            : geodmedPlan === "id1300"
              ? "9 " + t.common.months
              : geodmedPlan === "id1299_6"
                ? "6 " + t.common.months
                : "4 " + t.common.months;
      data.append("period", periodLabel);

      const res = await fetch("/api/travel-applications", {
        method: "POST",
        body: data,
      });
      if (!res.ok) throw new Error("Failed to submit");
      setSubmitted(true);
    } catch {
      setError("Error submitting application");
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="insurancePage">
        <div className="successBox animate-fadeIn">
          <div className="successIcon">✓</div>
          <h2>{t.form.success}</h2>
          <p>{t.form.successDesc}</p>
          <button
            className="btnPrimary"
            onClick={() => {
              setSubmitted(false);
              setStep(1);
            }}
          >
            {t.form.newApplication}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="insurancePage">
      {/* Banner */}
      <div className="insuranceBanner">
        <h1>{t.tagline.split("\n").map((line, i) => (
          <span key={i}>{line}{i === 0 && <br />}</span>
        ))}</h1>
      </div>

      {/* Step Indicator */}
      <div className="stepIndicator">
        <div className={`stepDot ${step >= 1 ? "active" : ""}`}></div>
        <div className={`stepDot ${step >= 2 ? "active" : ""}`}></div>
      </div>

      {step === 1 && (
        <div className="animate-fadeIn">
          {/* Product Selection */}
          <div className="calcSection">
            <h2>{t.calculator.selectProduct}</h2>
            <div className="productTabs">
              <button
                className={`productTab ${product === "GEOMED" ? "active" : ""}`}
                onClick={() => setProduct("GEOMED")}
              >
                GEOMED
                <span className="productTabSub">
                  {t.conditions.longTermVisa}
                </span>
              </button>
              <button
                className={`productTab ${product === "GEOTRIP" ? "active" : ""}`}
                onClick={() => setProduct("GEOTRIP")}
              >
                GEOTRIP
                <span className="productTabSub">
                  {t.conditions.shortTermVisa}
                </span>
              </button>
            </div>

            {/* See Conditions Button */}
            <a
              className="btnConditions"
              href="/Travel%20in%20Georgia%20_Short%20%26%20Long%20Term%20ENG%20(1).pdf"
              target="_blank"
              rel="noopener noreferrer"
            >
              📋 {t.conditions.title}
            </a>

            {product === "GEOMED" && (
              <>
                {/* Options BEFORE plan cards */}
                <div className="optionsGrid">
                  <label className="checkboxCard">
                    <input
                      type="checkbox"
                      checked={isOver65}
                      onChange={(e) => {
                        setIsOver65(e.target.checked);
                        if (e.target.checked) setIsStudent(false);
                      }}
                    />
                    <div className="checkboxCardContent">
                      <span className="checkboxCardTitle">65+</span>
                      <span className="checkboxCardDesc">{t.conditions.note65}</span>
                    </div>
                  </label>
                  <label className="checkboxCard">
                    <input
                      type="checkbox"
                      checked={isStudent}
                      onChange={(e) => {
                        setIsStudent(e.target.checked);
                        if (e.target.checked) setIsOver65(false);
                      }}
                    />
                    <div className="checkboxCardContent">
                      <span className="checkboxCardTitle">🎓 {t.form.purposeStudent}</span>
                      <span className="checkboxCardDesc">{t.form.studentDiscount}</span>
                    </div>
                  </label>
                </div>

                <div className="planCards">
                  {[
                    { id: "id1301" as GeomedPlan, label: "12 " + t.common.months },
                    { id: "id1300" as GeomedPlan, label: "9 " + t.common.months },
                    { id: "id1299_6" as GeomedPlan, label: "6 " + t.common.months },
                    { id: "id1299_4" as GeomedPlan, label: "4 " + t.common.months },
                  ].map((plan) => {
                    const price = calculateGEOMEDPremium(plan.id, isStudent, isOver65);
                    return (
                      <div
                        key={plan.id}
                        className={`planCard ${geodmedPlan === plan.id ? "selected" : ""}`}
                        onClick={() => setGeomedPlan(plan.id)}
                      >
                        <h4>{plan.label}</h4>
                        <div className="planPrice">{price} ₾</div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}

            {product === "GEOTRIP" && (
              <div className="formField" style={{ marginTop: "16px" }}>
                <label>
                  {t.calculator.period} ({t.calculator.days}):{" "}
                  <strong>{days}</strong>
                </label>
                <input
                  type="range"
                  min="1"
                  max="90"
                  value={days}
                  onChange={(e) => setDays(Number(e.target.value))}
                  style={{ width: "100%", accentColor: "var(--primary-teal)" }}
                />
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    fontSize: "12px",
                    color: "var(--text-muted)",
                  }}
                >
                  <span>1 {t.calculator.days}</span>
                  <span>90 {t.calculator.days}</span>
                </div>
              </div>
            )}
          </div>

          {/* Dates */}
          <div className="calcSection">
            <h2>{t.calculator.period}</h2>
            <div className="dateRow">
              <div className="formField">
                <label>{t.calculator.startDate}</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>
              <span className="dateSeparator">→</span>
              <div className="formField">
                <label>{t.calculator.endDate}</label>
                <input
                  type="date"
                  value={endDate}
                  readOnly
                  style={{ background: "#f5f5f5" }}
                />
              </div>
            </div>
          </div>

          {/* Options — only for GEOTRIP (GEOMED checkboxes are above plan cards) */}
          {product === "GEOTRIP" && (
            <div className="calcSection">
              <div className="optionsGrid">
                <label className="checkboxCard">
                  <input
                    type="checkbox"
                    checked={isOver65}
                    onChange={(e) => setIsOver65(e.target.checked)}
                  />
                  <div className="checkboxCardContent">
                    <span className="checkboxCardTitle">65+</span>
                    <span className="checkboxCardDesc">{t.conditions.note65}</span>
                  </div>
                </label>
              </div>
            </div>
          )}

          {/* Price Display */}
          <div className="priceDisplay">
            <div className="priceRow">
              <span>{t.calculator.coverageLimit}</span>
              <strong>
                {new Intl.NumberFormat("en-US").format(maxLimit)} ₾
              </strong>
            </div>
            {product === "GEOTRIP" && (
              <div className="priceRow">
                <span>{t.calculator.perDay}</span>
                <strong>{premium.perDay} ₾</strong>
              </div>
            )}
            <div className="priceDivider"></div>
            <div className="priceRow priceTotal">
              <span>{t.calculator.premium}</span>
              <strong>{premium.total} ₾</strong>
            </div>
            {product === "GEOMED" && isStudent && (
              <div
                className="priceRow"
                style={{ fontSize: "12px", opacity: 0.8 }}
              >
                <span>{t.calculator.premiumStudent}</span>
                <strong>✓</strong>
              </div>
            )}
          </div>

          <button
            className="btnPrimary"
            style={{
              width: "100%",
              justifyContent: "center",
              marginTop: "20px",
              fontSize: "15px",
              padding: "16px 32px",
            }}
            onClick={() => {
              if (!startDate) {
                setError(t.form.requiredField + ": " + t.calculator.startDate);
                return;
              }
              setError("");
              setStep(2);
            }}
          >
            {t.calculator.next} →
          </button>
          {error && (
            <div className="authError" style={{ marginTop: "12px" }}>
              {error}
            </div>
          )}
        </div>
      )}

      {step === 2 && (
        <div className="animate-fadeIn">
          <div className="calcSection">
            <h2>{t.form.personalInfo}</h2>
            <form onSubmit={handleSubmit}>
              <div className="formGrid">
                <div className="formField">
                  <label>
                    {t.form.firstName} <span className="required">*</span>
                  </label>
                  <input
                    type="text"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className="formField">
                  <label>
                    {t.form.lastName} <span className="required">*</span>
                  </label>
                  <input
                    type="text"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className="formField">
                  <label>
                    {t.form.passportNumber} <span className="required">*</span>
                  </label>
                  <input
                    type="text"
                    name="passportNumber"
                    value={formData.passportNumber}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className="formField">
                  <label>
                    {t.form.idNumber} <span className="required">*</span>
                  </label>
                  <input
                    type="text"
                    name="idNumber"
                    value={formData.idNumber}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className="formField">
                  <label>
                    {t.form.nationality} <span className="required">*</span>
                  </label>
                  <input
                    type="text"
                    name="nationality"
                    value={formData.nationality}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className="formField">
                  <label>
                    {t.form.dateOfBirth} <span className="required">*</span>
                  </label>
                  <input
                    type="date"
                    name="dateOfBirth"
                    value={formData.dateOfBirth}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className="formField">
                  <label>{t.form.gender}</label>
                  <select
                    name="gender"
                    value={formData.gender}
                    onChange={handleInputChange}
                  >
                    <option value="male">{t.form.male}</option>
                    <option value="female">{t.form.female}</option>
                  </select>
                </div>
                <div className="formField">
                  <label>
                    {t.form.email} <span className="required">*</span>
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className="formField">
                  <label>
                    {t.form.phone} <span className="required">*</span>
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className="formField fullWidth">
                  <label>{t.form.address}</label>
                  <input
                    type="text"
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="formField">
                  <label>{t.form.visitPurpose}</label>
                  <select
                    name="visitPurpose"
                    value={formData.visitPurpose}
                    onChange={handleInputChange}
                  >
                    <option value="tourist">{t.form.purposeTourist}</option>
                    <option value="student">{t.form.purposeStudent}</option>
                    <option value="work">{t.form.purposeWork}</option>
                  </select>
                </div>
                <div className="formField">
                  <label>
                    {formData.visitPurpose === "tourist"
                      ? t.form.tourNumber
                      : formData.visitPurpose === "student"
                        ? t.form.universityName
                        : t.form.residenceDoc}
                  </label>
                  <input
                    type="text"
                    name="visitDetail"
                    value={formData.visitDetail}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="formField fullWidth">
                  <label>{t.form.passportPhoto}</label>
                  <input
                    type="file"
                    accept="image/*,.pdf"
                    onChange={handleFileChange}
                  />
                </div>
              </div>

              {/* Summary */}
              <div className="priceDisplay" style={{ marginTop: "24px" }}>
                <div className="priceRow">
                  <span>{t.calculator.selectProduct}</span>
                  <strong>
                    {product}{" "}
                    {product === "GEOMED"
                      ? `(${geodmedPlan === "id1301" ? "12m" : geodmedPlan === "id1300" ? "9m" : geodmedPlan === "id1299_6" ? "6m" : "4m"})`
                      : ""}
                  </strong>
                </div>
                <div className="priceRow">
                  <span>{t.calculator.period}</span>
                  <strong>
                    {startDate} → {endDate}
                  </strong>
                </div>
                <div className="priceRow">
                  <span>{t.calculator.coverageLimit}</span>
                  <strong>
                    {new Intl.NumberFormat("en-US").format(maxLimit)} ₾
                  </strong>
                </div>
                <div className="priceDivider"></div>
                <div className="priceRow priceTotal">
                  <span>{t.calculator.premium}</span>
                  <strong>{premium.total} ₾</strong>
                </div>
              </div>

              {error && (
                <div className="authError" style={{ marginTop: "12px" }}>
                  {error}
                </div>
              )}

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "12px",
                  marginTop: "24px",
                }}
              >
                <button
                  type="button"
                  className="btnSecondary"
                  style={{
                    color: "var(--text-muted)",
                    borderColor: "var(--border-color)",
                    justifyContent: "center",
                    borderRadius: "12px",
                    fontSize: "14px",
                  }}
                  onClick={() => setStep(1)}
                >
                  ← {t.form.back}
                </button>
                <button
                  type="submit"
                  className="btnPrimary"
                  style={{ justifyContent: "center", fontSize: "14px" }}
                  disabled={loading}
                >
                  {loading ? t.form.sending : t.form.submit}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default function TravelInsurancePage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "InsuranceAgency",
    name: "PRIME Insurance Georgia",
    description:
      "Health and personal accident insurance for foreigners, non-residents, students and expats in Georgia. TRC residence permit insurance, student visa insurance, GEOMED & GEOTRIP plans.",
    url: "https://travelprime.vercel.app",
    logo: "https://travelprime.vercel.app/primeLogo.png",
    image: "https://travelprime.vercel.app/fb.png",
    telephone: "*1115",
    email: "a.beroshvili@primeinsurance.ge",
    address: {
      "@type": "PostalAddress",
      addressCountry: "GE",
      addressLocality: "Tbilisi",
    },
    areaServed: {
      "@type": "Country",
      name: "Georgia",
    },
    priceRange: "₾₾",
    hasOfferCatalog: {
      "@type": "OfferCatalog",
      name: "Insurance Plans",
      itemListElement: [
        {
          "@type": "Offer",
          name: "GEOMED - Long Term Health Insurance",
          description:
            "4 to 12 month health insurance for foreigners with residence permit (TRC) or student visa in Georgia. Coverage up to 50,000 GEL.",
          priceCurrency: "GEL",
          price: "135",
          priceSpecification: {
            "@type": "PriceSpecification",
            priceCurrency: "GEL",
            price: "135",
            description: "Starting from 135 GEL for 4 months",
          },
        },
        {
          "@type": "Offer",
          name: "GEOTRIP - Short Term Travel Insurance",
          description:
            "Daily travel insurance for tourists and short-term visitors to Georgia. From 2 GEL per day, coverage up to 30,000 GEL.",
          priceCurrency: "GEL",
          price: "2",
          priceSpecification: {
            "@type": "PriceSpecification",
            priceCurrency: "GEL",
            price: "2",
            description: "2 GEL per day, minimum 10 GEL",
          },
        },
      ],
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Suspense
        fallback={
          <div className="insurancePage">
            <div className="calcSection">
              <p>Loading...</p>
            </div>
          </div>
        }
      >
        <InsuranceContent />
      </Suspense>
    </>
  );
}
