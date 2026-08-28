import { notFound } from "next/navigation";

import { tokenForReadId } from "@/lib/readid";
import { listKits, readKit } from "@/lib/store";
import { sweepInterrupted } from "@/lib/sweep";
import EarlierKits, { type EarlierKit } from "@/components/EarlierKits";
import KitCard from "@/components/KitCard";
import KitHeader from "@/components/KitHeader";
import { dayMonth, isOnboarding } from "@/components/text";

export const dynamic = "force-dynamic";

export default async function KitIndex({ params }: PageProps<"/k/[readId]">) {
  const { readId } = await params;
  await sweepInterrupted();
  const token = await tokenForReadId(readId);
  if (!token) notFound();

  const kits = await listKits(token);

  /* The onboarding sample is not a release, so it never takes the front of
     the desk: releases newest first, the sample last. */
  const releases = kits.filter((k) => !isOnboarding(k.tag));
  const samples = kits.filter((k) => isOnboarding(k.tag));
  const ordered = [...releases, ...samples];
  const newest = ordered[0] ?? null;

  const repo = newest?.repo;

  if (!newest) {
    return (
      <>
        <KitHeader />
        <main className="flex flex-1 flex-col justify-center py-16">
          <h1 className="t-xl">Nothing here yet.</h1>
          <p className="measure mt-4 text-ink-2">
            Tag a release and come back. The kit for it shows up on this page
            on its own, no refreshing and nothing to click.
          </p>
          <div className="measure mt-8 t-sm text-ink-3">
            <p>
              If you have already tagged one, check that{" "}
              <code className="ver">.github/workflows/imaji.yml</code> is in the
              repo, that <code className="ver">MINDS_API_KEY</code>,{" "}
              <code className="ver">MIND_ID</code> and{" "}
              <code className="ver">IMAJI_KIT_TOKEN</code> are set as secrets,
              and that you ran the onboard job once so your Mind could read the
              repo and propose your brand.
            </p>
          </div>
        </main>
      </>
    );
  }

  const [newestKit, earlierKits] = await Promise.all([
    readKit(token, newest.tag),
    Promise.all(ordered.slice(1).map((m) => readKit(token, m.tag))),
  ]);

  const previous = ordered[1];
  const previousTag =
    previous && !isOnboarding(previous.tag) && !isOnboarding(newest.tag)
      ? previous.tag
      : undefined;

  const earlier: EarlierKit[] = ordered.slice(1).map((m, i) => ({
    tag: m.tag,
    href: `/k/${readId}/${encodeURIComponent(m.tag)}`,
    headline: earlierKits[i]?.card.headline || m.tag,
    date: dayMonth(m.receivedAt),
    onboarding: isOnboarding(m.tag),
  }));

  return (
    <>
      <KitHeader repo={repo} />
      <main className="flex flex-col gap-4 pb-4">
        {newestKit ? (
          <div className="rv" style={{ "--i": 1 } as React.CSSProperties}>
            <KitCard
              kit={newestKit}
              meta={newest}
              base={`/api/kits/${readId}/${encodeURIComponent(newest.tag)}`}
              previousTag={previousTag}
            />
          </div>
        ) : null}

        {earlier.length > 0 ? (
          <div
            className="rv mt-2"
            style={{ "--i": 2 } as React.CSSProperties}
          >
            <EarlierKits items={earlier} />
          </div>
        ) : null}
      </main>
    </>
  );
}
