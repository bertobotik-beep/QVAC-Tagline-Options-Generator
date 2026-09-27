// QVAC Tagline Options Generator — core logic.
// completion() writes 3-5 short taglines grounded in the user's own
// product/service description. The one-shot example is real multi-turn
// history (not prose in the system prompt), so the small model is much
// less likely to parrot it verbatim regardless of the real input.

import { completion } from "@qvac/sdk";

function looksUnusable(text) {
  if (!text || text.trim().length === 0) return true;
  if (text.length > 120) return true;
  const bad = [
    "i cannot", "i can't", "as an ai", "i'm not able", "i do not have", "i don't have",
    "not enough information", "please provide more", "please try again",
    "i'd be happy to help", "i'll be happy to help", "could you provide",
    "can you provide", "i need more", "please give me more",
  ];
  const lower = text.toLowerCase();
  return bad.some((phrase) => lower.includes(phrase));
}

function cleanLine(line) {
  return line
    .replace(/^\s*\d+[.)]\s*/, "")
    .replace(/^[-*]\s*/, "")
    .replace(/^["']|["']$/g, "")
    .replace(/^\*+|\*+$/g, "")
    .trim();
}

const EXAMPLE_INPUT =
  "A mobile app that helps people track their daily water intake and reminds them to hydrate.";
const EXAMPLE_OUTPUT = `1. Never miss a sip again.
2. Hydration, made effortless.
3. Your daily dose of water, delivered.
4. Drink smarter, live better.
5. Small sips, big change.`;
const EXAMPLE_LINES = EXAMPLE_OUTPUT.split("\n").map(cleanLine).map((l) => l.toLowerCase());

function fallback(description) {
  const trimmed =
    description.length > 60 ? description.slice(0, 60).trim() + "..." : description;
  return [`${trimmed} — done differently.`, `Meet ${trimmed}.`, `${trimmed}, made simple.`];
}

export async function generate(modelId, description) {
  const run = completion({
    modelId,
    history: [
      {
        role: "system",
        content:
          "You write short, catchy taglines for a product or service. Given a " +
          "description, output exactly 5 numbered taglines (each under 10 words), " +
          "one per line, in this exact format:\n" +
          "1. <tagline>\n2. <tagline>\n3. <tagline>\n4. <tagline>\n5. <tagline>\n" +
          "Base every tagline only on the description given — do not invent features " +
          "or facts that are not in it. No other text besides the 5 numbered lines.",
      },
      { role: "user", content: `Description: ${EXAMPLE_INPUT}` },
      { role: "assistant", content: EXAMPLE_OUTPUT },
      { role: "user", content: `Description: ${description}` },
    ],
    stream: true,
    completionOpts: { temperature: 0.85, maxTokens: 220 },
  });

  let text = "";
  for await (const token of run.tokenStream) text += token;

  const lines = text
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean)
    // Only keep lines that actually match the requested numbered format —
    // this drops any preamble/postamble sentence the model adds (e.g.
    // "Here are 5 taglines:"), which would otherwise slip through as a
    // bogus extra "tagline".
    .filter((l) => /^\d+[.)]/.test(l))
    .map(cleanLine)
    .filter((l) => l.length > 0 && !looksUnusable(l))
    // Guard against the model parroting the one-shot example verbatim.
    .filter((l) => !EXAMPLE_LINES.includes(l.toLowerCase()));

  const taglines = [...new Set(lines)].slice(0, 5);

  if (taglines.length < 3) {
    return { taglines: fallback(description) };
  }
  return { taglines };
}
