Fresh Supabase project for Agency Zero
======================================
1. Create the project at https://supabase.com/dashboard (note the database password).
2. Authentication > Users > Add user: create the sign-in for drummerforger@gmail.com (auto-confirm), choose a strong password.
3. SQL editor: open each file in this folder IN ORDER (01, 02, 03 ...), paste, Run. Each must say "Success".
   The set_owner file must come right after the 0014 file.
4. Project Settings > API: copy the Project URL and the publishable (anon) key into the Cloudflare Worker variables
   NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY (Build variables), and the service_role key as the
   Secret SUPABASE_SERVICE_ROLE_KEY. Redeploy.
5. Authentication > URL Configuration: Site URL = your site; add Redirect URLs for it.
6. Open the CRM /app/system. Every row should say OK.
