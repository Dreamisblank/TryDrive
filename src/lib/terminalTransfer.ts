/**
 * Concise "how do I get from the terminal to my rental car" instructions,
 * shown on the offer detail page when the pickup is at an airport.
 *
 * Airport-specific entries below are real, looked-up facts (desk locations,
 * shuttle stops, walk times) for the airports most commonly searched on this
 * site - not generated/guessed. Anything not in the table falls back to a
 * short generic line rather than a fabricated specific, since getting a
 * detail wrong (wrong shuttle stop, wrong building) could cause someone to
 * miss their pickup. Layouts do change over time, so each result also
 * carries a one-line nudge to confirm against the actual booking
 * confirmation - airport operators relocate car rental facilities
 * occasionally (e.g. after terminal renovations).
 */
export type TerminalTransferGuidance = {
  instructions: string;
  /** "specific" = looked-up per-airport facts below; "generic" = the airport
   *  isn't in the table, so this is universal fallback guidance only. */
  source: "specific" | "generic";
};

type AirportEntry = { match: RegExp; instructions: string };

const AIRPORT_GUIDANCE: AirportEntry[] = [
  {
    match: /malta/i,
    instructions:
      "Rental desks are in the arrivals hall, just past baggage reclaim. Cars are parked a 3-5 minute walk away in the Park East car park.",
  },
  {
    match: /valencia/i,
    instructions:
      "Rental desks are in the arrivals hall - follow the \"Car Rental\" signs as you exit. A few suppliers run a free shuttle from Parking P6, just outside to the left.",
  },
  {
    match: /m[aá]laga/i,
    instructions:
      "Most suppliers use an off-site Car Rental Centre. Exit arrivals, follow the blue line on the floor, cross two pedestrian crossings, and look behind the train station for the branded shuttle (about every 10 minutes).",
  },
  {
    match: /barcelona|el prat/i,
    instructions:
      "Desks are in the arrivals hall of your terminal (T1 ground floor, or T2B). A free shuttle connects T1 and T2 every 10-15 minutes if you land at the other one.",
  },
  {
    match: /palma|mallorca/i,
    instructions:
      "Hertz, Avis, Sixt and Europcar have desks in arrivals, with cars in the multi-storey car park opposite. Alamo, National and Enterprise use a shuttle from the Transport Meeting Point via exit door 6.",
  },
  {
    match: /alicante/i,
    instructions:
      "Most desks are in the arrivals hall. A few suppliers are about 400m away - take the lift to floor -2, follow \"Ground Transportation\" signs, and pick up the shuttle at the Express Parking stops.",
  },
  {
    match: /faro/i,
    instructions:
      "Most desks are inside the terminal in arrivals - turn right after baggage claim and follow \"Rent-a-Car\" signs. A couple of suppliers are at the P4 car park, a 250m walk away, with a free shuttle.",
  },
  {
    match: /lisbon|humberto delgado/i,
    instructions:
      "Rental desks are in the arrivals hall before security. Your supplier's counter will direct you to the car park on the terminal's upper level.",
  },
  {
    match: /tenerife south|tenerife sur/i,
    instructions:
      "Enterprise has a desk in the terminal; most other suppliers are off-site. Exit and turn left to find the marked shuttle stops along the terminal front (buses every 10-30 minutes depending on supplier).",
  },
  {
    match: /ibiza/i,
    instructions:
      "Desks are on the ground floor of the terminal, right after baggage claim, with cars parked in the lot opposite. A few off-site suppliers run a quick, free shuttle.",
  },
  {
    match: /gran canaria|las palmas/i,
    instructions:
      "Most desks are in the arrivals hall with cars a short walk away. Off-site suppliers run a free shuttle - look for the \"Meeting Point\" sign outside Exit 2 on the departures floor.",
  },
  {
    match: /menorca|mahon/i,
    instructions:
      "All major suppliers have desks in the arrivals hall (floor 0), right by baggage claim - no shuttle needed.",
  },
  {
    match: /bristol/i,
    instructions:
      "All suppliers are based at the Car Rental Centre. Follow signs to the Transport Interchange (Bay 1), a short covered walk from the terminal, then take the shuttle (every 15 minutes).",
  },
];

const GENERIC_FALLBACK =
  "Follow the \"Car Hire\" or \"Rental Cars\" signs from arrivals - some airports have desks right in the terminal, others run a short shuttle from a stop just outside.";

export function getTerminalTransferGuidance(
  pickupLocationName: string,
  supplierName: string,
): TerminalTransferGuidance | null {
  const looksLikeAirport = /airport|international|\(\s*[A-Z]{3}\s*\)/i.test(
    pickupLocationName,
  );
  if (!looksLikeAirport) return null;

  const match = AIRPORT_GUIDANCE.find((entry) => entry.match.test(pickupLocationName));

  return {
    instructions: match ? match.instructions : `${GENERIC_FALLBACK} Check your confirmation from ${supplierName} for the exact desk or stop.`,
    source: match ? "specific" : "generic",
  };
}

const MAX_STEPS = 4;

// A full stop after one of these doesn't end the sentence ("parking space
// no. 861", "approx. 5 minutes").
const ABBREVIATIONS = new Set([
  "e.g", "i.e", "approx", "no", "st", "min", "mins", "tel", "etc", "nr", "km", "hrs",
  "mr", "mrs", "ms", "dr", "vs",
]);

function splitSentences(line: string): string[] {
  // Suppliers often skip the space after a full stop ("building.The agent"),
  // so a stop directly followed by a capital also ends a sentence.
  const parts = line.split(/(?<=[.!?])(?:\s+|(?=[A-Z]))/);
  const sentences: string[] = [];
  let buffer = "";
  for (const part of parts) {
    buffer = buffer ? `${buffer} ${part.trim()}` : part.trim();
    const lastWord = buffer.split(/\s+/).pop()?.replace(/\.$/, "").toLowerCase() ?? "";
    if (buffer.endsWith(".") && ABBREVIATIONS.has(lastWord)) continue;
    if (buffer) sentences.push(buffer);
    buffer = "";
  }
  if (buffer) sentences.push(buffer);
  return sentences;
}

/**
 * Turns a rental company's free-text pickup directions into at most four
 * short numbered steps, in their original order (directions come first in
 * practice; the rest is usually documents, fuel and fee policy).
 * `truncated` flags when there was more, so the full text can still be
 * offered - nothing is thrown away, just not put in the steps.
 *
 * Tested against every distinct instruction in live searches for VLC, MLA
 * and AGP (60 texts): hard-wrapped lines, missing spaces after full stops,
 * supplier numbering ("1.- ") and ALL-CAPS preambles are all handled.
 */
export function toPickupSteps(text: string): { steps: string[]; truncated: boolean } {
  const lines = text
    .replace(/\r/g, "")
    // A line break before a lowercase word is a hard wrap mid-sentence
    // (sometimes indented: "follow the signs\n to the car park").
    .replace(/\n[ \t]*(?=[a-z])/g, " ")
    .split(/\n+/)
    .map((line) => line.replace(/^\s*(?:[-*•]|\d+\s*[.)]-?)\s+/, "").trim())
    .filter(Boolean);

  const sentences = lines.flatMap(splitSentences);
  if (sentences.length > 0) {
    // Drop a shouty preamble like "IMPORTANT: VEHICLE PICK-UP INSTRUCTIONS".
    sentences[0] = sentences[0].replace(/^(?:[A-Z][A-Z'-]*:?\s+){2,}(?=[A-Z][a-z])/, "");
  }
  const cleaned = sentences
    .map((sentence) => sentence.replace(/\s+/g, " ").trim())
    .filter(Boolean)
    .map((sentence) => sentence.charAt(0).toUpperCase() + sentence.slice(1));

  return { steps: cleaned.slice(0, MAX_STEPS), truncated: cleaned.length > MAX_STEPS };
}
