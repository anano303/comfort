"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import ApplicationForm from "./form";

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
  const [variant, setVariant] = useState<"variant1" | "variant2">("variant1");
  const [area, setArea] = useState(50);
  const [isRented, setIsRented] = useState(false);
  const [hasAdditionalCoverage, setHasAdditionalCoverage] = useState(false);
  const [paymentPlan, setPaymentPlan] = useState<
    "monthly" | "quarterly" | "semi-annual" | "annual"
  >("monthly");
  const [showForm, setShowForm] = useState(false);
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

  // Calculate compensation limits based on variant and area
  const getCompensationLimits = () => {
    const interiorLimit = variant === "variant1" ? 300 : 500;
    const furnitureLimit = variant === "variant1" ? 15000 : 20000;
    const totalInteriorLimit = area * interiorLimit;

    return {
      interiorPerSqm: interiorLimit,
      totalInterior: totalInteriorLimit.toLocaleString(),
      furniture: furnitureLimit.toLocaleString(),
      total: (totalInteriorLimit + furnitureLimit).toLocaleString(),
    };
  };

  const compensationLimits = getCompensationLimits();

  // Helper function to format dates
  const getPaymentDate = (monthsToAdd: number): string => {
    const today = new Date();
    const day = 23; // Payment day is 23rd

    // If we're on or past the 23rd, first payment is today; otherwise next month
    let startMonth = today.getMonth();
    if (today.getDate() < 23) {
      startMonth += 1;
    }

    const date = new Date(today.getFullYear(), startMonth + monthsToAdd, day);

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

    return `${date.getDate()} ${
      monthNames[date.getMonth()]
    } ${date.getFullYear()}`;
  };

  // Payment plan breakdown
  const getPaymentPlanDetails = () => {
    switch (paymentPlan) {
      case "monthly":
        // ყოველთვიური: პირველი შესატანი 2 თვის თანხა, შემდეგ 10 თვის ყოველთვიურად (სულ 11 გადახდა)
        return {
          label: "ყოველთვიური",
          payments: [
            { date: getPaymentDate(0), amount: totalMonthly * 2 },
            ...Array(10)
              .fill(0)
              .map((_, i) => ({
                date: getPaymentDate(i + 2),
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
    <div className="container">
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
          onClose={() => setShowForm(false)}
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
                <p>დააზღვიე მარტივად</p>
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
                ბინის დაზღვევა
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
                რემონტი · ავეჯი · ტექნიკა
              </p>
            </div>

            {/* Variant Selection */}
            <div className="section">
              <h2>აირჩიეთ დაზღვევის პაკეტი</h2>
              <div className="variantButtons">
                <button
                  className={`btn ${variant === "variant1" ? "active" : ""}`}
                  onClick={() => setVariant("variant1")}
                >
                  <span>სტანდარტი</span>
                  {/* <small>საბაზისო </small> */}
                  <small className="compensationInfo">
                    {TARIFFS.variant1.compensationLimit}
                  </small>
                </button>
                <button
                  className={`btn ${variant === "variant2" ? "active" : ""}`}
                  onClick={() => setVariant("variant2")}
                >
                  <span>პრემიუმი</span>
                  {/* <small>პრემიუმი</small> */}
                  <small className="compensationInfo">
                    {TARIFFS.variant2.compensationLimit}
                  </small>
                </button>
              </div>
            </div>

            {/* Area Input */}
            <div className="section">
              <label>
                ბინის ფართი (კვ.მ.): <strong>{area} მ²</strong>
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
              <label>ბინა ქირავდება?</label>
              <div className="radioGroup">
                <label className="radioLabel">
                  <input
                    type="radio"
                    name="rentalStatus"
                    checked={!isRented}
                    onChange={() => setIsRented(false)}
                  />
                  არ ქირავდება
                </label>
                <label className="radioLabel">
                  <input
                    type="radio"
                    name="rentalStatus"
                    checked={isRented}
                    onChange={() => setIsRented(true)}
                  />
                  ქირავდება
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
                დამატებითი დაფარვა (მესამე პირთა წინაშე პასუხისმგებლობა)
              </label>
              <p
                className="info"
                style={{ marginTop: "8px", fontSize: "0.9em", color: "#666" }}
              >
                **თუ მეზობლის ბინას მიადგა ზარალი თქვენი ბრალეულობით
              </p>
              {hasAdditionalCoverage && (
                <p className="info">ანაზღაურების ლიმიტი: 10,000 ₾</p>
              )}
            </div>

            {/* Payment Plan Selection - Now inside the breakdown toggle */}

            {/* Price Display */}
            <div className="priceBox">
              <div className="priceRow">
                <span> პრემია</span>
                <strong>{monthlyPrice} ₾/თვე</strong>
              </div>
              {hasAdditionalCoverage && (
                <div className="priceRow">
                  <span>დამატებითი დაფარვა:</span>
                  <strong>{additionalCoveragePrice} ₾/თვე</strong>
                </div>
              )}
              <div className="totalRow">
                <span> თვეში:</span>
                <strong>{totalMonthly} ₾</strong>
              </div>
              <div className="totalRow">
                <span> წელიწადში:</span>
                <strong>{totalYearly} ₾</strong>
              </div>

              {/* Payment Plan Breakdown */}
              <div className="paymentBreakdown" ref={breakdownRef}>
                <button
                  className="breakdownToggle"
                  onClick={() => setExpandBreakdown(!expandBreakdown)}
                >
                  <span>გადახდის გრაფიკი ({planDetails.label})</span>
                  <span className={`arrow ${expandBreakdown ? "open" : ""}`}>
                    ▼
                  </span>
                </button>
                {expandBreakdown && (
                  <div className="breakdownContent">
                    <div className="paymentPlanOptions">
                      {(
                        [
                          { value: "monthly", label: "ყოველთვიური" },
                          { value: "quarterly", label: "კვარტლური" },
                          { value: "semi-annual", label: "ორჯერადი" },
                          { value: "annual", label: "წლიური (ერთჯერადი)" },
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
              <h3>ანაზღაურების ლიმიტი</h3>
              <div className="compensationDetails">
                <p className="variantInfo">
                  <strong>
                    არჩეული: {variant === "variant1" ? "სტანდარტი" : "პრემიუმი"}
                  </strong>{" "}
                  |<strong> ფართი: {area} მ²</strong>
                </p>
                <ul className="limitsList">
                  <li>
                    <span>შიდა მოპირკეთება:</span>
                    <strong>{compensationLimits.totalInterior} ₾</strong>
                  </li>
                  <li>
                    <span>ავეჯი და ტექნიკა:</span>
                    <strong>{compensationLimits.furniture} ₾</strong>
                  </li>
                  <li className="totalLimit">
                    <span>სულ ანაზღაურების ლიმიტი:</span>
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
                <span>დაზღვეული რისკები</span>
                <span className={`arrow ${expandRisks ? "open" : ""}`}>▼</span>
              </button>
              {expandRisks && (
                <div className="riskGrid">
                  <div className="riskItem">
                    <span className="riskIcon">💧</span>
                    <p>მეზობლის ბინიდან წყლის ჩამოსვლა</p>
                  </div>
                  <div className="riskItem">
                    <span className="riskIcon">⚠️</span>
                    <p>მესამე პირის მართლსაწინააღმდეგო ქმედება</p>
                  </div>
                  <div className="riskItem">
                    <span className="riskIcon">🌪️</span>
                    <p>სტიქიური მოვლენები</p>
                  </div>
                  <div className="riskItem">
                    <span className="riskIcon">🔒</span>
                    <p>ქურდობა, ძარცვა, ყაჩაღობა</p>
                  </div>
                  <div className="riskItem">
                    <span className="riskIcon">🚰</span>
                    <p>წყალგაყვანილობის უეცარი ავარია</p>
                  </div>
                  <div className="riskItem">
                    <span className="riskIcon">⚡</span>
                    <p>ელექტროგაყვანილობის უეცარი ავარია</p>
                  </div>
                  <div className="riskItem">
                    <span className="riskIcon">🔥</span>
                    <p>გათბობის სისტემის ავარია</p>
                  </div>
                  <div className="riskItem">
                    <span className="riskIcon">🚿</span>
                    <p>საკანალიზაციო სისტემის ავარია</p>
                  </div>
                  <div className="riskItem">
                    <span className="riskIcon">🧯</span>
                    <p>ხანძარსაქრობი სისტემის ავარია</p>
                  </div>
                  <div className="riskItem">
                    <span className="riskIcon">🔥</span>
                    <p>ხანძარი და აფეთქება</p>
                  </div>
                  <div className="riskItem">
                    <span className="riskIcon">💨</span>
                    <p>კვამლით დაზიანება ხანძრის შედეგად</p>
                  </div>
                </div>
              )}
            </div>

            {/* CTA Buttons */}
            <div className="ctaButtons">
              <button className="ctaButton" onClick={() => setShowForm(true)}>
                შეიძინე ონლაინ
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
                📞 მოითხოვე ზარი
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
                  <h3>მოითხოვე ზარი</h3>
                  <p className="modalDescription">
                    დატოვეთ საკონტაქტო ინფორმაცია და ჩვენი კონსულტანტი
                    დაგიკავშირდებათ
                  </p>
                  {callFormStatus === "sent" ? (
                    <div className="callFormSuccess">
                      <span className="successIcon">✓</span>
                      <p>თქვენი მოთხოვნა მიღებულია! მალე დაგიკავშირდებით.</p>
                      <button
                        className="ctaButton"
                        onClick={() => {
                          setShowCallForm(false);
                          setCallFormStatus("idle");
                        }}
                      >
                        დახურვა
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
                        <label>სახელი და გვარი</label>
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
                          placeholder="მაგ: გიორგი გიორგაძე"
                        />
                      </div>
                      <div className="formGroup">
                        <label>ტელეფონის ნომერი</label>
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
                          placeholder="მაგ: 599 123 456"
                        />
                      </div>
                      {callFormStatus === "error" && (
                        <p className="errorText">
                          შეცდომა! გთხოვთ სცადოთ თავიდან.
                        </p>
                      )}
                      <button
                        type="submit"
                        className="ctaButton"
                        disabled={callFormStatus === "sending"}
                      >
                        {callFormStatus === "sending"
                          ? "იგზავნება..."
                          : "გაგზავნა"}
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
