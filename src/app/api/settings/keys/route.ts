import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { encrypt } from "@/lib/crypto";

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { provider, key } = await req.json();

    if (!provider || !key) {
      return NextResponse.json({ error: "Missing provider or key" }, { status: 400 });
    }

    const allowedProviders = ["openai", "anthropic", "google", "mistral", "groq", "cohere", "xai"];
    if (!allowedProviders.includes(provider)) {
      return NextResponse.json({ error: "Invalid provider" }, { status: 400 });
    }

    // Encrypt the key
    const encryptedKey = encrypt(key);

    const { error } = await supabase
      .from("api_keys")
      .upsert({
        user_id: user.id,
        provider,
        encrypted_key: encryptedKey,
        is_active: true,
        updated_at: new Date().toISOString(),
      }, { onConflict: "user_id,provider" });

    if (error) {
      throw error;
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error saving API key:", error);
    return NextResponse.json({ error: error.message || "Failed to save API key" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const provider = searchParams.get("provider");

    if (!provider) {
      return NextResponse.json({ error: "Missing provider parameter" }, { status: 400 });
    }

    const { error } = await supabase
      .from("api_keys")
      .delete()
      .eq("user_id", user.id)
      .eq("provider", provider);

    if (error) {
      throw error;
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error deleting API key:", error);
    return NextResponse.json({ error: error.message || "Failed to delete API key" }, { status: 500 });
  }
}
