import Link from "next/link";

export function DevAccountPreviewBanner() {
  return (
    <div className="border-b border-amber-200/80 bg-amber-50 px-4 py-2 text-center text-[12px] text-amber-950 sm:px-6">
      Dev preview — mock account data. Saves won&apos;t persist.{" "}
      <Link
        href="/api/dev/exit-account-preview"
        className="font-medium underline underline-offset-2 hover:text-amber-900"
      >
        Exit preview
      </Link>
    </div>
  );
}
