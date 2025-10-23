import { NextRequest, NextResponse } from "next/server";
import nodemailer from "nodemailer";

// Payment plan helper functions
function getPaymentPlanLabel(plan: string): string {
  switch (plan) {
    case "monthly":
      return "ყოველთვიური";
    case "quarterly":
      return "კვარტლური";
    case "semi-annual":
      return "ორჯერადი";
    case "annual":
      return "წლიური (ერთჯერადი)";
    default:
      return plan;
  }
}

function getPaymentPlanDescription(plan: string, monthlyPrice: number): string {
  const monthly = monthlyPrice;
  const quarterly = monthly * 3;
  const semiAnnual = monthly * 6;
  const annual = monthly * 12;

  // Helper to format dates
  const getPaymentDate = (monthsToAdd: number): string => {
    const today = new Date();
    const day = 23;

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

  switch (plan) {
    case "monthly":
      // 11 გადახდა: პირველი 2 თვე, შემდეგ 9 თვე ყოველთვიური
      const monthlyItems = [
        `<li><strong>${getPaymentDate(
          0
        )}</strong> - პირველი შესატანი: <strong>${monthly * 2} ₾</strong></li>`,
      ];
      for (let i = 1; i <= 10; i++) {
        monthlyItems.push(
          `<li><strong>${getPaymentDate(
            i + 1
          )}</strong>: <strong>${monthly} ₾</strong></li>`
        );
      }
      return `<ul>${monthlyItems.join("")}</ul>`;

    case "quarterly":
      // 4 გადახდა: (1-3 და 12 თვე), 4-6 თვე, 7-9 თვე, 10-11 თვე
      const firstQuarterlyAmount = monthly * 4;
      const secondQuarterlyAmount = monthly * 3;
      const thirdQuarterlyAmount = monthly * 3;
      const fourthQuarterlyAmount = monthly * 2;
      return `
      <ul>
        <li><strong>${getPaymentDate(
          0
        )}</strong> - I კვარტალი (1-3 და 12 თვე): <strong>${firstQuarterlyAmount} ₾</strong></li>
        <li><strong>${getPaymentDate(
          3
        )}</strong> - II კვარტალი (4-6 თვე): <strong>${secondQuarterlyAmount} ₾</strong></li>
        <li><strong>${getPaymentDate(
          6
        )}</strong> - III კვარტალი (7-9 თვე): <strong>${thirdQuarterlyAmount} ₾</strong></li>
        <li><strong>${getPaymentDate(
          10
        )}</strong> - IV კვარტალი (10-11 თვე): <strong>${fourthQuarterlyAmount} ₾</strong></li>
        <li><em>სულ: ${annual} ₾</em></li>
      </ul>`;

    case "semi-annual":
      return `
      <ul>
        <li><strong>${getPaymentDate(
          0
        )}</strong> - პირველი თანხა (1-7 თვე): <strong>${
        monthly * 7
      } ₾</strong></li>
        <li><strong>${getPaymentDate(
          7
        )}</strong> - მეორე თანხა (8-12 თვე): <strong>${
        monthly * 5
      } ₾</strong></li>
        <li><em>სულ: ${annual} ₾</em></li>
      </ul>`;

    case "annual":
      return `
      <ul>
        <li><strong>${getPaymentDate(
          0
        )}</strong> - ერთჯერადი გადახდა: <strong>${annual} ₾</strong></li>
      </ul>`;

    default:
      return "<p>გადახდის განრიგი</p>";
  }
}

// Configure email transporter
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();

    const fullName = formData.get("fullName") as string;
    const phoneNumber = formData.get("phoneNumber") as string;
    const email = formData.get("email") as string;
    const areaSize = formData.get("areaSize") as string;
    const isRented = formData.get("isRented") as string;
    const hasAdditionalCoverage = formData.get(
      "hasAdditionalCoverage"
    ) as string;
    const variant = formData.get("variant") as string;
    const monthlyPrice = formData.get("monthlyPrice") as string;
    const city = formData.get("city") as string;
    const floor = formData.get("floor") as string;
    const apartmentNumber = formData.get("apartmentNumber") as string;
    const address = formData.get("address") as string;
    const paymentPlan = formData.get("paymentPlan") as string;
    const idPhotoFile = formData.get("idPhoto") as File | null;

    // Validate required fields
    if (!fullName || !phoneNumber || !email) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    let attachments: any[] = [];

    // Handle file attachment
    if (idPhotoFile) {
      const bytes = await idPhotoFile.arrayBuffer();
      const buffer = Buffer.from(bytes);

      attachments.push({
        filename: idPhotoFile.name,
        content: buffer,
      });
    }

    // Compose email
    const emailContent = `
    <h2>ახალი დაზღვევის განაცხადი</h2>
    
    <h3>მომხმარებლის ინფორმაცია:</h3>
    <ul>
      <li><strong>სახელი:</strong> ${fullName}</li>
      <li><strong>ტელეფონი:</strong> ${phoneNumber}</li>
      <li><strong>ელ-მეილი:</strong> ${email}</li>
    </ul>
    
    <h3>ბინის მისამართი:</h3>
    <ul>
      <li><strong>ქალაქი:</strong> ${city}</li>
      <li><strong>მისამართი:</strong> ${address}</li>
      <li><strong>სართული:</strong> ${floor}</li>
      <li><strong>ბინის ნომერი:</strong> ${apartmentNumber}</li>
    </ul>
    
    <h3>დაზღვევის პარამეტრები:</h3>
    <ul>
      <li><strong>ბინის ფართი:</strong> ${areaSize} მ²</li>
      <li><strong>დაზღვევის ვარიანტი:</strong> ვარიანტი ${
        variant === "variant1" ? "1" : "2"
      }</li>
      <li><strong>ყოველთვიური ფასი:</strong> ${monthlyPrice} ₾</li>
      <li><strong>ბინა ქირავდება:</strong> ${
        isRented === "true" ? "დიახ" : "არა"
      }</li>
      <li><strong>დამატებითი დაფარვა:</strong> ${
        hasAdditionalCoverage === "true" ? "დიახ" : "არა"
      }</li>
      <li><strong>გადახდის გრაფიკი:</strong> ${getPaymentPlanLabel(
        paymentPlan
      )}</li>
    </ul>
    
    <h3>გადახდის განრიგი:</h3>
    ${getPaymentPlanDescription(paymentPlan, parseInt(monthlyPrice))}
    
    <p><em>პირადობის მოწმობის ფოტო დაყენებულია ფაილით.</em></p>
    `;

    // Send email to admin
    await transporter.sendMail({
      from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
      to: process.env.ADMIN_EMAIL || "info@primeinsurance.ge",
      subject: `ახალი დაზღვევის განაცხადი - ${fullName}`,
      html: emailContent,
      attachments,
    });

    // Send confirmation email to user
    await transporter.sendMail({
      from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
      to: email,
      subject: "თქვენი განაცხადი მიღებულია - PRIME Insurance",
      html: `
      <h2>მადლობთ რომ აგვირჩიეთ!  </h2>
      <p>მოგესალამებით, ${fullName}!</p>
      <p>თქვენი დაზღვევის განაცხადი წარმატებით გაიგზავნა.</p>
      <p>პოლისს მეილზე მიიღებთ 24 საათის განმავლობაში. საჭიროების შემთხვევაში ჩვენი წარმომადგენელი  დაგიკავშირდებათ ${phoneNumber} ნომერზე.</p>
      <p><strong>დაზღვევის დეტალები:</strong></p>
      <ul>
        <li>ფართი: ${areaSize} მ²</li>
        <li>ვარიანტი: ვარიანტი ${variant === "variant1" ? "1" : "2"}</li>
        <li>ყოველთვიური ფასი: ${monthlyPrice} ₾</li>
      </ul>
      <p>Best regards,<br/>PRIME Insurance Team</p>
      `,
    });

    return NextResponse.json(
      { message: "Application submitted successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error submitting application:", error);
    return NextResponse.json(
      { error: "Failed to submit application" },
      { status: 500 }
    );
  }
}
