export interface FileOp {
  path: string;
  content: string;
  type: "write" | "delete";
}

/**
 * Parses the AI response to extract file operations.
 * The AI is instructed to return files wrapped in:
 * <file path="path/to/file.tsx">
 *   content...
 * </file>
 * Or for deletion:
 * <delete path="path/to/file.tsx" />
 */
export function parseAiResponse(text: string): FileOp[] {
  const operations: FileOp[] = [];

  // Match file content blocks
  // Using a regex that handles potential newlines/escaped chars inside the tags
  const fileRegex = /<file\s+path=["']([^"']+)["']\s*>([\s\S]*?)<\/file>/gi;
  let match;

  while ((match = fileRegex.exec(text)) !== null) {
    const path = match[1].trim();
    // Trim the code blocks if they are wrapped in standard markdown syntax like ```tsx
    let content = match[2];
    
    // Clean markdown code fence if AI included it inside <file>
    content = content.replace(/^[\s\n]*```[a-zA-Z]*\n/, "");
    content = content.replace(/```[\s\n]*$/, "");

    operations.push({
      path,
      content,
      type: "write",
    });
  }

  // Match delete blocks
  const deleteRegex = /<delete\s+path=["']([^"']+)["']\s*\/>/gi;
  while ((match = deleteRegex.exec(text)) !== null) {
    const path = match[1].trim();
    operations.push({
      path,
      content: "",
      type: "delete",
    });
  }

  return operations;
}

/**
 * Strips XML tags from text so we can display a clean explanation to the user
 */
export function getCleanExplanation(text: string): string {
  let clean = text;
  
  // Remove <file>...</file> tags
  clean = clean.replace(/<file\s+path=["']([^"']+)["']\s*>([\s\S]*?)<\/file>/gi, (match, path) => {
    return `\n*Modified file: \`${path}\`*`;
  });

  // Remove <delete /> tags
  clean = clean.replace(/<delete\s+path=["']([^"']+)["']\s*\/>/gi, (match, path) => {
    return `\n*Deleted file: \`${path}\`*`;
  });

  return clean.trim();
}
