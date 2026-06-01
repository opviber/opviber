import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    console.log("Save chat message request body:", body);
    const { projectId, role, content, metadata } = body;

    if (!projectId || !role || !content) {
      return NextResponse.json({ error: "Missing parameters" }, { status: 400 });
    }

    // Verify user owns project
    const { data: project } = await supabase
      .from("projects")
      .select("id")
      .eq("id", projectId)
      .eq("user_id", user.id)
      .single();

    if (!project) {
      return NextResponse.json({ error: "Project not found or access denied" }, { status: 404 });
    }

    const { data: message, error } = await supabase
      .from("chat_messages")
      .insert({
        project_id: projectId,
        role,
        content,
        metadata: metadata || {},
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, message });
  } catch (error: any) {
    console.error("Save chat message error:", error);
    return NextResponse.json({ error: error.message || "Failed to save chat message" }, { status: 500 });
  }
}
