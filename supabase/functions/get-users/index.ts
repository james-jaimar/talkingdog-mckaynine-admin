
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.33.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Content-Type": "application/json",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: corsHeaders,
      status: 204,
    });
  }

  try {
    // Get request body which may contain app_id
    let app_id = null;
    try {
      const body = await req.json();
      app_id = body?.app_id || null;
    } catch (e) {
      // If parsing fails, proceed without app_id filter
      console.error("Failed to parse request body:", e);
    }

    // Create a Supabase client with the service role key (has admin privileges)
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") || "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || ""
    );

    // Check authorization - only allow admins to access this endpoint
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "No authorization header" }),
        { 
          headers: corsHeaders,
          status: 401 
        }
      );
    }

    // Get the requesting user
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token);
    
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: "Invalid token", details: userError?.message }),
        { 
          headers: corsHeaders, 
          status: 401 
        }
      );
    }

    // Check if the user is an admin
    const { data: profile, error: profileError } = await supabaseAdmin
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();
    
    if (profileError || !profile || profile.role !== "admin") {
      return new Response(
        JSON.stringify({ error: "Unauthorized - Admin access required" }),
        { 
          headers: corsHeaders, 
          status: 403 
        }
      );
    }

    console.log("Admin access confirmed for user:", user.id);

    // Build query to fetch profiles
    let query = supabaseAdmin
      .from("profiles")
      .select("*")
      .order("created_at", { ascending: false });
    
    // Filter by app_id if provided
    if (app_id) {
      console.log("Filtering profiles by app_id:", app_id);
      query = query.eq("app_id", app_id);
    }

    // Execute the query
    const { data: profiles, error } = await query;

    if (error) {
      console.error("Error fetching profiles:", error);
      throw error;
    }

    console.log(`Successfully fetched ${profiles?.length || 0} profiles`);

    return new Response(
      JSON.stringify(profiles),
      { headers: corsHeaders, status: 200 }
    );
  } catch (error) {
    console.error("Error fetching users:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: corsHeaders, status: 500 }
    );
  }
});
