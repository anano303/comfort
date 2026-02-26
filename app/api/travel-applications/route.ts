import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/app/lib/auth";
import { db } from "@/app/lib/db";
import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = session.user as { id: string; role: string };

  if (user.role === "admin") {
    return NextResponse.json(await db.getAllApplications());
  } else {
    return NextResponse.json(await db.getApplicationsByAgent(user.id));
  }
}

export async function POST(request: NextRequest) {
  const session = await auth();
  const formData = await request.formData();

  // Agent info (if logged in)
  const agentId = session?.user ? (session.user as { id: string }).id : "guest";
  const agentName = session?.user?.name || "Guest";
  const agentEmail = session?.user?.email || "guest";

  const firstName = formData.get("firstName") as string;
  const lastName = formData.get("lastName") as string;
  const passportNumber = formData.get("passportNumber") as string;
  const idNumber = formData.get("idNumber") as string;
  const nationality = formData.get("nationality") as string;
  const dateOfBirth = formData.get("dateOfBirth") as string;
  const gender = formData.get("gender") as string;
  const email = formData.get("email") as string;
  const phone = formData.get("phone") as string;
  const address = formData.get("address") as string;
  const visitPurpose = formData.get("visitPurpose") as string;
  const visitDetail = formData.get("visitDetail") as string;
  const product = formData.get("product") as string;
  const plan = formData.get("plan") as string;
  const period = formData.get("period") as string;
  const days = parseInt(formData.get("days") as string) || 0;
  const startDate = formData.get("startDate") as string;
  const endDate = formData.get("endDate") as string;
  const premium = parseFloat(formData.get("premium") as string) || 0;
  const isOver65 = formData.get("isOver65") === "true";
  const isStudent = formData.get("isStudent") === "true";
  const coverageLimit = parseInt(formData.get("coverageLimit") as string) || 0;
  const passportFile = formData.get("passportFile") as File | null;

  if (!firstName || !lastName || !passportNumber || !email || !phone) {
    return NextResponse.json(
      { error: "Missing required fields" },
      { status: 400 },
    );
  }

  // Save to database
  const application = await db.createApplication({
    agentId,
    agentName,
    agentEmail,
    firstName,
    lastName,
    passportNumber,
    idNumber,
    nationality,
    dateOfBirth,
    gender,
    email,
    phone,
    address,
    visitPurpose,
    visitDetail,
    product,
    plan,
    period,
    days,
    startDate,
    endDate,
    premium,
    isOver65,
    isStudent,
    coverageLimit,
    passportPhotoFileName: passportFile?.name,
  });

  // Prepare email attachment
  const attachments: { filename: string; content: Buffer }[] = [];
  if (passportFile) {
    const bytes = await passportFile.arrayBuffer();
    attachments.push({
      filename: passportFile.name,
      content: Buffer.from(bytes),
    });
  }

  // Send email to admin
  const purposeLabel =
    visitPurpose === "tourist"
      ? "ტურისტული"
      : visitPurpose === "student"
        ? "სტუდენტური"
        : "სამუშაო";

  try {
    // 1. Email to admin
    await transporter.sendMail({
      from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
      to: process.env.ADMIN_EMAIL,
      subject: `ახალი ტურისტული დაზღვევის განაცხადი - ${firstName} ${lastName} - PRIME Insurance`,
      html: `
        <h2>ახალი ტურისტული დაზღვევის განაცხადი</h2>
        <h3>კლიენტის ინფორმაცია:</h3>
        <ul>
          <li><strong>სახელი:</strong> ${firstName} ${lastName}</li>
          <li><strong>პასპორტი:</strong> ${passportNumber}</li>
          <li><strong>პირადი ნომერი:</strong> ${idNumber}</li>
          <li><strong>მოქალაქეობა:</strong> ${nationality}</li>
          <li><strong>დაბადების თარიღი:</strong> ${dateOfBirth}</li>
          <li><strong>სქესი:</strong> ${gender}</li>
          <li><strong>ელ-ფოსტა:</strong> ${email}</li>
          <li><strong>ტელეფონი:</strong> ${phone}</li>
          <li><strong>მისამართი:</strong> ${address}</li>
          <li><strong>ვიზიტის მიზანი:</strong> ${purposeLabel}</li>
          ${visitDetail ? `<li><strong>დეტალი:</strong> ${visitDetail}</li>` : ""}
        </ul>
        <h3>დაზღვევის დეტალები:</h3>
        <ul>
          <li><strong>პროდუქტი:</strong> ${product} (${plan})</li>
          <li><strong>პერიოდი:</strong> ${period}</li>
          <li><strong>თარიღი:</strong> ${startDate} → ${endDate}</li>
          <li><strong>ლიმიტი:</strong> ${coverageLimit.toLocaleString()} ₾</li>
          <li><strong>პრემია:</strong> ${premium} ₾</li>
          <li><strong>65+:</strong> ${isOver65 ? "დიახ" : "არა"}</li>
          <li><strong>სტუდენტი:</strong> ${isStudent ? "დიახ" : "არა"}</li>
        </ul>
        <h3>აგენტი:</h3>
        <ul>
          <li><strong>სახელი:</strong> ${agentName}</li>
          <li><strong>ელ-ფოსტა:</strong> ${agentEmail}</li>
        </ul>
      `,
      attachments,
    });

    // 2. Confirmation email to buyer with Invoice
    if (email) {
      const invoiceNumber = `M/MO/R/${String(application.id).slice(-6).toUpperCase()}/${new Date().getFullYear().toString().slice(-2)}`;
      const invoiceDate = new Date().toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      });
      const insuranceType = `${product} (${plan})`;

      const invoiceHtml = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0; padding:0; background:#f4f4f4;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f4;">
<tr><td align="center" style="padding:20px 10px;">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" style="background:white; border-radius:8px; overflow:hidden; max-width:600px; width:100%;">

  <!-- Top Banner -->
  <tr><td style="background:#333366; padding:20px; text-align:center;">
    <img src="https://travelprime.vercel.app/primeLogo.png" alt="PRIME Insurance" width="140" style="display:block; margin:0 auto 8px;" />
    <p style="color:rgba(255,255,255,0.8); font-size:11px; margin:0; font-family:Arial,sans-serif;">Foreign and Nonresident Person's Health and Personal Accident Insurance</p>
  </td></tr>

  <!-- Greeting -->
  <tr><td style="padding:20px 20px 10px; font-family:Arial,sans-serif;">
    <p style="font-size:14px; color:#333; margin:0 0 8px;">Dear <strong>${firstName} ${lastName}</strong>,</p>
    <p style="font-size:13px; color:#555; margin:0 0 6px; line-height:1.5;">Thank you for applying for insurance with PRIME Insurance. Please find your invoice below.</p>
    <p style="font-size:13px; color:#555; margin:0; line-height:1.5;">მადლობას გიხდით PRIME Insurance-ში განაცხადის გაკეთებისათვის. ქვემოთ იხილეთ თქვენი ინვოისი.</p>
  </td></tr>

  <!-- Invoice Title -->
  <tr><td style="padding:15px 20px 5px; text-align:center; font-family:Arial,sans-serif;">
    <h1 style="font-size:20px; color:#333366; margin:0;">ინვოისი / Invoice</h1>
    <p style="font-size:12px; color:#555; margin:4px 0; font-weight:600;">${invoiceNumber}</p>
    <p style="font-size:12px; color:#888; margin:2px 0;">${invoiceDate}</p>
  </td></tr>

  <!-- Divider -->
  <tr><td style="padding:0 20px;"><div style="border-top:2px solid #333366;"></div></td></tr>

  <!-- Bank Details -->
  <tr><td style="padding:15px 20px; font-family:Arial,sans-serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="font-size:11px; color:#555;">
      <tr>
        <td style="padding:2px 0; vertical-align:top; width:50%;">
          <strong style="color:#333;">მიმღები / Recipient:</strong><br/>
          სს სადაზღვევო კომპანია პრაიმი<br/>
          JSC Prime Insurance
        </td>
        <td style="padding:2px 0; vertical-align:top; text-align:right;">
          <strong style="color:#333;">ბანკი / Bank:</strong><br/>
          სს საქართველოს ბანკი / Bank Of Georgia JSC<br/>
          კოდი / Code: BAGAGE22
        </td>
      </tr>
      <tr><td colspan="2" style="padding:6px 0 0; text-align:center; font-size:13px; font-weight:700; color:#333366; letter-spacing:0.5px;">
        GE71BG0000000622481900
      </td></tr>
    </table>
  </td></tr>

  <!-- Insurance Details -->
  <tr><td style="padding:5px 20px 10px; font-family:Arial,sans-serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="font-size:12px;">
      <tr>
        <td style="padding:6px 0; color:#777; border-bottom:1px solid #eee;">დაზღვევის სახეობა / Type:</td>
        <td style="padding:6px 0; text-align:right; font-weight:600; color:#333; border-bottom:1px solid #eee;">${insuranceType}</td>
      </tr>
      <tr>
        <td style="padding:6px 0; color:#777; border-bottom:1px solid #eee;">დაზღვეული / Insured:</td>
        <td style="padding:6px 0; text-align:right; font-weight:600; color:#333; border-bottom:1px solid #eee;">${firstName} ${lastName}</td>
      </tr>
      <tr>
        <td style="padding:6px 0; color:#777;">პერიოდი / Period:</td>
        <td style="padding:6px 0; text-align:right; font-weight:600; color:#333;">${startDate} → ${endDate}</td>
      </tr>
    </table>
  </td></tr>

  <!-- Premium Box -->
  <tr><td style="padding:10px 20px; font-family:Arial,sans-serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#333366; border-radius:8px; overflow:hidden;">
      <tr>
        <td style="padding:14px 16px; color:rgba(255,255,255,0.8); font-size:11px; font-family:Arial,sans-serif;">
          პროდუქტი / Product<br/>
          <strong style="color:white; font-size:13px;">${product} (${plan})</strong>
        </td>
        <td style="padding:14px 16px; text-align:center; font-family:Arial,sans-serif;">
          <span style="color:rgba(255,255,255,0.7); font-size:10px; display:block;">ჯამური პრემია / Total Premium</span>
          <strong style="color:white; font-size:22px;">${premium} ₾</strong>
        </td>
        <td style="padding:14px 16px; text-align:right; color:rgba(255,255,255,0.7); font-size:11px; font-family:Arial,sans-serif;">
          ვალუტა<br/>
          <strong style="color:white; font-size:12px;">GEL</strong>
        </td>
      </tr>
    </table>
  </td></tr>

  <!-- Payment Instructions -->
  <tr><td style="padding:15px 20px; font-family:Arial,sans-serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f0faf8; border:1px solid #c8e6df; border-radius:8px;">
      <tr><td style="padding:16px;">
        <h3 style="color:#333366; margin:0 0 10px; font-size:13px; text-align:center;">💳 გადახდის ინსტრუქცია / Payment Instructions</h3>
        <p style="font-size:12px; color:#333; margin:0 0 6px; line-height:1.6;">პოლისის მისაღებად, გთხოვთ, ჩარიცხოთ თანხა ზემოთ მითითებულ საბანკო ანგარიშზე.</p>
        <p style="font-size:12px; color:#333; margin:0 0 10px; line-height:1.6;">To receive your policy, please transfer the premium to the bank account above.</p>
        <p style="font-size:11px; color:#555; margin:0 0 4px;"><strong>დანიშნულება / Payment purpose:</strong></p>
        <div style="background:white; border:1px solid #d0e8e4; border-radius:6px; padding:8px 12px; margin:0 0 10px; font-weight:600; color:#333366; font-size:12px;">
          ${firstName} ${lastName} — ${product} (${plan})
        </div>
        <p style="font-size:12px; color:#333; margin:0 0 4px; line-height:1.6;">გადახდის შემდეგ, გთხოვთ, გამოგვიგზავნეთ ქვითარი:</p>
        <p style="font-size:12px; color:#333; margin:0 0 8px; line-height:1.6;">After payment, please send the receipt to:</p>
        <p style="margin:0; text-align:center;"><a href="mailto:a.beroshvili@primeinsurance.ge" style="color:#17a697; font-weight:700; text-decoration:none; font-size:14px;">📧 a.beroshvili@primeinsurance.ge</a></p>
      </td></tr>
    </table>
  </td></tr>

  <!-- Note -->
  <tr><td style="padding:5px 20px 10px; font-family:Arial,sans-serif;">
    <p style="font-size:10px; color:#999; line-height:1.5; margin:0;">
      გადახდა ხორციელდება ეროვნულ ვალუტაში, გადახდის დღის ეროვნული ბანკის კურსით.<br/>
      Payments are made in GEL with the NBG exchange rate at the day of payment.
    </p>
  </td></tr>

  <!-- Footer -->
  <tr><td style="background:#333366; padding:14px 20px; text-align:center; font-family:Arial,sans-serif;">
    <p style="margin:2px 0; font-size:10px; color:rgba(255,255,255,0.7);">საქართველო, ქ. თბილისი, უნივერსიტეტის ქ. 24 / 24 University Str. Tbilisi, Georgia</p>
    <p style="margin:2px 0; font-size:10px; color:rgba(255,255,255,0.7);">ტელ: +995 32 224 15 24 / Hotline: *1115</p>
    <p style="margin:6px 0 0; font-size:10px; color:rgba(255,255,255,0.5);">© ${new Date().getFullYear()} JSC Prime Insurance</p>
  </td></tr>

</table>
</td></tr>
</table>
</body>
</html>`;

      await transporter.sendMail({
        from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
        to: email,
        subject: `Invoice / ინვოისი — ${product} Insurance — PRIME Insurance`,
        html: invoiceHtml,
      });
    }
  } catch (emailError) {
    console.error("Email send error:", emailError);
  }

  return NextResponse.json(
    { message: "Application submitted", id: application.id },
    { status: 201 },
  );
}
