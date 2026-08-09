export const school = {
  name: "Excelsior Ultrasound Institute",
  shortName: "Excelsior",
  tagline: "Train for a career in diagnostic medical sonography.",
  phone: "(407) 271-4486",
  fax: "(407) 271-4510",
  email: "info@excelsiorultrasoundinstitute.com",
  address: {
    line1: "9401 West Colonial Drive, Suite 206",
    city: "Ocoee",
    state: "FL",
    zip: "34761",
  },
  founder: {
    name: "Andrew Thompson, MD, MBBS, BS, RDMS, RVT",
    title: "Founder",
  },
  program: {
    name: "Technical Diploma in Diagnostic Medical Sonography",
    duration: "18 months",
    cohortSize: 20,
    specialties: 6,
    tuition: 35000,
    registrationFee: 150,
    uniformFee: 25,
  },
} as const;

export const navLinks = [
  { href: "/program", label: "Program" },
  { href: "/curriculum", label: "Curriculum" },
  { href: "/admissions", label: "Admissions" },
  { href: "/tuition", label: "Tuition" },
  { href: "/ardms-prep", label: "ARDMS Prep" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
  { href: "/portal", label: "Portal" },
] as const;

export const specialties = [
  {
    name: "Abdominal Sonography",
    summary:
      "Protocol-driven abdominal scanning with pathology recognition and documentation standards.",
  },
  {
    name: "OB/GYN Sonography",
    summary:
      "Obstetric and gynecologic imaging across trimesters, including dating and viability criteria.",
  },
  {
    name: "Vascular Sonography",
    summary:
      "Arterial and venous duplex concepts, waveform recognition, and clinical correlation.",
  },
  {
    name: "Acoustic Physics & Instrumentation",
    summary:
      "Ultrasound physics, transducers, beam formation, and image optimization foundations.",
  },
  {
    name: "Cross-Sectional Anatomy",
    summary:
      "Sonographic anatomy correlations across abdominal and pelvic imaging planes.",
  },
  {
    name: "Patient Care, Ethics & Terminology",
    summary:
      "Professionalism, medical terminology, patient communication, and records management.",
  },
] as const;

export const whyExcelsior = [
  {
    title: "Expertise of staff",
    body: "Learn from physicians and advanced educators with deep ultrasound specialization.",
  },
  {
    title: "Six specialty focus",
    body: "Most programs prepare students for one or two specialties. Excelsior trains across six.",
  },
  {
    title: "Clinical experience first",
    body: "Hands-on clinical learning is woven through the program from beginning to end.",
  },
  {
    title: "Small cohorts",
    body: "Only 20 students per 18-month intake — more attention, deeper coverage.",
  },
] as const;

export const admissionCriteria = [
  "High school diploma",
  "Completion of a Biology course and a Math course at the college level",
  "Successful interview with Excelsior faculty members",
] as const;

export const careerPoints = [
  {
    title: "Make a difference",
    body: "Work directly with patients and serve as a critical link between patients and physicians.",
  },
  {
    title: "Growing field",
    body: "Diagnostic medical sonography remains among healthcare careers with strong projected demand.",
  },
  {
    title: "Compressed training",
    body: "Complete a focused technical diploma in as little as 18 months — not a four-year path.",
  },
  {
    title: "Specialty variety",
    body: "Build range across abdominal, OB/GYN, vascular, and supporting foundations.",
  },
] as const;
