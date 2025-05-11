
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
    // Create Supabase client with auth context from the request
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

    // Check if the current user is admin or platform_admin
    const { data: currentUserProfile, error: profileError } = await supabaseClient
      .from("profiles")
      .select("role")
      .eq("id", authUser.id)
      .single();

    if (profileError) {
      return new Response(
        JSON.stringify({
          error: "Database Error",
          details: profileError.message,
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const currentUserRole = currentUserProfile.role;
    const isAdmin = currentUserRole.includes("admin");
    const isPlatformAdmin = currentUserRole.includes("platform_admin");

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

    // Update the user role
    const { error: updateError } = await supabaseClient
      .from("profiles")
      .update({ role })
      .eq("id", userId);

    if (updateError) {
      return new Response(
        JSON.stringify({
          error: "Database Error",
          details: updateError.message,
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // If user is becoming a trainer, check if there's a trainer record already
    if (role === "trainer") {
      // Check if user already has a trainer record
      const { data: existingTrainer } = await supabaseClient
        .from("trainers")
        .select("id")
        .eq("user_id", userId)
        .limit(1);

      // If no trainer record exists, get user info to create one
      if (!existingTrainer || existingTrainer.length === 0) {
        // Get user info
        const { data: userInfo } = await supabaseClient
          .from("profiles")
          .select("username, full_name")
          .eq("id", userId)
          .single();

        if (userInfo) {
          const names = userInfo.full_name ? userInfo.full_name.split(" ") : ["New", "Trainer"];
          const firstName = names[0] || "New";
          const lastName = names.length > 1 ? names.slice(1).join(" ") : "Trainer";
          
          // Create trainer record
          await supabaseClient
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
