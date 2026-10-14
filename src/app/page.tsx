import { DirectoryFrame, StudioMark } from "@/components/DirectoryFrame";
import { lostEntryHref } from "@/lib/hosts";
import { headers } from "next/headers";

export default async function DirectoryPage() {
  const host = await headers();
  const hostHeader = host.get("x-forwarded-host") || host.get("host");
  const lostHref = lostEntryHref(hostHeader);

  return (
    <DirectoryFrame>
      <header>
        <div className="flex items-center gap-3">
          <StudioMark />
          <p className="studio-kicker">directory</p>
        </div>
        <h1 className="studio-title">localsites</h1>
        <p className="studio-deck">
          Websites for neighbourhood shops. The site is made here, and ordering
          stays on the tools the shop already uses: the phone, the map, and the
          checkout they run now.
        </p>
      </header>

      <hr className="studio-rule" />

      <ol className="studio-list">
        <li>
          <a className="studio-card studio-card-live" href="/jaws">
            <span className="studio-index">01 · live</span>
            <div>
              <h2 className="studio-card-name">Jaws Fish &amp; Chips</h2>
              <p className="studio-place">Ferntree Gully VIC 3156</p>
              <p>
                Fish and chips on Glenfern Road. The page carries their menu
                and links out to order: pickup and Delivery By Uber on
                CloudWaitress, plus Uber Eats and the shop phone.
              </p>
              <span className="studio-go">Open the site</span>
            </div>
          </a>
        </li>
        <li>
          <div className="studio-slot" aria-label="Room for a future client">
            <span className="studio-index">02</span>
            <div>
              <p className="studio-empty">
                The next shop will be listed here when there is one.
              </p>
            </div>
          </div>
        </li>
      </ol>

      <section className="mt-14" aria-labelledby="product-heading">
        <h2 id="product-heading" className="studio-kicker">
          Also from this studio
        </h2>
        <a className="studio-card studio-card-product mt-4" href={lostHref}>
          <span className="studio-index">product</span>
          <div>
            <h3 className="studio-card-name">lost.pink</h3>
            <p className="studio-place">Existing product</p>
            <p>
              An inbox you keep, and a page you can leave. This is the product
              that was already here, on its own address.
            </p>
            <span className="studio-go">Open lost.pink</span>
          </div>
        </a>
      </section>

      <footer className="studio-foot">
        <span>localsites</span>
        <span>Sites, wired to the counter the shop already has.</span>
      </footer>
    </DirectoryFrame>
  );
}
