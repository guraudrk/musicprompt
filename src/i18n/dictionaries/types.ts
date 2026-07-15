/**
 * Landing page + auth pages only (Hero/Problem/Service/Craft/DemoForm, /login, /signup) — the
 * dashboard and ProjectEditor form are a separate, much larger translation slice, deferred (see
 * DECISIONS.md). Every locale must supply every key — a missing key is a compile error, not a
 * silent runtime fallback to English.
 */
export interface Dictionary {
  hero: {
    headlineLine1: string;
    headlineLine2: string;
    description: string;
    signUp: string;
    logIn: string;
  };
  problem: {
    headingPlain: string;
    headingPop: string;
    withoutTitle: string;
    withoutItem1: string;
    withoutItem2: string;
    withoutItem3: string;
    withTitle: string;
    withItem1Before: string;
    withItem1After: string;
    withItem2: string;
    withItem3: string;
  };
  service: {
    heading: string;
    card1Outcome: string;
    card1Detail: string;
    card2Outcome: string;
    card2Detail: string;
    card3Outcome: string;
    card3Detail: string;
  };
  craft: {
    heading: string;
    subheading: string;
    card1Title: string;
    card1Body: string;
    card2Title: string;
    card2Body: string;
    card3Title: string;
    card3Body: string;
    card4Title: string;
    card4Body: string;
  };
  demoForm: {
    label: string;
    placeholder: string;
    generate: string;
    generating: string;
    genericError: string;
    style: string;
    lyrics: string;
    signUpLink: string;
    upsellSuffix: string;
  };
  auth: {
    login: {
      heading: string;
      email: string;
      password: string;
      submit: string;
      submitting: string;
      invalidCredentials: string;
      noAccount: string;
      signUpLink: string;
    };
    signup: {
      heading: string;
      email: string;
      passwordLabel: string;
      submit: string;
      submitting: string;
      genericError: string;
      autoLoginFailed: string;
      alreadyHaveAccount: string;
      logInLink: string;
    };
  };
}
