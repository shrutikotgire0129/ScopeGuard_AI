"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Show, SignInButton, UserButton, useAuth } from "@clerk/nextjs";

type EvidenceItem = {
  agreementText: string;
  interpretation: string;
  verified?: boolean;
};

type ScopeAnalysis = {
  status: "included" | "potentially_out_of_scope" | "needs_clarification";
  reason: string;
  evidence: EvidenceItem[];
  recommendedAction: string;
};

type SavedAnalysis = {
  id: string;
  createdAt: string;
  agreement: string;
  clientRequest: string;
  analysis: ScopeAnalysis;
};

export default function Home() {
  const [agreement, setAgreement] = useState(
    "Build a five-page business website.\nInclude a contact form.\nMake the website responsive.",
  );

  const [request, setRequest] = useState(
    "Please also build an admin dashboard to manage customers.",
  );

  const [analysis, setAnalysis] = useState<ScopeAnalysis | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [generatedReply, setGeneratedReply] = useState("");
  const [replyLoading, setReplyLoading] = useState(false);
  const [history, setHistory] = useState<SavedAnalysis[]>([]);
  const [historyLoaded, setHistoryLoaded] = useState(false);
  const { isLoaded, isSignedIn } = useAuth();
  const [extraHours, setExtraHours] = useState("5");
  const [hourlyRate, setHourlyRate] = useState("1000");
  const [changeOrderTitle, setChangeOrderTitle] = useState(
    "Additional project work",
  );
  const [changeOrderText, setChangeOrderText] = useState("");

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      try {
        const savedHistory = localStorage.getItem("scopeguard-history");

        if (savedHistory) {
          const parsedHistory: unknown = JSON.parse(savedHistory);

          if (Array.isArray(parsedHistory)) {
            setHistory(parsedHistory.slice(0, 10) as SavedAnalysis[]);
          }
        }
      } catch {
        localStorage.removeItem("scopeguard-history");
      } finally {
        setHistoryLoaded(true);
      }
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, []);

  useEffect(() => {
    if (!historyLoaded) return;

    try {
      localStorage.setItem("scopeguard-history", JSON.stringify(history));
    } catch {
      console.error("Unable to save history in this browser.");
    }
  }, [history, historyLoaded]);

  useEffect(() => {
    if (!isLoaded || !isSignedIn) return;

    let cancelled = false;

    async function loadCloudHistory() {
      try {
        const response = await fetch("/api/history");
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || "Unable to load cloud history.");
        }

        if (!cancelled && Array.isArray(data.analyses)) {
          setHistory(data.analyses.slice(0, 10));
        }
      } catch (err) {
        console.error(
          "Unable to load cloud history:",
          err instanceof Error ? err.message : "Unknown error",
        );
      }
    }

    void loadCloudHistory();

    return () => {
      cancelled = true;
    };
  }, [isLoaded, isSignedIn]);

  async function analyzeScope() {
    setLoading(true);
    setError("");
    setAnalysis(null);

    try {
      const response = await fetch("/api/analyze-scope", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          agreement,
          clientRequest: request,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Unable to analyze this request.");
      }

      const result = data.result as ScopeAnalysis;

      setAnalysis(result);

      const savedAnalysis: SavedAnalysis = {
        id: `${Date.now()}-${Math.random()}`,
        createdAt: new Date().toISOString(),
        agreement,
        clientRequest: request,
        analysis: result,
      };

      setHistory((current) => [savedAnalysis, ...current].slice(0, 10));

      if (isLoaded && isSignedIn) {
        const historyResponse = await fetch("/api/history", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(savedAnalysis),
        });

        if (!historyResponse.ok) {
          setError(
            "Analysis completed, but cloud history could not be saved. Your browser history is still available.",
          );
        }
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  }

  async function generateClientReply() {
    if (!analysis) return;

    setReplyLoading(true);
    setError("");
    setGeneratedReply("");

    try {
      const response = await fetch("/api/generate-reply", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          agreement,
          clientRequest: request,
          analysis,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Unable to generate a client reply.");
      }

      setGeneratedReply(data.reply);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong while generating the reply.",
      );
    } finally {
      setReplyLoading(false);
    }
  }

  function loadDemoExample() {
    setAgreement(
      "Build a five-page business website.\nInclude a contact form.\nMake the website responsive.\nTwo rounds of design revisions are included.",
    );

    setRequest(
      "Please also build an admin dashboard to manage customers and add a subscription billing system.",
    );

    setAnalysis(null);
    setGeneratedReply("");
    setError("");
  }

  return (
    <main className="min-h-screen bg-[#0c0b12] text-[#f5f2ff]">
      <nav className="border-b border-white/10">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-6 py-5">
          <Link href="/" className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#a78bfa] text-lg font-bold text-[#171126]">
              S
            </div>
            <div>
              <p className="text-lg font-semibold tracking-tight">
                ScopeGuard <span className="text-[#b9a0ff]">AI</span>
              </p>
              <p className="text-xs text-[#9891a8]">Your scope, protected.</p>
            </div>
          </Link>

          <div className="flex items-center gap-4">
            <span className="hidden rounded-full border border-[#a78bfa]/30 bg-[#a78bfa]/10 px-3 py-1.5 text-xs font-medium text-[#c9b8ff] sm:inline-flex">
              AI Scope Analyst
            </span>

            <Show when="signed-in">
              <UserButton />
            </Show>

            <Show when="signed-out">
              <SignInButton mode="modal">
                <button
                  type="button"
                  className="rounded-full bg-[#a78bfa] px-3 py-1.5 text-sm font-semibold text-[#171126] transition hover:bg-[#b9a0ff]"
                >
                  Sign in
                </button>
              </SignInButton>
            </Show>
          </div>
        </div>
      </nav>

      <section className="mx-auto max-w-7xl px-6 pb-20 pt-16">
        <div className="mx-auto max-w-3xl text-center">
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-sm text-[#c6bddb]">
            <span className="h-2 w-2 rounded-full bg-[#a78bfa]" />
            Built for independent professionals
          </div>

          <h1 className="text-4xl font-semibold leading-tight tracking-tight sm:text-6xl">
            Protect your work.
            <br />
            <span className="text-[#b9a0ff]">Keep scope in check.</span>
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-base leading-7 text-[#a7a0b7] sm:text-lg">
            Compare client requests against your original agreement, spot
            potential scope creep, and prepare a professional response before
            committing to extra work.
          </p>
          <div className="mt-6 flex justify-center">
            <button
              type="button"
              onClick={loadDemoExample}
              className="rounded-xl border border-[#a78bfa]/30 bg-[#a78bfa]/10 px-5 py-2.5 text-sm font-medium text-[#d5c8ff] transition hover:bg-[#a78bfa]/20"
            >
              Load demo example
            </button>
          </div>
        </div>

        <div className="mx-auto mt-14 grid max-w-5xl gap-6 lg:grid-cols-2">
          <section className="rounded-2xl border border-white/10 bg-[#14121d] p-6 shadow-xl shadow-black/10">
            <div className="mb-5 flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/[0.06] text-[#c9b8ff]">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.7"
                  className="h-5 w-5"
                  aria-hidden="true"
                >
                  <path d="M7 3.75h7l5 5V20a.75.75 0 0 1-.75.75h-11.5A.75.75 0 0 1 6 20V4.5a.75.75 0 0 1 1-.75Z" />
                  <path d="M14 4v5h5M9 13h6M9 16.5h6" />
                </svg>
              </div>
              <div>
                <h2 className="font-semibold">Original agreement</h2>
                <p className="mt-1 text-sm text-[#928ba4]">
                  What did you originally agree to deliver?
                </p>
              </div>
            </div>

            <label
              htmlFor="agreement"
              className="mb-2 block text-sm font-medium text-[#d9d2e9]"
            >
              Agreement details
            </label>
            <textarea
              id="agreement"
              value={agreement}
              onChange={(event) => {
                setAgreement(event.target.value);
                setAnalysis(null);
                setGeneratedReply("");
                setError("");
              }}
              placeholder="Describe the agreed deliverables, features, and limitations..."
              className="min-h-52 w-full resize-y rounded-xl border border-white/10 bg-[#0e0c15] p-4 text-sm leading-6 text-white outline-none transition placeholder:text-[#6f687f] focus:border-[#a78bfa]/70 focus:ring-2 focus:ring-[#a78bfa]/10"
            />
            <p className="mt-3 text-xs text-[#817990]">
              Include deliverables, exclusions, and revision limits where
              available.
            </p>
          </section>

          <section className="rounded-2xl border border-white/10 bg-[#14121d] p-6 shadow-xl shadow-black/10">
            <div className="mb-5 flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#a78bfa]/10 text-[#c9b8ff]">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.7"
                  className="h-5 w-5"
                  aria-hidden="true"
                >
                  <path d="M12 3.5v17M3.5 12h17" />
                  <circle cx="12" cy="12" r="9" />
                </svg>
              </div>
              <div>
                <h2 className="font-semibold">New client request</h2>
                <p className="mt-1 text-sm text-[#928ba4]">
                  What additional work are they asking for?
                </p>
              </div>
            </div>

            <label
              htmlFor="request"
              className="mb-2 block text-sm font-medium text-[#d9d2e9]"
            >
              Client message or request
            </label>
            <textarea
              id="request"
              value={request}
              onChange={(event) => {
                setRequest(event.target.value);
                setAnalysis(null);
                setGeneratedReply("");
                setError("");
              }}
              placeholder="Paste the client's new request here..."
              className="min-h-52 w-full resize-y rounded-xl border border-white/10 bg-[#0e0c15] p-4 text-sm leading-6 text-white outline-none transition placeholder:text-[#6f687f] focus:border-[#a78bfa]/70 focus:ring-2 focus:ring-[#a78bfa]/10"
            />
            <p className="mt-3 text-xs text-[#817990]">
              Use the client&apos;s actual wording where possible.
            </p>
          </section>
        </div>

        <div className="mx-auto mt-8 flex max-w-5xl flex-col items-center gap-4 sm:flex-row sm:justify-between">
          <p className="max-w-lg text-xs leading-5 text-[#817990]">
            ScopeGuard AI provides decision support, not legal advice. Review
            the analysis before responding to your client.
          </p>

          <button
            type="button"
            onClick={analyzeScope}
            disabled={loading || !agreement.trim() || !request.trim()}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#b9a0ff] px-6 py-3.5 font-semibold text-[#171126] transition hover:bg-[#c9b8ff] disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
          >
            {loading ? "Analyzing..." : "Analyze scope"}
            {!loading && (
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                className="h-4 w-4"
                aria-hidden="true"
              >
                <path d="M5 12h14M13 6l6 6-6 6" />
              </svg>
            )}
          </button>
        </div>

        {error && (
          <div
            role="alert"
            className="mx-auto mt-8 max-w-5xl rounded-xl border border-red-400/20 bg-red-400/10 p-4 text-sm text-red-200"
          >
            {error}
          </div>
        )}

        {analysis && (
          <section className="mx-auto mt-10 max-w-5xl rounded-2xl border border-white/10 bg-[#14121d] p-6 sm:p-8">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-[#a7a0b7]">Analysis result</p>
                <h2 className="mt-1 text-2xl font-semibold">
                  Scope assessment
                </h2>
              </div>

              <span
                className={`inline-flex w-fit rounded-full border px-3 py-1.5 text-sm font-medium ${
                  analysis.status === "included"
                    ? "border-emerald-400/30 bg-emerald-400/10 text-emerald-300"
                    : analysis.status === "needs_clarification"
                      ? "border-violet-400/30 bg-violet-400/10 text-violet-200"
                      : "border-amber-400/30 bg-amber-400/10 text-amber-200"
                }`}
              >
                {analysis.status === "included"
                  ? "Included in agreement"
                  : analysis.status === "needs_clarification"
                    ? "Needs clarification"
                    : "Potentially out of scope"}
              </span>
            </div>
            <div className="mt-7">
              <h3 className="font-semibold">Reason</h3>
              <p className="mt-2 whitespace-pre-wrap text-sm leading-7 text-[#b9b1ca]">
                {analysis.reason}
              </p>
            </div>

            <div className="mt-7">
              <h3 className="font-semibold">Agreement evidence</h3>
              <p className="mt-1 text-xs leading-5 text-[#a7a0b7]">
                Excerpts are checked against the original agreement.
                Verification confirms a text match, not the accuracy of the
                AI&apos;s interpretation.
              </p>

              <div className="mt-3 space-y-3">
                {analysis.evidence.map((item, index) => (
                  <div
                    key={`${index}-${item.agreementText}`}
                    className="rounded-xl border border-white/10 bg-[#0e0c15] p-4"
                  >
                    <div className="mb-3 flex flex-wrap items-center gap-2">
                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                          item.verified === true
                            ? "bg-emerald-500/15 text-emerald-300"
                            : "bg-amber-500/15 text-amber-300"
                        }`}
                      >
                        {item.verified === true
                          ? "✓ Text verified"
                          : "⚠ Unverified evidence"}
                      </span>
                    </div>

                    <p className="text-sm font-medium text-[#d5c8ff]">
                      {item.verified === true && item.agreementText
                        ? `“${item.agreementText}”`
                        : "No verified agreement excerpt available"}
                    </p>

                    <p className="mt-2 text-sm leading-6 text-[#a7a0b7]">
                      {item.interpretation}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-7 rounded-xl border border-[#a78bfa]/20 bg-[#a78bfa]/[0.06] p-5">
              <h3 className="font-semibold text-[#d5c8ff]">
                Recommended next step
              </h3>
              <p className="mt-2 text-sm leading-7 text-[#c2bad2]">
                {analysis.recommendedAction}
              </p>
            </div>
            <div className="mt-7 rounded-xl border border-white/10 bg-[#0e0c15] p-5 sm:p-6">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#a78bfa]">
                  ScopeGuard AI
                </p>
                <h3 className="mt-2 text-lg font-semibold">
                  Change-order generator
                </h3>
                <p className="mt-2 text-sm leading-6 text-[#a7a0b7]">
                  Estimate the cost of additional work and prepare a proposal
                  for client approval before starting.
                </p>
              </div>

              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                <div>
                  <label
                    htmlFor="change-order-title"
                    className="mb-2 block text-sm font-medium text-[#d5cde3]"
                  >
                    Change-order title
                  </label>
                  <input
                    id="change-order-title"
                    value={changeOrderTitle}
                    onChange={(event) =>
                      setChangeOrderTitle(event.target.value)
                    }
                    maxLength={120}
                    className="w-full rounded-xl border border-white/10 bg-[#171421] px-4 py-3 text-sm text-white outline-none focus:border-[#a78bfa]/60"
                    placeholder="Additional project work"
                  />
                </div>

                <div>
                  <label
                    htmlFor="extra-hours"
                    className="mb-2 block text-sm font-medium text-[#d5cde3]"
                  >
                    Estimated additional hours
                  </label>
                  <input
                    id="extra-hours"
                    type="number"
                    min="0.25"
                    max="10000"
                    step="0.25"
                    value={extraHours}
                    onChange={(event) => setExtraHours(event.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-[#171421] px-4 py-3 text-sm text-white outline-none focus:border-[#a78bfa]/60"
                  />
                </div>

                <div>
                  <label
                    htmlFor="hourly-rate"
                    className="mb-2 block text-sm font-medium text-[#d5cde3]"
                  >
                    Hourly rate (INR)
                  </label>
                  <input
                    id="hourly-rate"
                    type="number"
                    min="0"
                    max="100000000"
                    step="0.01"
                    value={hourlyRate}
                    onChange={(event) => setHourlyRate(event.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-[#171421] px-4 py-3 text-sm text-white outline-none focus:border-[#a78bfa]/60"
                  />
                </div>

                <div className="rounded-xl border border-[#a78bfa]/20 bg-[#a78bfa]/[0.06] p-4">
                  <p className="text-sm text-[#a7a0b7]">
                    Proposed additional fee
                  </p>
                  <p className="mt-2 text-2xl font-semibold text-[#d5c8ff]">
                    {(() => {
                      const hours = Number(extraHours);
                      const rate = Number(hourlyRate);
                      const valid =
                        extraHours.trim() !== "" &&
                        hourlyRate.trim() !== "" &&
                        Number.isFinite(hours) &&
                        Number.isFinite(rate) &&
                        hours >= 0.25 &&
                        hours <= 10000 &&
                        rate >= 0 &&
                        rate <= 100000000;

                      return valid
                        ? (hours * rate).toLocaleString("en-IN", {
                            style: "currency",
                            currency: "INR",
                            maximumFractionDigits: 2,
                          })
                        : "Enter valid values";
                    })()}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  const hours = Number(extraHours);
                  const rate = Number(hourlyRate);

                  if (
                    !changeOrderTitle.trim() ||
                    changeOrderTitle.length > 120 ||
                    extraHours.trim() === "" ||
                    hourlyRate.trim() === "" ||
                    !Number.isFinite(hours) ||
                    !Number.isFinite(rate) ||
                    hours < 0.25 ||
                    hours > 10000 ||
                    rate < 0 ||
                    rate > 100000000
                  ) {
                    setError(
                      "Enter a title, hours between 0.25 and 10,000, and a valid non-negative hourly rate.",
                    );
                    return;
                  }

                  const fee = hours * rate;

                  if (!Number.isFinite(fee)) {
                    setError(
                      "The proposed fee is too large. Check your inputs.",
                    );
                    return;
                  }

                  setError("");

                  setChangeOrderText(
                    [
                      "CHANGE ORDER PROPOSAL",
                      "",
                      `Title: ${changeOrderTitle.trim()}`,
                      "",
                      "Original agreement:",
                      agreement.trim(),
                      "",
                      "Additional requested work:",
                      request.trim(),
                      "",
                      "Proposed estimate:",
                      `Estimated additional effort: ${hours} hours`,
                      `Hourly rate: ${rate.toLocaleString("en-IN", {
                        style: "currency",
                        currency: "INR",
                        maximumFractionDigits: 2,
                      })}`,
                      `Proposed additional fee: ${fee.toLocaleString("en-IN", {
                        style: "currency",
                        currency: "INR",
                        maximumFractionDigits: 2,
                      })}`,
                      "",
                      "Assumptions:",
                      "- The estimate is based on the additional work described above.",
                      "- The estimate may change if the requirements change.",
                      "- Taxes, third-party charges, and other expenses are excluded unless agreed separately.",
                      "",
                      "Approval requirement:",
                      "Please review and approve the proposed scope, cost, and timeline in writing before additional work begins.",
                      "",
                      "This is a proposal for discussion, not an accepted change to the original agreement.",
                    ].join("\n"),
                  );
                }}
                className="mt-5 rounded-xl bg-[#b9a0ff] px-5 py-3 text-sm font-semibold text-[#171126] transition hover:bg-[#c9b8ff]"
              >
                Generate change order
              </button>

              {changeOrderText && (
                <div className="mt-5">
                  <label
                    htmlFor="change-order-document"
                    className="mb-2 block text-sm font-medium text-[#d5cde3]"
                  >
                    Editable change-order proposal
                  </label>

                  <textarea
                    id="change-order-document"
                    value={changeOrderText}
                    onChange={(event) => setChangeOrderText(event.target.value)}
                    rows={18}
                    className="w-full rounded-xl border border-white/10 bg-[#171421] px-4 py-3 text-sm leading-6 text-[#d5cde3] outline-none focus:border-[#a78bfa]/60"
                  />

                  <button
                    type="button"
                    onClick={() => {
                      void navigator.clipboard
                        .writeText(changeOrderText)
                        .catch(() =>
                          setError(
                            "Could not copy the change order. Please copy it manually.",
                          ),
                        );
                    }}
                    className="mt-3 rounded-lg border border-[#a78bfa]/30 px-4 py-2 text-sm font-medium text-[#d5c8ff] transition hover:bg-[#a78bfa]/10"
                  >
                    Copy change order
                  </button>
                </div>
              )}
            </div>
            <p className="mt-5 text-xs leading-5 text-[#817990]">
              This is an AI-generated assessment, not a legal conclusion. Verify
              the cited agreement text before acting.
            </p>
            <div className="mt-7 border-t border-white/10 pt-7">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h3 className="font-semibold">Client reply assistant</h3>
                  <p className="mt-1 text-sm text-[#a7a0b7]">
                    Generate a professional response based on your scope
                    assessment.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={generateClientReply}
                  disabled={replyLoading}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#b9a0ff] px-5 py-3 text-sm font-semibold text-[#171126] transition hover:bg-[#c9b8ff] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {replyLoading
                    ? "Generating reply..."
                    : "Generate client reply"}
                </button>
              </div>

              {generatedReply && (
                <div className="mt-5 rounded-xl border border-white/10 bg-[#0e0c15] p-5">
                  <h4 className="text-sm font-semibold text-[#d5c8ff]">
                    Your suggested reply
                  </h4>

                  <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-[#c2bad2]">
                    {generatedReply}
                  </p>

                  <button
                    type="button"
                    onClick={() => {
                      void navigator.clipboard
                        .writeText(generatedReply)
                        .catch(() =>
                          setError(
                            "Could not copy the reply. Please copy it manually.",
                          ),
                        );
                    }}
                    className="mt-5 rounded-lg border border-[#a78bfa]/30 px-4 py-2 text-sm font-medium text-[#d5c8ff] transition hover:bg-[#a78bfa]/10"
                  >
                    Copy reply
                  </button>
                </div>
              )}
            </div>
          </section>
        )}

        {history.length > 0 && (
          <section className="mx-auto mt-10 max-w-5xl">
            <div className="mb-5 flex items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-semibold">Recent analyses</h2>
                <p className="mt-1 text-sm text-[#928ba4]">
                  Your 10 most recent scope checks, saved in this browser.
                </p>
              </div>

              <button
                type="button"
                onClick={async () => {
                  if (
                    !window.confirm(
                      "Delete all saved analyses? This will remove your browser history and cloud history if you are signed in.",
                    )
                  ) {
                    return;
                  }

                  try {
                    if (isLoaded && isSignedIn) {
                      const response = await fetch("/api/history", {
                        method: "DELETE",
                      });

                      const data = await response.json();

                      if (!response.ok) {
                        throw new Error(
                          data.message || "Unable to clear cloud history.",
                        );
                      }
                    }

                    setHistory([]);
                  } catch (err) {
                    setError(
                      err instanceof Error
                        ? err.message
                        : "Unable to clear history. Please try again.",
                    );
                  }
                }}
                className="shrink-0 rounded-lg border border-white/10 px-3 py-2 text-sm text-[#b9b1ca] transition hover:bg-white/5"
              >
                Clear history
              </button>
            </div>

            <div className="space-y-3">
              {history.map((item) => (
                <div
                  key={item.id}
                  className="flex flex-col gap-4 rounded-xl border border-white/10 bg-[#14121d] p-5 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0">
                    <span
                      className={`inline-flex rounded-full border px-3 py-1 text-xs font-medium ${
                        item.analysis.status === "included"
                          ? "border-emerald-400/30 bg-emerald-400/10 text-emerald-300"
                          : item.analysis.status === "needs_clarification"
                            ? "border-violet-400/30 bg-violet-400/10 text-violet-200"
                            : "border-amber-400/30 bg-amber-400/10 text-amber-200"
                      }`}
                    >
                      {item.analysis.status === "included"
                        ? "Included in agreement"
                        : item.analysis.status === "needs_clarification"
                          ? "Needs clarification"
                          : "Potentially out of scope"}
                    </span>

                    <p className="mt-3 line-clamp-2 text-sm text-[#d5cde3]">
                      {item.clientRequest}
                    </p>

                    <p className="mt-2 text-xs text-[#817990]">
                      {new Date(item.createdAt).toLocaleString()}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setAgreement(item.agreement);
                      setRequest(item.clientRequest);
                      setAnalysis(item.analysis);
                      setGeneratedReply("");
                      setError("");
                      window.scrollTo({ top: 0, behavior: "smooth" });
                    }}
                    className="shrink-0 rounded-lg border border-[#a78bfa]/30 px-4 py-2 text-sm font-medium text-[#d5c8ff] transition hover:bg-[#a78bfa]/10"
                  >
                    Open analysis
                  </button>
                </div>
              ))}
            </div>
          </section>
        )}

        <footer className="mx-auto mt-16 max-w-5xl border-t border-white/10 pt-6">
          <div className="flex flex-col gap-2 text-xs text-[#817990] sm:flex-row sm:items-center sm:justify-between">
            <p>© 2026 ScopeGuard AI</p>
            <p>Clear scope. Better client conversations.</p>
          </div>
        </footer>
      </section>
    </main>
  );
}
