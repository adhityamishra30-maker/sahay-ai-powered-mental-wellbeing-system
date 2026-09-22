import fs from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { Presentation, PresentationFile } from "@oai/artifact-tool";

const workspaceDir = "C:\\Users\\ADITYA\\AppData\\Local\\Packages\\5319275A.WhatsAppDesktop_cv1g1gvanyjgm\\LocalState\\sessions\\DA0A0503F6C3180EA8B129FE0F18EAB96124FD27\\transfers\\2026-37\\Websites\\Websites\\extraterrestrial-earth";
const skillDir = "C:\\Users\\ADITYA\\.codex\\plugins\\cache\\openai-primary-runtime\\presentations\\26.909.12148\\skills\\presentations";
const tmpDir = path.join(workspaceDir, ".ppt_build");
const finalPath = path.join(workspaceDir, "output", "SAHAY_SIH_Presentation.pptx");
const runtimePython = "C:\\Users\\ADITYA\\.cache\\codex-runtimes\\codex-primary-runtime\\dependencies\\python\\python.exe";
const { resolvePresentationFont, finalizePresentation } = await import(
  pathToFileURL(path.join(skillDir, "container_tools", "artifact_tool_utils.mjs")).href,
);

await fs.mkdir(tmpDir, { recursive: true });
await fs.mkdir(path.dirname(finalPath), { recursive: true });
const font = resolvePresentationFont({ fontFamily: "Arial" });
const deck = Presentation.create({ slideSize: { width: 1280, height: 720 } });

const C = {
  blue: "#234C7C", navy: "#193655", violet: "#694F9B", ink: "#121820",
  gray: "#6B7280", light: "#F3F5F8", line: "#D8DEE8", white: "#FFFFFF",
  teal: "#0F766E", amber: "#B45309", red: "#B91C1C", green: "#167B48",
};

function rect(slide, left, top, width, height, fill, radius = false) {
  return slide.shapes.add({
    geometry: radius ? "roundRect" : "rect",
    position: { left, top, width, height },
    fill,
    line: { fill: "none", width: 0 },
  });
}

function text(slide, value, left, top, width, height, size = 20, color = C.ink, opts = {}) {
  const box = slide.shapes.add({
    geometry: "textbox",
    position: { left, top, width, height },
    fill: "none",
    line: { fill: "none", width: 0 },
  });
  box.text = value;
  box.text.style = {
    typeface: font,
    fontSize: size,
    color,
    bold: opts.bold ?? false,
    alignment: opts.align ?? "left",
    verticalAlignment: opts.valign ?? "top",
    autoFit: "shrinkText",
    marginLeft: opts.margin ?? 0,
    marginRight: opts.margin ?? 0,
    marginTop: opts.margin ?? 0,
    marginBottom: opts.margin ?? 0,
  };
  return box;
}

function chrome(slide, number, title) {
  slide.background.fill = C.white;
  text(slide, "SMART INDIA HACKATHON 2026", 48, 26, 700, 48, 32, C.blue, { bold: true });
  text(slide, "SIH\n2026", 1090, 24, 140, 58, 18, C.navy, { bold: true, align: "right" });
  text(slide, title.toUpperCase(), 52, 95, 940, 40, 25, C.violet, { bold: true });
  rect(slide, 0, 667, 1280, 53, C.blue);
  text(slide, "SAHAY | AI-powered victim well-being and distress monitoring", 52, 680, 830, 22, 13, C.white, { bold: true });
  text(slide, String(number).padStart(2, "0"), 1175, 678, 56, 24, 15, C.white, { bold: true, align: "right" });
}

function label(slide, value, left, top, width, color = C.blue) {
  rect(slide, left, top, width, 30, color, true);
  text(slide, value, left + 12, top + 7, width - 24, 17, 13, C.white, { bold: true, align: "center" });
}

// 1. Title
{
  const s = deck.slides.add();
  s.background.fill = C.white;
  text(s, "SMART INDIA HACKATHON 2026", 48, 28, 790, 52, 34, C.blue, { bold: true });
  text(s, "SIH\n2026", 1090, 25, 140, 62, 20, C.navy, { bold: true, align: "right" });
  text(s, "SAHAY", 68, 146, 580, 88, 58, C.navy, { bold: true });
  text(s, "AI-powered victim well-being and\ndistress monitoring system", 68, 238, 640, 82, 27, C.violet, { bold: true });
  rect(s, 68, 338, 610, 3, C.violet);
  text(s, "Problem Statement ID: [Add official SIH ID]", 68, 378, 520, 28, 19, C.ink, { bold: true });
  text(s, "Theme: Social welfare and citizen support\nCategory: Software\nTeam ID: [Add Team ID]\nTeam Name: [Add Team Name]", 68, 423, 520, 130, 18, C.ink);
  rect(s, 760, 142, 385, 360, C.light, true);
  text(s, "A safer path\nfrom check-in\nto support", 805, 220, 295, 115, 35, C.blue, { bold: true, align: "center", valign: "middle" });
  text(s, "Consent-first check-ins\nStructured AI risk assessment\nCounsellor follow-up and audit trail", 805, 363, 295, 78, 17, C.gray, { align: "center" });
  text(s, "Prepared for Smart India Hackathon 2026", 68, 630, 550, 22, 14, C.gray);
  s.speakerNotes.textFrame.setText("Source: SAHAY project scope and current application implementation.");
}

// 2. Problem
{
  const s = deck.slides.add();
  chrome(s, 2, "Challenges and problem");
  text(s, "Victims need a safe way to communicate distress before it becomes a crisis.", 58, 155, 1060, 38, 24, C.ink, { bold: true });
  const problems = [
    ["Delayed escalation", "A person may not reach a counsellor when their condition changes."],
    ["Fragmented follow-up", "Case updates, interventions, and accountability can remain disconnected."],
    ["Privacy risk", "Sensitive information needs consent, role-based access, and an audit trail."],
  ];
  problems.forEach((p, i) => {
    const x = 58 + i * 398;
    rect(s, x, 242, 350, 260, C.light, true);
    label(s, String(i + 1).padStart(2, "0"), x + 20, 264, 54, i === 2 ? C.violet : C.blue);
    text(s, p[0], x + 20, 320, 300, 30, 22, C.navy, { bold: true });
    text(s, p[1], x + 20, 370, 300, 82, 18, C.ink);
  });
  text(s, "SAHAY brings the signal, support workflow, and privacy controls into one system.", 58, 548, 1040, 30, 21, C.teal, { bold: true });
  s.speakerNotes.textFrame.setText("Source: SAHAY project problem framing. Claims describe the proposed workflow, not measured outcomes.");
}

// 3. Technical approach
{
  const s = deck.slides.add();
  chrome(s, 3, "Technical approach");
  text(s, "A monitored workflow turns a voluntary check-in into a traceable support action.", 58, 150, 1110, 32, 22, C.ink, { bold: true });
  const stages = [
    ["01", "Consent", "The user chooses what to share."],
    ["02", "Check-in", "Mood, message, and optional district."],
    ["03", "Assessment", "Server-side AI returns structured risk."],
    ["04", "Alert", "High-risk cases enter the counsellor queue."],
    ["05", "Follow-up", "Intervention and audit record are saved."],
  ];
  stages.forEach((stage, i) => {
    const x = 52 + i * 244;
    const fill = i === 2 ? "#E9E3F4" : C.light;
    rect(s, x, 250, 205, 220, fill, true);
    text(s, stage[0], x + 20, 272, 70, 28, 17, i === 2 ? C.violet : C.blue, { bold: true });
    text(s, stage[1], x + 20, 326, 165, 32, 21, C.navy, { bold: true });
    text(s, stage[2], x + 20, 382, 165, 65, 16, C.ink);
    if (i < stages.length - 1) text(s, "›", x + 208, 333, 30, 40, 31, C.violet, { bold: true, align: "center" });
  });
  text(s, "Stack: Astro + React + TypeScript | Tailwind CSS | Astro API routes | Gemini or OpenAI | Node standalone deployment", 58, 548, 1150, 30, 17, C.gray);
  s.speakerNotes.textFrame.setText("Source: Current SAHAY repository configuration and src/pages/api/chat.ts.");
}

// 4. Feasibility
{
  const s = deck.slides.add();
  chrome(s, 4, "Feasibility and viability");
  text(s, "The prototype uses a lightweight web stack and can grow into a secure service layer.", 58, 150, 1100, 34, 22, C.ink, { bold: true });
  rect(s, 58, 225, 532, 340, C.light, true);
  label(s, "CURRENT PROTOTYPE", 82, 248, 190, C.blue);
  text(s, "• Astro server with a standalone Node adapter\n• React interface for victim and counsellor views\n• Typed API route for AI risk assessment\n• Gemini primary provider and OpenAI fallback\n• Mock cases, alerts, analytics, and audit records", 82, 308, 460, 200, 19, C.ink);
  rect(s, 636, 225, 570, 340, "#F1F7F4", true);
  label(s, "NEXT IMPLEMENTATION LAYER", 660, 248, 240, C.green);
  text(s, "• PostgreSQL or Supabase for persistent case records\n• Server-enforced role-based access\n• Consent versioning and audit logging\n• Fallback queue when an AI provider is unavailable\n• Aggregated district analytics without personal identifiers", 660, 308, 500, 200, 19, C.ink);
  text(s, "Deployment model: web application with secrets stored only in server-side environment variables.", 58, 592, 1120, 26, 17, C.gray, { bold: true });
  s.speakerNotes.textFrame.setText("Source: Current SAHAY repository configuration, .env.example, and proposed implementation roadmap.");
}

// 5. Impact
{
  const s = deck.slides.add();
  chrome(s, 5, "Impact and benefits");
  text(s, "SAHAY supports human decision-making with an accountable, privacy-aware workflow.", 58, 150, 1110, 34, 22, C.ink, { bold: true });
  const rows = [
    ["Victim", "A voluntary check-in channel with clear consent and immediate support guidance.", C.teal],
    ["Counsellor", "A prioritised queue, case context, and a record of follow-up actions.", C.blue],
    ["District team", "Anonymised trends that help identify where support capacity is needed.", C.violet],
  ];
  rows.forEach((r, i) => {
    const y = 235 + i * 102;
    rect(s, 58, y, 1135, 78, i === 1 ? "#EEF4FB" : C.light, true);
    rect(s, 58, y, 190, 78, r[2], true);
    text(s, r[0], 78, y + 24, 150, 28, 20, C.white, { bold: true, align: "center" });
    text(s, r[1], 280, y + 20, 850, 38, 18, C.ink, { valign: "middle" });
  });
  text(s, "Safety principle: the system supports escalation and follow-up. It does not provide a clinical diagnosis.", 58, 578, 1120, 30, 18, C.red, { bold: true });
  s.speakerNotes.textFrame.setText("Source: SAHAY project scope and safety constraints in src/pages/api/chat.ts.");
}

// 6. Research and references
{
  const s = deck.slides.add();
  chrome(s, 6, "Research and references");
  text(s, "Design decisions are grounded in trauma-informed support, data minimisation, and accountable case handling.", 58, 150, 1110, 38, 22, C.ink, { bold: true });
  const refs = [
    ["Trauma-informed support", "Use calm, non-judgmental language and clear escalation guidance."],
    ["Data minimisation", "Request only the information necessary for the chosen support pathway."],
    ["Role-based access", "Restrict counsellor and administrator views on the server side."],
    ["Auditability", "Record important case access and action events for accountability."],
  ];
  refs.forEach((r, i) => {
    const col = i % 2;
    const row = Math.floor(i / 2);
    const x = 58 + col * 575;
    const y = 235 + row * 145;
    rect(s, x, y, 535, 112, C.light, true);
    label(s, String(i + 1).padStart(2, "0"), x + 18, y + 20, 56, i === 1 ? C.green : C.blue);
    text(s, r[0], x + 96, y + 20, 400, 27, 19, C.navy, { bold: true });
    text(s, r[1], x + 96, y + 58, 400, 36, 16, C.ink);
  });
  text(s, "Implementation references: Astro documentation, React documentation, Tailwind CSS documentation, Gemini API documentation, OpenAI API documentation.", 58, 548, 1120, 42, 17, C.gray);
  text(s, "Before submission: add the official SIH problem statement, team details, and validated deployment partner information.", 58, 608, 1120, 24, 16, C.red, { bold: true });
  s.speakerNotes.textFrame.setText("Sources: SAHAY current implementation; Astro docs; React docs; Tailwind CSS docs; Google Gemini API docs; OpenAI API docs. Verify official SIH requirements before submission.");
}

const candidatePath = path.join(tmpDir, "SAHAY_candidate.pptx");
await (await PresentationFile.exportPptx(deck)).save(candidatePath);

const requirements = {
  explicitTotalSlideCount: 6,
  requiredNativeTableOwnerSlides: [],
  requiredNativeChartOwnerSlides: [],
};
const fontPolicy = { basis: "design", families: [font] };
const result = await finalizePresentation({
  ...requirements,
  workspaceDir,
  candidatePath,
  finalPath,
  pythonExecutable: runtimePython,
  integrityValidatorPath: path.join(skillDir, "container_tools", "inspect_presentation_package_integrity.py"),
  layoutValidatorPath: path.join(skillDir, "container_tools", "inspect_presentation_layout_geometry.py"),
  layoutArgs: ["--expected-slide-size-emu", "12192000,6858000", "--validate-bullet-geometry", "--validate-heading-fit"],
  fontPolicy,
  verifyArtifactToolImport: true,
  receiptPath: path.join(tmpDir, "SAHAY_validation.json"),
});
console.log(JSON.stringify({ finalPath, result }, null, 2));
