import { defineConfig } from "@trigger.dev/sdk";
import { prismaExtension } from "@trigger.dev/build/extensions/prisma";

export default defineConfig({
  project: "proj_voadfpltnjdsnqkjchlx",
  runtime: "node",
  logLevel: "log",
  // The max compute seconds a task is allowed to run. If the task run exceeds this duration, it will be stopped.
  // You can override this on an individual task.
  // See https://trigger.dev/docs/runs/max-duration
  maxDuration: 3600,
  build: {
    // Keep the Liveblocks server packages out of the bundle and load them from
    // node_modules at runtime instead. They pull in node-fetch@2, whose
    // optional `encoding` dependency the bundler eagerly tries (and fails) to
    // resolve at build time — noisy index errors that risk dropping the
    // design-agent task. `encoding` is only used at runtime for non-UTF-8
    // responses, which the Liveblocks API never returns, so leaving these
    // external sidesteps the bundling issue without needing it installed.
    external: ["@liveblocks/node", "@liveblocks/react-flow"],
    // Prisma 7 with the `prisma-client` provider + a database adapter
    // (@prisma/adapter-pg). Modern mode marks @prisma/client as external and
    // works with the TypeScript-only client. The generated client lives in
    // app/generated/prisma (gitignored) and is produced by the `postinstall`
    // script (`prisma generate`) during the deploy install, so generate-spec
    // can persist ProjectSpec metadata.
    extensions: [prismaExtension({ mode: "modern" })],
  },
  retries: {
    enabledInDev: true,
    default: {
      maxAttempts: 3,
      minTimeoutInMs: 1000,
      maxTimeoutInMs: 10000,
      factor: 2,
      randomize: true,
    },
  },
  dirs: ["trigger"],
});
