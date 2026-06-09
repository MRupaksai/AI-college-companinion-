export async function extractTextFromFile(
  buffer: Buffer,
  mimeType: string,
  fileName: string
): Promise<string> {
  if (mimeType === "text/plain" || fileName.endsWith(".txt")) {
    return buffer.toString("utf-8");
  }

  if (mimeType === "application/pdf" || fileName.endsWith(".pdf")) {
    const pdfParse = (await import("pdf-parse")).default;
    const data = await pdfParse(buffer);
    return data.text;
  }

  if (mimeType.startsWith("image/")) {
    return extractTextFromImagePlaceholder(fileName);
  }

  throw new Error(`Unsupported file type: ${mimeType || fileName}`);
}

function extractTextFromImagePlaceholder(fileName: string): string {
  return `[Image uploaded: ${fileName}]

Note: For image syllabi, please also paste the text below or add your OPENAI_API_KEY for vision-based extraction.

Suggested format for manual entry:
Subject: Mathematics
Unit 1: Calculus
- Limits and continuity
- Differentiation
Unit 2: Integration
- Definite integrals
- Applications

Exam Date: 15/12/2026
Assignment Due: 01/11/2026`;
}

export function getMimeType(fileName: string): string {
  const ext = fileName.split(".").pop()?.toLowerCase();
  const map: Record<string, string> = {
    pdf: "application/pdf",
    txt: "text/plain",
    png: "image/png",
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    webp: "image/webp",
  };
  return map[ext ?? ""] ?? "application/octet-stream";
}
