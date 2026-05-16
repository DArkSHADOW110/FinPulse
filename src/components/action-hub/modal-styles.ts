/** Shared theme-aware classes for Action Hub modals (light + dark). */

export const MODAL_SELECT =
  "mt-2 flex h-10 w-full rounded-xl border border-[var(--input-border)] bg-[var(--input-bg)] px-4 text-sm text-text-primary transition-all focus:border-primary focus:outline-none focus:ring-2 focus:ring-[var(--primary-glow)]";

export const MODAL_INPUT =
  "mt-2 border-[var(--input-border)] bg-[var(--input-bg)] text-text-primary placeholder:text-text-tertiary";

export const MODAL_LABEL = "text-text-tertiary";

export const MODAL_PANEL =
  "rounded-xl border border-[var(--border)] bg-[var(--item-hover)]";

export const MODAL_CHECKBOX_LABEL = "flex cursor-pointer items-center gap-2 text-sm text-text-secondary";

export const MODAL_TAB_ACTIVE =
  "flex-1 rounded-lg py-2 text-xs font-bold uppercase tracking-wider bg-primary/20 text-primary shadow-[0_0_15px_var(--primary-glow)]";

export const MODAL_TAB_INACTIVE =
  "flex-1 rounded-lg py-2 text-xs font-bold uppercase tracking-wider text-text-tertiary transition-all hover:text-text-primary";

export const MODAL_FILTER_GROUP =
  "mb-5 flex rounded-xl border border-[var(--border)] bg-[var(--item-hover)] p-1";
