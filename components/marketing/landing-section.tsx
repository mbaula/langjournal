import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

type LandingAccent =
  | "bar-left"
  | "border-top"
  | "glow-top"
  | "glow-right"
  | "glow-left";

export type LandingTone = "default" | "brand";

type LandingSectionProps = {
  id?: string;
  eyebrow?: string;
  title: string;
  description?: ReactNode;
  children?: ReactNode;
  className?: string;
  tone?: LandingTone;
  accent?: LandingAccent;
  align?: "left" | "center";
  layout?: "stack" | "split";
  visual?: ReactNode;
  visualSide?: "left" | "right";
};

const landingAccentClass: Record<LandingAccent, string> = {
  "bar-left": "landing-accent-bar-left",
  "border-top": "landing-accent-border-top",
  "glow-top": "landing-accent-glow-top",
  "glow-right": "landing-accent-glow-right",
  "glow-left": "landing-accent-glow-left",
};

function LandingSectionHeader({
  eyebrow,
  title,
  description,
  align = "left",
  tone = "default",
}: Pick<
  LandingSectionProps,
  "eyebrow" | "title" | "description" | "align" | "tone"
>) {
  const isBrand = tone === "brand";

  return (
    <>
      {eyebrow ? (
        <p
          className={cn(
            "mb-4 text-[11px] font-medium uppercase tracking-[0.2em]",
            isBrand
              ? "text-sidebar-primary-foreground/60"
              : "text-sidebar-primary",
            align === "center" && "text-center",
          )}
        >
          {eyebrow}
        </p>
      ) : null}
      <h2
        className={cn(
          "font-[family-name:var(--font-folio)] text-[clamp(1.875rem,4.5vw,3rem)] font-semibold leading-[1.05] tracking-[-0.03em]",
          isBrand
            ? "text-sidebar-primary-foreground"
            : "text-foreground",
          align === "center" ? "mx-auto max-w-2xl text-center" : "max-w-2xl",
        )}
      >
        {title}
      </h2>
      {description ? (
        <p
          className={cn(
            "mt-4 text-base leading-relaxed sm:text-[17px]",
            isBrand
              ? "text-sidebar-primary-foreground/75"
              : "text-muted-foreground",
            align === "center"
              ? "mx-auto max-w-2xl text-center"
              : "max-w-2xl",
          )}
        >
          {description}
        </p>
      ) : null}
    </>
  );
}

export function LandingSection({
  id,
  eyebrow,
  title,
  description,
  children,
  className,
  tone = "default",
  accent,
  align = "left",
  layout = "stack",
  visual,
  visualSide = "right",
}: LandingSectionProps) {
  const isSplit = layout === "split" && visual;
  const isBrand = tone === "brand";

  return (
    <section
      id={id}
      className={cn(
        "relative scroll-mt-16 overflow-hidden border-b",
        isBrand
          ? "border-sidebar-primary-foreground/10 bg-sidebar-primary text-sidebar-primary-foreground"
          : "border-border/60 bg-background",
        !isBrand && accent && landingAccentClass[accent],
        isBrand && accent === "border-top" && "landing-accent-border-top-brand",
        className,
      )}
    >
      <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6 sm:py-24 lg:px-8">
        {isSplit ? (
          <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
            <div
              className={cn(
                visualSide === "right" ? "lg:pr-4" : "lg:order-2 lg:pl-4",
              )}
            >
              <LandingSectionHeader
                eyebrow={eyebrow}
                title={title}
                description={description}
                align="left"
                tone={tone}
              />
              {children}
            </div>
            <div
              className={cn(
                visualSide === "left" && "lg:order-1",
                visualSide === "right" ? "lg:pl-2" : "lg:pr-2",
              )}
            >
              {visual}
            </div>
          </div>
        ) : (
          <>
            <LandingSectionHeader
              eyebrow={eyebrow}
              title={title}
              description={description}
              align={align}
              tone={tone}
            />
            {children}
          </>
        )}
      </div>
    </section>
  );
}

export function LandingBulletList({
  items,
  className,
  centered = false,
  tone = "default",
}: {
  items: string[];
  className?: string;
  centered?: boolean;
  tone?: LandingTone;
}) {
  const isBrand = tone === "brand";

  return (
    <ul
      className={cn(
        "space-y-4",
        centered ? "mx-auto mt-10 max-w-xl" : "mt-10",
        className,
      )}
    >
      {items.map((item) => (
        <li
          key={item}
          className={cn(
            "flex gap-3 text-[15px] leading-relaxed",
            isBrand
              ? "text-sidebar-primary-foreground/80"
              : "text-muted-foreground",
          )}
        >
          <span
            className={cn(
              "mt-2 size-1.5 shrink-0 rounded-full",
              isBrand
                ? "bg-sidebar-primary-foreground/70"
                : "bg-sidebar-primary",
            )}
            aria-hidden
          />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}
