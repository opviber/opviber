import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("subscription_tier")
      .eq("id", user.id)
      .single();

    const currentTier = profile?.subscription_tier || "free";
    const nextTier = currentTier === "free" ? "remove_ads" : "free";

    const { error } = await supabase
      .from("profiles")
      .update({
        subscription_tier: nextTier,
        updated_at: new Date().toISOString(),
      })
      .eq("id", user.id);

    if (error) throw error;

    return NextResponse.json({ success: true, tier: nextTier });
  } catch (error: any) {
    console.error("Mock upgrade error:", error);
    return NextResponse.json({ error: error.message || "Mock upgrade failed" }, { status: 500 });
  }
}
