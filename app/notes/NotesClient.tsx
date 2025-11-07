// app/notes/NotesClient.tsx
"use client";
import { useEffect, useState } from "react";

type Note = {
  id: string;
  title: string | null;
  rawText: string | null;
  createdAt: string;
};

export default function NotesClient({ userId }: { userId: string }) {
  const [text, setText] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [notes, setNotes] = useState<Note[]>([]);
  const [toast, setToast] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);

  async function load() {
    const res = await fetch("/api/notes", { cache: "no-store" });
    const data = await res.json();
    setNotes(data?.notes);
  }
  useEffect(() => {
    load();
  }, []);

  function showToast(msg: string, time = 5000) {
    setToast(msg);
    setTimeout(() => setToast(null), time);
  }

  async function submit(e: any, useCohere = false) {
    e.preventDefault();
    setProcessing(true);
    try {
      const fd = new FormData();
      if (text) fd.append("text", text);
      if (file) fd.append("file", file);
      fd.append("userId", userId);
      if (useCohere) fd.append("useCohere", "1");

      const res = await fetch("/api/notes", { method: "POST", body: fd });
      const data = await res.json();

      if (!res.ok) {
        // If analysis failed (502 + error: analysis_failed), prefill text area and show toast
        if (data?.error === "analysis_failed") {
          showToast(
            "Auto-analysis failed. Please edit the text below and retry or click 'Try with Cohere'."
          );
          if (data.extractedText) setText(data.extractedText);
        } else {
          showToast("Upload failed: " + (data?.message || res.statusText));
        }
      } else {
        showToast(
          "Note processed & flashcards generated (" +
            (data.provider || "auto") +
            ")"
        );
        setText("");
        setFile(null);
      }
    } catch (err) {
      console.error(err);
      showToast("Network error. Please try again.");
    } finally {
      if (!file) {
        await load();
        setFile(null);
        setText("");
      }
      setProcessing(false);
    }
  }

  return (
    <>
      {" "}
      <div className="max-w-4xl mx-auto p-6">
        {/* Toast */}
        {toast && (
          <div className="fixed right-6 top-6 z-50">
            <div className="bg-red-500 border border-amber-200 text-amber-900 px-4 py-2 rounded shadow">
              {toast}
            </div>
          </div>
        )}

        <h1 className="text-2xl font-semibold mb-4">Notes</h1>

        <form className="mb-6 space-y-3" onSubmit={(e) => submit(e, false)}>
          <textarea
            className="w-full border rounded-lg p-3"
            rows={6}
            placeholder="Paste your note text here..."
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
          <div className="flex items-center gap-3">
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            />
            <button
              disabled={processing}
              className="px-4 py-2 rounded-lg bg-indigo-600 text-white"
              type="submit"
            >
              {processing ? "Processing..." : "Upload & Generate Flashcards"}
            </button>

            <button
              type="button"
              onClick={(e) => submit(e, true)}
              className="px-4 py-2 rounded-lg border"
              disabled={processing}
            >
              Try with Cohere
            </button>
          </div>
        </form>

        <ul className="space-y-3">
          {notes?.map((n) => (
            <li key={n.id} className="bg-white p-4 rounded-xl border">
              <a
                href={`/notes/${n.id}`}
                className="font-medium hover:underline"
              >
                {n.title ?? "Untitled note"}
              </a>
              <p className="text-sm text-gray-500 mt-1 line-clamp-2">
                {n.rawText?.slice(0, 180)}
              </p>
            </li>
          ))}
        </ul>
      </div>
    </>
  );
}
