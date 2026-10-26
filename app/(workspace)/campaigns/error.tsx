"use client";

export default function CampaignsError({
  reset,
}: {
  reset: () => void;
}) {
  return (
    <section className="rounded-xl border border-[#e4caca] bg-[#fff8f8] p-6">
      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#8d3f3f]">
        Campaigns unavailable
      </p>
      <h1 className="mt-2 text-xl font-semibold tracking-[-0.025em] text-[#252525]">
        Campaign data could not be loaded
      </h1>
      <p className="mt-2 max-w-xl text-sm leading-6 text-[#6e4b4b]">
        Confirm the campaign ownership migration has been applied to the connected Supabase project, then try again.
      </p>
      <button
        type="button"
        onClick={() => reset()}
        className="mt-5 rounded-lg border border-[#cdaaaa] bg-white px-4 py-2.5 text-sm font-medium text-[#6d3838] hover:bg-[#fffdfd] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#252525]"
      >
        Try again
      </button>
    </section>
  );
}
