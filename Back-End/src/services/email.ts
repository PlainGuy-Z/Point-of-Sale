import { Resend } from 'resend';
import { env } from '../env.js';

const resend = new Resend(env.RESEND_API_KEY);

export async function sendPasswordResetEmail(
  to: string,
  name: string,
  resetUrl: string
): Promise<void> {
  const html = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden;">
      <div style="background: linear-gradient(to right, #f59e0b, #ea580c); padding: 24px; text-align: center;">
        <h1 style="color: white; margin: 0; font-size: 24px; font-weight: bold;">SmartPOS</h1>
      </div>
      <div style="padding: 24px; color: #334155;">
        <p style="font-size: 16px;">Halo, <strong>${name}</strong>!</p>
        <p style="font-size: 16px;">Kami menerima permintaan untuk mereset password akun SmartPOS kamu.</p>
        <div style="text-align: center; margin: 32px 0;">
          <a href="${resetUrl}" style="background-color: #f59e0b; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 16px; display: inline-block;">Reset Password Sekarang</a>
        </div>
        <p style="font-size: 14px; color: #64748b;">Link ini berlaku selama 1 jam.</p>
        <p style="font-size: 14px; color: #64748b;">Jika kamu tidak meminta reset password, abaikan email ini. Password kamu tetap aman.</p>
      </div>
      <div style="background-color: #f8fafc; padding: 16px; text-align: center; border-top: 1px solid #e2e8f0;">
        <p style="margin: 0; font-size: 12px; color: #94a3b8;">&copy; SmartPOS &middot; Jangan bagikan link ini ke siapapun</p>
      </div>
    </div>
  `;

  const response = await resend.emails.send({
    from: env.RESEND_FROM_EMAIL,
    to,
    subject: 'Reset Password SmartPOS',
    html,
  });

  if (response.error) {
    throw new Error(response.error.message);
  }
}
