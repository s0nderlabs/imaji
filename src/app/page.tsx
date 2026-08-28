import Link from "next/link";
import type { Metadata } from "next";
import { readFile } from "node:fs/promises";
import path from "node:path";

import CopyButton from "@/components/CopyButton";
import Disclosure from "@/components/Disclosure";
import FilmPlayer from "@/components/FilmPlayer";
import Curtain from "@/components/Curtain";
import RevealOnScroll from "@/components/RevealOnScroll";
import Switcher from "@/components/Switcher";
import ThemeToggle from "@/components/ThemeToggle";
import TokenMint from "@/components/TokenMint";
import Wordmark from "@/components/Wordmark";
import { loadShowcase } from "@/lib/showcase";

/* The front door, told as one narrative in one reading column: the sentence,
   the film, how a release becomes a kit, the rest of the kit, three things to
   start, and the sign-off. Nobody's private kits can appear here; the only
   kit on this page is the one this server was told to show off, which is
   imaji's own. */

export const dynamic = "force-dynamic";

const DESCRIPTION =
  "One release in, a whole launch kit out. Your own Mind writes the kit for every release you tag; imaji renders it. For solo builders who only ship.";

const REPO = "github.com/s0nderlabs/imaji";

const AGENT_PROMPT =
  "Set up imaji for this repository so my own Mind writes the launch kit for every release I tag. Read https://imaji.s0nderlabs.xyz/agents.md and follow it exactly. Ask me for my Minds API key and Mind ID before you start; never commit them. When you're done, tell me to open my Mind and reply to its brand proposal.";

/* how a release becomes a kit: the claim is the row, the paragraph unfolds */
const BEATS = [
  {
    say: "Your Mind is triggered by your work, not by you. You never prompt it.",
    body: "You tag a release, and nothing about the way you ship changes. A GitHub Action in your repo sees the tag and wakes your own Mind, the one that already knows your brand.",
  },
  {
    say: "It remembers every release, every correction, every colour you changed.",
    body: "Your Mind reads the notes, then reads them against everything it already knows: your voice, your colours, every release before this one. It decides what each channel needs, and it writes them.",
  },
  {
    say: "It refuses: a typo fix earns no kit, and it says so in your voice.",
    body: "imaji has no memory and no taste. It takes the copy and the look your Mind decided on and renders them: the card, the film, the vertical cut, and a launch video when the release is a launch. Nothing is posted; the kit lands on a private page only you hold the link to.",
  },
  {
    say: "Ask it in chat, and the result lands on the same page.",
    body: "Releases are the trigger, not the only door. Ask your Mind for a launch video or a fresh card in a chat and it calls imaji the same way; the kit page is where everything it makes ends up.",
  },
];

async function readRepoFile(rel: string): Promise<string | null> {
  try {
    const text = await readFile(path.join(process.cwd(), rel), "utf8");
    return text.trim().length > 0 ? text : null;
  } catch {
    return null;
  }
}

/* the card is addressed relatively, so it needs a base to become absolute.
   A malformed IMAJI_BASE_URL is not worth a 500 on the front door. */
function metadataBase(): URL | undefined {
  const base = (process.env.IMAJI_BASE_URL || "").trim();
  if (!base) return undefined;
  try {
    return new URL(base);
  } catch {
    return undefined;
  }
}

export async function generateMetadata(): Promise<Metadata> {
  const showcase = await loadShowcase();
  const base = metadataBase();
  return {
    title: "imaji",
    description: DESCRIPTION,
    ...(base ? { metadataBase: base } : {}),
    openGraph: {
      title: "imaji",
      description: DESCRIPTION,
      type: "website",
      ...(showcase.card
        ? { images: [{ url: showcase.card, width: 1200, height: 630 }] }
        : {}),
    },
  };
}

export default async function Home() {
  const [showcase, job, workflow] = await Promise.all([
    loadShowcase(),
    readRepoFile("job/JOB.md"),
    readRepoFile("templates/imaji.yml"),
  ]);

  const v = showcase.version;
  const filmVersion = showcase.film ? v : showcase.fold.version;

  return (
    <div className="fd">
      <RevealOnScroll />
      <Curtain />

      <header className="fd-top">
        <div className="fd-col">
          <Link href="/" className="fd-mark" aria-label="imaji, home">
            <Wordmark />
          </Link>
          <nav className="fd-nav" aria-label="Site">
            <a href="#start">Start</a>
            <Link href="/docs">Docs</Link>
            <a href={`https://${REPO}`} target="_blank" rel="noreferrer noopener">
              GitHub
            </a>
            <ThemeToggle />
          </nav>
        </div>
      </header>

      <main>
        <section className="fd-fold fd-page">
          <div className="fd-col">
            <h1 className="fd-h1" style={{ "--i": 0 } as React.CSSProperties}>
              A developer who ships is a creator whose content is{" "}
              <span className="fd-hot">code</span>.
            </h1>
            <p className="fd-lede" style={{ "--i": 1 } as React.CSSProperties}>
              Your own Mind (Minds by Animoca Brands) turns each release into
              the posts, the card and the film you never had time to make. It
              reads the release, remembers every release before this one, and
              decides what this one earns. imaji only renders.
            </p>
            <div className="fd-frame" style={{ "--i": 2 } as React.CSSProperties}>
              <FilmPlayer
                src={showcase.film ? showcase.film.src : showcase.fold.src}
                poster={showcase.film ? showcase.film.poster : showcase.fold.poster}
                offset={1.2}
                label={`The ten second film imaji rendered for its own ${filmVersion} release`}
              />
            </div>

          </div>
        </section>

        <section className="fd-seq fd-page">
          <div className="fd-col">
            <h2 className="fd-h2" data-reveal>
              How a release becomes a kit.
            </h2>
            <div data-reveal>
              <Disclosure items={BEATS} />
            </div>
          </div>
        </section>

        <section className="fd-kit fd-page">
          <div className="fd-col">
            <h2 className="fd-h2" data-reveal>
              The rest of the kit for {v}.
            </h2>
            <p className="fd-lede" data-reveal>
              Your Mind wrote all of it in one pass, and decided for itself what
              each channel needed.
            </p>

            <div data-reveal>
              <Switcher
                tabs={[
                  ...(showcase.card
                    ? [
                        {
                          key: "card",
                          label: "Card",
                          node: (
                            <>
                              <div className="fd-plate">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                  src={showcase.card}
                                  alt={`The ${v} social card`}
                                  width={1200}
                                  height={630}
                                />
                              </div>
                            </>
                          ),
                        },
                      ]
                    : []),
                  ...(showcase.launch
                    ? [
                        {
                          key: "launch",
                          label: "Launch video",
                          node: (
                            <>
                              <div className="fd-plate fd-frame">
                                <FilmPlayer
                                  src={showcase.launch.src}
                                  poster={showcase.launch.poster}
                                  label={`The launch video for ${v}`}
                                />
                              </div>
                            </>
                          ),
                        },
                      ]
                    : []),
                  ...(showcase.vertical
                    ? [
                        {
                          key: "vertical",
                          label: "Vertical cut",
                          node: (
                            <div className="fd-portrait">
                              <div className="fd-plate fd-frame fd-tall">
                                <FilmPlayer
                                  src={showcase.vertical.src}
                                  offset={5}
                                  label={`The vertical cut for ${v}`}
                                />
                              </div>
                            </div>
                          ),
                        },
                      ]
                    : []),
                  ...(showcase.tweet
                    ? [
                        {
                          key: "tweet",
                          label: "Tweet",
                          node: (
                            <div className="fd-text" tabIndex={0} role="region" aria-label="The tweet">
                              <p>{showcase.tweet}</p>
                            </div>
                          ),
                        },
                      ]
                    : []),
                  ...(showcase.thread.length > 0
                    ? [
                        {
                          key: "thread",
                          label: "Thread",
                          node: (
                            <div className="fd-text" tabIndex={0} role="region" aria-label="The thread">
                              {showcase.thread.map((part, i) => (
                                <p key={i}>{part}</p>
                              ))}
                            </div>
                          ),
                        },
                      ]
                    : []),
                  ...(showcase.linkedin.length > 0
                    ? [
                        {
                          key: "linkedin",
                          label: "LinkedIn",
                          node: (
                            <div className="fd-text" tabIndex={0} role="region" aria-label="The LinkedIn post">
                              {showcase.linkedin.map((part, i) => (
                                <p key={i}>{part}</p>
                              ))}
                            </div>
                          ),
                        },
                      ]
                    : []),
                  {
                    key: "kept",
                    label: "What it kept",
                    node: (
                      <div className="fd-text" tabIndex={0} role="region" aria-label="What your Mind kept">
                        {showcase.memory ? <p>{showcase.memory}</p> : null}
                        {showcase.skipped.length > 0 ? (
                          <p>
                            <span className="fd-say">Left out, on purpose.</span>{" "}
                            {showcase.skipped.join(" ")}
                          </p>
                        ) : null}
                        <p>{showcase.made}</p>
                      </div>
                    ),
                  },
                ]}
              />
            </div>
          </div>
        </section>

        <section className="fd-start fd-page" id="start">
          <div className="fd-col">
            <h2 className="fd-h2" data-reveal>
              Three things, about eight minutes.
            </h2>
            <div className="fd-steps">
              <div className="fd-step" data-reveal>
                <h3>Hand your Mind the job.</h3>
                <p>
                  Paste the job description into a chat with your own Mind. It is
                  prose, not config, and the only prompt anyone ever writes.
                </p>
                <div className="fd-row">
                  <CopyButton
                    text={job ?? ""}
                    label="Copy the job"
                    variant="primary"
                    icon={false}
                    className={job ? "" : "pointer-events-none opacity-40"}
                  />
                </div>
              </div>

              <div className="fd-step" data-reveal>
                <h3>Drop the workflow in your repo.</h3>
                <p>
                  Copy it into <code>.github/workflows</code> with three secrets,
                  then run onboarding once so your Mind can read the repo and
                  propose your brand.
                </p>
                <div className="fd-row">
                  <CopyButton
                    text={workflow ?? ""}
                    label="Copy the workflow"
                    variant="primary"
                    icon={false}
                    className={workflow ? "" : "pointer-events-none opacity-40"}
                  />
                </div>
              </div>

              <div className="fd-step fd-mint" data-reveal>
                <h3>Mint a kit token.</h3>
                <p>
                  One button. It lets your Mind post a kit and keeps those kits
                  private. Shown once, so keep it.
                </p>
                <div className="fd-row">
                  <TokenMint />
                </div>
              </div>
            </div>
            <p className="fd-agent" data-reveal>
              Using a coding agent to set it up?{" "}
              <CopyButton
                text={AGENT_PROMPT}
                label="Copy the prompt"
                variant="link"
                icon={false}
              />
              .
            </p>
          </div>
        </section>
      </main>

      <footer className="fd-foot fd-page">
        <div className="fd-col">
          <p className="fd-sign" data-reveal>
            For solo builders who only ship.
          </p>
          <div className="fd-legal">
            <span>Apache-2.0, s0nderlabs</span>
            <span className="fd-legal-links">
              <Link href="/docs">Docs</Link>
              <a href={`https://${REPO}`} target="_blank" rel="noreferrer noopener">
                {REPO}
              </a>
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}
