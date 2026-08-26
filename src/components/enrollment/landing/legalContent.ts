export interface LegalSection {
  title: string;
  points: string[];
}

export const termsSections: LegalSection[] = [
  {
    title: "1. Parking",
    points: [
      "Please park in the designated spots.",
      "Please reduce your speed when in the training grounds and be aware of the possibility of children and off-lead dogs.",
    ],
  },
  {
    title: "2. Leads",
    points: [
      "ALL puppies and dogs are to be on lead at ALL times unless instructed otherwise by an instructor or assistant.",
      "Please ensure that your lead is of a suitable quality and not likely to break. If you are unsure, please ask an instructor or assistant.",
      "Excessively long leads, chain leads and retractable leads are strongly discouraged. A suitable lead is leather or webbing 90cm - 120cm in length.",
    ],
  },
  {
    title: "3. Collars / Chains",
    points: [
      "ALL puppies and dogs are to be wearing a collar/half-check/harness at ALL times unless instructed otherwise by an instructor or assistant.",
      "Please ensure that your collar/half-check/harness is of a suitable quality and not likely to break. If you are unsure, please ask an instructor or assistant.",
      "Prong collars and electric shock collars are NOT allowed. Half-check collars for puppies are permitted, but a normal collar is preferred.",
    ],
  },
  {
    title: "4. Training Equipment",
    points: [
      "Under NO circumstances are puppies or dogs allowed on any of the training equipment/obstacles unless under the direct supervision of an instructor or assistant.",
      "Please ensure that children attending the classes are made aware that none of the training equipment is to be played upon/with.",
    ],
  },
  {
    title: "5. General",
    points: [
      "Control of your dog remains your responsibility at all times. Please prevent your dog from creating a disturbance or provoking other dogs.",
      "Only able-bodied adults are permitted to handle dogs unless prior arrangement has been made with the instructor.",
      "Please ensure that any mess your dog makes is cleaned up as soon as possible - we request that you bring your own plastic bags to training for this purpose. Should you forget, we do have bags available.",
      "Please refrain from smoking/vaping, eating and drinking during classes and please use the rubbish bins and ashtrays provided.",
      "Children attending classes are required to be supervised by an adult at all times - we strongly advise that this adult is additional to the person handling the puppy/dog.",
      "Dogs not enrolled in classes are not allowed on the premises (with the exception of instructors' and assistants' dogs).",
      "Please do not enter areas either clearly marked as \u201cNo Entry\u201d or into closed areas unless so invited by an instructor or assistant.",
      "No alcohol is permitted at training classes.",
    ],
  },
  {
    title: "6. Healthcare",
    points: [
      "Vaccinations must be current and administered by a licenced veterinarian on an official practice card detailing vaccine batch numbers.",
      "Puppies require two multi vaccinations prior to admission, with the latest one being administered by a licenced veterinarian. Should a puppy be precluded from classes due to this requirement, owners are welcome to attend the class without their puppy (to receive the full content of the course) while the puppy is unable to join.",
      "Dogs that are ill, injured or on heat are not permitted to attend classes. We are unable to offer a refund for lessons missed in this regard - owners/handlers are however welcome to attend to keep up with class content.",
      "Please ensure that your puppy or dog is suitably protected against internal and external parasites at all times.",
    ],
  },
  {
    title: "7. Benching / Crating of Dogs",
    points: [
      "Dogs are NOT to be benched i.e. tied to a pole - they must rather be crated.",
      "Please crate your dogs in a shaded area. If your dog is to remain in your car, please ensure that the car is shaded and that there is no doubt as to the comfort and wellbeing of the dog.",
      "Should your dog bark or whine excessively when they are crated, please make alternate arrangements.",
    ],
  },
  {
    title: "8. Interaction with Other Dogs and People",
    points: [
      "No on-lead socialising. Please respect the personal space of other dogs and puppies - do not allow your puppy or dog to barge into another puppy or dog's space. Repeated incidents will result in non-admission with no refund of fees paid.",
      "Please exercise good sense around crated dogs.",
      "Please do NOT feed another person's puppy or dog without asking permission first. Should you be denied permission please do not be offended. Teaching a dog to accept food from a stranger is a very bad habit and there might be allergy concerns.",
    ],
  },
  {
    title: "9. Adverse Weather / Class Rescheduling",
    points: [
      "In most cases we have undercover areas, so in adverse weather classes go ahead UNLESS we contact you to the contrary to reschedule a lesson.",
      "In exceptional situations the dates and times of classes are subject to change, due to circumstances beyond our control. In such cases we will do our utmost to accommodate handlers' needs.",
    ],
  },
  {
    title: "10. Cancellation Policy, Refund & Notice Structure",
    points: [
      "Course cancellation more than 7 days prior to start of course - 100%.",
      "Course cancellation less than 7 days prior to start of course - 50%.",
      "Course cancellation during course - 25% (less lessons attended/elapsed).",
      "A cancellation is deemed as any change to the originally booked dates, times or location, with written notice from the client. Lessons elapsed prior to notice cannot be refunded. Lessons not attended due to the client's scheduling/circumstances or dog illness/heat cycles cannot be refunded.",
      "On-going monthly classes are billed and payable until such time that the client advises non-attendance in the month before this occurs e.g. if lessons are going to be stopped at the end of September we require notice of this in August. We cannot credit billing in arrears.",
      "Private lessons cancelled within 24 hours of the scheduled time will be charged at 100% - no exceptions.",
    ],
  },
  {
    title: "11. Missed Lessons",
    points: [
      "We cannot offer make-up lessons or refunds for lessons missed by the client - in this instance we will do our utmost to assist the client in catching up during the remaining lessons and in some situations we are able to provide videos covering the missed content.",
    ],
  },
];

export const indemnityPoints: string[] = [
  "By enrolling my dog in McKaynine classes I acknowledge the inherent risks associated with dog training.",
  "I understand that participation in these classes/sessions involves potential risks to my dog, myself, my property, any minors in my charge and any persons accompanying me during classes/sessions.",
  "I accept full responsibility for being in control of my dog at all times while present at McKaynine classes/sessions. I will ensure that my dog is properly controlled and I will follow all instructions provided by McKaynine staff.",
  "I further acknowledge and accept that my dog's behaviour, both during and after classes/sessions, is my sole responsibility. I will take appropriate measures to prevent any harm or damage caused by my dog to other participants, their dogs or their property.",
  "In consideration of being present at McKaynine classes/sessions, I hereby agree to indemnify and hold harmless McKaynine, its staff and agents, from any and all claims, liabilities, damages, expenses or losses, including but not limited to personal injury, property damage or any other harm, that may arise as a result of my dog's participation in the classes/sessions or due to my failure to control my dog.",
  "I understand and accept that this indemnity extends to any minors in my charge and any persons accompanying me during classes/sessions. I recognise that it is my responsibility to ensure their safety and to inform them of the risks associated with dog training.",
  "By submitting an enrolment for my dog, I affirm that I have read and understood this indemnity declaration and I voluntarily agree to its terms and conditions as well as the McKaynine Terms & Conditions referred to above.",
  "I hereby release McKaynine from any liability related to my dog's behaviour and I undertake full responsibility for any consequences thereof.",
  "I understand that failure to adhere to the Terms & Conditions will result in non-admission to the facilities/venues/classes/sessions with no refund of training fees.",
];

export const homeTrainSections: LegalSection[] = [
  {
    title: "1. Scope",
    points: [
      "Sessions are conducted at the client's residence (home property) or an alternative private or public location.",
    ],
  },
  {
    title: "2. Access, Parking & Arrival",
    points: [
      "Please ensure our instructor can access the property at the booked time and that parking is reasonably available. If access is delayed by more than 15 minutes from the scheduled start, the session time may be reduced accordingly or charged as a late cancellation per our standard policy i.e. McKaynine HomeTrain lessons cancelled within 24 hours of the scheduled time will be charged at 100% - no exceptions.",
    ],
  },
  {
    title: "3. Home Safety & Set-Up",
    points: [
      "The client agrees to provide a safe, enclosed area free of hazards (e.g. slippery floors, unfenced pools, toxic plants/chemicals, loose cables), suitable training treats and any other equipment specified by the instructor. Other pets might be requested to be secured to minimise arousal or conflict. Children are welcome but must be actively supervised by a separate adult and be non-disruptive.",
    ],
  },
  {
    title: "4. Equipment & Handling",
    points: [
      "Dogs must be on lead unless and until the instructor directs otherwise. Acceptable equipment remains as per our main Terms & Conditions (e.g. flat collar/half-check/harness). Prong and electronic collars are not permitted. Obstacles and equipment are only used under instructor supervision.",
    ],
  },
  {
    title: "5. Health, Vaccinations & Attendance",
    points: [
      "Clients must kindly follow the vaccination/health requirements in our main Terms & Conditions. Dogs that are ill or injured cannot undergo a training session.",
    ],
  },
  {
    title: "6. Aggression & Safety Escalation",
    points: [
      "Please disclose any bite history or significant aggression prior to booking. The instructor may recommend management tools (including muzzle conditioning) or a different format. If safety is compromised, the instructor may pause or terminate the session; fees apply as per Cancellation/Rescheduling in our main Terms & Conditions.",
    ],
  },
  {
    title: "7. Weather & Rescheduling",
    points: [
      "In-home sessions may be rescheduled for extreme heat, lightning, heavy rain, or unforeseen circumstances. We will do our best to accommodate your diary.",
    ],
  },
  {
    title: "8. Fees, Travel & Waiting Time",
    points: [
      "Fees are payable in advance, as per our main Terms & Conditions. A travel fee may apply outside the standard service area and will be quoted in advance. If the instructor is kept waiting longer than 15 minutes to start the session, the session time may be shortened or charged accordingly.",
    ],
  },
];
