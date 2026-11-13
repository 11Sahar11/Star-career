import { createFileRoute } from "@tanstack/react-router";
import { t } from "@/game/i18n";
import { PRIVACY_EMAIL } from "@/game/contact";
import { LegalPage, usePageLang } from "@/components/legal/LegalPage";

/** Public data-deletion page for the Play listing: no account, the save is local. */
export const Route = createFileRoute("/delete-account")({
  head: () => ({ meta: [{ title: "Delete data · STAR" }] }),
  component: DeleteAccountPage,
});

function DeleteAccountPage() {
  const lang = usePageLang();
  const tr = (key: string, vars?: Record<string, string>) => t(key, vars, lang);
  return (
    <LegalPage title={tr("legal.delete")} lang={lang}>
      <p className="font-semibold text-fg">{tr("del.none")}</p>
      <p>{tr("del.local")}</p>
      <p>{tr("del.inApp", { reset: tr("reset") })}</p>
      <div>
        <p>{tr("del.all")}</p>
        <ul className="mt-1 grid gap-1 ps-5 [list-style:disc]">
          <li>{tr("del.android")}</li>
          <li>{tr("del.web")}</li>
        </ul>
      </div>
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
