"use client";

import Link from "next/link";
import { useState } from "react";
import CopyButton from "./CopyButton";

export default function TokenMint() {
  const [token, setToken] = useState<string | null>(null);
  const [readId, setReadId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function mint() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/tokens", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: "{}",
      });
      const data: unknown = await res.json().catch(() => null);
      const minted =
        data && typeof data === "object" && "token" in data
          ? String((data as { token: unknown }).token)
          : null;
      const id =
        data && typeof data === "object" && "readId" in data
          ? String((data as { readId: unknown }).readId)
          : null;
      if (!res.ok || !minted || !id) {
        const answered =
          data && typeof data === "object" && "error" in data
            ? String((data as { error: unknown }).error)
            : null;
        setError(
          answered ??
            (res.ok
              ? "The server answered without a token."
              : `Could not mint a token (${res.status}).`),
        );
        return;
      }
      setToken(minted);
      setReadId(id);
    } catch {
      setError("Could not reach the server.");
    } finally {
      setBusy(false);
    }
  }

  if (token && readId) {
    return (
      <div className="fd-minted flex flex-col gap-3">
        <p className="t-sm text-ink-2">
          Your write credential, shown once.
        </p>
        <div className="flex flex-wrap items-center gap-3">
          <div className="fd-tokenfield min-w-0 grow px-3 py-2">
            <code className="t-sm block break-all font-mono tracking-[0.02em] text-ink">
              {token}
            </code>
          </div>
          <CopyButton
            text={token}
            variant="primary"
            label="Copy token"
            icon={false}
          />
        </div>
        <p className="t-sm text-ink-3">
          This is the only thing that can write a kit. Put it in your repo
          secrets as{" "}
          <code className="font-mono text-ink-2">IMAJI_KIT_TOKEN</code> and
          nowhere else. It is never part of a kit URL.
        </p>
        <p className="t-sm text-ink-3">
          Your kits will live at{" "}
          <Link
            href={`/k/${readId}`}
            /* the accent has one job on this page, and a link is not it */
            className="text-link text-ink"
          >
            /k/{readId}
          </Link>
          , private and unlisted. That address is safe to share with anyone you
          want to read them.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={mint}
          disabled={busy}
          aria-busy={busy}
          className="btn btn-quiet"
        >
          {busy ? "Minting" : "Mint a kit token"}
        </button>
      </div>
      {error ? (
        <p role="status" className="t-sm text-bad">
          {error}
        </p>
      ) : null}
    </div>
  );
}
