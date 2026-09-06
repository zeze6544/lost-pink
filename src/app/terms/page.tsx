import { DocPage, DocQuestion, DocsAnswer } from "@/components/SiteFrame";
import { termsQuestions } from "@/lib/docs-truth";

export default function TermsPage() {
  return (
    <DocPage
      title="terms"
      tagline="human-readable summary · effective may 20, 2025"
    >
      {termsQuestions().map((item) => (
        <DocQuestion key={item.q} q={item.q}>
          <DocsAnswer text={item.a} />
        </DocQuestion>
      ))}
    </DocPage>
  );
}
