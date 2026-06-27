import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://kejgjwvesmlaorviofyl.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imtlamdqd3Zlc21sYW9ydmlvZnlsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI1MTYxMzIsImV4cCI6MjA5ODA5MjEzMn0.3pVOHDKLqMmCwpLTw7Kybq_SBEOQTHWMhiB0b0v5zPM";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});
