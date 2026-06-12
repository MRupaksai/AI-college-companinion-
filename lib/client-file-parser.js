export async function extractTextFromFile(file) {
  if (file.type === "text/plain" || file.name.endsWith(".txt")) {
    return file.text();
  }

  if (file.type === "application/pdf" || file.name.endsWith(".pdf")) {
    return extractPdfText(file);
  }

  if (file.type.startsWith("image/")) {
    return `[Image uploaded: ${file.name}]

Paste syllabus text below for best results, or add an OpenAI API key in Settings for vision extraction.

Suggested format:
Subject: Mathematics
Unit 1: Calculus
- Limits and continuity
Exam Date: 15/12/2026`;
  }

  throw new Error(`Unsupported file type: ${file.type || file.name}`);
}

async function extractPdfText(file) {
  try {
    const pdfjs = await import("pdfjs-dist");

    // Use bundled worker from /public (not CDN — CDN fails on Vercel/CSP)
    const basePath = process.env.NEXT_PUBLIC_BASE_PATH || "";
    pdfjs.GlobalWorkerOptions.workerSrc = `${basePath}/pdf.worker.min.mjs`;

    const buffer = await file.arrayBuffer();
    const pdf = await pdfjs.getDocument({ data: buffer }).promise;
    const pages = [];

    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      const text = content.items.map((item) => ("str" in item ? item.str : "")).join(" ");
      pages.push(text);
    }

    const result = pages.join("\n\n").trim();
    if (!result || result.length < 10) {
      throw new Error("PDF appears empty or scanned — paste text manually.");
    }
    return result;
  } catch (err) {
    const msg = err instanceof Error ? err.message : "PDF read failed";
    throw new Error(
      `${msg} Please paste your syllabus text in the box below instead.`
    );
  }
}
