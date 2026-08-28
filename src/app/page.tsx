import Link from "next/link";
import type { Metadata } from "next";
import { readFile } from "node:fs/promises";
import path from "node:path";

import CopySheet from "@/components/CopySheet";
import Disclosure from "@/components/Disclosure";
import FilmPlayer from "@/components/FilmPlayer";
import RevealOnScroll from "@/components/RevealOnScroll";
import { LinkedInLogo, LinkedInPost, XLogo, XPost, XThread, liAge, xDate, type Author } from "@/components/SocialMock";
import Switcher from "@/components/Switcher";
import ThemeToggle from "@/components/ThemeToggle";
import TokenMint from "@/components/TokenMint";
import Wordmark from "@/components/Wordmark";
import { loadShowcase } from "@/lib/showcase";

/* The front door, told as one narrative in one reading column: the sentence,
   the film, how a release becomes a kit, the rest of the kit, the questions
   people ask, three things to start, and the sign-off. Nobody's private kits
   can appear here; the only kit on this page is the one this server was told
   to show off, which is imaji's own. */

export const dynamic = "force-dynamic";

const DESCRIPTION =
  "One release in, a whole launch kit out. Your own Mind writes the kit for every release you tag; imaji renders it. For solo builders who only ship.";

const REPO = "github.com/s0nderlabs/imaji";

const AGENT_PROMPT =
  "Set up imaji for this repository so my own Mind writes the launch kit for every release I tag. Read https://imaji.s0nderlabs.xyz/agents.md and follow it exactly. Ask me for my Minds API key and Mind ID before you start; never commit them. When you're done, tell me to open my Mind and reply to its brand proposal.";

/* how a release becomes a kit, in the order it happens; always visible */
const STEPS = [
  {
    who: "you",
    say: "Tag a release.",
    body: "Nothing about the way you ship changes. gh release create is the whole trigger.",
  },
  {
    who: "GitHub",
    say: "An Action wakes your Mind.",
    body: "The workflow in your repo sends your own Mind the tag, the notes and the diff. Nobody types a prompt.",
  },
  {
    who: "your Mind",
    say: "It reads, remembers, decides.",
    body: "It reads the notes against everything it already knows: your voice, your colours, every release before this one. It decides what this one earns.",
  },
  {
    who: "your Mind",
    say: "It writes every word.",
    body: "The tweet, the thread, the LinkedIn post, the card copy, the film lines, and, when the release is a launch, a storyboard.",
  },
  {
    who: "imaji",
    say: "imaji renders, the kit lands.",
    body: "Card, film, vertical cut, launch video, exactly as written, on a private page only you hold the link to. Nothing is posted.",
  },
];

/* the questions people actually ask, answered straight */
const FAQ = [
  {
    say: "Do I ever have to prompt it?",
    body: "No. A GitHub Action in your repo wakes your Mind every time you publish a release. You hand it the job once, in a chat; after that the trigger is your work, not you.",
  },
  {
    say: "What does it remember?",
    body: "Every release before this one, every correction you made, every colour you changed. That memory lives in your Mind, on your account, not in imaji. So the kit for your next release says \"building on the last one\" without being told.",
  },
  {
    say: "What if the release is just a typo fix?",
    body: "It refuses. A dependency bump or a typo fix earns nothing, and your Mind says so in your voice. Saying no is a valid kit, and it is one of the things a template can never do.",
  },
  {
    say: "Can I ask for something without tagging a release?",
    body: "Yes. Ask your Mind in chat for a fresh card for a talk, the launch video for an older release, or a vertical cut only. It calls imaji the same way, and the result lands on the same private page.",
  },
  {
    say: "Does it post anything for me?",
    body: "No. Nothing is auto-posted. The kit lands on a private page at a link only you hold, and you decide what goes where. The release comment is opt-in.",
  },
  {
    say: "Whose Mind is it, and what does imaji actually do?",
    body: "Your own Mind, on your own Minds account. imaji never runs one for you and never shares one between users. imaji has no memory and no taste: it turns the words and the look your Mind decided on into a card, a film and the cuts, deterministically, from HTML.",
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

function lines(text: string | null): string {
  if (!text) return "";
  const n = text.split("\n").length;
  return `${n} lines`;
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

  const author: Author = {
    name: showcase.brand.name,
    handle: showcase.repo.split("/")[0] || showcase.brand.name,
    logo: showcase.brand.logo,
    ground: showcase.brand.ground,
    sub: showcase.repo,
  };
  const postedX = xDate(showcase.receivedAt);
  const postedLi = liAge(showcase.receivedAt);
  const cardAlt = `The ${v} social card`;

  return (
    <div className="fd">
      <RevealOnScroll />

      <main>
        <section className="fd-fold">
          <header className="fd-top">
            <div className="fd-col">
              <Link href="/" className="fd-mark" aria-label="imaji, home">
                <Wordmark />
              </Link>
              <nav className="fd-nav" aria-label="Site">
                <a href="#how">How</a>
                <a href="#start">Start</a>
                <Link href="/docs">Docs</Link>
                <a href={`https://${REPO}`} target="_blank" rel="noreferrer noopener">
                  GitHub
                </a>
                <ThemeToggle />
              </nav>
            </div>
          </header>
          <div className="fd-col fd-hero">
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
            <p className="fd-cap" style={{ "--i": 3 } as React.CSSProperties}>
              The ten second film imaji rendered for its own{" "}
              <span className="v">{filmVersion}</span> release. Every word in it
              was written by a Mind.
            </p>
          </div>
        </section>

        <div className="fd-after">
          <section className="fd-seq" id="how">
            <div className="fd-col">
              <h2 className="fd-h2" data-reveal>
                How a release becomes a kit.
              </h2>
              <p className="fd-lede" data-reveal>
                Five steps. You do the first one, the way you already do.
              </p>
              <ol className="fd-steps5" data-reveal>
                {STEPS.map((step, i) => (
                  <li key={step.say} className={`fd-s5 fd-s5-${step.who.replace(/\s/g, "-")}`}>
                    <span className="fd-s5-n" aria-hidden>
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <span className="fd-s5-who">{step.who}</span>
                    <h3>{step.say}</h3>
                    <p>{step.body}</p>
                  </li>
                ))}
              </ol>
            </div>
          </section>

          <section className="fd-kit">
            <div className="fd-col">
              <h2 className="fd-h2" data-reveal>
                The rest of the kit for {v}.
              </h2>
              <p className="fd-lede" data-reveal>
                Your Mind wrote all of it in one pass, and decided for itself
                what each channel needed. The posts are shown the way they will
                look where they are going.
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
                              <div className="fd-plate">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img src={showcase.card} alt={cardAlt} width={1200} height={630} />
                              </div>
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
                              <div className="fd-plate fd-frame">
                                <FilmPlayer
                                  src={showcase.launch.src}
                                  poster={showcase.launch.poster}
                                  label={`The launch video for ${v}`}
                                />
                              </div>
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
                                <p className="fd-cap">
                                  1080 by 1920, for Shorts, Reels and TikTok.
                                </p>
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
                            icon: <XLogo className="fd-tabicon" />,
                            node: (
                              <div className="fd-social">
                                <XPost
                                  author={author}
                                  text={showcase.tweet}
                                  when={postedX}
                                  media={showcase.card}
                                  mediaAlt={cardAlt}
                                />
                                <p className="fd-cap">
                                  {showcase.tweet.length} characters, the card attached.
                                </p>
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
                            icon: <XLogo className="fd-tabicon" />,
                            node: (
                              <div className="fd-social">
                                <XThread
                                  author={author}
                                  parts={showcase.thread}
                                  when={postedX}
                                  media={showcase.card}
                                  mediaAlt={cardAlt}
                                />
                                <p className="fd-cap">
                                  {showcase.thread.length} posts, each under 280 characters.
                                </p>
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
                            icon: <LinkedInLogo className="fd-tabicon" />,
                            node: (
                              <div className="fd-social">
                                <LinkedInPost
                                  author={author}
                                  paragraphs={showcase.linkedin}
                                  when={postedLi}
                                  media={showcase.card}
                                  mediaAlt={cardAlt}
                                />
                                <p className="fd-cap">
                                  Written for people who do not follow the repo.
                                </p>
                              </div>
                            ),
                          },
                        ]
                      : []),
                    {
                      key: "kept",
                      label: "What it kept",
                      node: (
                        <div className="fd-kept" role="region" aria-label="What your Mind kept">
                          {showcase.memory ? (
                            <div className="fd-kept-row">
                              <span className="fd-kept-k">Remembered</span>
                              <p>{showcase.memory}</p>
                            </div>
                          ) : null}
                          {showcase.skipped.length > 0 ? (
                            <div className="fd-kept-row">
                              <span className="fd-kept-k">Left out, on purpose</span>
                              <p>{showcase.skipped.join(" ")}</p>
                            </div>
                          ) : null}
                          <div className="fd-kept-row">
                            <span className="fd-kept-k">How it happened</span>
                            <p>{showcase.made}</p>
                          </div>
                        </div>
                      ),
                    },
                  ]}
                />
              </div>
            </div>
          </section>

          <section className="fd-faq" id="faq">
            <div className="fd-col">
              <h2 className="fd-h2" data-reveal>
                Questions, answered.
              </h2>
              <div data-reveal>
                <Disclosure items={FAQ} />
              </div>
            </div>
          </section>

          <section className="fd-start" id="start">
            <div className="fd-col">
              <h2 className="fd-h2" data-reveal>
                Three things, about eight minutes.
              </h2>
              <p className="fd-lede" data-reveal>
                Everything you copy is shown here, in full, next to its button.
              </p>
              <div className="fd-steps">
                <div className="fd-step" data-reveal>
                  <h3>
                    <span className="fd-step-n">1</span>Hand your Mind the job.
                  </h3>
                  <p>
                    Paste the job description into a chat with your own Mind. It is
                    prose, not config, and the only prompt anyone ever writes.
                  </p>
                  <CopySheet
                    file="job.md"
                    fact={job ? `${lines(job)}, prose` : undefined}
                    text={job ?? ""}
                    label="Copy the job"
                    kind="prose"
                    disabled={!job}
                  />
                </div>

                <div className="fd-step" data-reveal>
                  <h3>
                    <span className="fd-step-n">2</span>Drop the workflow in your repo.
                  </h3>
                  <p>
                    Copy it into <code>.github/workflows</code> with three secrets,
                    then run onboarding once so your Mind can read the repo and
                    propose your brand.
                  </p>
                  <CopySheet
                    file=".github/workflows/imaji.yml"
                    fact={workflow ? `${lines(workflow)}, YAML` : undefined}
                    text={workflow ?? ""}
                    label="Copy the workflow"
                    kind="code"
                    disabled={!workflow}
                  />
                  <p className="fd-secrets">
                    <span>Secrets it needs</span>
                    <code>MINDS_API_KEY</code>
                    <code>MIND_ID</code>
                    <code>IMAJI_KIT_TOKEN</code>
                  </p>
                </div>

                <div className="fd-step fd-mint" data-reveal>
                  <h3>
                    <span className="fd-step-n">3</span>Mint a kit token.
                  </h3>
                  <p>
                    One button. It lets your Mind post a kit and keeps those kits
                    private. Shown once, so keep it.
                  </p>
                  <div className="fd-row">
                    <TokenMint />
                  </div>
                </div>
              </div>

              <div className="fd-agent" data-reveal>
                <p>
                  Using a coding agent to set it up? Paste this instead, and it
                  does all three for you.
                </p>
                <CopySheet
                  file="one prompt"
                  fact="reads /agents.md"
                  text={AGENT_PROMPT}
                  label="Copy the prompt"
                  kind="quote"
                />
              </div>
            </div>
          </section>

          <footer className="fd-foot">
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
      </main>
    </div>
  );
}
