/**
 * One-time scrub: drop recovery email and Polar IDs from public Blob page JSON.
 * Run with Blob configured: npx tsx scripts/scrub-blob-mailbox-pii.ts
 */
import { blobListAll, blobUpdatePage } from "../src/lib/pages-blob";

async function main() {
  const pages = await blobListAll();
  let cleaned = 0;
  for (const page of pages) {
    const dirty = page as unknown as Record<string, unknown>;
    if (
      dirty.mailbox_recovery_email ||
      dirty.mailbox_polar_order_id ||
      dirty.recovery_email
    ) {
      await blobUpdatePage(page, page.slug);
      cleaned += 1;
    }
  }
  console.log(`scrubbed ${cleaned} of ${pages.length} blob pages`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
