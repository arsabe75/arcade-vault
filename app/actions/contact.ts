"use server";

import { Resend } from "resend";
import { cookies } from "next/headers";

export interface ContactFormData {
  name: string;
  email: string;
  message: string;
}

export interface ContactResult {
  success: boolean;
  error?: string;
}

const COOLDOWN_SECONDS = 60;
const COOLDOWN_COOKIE = "contact_cooldown";

export async function sendContactEmail(
  data: ContactFormData,
): Promise<ContactResult> {
  try {
    // 1. Server-side validation
    if (!data.name?.trim() || !data.email?.trim() || !data.message?.trim()) {
      return { success: false, error: "Todos los campos son requeridos." };
    }

    // Basic email format check
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(data.email.trim())) {
      return {
        success: false,
        error: "El correo electrónico no tiene un formato válido.",
      };
    }

    // 2. Cooldown check
    const cookieStore = await cookies();
    const cooldownCookie = cookieStore.get(COOLDOWN_COOKIE);

    if (cooldownCookie) {
      const lastSent = parseInt(cooldownCookie.value, 10);
      const now = Date.now();
      const elapsed = (now - lastSent) / 1000;

      if (elapsed < COOLDOWN_SECONDS) {
        const remaining = Math.ceil(COOLDOWN_SECONDS - elapsed);
        return {
          success: false,
          error: `Espera ${remaining} segundos antes de enviar otro mensaje.`,
        };
      }
    }

    // 3. Send email via Resend
    const resend = new Resend(process.env.RESEND_API_KEY);

    const fromEmail =
      process.env.RESEND_FROM_EMAIL || "onboarding@resend.dev";
    const toEmail =
      process.env.CONTACT_TO_EMAIL || "arsabe75@gmail.com";

    const { error: resendError } = await resend.emails.send({
      from: `Arcade Vault <${fromEmail}>`,
      to: toEmail,
      subject: `Nuevo mensaje de contacto de ${data.name.trim()}`,
      text: `Mensaje recibido desde el formulario de contacto de Arcade Vault.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Nombre:  ${data.name.trim()}
Email:   ${data.email.trim()}
Fecha:   ${new Date().toLocaleString("es-ES", {
        dateStyle: "long",
        timeStyle: "short",
      })}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Mensaje:
${data.message.trim()}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Este mensaje fue enviado desde el formulario de contacto en Arcade Vault.
`,
    });

    if (resendError) {
      console.error("Resend error:", resendError);
      return {
        success: false,
        error: "No se pudo enviar el mensaje. Intenta de nuevo.",
      };
    }

    // 4. Set cooldown cookie
    cookieStore.set(COOLDOWN_COOKIE, String(Date.now()), {
      maxAge: COOLDOWN_SECONDS,
      path: "/",
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
    });

    return { success: true };
  } catch (error) {
    console.error("Contact form error:", error);
    return {
      success: false,
      error: "No se pudo enviar el mensaje. Intenta de nuevo.",
    };
  }
}
