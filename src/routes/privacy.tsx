import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { loadLang, t, type Lang } from "@/game/i18n";
import { PRIVACY_EMAIL } from "@/game/contact";

export const Route = createFileRoute("/privacy")({
  component: PrivacyPage,
});

function PrivacyPage() {
  const [lang, setLang] = useState<Lang>("en");
  useEffect(() => {
    const chosen = loadLang();
    setLang(chosen);
    document.documentElement.lang = chosen;
    document.documentElement.dir = chosen === "he" ? "rtl" : "ltr";
  }, []);
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-lg flex-col px-4 py-8">
      <h1 className="font-display text-4xl">{t("privacy", undefined, lang)}</h1>
      <div className="mt-4 grid gap-3 text-sm leading-6 text-muted">
        <p>{t("privacyLead", undefined, lang)}</p>
        <p>{t("privacyData", undefined, lang)}</p>
        <p>{t("privacyAds", undefined, lang)}</p>
        <p>{t("privacyAdsData", undefined, lang)}</p>
        <p>{t("privacyContact", { email: PRIVACY_EMAIL }, lang)}</p>
      </div>
      <Link to="/" className="mt-6 inline-flex min-h-12 items-center self-start text-sm text-accent">
        {t("back", undefined, lang)}
      </Link>
    </main>
  );
}
