// app/api/notes/route.ts
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { notes, flashcards } from "@/lib/schema";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { CohereClientV2 } from "cohere-ai";
import { and, eq, inArray, sql } from "drizzle-orm";
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const COHERE_API_KEY = process.env.COHERE_API_KEY;

let geminiClient: GoogleGenerativeAI | null = null;
if (GEMINI_API_KEY) {
  try {
    geminiClient = new GoogleGenerativeAI(GEMINI_API_KEY);
  } catch (e) {
    console.warn("Gemini init failed:", e);
    geminiClient = null;
  }
}

const cohere = new CohereClientV2({
  token: COHERE_API_KEY,
});

/**
 * Call Gemini text model and return parsed JSON.
 */
async function callGeminiAnalyze(text: string) {
  if (!geminiClient) throw new Error("Gemini not configured");
  const model = geminiClient.getGenerativeModel({ model: "gemini-1.5-flash" });
  const prompt = `
You are a study assistant. Return ONLY valid JSON (no extra explanation) with:
{
  "summary": "A concise 1-2 sentence summary",
  "shortNote": "A short study note (two short paragraphs)",
  "flashcards": [{ "front": "Question text", "back": "Answer text" }, ...]
}
Analyze the text below and produce that JSON:

TEXT:
${text}
`;
  const result = await model.generateContent(prompt);
  const raw = await result.response.text();
  const cleaned = extractJsonString(raw);
  return JSON.parse(cleaned);
}

/**
 * Call Cohere REST API directly (fallback).
 * Uses https://api.cohere.com/v1/generate
 */

async function callCohereAnalyze(text: string) {
  if (!text || text.trim().length === 0) {
    throw new Error("Empty text provided to Cohere");
  }

  const prompt = `
You are a study assistant. Return ONLY valid JSON (no extra commentary) with keys:
{
  "summary": "1-2 sentence summary",
  "shortNote": "2 short paragraphs",
  "flashcards": [{"front":"Question","back":"Answer"}...]
}

Analyze the following text and produce that JSON only:

${text}
  `.trim();

  const res: any = await cohere.chat({
    model: "command-a-03-2025",
    messages: [
      {
        role: "user",
        content: prompt,
      },
    ],
    temperature: 0.2,
  });
  console.log(res.message?.content);
  // Extract the output text depending on the SDK’s response shape
  const raw =
    res.message?.content?.[0]?.text ?? res.output_text ?? res.text ?? "";

  if (!raw || raw.trim().length === 0) {
    throw new Error("Cohere returned an empty response");
  }

  // Simple JSON cleanup
  const jsonStart = raw.indexOf("{");
  const jsonEnd = raw.lastIndexOf("}");
  const cleaned =
    jsonStart !== -1 && jsonEnd !== -1
      ? raw.slice(jsonStart, jsonEnd + 1)
      : raw;

  try {
    return JSON.parse(cleaned);
  } catch {
    console.warn("Cohere output not valid JSON, fallback parsing used.");
    return {
      summary: text.slice(0, 150),
      shortNote: text.slice(0, 500),
      flashcards: [
        { front: "What is this note about?", back: text.slice(0, 200) },
      ],
    };
  }
}

/**
 * Extract JSON substring from noisy text (LLM may add extra explanation).
 */
function extractJsonString(s: string) {
  if (!s) throw new Error("Empty response");
  s = s.trim();
  if (s.startsWith("{") || s.startsWith("[")) return s;
  const first = s.indexOf("{");
  const last = s.lastIndexOf("}");
  if (first !== -1 && last !== -1 && last > first) {
    return s.slice(first, last + 1);
  }
  // last fallback — try to find a JSON-like block using regex (best-effort)
  const match = s.match(/\{[\s\S]*\}/);
  if (match) return match[0];
  // if nothing, return the original so parse will fail and we fallback elsewhere
  return s;
}

/**
 * Fallback Q/A generator from text
 */
function generateFallbackCardsFromText(text: string) {
  const sentences = text
    .split(/[\.\n]+/)
    .map((s) => s.trim())
    .filter(Boolean);
  return sentences.slice(0, 8).map((s) => ({
    front:
      s.length > 60 ? s.slice(0, 60) + "..." : "Explain: " + s.slice(0, 60),
    back: s,
  }));
}

// GET /api/notes  - list notes with optional pagination & small preview
export async function GET(req: Request) {
  try {
    // parse query params (optional)
    const url = new URL(req.url);
    const page = Math.max(1, Number(url.searchParams.get("page") || "1"));
    const limit = Math.min(50, Number(url.searchParams.get("limit") || "20"));
    const offset = (page - 1) * limit;

    // Fetch notes with limit/offset and recent first
    const notesList = await db
      .select({
        id: notes.id,
        title: notes.title,
        rawText: notes.rawText,
        createdAt: notes.createdAt,
        userId: notes.userId,
      })
      .from(notes)
      .orderBy(notes.createdAt)
      .limit(limit)
      .offset(offset);

    // For each note get flashcards count and at most 3 flashcards preview
    const noteIds = notesList.map((n: any) => n.id);
    let previews: Record<string, any> = {};
    if (noteIds.length) {
      const fcRows = await db
        .select({
          id: flashcards.id,
          noteId: flashcards.noteId,
          front: flashcards.front,
          back: flashcards.back,
          createdAt: flashcards.createdAt,
        })
        .from(flashcards)
        .where(eq(flashcards.noteId, noteIds[0]))
        .orderBy(flashcards.createdAt)
        .limit(noteIds.length * 3); // fetch up to 3 per note (simple heuristic)

      // group previews by noteId (keep latest up to 3)
      previews = fcRows.reduce<Record<string, any[]>>((acc, row) => {
        acc[row.noteId] = acc[row.noteId] || [];
        if (acc[row.noteId].length < 3) acc[row.noteId].push(row);
        return acc;
      }, {});
    }

    // count flashcards per note in one query
    const counts =
      noteIds.length > 0
        ? await db
            .select({
              noteId: flashcards.noteId,
              count: sql<number>`count(*)`.as("count"),
            })
            .from(flashcards)
            .where(inArray(flashcards.noteId, noteIds))
            .groupBy(flashcards.noteId)
        : [];

    const countsMap = (counts || []).reduce<Record<string, number>>(
      (acc: any, r: any) => {
        acc[r.noteId] = Number(r.c || 0);
        return acc;
      },
      {}
    );

    // Build final payload
    const payload = notesList.map((n: any) => ({
      id: n.id,
      title: n.title,
      rawText: n.rawText,
      createdAt: n.createdAt,
      userId: n.userId,
      flashcardsCount: countsMap[n.id] || 0,
      flashcardsPreview: previews[n.id] || [],
    }));

    return NextResponse.json({ ok: true, page, limit, notes: payload });
  } catch (err) {
    console.error("GET /api/notes error:", err);
    return NextResponse.json(
      { error: "server_error", message: "Unable to fetch notes" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const form = await req.formData();
    const userId = form.get("userId")?.toString() || null;
    const preferCohere = form.get("useCohere")?.toString() === "1";

    const text = form.get("text")?.toString();
    const file = form.get("file") as File | null;
    let extractedText = text || "";

    // If image uploaded, try Gemini vision extraction (if configured)
    if (file && false) {
      try {
        if (geminiClient) {
          const model = geminiClient.getGenerativeModel({
            model: "gemini-2.5-flash",
          });
          const bytes = Buffer.from(await file.arrayBuffer());
          const result = await model.generateContent([
            "Extract readable text from the image. Return only the extracted text. If none, return empty string.",
            {
              inlineData: {
                data: bytes.toString("base64"),
                mimeType: file.type,
              },
            },
          ]);
          extractedText = (await result.response.text()) || extractedText;
        } else {
          // no gemini client; rely on text field
          extractedText = extractedText || "";
        }
      } catch (e) {
        console.warn("Gemini vision extraction failed:", e);
        // don't abort; fallback below
        extractedText = extractedText || "";
      }
    }

    // If there's no text to analyze return early (help frontend)
    if (!extractedText) {
      const [note] = await db
        .insert(notes)
        .values({
          userId,
          title: "Uploaded note (no text detected)",
          sourceType: file ? "image" : "text",
          rawText: "",
        })
        .returning();

      return NextResponse.json(
        {
          error: "no_text",
          message:
            "No text was provided or extracted. Please paste text or upload a clearer image.",
          noteId: note.id,
        },
        { status: 400 }
      );
    }

    // Try providers: Gemini first (unless user requested Cohere first)
    let analysis: any = null;
    let usedProvider: string | null = null;

    if (preferCohere) {
      try {
        analysis = await callCohereAnalyze(extractedText);
        usedProvider = "cohere";
      } catch (coErr) {
        console.warn("Cohere failed, trying Gemini:", coErr);
        try {
          // analysis = await callGeminiAnalyze(extractedText);
          usedProvider = "gemini";
        } catch (gErr) {
          console.error("Cohere then Gemini failed:", coErr, gErr);
        }
      }
    } else {
      try {
        // analysis = await callGeminiAnalyze(extractedText);
        usedProvider = "gemini";
      } catch (gErr) {
        console.warn("Gemini failed, trying Cohere:", gErr);
        try {
          analysis = await callCohereAnalyze(extractedText);
          usedProvider = "cohere";
        } catch (coErr) {
          console.error("Gemini then Cohere failed:", gErr, coErr);
        }
      }
    }

    // If both failed, save raw note and instruct frontend to show toast & manual input
    if (!analysis) {
      const [note] = await db
        .insert(notes)
        .values({
          userId,
          title: (extractedText || "Uploaded note").slice(0, 80),
          sourceType: file ? "image" : "text",
          rawText: extractedText,
        })
        .returning();

      return NextResponse.json(
        {
          error: "analysis_failed",
          message:
            "Automated analysis (Gemini + Cohere) failed. Please enter text manually or try again.",
          noteId: note.id,
          extractedText,
        },
        { status: 502 }
      );
    }

    // Normalize output
    const summary = (analysis.summary || "").toString();
    const shortNote = (analysis.shortNote || "").toString();
    const flashcardsArr =
      Array.isArray(analysis.flashcards) && analysis.flashcards.length
        ? analysis.flashcards
        : generateFallbackCardsFromText(extractedText || summary || shortNote);

    // Save note
    const [note] = await db
      .insert(notes)
      .values({
        userId,
        title: (summary || extractedText.slice(0, 80) || "New Note").slice(
          0,
          80
        ),
        sourceType: file ? "image" : "text",
        rawText: extractedText,
      })
      .returning();

    // Save flashcards (limit)
    for (const c of flashcardsArr.slice(0, 30)) {
      const front = (c.front || c.question || c.q || "").toString();
      const back = (c.back || c.answer || c.a || "").toString();
      await db.insert(flashcards).values({
        noteId: note.id,
        userId,
        front: front || "Q",
        back: back || "A",
      });
    }

    return NextResponse.json({
      ok: true,
      provider: usedProvider,
      note,
      summary,
      shortNote,
      flashcards: flashcardsArr.slice(0, 30),
    });
  } catch (err) {
    console.error("Unexpected error in /api/notes:", err);
    return NextResponse.json(
      { error: "server_error", message: "Unexpected server error" },
      { status: 500 }
    );
  }
}
