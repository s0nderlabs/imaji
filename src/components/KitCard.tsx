import type { KitJSON } from "@/lib/kit";
import type { CardStatus, FilmStatus, Meta } from "@/lib/store";

import CopyButton from "./CopyButton";
import { LinkedInLogo, LinkedInPost, XLogo, XPost, XThread, liAge, xDate, type Author } from "./SocialMock";
import VideoPanel from "./VideoPanel";
import {
  asSentence,
  madeSentence,
  paragraphs,
  shortDate,
  splitAccentWord,
  unescapeCopy,
} from "./text";

/* The one kit in focus: the only pure white sheet on the page.
   Everything above the fold is what your Mind decided; everything below is
   what it wrote, each channel with exactly one action. */

function Words({
  heading,
  icon,
  action,
  children,
}: {
  heading: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="w">
      <div className="w-head">
        <h2>
          {icon}
          {heading}
        </h2>
        {action}
      </div>
      <div className="w-body">{children}</div>
    </section>
  );
}

export default function KitCard({
  kit,
  meta,
  base,
  previousTag,
}: {
  kit: KitJSON;
  meta: Meta | null;
  /** /api/kits/{readId}/{tag}, where every file for this kit lives */
  base: string;
  /** the tag of the kit before this one, when there is one */
  previousTag?: string;
}) {
  const outputs = meta?.outputs ?? kit.outputs;
  const cardStatus: CardStatus =
    meta?.status.card ?? (outputs.includes("card") ? "done" : "none");
  const filmStatus: FilmStatus = meta?.status.film ?? "none";
  const verticalStatus: FilmStatus = meta?.status.vertical ?? "none";
  const launchStatus: FilmStatus = meta?.status.launch ?? "none";

  /* meta.error is one field shared by every render, so it belongs to whichever
     one actually failed. meta.errors carries the per-render message when the
     kit was written by a server that had it. */
  const errorFor = (
    kind: "card" | "film" | "vertical" | "launch",
    status: CardStatus | FilmStatus,
  ) => (status === "failed" ? (meta?.errors?.[kind] ?? meta?.error) : undefined);

  const tweet = kit.tweet ? unescapeCopy(kit.tweet) : null;
  const thread = kit.thread.map(unescapeCopy).filter(Boolean);
  const linkedin = kit.linkedin ? paragraphs(kit.linkedin) : [];

  const headline = kit.card.headline || kit.version;
  const author: Author = {
    name: kit.brand.name,
    handle: kit.repo.split("/")[0] || kit.brand.name,
    logo: kit.brand.logoUrl ?? null,
    ground: kit.brand.ground === "light" ? "light" : "dark",
    sub: kit.repo,
  };
  const postedX = xDate(meta?.receivedAt);
  const postedLi = liAge(meta?.receivedAt);
  const split = splitAccentWord(headline, kit.card.accentWord);
  /* one visual gets the whole tray; two or more share it */
  const mediaCount = [cardStatus, filmStatus, verticalStatus, launchStatus].filter(
    (s) => s !== "none",
  ).length;

  return (
    <article className="kit">
      <div className="kit-top">
        <span>
          <span className="ver num">{kit.version}</span>
          {meta ? (
            <span className="num"> · {shortDate(meta.receivedAt)}</span>
          ) : null}
        </span>
        {kit.releaseUrl ? (
          <a
            href={kit.releaseUrl}
            target="_blank"
            rel="noreferrer noopener"
            className="quiet-link"
          >
            Release notes
          </a>
        ) : null}
      </div>

      <h1 className="kit-head">
        {split ? (
          <>
            {split[0]}
            <em>{split[1]}</em>
            {split[2]}
          </>
        ) : (
          headline
        )}
      </h1>

      <p className="kit-made measure">{madeSentence(meta, previousTag)}</p>

      {mediaCount > 0 ? (
        <div className={mediaCount === 1 ? "media solo" : "media"}>
          {launchStatus !== "none" ? (
            <VideoPanel
              kind="launch"
              noun="launch video"
              metaHref={`${base}/meta.json`}
              videoHref={`${base}/launch.mp4`}
              posterHref={cardStatus === "done" ? `${base}/card.png` : null}
              initialStatus={launchStatus}
              initialError={errorFor("launch", launchStatus)}
              mode="cue"
              wide
            />
          ) : null}

          {cardStatus !== "none" ? (
            <figure>
              <div
                className={`frame frame-wide${
                  cardStatus === "failed" ? " is-failed" : ""
                }`}
              >
                {cardStatus === "done" ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    src={`${base}/card.png`}
                    alt={headline}
                    width={1200}
                    height={630}
                  />
                ) : (
                  <div className="frame-hold">
                    <p>
                      {errorFor("card", cardStatus) ??
                        "Everything else in this kit is ready."}
                    </p>
                  </div>
                )}
              </div>
              <figcaption>
                <span>
                  {cardStatus === "done"
                    ? "The card, 1200 × 630"
                    : "The card did not render"}
                </span>
                {cardStatus === "done" ? (
                  <a
                    href={`${base}/card.png`}
                    target="_blank"
                    rel="noreferrer noopener"
                    className="quiet-link"
                  >
                    Open
                  </a>
                ) : null}
              </figcaption>
            </figure>
          ) : null}

          {filmStatus !== "none" ? (
            <VideoPanel
              kind="film"
              noun="film"
              metaHref={`${base}/meta.json`}
              videoHref={`${base}/film.mp4`}
              posterHref={cardStatus === "done" ? `${base}/card.png` : null}
              initialStatus={filmStatus}
              initialError={errorFor("film", filmStatus)}
              note="3840 × 2160"
            />
          ) : null}

          {verticalStatus !== "none" ? (
            <VideoPanel
              kind="vertical"
              noun="vertical cut"
              metaHref={`${base}/meta.json`}
              videoHref={`${base}/film-vertical.mp4`}
              initialStatus={verticalStatus}
              initialError={errorFor("vertical", verticalStatus)}
              aspect="portrait"
              note="2160 × 3840"
            />
          ) : null}
        </div>
      ) : null}

      <div className="words">
        {tweet ? (
          <Words
            heading="The tweet"
            icon={<XLogo className="w-icon" />}
            action={<CopyButton text={tweet} label="Copy" />}
          >
            <div className="w-mock">
              <XPost
                author={author}
                text={tweet}
                when={postedX}
                media={cardStatus === "done" ? `${base}/card.png` : null}
                mediaAlt={headline}
              />
              <p className="w-note num">{tweet.length} characters, the card attached.</p>
            </div>
          </Words>
        ) : null}

        {thread.length > 0 ? (
          <Words
            heading="The thread"
            icon={<XLogo className="w-icon" />}
            action={
              <CopyButton text={thread.join("\n\n")} label="Copy all" />
            }
          >
            <div className="w-mock">
              <XThread
                author={author}
                parts={thread}
                when={postedX}
                media={cardStatus === "done" ? `${base}/card.png` : null}
                mediaAlt={headline}
              />
              <ol className="w-parts">
                {thread.map((part, i) => (
                  <li key={i}>
                    <span className="num">{i + 1}</span>
                    <span className="num">{part.length} chars</span>
                    <CopyButton text={part} label="Copy" variant="bare" />
                  </li>
                ))}
              </ol>
            </div>
          </Words>
        ) : null}

        {linkedin.length > 0 ? (
          <Words
            heading="For LinkedIn"
            icon={<LinkedInLogo className="w-icon" />}
            action={
              <CopyButton text={linkedin.join("\n\n")} label="Copy" />
            }
          >
            <div className="w-mock">
              <LinkedInPost
                author={author}
                paragraphs={linkedin}
                when={postedLi}
                media={cardStatus === "done" ? `${base}/card.png` : null}
                mediaAlt={headline}
              />
            </div>
          </Words>
        ) : null}
      </div>

      <div className="notes measure">
        {kit.memory ? (
          <p>
            <b>What your Mind keeps.</b> {asSentence(kit.memory)}
          </p>
        ) : null}
        {kit.skipped.length > 0 ? (
          <p>
            <b>What your Mind left out, on purpose.</b>{" "}
            {kit.skipped.map((s) => asSentence(s)).join(" ")}
          </p>
        ) : null}
        <p className="t-xs text-ink-3">
          Nothing was posted anywhere.
        </p>
      </div>
    </article>
  );
}
