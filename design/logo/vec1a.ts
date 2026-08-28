import { getKey, runJobs, type Job } from "./fal"
async function uploadRef(localPath: string, fileName: string): Promise<string> {
  const init = await fetch("https://rest.fal.ai/storage/upload/initiate?storage_type=fal-cdn-v3", { method: "POST", headers: { Authorization: `Key ${getKey()}`, "Content-Type": "application/json" }, body: JSON.stringify({ content_type: "image/png", file_name: fileName }) })
  const body = await init.json(); if (!init.ok) throw new Error("upload initiate failed")
  const put = await fetch(body.upload_url, { method: "PUT", headers: { "Content-Type": "image/png" }, body: await Bun.file(localPath).arrayBuffer() }); if (!put.ok) throw new Error("upload PUT failed")
  return body.file_url
}
const jobs: Job[] = []
for (const [id, file] of [["r2_1a_vectorize", "round2/r2_elevate_gpt2e.png"], ["r2_5b_vectorize", "round2/r2_nb_tigerlily_nbpro.png"]]) {
  const ref = await uploadRef(new URL(`./out/${file}`, import.meta.url).pathname, id + ".png")
  jobs.push({ id, endpoint: "fal-ai/recraft/vectorize", outDir: "master/src", estUsd: 0.01, input: { image_url: ref } })
}
const { ok, failed } = await runJobs(jobs, 0.05)
console.log(`vectorize: ${ok.length} ok, ${failed.length} failed`)
