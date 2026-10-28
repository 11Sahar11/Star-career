import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/privacy")({
  component: PrivacyPage,
});

function PrivacyPage() {
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-lg flex-col px-4 py-8">
      <h1 className="font-display text-4xl">Privacy & Play</h1>
      <div className="mt-4 grid gap-3 text-sm leading-6 text-muted">
        <p>STAR stores the career on this device. There is no account and no server profile.</p>
        <p>
          Ads have three seats: a menu banner that never covers a button, a skippable break after a season, and an optional clip that adds 1 to one attribute once a season. Nothing runs during a match. The daily race has no clip.
        </p>
        <p>
          To list on Google Play, package this HTTPS site as a Trusted Web Activity with Bubblewrap, and publish assetlinks.json with the Play App Signing certificate. Use AdMob test ids until review. Declare on-device storage and advertising in Data safety. Do not sell the boost outside Play Billing.
        </p>
        <p>הקריירה נשמרת על המכשיר. אין פרסומת באמצע משחק.</p>
      </div>
      <Link to="/" className="mt-6 text-sm text-gold">
        Back to STAR
      </Link>
    </main>
  );
}
