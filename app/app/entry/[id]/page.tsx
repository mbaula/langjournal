type EntryPageProps = {
  params: Promise<{ id: string }>;
};

export default async function EntryPage({ params }: EntryPageProps) {
  const { id } = await params;

  return (
    <div className="space-y-2">
      <h1 className="text-2xl font-semibold">Entry</h1>
      <p className="font-mono text-sm text-muted-foreground">{id}</p>
    </div>
  );
}
