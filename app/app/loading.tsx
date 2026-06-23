export default function AppLoading() {
  return (
    <div className="animate-pulse space-y-6" aria-busy aria-label="Loading">
      <div className="h-8 w-48 rounded-md bg-muted" />
      <div className="space-y-3">
        <div className="h-4 w-full max-w-xl rounded bg-muted" />
        <div className="h-4 w-5/6 max-w-lg rounded bg-muted" />
      </div>
      <div className="h-56 w-full rounded-xl bg-muted/80" />
    </div>
  );
}
