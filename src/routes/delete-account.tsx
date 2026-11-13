import { Fragment } from "react";
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
      {tr("del.none", { email: PRIVACY_EMAIL })
        .split("\n")
        .map((line, i) => (
          <p key={line} className={i === 0 ? "font-semibold text-fg" : undefined}>
            {line.split(PRIVACY_EMAIL).map((part, j) => (
              <Fragment key={j}>
                {j > 0 ? <EmailLink /> : null}
                {part}
              </Fragment>
            ))}
          </p>
        ))}
      <p>{tr("del.ads")}</p>
      <p>
        {tr("terms.contact", { email: "" })}
        <EmailLink />
      </p>
    </LegalPage>
  );
}

function EmailLink() {
  return (
    <a href={`mailto:${PRIVACY_EMAIL}`} className="inline-block whitespace-nowrap text-accent underline-offset-2 hover:underline" dir="ltr">
      {PRIVACY_EMAIL}
    </a>
  );
}
