import { streamText } from "ai";
import { createClient } from "@/lib/supabase/server";
import { decrypt } from "@/lib/crypto";
import { getModelInstance } from "@/lib/ai/providers";
import { ADVISOR_PROMPT } from "@/lib/ai/system-prompts";

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return new Response("Unauthorized", { status: 401 });
    }

    const { projectId, provider, modelName } = await req.json();

    if (!projectId || !provider) {
      return new Response("Missing required parameters", { status: 400 });
    }

    // 1. Fetch encrypted key for provider
    const { data: keyData, error: keyErr } = await supabase
      .from("api_keys")
      .select("encrypted_key")
      .eq("user_id", user.id)
      .eq("provider", provider)
      .single();

    if (keyErr || !keyData) {
      return new Response(
        JSON.stringify({ error: `API key not found for ${provider}. Please configure it in settings.` }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // 2. Decrypt key
    let apiKey: string;
    try {
      apiKey = decrypt(keyData.encrypted_key);
    } catch (e) {
      return new Response("Failed to decrypt API key", { status: 500 });
    }

    // 3. Fetch project details & files list
    const { data: project } = await supabase
      .from("projects")
      .select("name, description")
      .eq("id", projectId)
      .single();

    const { data: files } = await supabase
      .from("project_files")
      .select("path")
      .eq("project_id", projectId);

    const filesList = files && files.length > 0 
      ? files.map(f => `- ${f.path}`).join("\n") 
      : "No files created yet.";

    const finalSystemPrompt = `
${ADVISOR_PROMPT}

### Current Project Details:
Project Name: ${project?.name || "Untitled"}
Project Description: ${project?.description || "No description provided."}

### File Tree structure:
${filesList}
`;

    // 4. Get LLM model instance
    const model = getModelInstance(provider, apiKey, modelName);

    // 5. Generate and stream text
    const result = streamText({
      model,
      system: finalSystemPrompt,
      prompt: "Analyze my current project and provide your strategic product and UX recommendations.",
    });

    return result.toTextStreamResponse();
  } catch (error: any) {
    console.error("Advisor API error:", error);
    return new Response(JSON.stringify({ error: error.message || "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
