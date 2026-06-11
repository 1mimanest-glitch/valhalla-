import { supabase } from "./supabase";

// ── CONVERSATIONS ──────────────────────────────────────────

export async function createConversation(userId, module, persona = null) {
  const { data, error } = await supabase
    .from("conversations")
    .insert({ user_id: userId, module, persona, title: "Nueva conversación" })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateConversationTitle(id, title) {
  await supabase.from("conversations").update({ title }).eq("id", id);
}

export async function getConversations(userId, module) {
  const query = supabase
    .from("conversations")
    .select("*")
    .order("updated_at", { ascending: false });
  if (userId) query.eq("user_id", userId);
  if (module) query.eq("module", module);
  const { data } = await query;
  return data || [];
}

// ── MESSAGES ──────────────────────────────────────────────

export async function saveMessage(conversationId, role, content) {
  const { data, error } = await supabase
    .from("messages")
    .insert({ conversation_id: conversationId, role, content })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function getMessages(conversationId) {
  const { data } = await supabase
    .from("messages")
    .select("*")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: true });
  return data || [];
}

// ── MEMORY ────────────────────────────────────────────────

export async function getUserMemory(userId) {
  const { data } = await supabase
    .from("user_memory")
    .select("*")
    .eq("user_id", userId)
    .single();
  return data;
}

export async function updateUserMemory(userId, updates) {
  await supabase
    .from("user_memory")
    .upsert({ user_id: userId, ...updates, updated_at: new Date().toISOString() });
}

// ── PROSPECTS ─────────────────────────────────────────────

export async function getProspects() {
  const { data } = await supabase
    .from("prospects")
    .select("*, profiles!assigned_to(name)")
    .order("updated_at", { ascending: false });
  return data || [];
}

export async function upsertProspect(prospect) {
  const { data, error } = await supabase
    .from("prospects")
    .upsert(prospect)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateProspectStatus(id, status, notes) {
  await supabase
    .from("prospects")
    .update({ status, notes, updated_at: new Date().toISOString() })
    .eq("id", id);
}

// ── ACTIONS ───────────────────────────────────────────────

export async function getActions(filters = {}) {
  let query = supabase
    .from("actions")
    .select("*, profiles!assigned_to(name), prospects(name)")
    .order("due_date", { ascending: true });

  if (filters.status) query = query.eq("status", filters.status);
  if (filters.assignedTo) query = query.eq("assigned_to", filters.assignedTo);

  const { data } = await query;
  return data || [];
}

export async function createAction(action) {
  const { data, error } = await supabase
    .from("actions")
    .insert(action)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function completeAction(id) {
  await supabase
    .from("actions")
    .update({ status: "completada", updated_at: new Date().toISOString() })
    .eq("id", id);
}

// ── METRICS ───────────────────────────────────────────────

export async function logSessionMetric(metric) {
  await supabase.from("session_metrics").insert(metric);
}

export async function getDashboardSummary() {
  const { data } = await supabase.from("dashboard_summary").select("*");
  return data || [];
}

export async function getPipelineSummary() {
  const { data } = await supabase.from("pipeline_summary").select("*");
  return data || [];
}

export async function getFilterMetrics() {
  const { data } = await supabase
    .from("session_metrics")
    .select("filter_result, session_date")
    .not("filter_result", "is", null)
    .order("session_date", { ascending: false })
    .limit(50);
  return data || [];
}
