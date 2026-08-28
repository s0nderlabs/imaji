// IMAJI LOGO ROUND 1: the hand and the three dots. 12 candidates, ~$1.80.
// Register: forr's whisper (hairline lowercase hand, more paper than ink) but
// imaji is a five-letter word with three dotted letters (i, j, i), so every lane
// is built around what the hand does with those three tittles. Four hands, each
// on GPT Image 2 (drawn hand) + Recraft V4.1 text-to-vector (real SVG), plus two
// lanes where the model paints the three dots in the accent so we can see the
// idea live instead of imagining it. Budget hard-capped at $2 by runJobs.
import { runJobs, type Job } from "./fal"

// Spelled out every time: five-letter words with a j drift to "imagi" / "imaj".
const WORD =
  " The brand name is the word imaji, lowercase, correctly spelled with exactly five letters i, m, a, j, i: it begins and ends with an i and has a j as the fourth letter. Three of the five letters carry a dot above them (the two i letters and the j)."

const PAPER =
  " Near-black ink on a plain warm off-white paper background, the mark small relative to the page and surrounded by generous empty paper. No gradients, no shadows, no 3D, no mockup scene, no decorative elements, no tagline, no icon. Unmistakably drawn by a masterful human hand, not a font. World-class studio identity, gallery-grade editorial restraint."

const ACCENT =
  " The only colour in the image: the three dots above the i, j and i are painted in a warm burnt orange (hex e8641a), small, round, deliberate, like three drops of ink from a second pen. Everything else stays near-black ink."

const LANES: Record<string, string> = {
  signature:
    "Hand-written lowercase wordmark imaji in an architect's quick personal hand: five distinct letters written in one sitting with a fine fountain pen, hairline weight, confident and unpolished, wide even letterspacing. The three dots above i, j, i are placed with care, evenly spaced, the quiet rhythm of the word. Clearly five separate letters, not connected cursive.",
  oneline:
    "Hand-written lowercase wordmark imaji drawn as ONE continuous hairline pen stroke that never lifts through all five letters, so the m, a and the body of the j flow from a single line, and the pen leaves the paper only three times: to place the three dots above i, j, i. The dots are the only separate marks in the word.",
  brush:
    "Hand-lettered lowercase wordmark imaji in one fast pass of a fine brush or felt marker: slightly heavier than a pen, visible speed in the strokes, the tail of the j a single confident sweep below the baseline, the three dots above i, j, i dabbed as three small round touches of the brush tip.",
  pencil:
    "Hand-written lowercase wordmark imaji in a draughtsman's soft graphite pencil: hairline, slightly sketchy, almost not there, a letterform study on tracing paper with a faint hand-ruled baseline left in place. The three dots above i, j, i are the firmest marks on the sheet.",
}

const jobs: Job[] = []
const gpt2 = (id: string, prompt: string): Job => ({
  id, endpoint: "fal-ai/gpt-image-2", outDir: "round1", estUsd: 0.22,
  input: { prompt, image_size: "landscape_16_9", quality: "high", output_format: "png" },
})
const vec = (id: string, prompt: string): Job => ({
  id, endpoint: "fal-ai/recraft/v4.1/text-to-vector", outDir: "round1", estUsd: 0.08,
  input: { prompt, image_size: "landscape_16_9" },
})

for (const [lane, p] of Object.entries(LANES)) {
  jobs.push(gpt2(`r1_${lane}_gpt2`, p + PAPER + WORD))
  jobs.push(vec(`r1_${lane}_vec`, p + PAPER + WORD))
}
// The three-dots idea, drawn live, on the two hands most likely to carry it.
for (const lane of ["signature", "oneline"]) {
  jobs.push(gpt2(`r1_${lane}dots_gpt2`, LANES[lane] + PAPER + ACCENT + WORD))
  jobs.push(vec(`r1_${lane}dots_vec`, LANES[lane] + PAPER + ACCENT + WORD))
}

console.log(`total jobs: ${jobs.length}`)
const { ok, failed } = await runJobs(jobs, 2)
console.log(`\nIMAJI LOGO R1: ${ok.length} ok, ${failed.length} failed`)
if (failed.length) console.log(failed.map(f => `  ${f.id}: ${f.error}`).join("\n"))
