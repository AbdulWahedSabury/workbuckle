// Shared admin class strings, built only from the site's theme tokens
// (app/globals.css): primary, primary-dark, ink, gray-1/2/3, line,
// rounded-sm-card. Text on `bg-primary` is `text-on-primary` (always dark):
// white on the brand orange doesn't meet contrast minimums, and `ink` turns
// light in the admin dark theme.

const focusRing =
  "outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-white";

const buttonBase = `inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-full px-5 text-sm font-semibold whitespace-nowrap transition-[background-color,border-color,color,transform] duration-200 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50 [&_svg]:size-4 [&_svg]:shrink-0 ${focusRing}`;

export const primaryButtonClass = `${buttonBase} bg-primary text-gray-100 hover:bg-primary-dark`;

export const secondaryButtonClass = `${buttonBase} border border-line bg-white text-ink hover:border-ink/20 hover:bg-gray-3`;

/** Square icon button for row actions. */
export const iconButtonClass = `inline-flex size-9 items-center justify-center rounded-full text-gray-2 transition-colors hover:bg-gray-3 hover:text-ink [&_svg]:size-4 ${focusRing}`;

// Kept under the old names so existing call sites read the same.
export const primaryLinkClass = primaryButtonClass;
export const secondaryLinkClass = secondaryButtonClass;

/** White surface used for tables, forms and stat tiles. */
export const cardClass = "rounded-sm-card border border-line bg-white";

export const fieldsetClass = `${cardClass} flex flex-col gap-5 p-5 sm:p-6`;

export const legendClass = "px-1 font-heading text-base font-semibold text-ink";
