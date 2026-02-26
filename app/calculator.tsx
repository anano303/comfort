"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import ApplicationForm from "./form";
import styles from "./calculator.module.css";

type Locale = "ka" | "en";

const TARIFFS = {
  variant1: {
    notRented: [
      { min: 1, max: 60, price: 12 },
      { min: 61, max: 100, price: 15 },
      { min: 101, max: 150, price: 20 },
      { min: 151, max: 200, price: 25 },
      { min: 201, max: 300, price: 35 },
    ],
    rented: [
      { min: 1, max: 60, price: 15 },
      { min: 61, max: 100, price: 20 },
      { min: 101, max: 150, price: 25 },
      { min: 151, max: 200, price: 30 },
      { min: 201, max: 300, price: 40 },
    ],
    compensationLimit:
      "შიდა მოპირკეთებისთვის ანაზღაურების მაქსიმალური ლიმიტი- 1კვ.მ-ზე  300 ₾; ავეჯი და ტექნიკა -  15,000 ₾",
  },
  variant2: {
    notRented: [
      { min: 1, max: 60, price: 20 },
      { min: 61, max: 100, price: 25 },
      { min: 101, max: 150, price: 30 },
      { min: 151, max: 200, price: 40 },
      { min: 201, max: 300, price: 50 },
    ],
    rented: [
      { min: 1, max: 60, price: 25 },
      { min: 61, max: 100, price: 35 },
      { min: 101, max: 150, price: 40 },
      { min: 151, max: 200, price: 50 },
      { min: 201, max: 300, price: 65 },
    ],
    compensationLimit:
      "შიდა მოპირკეთებისთვის ანაზღაურების მაქსიმალური ლიმიტი- 1კვ.მ-ზე  500 ₾; ავეჯი და ტექნიკა -  20,000 ₾",
  },
};

export default function Calculator() {
  const [locale, setLocale] = useState<Locale>("ka");
  const [variant, setVariant] = useState<"variant1" | "variant2">("variant1");
  const [area, setArea] = useState(50);
  const [isRented, setIsRented] = useState(false);
  const [hasAdditionalCoverage, setHasAdditionalCoverage] = useState(false);
  const [paymentPlan, setPaymentPlan] = useState<
    "monthly" | "quarterly" | "semi-annual" | "annual"
  >("monthly");
  const [showForm, setShowForm] = useState(false);
  const [formStep, setFormStep] = useState<1 | 2 | 3>(1);
  const [expandBreakdown, setExpandBreakdown] = useState(false);
  const [expandRisks, setExpandRisks] = useState(false);
  const [showCallForm, setShowCallForm] = useState(false);
  const [callFormData, setCallFormData] = useState({
    fullName: "",
    phoneNumber: "",
  });
  const [callFormStatus, setCallFormStatus] = useState<
    "idle" | "sending" | "sent" | "error"
  >("idle");
  const breakdownRef = useRef<HTMLDivElement>(null);
  const risksRef = useRef<HTMLDivElement>(null);

  // Sync state with URL hash
  useEffect(() => {
    const handleHash = () => {
      const hash = window.location.hash;
      if (hash.startsWith("#form/")) {
        const step = parseInt(hash.replace("#form/", ""));
        if (step >= 1 && step <= 3) {
          setShowForm(true);
          setFormStep(step as 1 | 2 | 3);
        }
      } else if (hash === "#form") {
        setShowForm(true);
        setFormStep(1);
      } else {
        setShowForm(false);
        setFormStep(1);
      }
    };

    handleHash();
    window.addEventListener("hashchange", handleHash);
    return () => window.removeEventListener("hashchange", handleHash);
  }, []);

  const openForm = () => {
    window.location.hash = "#form/1";
  };

  const closeForm = () => {
    window.location.hash = "";
  };

  const onFormStepChange = (step: 1 | 2 | 3) => {
    setFormStep(step);
    window.location.hash = `#form/${step}`;
  };

  // Close breakdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        breakdownRef.current &&
        !breakdownRef.current.contains(event.target as Node)
      ) {
        setExpandBreakdown(false);
      }
      if (
        risksRef.current &&
        !risksRef.current.contains(event.target as Node)
      ) {
        setExpandRisks(false);
      }
    };

    if (expandBreakdown || expandRisks) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [expandBreakdown]);

  const getTariff = (
    variant: "variant1" | "variant2",
    area: number,
    isRented: boolean,
  ) => {
    const tariffs = isRented
      ? TARIFFS[variant].rented
      : TARIFFS[variant].notRented;
    return tariffs.find((t) => area >= t.min && area <= t.max)?.price || 0;
  };

  const monthlyPrice = getTariff(variant, area, isRented);
  const additionalCoveragePrice = isRented ? 8 : 5;
  const totalMonthly =
    monthlyPrice + (hasAdditionalCoverage ? additionalCoveragePrice : 0);
  const totalYearly = totalMonthly * 12;

  // Format number with commas (consistent for SSR/client)
  const formatNumber = (num: number): string => {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  };

  // Calculate compensation limits based on variant and area
  const getCompensationLimits = () => {
    const interiorLimit = variant === "variant1" ? 300 : 500;
    const furnitureLimit = variant === "variant1" ? 15000 : 20000;
    const totalInteriorLimit = area * interiorLimit;

    return {
      interiorPerSqm: interiorLimit,
      totalInterior: formatNumber(totalInteriorLimit),
      furniture: formatNumber(furnitureLimit),
      total: formatNumber(totalInteriorLimit + furnitureLimit),
    };
  };

  const compensationLimits = getCompensationLimits();

  // Helper function to format dates
  const getPaymentDate = (monthsToAdd: number): string => {
    const today = new Date();

    const monthNames = [
      "იანვარი",
      "თებერვალი",
      "მარტი",
      "აპრილი",
      "მაისი",
      "ივნისი",
      "ივლისი",
      "აგვისტო",
      "სექტემბერი",
      "ოქტომბერი",
      "ნოემბერი",
      "დეკემბერი",
    ];

    const day = today.getDate();
    const date = new Date(
      today.getFullYear(),
      today.getMonth() + monthsToAdd,
      day,
    );

    return `${date.getDate()} ${
      monthNames[date.getMonth()]
    } ${date.getFullYear()}`;
  };

  // Payment plan breakdown
  const getPaymentPlanDetails = () => {
    switch (paymentPlan) {
      case "monthly":
        // ყოველთვიური: პირველი შესატანი 2 თვის თანხა (პირველი+ბოლო), შემდეგ მე-2 თვიდან მე-11 თვემდე ყოველთვიურად
        return {
          label: "ყოველთვიური",
          payments: [
            { date: getPaymentDate(0), amount: totalMonthly * 2 },
            ...Array(10)
              .fill(0)
              .map((_, i) => ({
                date: getPaymentDate(i + 1),
                amount: totalMonthly,
              })),
          ],
        };
      case "quarterly":
        // კვარტალი: დღეს, +3თხე, +6თხე, +9თხე
        const quarterlyAmount = totalMonthly * 3;
        const firstQuarterlyAmount = totalMonthly * 4;
        const lastQuarterlyAmount = totalMonthly * 2;
        return {
          label: "კვარტალური",
          payments: [
            { date: getPaymentDate(0), amount: firstQuarterlyAmount },
            { date: getPaymentDate(3), amount: quarterlyAmount },
            { date: getPaymentDate(6), amount: quarterlyAmount },
            { date: getPaymentDate(9), amount: lastQuarterlyAmount },
          ],
        };
      case "semi-annual":
        // 2 ჯერადი: პირველი 7 თხა, მეორე 5 თხა
        return {
          label: "ნახევარწლიური",
          payments: [
            { date: getPaymentDate(0), amount: totalMonthly * 7 },
            { date: getPaymentDate(6), amount: totalMonthly * 5 },
          ],
        };
      case "annual":
        // ერთჯერადი: მთლიანი
        return {
          label: "წლიური",
          payments: [{ date: getPaymentDate(0), amount: totalYearly }],
        };
    }
  };

  const planDetails = getPaymentPlanDetails();

  return (
    <div className="container" suppressHydrationWarning>
      {showForm ? (
        <ApplicationForm
          initialData={{
            areaSize: area,
            isRented,
            hasAdditionalCoverage,
            variant,
            monthlyPrice: totalMonthly,
            paymentPlan,
          }}
          step={formStep}
          onStepChange={onFormStepChange}
          onClose={closeForm}
          locale={locale}
        />
      ) : (
        <>
          <div className="header">
            <div className="headerContent">
              <div className="logo">
                <Image
                  src="/primeLogo.png"
                  alt="PRIME Insurance"
                  width={80}
                  height={80}
                />
              </div>
              <div className="headerText">
                {/* <h1>PRIME Insurance</h1> */}
                {/* <p>{locale === "ka" ? "დააზღვიე მარტივად" : "Insure Easily"}</p> */}
              </div>
              <div className={styles.langSwitch}>
                <button
                  className={locale === "ka" ? styles.active : ""}
                  onClick={() => setLocale("ka")}
                >
                  Geo
                </button>
                <span>|</span>
                <button
                  className={locale === "en" ? styles.active : ""}
                  onClick={() => setLocale("en")}
                >
                  Eng
                </button>
              </div>
            </div>
          </div>
          <div className="calculator">
            <div
              style={{
                background: "#333366",
                margin: "-40px -40px 0 -40px",
                padding: "12px 20px",
                textAlign: "center",
                marginBottom: "25px",
              }}
            >
              <h1
                style={{
                  color: "white",
                  margin: 0,
                  fontSize: "24px",
                  letterSpacing: "0px",
                  fontWeight: 400,
                }}
              >
                {locale === "ka" ? "ბინის დაზღვევა" : "Home Insurance"}
              </h1>
              <p
                style={{
                  color: "rgba(255,255,255,0.8)",
                  fontSize: "12px",
                  fontWeight: 400,
                  letterSpacing: "3px",
                  margin: "8px 0 0 0",
                }}
              >
                {locale === "ka" ? "რემონტი · ავეჯი · ტექნიკა" : "Interior · Furniture · Electronics"}
              </p>
            </div>

            {/* Variant Selection */}
            <div className="section">
              <h2>{locale === "ka" ? "აირჩიეთ დაზღვევის პაკეტი" : "Select Insurance Package"}</h2>
              <div className="variantButtons">
                <button
                  className={`btn ${variant === "variant1" ? "active" : ""}`}
                  onClick={() => setVariant("variant1")}
                >
                  <span>{locale === "ka" ? "სტანდარტი" : "Standard"}</span>
                  {/* <small>საბაზისო </small> */}
                  <small className="compensationInfo">
                    {locale === "ka" 
                      ? TARIFFS.variant1.compensationLimit 
                      : "Interior limit - 300 ₾/sq.m; Furniture - 15,000 ₾"}
                  </small>
                </button>
                <button
                  className={`btn ${variant === "variant2" ? "active" : ""}`}
                  onClick={() => setVariant("variant2")}
                >
                  <span>{locale === "ka" ? "პრემიუმი" : "Premium"}</span>
                  {/* <small>პრემიუმი</small> */}
                  <small className="compensationInfo">
                    {locale === "ka" 
                      ? TARIFFS.variant2.compensationLimit 
                      : "Interior limit - 500 ₾/sq.m; Furniture - 20,000 ₾"}
                  </small>
                </button>
              </div>
            </div>

            {/* Area Input */}
            <div className="section">
              <label>
                {locale === "ka" ? "ბინის ფართი (კვ.მ.):" : "Apartment Area (sq.m.):"} <strong>{area} {locale === "ka" ? "მ²" : "m²"}</strong>
              </label>
              <input
                type="range"
                min="1"
                max="300"
                value={area}
                onChange={(e) => setArea(Number(e.target.value))}
                className="slider"
              />
              <input
                type="number"
                min="1"
                max="300"
                value={area}
                onChange={(e) => setArea(Number(e.target.value))}
                className="numberInput"
              />
            </div>

            {/* Rental Status */}
            <div className="section">
              <label>{locale === "ka" ? "ბინა ქირავდება?" : "Is the apartment rented?"}</label>
              <div className="radioGroup">
                <label className="radioLabel">
                  <input
                    type="radio"
                    name="rentalStatus"
                    checked={!isRented}
                    onChange={() => setIsRented(false)}
                  />
                  {locale === "ka" ? "არ ქირავდება" : "Not rented"}
                </label>
                <label className="radioLabel">
                  <input
                    type="radio"
                    name="rentalStatus"
                    checked={isRented}
                    onChange={() => setIsRented(true)}
                  />
                  {locale === "ka" ? "ქირავდება" : "Rented"}
                </label>
              </div>
            </div>

            {/* Additional Coverage */}
            <div className="section">
              <label>
                <input
                  type="checkbox"
                  checked={hasAdditionalCoverage}
                  onChange={(e) => setHasAdditionalCoverage(e.target.checked)}
                />
                {locale === "ka" 
                  ? "დამატებითი დაფარვა (მესამე პირთა წინაშე პასუხისმგებლობა)" 
                  : "Additional coverage (Third party liability)"}
              </label>
              <p
                className="info"
                style={{ marginTop: "8px", fontSize: "0.9em", color: "#666" }}
              >
                {locale === "ka" 
                  ? "**თუ მეზობლის ბინას მიადგა ზარალი თქვენი ბრალეულობით"
                  : "**If your neighbor's apartment is damaged due to your fault"}
              </p>
              {hasAdditionalCoverage && (
                <p className="info">
                  {locale === "ka" ? "ანაზღაურების ლიმიტი: 10,000 ₾" : "Compensation limit: 10,000 ₾"}
                </p>
              )}
            </div>

            {/* Payment Plan Selection - Now inside the breakdown toggle */}

            {/* Price Display */}
            <div className="priceBox">
              <div className="priceRow">
                <span>{locale === "ka" ? "პრემია" : "Premium"}</span>
                <strong>{monthlyPrice} ₾/{locale === "ka" ? "თვე" : "month"}</strong>
              </div>
              {hasAdditionalCoverage && (
                <div className="priceRow">
                  <span>{locale === "ka" ? "დამატებითი დაფარვა:" : "Additional coverage:"}</span>
                  <strong>{additionalCoveragePrice} ₾/{locale === "ka" ? "თვე" : "month"}</strong>
                </div>
              )}
              <div className="totalRow">
                <span>{locale === "ka" ? "თვეში:" : "Monthly:"}</span>
                <strong>{totalMonthly} ₾</strong>
              </div>
              <div className="totalRow">
                <span>{locale === "ka" ? "წელიწადში:" : "Yearly:"}</span>
                <strong>{totalYearly} ₾</strong>
              </div>

              {/* Payment Plan Breakdown */}
              <div className="paymentBreakdown" ref={breakdownRef}>
                <button
                  className="breakdownToggle"
                  onClick={() => setExpandBreakdown(!expandBreakdown)}
                >
                  <span>{locale === "ka" ? "გადახდის გრაფიკი" : "Payment Schedule"} ({planDetails.label})</span>
                  <span className={`arrow ${expandBreakdown ? "open" : ""}`}>
                    ▼
                  </span>
                </button>
                {expandBreakdown && (
                  <div className="breakdownContent">
                    <div className="paymentPlanOptions">
                      {(
                        [
                          { value: "monthly", label: locale === "ka" ? "ყოველთვიური" : "Monthly" },
                          { value: "quarterly", label: locale === "ka" ? "კვარტლური" : "Quarterly" },
                          { value: "semi-annual", label: locale === "ka" ? "ორჯერადი" : "Semi-Annual" },
                          { value: "annual", label: locale === "ka" ? "წლიური (ერთჯერადი)" : "Annual (One-time)" },
                        ] as const
                      ).map((option) => (
                        <label key={option.value} className="paymentPlanLabel">
                          <input
                            type="radio"
                            name="paymentPlan"
                            value={option.value}
                            checked={paymentPlan === option.value}
                            onChange={(e) =>
                              setPaymentPlan(
                                e.target.value as
                                  | "monthly"
                                  | "quarterly"
                                  | "semi-annual"
                                  | "annual",
                              )
                            }
                          />
                          {option.label}
                        </label>
                      ))}
                    </div>
                    <div className="paymentSchedule">
                      {planDetails.payments.map((payment, index) => (
                        <div key={index} className="paymentItem">
                          <span>{payment.date}:</span>
                          <strong>{payment.amount} ₾</strong>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Compensation Info */}
            <div className="infoBox">
              <h3>{locale === "ka" ? "ანაზღაურების ლიმიტი" : "Compensation Limit"}</h3>
              <div className="compensationDetails">
                <p className="variantInfo">
                  <strong>
                    {locale === "ka" ? "არჩეული:" : "Selected:"} {variant === "variant1" ? (locale === "ka" ? "სტანდარტი" : "Standard") : (locale === "ka" ? "პრემიუმი" : "Premium")}
                  </strong>{" "}
                  |<strong> {locale === "ka" ? "ფართი:" : "Area:"} {area} {locale === "ka" ? "მ²" : "m²"}</strong>
                </p>
                <ul className="limitsList">
                  <li>
                    <span>{locale === "ka" ? "შიდა მოპირკეთება:" : "Interior finish:"}</span>
                    <strong>{compensationLimits.totalInterior} ₾</strong>
                  </li>
                  <li>
                    <span>{locale === "ka" ? "ავეჯი და ტექნიკა:" : "Furniture & appliances:"}</span>
                    <strong>{compensationLimits.furniture} ₾</strong>
                  </li>
                  <li className="totalLimit">
                    <span>{locale === "ka" ? "სულ ანაზღაურების ლიმიტი:" : "Total compensation limit:"}</span>
                    <strong>{compensationLimits.total} ₾</strong>
                  </li>
                </ul>
              </div>
            </div>

            {/* Covered Risks */}
            <div className="risksBox" ref={risksRef}>
              <button
                className="risksToggle"
                onClick={() => setExpandRisks(!expandRisks)}
              >
                <span>{locale === "ka" ? "დაზღვეული რისკები" : "Covered Risks"}</span>
                <span className={`arrow ${expandRisks ? "open" : ""}`}>▼</span>
              </button>
              {expandRisks && (
                <div className="riskGrid">
                  <div className="riskItem">
                    <span className="riskIcon">💧</span>
                    <p>{locale === "ka" ? "მეზობლის ბინიდან წყლის ჩამოსვლა" : "Water damage from neighbor's apartment"}</p>
                  </div>
                  <div className="riskItem">
                    <span className="riskIcon">⚠️</span>
                    <p>{locale === "ka" ? "მესამე პირის მართლსაწინააღმდეგო ქმედება" : "Third party unlawful actions"}</p>
                  </div>
                  <div className="riskItem">
                    <span className="riskIcon">🌪️</span>
                    <p>{locale === "ka" ? "სტიქიური მოვლენები" : "Natural disasters"}</p>
                  </div>
                  <div className="riskItem">
                    <span className="riskIcon">🔒</span>
                    <p>{locale === "ka" ? "ქურდობა, ძარცვა, ყაჩაღობა" : "Theft, robbery, burglary"}</p>
                  </div>
                  <div className="riskItem">
                    <span className="riskIcon">🚰</span>
                    <p>{locale === "ka" ? "წყალგაყვანილობის უეცარი ავარია" : "Sudden plumbing failure"}</p>
                  </div>
                  <div className="riskItem">
                    <span className="riskIcon">⚡</span>
                    <p>{locale === "ka" ? "ელექტროგაყვანილობის უეცარი ავარია" : "Sudden electrical failure"}</p>
                  </div>
                  <div className="riskItem">
                    <span className="riskIcon">🔥</span>
                    <p>{locale === "ka" ? "გათბობის სისტემის ავარია" : "Heating system failure"}</p>
                  </div>
                  <div className="riskItem">
                    <span className="riskIcon">🚿</span>
                    <p>{locale === "ka" ? "საკანალიზაციო სისტემის ავარია" : "Sewage system failure"}</p>
                  </div>
                  <div className="riskItem">
                    <span className="riskIcon">🧯</span>
                    <p>{locale === "ka" ? "ხანძარსაქრობი სისტემის ავარია" : "Fire suppression system failure"}</p>
                  </div>
                  <div className="riskItem">
                    <span className="riskIcon">🔥</span>
                    <p>{locale === "ka" ? "ხანძარი და აფეთქება" : "Fire and explosion"}</p>
                  </div>
                  <div className="riskItem">
                    <span className="riskIcon">💨</span>
                    <p>{locale === "ka" ? "კვამლით დაზიანება ხანძრის შედეგად" : "Smoke damage from fire"}</p>
                  </div>
                </div>
              )}
            </div>

            {/* CTA Buttons */}
            <div className="ctaButtons">
              <button className="ctaButton" onClick={openForm}>
                {locale === "ka" ? "შეიძინე ონლაინ" : "Buy Online"}
              </button>
              <button
                style={{
                  background: "#333366",
                  color: "white",
                  border: "none",
                  borderRadius: "8px",
                  padding: "14px",
                  fontSize: "16px",
                  fontWeight: 600,
                  cursor: "pointer",
                  flex: 1,
                  width: "100%",
                }}
                onClick={() => setShowCallForm(true)}
              >
                📞 {locale === "ka" ? "მოითხოვე ზარი" : "Request a Call"}
              </button>
            </div>

            {/* Call Request Modal */}
            {showCallForm && (
              <div
                className="modalOverlay"
                onClick={() => {
                  setShowCallForm(false);
                  setCallFormStatus("idle");
                }}
              >
                <div
                  className="modalContent"
                  onClick={(e) => e.stopPropagation()}
                >
                  <button
                    className="modalClose"
                    onClick={() => {
                      setShowCallForm(false);
                      setCallFormStatus("idle");
                    }}
                  >
                    ✕
                  </button>
                  <h3>{locale === "ka" ? "მოითხოვე ზარი" : "Request a Call"}</h3>
                  <p className="modalDescription">
                    {locale === "ka" 
                      ? "დატოვეთ საკონტაქტო ინფორმაცია და ჩვენი კონსულტანტი დაგიკავშირდებათ"
                      : "Leave your contact information and our consultant will contact you"}
                  </p>
                  {callFormStatus === "sent" ? (
                    <div className="callFormSuccess">
                      <span className="successIcon">✓</span>
                      <p>{locale === "ka" ? "თქვენი მოთხოვნა მიღებულია! მალე დაგიკავშირდებით." : "Your request has been received! We will contact you soon."}</p>
                      <button
                        className="ctaButton"
                        onClick={() => {
                          setShowCallForm(false);
                          setCallFormStatus("idle");
                        }}
                      >
                        {locale === "ka" ? "დახურვა" : "Close"}
                      </button>
                    </div>
                  ) : (
                    <form
                      className="callForm"
                      onSubmit={async (e) => {
                        e.preventDefault();
                        setCallFormStatus("sending");
                        try {
                          const res = await fetch("/api/request-call", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify(callFormData),
                          });
                          if (res.ok) {
                            setCallFormStatus("sent");
                            setCallFormData({ fullName: "", phoneNumber: "" });
                          } else {
                            setCallFormStatus("error");
                          }
                        } catch {
                          setCallFormStatus("error");
                        }
                      }}
                    >
                      <div className="formGroup">
                        <label>{locale === "ka" ? "სახელი და გვარი" : "Full Name"}</label>
                        <input
                          type="text"
                          required
                          value={callFormData.fullName}
                          onChange={(e) =>
                            setCallFormData({
                              ...callFormData,
                              fullName: e.target.value,
                            })
                          }
                          placeholder={locale === "ka" ? "მაგ: გიორგი გიორგაძე" : "e.g. John Smith"}
                        />
                      </div>
                      <div className="formGroup">
                        <label>{locale === "ka" ? "ტელეფონის ნომერი" : "Phone Number"}</label>
                        <input
                          type="tel"
                          required
                          value={callFormData.phoneNumber}
                          onChange={(e) =>
                            setCallFormData({
                              ...callFormData,
                              phoneNumber: e.target.value,
                            })
                          }
                          placeholder={locale === "ka" ? "მაგ: 599 123 456" : "e.g. 599 123 456"}
                        />
                      </div>
                      {callFormStatus === "error" && (
                        <p className="errorText">
                          {locale === "ka" ? "შეცდომა! გთხოვთ სცადოთ თავიდან." : "Error! Please try again."}
                        </p>
                      )}
                      <button
                        type="submit"
                        className="ctaButton"
                        disabled={callFormStatus === "sending"}
                      >
                        {callFormStatus === "sending"
                          ? (locale === "ka" ? "იგზავნება..." : "Sending...")
                          : (locale === "ka" ? "გაგზავნა" : "Send")}
                      </button>
                    </form>
                  )}
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
