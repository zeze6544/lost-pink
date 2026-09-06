import { DocPage, DocQuestion, DocsAnswer } from "@/components/SiteFrame";
import { supportQuestions } from "@/lib/docs-truth";

export default function SupportPage() {
  return (
    <DocPage title="support">
      {supportQuestions().map((item) => (
        <DocQuestion key={item.q} q={item.q}>
          <DocsAnswer text={item.a} />
        </DocQuestion>
      ))}
    </DocPage>
  );
}
