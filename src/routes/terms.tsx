import { createFileRoute } from "@tanstack/react-router";
import { t } from "@/game/i18n";
import { PRIVACY_EMAIL } from "@/game/contact";
import { LegalPage, usePageLang } from "@/components/legal/LegalPage";

export const Route = createFileRoute("/terms")({
  head: () => ({ meta: [{ title: "Terms · STAR" }] }),
  component: TermsPage,
});

function TermsPage() {
  const lang = usePageLang();
  const tr = (key: string, vars?: Record<string, string>) => t(key, vars, lang);
  return (
    <LegalPage title={tr("legal.terms")} lang={lang}>
      <p className="text-xs">{tr("terms.updated")}</p>
      <p>{tr("terms.age")}</p>
      <p>{tr("terms.coins")}</p>
      <p>{tr("terms.asis")}</p>
      <p>{tr("terms.law")}</p>
      <p>
        {tr("terms.contact", { email: "" })}
        <a href={`mailto:${PRIVACY_EMAIL}`} className="text-accent" dir="ltr">
          {PRIVACY_EMAIL}
        </a>
      </p>
    </LegalPage>
  );
}
