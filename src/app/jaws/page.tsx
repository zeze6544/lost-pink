import { directoryHref } from "@/lib/hosts";
import { jawsMenus, type JawsCategory, type JawsItem } from "@/content/jaws-menu";
import type { Metadata } from "next";
import { headers } from "next/headers";

export const metadata: Metadata = {
  title: { absolute: "Jaws Fish & Chips" },
  description:
    "Jaws Fish & Chips, unit 2/79 Glenfern Rd, Ferntree Gully VIC 3156. Menu, hours, and links to order.",
};

const ORDER_URL = "https://jawsfishandchips.cloudwaitress.com.au/";
const UBER_URL =
  "https://www.ubereats.com/au/store/jaws-fish-&-chips/B3wuu2UaVgSBfpQdaWWMBQ";
const MAP_URL =
  "https://www.google.com/maps/search/?api=1&query=unit%202%2F79%20Glenfern%20Rd%2C%20Ferntree%20Gully%20VIC%203156";
const PHONE_TEL = "tel:+61397580166";
const PHONE_LABEL = "03 9758 0166";

const HOURS: { day: string; hours: string }[] = [
  { day: "Monday", hours: "Closed" },
  { day: "Tuesday", hours: "11:00–20:00" },
  { day: "Wednesday", hours: "11:00–20:00" },
  { day: "Thursday", hours: "11:00–20:00" },
  { day: "Friday", hours: "11:00–20:30" },
  { day: "Saturday", hours: "11:00–20:00" },
  { day: "Sunday", hours: "11:00–20:00" },
];

const allDay = jawsMenus.find((menu) => menu.name === "MENU");
const lunch = jawsMenus.find((menu) => menu.name === "LUNCH SPECIAL");

function slug(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

function Item({ item }: { item: JawsItem }) {
  return (
    <article className="jaws-item">
      <h4>{item.name}</h4>
      <p className="jaws-price">{item.price}</p>
      {item.outOfStock ? <p className="jaws-stock">Out of stock</p> : null}
      {item.subtitle ? <p className="jaws-sub">{item.subtitle}</p> : null}
      {item.description ? <p className="jaws-desc">{item.description}</p> : null}
      {item.options?.map((group) => (
        <p className="jaws-options" key={group.label}>
          {group.label}:{" "}
          {group.options
            .map((option) =>
              option.price
                ? `${option.name} (option ${option.price})`
                : option.name,
            )
            .join(" · ")}
        </p>
      ))}
    </article>
  );
}

function CategoryBlock({
  category,
  idPrefix = "",
}: {
  category: JawsCategory;
  idPrefix?: string;
}) {
  const id = `${idPrefix}${slug(category.name)}`;
  return (
    <section className="jaws-cat" id={id} aria-labelledby={`${id}-title`}>
      <h3 id={`${id}-title`}>{category.name}</h3>
      {category.description ? (
        <p className="jaws-cat-note">{category.description}</p>
      ) : null}
      {category.items.map((item) => (
        <Item key={item.name} item={item} />
      ))}
    </section>
  );
}

export default async function JawsPage() {
  const host = await headers();
  const home = directoryHref(host.get("x-forwarded-host") || host.get("host"));

  return (
    <div className="jaws-wrap">
      <header className="jaws-top">
        <a className="jaws-brand" href="#top">
          <Fin />
          Jaws
        </a>
        <p>Glenfern Rd · Ferntree Gully · 3156</p>
      </header>

      <div className="jaws-hero" id="top">
        <div>
          <img
            className="jaws-logo"
            src="/jaws/logo.png"
            alt="Jaws Fish & Chips logo"
          />
          <h1>
            Fish &amp; chips
            <span>on Glenfern Road</span>
          </h1>
          <p className="jaws-lede">
            Unit 2, 79 Glenfern Rd, Ferntree Gully. A neighbourhood chippy at
            the foot of the ranges. This page lists the shop’s menu and opens
            the ordering they already use.
          </p>
        </div>
        <figure className="jaws-photo">
          <img
            src="/jaws/header.jpg"
            alt="Fish, chips, burgers, and a wrap, the header image on the Jaws order page"
          />
          <figcaption>Header from the Jaws order page</figcaption>
        </figure>
      </div>

      <hr className="jaws-water" />

      <section className="jaws-facts" aria-label="Contact and hours">
        <div>
          <h2>Visit</h2>
          <p className="jaws-address">
            unit 2/79 Glenfern Rd
            <br />
            Ferntree Gully VIC 3156
          </p>
          <a className="jaws-phone" href={PHONE_TEL}>
            {PHONE_LABEL}
          </a>
        </div>
        <div>
          <h2>Hours</h2>
          <dl className="jaws-hours">
            {HOURS.map((row) => (
              <div key={row.day}>
                <dt>{row.day}</dt>
                <dd>{row.hours}</dd>
              </div>
            ))}
          </dl>
        </div>
        <div>
          <h2>Service</h2>
          <p className="jaws-fee">
            A 2% service fee applies to all orders. Pickup, and delivery listed
            on the order page as Delivery By Uber.
          </p>
        </div>
      </section>

      <nav className="jaws-order" aria-label="Order">
        <a href={ORDER_URL} target="_blank" rel="noreferrer">
          <strong>Order direct</strong>
          <span>Pickup and Delivery By Uber. Opens CloudWaitress.</span>
        </a>
        <a href={UBER_URL} target="_blank" rel="noreferrer">
          <strong>Uber Eats</strong>
          <span>Their Uber Eats store.</span>
        </a>
        <a href={PHONE_TEL}>
          <strong>Call</strong>
          <span>{PHONE_LABEL}</span>
        </a>
        <a href={MAP_URL} target="_blank" rel="noreferrer">
          <strong>Map</strong>
          <span>unit 2/79 Glenfern Rd</span>
        </a>
      </nav>

      <div className="jaws-menu-head">
        <h2>Menu</h2>
        <p>Prices from the CloudWaitress menu. A 2% service fee applies to all orders.</p>
      </div>

      <div className="jaws-layout">
        <nav className="jaws-nav" aria-label="Menu categories">
          {allDay?.categories.map((category) => (
            <a key={category.name} href={`#${slug(category.name)}`}>
              {category.name}
            </a>
          ))}
          {lunch ? <a href="#lunch-special">Lunch special</a> : null}
        </nav>
        <div>
          {allDay?.categories.map((category) => (
            <CategoryBlock key={category.name} category={category} />
          ))}
        </div>
      </div>

      {lunch ? (
        <section className="jaws-lunch" id="lunch-special" aria-labelledby="lunch-title">
          <div className="jaws-lunch-head">
            <h2 id="lunch-title">Lunch special</h2>
            <p>
              Tuesday to Sunday, 11:00–15:00. The order page shows this menu
              during those hours. A 2% service fee applies to all orders.
              Option amounts are the prices stored on the order page.
            </p>
          </div>
          {lunch.categories.map((category) => (
            <CategoryBlock
              key={category.name}
              category={category}
              idPrefix="lunch-"
            />
          ))}
        </section>
      ) : null}

      <footer className="jaws-foot">
        <p>
          Jaws Fish &amp; Chips · unit 2/79 Glenfern Rd, Ferntree Gully VIC 3156
        </p>
        <p>
          <a href={home}>A localsites site</a>
        </p>
      </footer>
    </div>
  );
}

function Fin() {
  return (
    <svg className="jaws-fin" viewBox="0 0 32 32" aria-hidden="true">
      <path
        fill="currentColor"
        d="M5 25.5c5.2-1.2 7.4-8.6 9.2-16.2.7 5.4 3.2 10.6 12.4 14.2-5.6.8-11.2 1.6-21.6 2z"
      />
      <path
        d="M4 28.2h24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.2"
      />
    </svg>
  );
}
