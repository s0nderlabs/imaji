// Retry of the one round-2 job fal timed out: 3a elevated with Tigerlily dots. $0.25.
import { getKey, runJobs, type Job } from "./fal"
const HAND = " Near-black brush ink on a plain warm off-white paper background, the mark surrounded by generous empty paper. No gradients, no shadows, no 3D, no mockup scene, no decorative elements, no tagline. It must remain visibly hand-lettered with a brush, not a font. World-class studio identity, gallery-grade editorial restraint. The brand name is the word imaji, lowercase, correctly spelled with exactly five letters i, m, a, j, i: it begins and ends with an i and has a j as the fourth letter. Three of the five letters carry a dot above them (the two i letters and the j)."
const REF = "The reference image is a hand-lettered lowercase brush wordmark imaji: one fast pass of a fine brush, the tail of the j sweeping below the baseline, three round dots above i, j, i. "
const TIGERLILY = " The only colour in the image: the three dots above i, j and i are painted in Tigerlily orange-red (hex E2583E) as three quick brush dabs, the same brush, the same hand. Everything else stays near-black ink."
async function uploadRef(localPath: string, fileName: string): Promise<string> {
  const init = await fetch("https://rest.fal.ai/storage/upload/initiate?storage_type=fal-cdn-v3", { method: "POST", headers: { Authorization: `Key ${getKey()}`, "Content-Type": "application/json" }, body: JSON.stringify({ content_type: "image/png", file_name: fileName }) })
  const body = await init.json(); if (!init.ok) throw new Error("upload initiate failed")
  const put = await fetch(body.upload_url, { method: "PUT", headers: { "Content-Type": "image/png" }, body: await Bun.file(localPath).arrayBuffer() }); if (!put.ok) throw new Error("upload PUT failed")
  return body.file_url
}
const ref = await uploadRef(new URL("./out/round1/r1_brush_gpt2.png", import.meta.url).pathname, "imaji-3a.png")
const p = REF + "Redraw this exact wordmark keeping the identical letterforms, slant, proportions and brush character, elevating the execution: even spacing, steady baseline, clean confident ink edges with the brush texture kept." + TIGERLILY + HAND
const jobs: Job[] = [{ id: "r2_elevate_tigerlily_gpt2e", endpoint: "openai/gpt-image-2/edit", outDir: "round2", estUsd: 0.25, input: { prompt: p, image_urls: [ref], image_size: "landscape_16_9", quality: "high", output_format: "png" } }]
const { ok, failed } = await runJobs(jobs, 0.3)
console.log(`retry: ${ok.length} ok, ${failed.length} failed`, failed.map(f => f.error).join(" "))
