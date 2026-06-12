import fs from "fs";
import path from "path";

const root = path.resolve(".");

function stripTs(content) {
  return content
    .replace(/^import type \{[^}]+\} from [^;]+;\n/gm, "")
    .replace(/^import \{ type [^}]+\} from [^;]+;\n/gm, "")
    .replace(/: React\.[A-Za-z<>,\s|?&[\]"]+/g, "")
    .replace(/: Promise<[^>]+>/g, "")
    .replace(/\): [A-Za-z<>,\s|?&[\]"{}().]+ \{/g, ") {")
    .replace(/ as [A-Za-z<>,\s|?&[\]"{}().]+/g, "")
    .replace(/<Subject\[\] \| null>/g, "")
    .replace(/<Subject\[\]>/g, "")
    .replace(/<string \| null>/g, "")
    .replace(/<Tab>/g, "")
    .replace(/<Subject\[\]>/g, "")
    .replace(/interface [^{]+\{[^}]*\}\n\n?/gs, "")
    .replace(/type Tab = [^;]+;\n\n?/g, "")
    .replace(/Record<number, number>/g, "Object")
    .replace(/: Stored[A-Za-z]+/g, "")
    .replace(/: Omit<[^>]+>/g, "")
    .replace(/: Partial<[^>]+>/g, "")
    .replace(/: void/g, "")
    .replace(/: AppData/g, "")
    .replace(/: File/g, (m, offset, str) => {
      const before = str.slice(Math.max(0, offset - 30), offset);
      return before.includes("function") || before.includes("async") ? ": File" : m;
    })
    .replace(/\?: string/g, "")
    .replace(/\?: number/g, "")
    .replace(/\?: boolean/g, "")
    .replace(/ \| null/g, "")
    .replace(/ \| undefined/g, "")
    .replace(/StudyPlanDay\["tasks"\]/g, "[]")
    .replace(/ExtractedSubject\["units"\]\[0\]/g, "Object")
    .replace(/typeof [A-Za-z]+/g, "Object")
    .replace(/export interface[\s\S]*?^}\n\n/gm, "")
    .replace(/@\/lib\//g, "@/lib/")
    .replace(/@\/components\//g, "@/components/");
}

function copyDir(src, dest, extMap) {
  if (!fs.existsSync(dest)) fs.mkdirSync(dest, { recursive: true });
  for (const file of fs.readdirSync(src)) {
    const srcPath = path.join(src, file);
    const stat = fs.statSync(srcPath);
    if (stat.isDirectory()) {
      copyDir(srcPath, path.join(dest, file), extMap);
      continue;
    }
    const ext = path.extname(file);
    if (extMap[ext]) {
      let content = fs.readFileSync(srcPath, "utf8");
      if (file !== "types.ts") content = stripTs(content);
      const newName = file.replace(ext, extMap[ext]);
      if (file === "types.ts") continue;
      fs.writeFileSync(path.join(dest, newName), content);
    }
  }
}

// app files
const appSrc = path.join(root, "src", "app");
const appDest = path.join(root, "app");
if (!fs.existsSync(appDest)) fs.mkdirSync(appDest, { recursive: true });

fs.copyFileSync(
  path.join(appSrc, "globals.css"),
  path.join(appDest, "global.css")
);

const layout = stripTs(fs.readFileSync(path.join(appSrc, "layout.tsx"), "utf8"))
  .replace("./globals.css", "./global.css")
  .replace(/: Readonly<\{[^}]+\}>/g, "");
fs.writeFileSync(path.join(appDest, "layout.js"), layout);

const page = stripTs(fs.readFileSync(path.join(appSrc, "page.tsx"), "utf8"));
fs.writeFileSync(path.join(appDest, "page.js"), page);

copyDir(path.join(root, "src", "components"), path.join(root, "components"), {
  ".tsx": ".jsx",
});
copyDir(path.join(root, "src", "lib"), path.join(root, "lib"), {
  ".ts": ".js",
});

console.log("Migration complete");
