"use client";

import { useState } from "react";
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
      "შიდა მოპირკეთებისთვის - 1კვ.მ-ზე მაქს. 300 ₾; ავეჯი - მაქს. 15,000 ₾",
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
      "შიდა მოპირკეთებისთვის - 1კვ.მ-ზე მაქს. 500 ₾; ავეჯი - მაქს. 20,000 ₾",
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

  const getTariff = (
    variant: "variant1" | "variant2",
    area: number,
    isRented: boolean
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

    let date = new Date(today.getFullYear(), startMonth + monthsToAdd, day);

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
  const firstPayment = planDetails.payments[0].amount;

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
                <p>ბინის დაზღვევა</p>
              </div>
            </div>
          </div>
          <div className="calculator">
            <h1>ბინის დაზღვევის კალკულატორი</h1>

            {/* Variant Selection */}
            <div className="section">
              <h2>აირჩიეთ დაზღვევის ვარიანტი</h2>
              <div className="variantButtons">
                <button
                  className={`btn ${variant === "variant1" ? "active" : ""}`}
                  onClick={() => setVariant("variant1")}
                >
                  <span>ვარიანტი 1</span>
                  <small>დაბალი დაფარვა</small>
                  <small className="compensationInfo">
                    {TARIFFS.variant1.compensationLimit}
                  </small>
                </button>
                <button
                  className={`btn ${variant === "variant2" ? "active" : ""}`}
                  onClick={() => setVariant("variant2")}
                >
                  <span>ვარიანტი 2</span>
                  <small>მაღალი დაფარვა</small>
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
              <label>
                <input
                  type="checkbox"
                  checked={isRented}
                  onChange={(e) => setIsRented(e.target.checked)}
                />
                ბინა ქირავდება
              </label>
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
              {hasAdditionalCoverage && (
                <p className="info">ანაზღაურების ლიმიტი: 10,000 ₾</p>
              )}
            </div>

            {/* Payment Plan Selection */}
            <div className="section">
              <h2>გადახდის გრაფიკი</h2>
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
                            | "annual"
                        )
                      }
                    />
                    {option.label}
                  </label>
                ))}
              </div>
            </div>

            {/* Price Display */}
            <div className="priceBox">
              <div className="priceRow">
                <span>ძირითადი დაზღვევა:</span>
                <strong>{monthlyPrice} ₾/თვე</strong>
              </div>
              {hasAdditionalCoverage && (
                <div className="priceRow">
                  <span>დამატებითი დაფარვა:</span>
                  <strong>{additionalCoveragePrice} ₾/თვე</strong>
                </div>
              )}
              <div className="totalRow">
                <span>სულ თვეში:</span>
                <strong>{totalMonthly} ₾</strong>
              </div>
              <div className="totalRow">
                <span>სულ წელიწადში:</span>
                <strong>{totalYearly} ₾</strong>
              </div>

              {/* Payment Plan Breakdown */}
              <div className="paymentBreakdown">
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
                    {planDetails.payments.map((payment, index) => (
                      <div key={index} className="paymentItem">
                        <span>{payment.date}:</span>
                        <strong>{payment.amount} ₾</strong>
                      </div>
                    ))}
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
                    არჩეული: ვარიანტი {variant === "variant1" ? "1" : "2"}
                  </strong>{" "}
                  |<strong> ფართი: {area} მ²</strong>
                </p>
                <ul className="limitsList">
                  <li>
                    <span>შიდა მოპირკეთება:</span>
                    <strong>
                      {compensationLimits.interiorPerSqm} ₾/მ² × {area} მ² ={" "}
                      {compensationLimits.totalInterior} ₾
                    </strong>
                  </li>
                  <li>
                    <span>ავეჯი და ტექნიკა:</span>
                    <strong>მაქს. {compensationLimits.furniture} ₾</strong>
                  </li>
                  <li className="totalLimit">
                    <span>სულ ანაზღაურების ლიმიტი:</span>
                    <strong>{compensationLimits.total} ₾</strong>
                  </li>
                </ul>
              </div>
            </div>

            {/* Terms */}
            <div className="termsBox">
              <h3>ფრანშიზა</h3>
              <ul>
                <li>შიდა მოპირკეთებისთვის - 5% ზარალიდან, მინ. 100 ₾</li>
                <li>ავეჯი & ტექნიკა - 150 ₾</li>
                <li>დამატებითი დაფარვა - 100 ₾</li>
              </ul>
            </div>

            {/* Covered Risks */}
            <div className="risksBox">
              <h3>დაზღვეული რისკები</h3>
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
            </div>

            {/* CTA Button */}
            <button className="ctaButton" onClick={() => setShowForm(true)}>
              განაცხადის გაგრძელება
            </button>
          </div>
        </>
      )}
    </div>
  );
}
