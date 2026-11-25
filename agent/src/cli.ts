import {
  buildReadiness,
  defaultStorePath,
  FileStore,
  runMorningReview
} from "@coachops/shared";

const VERSION = "0.1.0";
const store = new FileStore(defaultStorePath());
const cmd = process.argv[2] ?? "ready";

async function main() {
  if (cmd === "ready") {
    const readiness = await buildReadiness(VERSION);
    console.log(JSON.stringify(readiness, null, 2));
    process.exit(readiness.ok ? 0 : 1);
  }

  if (cmd === "review") {
    const review = await runMorningReview();
    await store.saveReview(review);
    console.log(JSON.stringify(review, null, 2));
    return;
  }

  if (cmd === "reset-demo") {
    await store.resetDemo();
    console.log(JSON.stringify({ ok: true }, null, 2));
    return;
  }

  console.error(`Unknown command: ${cmd}`);
  process.exit(2);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
