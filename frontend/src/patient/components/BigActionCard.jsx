// One huge, single-purpose button. The patient app's entire home screen
// is four of these and nothing else -- no dense cards, no secondary
// actions, no small print.
function BigActionCard({ icon: Icon, title, subtitle, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex min-h-[190px] flex-col items-center justify-center gap-3 rounded-[28px] border-2 border-border bg-card p-6 text-center shadow-brand-sm transition-transform active:scale-[0.97] sm:min-h-[230px] sm:gap-4 sm:p-8"
    >
      <span className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full bg-accent sm:h-24 sm:w-24">
        <Icon className="h-10 w-10 text-primary sm:h-12 sm:w-12" aria-hidden="true" />
      </span>

      <span className="text-2xl font-bold text-foreground sm:text-3xl">
        {title}
      </span>

      {subtitle && (
        <span className="text-base leading-snug text-muted-foreground sm:text-lg">
          {subtitle}
        </span>
      )}
    </button>
  );
}

export default BigActionCard;
