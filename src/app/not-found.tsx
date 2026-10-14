import { DirectoryFrame } from "@/components/DirectoryFrame";

export default function NotFound() {
  return (
    <DirectoryFrame>
      <p className="studio-kicker">localsites</p>
      <h1 className="studio-title">This page is not on the directory.</h1>
      <p className="studio-deck">
        The shops that are live are listed on the front page.
      </p>
      <a className="studio-text-link" href="/">
        Back to the directory
      </a>
    </DirectoryFrame>
  );
}
