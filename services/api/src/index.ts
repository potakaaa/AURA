import { createApp } from "./app.js";
import { env } from "./config/env.js";
import { logger } from "./logger.js";

const app = createApp();

app.listen(env.PORT, () => {
  logger.info("api.started", {
    port: env.PORT,
    url: `http://localhost:${env.PORT}`,
  });
});
