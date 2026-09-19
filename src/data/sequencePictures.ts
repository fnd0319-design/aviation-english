export interface SequencePictureData {
  id: string;
  title: string;
  imageUrls: string[];
  descriptionPrompt: string;
  sampleAnswers: string[];
  referenceStory: string; // AIが状況説明を評価する際の参考ストーリー
  phase2Questions: string[];
  phase3Questions: string[];
}

export const sequencePictures: SequencePictureData[] = [
  {
    id: "seq_01",
    title: "TEST1.Visual Approach中のRWY Change",
    imageUrls: [
      "/seq_test_01.jpg"
    ],
    descriptionPrompt: "Please look at the 4-panel picture and explain the situation you experienced in the past tense.",
    sampleAnswers: [
      "I was vectored to right downwind for visual approach runway 27",
      "Surface wind changed from westerly to easterly, and ATC proposed visual approach runway 09",
      "I accepted it and headed directly to runway 09 final course from before runway 27 downwind",
      "PAPI showed four white lights, and I judged the path was high. I was sweating cold. The FO advised me 'Too High'"
    ],
    referenceStory: "宮崎空港のような滑走路（RWY 27/09）での天候良好時の出来事。当初、RWY 27へのビジュアルアプローチのためにライトダウンウィンド（Right Downwind）にベクトルされていた。しかし、地上風が西風から東風へと変わったため、管制官（ATC）からRWY 09へのビジュアルアプローチを提案された。それを受け入れ（Accept）、RWY 27のダウンウィンド手前からRWY 09のファイナルコースに直接向かった。しかし最終進入中、PAPIが白4つを示し、パス（進入高度）が高いと判断した。操縦していた私は冷や汗をかいており、副操縦士（FO）から「Too High（高すぎる）」とアドバイスされた。",
    phase2Questions: [
      "What should you do after this?",
      "What would you do if the PAPI showed three white lights and one red light?",
      "What is the difference when landing with a tailwind?",
      "Why did the path become high?"
    ],
    phase3Questions: [
      "Have you ever experienced going around because the path became high during approach? Please share your experience."
    ]
  }
];
