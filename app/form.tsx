"use client";

import { useState, useEffect } from "react";

type Locale = "ka" | "en";

interface FormData {
  fullName: string;
  phoneNumber: string;
  email: string;
  idPhotoFile: File | null;
  areaSize: number;
  isRented: boolean;
  hasAdditionalCoverage: boolean;
  variant: "variant1" | "variant2";
  monthlyPrice: number;
  city: string;
  floor: string;
  apartmentNumber: string;
  address: string;
  cadastralCode: string;
  buildingYear: string;
  pdfAccepted: boolean;
  paymentPlan: "monthly" | "quarterly" | "semi-annual" | "annual";
}

interface FormProps {
  initialData?: {
    areaSize: number;
    isRented: boolean;
    hasAdditionalCoverage: boolean;
    variant: "variant1" | "variant2";
    monthlyPrice: number;
    paymentPlan: "monthly" | "quarterly" | "semi-annual" | "annual";
  };
  step?: 1 | 2 | 3;
  onStepChange?: (step: 1 | 2 | 3) => void;
  onClose?: () => void;
  locale?: Locale;
}

const CITIES = { ka: ["თბილისი", "ბათუმი", "რუსთავი"], en: ["Tbilisi", "Batumi", "Rustavi"] };
const FORM_STORAGE_KEY = "comfort_form_data";

function getSavedFormData(): Partial<FormData> | null {
  if (typeof window === "undefined") return null;
  try {
    const saved = localStorage.getItem(FORM_STORAGE_KEY);
    if (saved) return JSON.parse(saved);
  } catch {}
  return null;
}

function saveFormData(data: FormData) {
  if (typeof window === "undefined") return;
  try {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { idPhotoFile, ...serializable } = data;
    localStorage.setItem(FORM_STORAGE_KEY, JSON.stringify(serializable));
  } catch {}
}

function clearFormData() {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(FORM_STORAGE_KEY);
  } catch {}
}

export default function ApplicationForm({
  initialData,
  step: externalStep,
  onStepChange,
  onClose,
  locale = "ka",
}: FormProps) {
  const step = externalStep || 1;

  const [formData, setFormData] = useState<FormData>(() => {
    const saved = getSavedFormData();
    return {
      fullName: saved?.fullName || "",
      phoneNumber: saved?.phoneNumber || "",
      email: saved?.email || "",
      idPhotoFile: null,
      areaSize: initialData?.areaSize || saved?.areaSize || 50,
      isRented: initialData?.isRented ?? saved?.isRented ?? false,
      hasAdditionalCoverage:
        initialData?.hasAdditionalCoverage ??
        saved?.hasAdditionalCoverage ??
        false,
      variant: initialData?.variant || saved?.variant || "variant1",
      monthlyPrice: initialData?.monthlyPrice || saved?.monthlyPrice || 12,
      city: saved?.city || "თბილისი",
      floor: saved?.floor || "",
      apartmentNumber: saved?.apartmentNumber || "",
      address: saved?.address || "",
      cadastralCode: saved?.cadastralCode || "",
      buildingYear: saved?.buildingYear || "",
      pdfAccepted: saved?.pdfAccepted || false,
      paymentPlan: initialData?.paymentPlan || saved?.paymentPlan || "monthly",
    };
  });

  // Save form data to localStorage on every change
  useEffect(() => {
    saveFormData(formData);
  }, [formData]);

  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleCheckbox = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setFormData((prev) => ({ ...prev, [name]: checked }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setFormData((prev) => ({ ...prev, idPhotoFile: file }));
  };

  const handleNextStep = () => {
    if (step === 1 && !formData.pdfAccepted) {
      setError(locale === "ka" ? "გთხოვთ, დაეთანხმოთ პირობებს" : "Please accept the terms");
      return;
    }
    if (step === 2) {
      if (!formData.fullName || !formData.phoneNumber || !formData.email) {
        setError(locale === "ka" ? "გთხოვთ, შეავსოთ ყველა ველი" : "Please fill in all fields");
        return;
      }
    }
    setError("");
    if (onStepChange) {
      onStepChange((step + 1) as 1 | 2 | 3);
    }
  };

  const handlePrevStep = () => {
    if (onStepChange) {
      onStepChange((step - 1) as 1 | 2 | 3);
    }
    setError("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    if (!formData.address || !formData.floor || !formData.apartmentNumber) {
      setError(locale === "ka" ? "გთხოვთ, შეავსოთ მისამართის ყველა ველი" : "Please fill in all address fields");
      setLoading(false);
      return;
    }

    if (!formData.idPhotoFile) {
      setError(locale === "ka" ? "გთხოვთ, ატვირთოთ პირადობის მოწმობის ფოტო" : "Please upload ID photo");
      setLoading(false);
      return;
    }

    try {
      const formDataToSend = new FormData();
      formDataToSend.append("fullName", formData.fullName);
      formDataToSend.append("phoneNumber", formData.phoneNumber);
      formDataToSend.append("email", formData.email);
      formDataToSend.append("areaSize", formData.areaSize.toString());
      formDataToSend.append("isRented", formData.isRented.toString());
      formDataToSend.append(
        "hasAdditionalCoverage",
        formData.hasAdditionalCoverage.toString(),
      );
      formDataToSend.append("variant", formData.variant);
      formDataToSend.append("monthlyPrice", formData.monthlyPrice.toString());
      formDataToSend.append("city", formData.city);
      formDataToSend.append("floor", formData.floor);
      formDataToSend.append("apartmentNumber", formData.apartmentNumber);
      formDataToSend.append("address", formData.address);
      formDataToSend.append("cadastralCode", formData.cadastralCode);
      formDataToSend.append("buildingYear", formData.buildingYear);
      formDataToSend.append("paymentPlan", formData.paymentPlan);

      if (formData.idPhotoFile) {
        formDataToSend.append("idPhoto", formData.idPhotoFile);
      }

      const response = await fetch("/api/submit-application", {
        method: "POST",
        body: formDataToSend,
      });

      if (!response.ok) {
        throw new Error("Failed to submit application");
      }

      clearFormData();
      setSubmitted(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : (locale === "ka" ? "დაფიქსირდა შეცდომა" : "An error occurred"));
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="container">
        <div className="header">{/* header */}</div>
        <div className="successBox">
          <h1>✓ {locale === "ka" ? "თქვენი განაცხადი გაიგზავნა!" : "Your application has been submitted!"}</h1>
          <p>{locale === "ka" ? "24 სთ განმავლობაში პოლისს მიიღებთ მეილზე" : "You will receive the policy on your email within 24 hours"}</p>
          <p className="email">
            {locale === "ka" ? "მეილი გაიგზავნა:" : "Email sent to:"} <strong>{formData.email}</strong>
          </p>
          <button
            className="ctaButton"
            onClick={() => window.location.reload()}
          >
            {locale === "ka" ? "ახალი განაცხადი" : "New Application"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      <div className="form">
        {onClose && (
          <button className="closeBtn" onClick={onClose}>
            ✕
          </button>
        )}

        <h1>{locale === "ka" ? "დაზღვევის განაცხადი" : "Insurance Application"}</h1>
        <p style={{ textAlign: "center", color: "#666", marginBottom: "20px" }}>
          {locale === "ka" ? "ნაბიჯი" : "Step"} {step} / 3
        </p>

        <div className="summary">
          <h3>{locale === "ka" ? "დაზღვევის პარამეტრები:" : "Insurance Parameters:"}</h3>
          <div className="summaryGrid">
            <div className="summaryItem">
              <span>{locale === "ka" ? "ფართი:" : "Area:"}</span>
              <strong>{formData.areaSize} {locale === "ka" ? "მ²" : "m²"}</strong>
            </div>
            <div className="summaryItem">
              <span>{locale === "ka" ? "პაკეტი:" : "Package:"}</span>
              <strong>
                {formData.variant === "variant1" ? (locale === "ka" ? "სტანდარტი" : "Standard") : (locale === "ka" ? "პრემიუმი" : "Premium")}
              </strong>
            </div>
            <div className="summaryItem">
              <span>{locale === "ka" ? "ყოველთვიური ფასი:" : "Monthly Price:"}</span>
              <strong>{formData.monthlyPrice} ₾</strong>
            </div>
          </div>
        </div>

        {/* STEP 1: PDF & Terms */}
        {step === 1 && (
          <div className="formContent">
            <div className="pdfSection">
              <h3>{locale === "ka" ? "დაზღვევის პირობები" : "Insurance Terms"}</h3>
              <p>{locale === "ka" ? "გთხოვთ, გაეცნოთ დაზღვევის ხელშეკრულების პირობებს:" : "Please read the insurance contract terms:"}</p>
              <a
                href="/RPI-001 18.pdf"
                target="_blank"
                rel="noopener noreferrer"
                className="pdfLink"
              >
                📄 RPI-001 18.pdf - {locale === "ka" ? "დაზღვევის პირობები" : "Insurance Terms"}
              </a>
              <div className="franchiseSection">
                <h3>{locale === "ka" ? "ფრანშიზა" : "Franchise"}</h3>
                <ul>
                  <li>{locale === "ka" ? "შიდა მოპირკეთებისთვის - 5% ზარალიდან, მინ. 100 ₾" : "Interior finish - 5% of damage, min. 100 ₾"}</li>
                  <li>{locale === "ka" ? "ავეჯი & ტექნიკა - 150 ₾" : "Furniture & appliances - 150 ₾"}</li>
                  <li>{locale === "ka" ? "დამატებითი დაფარვა - 100 ₾" : "Additional coverage - 100 ₾"}</li>
                </ul>
              </div>

              <label className="checkboxLabel">
                <input
                  type="checkbox"
                  name="pdfAccepted"
                  checked={formData.pdfAccepted}
                  onChange={handleCheckbox}
                />
                <span>{locale === "ka" ? "გავეცანი და ვეთანხმები პირობებს" : "I have read and agree to the terms"}</span>
              </label>
            </div>

            {error && <div className="error">{error}</div>}

            <button className="nextButton" onClick={handleNextStep}>
              {locale === "ka" ? "შემდეგი ნაბიჯი" : "Next Step"}
            </button>
          </div>
        )}

        {/* STEP 2: Personal Info */}
        {step === 2 && (
          <form className="formContent">
            <div className="formGroup">
              <label>{locale === "ka" ? "სახელი და გვარი *" : "Full Name *"}</label>
              <input
                type="text"
                name="fullName"
                value={formData.fullName}
                onChange={handleInputChange}
                placeholder={locale === "ka" ? "მაგ: გიორგი ვაშაძე" : "e.g. John Smith"}
                required
              />
            </div>

            <div className="formGroup">
              <label>{locale === "ka" ? "ტელეფონი *" : "Phone *"}</label>
              <input
                type="tel"
                name="phoneNumber"
                value={formData.phoneNumber}
                onChange={handleInputChange}
                placeholder={locale === "ka" ? "მაგ: +995 5XX XXX XXX" : "e.g. +995 5XX XXX XXX"}
                required
              />
            </div>

            <div className="formGroup">
              <label>{locale === "ka" ? "ელ-ფოსტა *" : "Email *"}</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                placeholder={locale === "ka" ? "თქვენი@მეილი.com" : "your@email.com"}
                required
              />
            </div>

            {error && <div className="error">{error}</div>}

            <div className="buttonGroup">
              <button
                type="button"
                className="prevButton"
                onClick={handlePrevStep}
              >
                ← {locale === "ka" ? "უკან" : "Back"}
              </button>
              <button
                type="button"
                className="nextButton"
                onClick={handleNextStep}
              >
                {locale === "ka" ? "შემდეგი ნაბიჯი" : "Next Step"}
              </button>
            </div>
          </form>
        )}

        {/* STEP 3: Address & Upload */}
        {step === 3 && (
          <form onSubmit={handleSubmit} className="formContent">
            <div className="formGroup">
              <label>{locale === "ka" ? "ქალაქი *" : "City *"}</label>
              <select
                name="city"
                value={formData.city}
                onChange={handleInputChange}
                required
              >
                {CITIES[locale].map((city, idx) => (
                  <option key={city} value={CITIES.ka[idx]}>
                    {city}
                  </option>
                ))}
              </select>
            </div>

            <div className="formGroup">
              <label>{locale === "ka" ? "ზუსტი მისამართი *" : "Exact Address *"}</label>
              <input
                type="text"
                name="address"
                value={formData.address}
                onChange={handleInputChange}
                placeholder={locale === "ka" ? "მაგ: ვაჟა-ფშაველას ქ. 12" : "e.g. 12 Main Street"}
                required
              />
            </div>

            <div className="twoColumn">
              <div className="formGroup">
                <label>{locale === "ka" ? "სართული *" : "Floor *"}</label>
                <input
                  type="text"
                  name="floor"
                  value={formData.floor}
                  onChange={handleInputChange}
                  placeholder={locale === "ka" ? "მაგ: 3" : "e.g. 3"}
                  required
                />
              </div>

              <div className="formGroup">
                <label>{locale === "ka" ? "ბინის ნომერი *" : "Apartment # *"}</label>
                <input
                  type="text"
                  name="apartmentNumber"
                  value={formData.apartmentNumber}
                  onChange={handleInputChange}
                  placeholder={locale === "ka" ? "მაგ: 15" : "e.g. 15"}
                  required
                />
              </div>
            </div>

            <div className="twoColumn">
              <div className="formGroup">
                <label>{locale === "ka" ? "საკადასტრო კოდი" : "Cadastral Code"}</label>
                <input
                  type="text"
                  name="cadastralCode"
                  value={formData.cadastralCode}
                  onChange={handleInputChange}
                  placeholder={locale === "ka" ? "მაგ: 01-12-34-567-890" : "e.g. 01-12-34-567-890"}
                />
              </div>

              <div className="formGroup">
                <label>{locale === "ka" ? "შენობის აშენების წელი" : "Building Year"}</label>
                <input
                  type="number"
                  name="buildingYear"
                  value={formData.buildingYear}
                  onChange={handleInputChange}
                  placeholder={locale === "ka" ? "მაგ: 2015" : "e.g. 2015"}
                  min="1900"
                  max={new Date().getFullYear()}
                />
              </div>
            </div>

            <div className="formGroup">
              <label>{locale === "ka" ? "პირადობის მოწმობის სურათი *" : "ID Photo *"}</label>
              <div
                className="fileUploadArea"
                onClick={() => document.getElementById("idPhotoInput")?.click()}
              >
                <input
                  id="idPhotoInput"
                  type="file"
                  name="idPhoto"
                  onChange={handleFileChange}
                  accept="image/*,.pdf"
                  style={{ display: "none" }}
                />
                {formData.idPhotoFile ? (
                  <div className="fileUploaded">
                    <span className="fileIcon">✓</span>
                    <p className="fileName">{formData.idPhotoFile.name}</p>
                    <span className="fileChange">{locale === "ka" ? "შეცვლა" : "Change"}</span>
                  </div>
                ) : (
                  <div className="filePrompt">
                    <span className="uploadIcon">📷</span>
                    <p>{locale === "ka" ? "ატვირთეთ ფოტო ან PDF" : "Upload photo or PDF"}</p>
                    <span className="uploadHint">{locale === "ka" ? "დააჭირეთ ასარჩევად" : "Click to select"}</span>
                  </div>
                )}
              </div>
            </div>

            {error && <div className="error">{error}</div>}

            <div className="buttonGroup">
              <button
                type="button"
                className="prevButton"
                onClick={handlePrevStep}
              >
                ← {locale === "ka" ? "უკან" : "Back"}
              </button>
              <button type="submit" className="submitButton" disabled={loading}>
                {loading ? (locale === "ka" ? "იგზავნება..." : "Sending...") : (locale === "ka" ? "✓ განაცხადის გაგზავნა" : "✓ Submit Application")}
              </button>
            </div>
          </form>
        )}

        <p className="disclaimer">
          {locale === "ka" 
            ? "თქვენი პირადი მონაცემები დაცული იქნება ჩვენი კონფიდენციალურობის პოლიტიკის მიხედვით"
            : "Your personal data will be protected according to our privacy policy"}
        </p>
      </div>
    </div>
  );
}
