import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { TEMPLATES } from "@/lib/templates";

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: projects, error } = await supabase
      .from("projects")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) throw error;

    return NextResponse.json({ success: true, projects });
  } catch (error: any) {
    console.error("Fetch projects error:", error);
    return NextResponse.json({ error: error.message || "Failed to fetch projects" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { name, description, template = "blank" } = await req.json();

    if (!name) {
      return NextResponse.json({ error: "Missing project name" }, { status: 400 });
    }

    // 1. Insert project row
    const { data: project, error: pErr } = await supabase
      .from("projects")
      .insert({
        user_id: user.id,
        name,
        description,
        tech_stack: { framework: "nextjs", css: "tailwind" },
      })
      .select()
      .single();

    if (pErr) throw pErr;

    // 2. Fetch template files and insert into project_files
    const selectedTemplate = TEMPLATES[template] || TEMPLATES.blank;
    
    const fileInsertions = selectedTemplate.files.map((file) => ({
      project_id: project.id,
      path: file.path,
      content: file.content,
      is_locked: false,
    }));

    const { error: fErr } = await supabase
      .from("project_files")
      .insert(fileInsertions);

    if (fErr) throw fErr;

    return NextResponse.json({ success: true, project });
  } catch (error: any) {
    console.error("Create project error:", error);
    return NextResponse.json({ error: error.message || "Failed to create project" }, { status: 500 });
  }
}
