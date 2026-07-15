import type { Dictionary } from "./types";

export const en: Dictionary = {
  hero: {
    headlineLine1: "One idea.",
    headlineLine2: "Every music AI.",
    description:
      "Suno and Udio each want the idea described differently. Type yours below and see a real compiled result right now — no signup needed.",
    signUp: "Sign up",
    logIn: "Log in",
  },
  problem: {
    headingPlain: "Ask two AIs for the same song.",
    headingPop: "Get two different songs. 🎵",
    withoutTitle: "Without a shared spec",
    withoutItem1:
      "Suno and Udio expect the idea shaped differently — the same description tuned for one often confuses the other.",
    withoutItem2:
      "A song prompt is dozens of interacting decisions (structure, hook placement, lyric technique, what to exclude) — get one wrong by hand and the whole take drifts.",
    withoutItem3: "Ask for a revision, and the one line you actually liked quietly disappears.",
    withTitle: "With Music Prompt Architect",
    withItem1Before: "One validated ",
    withItem1After: " compiles into a prompt package matched to each provider's capabilities.",
    withItem2:
      "Composition and lyric theory checks run before you spend a generation, catching what a manual prompt would miss.",
    withItem3: "Lines you lock stay exactly as written through every compile and revision.",
  },
  service: {
    heading: "What actually happens between your idea and the prompt ⚡",
    card1Outcome: "Compare three directions before you spend a generation",
    card1Detail:
      "Every project compiles into Safe, Balanced, and Bold prompt packages in parallel — from the safest interpretation to the boldest creative swing — so the choice happens before you commit, not after.",
    card2Outcome: "Composition theory, checked automatically",
    card2Detail:
      "Seven engines — form, melody, harmony, rhythm, prosody, arrangement, subtraction — check every project and surface warnings you can dismiss or lock in place, so issues surface before generation instead of after a wasted take.",
    card3Outcome: "Three lyric drafts, your locked lines untouched",
    card3Detail:
      "Generate A/B/C lyric drafts in direct, metaphorical, or hybrid style. Whatever techniques you selected are the only ones that appear, and any line you lock survives every draft, compile, and revision verbatim.",
  },
  craft: {
    heading: "Built on real songwriting craft 🎓✨",
    subheading: "Not marketing claims — rules enforced in the code every time a project compiles.",
    card1Title: "Reference is function, not surface",
    card1Body:
      "Point at a song you admire and the spec captures why it works — restrained verse vs. expanded chorus, a delayed reveal, a silence before the hook — never its melody, lyrics, or voice. Naming a reference requires at least three deliberate differences before it compiles.",
    card2Title: "Direct and simple is a complete option",
    card2Body:
      "Not every song needs a metaphor. Direct, plain-spoken lyrics are treated as a first-class choice, not a fallback for when something more elaborate doesn't work out.",
    card3Title: "What you lock, stays locked",
    card3Body:
      "A favorite line, a fixed hook, a title you won't change — mark it locked and it survives every draft, every compile, every revision, character for character.",
    card4Title: "We studied the syllabus, not just vibes 🎓",
    card4Body:
      "The 7 theory engines above directly implement principles taught in Berklee, USC Thornton, NYU Steinhardt, and Juilliard songwriting curricula. The lyric technique menu is grounded in real K-pop lyricist practice — multi-draft comparison, demo-fitting, the working method associated with lyricists like Kim Eana. Not invented from scratch, and not claiming to guarantee a hit — just checked automatically instead of left to guesswork.",
  },
  demoForm: {
    label: "Describe your musical idea — no signup needed",
    placeholder: "e.g. A bittersweet farewell at a train station, warm indie-pop, mid-tempo",
    generate: "Generate",
    generating: "Generating...",
    genericError: "Generation failed.",
    style: "Style:",
    lyrics: "Lyrics:",
    signUpLink: "Sign up",
    upsellSuffix: "to save this project and unlock Safe / Balanced / Bold with real Gemini output.",
  },
  auth: {
    login: {
      heading: "Log in",
      email: "Email",
      password: "Password",
      submit: "Log in",
      submitting: "Logging in...",
      invalidCredentials: "Invalid email or password.",
      noAccount: "No account?",
      signUpLink: "Sign up",
    },
    signup: {
      heading: "Sign up",
      email: "Email",
      passwordLabel: "Password (min 8 characters)",
      submit: "Sign up",
      submitting: "Signing up...",
      genericError: "Sign up failed.",
      autoLoginFailed: "Account created, but automatic login failed. Please log in.",
      alreadyHaveAccount: "Already have an account?",
      logInLink: "Log in",
    },
  },
};
