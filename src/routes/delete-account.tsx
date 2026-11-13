import { createFileRoute } from "@tanstack/react-router";
import { t } from "@/game/i18n";
import { PRIVACY_EMAIL } from "@/game/contact";
import { LegalPage, usePageLang } from "@/components/legal/LegalPage";

/** Public data-deletion page for the Play listing: the save is local; an optional account can be deleted on request. */
export const Route = createFileRoute("/delete-account")({
  head: () => ({ meta: [{ title: "Delete data · STAR" }] }),
  component: DeleteAccountPage,
});

function DeleteAccountPage() {
  const lang = usePageLang();
  const tr = (key: string, vars?: Record<string, string>) => t(key, vars, lang);
  return (
    <LegalPage title={tr("legal.delete")} lang={lang}>
      {/* {email} stays a literal placeholder until the owner picks the deletion contact. */}
      {tr("del.none")
        .split("\n")
        .map((line, i) => (
          <p key={line} className={i === 0 ? "font-semibold text-fg" : undefined}>
            {line}
          </p>
        ))}
      <p>{tr("del.ads")}</p>
      <p>
        {tr("terms.contact", { email: "" })}
        <a href={`mailto:${PRIVACY_EMAIL}`} className="text-accent" dir="ltr">
          {PRIVACY_EMAIL}
        </a>
      </p>
    </LegalPage>
  );
}
