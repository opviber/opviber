import { streamText } from "ai";
import { createClient } from "@/lib/supabase/server";
import { decrypt } from "@/lib/crypto";
import { getModelInstance } from "@/lib/ai/providers";
import { CODE_GENERATOR_PROMPT } from "@/lib/ai/system-prompts";

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return new Response("Unauthorized", { status: 401 });
    }

    const { projectId, messages, provider, modelName } = await req.json();

    if (!projectId || !messages || !provider) {
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
        JSON.stringify({ error: `API key not found for ${provider}. Please add your key in settings.` }),
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

    // 3. Load project & active files
    const { data: project } = await supabase
      .from("projects")
      .select("name, description")
      .eq("id", projectId)
      .single();

    const { data: files } = await supabase
      .from("project_files")
      .select("path, content")
      .eq("project_id", projectId);

    // 4. Construct file tree representation as context
    let filesContext = "";
    if (files && files.length > 0) {
      filesContext = files
        .map((f) => `--- FILE: ${f.path} ---\n${f.content}\n--- END FILE ---`)
        .join("\n\n");
    } else {
      filesContext = "No files created in project yet.";
    }

    const finalSystemPrompt = `
${CODE_GENERATOR_PROMPT}

### Current Project Context
Project Name: ${project?.name || "Untitled Project"}
Project Description: ${project?.description || "No description provided."}

### Existing Project Codebase
Below are the files currently present in the user's workspace.
You can modify any of these files or create new ones using the <file path="...">...</file> syntax.

${filesContext}
`;

    // 5. Initialize dynamic model instance
    const model = getModelInstance(provider, apiKey, modelName);

    // 6. Return response stream
    const result = streamText({
      model,
      system: finalSystemPrompt,
      messages,
    });

    return result.toTextStreamResponse();
  } catch (error: any) {
    console.error("Chat route error:", error);
    return new Response(JSON.stringify({ error: error.message || "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
