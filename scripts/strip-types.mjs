import fs from "fs";
import path from "path";

const dirs = ["components"];

for (const dir of dirs) {
  for (const file of fs.readdirSync(dir)) {
    if (!file.endsWith(".jsx")) continue;
    const filePath = path.join(dir, file);
    let content = fs.readFileSync(filePath, "utf8");
    content = content
      .replace(/^import type \{[^}]+\} from [^;]+;\n/gm, "")
      .replace(/^import \{ type [^}]+\} from [^;]+;\n/gm, "")
      .replace(/^interface [\s\S]*?^}\n\n/gm, "")
      .replace(/^type [A-Za-z]+ = [^;]+;\n\n/gm, "")
      .replace(/: React\.DragEvent/g, "")
      .replace(/: React\.[A-Za-z]+/g, "")
      .replace(/useState<[^>]+>/g, "useState")
      .replace(/useState\(null\)/g, "useState(null)")
      .replace(/\}: \{ onSuccess: \(\) => void \}\)/g, "})")
      .replace(/\}: \{[^}]+\}\)/g, "})")
      .replace(/: \{ label: string; value: string; sub\?: string \}/g, "")
      .replace(/: "primary" \| "secondary" \| "danger" \| "ghost"/g, "")
      .replace(/: "indigo" \| "green" \| "amber" \| "red" \| "slate"/g, "")
      .replace(/: number/g, "")
      .replace(/: string/g, "")
      .replace(/: boolean/g, "")
      .replace(/: Tab/g, "")
      .replace(/: typeof Upload/g, "")
      .replace(/\?: string \| null/g, "")
      .replace(/\| null/g, "")
      .replace(/file\?: File/g, "file")
      .replace(/subjectId\?: string/g, "subjectId");
    fs.writeFileSync(filePath, content);
  }
}

console.log("Stripped types from components");
