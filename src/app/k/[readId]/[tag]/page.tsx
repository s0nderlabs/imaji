import Link from "next/link";
import { notFound } from "next/navigation";

import { tokenForReadId } from "@/lib/readid";
import { listKits, readKit, readMeta } from "@/lib/store";
import { sweepInterrupted } from "@/lib/sweep";
import KitCard from "@/components/KitCard";
import KitHeader from "@/components/KitHeader";
import { isOnboarding } from "@/components/text";

export const dynamic = "force-dynamic";

export default async function KitPage({
  params,
}: PageProps<"/k/[readId]/[tag]">) {
  const { readId, tag } = await params;
  await sweepInterrupted();
  const token = await tokenForReadId(readId);
  if (!token) notFound();

  const [kit, meta, all] = await Promise.all([
    readKit(token, tag),
    readMeta(token, tag),
    listKits(token),
  ]);
  if (!kit) notFound();

  /* the release before this one, so the card can say what your Mind
     remembered. Only releases count: the onboarding sample is not one. */
  const releases = all.filter((k) => !isOnboarding(k.tag));
  const here = releases.findIndex((k) => k.tag === (meta?.tag ?? tag));
  const previousTag =
    here >= 0 && releases[here + 1] ? releases[here + 1].tag : undefined;

  return (
    <>
      <KitHeader repo={kit.repo} />
      <main className="pb-4">
        <p className="pb-4">
          <Link href={`/k/${readId}`} className="quiet-link text-link t-sm">
            All kits
          </Link>
        </p>
        <div className="rv" style={{ "--i": 1 } as React.CSSProperties}>
          <KitCard
            kit={kit}
            meta={meta}
            base={`/api/kits/${readId}/${encodeURIComponent(tag)}`}
            previousTag={previousTag}
          />
        </div>
      </main>
    </>
  );
}
