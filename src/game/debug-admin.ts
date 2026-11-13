/**
 * Admin tools (free store, no ads) exist only in non-production builds:
 * `vite dev` and `vite build --mode development`.
 * A release build (`vite build`, the Play APK) constant-folds this to false.
 */
export const debugAdmin = import.meta.env.MODE !== "production";
