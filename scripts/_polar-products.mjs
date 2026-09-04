import { readFileSync, writeFileSync } from "node:fs";
import { Polar } from "@polar-sh/sdk";

const env = Object.fromEntries(
  readFileSync(".env.local", "utf8")
    .split(/\r?\n/)
    .filter((line) => line && !line.startsWith("#") && line.includes("="))
    .map((line) => {
      const i = line.indexOf("=");
      return [
        line.slice(0, i).trim(),
        line.slice(i + 1).trim().replace(/^["']|["']$/g, ""),
      ];
    }),
);

const polar = new Polar({
  accessToken: env.POLAR_ACCESS_TOKEN,
  server: env.POLAR_SERVER === "production" ? "production" : "sandbox",
});

const wanted = [
  {
    key: "POLAR_PRODUCT_MAILBOX_MONTH",
    name: "lost.pink inbox — 1 month",
    description: "$5 once for 1 month access",
    recurringInterval: null,
    amount: 500,
  },
  {
    key: "POLAR_PRODUCT_MAILBOX_SUB",
    name: "lost.pink inbox — yearly",
    description: "$20 annually",
    recurringInterval: "year",
    amount: 2000,
  },
  {
    key: "POLAR_PRODUCT_MAILBOX",
    name: "lost.pink inbox — 12 months",
    description: "$20 once for 12 month access",
    recurringInterval: null,
    amount: 2000,
  },
  {
    key: "POLAR_PRODUCT_MAILBOX_DAY",
    name: "lost.pink inbox — 1 day",
    description: "$1 for 1 day access",
    recurringInterval: null,
    amount: 100,
  },
];

const listed = await polar.products.list({ limit: 100, isArchived: false });
const existing = [];
for await (const page of listed) {
  const recs = page.result?.items ?? page.items ?? [];
  for (const product of recs) {
    if (product?.id && product?.name) existing.push(product);
  }
}

function priceOf(product) {
  const price = (product.prices ?? []).find((p) => p.amountType === "fixed");
  return price?.priceAmount ?? null;
}

const ids = {};
for (const spec of wanted) {
  const match = existing.find(
    (product) =>
      product.name === spec.name &&
      priceOf(product) === spec.amount &&
      (product.recurringInterval ?? null) === spec.recurringInterval,
  );
  if (match) {
    ids[spec.key] = match.id;
    continue;
  }
  const created = await polar.products.create({
    name: spec.name,
    description: spec.description,
    recurringInterval: spec.recurringInterval,
    prices: [
      {
        amountType: "fixed",
        priceAmount: spec.amount,
        priceCurrency: "aud",
      },
    ],
  });
  ids[spec.key] = created.id;
}

writeFileSync(
  "scripts/_polar-product-ids.json",
  JSON.stringify(
    {
      server: env.POLAR_SERVER,
      previous: {
        POLAR_PRODUCT_MAILBOX: env.POLAR_PRODUCT_MAILBOX ?? null,
        POLAR_PRODUCT_MAILBOX_SUB: env.POLAR_PRODUCT_MAILBOX_SUB ?? null,
      },
      ids,
      existing: existing.map((p) => ({
        id: p.id,
        name: p.name,
        recurring: p.recurringInterval ?? null,
        amount: priceOf(p),
      })),
    },
    null,
    2,
  ),
);
console.log("wrote scripts/_polar-product-ids.json");
console.log(JSON.stringify(ids, null, 2));
