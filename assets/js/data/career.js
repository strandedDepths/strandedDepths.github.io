// Career milestones, each one a landmark along the drakkar's route.
// `t` is the position along the sailing route (0 = home island, 1 = furthest island).
// `marker` selects what gets built at that point:
//   "house"     — the starting island, a wooden house
//   "osaka"     — Osaka castle + a cherry blossom tree
//   "montblanc" — a snow-capped peak
//   "fog"       — no island: just a misty patch of violet water
//   "bigben"    — a clock tower
export const careerSteps = [
  {
    t: 0.04,
    marker: "house",
    label: "Spec. ML/AI & IT",
    title: "Computer Science Engineer Graduation — CY-Tech CY Paris Université France",
    period: "2019 — 2025",
    description:
      "Specialization in Artificial Intelligence · French Grande École (Master of Science in Computer Science Engineering).",
  },
  {
    t: 0.26,
    marker: "osaka",
    label: "5 months",
    title: "ML/AI Research Scientist Intern — OMU Japan",
    period: "2023",
    description:
      "Research on multimodal AI for onomatopoeia generation",
  },
  {
    t: 0.48,
    marker: "montblanc",
    label: "6 months",
    title: "AI R&D Engineer Intern — STMicroelectronics France",
    period: "2024",
    description:
      "AI Optimization for analog circuit",
  },
  {
    t: 0.68,
    marker: "fog",
    label: "Present",
    title: "AI Engineer : Independent Projects",
    period: "2025",
    description:
      "Independent project devlopment and research ",
  },
  {
    t: 0.9,
    marker: "bigben",
    label: "Present",
    title: "Volunteer & Founding Full-Stack Engineer — FlowSignal England",
    period: "2026",
    description:
      "Founding Engineer",
  },
];
