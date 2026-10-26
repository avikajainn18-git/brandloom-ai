export default function CampaignsLoading() {
  return (
    <div className="space-y-8" aria-busy="true" aria-label="Loading campaigns">
      <div className="h-28 animate-pulse rounded-lg bg-[#e9e9e5]" />
      <div className="h-64 animate-pulse rounded-xl border bg-white" />
    </div>
  );
}
