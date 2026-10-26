export default function CampaignDetailsLoading() {
  return (
    <div className="space-y-8" aria-busy="true" aria-label="Loading campaign">
      <div className="h-6 w-32 animate-pulse rounded bg-[#e9e9e5]" />
      <div className="h-28 animate-pulse rounded-lg bg-[#e9e9e5]" />
      <div className="h-80 animate-pulse rounded-xl border bg-white" />
    </div>
  );
}
