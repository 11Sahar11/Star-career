import { createRootRoute, HeadContent, Outlet, Scripts } from "@tanstack/react-router";
import { AuthProvider } from "@/lib/auth/provider";
import { PreviewHostBridge } from "@/components/preview-host-bridge";
import appCss from "../styles.css?url";

const APP_NAME = "STAR";

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1, viewport-fit=cover" },
      { title: APP_NAME },
      { name: "description", content: "A football player career. Pick a country at 16 and climb to a European final." },
      { name: "theme-color", content: "#f3f1ec" },
    ],
    links: [
      { rel: "icon", type: "image/svg+xml", href: "/favicon.svg" },
      { rel: "preload", as: "image", href: "/loading-bg.webp", type: "image/webp", fetchPriority: "high" },
      { rel: "stylesheet", href: appCss },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        // Matchday Paper: Inter (body) + Oswald (display) for Latin, Assistant for Hebrew.
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Oswald:wght@500;600;700&family=Assistant:wght@400;500;600;700;800&display=swap",
      },
      { rel: "manifest", href: "/manifest.webmanifest" },
      { rel: "apple-touch-icon", href: "/icons/apple-touch-icon.png" },
    ],
  }),
  component: () => (
    <html lang="en" dir="ltr" className="antialiased" suppressHydrationWarning>
      <head>
        <HeadContent />
        {/* Set lang/dir from the saved language before first paint (no LTR flash in Hebrew). */}
        <script
          dangerouslySetInnerHTML={{
            __html:
              'try{var l=localStorage.getItem("star-lang");if(l==="he"||l==="es"||l==="fr"){document.documentElement.lang=l;document.documentElement.dir=l==="he"?"rtl":"ltr"}}catch(e){}',
          }}
        />
      </head>
      <body>
        <PreviewHostBridge />
        <AuthProvider>
          <Outlet />
        </AuthProvider>
        <Scripts />
      </body>
    </html>
  ),
});
