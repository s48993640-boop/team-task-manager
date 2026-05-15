import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Create demo users via admin API
    const demoUsers = [
      { email: "admin@taskflow.com", password: "admin123", full_name: "Alex Morgan", role: "admin" },
      { email: "sarah@taskflow.com", password: "member123", full_name: "Sarah Chen", role: "member" },
      { email: "mike@taskflow.com", password: "member123", full_name: "Mike Johnson", role: "member" },
      { email: "emma@taskflow.com", password: "member123", full_name: "Emma Wilson", role: "member" },
    ];

    const userIds: Record<string, string> = {};

    for (const u of demoUsers) {
      const { data: existingUser } = await supabase.auth.admin.listUsers();
      const found = existingUser.users.find((x: any) => x.email === u.email);

      if (found) {
        userIds[u.email] = found.id;
      } else {
        const { data, error } = await supabase.auth.admin.createUser({
          email: u.email,
          password: u.password,
          email_confirm: true,
        });
        if (error) {
          console.error(`Error creating user ${u.email}:`, error.message);
          continue;
        }
        userIds[u.email] = data.user.id;
      }

      // Upsert profile
      await supabase.from("profiles").upsert({
        id: userIds[u.email],
        full_name: u.full_name,
        role: u.role,
        email: u.email,
      }, { onConflict: "id" });
    }

    // Create demo projects
    const adminId = userIds["admin@taskflow.com"];
    const sarahId = userIds["sarah@taskflow.com"];

    const { data: existingProjects } = await supabase.from("projects").select("id");
    if (existingProjects && existingProjects.length > 0) {
      return new Response(JSON.stringify({ message: "Demo data already exists", users: Object.keys(userIds).length }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: projects } = await supabase.from("projects").insert([
      { name: "Website Redesign", description: "Complete overhaul of the company website with modern UI/UX", status: "active", created_by: adminId },
      { name: "Mobile App", description: "Native mobile application for iOS and Android", status: "active", created_by: adminId },
      { name: "API Platform", description: "RESTful API platform for third-party integrations", status: "active", created_by: sarahId },
    ]).select();

    if (!projects || projects.length === 0) {
      throw new Error("Failed to create projects");
    }

    const mikeId = userIds["mike@taskflow.com"];
    const emmaId = userIds["emma@taskflow.com"];

    // Create demo tasks
    const today = new Date();
    const daysAgo = (n: number) => {
      const d = new Date(today);
      d.setDate(d.getDate() - n);
      return d.toISOString().split("T")[0];
    };
    const daysFromNow = (n: number) => {
      const d = new Date(today);
      d.setDate(d.getDate() + n);
      return d.toISOString().split("T")[0];
    };

    await supabase.from("tasks").insert([
      { title: "Design homepage mockup", description: "Create high-fidelity mockup for the new homepage", status: "completed", priority: "high", project_id: projects[0].id, assigned_to: sarahId, created_by: adminId, due_date: daysAgo(2) },
      { title: "Implement navigation bar", description: "Build responsive navigation with mobile hamburger menu", status: "in-progress", priority: "high", project_id: projects[0].id, assigned_to: mikeId, created_by: adminId, due_date: daysFromNow(3) },
      { title: "Set up CI/CD pipeline", description: "Configure GitHub Actions for automated deployments", status: "completed", priority: "medium", project_id: projects[0].id, assigned_to: emmaId, created_by: adminId, due_date: daysAgo(5) },
      { title: "Create user authentication flow", description: "Implement login, signup, and password reset", status: "in-progress", priority: "high", project_id: projects[0].id, assigned_to: sarahId, created_by: adminId, due_date: daysFromNow(5) },
      { title: "Design onboarding screens", description: "Create onboarding flow for new users", status: "pending", priority: "medium", project_id: projects[1].id, assigned_to: sarahId, created_by: adminId, due_date: daysFromNow(7) },
      { title: "Build push notification system", description: "Implement Firebase Cloud Messaging for push notifications", status: "pending", priority: "high", project_id: projects[1].id, assigned_to: mikeId, created_by: adminId, due_date: daysFromNow(10) },
      { title: "API authentication middleware", description: "JWT-based authentication for all API endpoints", status: "completed", priority: "high", project_id: projects[2].id, assigned_to: emmaId, created_by: sarahId, due_date: daysAgo(3) },
      { title: "Rate limiting implementation", description: "Add rate limiting to prevent API abuse", status: "in-progress", priority: "medium", project_id: projects[2].id, assigned_to: mikeId, created_by: sarahId, due_date: daysFromNow(2) },
      { title: "API documentation", description: "Write comprehensive API docs with examples", status: "pending", priority: "low", project_id: projects[2].id, assigned_to: emmaId, created_by: sarahId, due_date: daysFromNow(14) },
      { title: "Performance optimization", description: "Optimize page load times and reduce bundle size", status: "pending", priority: "medium", project_id: projects[0].id, assigned_to: null, created_by: adminId, due_date: daysAgo(1) },
      { title: "Database schema design", description: "Design and implement the database schema for the mobile app", status: "completed", priority: "high", project_id: projects[1].id, assigned_to: emmaId, created_by: adminId, due_date: daysAgo(7) },
      { title: "Write unit tests", description: "Add comprehensive test coverage for core modules", status: "pending", priority: "low", project_id: projects[0].id, assigned_to: null, created_by: adminId, due_date: daysFromNow(21) },
    ]);

    // Add project members
    await supabase.from("project_members").insert([
      { project_id: projects[0].id, user_id: adminId, role: "admin" },
      { project_id: projects[0].id, user_id: sarahId, role: "member" },
      { project_id: projects[0].id, user_id: mikeId, role: "member" },
      { project_id: projects[1].id, user_id: adminId, role: "admin" },
      { project_id: projects[1].id, user_id: sarahId, role: "member" },
      { project_id: projects[1].id, user_id: emmaId, role: "member" },
      { project_id: projects[2].id, user_id: sarahId, role: "admin" },
      { project_id: projects[2].id, user_id: mikeId, role: "member" },
      { project_id: projects[2].id, user_id: emmaId, role: "member" },
    ]);

    return new Response(JSON.stringify({ message: "Demo data seeded successfully", users: Object.keys(userIds).length, projects: projects.length }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
