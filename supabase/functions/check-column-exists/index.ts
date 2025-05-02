
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// CORS headers for cross-origin requests
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const { table, column } = await req.json();
    
    if (!table || !column) {
      return new Response(
        JSON.stringify({ error: "Missing table or column parameter" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }
    
    // Query information_schema to check if column exists
    const { data, error } = await supabaseAdmin
      .from('information_schema.columns')
      .select('column_name')
      .eq('table_name', table)
      .eq('column_name', column)
      .maybeSingle();
      
    if (error) {
      return new Response(
        JSON.stringify({ error: error.message }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }
    
    return new Response(
      JSON.stringify({ 
        exists: !!data,
        column: data?.column_name || null
      }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
});
