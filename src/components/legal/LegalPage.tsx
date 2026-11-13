import { useEffect, useState, type ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { loadLang, t, type Lang } from "@/game/i18n";

/** The saved game language, applied to <html> after hydration (server renders English). */
export function usePageLang(): Lang {
  const [lang, setLang] = useState<Lang>("en");
  useEffect(() => {
    const chosen = loadLang();
    setLang(chosen);
    document.documentElement.lang = chosen;
    document.documentElement.dir = chosen === "he" ? "rtl" : "ltr";
  }, []);
  return lang;
}

/** A plain public page (terms, data deletion, licenses): title, short copy, back to the game. */
export function LegalPage({ title, lang, children }: { title: string; lang: Lang; children: ReactNode }) {
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-lg flex-col px-4 py-8">
      <h1 className="font-display text-4xl">{title}</h1>
      <div className="mt-4 grid gap-3 text-sm leading-6 text-muted">{children}</div>
      <Link to="/" className="mt-6 inline-flex min-h-12 items-center self-start text-sm text-accent">
        {t("back", undefined, lang)}
      </Link>
    </main>
  );
}
