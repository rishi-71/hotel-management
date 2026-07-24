import { createClient } from "@/utils/supabase/server";

export interface SystemConfig {
  admins: string[];
  users: string[];
}

export async function getSystemConfig(): Promise<SystemConfig> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("hotels")
    .select("description")
    .eq("name", "__SYSTEM_CONFIG__")
    .maybeSingle();

  if (error || !data || !data.description) {
    return { admins: [], users: [] };
  }

  try {
    const parsed = JSON.parse(data.description);
    return {
      admins: Array.isArray(parsed.admins) ? parsed.admins : [],
      users: Array.isArray(parsed.users) ? parsed.users : []
    };
  } catch {
    return { admins: [], users: [] };
  }
}

export async function saveSystemConfig(config: SystemConfig): Promise<boolean> {
  const supabase = await createClient();
  const { data: existing } = await supabase
    .from("hotels")
    .select("id")
    .eq("name", "__SYSTEM_CONFIG__")
    .maybeSingle();

  if (existing) {
    const { error } = await supabase
      .from("hotels")
      .update({ description: JSON.stringify(config) })
      .eq("id", existing.id);
    return !error;
  } else {
    const { error } = await supabase
      .from("hotels")
      .insert([
        {
          name: "__SYSTEM_CONFIG__",
          location: "__ADMIN_EMAILS__",
          description: JSON.stringify(config),
          image_url: ""
        }
      ]);
    return !error;
  }
}

export async function registerUserEmail(email: string | undefined): Promise<void> {
  if (!email) return;
  const config = await getSystemConfig();
  if (!config.users.includes(email)) {
    config.users.push(email);
    // Automatically add admin@gmail.com to the admins list if not present
    if (email === "admin@gmail.com" && !config.admins.includes("admin@gmail.com")) {
      config.admins.push("admin@gmail.com");
    }
    await saveSystemConfig(config);
  }
}

export async function isAdmin(email: string | undefined): Promise<boolean> {
  if (!email) return false;
  if (email === "admin@gmail.com") return true;

  const config = await getSystemConfig();
  return config.admins.includes(email);
}

export async function promoteToAdmin(email: string): Promise<boolean> {
  const config = await getSystemConfig();
  if (config.admins.includes(email)) return true;
  config.admins.push(email);
  return await saveSystemConfig(config);
}

export async function demoteFromAdmin(email: string): Promise<boolean> {
  const config = await getSystemConfig();
  config.admins = config.admins.filter(e => e !== email);
  return await saveSystemConfig(config);
}
