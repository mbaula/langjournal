type Testimonial = {
  quote: string;
  name: string;
  role: string;
};

const TESTIMONIALS: Testimonial[] = [
  {
    quote:
      "Languages like Twi are scarce online. Folio was the easiest way for me to start practicing — and get real value from day one.",
    name: "Kerren",
    role: "Early tester",
  },
  {
    quote:
      "I write a little every day. The // translate flow means I never break momentum when I forget a word.",
    name: "Jordan",
    role: "Daily journaler",
  },
  {
    quote:
      "One note per day keeps me honest. Seeing my entries stack up makes the habit stick.",
    name: "Priya",
    role: "Beta tester",
  },
];

export function LandingTestimonials() {
  return (
    <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6 sm:py-24 lg:px-8">
      <div className="max-w-2xl">
        <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-muted-foreground">
          From learners
        </p>
        <h2 className="mt-3 font-[family-name:var(--font-folio)] text-3xl font-semibold tracking-[-0.02em] text-foreground sm:text-4xl">
          Built for languages the internet forgot.
        </h2>
      </div>

      <ul className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 lg:gap-5">
        {TESTIMONIALS.map((item) => (
          <li
            key={item.name}
            className="flex flex-col rounded-2xl border border-border/80 bg-card/40 p-6 backdrop-blur-sm"
          >
            <blockquote className="flex flex-1 flex-col">
              <p className="text-[15px] leading-relaxed text-foreground">
                &ldquo;{item.quote}&rdquo;
              </p>
              <footer className="mt-6 border-t border-border/60 pt-4">
                <cite className="not-italic">
                  <span className="block text-sm font-semibold text-foreground">
                    {item.name}
                  </span>
                  <span className="mt-0.5 block text-[13px] text-muted-foreground">
                    {item.role}
                  </span>
                </cite>
              </footer>
            </blockquote>
          </li>
        ))}
      </ul>
    </section>
  );
}
