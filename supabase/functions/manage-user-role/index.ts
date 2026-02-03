
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Set CORS headers
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle preflight CORS
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: corsHeaders,
    });
  }

  try {
    // Create Supabase client with service role for admin operations
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      {
        auth: { persistSession: false },
      }
    );

    // Create client with user auth for permission checks
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      {
        global: {
          headers: { Authorization: req.headers.get("Authorization")! },
        },
      }
    );

    // Get the current authenticated user
    const {
      data: { user: authUser },
      error: authError,
    } = await supabaseClient.auth.getUser();

    if (authError || !authUser) {
      return new Response(
        JSON.stringify({
          error: "Unauthorized",
          details: authError?.message || "Authentication required",
        }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Get the request body
    const requestData = await req.json();
    const { userId, role } = requestData;

    console.log(`Request to update role of user ${userId} to ${role}`);

    if (!userId || !role) {
      return new Response(
        JSON.stringify({
          error: "Bad Request",
          details: "userId and role are required",
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Check if the current user is admin or platform_admin using user_roles table
    const { data: currentUserRoles, error: rolesError } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", authUser.id);

    if (rolesError) {
      return new Response(
        JSON.stringify({
          error: "Database Error",
          details: rolesError.message,
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const rolesList = currentUserRoles?.map(r => r.role) || [];
    const isAdmin = rolesList.includes("admin") || rolesList.includes("platform_admin");
    const isPlatformAdmin = rolesList.includes("platform_admin");

    // Role validation and restrictions
    if (!isAdmin && !isPlatformAdmin) {
      return new Response(
        JSON.stringify({
          error: "Forbidden",
          details: "Only admins can manage user roles",
        }),
        {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Special restriction: Only platform_admin can set platform_admin role
    if (role === "platform_admin" && !isPlatformAdmin) {
      return new Response(
        JSON.stringify({
          error: "Forbidden",
          details: "Only platform admins can grant platform_admin role",
        }),
        {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Update/insert the user role in user_roles table
    // First, remove existing role of the same type if updating
    await supabaseAdmin
      .from("user_roles")
      .delete()
      .eq("user_id", userId)
      .neq("role", "platform_admin"); // Don't remove platform_admin roles

    // Insert the new role
    const { error: insertError } = await supabaseAdmin
      .from("user_roles")
      .upsert(
        { user_id: userId, role },
        { onConflict: "user_id,role" }
      );

    if (insertError) {
      return new Response(
        JSON.stringify({
          error: "Database Error",
          details: insertError.message,
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Also update profiles.role for backwards compatibility
    await supabaseAdmin
      .from("profiles")
      .update({ role })
      .eq("id", userId);

    // If user is becoming a trainer, check if there's a trainer record already
    if (role === "trainer") {
      // Check if user already has a trainer record
      const { data: existingTrainer } = await supabaseAdmin
        .from("trainers")
        .select("id")
        .eq("user_id", userId)
        .limit(1);

      // If no trainer record exists, get user info to create one
      if (!existingTrainer || existingTrainer.length === 0) {
        // Get user info
        const { data: userInfo } = await supabaseAdmin
          .from("profiles")
          .select("username, full_name")
          .eq("id", userId)
          .single();

        if (userInfo) {
          const names = userInfo.full_name ? userInfo.full_name.split(" ") : ["New", "Trainer"];
          const firstName = names[0] || "New";
          const lastName = names.length > 1 ? names.slice(1).join(" ") : "Trainer";
          
          // Create trainer record
          await supabaseAdmin
            .from("trainers")
            .insert({
              user_id: userId,
              first_name: firstName,
              last_name: lastName, 
              email: userInfo.username || "noemail@example.com"
            });
        }
      }
    }

    // If user is becoming an assistant, check if there's an assistant record already
    if (role === "assistant") {
      // Check if user already has an assistant record linked
      const { data: existingAssistant } = await supabaseAdmin
        .from("assistants")
        .select("id")
        .eq("user_id", userId)
        .limit(1);

      // If no assistant record linked, try to find and link by email
      if (!existingAssistant || existingAssistant.length === 0) {
        // Get user email
        const { data: { user: targetUser } } = await supabaseAdmin.auth.admin.getUserById(userId);
        
        if (targetUser?.email) {
          // Try to find existing assistant by email
          const { data: assistantByEmail } = await supabaseAdmin
            .from("assistants")
            .select("id")
            .eq("email", targetUser.email)
            .is("user_id", null)
            .limit(1);

          if (assistantByEmail && assistantByEmail.length > 0) {
            // Link existing assistant record
            await supabaseAdmin
              .from("assistants")
              .update({ user_id: userId })
              .eq("id", assistantByEmail[0].id);
          }
          // Note: If no assistant record exists, admin must create one first via the Assistants page
        }
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: `User role updated to ${role}`,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error processing request:", error);

    return new Response(
      JSON.stringify({
        error: "Server Error",
        details: error.message,
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
