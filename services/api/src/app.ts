import cors from "cors";
import express from "express";
import { healthRoute } from "./routes/health-route.js";
import { llmRoute } from "./routes/llm-route.js";
import { supabaseRoute } from "./routes/supabase-route.js";

export function createApp() {
  const app = express();

  app.use(cors());
  app.use(express.json({ limit: "1mb" }));

  app.get("/", (_req, res) => {
    res.json({
      service: "AURA API",
      endpoints: ["/health", "/llm/chat", "/supabase/status"],
    });
  });

  app.use("/health", healthRoute);
  app.use("/llm", llmRoute);
  app.use("/supabase", supabaseRoute);

  return app;
}
