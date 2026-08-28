// IMAJI LOGO ROUND 2: 3a (the brush hand) refined, six candidates, ~$0.96.
// The reference is the actual round-1 image, fed to the edit endpoints so the
// letterforms survive and only the execution moves. Accent locked: Tigerlily
// (Pantone 17-1456, #E2583E). Two lanes let the models paint the dots in it;
// the rest stay monochrome for mastering. Plus one Recraft vectorize of the
// original for a real SVG. Hard cap $1 in runJobs.
import { getKey, runJobs, type Job } from "./fal"

const HAND =
  " Near-black brush ink on a plain warm off-white paper background, the mark surrounded by generous empty paper. No gradients, no shadows, no 3D, no mockup scene, no decorative elements, no tagline. It must remain visibly hand-lettered with a brush, not a font. World-class studio identity, gallery-grade editorial restraint. The brand name is the word imaji, lowercase, correctly spelled with exactly five letters i, m, a, j, i: it begins and ends with an i and has a j as the fourth letter. Three of the five letters carry a dot above them (the two i letters and the j)."

const REF = "The reference image is a hand-lettered lowercase brush wordmark imaji: one fast pass of a fine brush, the tail of the j sweeping below the baseline, three round dots above i, j, i. "

const TIGERLILY =
  " The only colour in the image: the three dots above i, j and i are painted in Tigerlily orange-red (hex E2583E) as three quick brush dabs, the same brush, the same hand. Everything else stays near-black ink."

const LANES: Record<string, { model: "gpt2e" | "nbpro"; prompt: string }> = {
  elevate: {
    model: "gpt2e",
    prompt: REF + "Redraw this exact wordmark keeping the identical letterforms, slant, proportions and brush character, but elevate the execution: optically even letter spacing, a steady baseline, the three dots identical in size and evenly placed, clean confident ink edges with the brush texture kept, no accidental blotches. Do not turn it into a font.",
  },
  elevate_tigerlily: {
    model: "gpt2e",
    prompt: REF + "Redraw this exact wordmark keeping the identical letterforms, slant, proportions and brush character, elevating the execution: even spacing, steady baseline, clean confident ink edges with the brush texture kept." + TIGERLILY,
  },
  compact_j: {
    model: "nbpro",
    prompt: REF + "Redraw this exact wordmark keeping the letterforms and brush character, with ONE change: the tail of the j is shorter and tighter, a single sweep that dips only a little below the baseline, so the whole mark sits compact and wide like a header logo. Keep the three dots.",
  },
  more_ink: {
    model: "nbpro",
    prompt: REF + "Redraw this exact wordmark keeping the letterforms, slant and spacing, but with slightly more ink presence: a denser, richer black in every stroke of the same brush, so the mark survives at very small sizes, still visibly brushed, not a font.",
  },
  nb_tigerlily: {
    model: "nbpro",
    prompt: REF + "Redraw this exact wordmark keeping the identical letterforms, slant, spacing and brush character." + TIGERLILY,
  },
}

async function uploadRef(localPath: string, fileName: string): Promise<string> {
  const init = await fetch("https://rest.fal.ai/storage/upload/initiate?storage_type=fal-cdn-v3", {
    method: "POST",
    headers: { Authorization: `Key ${getKey()}`, "Content-Type": "application/json" },
    body: JSON.stringify({ content_type: "image/png", file_name: fileName }),
  })
  const body = await init.json()
  if (!init.ok) throw new Error("upload initiate failed: " + JSON.stringify(body).slice(0, 200))
  const bytes = await Bun.file(localPath).arrayBuffer()
  const put = await fetch(body.upload_url, { method: "PUT", headers: { "Content-Type": "image/png" }, body: bytes })
  if (!put.ok) throw new Error("upload PUT failed: " + put.status)
  return body.file_url
}

const R1 = new URL("./out/round1/", import.meta.url).pathname
const ref = await uploadRef(`${R1}r1_brush_gpt2.png`, "imaji-3a.png")
console.log("ref 3a uploaded")

const jobs: Job[] = []
for (const [key, { model, prompt }] of Object.entries(LANES)) {
  const p = prompt + HAND
  if (model === "gpt2e")
    jobs.push({
      id: `r2_${key}_gpt2e`, endpoint: "openai/gpt-image-2/edit", outDir: "round2", estUsd: 0.25,
      input: { prompt: p, image_urls: [ref], image_size: "landscape_16_9", quality: "high", output_format: "png" },
      fallbackInput: { prompt: p, image_urls: [ref], image_size: "auto", quality: "high", output_format: "png" },
    })
  else
    jobs.push({
      id: `r2_${key}_nbpro`, endpoint: "fal-ai/nano-banana-pro/edit", outDir: "round2", estUsd: 0.15,
      input: { prompt: p, image_urls: [ref], aspect_ratio: "16:9", resolution: "1K", num_images: 1, output_format: "png" },
    })
}
// A real SVG of the chosen mark, traced from the original.
jobs.push({ id: "r2_3a_vectorize", endpoint: "fal-ai/recraft/vectorize", outDir: "round2", estUsd: 0.01, input: { image_url: ref } })

console.log(`total jobs: ${jobs.length}`)
const { ok, failed } = await runJobs(jobs, 1)
console.log(`\nIMAJI LOGO R2: ${ok.length} ok, ${failed.length} failed`)
if (failed.length) console.log(failed.map(f => `  ${f.id}: ${f.error}`).join("\n"))
