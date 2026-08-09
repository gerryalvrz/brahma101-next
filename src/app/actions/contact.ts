"use server";

import { createSupabaseServerClient } from "@/lib/supabase/server";

export type ContactFormState = {
  ok: boolean;
  error?: string;
};

function clean(value: FormDataEntryValue | null, max: number) {
  if (typeof value !== "string") return "";
  return value.trim().slice(0, max);
}

export async function submitContactMessage(
  _prev: ContactFormState,
  formData: FormData
): Promise<ContactFormState> {
  // Honeypot — bots fill this; humans never see it
  if (clean(formData.get("website"), 200)) {
    return { ok: true };
  }

  const name = clean(formData.get("name"), 120);
  const email = clean(formData.get("email"), 254).toLowerCase();
  const phone = clean(formData.get("phone"), 40);
  const subject = clean(formData.get("subject"), 160);
  const message = clean(formData.get("message"), 4000);

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { ok: false, error: "A valid email is required." };
  }
  if (!message || message.length < 3) {
    return { ok: false, error: "Message is required." };
  }

  try {
    const supabase = createSupabaseServerClient();
    const { error } = await supabase.from("contact_messages").insert({
      name: name || null,
      email,
      phone: phone || null,
      subject: subject || null,
      message,
      status: "new",
    });

    if (error) {
      console.error("contact_messages insert failed:", error.message);
      return { ok: false, error: "Transmission failed. Try again shortly." };
    }

    return { ok: true };
  } catch (err) {
    console.error("contact submit error:", err);
    return { ok: false, error: "Transmission failed. Try again shortly." };
  }
}
