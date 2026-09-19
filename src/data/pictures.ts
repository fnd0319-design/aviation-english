import testPic01 from '../assets/test_picture_01_new.jpg';
import testPic02 from '../assets/test_picture_02_new.jpg';
import testPic03 from '../assets/test_picture_03_new.jpg';
import testPic04 from '../assets/test_picture_04.jpg';
import testPic05 from '../assets/test_picture_05.jpg';
import testPic06 from '../assets/test_picture_06.jpg';
import testPic07 from '../assets/test_picture_07.jpg';

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
    imageUrl: testPic01,
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
    imageUrl: testPic02,
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
    imageUrl: testPic03,
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
    imageUrl: testPic04,
    descriptionPrompt: "Please describe the situation in the picture.",
    sampleAnswers: [
      "An airplane is taxiing into the parking stand in heavy snowfall.",
      "The ground and apron area are covered with thick snow.",
      "A marshaller in an orange suit is guiding the aircraft with lighted wands.",
      "Several ground crew members are standing by and observing the arrival.",
      "One ground staff is shoveling snow near the passenger boarding bridge.",
      "The control tower is visible in the background through the falling snow."
    ],
    phase2Questions: [
      "What is the marshaller in the orange suit doing?",
      "What are the ground staff members doing in the foreground?",
      "Why is one of the workers shoveling snow near the boarding bridge?",
      "What hazards might the flight crew face when taxiing on a snow-covered apron?",
      "Can you describe the weather condition shown in the picture?"
    ],
    phase3Questions: [
      "Have you ever operated a flight during heavy snow or de-icing operations? Please share your experience.",
      "What precautions do you take when taxiing on contaminated or slippery taxiways?",
      "How do winter weather conditions affect ground handling and flight turnaround times?"
    ]
  },
  {
    id: "pic_05",
    imageUrl: testPic05,
    descriptionPrompt: "Please describe the situation in the picture.",
    sampleAnswers: [
      "An aircraft has overrun or veered off the runway in snowy conditions.",
      "A main landing gear tire has burst and caught fire, emitting smoke and flames.",
      "Passengers are evacuating the aircraft from the rear door.",
      "Two fire engines and an ambulance have arrived at the accident site.",
      "Rescue personnel are assisting an injured passenger toward the ambulance.",
      "The windsock indicates strong wind, and snow-covered mountains are visible behind."
    ],
    phase2Questions: [
      "Can you explain what happened to the aircraft tire in the detailed view?",
      "How are the emergency rescue teams responding to the situation?",
      "What are the passengers doing at the rear of the aircraft?",
      "What does the windsock tell you about the weather conditions?",
      "Why do you think the aircraft ran off the runway?"
    ],
    phase3Questions: [
      "Have you ever experienced a tire burst or severe brake overheating during landing or takeoff?",
      "What procedures must be followed in case of a runway excursion or evacuation?",
      "How do you coordinate with emergency services during an on-airport incident?"
    ]
  },
  {
    id: "pic_06",
    imageUrl: testPic06,
    descriptionPrompt: "Please describe the situation in the picture.",
    sampleAnswers: [
      "We are looking at final approach to Runway 34 from the cockpit.",
      "There is a severe thunderstorm with lightning and heavy rain in the background.",
      "The PAPI lights show three white and one red, indicating the aircraft is slightly high on profile.",
      "A large suspension bridge and city skyline are visible across the water.",
      "Several airplanes are waiting on the parallel taxiway.",
      "A windsock shows crosswind conditions near the threshold."
    ],
    phase2Questions: [
      "What do the PAPI lights indicate regarding the aircraft's approach path?",
      "Can you describe the severe weather condition visible beyond the runway?",
      "What traffic do you observe on the parallel taxiway and near the terminal?",
      "What potential hazards would you anticipate when landing toward such a storm?",
      "What action might the pilot take if the weather deteriorates further before touchdown?"
    ],
    phase3Questions: [
      "Have you ever executed a missed approach or go-around due to thunderstorm or windshear activity? Tell me about it.",
      "How do you manage cockpit workload when flying into hazardous convective weather?",
      "What is your personal minimum when deciding whether to land or divert during bad weather?"
    ]
  },
  {
    id: "pic_07",
    imageUrl: testPic07,
    descriptionPrompt: "Please describe the situation in the picture.",
    sampleAnswers: [
      "This is a general aviation airfield with Runway 09 and 27.",
      "A light propeller airplane is taking off or landing on Runway 27.",
      "On the apron, a fuel truck is refueling a twin-engine aircraft.",
      "There is a helipad, a maintenance hangar, and a control tower next to a restaurant.",
      "People are sitting at outdoor restaurant tables watching the airplanes.",
      "In the foreground, a river flows with a sailboat and a small motorboat."
    ],
    phase2Questions: [
      "What is happening on the apron near the fuel truck?",
      "Can you describe the aircraft movement on Runway 27?",
      "What recreational facilities or activities can you see around the airfield?",
      "What kind of traffic is visible in the river in the foreground?",
      "What challenges are associated with operating at an uncontrolled or general aviation airfield?"
    ],
    phase3Questions: [
      "Have you ever flown into or trained at an uncontrolled general aviation airfield? Please share your experience.",
      "How do you maintain situational awareness with light aircraft and visual traffic in the vicinity?",
      "Tell me about a memorable flight you had in a light aircraft or during initial flight training."
    ]
  }
];
