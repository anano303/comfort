import { NextRequest, NextResponse } from "next/server";
import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

export async function POST(request: NextRequest) {
  try {
    const { fullName, phoneNumber } = await request.json();

    if (!fullName || !phoneNumber) {
      return NextResponse.json(
        { error: "სახელი და ტელეფონის ნომერი სავალდებულოა" },
        { status: 400 },
      );
    }

    const now = new Date();
    const formattedDate = `${now.getDate().toString().padStart(2, "0")}/${(now.getMonth() + 1).toString().padStart(2, "0")}/${now.getFullYear()} ${now.getHours().toString().padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")}`;

    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #001f3f 0%, #003d5c 100%); color: white; padding: 20px; border-radius: 12px 12px 0 0; text-align: center;">
          <h1 style="margin: 0; font-size: 24px;">📞 ზარის მოთხოვნა</h1>
          <p style="margin: 5px 0 0; opacity: 0.9;">PRIME Insurance - ბინის დაზღვევა</p>
        </div>
        
        <div style="background: #f8f9fa; padding: 25px; border-radius: 0 0 12px 12px; border: 1px solid #e0e0e0; border-top: none;">
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 12px; border-bottom: 1px solid #e0e0e0; font-weight: bold; color: #001f3f; width: 40%;">სახელი და გვარი:</td>
              <td style="padding: 12px; border-bottom: 1px solid #e0e0e0;">${fullName}</td>
            </tr>
            <tr>
              <td style="padding: 12px; border-bottom: 1px solid #e0e0e0; font-weight: bold; color: #001f3f;">ტელეფონის ნომერი:</td>
              <td style="padding: 12px; border-bottom: 1px solid #e0e0e0;"><a href="tel:${phoneNumber}" style="color: #17a697; text-decoration: none;">${phoneNumber}</a></td>
            </tr>
            <tr>
              <td style="padding: 12px; font-weight: bold; color: #001f3f;">მოთხოვნის დრო:</td>
              <td style="padding: 12px;">${formattedDate}</td>
            </tr>
          </table>
          
          <div style="margin-top: 20px; padding: 15px; background: #e8f4f0; border-radius: 8px; border-left: 4px solid #17a697;">
            <p style="margin: 0; color: #333;">⚡ გთხოვთ დაუკავშირდეთ კლიენტს რაც შეიძლება მალე.</p>
          </div>
        </div>
      </div>
    `;

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: process.env.EMAIL_USER,
      subject: `📞 ზარის მოთხოვნა - ${fullName}`,
      html: emailHtml,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error sending call request email:", error);
    return NextResponse.json(
      { error: "მეილის გაგზავნა ვერ მოხერხდა" },
      { status: 500 },
    );
  }
}
