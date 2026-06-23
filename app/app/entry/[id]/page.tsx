import { redirect } from "next/navigation";

type EntryPageProps = {
  params: Promise<{ id: string }>;
};

export default async function EntryPage({ params }: EntryPageProps) {
  const { id } = await params;
  redirect(`/app/journal?edit=${id}`);
}
