import { createApp } from "./app";
import { env } from "./shared/config/env";
import { logger } from "./shared/logger/logger";

const app = createApp();

app.listen(env.port, () => {
  logger.info({ port: env.port }, "IndustryOps AI server started");
});
