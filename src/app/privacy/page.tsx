import { DocPage, DocQuestion, DocsAnswer } from "@/components/SiteFrame";
import { privacyQuestions } from "@/lib/docs-truth";

export default function PrivacyPage() {
  return (
    <DocPage title="privacy" tagline="private, not anonymous.">
      {privacyQuestions().map((item) => (
        <DocQuestion key={item.q} q={item.q}>
          <DocsAnswer text={item.a} />
        </DocQuestion>
      ))}
    </DocPage>
  );
}
