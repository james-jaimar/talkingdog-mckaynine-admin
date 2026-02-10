
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: req.headers.get("Authorization")! } } }
    );

    const { data: { user: authUser }, error: authError } = await supabaseClient.auth.getUser();
    if (authError || !authUser) {
      return new Response(JSON.stringify({ error: "Unauthorized", details: authError?.message || "Authentication required" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const requestData = await req.json();
    const { userId, role, operation = "setRole" } = requestData;
    // operation: "setRole" (default, replaces non-platform_admin roles) or "addRole" (adds without removing)

    console.log(`Request: ${operation} for user ${userId}, role: ${role}`);

    if (!userId || !role) {
      return new Response(JSON.stringify({ error: "Bad Request", details: "userId and role are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Check caller permissions
    const { data: currentUserRoles, error: rolesError } = await supabaseAdmin
      .from("user_roles").select("role").eq("user_id", authUser.id);

    if (rolesError) {
      return new Response(JSON.stringify({ error: "Database Error", details: rolesError.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const rolesList = currentUserRoles?.map(r => r.role) || [];
    const isAdmin = rolesList.includes("admin") || rolesList.includes("platform_admin");
    const isPlatformAdmin = rolesList.includes("platform_admin");

    if (!isAdmin && !isPlatformAdmin) {
      return new Response(JSON.stringify({ error: "Forbidden", details: "Only admins can manage user roles" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    if (role === "platform_admin" && !isPlatformAdmin) {
      return new Response(JSON.stringify({ error: "Forbidden", details: "Only platform admins can grant platform_admin role" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Handle role operations
    if (operation === "addRole") {
      // Just insert the new role without removing existing ones
      const { error: insertError } = await supabaseAdmin
        .from("user_roles")
        .upsert({ user_id: userId, role }, { onConflict: "user_id,role" });

      if (insertError) {
        return new Response(JSON.stringify({ error: "Database Error", details: insertError.message }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
    } else if (operation === "removeRole") {
      // Remove a specific role
      const { error: deleteError } = await supabaseAdmin
        .from("user_roles")
        .delete()
        .eq("user_id", userId)
        .eq("role", role);

      if (deleteError) {
        return new Response(JSON.stringify({ error: "Database Error", details: deleteError.message }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      // Update profiles.role to the remaining highest-priority role
      const { data: remainingRoles } = await supabaseAdmin
        .from("user_roles").select("role").eq("user_id", userId);
      const primaryRole = remainingRoles?.[0]?.role || "user";
      await supabaseAdmin.from("profiles").update({ role: primaryRole }).eq("id", userId);

      return new Response(JSON.stringify({ success: true, message: `Role ${role} removed` }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    } else {
      // Default "setRole": replace all non-platform_admin roles
      await supabaseAdmin.from("user_roles").delete().eq("user_id", userId).neq("role", "platform_admin");

      const { error: insertError } = await supabaseAdmin
        .from("user_roles")
        .upsert({ user_id: userId, role }, { onConflict: "user_id,role" });

      if (insertError) {
        return new Response(JSON.stringify({ error: "Database Error", details: insertError.message }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
    }

    // Update profiles.role for backwards compatibility (use the new role as primary)
    if (operation !== "removeRole") {
      await supabaseAdmin.from("profiles").update({ role }).eq("id", userId);
    }

    // If adding/setting trainer role, ensure trainer record exists
    if (role === "trainer" && operation !== "removeRole") {
      const { data: existingTrainer } = await supabaseAdmin
        .from("trainers").select("id").eq("user_id", userId).limit(1);

      if (!existingTrainer || existingTrainer.length === 0) {
        const { data: userInfo } = await supabaseAdmin
          .from("profiles").select("username, full_name").eq("id", userId).single();

        if (userInfo) {
          const names = userInfo.full_name ? userInfo.full_name.split(" ") : ["New", "Trainer"];
          const firstName = names[0] || "New";
          const lastName = names.length > 1 ? names.slice(1).join(" ") : "Trainer";

          // Get default branch
          const { data: branch } = await supabaseAdmin
            .from("branches").select("id").eq("is_active", true).limit(1).single();

          await supabaseAdmin.from("trainers").insert({
            user_id: userId,
            first_name: firstName,
            last_name: lastName,
            email: userInfo.username || "noemail@example.com",
            branch_id: branch?.id,
          });
        }
      }
    }

    // If adding/setting assistant role, try to link assistant record
    if (role === "assistant" && operation !== "removeRole") {
      const { data: existingAssistant } = await supabaseAdmin
        .from("assistants").select("id").eq("user_id", userId).limit(1);

      if (!existingAssistant || existingAssistant.length === 0) {
        const { data: { user: targetUser } } = await supabaseAdmin.auth.admin.getUserById(userId);
        if (targetUser?.email) {
          const { data: assistantByEmail } = await supabaseAdmin
            .from("assistants").select("id").eq("email", targetUser.email).is("user_id", null).limit(1);

          if (assistantByEmail && assistantByEmail.length > 0) {
            await supabaseAdmin.from("assistants").update({ user_id: userId }).eq("id", assistantByEmail[0].id);
          }
        }
      }
    }

    return new Response(JSON.stringify({ success: true, message: `User role updated: ${operation} ${role}` }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (error) {
    console.error("Error processing request:", error);
    return new Response(JSON.stringify({ error: "Server Error", details: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
