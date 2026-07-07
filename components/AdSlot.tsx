import type { AdSlot as AdSlotType } from "@/lib/types";

export function AdSlot({
  slotKey,
  ads,
  variant = "rectangle",
  fallbackLabel = "Advertisement",
  fallbackHeadline = "Reach readers who shape what happens next.",
  fallbackLinkLabel = "Advertise with Insight ↗"
}: {
  slotKey: string;
  ads: AdSlotType[];
  variant?: "leaderboard" | "billboard" | "rectangle" | "infeed";
  fallbackLabel?: string;
  fallbackHeadline?: string;
  fallbackLinkLabel?: string;
}) {
  const ad = ads.find((item) => item.slot_key === slotKey);

  if (ad?.ad_mode === "automatic") {
    return (
      <aside className={`ad-slot ad-${variant} ad-automatic`} aria-label="Advertisement">
        <span>Automatic ad</span>
        {ad.network_code ? (
          <div className="ad-network-code">{ad.network_code}</div>
        ) : (
          <div>
            <b>Programmatic-ready premium inventory.</b>
            <a href="/advertise">Advertise with Insight ↗</a>
          </div>
        )}
      </aside>
    );
  }

  return (
    <aside className={`ad-slot ad-${variant}`} aria-label="Advertisement">
      <span>{ad?.sponsor_name || ad?.label || fallbackLabel}</span>
      <div>
        <b>{ad?.headline || fallbackHeadline}</b>
        <a href={ad?.target_url || "/advertise"}>{fallbackLinkLabel}</a>
      </div>
    </aside>
  );
}
