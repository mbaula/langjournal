"use client";

import dynamic from "next/dynamic";

import { JournalWriteBodySkeleton } from "@/components/journal/journal-write-body-skeleton";
import type { JournalWriteBodyProps } from "@/components/journal/journal-write-body";

const JournalWriteBody = dynamic(
  () =>
    import("@/components/journal/journal-write-body").then(
      (mod) => mod.JournalWriteBody,
    ),
  {
    ssr: false,
    loading: () => <JournalWriteBodySkeleton />,
  },
);

export function JournalWriteBodyLoader(props: JournalWriteBodyProps) {
  return <JournalWriteBody {...props} />;
}
