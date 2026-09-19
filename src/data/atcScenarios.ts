export interface ATCScenario {
  id: string;
  title: string;
  subtitle?: string;
  roleplayContent: string[];
  followUpQuestions: string[];
  experienceQuestion: string;
}

export const atcScenarios: ATCScenario[] = [
  {
    id: "atc_01",
    title: "Scenario 1",
    subtitle: "Sick Passenger during\nKIX Approach",
    roleplayContent: [
      "KIXへの降下を開始し、関西アプローチとコンタクト",
      "客室で急病人が発生",
      "PAN-PANコール",
      "ILS 24Lのアプローチ・クリアランスを受領し、優先権を得て進入",
      "APP中にAirportをInsightしてVisual Approachをリクエスト",
      "24LのDownwindに入ってTWR Contactして終了"
    ],
    followUpQuestions: [
      "Why did you request a visual approach?",
      "Besides a PAN-PAN call, what other emergency calls are there, and what is the difference between them?"
    ],
    experienceQuestion: "Have you ever experienced a passenger becoming suddenly ill during a flight?"
  },
  {
    id: "atc_02",
    title: "Scenario 2",
    roleplayContent: [],
    followUpQuestions: [],
    experienceQuestion: ""
  },
  {
    id: "atc_03",
    title: "Scenario 3",
    roleplayContent: [],
    followUpQuestions: [],
    experienceQuestion: ""
  }
];
