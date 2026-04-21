import { Router } from "express";

export const supabaseRoute = Router();

// Placeholder for upcoming Supabase integration (Auth + Postgres).
supabaseRoute.get("/status", (_req, res) => {
  res.json({
    ready: false,
    message: "Supabase integration is not configured yet.",
  });
});
