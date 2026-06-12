import { createClient } from "@supabase/supabase-js";

let client = null;

export function getSupabase() {
  if (client) return client;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) return null;

  client = createClient(url, key);
  return client;
}

export function isSupabaseEnabled() {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
}

export async function loadFromSupabase() {
  const supabase = getSupabase();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from("app_data")
    .select("data")
    .eq("id", "default")
    .maybeSingle();

  if (error) {
    console.warn("Supabase load failed:", error.message);
    return null;
  }
  return data?.data ?? null;
}

export async function saveToSupabase(appData) {
  const supabase = getSupabase();
  if (!supabase) return false;

  const { error } = await supabase.from("app_data").upsert({
    id: "default",
    data: appData,
    updated_at: new Date().toISOString(),
  });

  if (error) {
    console.warn("Supabase save failed:", error.message);
    return false;
  }
  return true;
}

export async function uploadSyllabusToSupabase(fileName, rawText) {
  const supabase = getSupabase();
  if (!supabase) return;

  await supabase.from("syllabus_uploads").insert({
    file_name: fileName,
    raw_text: rawText.slice(0, 50000),
  });
}
