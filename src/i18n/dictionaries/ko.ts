import type { Dictionary } from "./types";

export const ko: Dictionary = {
  hero: {
    headlineLine1: "하나의 아이디어.",
    headlineLine2: "모든 음악 AI로.",
    description:
      "Suno와 Udio는 서로 다른 방식으로 아이디어를 원합니다. 아래에 적어보면 회원가입 없이 바로 실제 컴파일 결과를 확인할 수 있습니다.",
    signUp: "회원가입",
    logIn: "로그인",
  },
  problem: {
    headingPlain: "같은 곡을 두 AI에게 물어보세요.",
    headingPop: "서로 다른 두 곡이 나옵니다. 🎵",
    withoutTitle: "공통 설계도 없이",
    withoutItem1:
      "Suno와 Udio는 아이디어가 다른 방식으로 정리되길 원합니다 — 한쪽에 맞춘 설명은 다른 쪽을 혼란스럽게 만들곤 합니다.",
    withoutItem2:
      "곡 프롬프트는 수십 가지 서로 얽힌 결정들(구조, 훅 위치, 가사 기법, 제외할 것)로 이루어져 있습니다 — 손으로 하나만 잘못 정해도 전체 결과가 흔들립니다.",
    withoutItem3: "수정을 요청하면, 정작 마음에 들었던 그 한 줄이 조용히 사라집니다.",
    withTitle: "Music Prompt Architect와 함께라면",
    withItem1Before: "검증된 ",
    withItem1After: " 하나가 각 Provider의 지원 범위에 맞춘 프롬프트 패키지로 컴파일됩니다.",
    withItem2:
      "생성을 소비하기 전에 작곡·작사 이론 검사가 먼저 실행되어, 수동 프롬프트로는 놓쳤을 문제를 잡아냅니다.",
    withItem3: "잠근 가사 줄은 모든 컴파일과 수정 과정에서 원문 그대로 유지됩니다.",
  },
  service: {
    heading: "아이디어와 프롬프트 사이에서 실제로 일어나는 일 ⚡",
    card1Outcome: "생성을 쓰기 전에 세 가지 방향을 비교하세요",
    card1Detail:
      "모든 프로젝트는 Safe, Balanced, Bold 프롬프트 패키지로 동시에 컴파일됩니다 — 가장 안전한 해석부터 가장 과감한 창작 시도까지 — 선택은 실행하기 전에, 실행한 뒤가 아니라 이루어집니다.",
    card2Outcome: "작곡 이론, 자동으로 검사됩니다",
    card2Detail:
      "형식, 멜로디, 화성, 리듬, 프로소디, 편곡, 뺄셈까지 7개 엔진이 모든 프로젝트를 검사하고, 거부하거나 잠글 수 있는 경고를 보여줍니다 — 문제는 생성을 낭비한 뒤가 아니라 그 전에 드러납니다.",
    card3Outcome: "가사 초안 3개, 잠근 줄은 그대로",
    card3Detail:
      "직설, 은유, 하이브리드 스타일로 A/B/C 가사 초안을 생성합니다. 선택한 기법만 실제로 나타나며, 잠근 줄은 모든 초안·컴파일·수정에서 그대로 보존됩니다.",
  },
  craft: {
    heading: "진짜 작사·작곡 실무 위에 세워졌습니다 🎓✨",
    subheading: "마케팅 문구가 아니라, 프로젝트가 컴파일될 때마다 코드로 강제되는 규칙입니다.",
    card1Title: "레퍼런스는 표면이 아니라 원리입니다",
    card1Body:
      "좋아하는 곡을 가리키면, 설계도는 그 곡이 왜 통하는지를 담아냅니다 — 절제된 벌스 대 확장된 코러스, 지연된 반전, 훅 앞의 침묵 — 멜로디나 가사, 목소리 자체는 절대 아닙니다. 레퍼런스를 지정하면 컴파일 전에 최소 3개의 의도적 차이가 필요합니다.",
    card2Title: "직설적이고 단순한 가사도 완전한 선택지입니다",
    card2Body:
      "모든 곡에 은유가 필요한 건 아닙니다. 직설적이고 담백한 가사는 더 정교한 시도가 실패했을 때의 대안이 아니라, 그 자체로 1순위 선택지로 취급됩니다.",
    card3Title: "잠근 것은 그대로 잠겨 있습니다",
    card3Body:
      "마음에 드는 한 줄, 고정된 훅, 바꾸지 않을 제목 — 잠그기만 하면 모든 초안·컴파일·수정에서 글자 하나까지 그대로 보존됩니다.",
    card4Title: "감으로만 만들지 않았습니다, 커리큘럼부터 공부했습니다 🎓",
    card4Body:
      "위의 7개 이론 엔진은 Berklee, USC Thornton, NYU Steinhardt, Juilliard 작곡 커리큘럼에서 가르치는 원리를 직접 구현한 것입니다. 가사 기법 메뉴는 실제 K-pop 작사 실무 — 복수 초안 비교, 데모 피팅, 전문 작사팀들이 실제로 쓰는 반복적 작업 방식 — 에 근거합니다. 그냥 지어낸 게 아니고, 그렇다고 히트를 보장한다는 것도 아닙니다 — 그저 감으로 남겨두지 않고 자동으로 검사할 뿐입니다.",
  },
  demoForm: {
    label: "음악 아이디어를 적어보세요 — 회원가입 필요 없음",
    placeholder: "예: 기차역에서의 씁쓸한 이별, 따뜻한 인디팝, 미드템포",
    generate: "생성하기",
    generating: "생성 중...",
    genericError: "생성에 실패했습니다.",
    style: "스타일:",
    lyrics: "가사:",
    noLyricsFallback: "실제 가사 초안은 회원가입 후 Gemini로 생성됩니다 — 무료 데모는 스타일 방향만 컴파일합니다.",
    previewBadge: "빠른 미리보기",
    upgradingNotice: "실제 Gemini + 작곡 이론으로 다듬는 중...",
    signUpLink: "회원가입",
    upsellSuffix: "하면 이 프로젝트를 저장하고 실제 Gemini 출력으로 Safe / Balanced / Bold를 사용할 수 있습니다.",
  },
  auth: {
    login: {
      heading: "로그인",
      email: "이메일",
      password: "비밀번호",
      submit: "로그인",
      submitting: "로그인 중...",
      invalidCredentials: "이메일 또는 비밀번호가 올바르지 않습니다.",
      noAccount: "계정이 없으신가요?",
      signUpLink: "회원가입",
    },
    signup: {
      heading: "회원가입",
      email: "이메일",
      passwordLabel: "비밀번호 (최소 8자)",
      submit: "회원가입",
      submitting: "가입 중...",
      genericError: "회원가입에 실패했습니다.",
      autoLoginFailed: "계정은 생성되었지만 자동 로그인에 실패했습니다. 로그인해 주세요.",
      alreadyHaveAccount: "이미 계정이 있으신가요?",
      logInLink: "로그인",
    },
  },
};
