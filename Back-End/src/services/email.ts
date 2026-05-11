// Jadi:
import { Resend } from 'resend';
import { env } from '../env.js';

const resend = new Resend(env.RESEND_API_KEY);

export async function sendVerificationEmail(to: string, name: string, otp: string): Promise<void> {
  try {
    await resend.emails.send({
      from: env.RESEND_FROM_EMAIL,
      to,
      subject: `${otp} — Kode Verifikasi CoffeePos`,
      html: `
        <div style="font-family:Inter, system-ui, sans-serif; color:#1f2937; margin:0; padding:0;">
          <div style="background: linear-gradient(135deg, #f59e0b, #f59e0b 60%, #fbbf24); color:#111827; padding:32px 24px; border-radius:24px 24px 0 0; text-align:center;">
            <h1 style="margin:0; font-size:24px;">Verifikasi Email CoffeePos</h1>
          </div>
          <div style="background:#ffffff; padding:24px; border:1px solid #f3f4f6; border-top:none; border-radius:0 0 24px 24px;">
            <p style="margin:0 0 16px; font-size:16px;">Halo ${name},</p>
            <p style="margin:0 0 24px; font-size:16px;">Gunakan kode OTP berikut untuk memverifikasi email Anda:</p>
            <div style="background:#fef3c7; border-radius:16px; padding:20px; text-align:center; margin-bottom:24px;">
              <span style="display:inline-block; font-family:ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace; font-size:36px; letter-spacing:0.2em; color:#7c2d12;">${otp}</span>
            </div>
            <p style="margin:0; color:#6b7280; font-size:14px;">Kode berlaku 3 menit · Jangan bagikan ke siapapun</p>
          </div>
          <div style="margin-top:24px; padding:0 24px 24px; font-size:13px; color:#6b7280; text-align:center;">
            Jika Anda tidak meminta kode ini, silakan abaikan email ini.
          </div>
        </div>
      `
    });
  } catch (error) {
    throw error;
  }
}
