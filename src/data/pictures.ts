export interface PictureData {
  id: string;
  imageUrl: string;
  descriptionPrompt: string;
  sampleAnswers: string[];
  phase2Questions: string[];
  phase3Questions: string[];
}

export const pictures: PictureData[] = [
  {
    id: "pic_01",
    imageUrl: "/src/assets/test_picture_01_new.jpg",
    descriptionPrompt: "Please describe the situation in the picture.",
    sampleAnswers: [
      "passenger boarding the airplane",
      "passenger is reading a newspaper",
      "passenger service staff is taking care of a handicapped passenger (in wheelchair)",
      "making phone call using a mobile phone",
      "Indian passenger smoking a cigarette",
      "two mechanics standing by the airplane",
      "airplane under towing",
      "captain is reading a checklist"
    ],
    phase2Questions: [
      "What is the first passenger reading the newspaper doing?",
      "Why is the staff assisting the passenger in the middle?",
      "Can you describe what the passenger with cigarette is doing?",
      "What is the role of the two mechanics standing by the airplane?",
      "Why do you think the captain is reading a checklist at this moment?"
    ],
    phase3Questions: [
      "Have you ever experienced or witnessed a problem with a passenger during boarding? Please share your experience.",
      "How do you handle a situation where a passenger is not following safety regulations, such as smoking?",
      "Tell me about a time when you had to assist a passenger who needed special care or attention."
    ]
  },
  {
    id: "pic_02",
    imageUrl: "/src/assets/test_picture_02_new.jpg",
    descriptionPrompt: "Please describe the situation in the picture.",
    sampleAnswers: [
      "I can see an airplane parked, and there is a maintenance issue.",
      "Green fluid is leaking from the engine onto the ground.",
      "A mechanic in an orange suit is inspecting the engine while pointing at the leak.",
      "The pilots are discussing the situation with the mechanics."
    ],
    phase2Questions: [
      "What is the mechanic in the orange suit doing?",
      "Can you describe the expression of the cabin crew looking out from the cockpit window?",
      "What could be the cause of the green fluid leaking from the engine?",
      "What should the pilots or cabin crew do in this situation before allowing boarding?",
      "Why are the pilots discussing the situation outside the aircraft?"
    ],
    phase3Questions: [
      "Have you ever encountered an unexpected maintenance issue before departure? How did you manage it?",
      "Please share an experience where you had to communicate a technical problem or delay to passengers.",
      "Tell me about a situation where effective teamwork with maintenance staff was critical."
    ]
  },
  {
    id: "pic_03",
    imageUrl: "/src/assets/test_picture_03_new.jpg",
    descriptionPrompt: "Please describe the situation in the picture.",
    sampleAnswers: [
      "An aircraft is on fire on the runway, and black smoke is billowing from it.",
      "Passengers are evacuating using the emergency slide.",
      "Emergency vehicles, including a fire engine, are rushing to the scene.",
      "Another airplane is landing or holding nearby."
    ],
    phase2Questions: [
      "Can you describe what the passengers are doing near the emergency slide?",
      "What kind of animals do you see in the grassy area in the foreground?",
      "What action is the fire engine taking regarding the burning aircraft?",
      "Why is the other airplane waiting or holding nearby?",
      "What should the rescue teams prioritize in this situation?"
    ],
    phase3Questions: [
      "Could you tell me about the most critical emergency procedure you have been trained for?",
      "Have you ever experienced an emergency situation on the tarmac or runway? Please share your experience.",
      "How important is constant training for emergency evacuations? Please give an example from your training."
    ]
  },
  {
    id: "pic_04",
    imageUrl: "/src/assets/test_picture_04.jpg",
    descriptionPrompt: "Please describe the situation in the picture.",
    sampleAnswers: [
      "This is a cross-section diagram of a Boeing 767-300.",
      "A fuel truck is actively pumping fuel into the wing.",
      "Cargo loading is in progress near the tail section.",
      "A hydraulic leak is indicated under the engine."
    ],
    phase2Questions: [
      "What is the flight crew observing from the cabin windows?",
      "Can you explain the warning signs written on the ground near the center fuselage?",
      "What is the fuel truck actively doing near the wing?",
      "Can you describe the cargo loading process happening at the tail section?",
      "What is the significance of the hydraulic leak indicated under the engine?"
    ],
    phase3Questions: [
      "How important is clear communication with ground maintenance crew? Please give an example from your experience.",
      "Have you ever faced a flight delay caused by refueling or cargo loading issues? Tell me about it.",
      "Describe a time when you discovered a minor technical issue during a pre-flight walkaround."
    ]
  },
  {
    id: "pic_05",
    imageUrl: "/test_05.jpg",
    descriptionPrompt: "Please describe the situation in the picture.",
    sampleAnswers: [
      "An airplane is on fire on the runway and emitting heavy black smoke.",
      "Passengers are evacuating the aircraft using the emergency slide.",
      "A fire truck is extinguishing the fire, and an ambulance is arriving on the scene.",
      "There are other airplanes waiting on the taxiway, and one airplane taking off or landing in the background.",
      "Several passenger ships are sailing in the ocean behind the airport.",
      "A fox and some birds are in the grassy area in the foreground."
    ],
    phase2Questions: [
      "What action is the fire engine taking?",
      "What can you see in the ocean in the background?",
      "Why are the other airplanes waiting on the taxiway?",
      "How are the passengers evacuating the aircraft?",
      "What kind of wild animals are present in the foreground?"
    ],
    phase3Questions: [
      "Have you ever experienced an emergency situation on the tarmac or runway? Please share your experience.",
      "Could you tell me about the most critical emergency procedure you have been trained for?",
      "Tell me about a time when you had to make a quick decision under significant pressure."
    ]
  }
];
