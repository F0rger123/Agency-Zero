import { newId } from "./ids";
import { defaultBoard } from "./template";
import type { BoardData, El, Frame } from "./types";

/**
 * Whiteboard templates. Every piece of a template is an ordinary element, so every word can be edited (tap it with the Move
 * tool) and boxes can be moved or erased. Elements marked `tpl` survive "Clear this frame".
 */
export type Template = { key: string; name: string; description: string; frames: string[]; build: () => BoardData };

const GRAY = "#6b7280";
const INK = "#111827";
const LINE = "#d1d5db";
const YELLOW = "#fde68a";
const PINK = "#fbcfe8";
const BLUE = "#bfdbfe";
const GREEN = "#bbf7d0";

class Builder {
  private ts = 1;
  els: El[] = [];
  text(x: number, y: number, s: string, size = 28, c = INK, bold = false) {
    this.els.push({ id: newId(), ts: this.ts++, t: "text", x, y, s, size, c, bold, tpl: true });
    return this;
  }
  box(x: number, y: number, w: number, h: number, c = LINE, kind: "rect" | "ellipse" = "rect", width = 4) {
    this.els.push({ id: newId(), ts: this.ts++, t: "shape", k: kind, x1: x, y1: y, x2: x + w, y2: y + h, c, w: width, tpl: true });
    return this;
  }
  line(x1: number, y1: number, x2: number, y2: number, c = LINE, w = 4) {
    this.els.push({ id: newId(), ts: this.ts++, t: "shape", k: "line", x1, y1, x2, y2, c, w, tpl: true });
    return this;
  }
  note(x: number, y: number, s: string, c = YELLOW, w = 240, h = 170) {
    this.els.push({ id: newId(), ts: this.ts++, t: "note", x, y, w, h, s, c, tpl: true });
    return this;
  }
  /** The quiet header every frame starts with: a small counter, the title, a prompt, and a short rule. */
  header(index: number, total: number, title: string, prompt: string) {
    return this.text(96, 72, `${index + 1} / ${total}`, 22, GRAY).text(96, 108, title, 60, INK, true).text(96, 186, prompt, 28, GRAY).line(96, 248, 360, 248, INK);
  }
  /** A labelled column: a title and a tall outlined box. */
  column(x: number, y: number, w: number, h: number, title: string) {
    return this.text(x + 8, y - 44, title, 28, INK, true).box(x, y, w, h);
  }
  frame(title: string): Frame {
    return { id: newId(), title, els: Object.fromEntries(this.els.map((el) => [el.id, el])) };
  }
}

const board = (frames: Frame[]): BoardData => ({ v: 1, frames });

/** Evenly spaced columns across the page. */
function columns(b: Builder, titles: string[], y = 380, h = 420, left = 96, right = 1504, gap = 40) {
  const w = (right - left - gap * (titles.length - 1)) / titles.length;
  titles.forEach((title, i) => b.column(left + i * (w + gap), y, w, h, title));
  return w;
}

function timeline(b: Builder, labels: string[], y = 560) {
  const left = 240;
  const right = 1360;
  b.line(left, y, right, y, LINE);
  labels.forEach((label, i) => {
    const x = labels.length === 1 ? (left + right) / 2 : left + (i * (right - left)) / (labels.length - 1);
    b.box(x - 18, y - 18, 36, 36, INK, "ellipse", 5).text(x - label.length * 8.5, y + 44, label, 30, INK, true);
  });
}

export const TEMPLATES: Template[] = [
  {
    key: "sales",
    name: "Sales call",
    description: "Their problem, what they need, how you help, the path forward.",
    frames: ["Their problem", "What they need", "How I help", "The path forward"],
    build: defaultBoard,
  },
  {
    key: "discovery",
    name: "Discovery call",
    description: "Where they are, what they want, budget and timing, next steps.",
    frames: ["Where they are today", "Goals and success", "Budget and timeline", "Next steps"],
    build() {
      const titles = ["Where they are today", "Goals and success", "Budget and timeline", "Next steps"];
      const prompts = ["What are they doing now, and what is not working?", "What does success look like?", "What can they invest, and by when?", "Who does what, and by when?"];
      return board(
        titles.map((title, i) => {
          const b = new Builder().header(i, 4, title, prompts[i]);
          if (i === 0) columns(b, ["What we heard", "Questions to ask"], 360, 440);
          if (i === 1) columns(b, ["Goals", "How we will know"], 360, 440);
          if (i === 2) {
            b.text(96, 330, "Budget", 30, INK, true).box(96, 380, 560, 110).text(760, 330, "Deadline", 30, INK, true).box(760, 380, 560, 110);
            timeline(b, ["Start", "Midway", "Done"], 690);
          }
          if (i === 3) {
            [0, 1, 2].forEach((row) => {
              const y = 330 + row * 150;
              b.box(96, y, 44, 44, INK, "ellipse", 4).line(180, y + 44, 1100, y + 44).text(1180, y + 6, "Owner · date", 28, GRAY);
            });
          }
          return b.frame(title);
        }),
      );
    },
  },
  {
    key: "kickoff",
    name: "Website kickoff",
    description: "Goals, audience, pages and features, timeline.",
    frames: ["Goals", "Audience", "Pages and features", "Timeline"],
    build() {
      const titles = ["Goals", "Audience", "Pages and features", "Timeline"];
      const prompts = ["What should the website do for the business?", "Who is it for, and what do they need?", "What does it need to include?", "Key dates from start to launch."];
      return board(
        titles.map((title, i) => {
          const b = new Builder().header(i, 4, title, prompts[i]);
          if (i === 0) columns(b, ["Must have", "Nice to have", "Not now"], 360, 440);
          if (i === 1) columns(b, ["Who they are", "What they want"], 360, 440);
          if (i === 2) {
            b.box(700, 330, 200, 70, INK).text(742, 349, "Home", 30, INK, true);
            ["About", "Services", "Contact"].forEach((name, k) => {
              const x = 340 + k * 400;
              b.line(800, 400, x + 100, 520, LINE).box(x, 520, 200, 70, INK).text(x + 100 - name.length * 8.5, 539, name, 30, INK, true);
            });
            b.text(96, 700, "Features: forms, booking, online store, blog…", 28, GRAY);
          }
          if (i === 3) timeline(b, ["Kickoff", "Design", "Build", "Launch"]);
          return b.frame(title);
        }),
      );
    },
  },
  {
    key: "marketing",
    name: "Marketing plan",
    description: "Where they are, the opportunities, the plan, what you will track.",
    frames: ["Where you are now", "Opportunities", "The plan", "What we will track"],
    build() {
      const titles = ["Where you are now", "Opportunities", "The plan", "What we will track"];
      const prompts = ["Traffic, leads and what is already working.", "Where is the biggest upside?", "What we do, month by month.", "The numbers that tell us it is working."];
      return board(
        titles.map((title, i) => {
          const b = new Builder().header(i, 4, title, prompts[i]);
          if (i === 0) columns(b, ["Working", "Not working"], 360, 440);
          if (i === 1) {
            [YELLOW, PINK, BLUE].forEach((c, k) => b.note(160 + k * 440, 380, ["Quick win", "Big bet", "Fix first"][k], c, 340, 260));
          }
          if (i === 2) columns(b, ["Month 1", "Month 2", "Month 3"], 360, 440);
          if (i === 3) {
            ["Leads", "Cost per lead", "Revenue"].forEach((name, k) => {
              const x = 160 + k * 470;
              b.box(x, 380, 380, 260, INK).text(x + 28, 410, name, 32, INK, true).text(x + 28, 480, "Now:", 28, GRAY).text(x + 28, 540, "Goal:", 28, GRAY);
            });
          }
          return b.frame(title);
        }),
      );
    },
  },
  {
    key: "brainstorm",
    name: "Brainstorm",
    description: "Dump ideas, group them, pick favourites, plan actions.",
    frames: ["Dump ideas", "Group them", "Pick favourites", "Action plan"],
    build() {
      const titles = ["Dump ideas", "Group them", "Pick favourites", "Action plan"];
      const prompts = ["No filtering. Add a sticky note for every idea.", "Drag similar ideas together.", "Which ideas are worth doing first?", "Who does what, and by when?"];
      return board(
        titles.map((title, i) => {
          const b = new Builder().header(i, 4, title, prompts[i]);
          if (i === 0) [YELLOW, PINK, BLUE, GREEN, YELLOW, PINK].forEach((c, k) => b.note(110 + (k % 3) * 460, 340 + Math.floor(k / 3) * 250, "Idea", c, 340, 200));
          if (i === 1) columns(b, ["Group A", "Group B", "Group C"], 360, 440);
          if (i === 2) {
            [0, 1, 2, 3].forEach((row) => {
              const y = 320 + row * 120;
              b.line(96, y + 70, 1100, y + 70).text(96, y + 10, `Idea ${row + 1}`, 30, INK);
              [0, 1, 2].forEach((dot) => b.box(1200 + dot * 80, y + 14, 44, 44, GRAY, "ellipse", 3));
            });
          }
          if (i === 3) {
            b.text(96, 320, "Task", 28, GRAY, true).text(900, 320, "Owner", 28, GRAY, true).text(1250, 320, "When", 28, GRAY, true);
            [0, 1, 2, 3].forEach((row) => b.line(96, 420 + row * 110, 1504, 420 + row * 110));
          }
          return b.frame(title);
        }),
      );
    },
  },
  {
    key: "swot",
    name: "SWOT analysis",
    description: "Strengths, weaknesses, opportunities and threats on one page.",
    frames: ["SWOT"],
    build() {
      const b = new Builder().text(96, 72, "SWOT", 22, GRAY).text(96, 108, "Strengths, weaknesses, opportunities, threats", 50, INK, true);
      const w = 680;
      const h = 290;
      [
        ["Strengths", 96, 220],
        ["Weaknesses", 824, 220],
        ["Opportunities", 96, 560],
        ["Threats", 824, 560],
      ].forEach(([name, x, y]) => b.box(x as number, y as number, w, h).text((x as number) + 24, (y as number) + 20, name as string, 32, INK, true));
      return board([b.frame("SWOT")]);
    },
  },
  {
    key: "roadmap",
    name: "Project roadmap",
    description: "Four phases side by side, plus risks and open questions.",
    frames: ["Roadmap", "Risks and questions"],
    build() {
      const roadmap = new Builder().header(0, 2, "Roadmap", "What happens in each phase.");
      columns(roadmap, ["Discover", "Design", "Build", "Launch"], 360, 440);
      const risks = new Builder().header(1, 2, "Risks and questions", "What could go wrong, and what we still need to know.");
      columns(risks, ["Risks", "Open questions"], 360, 440);
      return board([roadmap.frame("Roadmap"), risks.frame("Risks and questions")]);
    },
  },
  {
    key: "meeting",
    name: "Meeting notes",
    description: "Agenda, discussion, decisions and action items.",
    frames: ["Agenda", "Discussion", "Decisions", "Action items"],
    build() {
      const titles = ["Agenda", "Discussion", "Decisions", "Action items"];
      const prompts = ["What we will cover.", "Key points and questions.", "What we agreed.", "Who does what, and by when."];
      return board(
        titles.map((title, i) => {
          const b = new Builder().header(i, 4, title, prompts[i]);
          if (i === 0 || i === 2) [0, 1, 2, 3].forEach((row) => b.box(96, 330 + row * 120, 40, 40, INK, "ellipse", 4).line(176, 370 + row * 120, 1400, 370 + row * 120));
          if (i === 1) columns(b, ["Notes", "Questions"], 360, 440);
          if (i === 3) {
            b.text(96, 320, "Action", 28, GRAY, true).text(900, 320, "Who", 28, GRAY, true).text(1250, 320, "By when", 28, GRAY, true);
            [0, 1, 2, 3].forEach((row) => b.line(96, 420 + row * 110, 1504, 420 + row * 110));
          }
          return b.frame(title);
        }),
      );
    },
  },
  {
    key: "proscons",
    name: "Pros and cons",
    description: "Weigh a decision: pros, cons, and the call.",
    frames: ["Pros and cons", "The decision"],
    build() {
      const first = new Builder().header(0, 2, "Pros and cons", "What speaks for it, and what against.");
      columns(first, ["Pros", "Cons"], 360, 440);
      const second = new Builder().header(1, 2, "The decision", "What we choose, and why.");
      second.box(96, 340, 1408, 180).text(120, 360, "Decision", 28, GRAY, true).text(96, 580, "Next step", 30, INK, true).line(96, 670, 1000, 670);
      return board([first.frame("Pros and cons"), second.frame("The decision")]);
    },
  },
  {
    key: "blank",
    name: "Blank board",
    description: "One empty page.",
    frames: ["Page 1"],
    build: () => board([new Builder().frame("Page 1")]),
  },
];

export function buildTemplate(key: string): BoardData {
  return (TEMPLATES.find((template) => template.key === key) ?? TEMPLATES[0]).build();
}
