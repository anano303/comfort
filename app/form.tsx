"use client";

import { useState, useEffect } from "react";

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
}

const CITIES = ["თბილისი", "ბათუმი", "რუსთავი"];
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
}: FormProps) {
  const step = externalStep || 1;
  const [pdfViewed, setPdfViewed] = useState(false);

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
      setError("გთხოვთ, დაეთანხმოთ პირობებს");
      return;
    }
    if (step === 2) {
      if (!formData.fullName || !formData.phoneNumber || !formData.email) {
        setError("გთხოვთ, შეავსოთ ყველა ველი");
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
      setError("გთხოვთ, შეავსოთ მისამართის ყველა ველი");
      setLoading(false);
      return;
    }

    if (!formData.idPhotoFile) {
      setError("გთხოვთ, ატვირთოთ პირადობის მოწმობის ფოტო");
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
      setError(err instanceof Error ? err.message : "დაფიქსირდა შეცდომა");
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="container">
        <div className="header">{/* header */}</div>
        <div className="successBox">
          <h1>✓ თქვენი განაცხადი გაიგზავნა!</h1>
          <p> 24 სთ განმავლობაში პოლისს მიიღებთ მეილზე </p>
          <p className="email">
            მეილი გაიგზავნა: <strong>{formData.email}</strong>
          </p>
          <button
            className="ctaButton"
            onClick={() => window.location.reload()}
          >
            ახალი განაცხადი
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

        <h1>დაზღვევის განაცხადი</h1>
        <p style={{ textAlign: "center", color: "#666", marginBottom: "20px" }}>
          ნაბიჯი {step} / 3
        </p>

        <div className="summary">
          <h3>დაზღვევის პარამეტრები:</h3>
          <div className="summaryGrid">
            <div className="summaryItem">
              <span>ფართი:</span>
              <strong>{formData.areaSize} მ²</strong>
            </div>
            <div className="summaryItem">
              <span>პაკეტი:</span>
              <strong>
                {formData.variant === "variant1" ? "სტანდარტი" : "პრემიუმი"}
              </strong>
            </div>
            <div className="summaryItem">
              <span>ყოველთვიური ფასი:</span>
              <strong>{formData.monthlyPrice} ₾</strong>
            </div>
          </div>
        </div>

        {/* STEP 1: PDF & Terms */}
        {step === 1 && (
          <div className="formContent">
            <div className="pdfSection">
              <h3>დაზღვევის პირობები</h3>
              <p>გთხოვთ, გაეცნოთ დაზღვევის ხელშეკრულების პირობებს:</p>
              <a
                href="/RPI-001 18.pdf"
                target="_blank"
                rel="noopener noreferrer"
                className="pdfLink"
              >
                📄 RPI-001 18.pdf - დაზღვევის პირობები
              </a>
              <div className="franchiseSection">
                <h3>ფრანშიზა</h3>
                <ul>
                  <li>შიდა მოპირკეთებისთვის - 5% ზარალიდან, მინ. 100 ₾</li>
                  <li>ავეჯი & ტექნიკა - 150 ₾</li>
                  <li>დამატებითი დაფარვა - 100 ₾</li>
                </ul>
              </div>

              <label className="checkboxLabel">
                <input
                  type="checkbox"
                  name="pdfAccepted"
                  checked={formData.pdfAccepted}
                  onChange={handleCheckbox}
                />
                <span>გავეცანი და ვეთანხმები პირობებს</span>
              </label>
            </div>

            {error && <div className="error">{error}</div>}

            <button className="nextButton" onClick={handleNextStep}>
              შემდეგი ნაბიჯი
            </button>
          </div>
        )}

        {/* STEP 2: Personal Info */}
        {step === 2 && (
          <form className="formContent">
            <div className="formGroup">
              <label>სახელი და გვარი *</label>
              <input
                type="text"
                name="fullName"
                value={formData.fullName}
                onChange={handleInputChange}
                placeholder="მაგ: გიორგი ვაშაძე"
                required
              />
            </div>

            <div className="formGroup">
              <label>ტელეფონი *</label>
              <input
                type="tel"
                name="phoneNumber"
                value={formData.phoneNumber}
                onChange={handleInputChange}
                placeholder="მაგ: +995 5XX XXX XXX"
                required
              />
            </div>

            <div className="formGroup">
              <label>ელ-ფოსტა *</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                placeholder="თქვენი@მეილი.com"
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
                ← უკან
              </button>
              <button
                type="button"
                className="nextButton"
                onClick={handleNextStep}
              >
                შემდეგი ნაბიჯი
              </button>
            </div>
          </form>
        )}

        {/* STEP 3: Address & Upload */}
        {step === 3 && (
          <form onSubmit={handleSubmit} className="formContent">
            <div className="formGroup">
              <label>ქალაქი *</label>
              <select
                name="city"
                value={formData.city}
                onChange={handleInputChange}
                required
              >
                {CITIES.map((city) => (
                  <option key={city} value={city}>
                    {city}
                  </option>
                ))}
              </select>
            </div>

            <div className="formGroup">
              <label>ზუსტი მისამართი *</label>
              <input
                type="text"
                name="address"
                value={formData.address}
                onChange={handleInputChange}
                placeholder="მაგ: ვაჟა-ფშაველას ქ. 12"
                required
              />
            </div>

            <div className="twoColumn">
              <div className="formGroup">
                <label>სართული *</label>
                <input
                  type="text"
                  name="floor"
                  value={formData.floor}
                  onChange={handleInputChange}
                  placeholder="მაგ: 3"
                  required
                />
              </div>

              <div className="formGroup">
                <label>ბინის ნომერი *</label>
                <input
                  type="text"
                  name="apartmentNumber"
                  value={formData.apartmentNumber}
                  onChange={handleInputChange}
                  placeholder="მაგ: 15"
                  required
                />
              </div>
            </div>

            <div className="twoColumn">
              <div className="formGroup">
                <label>საკადასტრო კოდი</label>
                <input
                  type="text"
                  name="cadastralCode"
                  value={formData.cadastralCode}
                  onChange={handleInputChange}
                  placeholder="მაგ: 01-12-34-567-890"
                />
              </div>

              <div className="formGroup">
                <label>შენობის აშენების წელი</label>
                <input
                  type="number"
                  name="buildingYear"
                  value={formData.buildingYear}
                  onChange={handleInputChange}
                  placeholder="მაგ: 2015"
                  min="1900"
                  max={new Date().getFullYear()}
                />
              </div>
            </div>

            <div className="formGroup">
              <label>პირადობის მოწმობის სურათი *</label>
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
                    <span className="fileChange">შეცვლა</span>
                  </div>
                ) : (
                  <div className="filePrompt">
                    <span className="uploadIcon">📷</span>
                    <p>ატვირთეთ ფოტო ან PDF</p>
                    <span className="uploadHint">დააჭირეთ ასარჩევად</span>
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
                ← უკან
              </button>
              <button type="submit" className="submitButton" disabled={loading}>
                {loading ? "იგზავნება..." : "✓ განაცხადის გაგზავნა"}
              </button>
            </div>
          </form>
        )}

        <p className="disclaimer">
          თქვენი პირადი მონაცემები დაცული იქნება ჩვენი კონფიდენციალურობის
          პოლიტიკის მიხედვით
        </p>
      </div>
    </div>
  );
}
