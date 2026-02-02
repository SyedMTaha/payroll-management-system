import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

export async function POST(request) {
  try {
    const body = await request.json();
    const { to, payment, pdfBase64, fileName } = body || {};

    if (!to || !payment || !pdfBase64 || !fileName) {
      return NextResponse.json({ error: 'Missing required fields.' }, { status: 400 });
    }

    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT || 587),
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    const html = `
      <div style="font-family: Arial, sans-serif;">
        <h2>Invoice - Payroll Payment</h2>
        <p><strong>Employee:</strong> ${payment.employeeName}</p>
        <p><strong>Payment Type:</strong> ${payment.paymentType}</p>
        <p><strong>Calculated Amount:</strong> AED ${payment.calculatedAmount?.toLocaleString?.() ?? payment.calculatedAmount}</p>
        <p><strong>Advance Deduction:</strong> AED ${payment.advanceDeduction?.toLocaleString?.() ?? payment.advanceDeduction}</p>
        <p><strong>Final Payable:</strong> AED ${payment.finalPayable?.toLocaleString?.() ?? payment.finalPayable}</p>
        <p><strong>Status:</strong> ${payment.status}</p>
      </div>
    `;

    const from = process.env.SMTP_FROM || process.env.SMTP_USER;

    await transporter.sendMail({
      from,
      to,
      subject: `Invoice - ${payment.employeeName}`,
      html,
      attachments: [
        {
          filename: fileName,
          content: Buffer.from(pdfBase64, 'base64'),
          contentType: 'application/pdf',
        },
      ],
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Send invoice error:', error);
    return NextResponse.json({ error: 'Failed to send invoice.' }, { status: 500 });
  }
}
