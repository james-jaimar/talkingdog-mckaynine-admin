import { ExtractedData, ExtractedDog, ExtractedOwner } from "@/components/intake-scans/types";

type RawAnswers = Record<string, string | number | boolean | null | string[]>;

export interface GoogleFormPayload {
  source: string;
  submittedAt?: string | null;
  answers: RawAnswers;
}

// Mirror of FIELD_ALIASES in the edge function. Keep in sync with Shannon's form.
const FIELD_ALIASES: Record<string, string[]> = {
  ownerName: ["your name and surname", "owner name", "your name", "full name", "name", "handler name", "parent name"],
  accountHolderName: [
    "name of person responsible for account (if different to above)",
    "name of person responsible for account",
    "account holder name", "account holder", "billing name",
  ],
  email: ["email", "email address", "your email", "e-mail"],
  phone: ["your cell number", "phone", "phone number", "cell", "cellphone", "mobile", "contact number"],
  occupation: ["occupation (optional)", "occupation", "job", "profession"],
  vetName: [
    "what is the name/location of your vet",
    "what is the name or location of your vet",
    "vet name", "vet", "veterinarian", "vet practice", "veterinary practice",
  ],
  dogName: ["your dog's name", "dog name", "puppy name", "dog's name", "puppy's name"],
  birthDate: ["what is your dog's date of birth", "date of birth", "dog date of birth", "puppy date of birth", "dob", "birthday"],
  gender: ["is your dog a he-dog or a she-dog", "gender", "dog gender", "sex"],
  spayNeuterStatus: [
    "what's the scoop on your dog's repro status",
    "whats the scoop on your dog's repro status",
    "spayed/neutered", "spayed or neutered", "spay/neuter status", "sterilised", "sterilized",
  ],
  breed: [
    "what's your dog's breed? are they a purebred or a wonderful mix of various breeds",
    "what's your dog's breed", "breed", "dog breed", "puppy breed",
  ],
  acquiredFrom: [
    "it's useful to us to know the origin story of your dog. how did you and fido cross paths",
    "how did you and fido cross paths",
    "acquired from", "where did you get your dog", "where did you get your puppy", "source",
  ],
  acquiredFromOther: ["acquired from other", "if other, where"],
  ageAtAcquisition: [
    "how old was your pup/dog when they came to you",
    "age at acquisition", "age when you got your dog", "age when you got your puppy",
  ],
  otherPets: ["does your dog have any animal buddies at home", "other pets", "any other pets"],
  childrenAtHome: [
    "are there any young 'uns running around with your dog at home",
    "are there any young uns running around with your dog at home",
    "children at home", "kids at home", "do you have children",
  ],
  socialBehaviorDetails: [
    "if you chose \"not a fan\" please give us a little more detail so that we can make sure your dog is a happy camper...",
    "if you chose not a fan please give us a little more detail so that we can make sure your dog is a happy camper",
    "if you chose not a fan please give us a little more detail",
    "social behaviour details", "social behavior details", "behaviour details",
  ],
  trainingGoal: [
    "what's the grand plan for your dog with these training classes",
    "whats the grand plan for your dog with these training classes",
    "training goal", "what do you want to achieve", "goal",
  ],
  hasBehaviorProblems: [
    "does your dog have any behavior problems we should know about before we dive into training",
    "does your dog have any behaviour problems we should know about before we dive into training",
    "any behaviour problems", "any behavior problems", "behaviour problems",
  ],
  behaviorProblemsDetails: [
    "if you answered \"yep\" on the previous question, what's the scoop? understanding their behavior better will help us tailor our training approach. if you answered \"nope\" skip right ahead...",
    "if you answered yep on the previous question, what's the scoop",
    "behaviour problems details", "behavior problems details", "describe behaviour problems",
  ],
  healthProblemsDetails: [
    "to make sure your dog loves their training with us, tell us this... are there any health issues we need to be aware of",
    "are there any health issues we need to be aware of",
    "any health problems", "health problems", "health problems details",
  ],
  classType: ["which course are you enrolling your dog for", "class type", "which class", "course", "class"],
  heardFrom: [
    "where did you hear about our classes? (tick any that apply)",
    "where did you hear about our classes", "heard from", "how did you hear about us",
  ],
  whatsappPermission: [
    "do you give us permission to add your name and number to a whatsapp class group? (this group is used purely for urgent notifications iro classes. once you have completed your training with us your details are removed)",
    "do you give us permission to add your name and number to a whatsapp class group",
    "whatsapp permission", "whatsapp",
  ],
  photoPermission: [
    "do you give us permission to post graduation or class photographs of you, your dog and any minors in your care at the time on our social media",
    "photo permission", "photos",
  ],
  signatureName: ["signature name", "signed by", "signature"],
  signatureDate: ["signature date", "date signed"],
};

const ACK_ROW_TO_FIELD: Array<[RegExp, keyof ExtractedDog["acknowledgements"]]> = [
  [/onlead\s+socialis/i, "onlead_socializing"],
  [/training\s+equipment\s+without\s+instructor/i, "equipment_supervision"],
  [/correct\s+training\s+equipment/i, "training_equipment"],
  [/training\s+treats/i, "treats"],
  [/waste\s+disposal/i, "waste_disposal"],
];

const normalize = (s: string) =>
  s.trim().toLowerCase().replace(/\s+/g, " ").replace(/[?:]/g, "");

function getAnswer(answers: RawAnswers, field: string): any {
  const aliases = FIELD_ALIASES[field] || [];
  const idx: Record<string, any> = {};
  for (const [k, v] of Object.entries(answers)) idx[normalize(k)] = v;
  for (const a of aliases) {
    const v = idx[normalize(a)];
    if (v !== undefined && v !== null && v !== "") return v;
  }
  return undefined;
}

const asString = (v: any): string => {
  if (v === undefined || v === null) return "";
  if (Array.isArray(v)) return v.join(", ");
  return String(v);
};
const asArray = (v: any): string[] => {
  if (v === undefined || v === null || v === "") return [];
  if (Array.isArray(v)) return v.map(String);
  return String(v).split(/,\s*/).filter(Boolean);
};
const asPermission = (v: any): string => {
  const s = asString(v).toLowerCase().trim();
  if (!s) return "unsure";
  if (s.startsWith("y")) return "yes";
  if (s.startsWith("n")) return "no";
  return "unsure";
};

function mapGender(v: any): string {
  const s = asString(v).toLowerCase().trim();
  if (!s) return "";
  if (s.includes("she")) return "Female";
  if (s.includes("he")) return "Male";
  if (s === "male" || s === "female") return s[0].toUpperCase() + s.slice(1);
  return "";
}
function mapSpayNeuter(v: any): string {
  const s = asString(v).toLowerCase();
  if (!s) return "";
  if (s.includes("too young") || s.includes("intend") || s.includes("when old enough")) return "When old enough";
  if (s.includes("already") || s.includes("done") || s.includes("spayed") || s.includes("neutered")) return "Already done";
  if (s.includes("not planning") || s.includes("no plan") || s.includes("won't")) return "Not planning to";
  return "";
}
function mapAcquiredFrom(v: any): string {
  const s = asString(v).toLowerCase();
  if (!s) return "";
  if (s.includes("kusa")) return "KUSA breeder";
  if (s.includes("breeder")) return "Breeder";
  if (s.includes("spca") || s.includes("aacl")) return "SPCA/AACL";
  if (s.includes("rescue")) return "Rescue org";
  if (s.includes("family") || s.includes("friend")) return "Family/friends";
  if (s.includes("advert")) return "Advert";
  if (s.includes("born")) return "Born in home";
  if (s.includes("stray")) return "Stray";
  return "Other";
}
function mapAgeAtAcquisition(v: any): string {
  const s = asString(v).toLowerCase();
  if (!s) return "";
  if (s.includes("less than 2")) return "Less than 2 months";
  if (s.includes("2") && s.includes("4")) return "2-4 months";
  if (s.includes("4") && (s.includes("12") || s.includes("year"))) return "4-12 months";
  if (s.includes("older than")) return "Older than 1 year";
  return "";
}
function mapOtherPets(v: any): Array<{ type: string; count: number }> {
  const arr = asArray(v).map((x) => x.toLowerCase());
  const out: Array<{ type: string; count: number }> = [];
  if (arr.some((x) => x.includes("dog"))) out.push({ type: "dogs", count: 1 });
  if (arr.some((x) => x.includes("cat"))) out.push({ type: "cats", count: 1 });
  if (arr.some((x) => x.includes("bird"))) out.push({ type: "birds", count: 1 });
  if (arr.some((x) => x.includes("livestock"))) out.push({ type: "livestock", count: 1 });
  return out;
}
function mapChildrenAtHome(v: any): string {
  const s = asString(v).toLowerCase();
  if (!s) return "";
  if (s.includes("nope") || s.includes("none")) return "None";
  if (s.includes("teen")) return "Teenagers";
  if (s.includes("less than 2") || s.includes("baby") || s.includes("toddler")) return "Babies/toddlers";
  if (s.includes("child")) return "Children";
  return "";
}
function mapHeardFrom(v: any): string[] {
  const arr = asArray(v).map((x) => x.toLowerCase());
  const has = (kw: string) => arr.some((x) => x.includes(kw));
  const out: string[] = [];
  if (has("google") || has("search")) out.push("google");
  if (has("vet")) out.push("vet");
  if (has("friend") || has("family")) out.push("friends");
  if (has("breeder") || has("rescue")) out.push("breeder");
  if (has("previous") || has("been before")) out.push("beenBefore");
  if (has("social") || has("facebook") || has("instagram")) out.push("socialMedia");
  return out;
}
function mapTrainingGoal(v: any): string {
  const s = asString(v).toLowerCase().trim();
  const n = parseInt(s, 10);
  if (!isNaN(n)) return n <= 2 ? "Competitive dog sport" : "Chilled canine companion";
  if (s.includes("competitive") || s.includes("sport")) return "Competitive dog sport";
  return "Chilled canine companion";
}
function mapBehaviorYepNope(v: any): boolean {
  const s = asString(v).toLowerCase().trim();
  return s.startsWith("y");
}
function mapHealthText(v: any): { has: boolean; details: string } {
  const raw = asString(v).trim();
  if (!raw) return { has: false, details: "" };
  const lower = raw.toLowerCase();
  if (["no", "nope", "none", "n/a", "na", "no health issues", "nothing", "no problems"].includes(lower))
    return { has: false, details: "" };
  return { has: true, details: raw };
}
function mapClassType(v: any): { type: string; other: string } {
  const s = asString(v).toLowerCase();
  if (!s) return { type: "Puppy", other: "" };
  if (s.includes("puppy")) return { type: "Puppy", other: "" };
  if (s.includes("elementary")) return { type: "Elementary", other: "" };
  if (s.includes("bronze")) return { type: "CGC Bronze", other: "" };
  if (s.includes("obedience")) return { type: "Obedience", other: "" };
  if (s.includes("yoga")) return { type: "Other", other: "K9 Yoga" };
  return { type: "Other", other: asString(v) };
}
function extractSocialGrid(answers: RawAnswers) {
  const mapVal = (raw: any): string => {
    const s = asString(raw).toLowerCase();
    if (s.includes("cool") || s.includes("cucumber") || s.includes("great")) return "Great";
    if (s.includes("mostly") || s.includes("ok")) return "OK";
    if (s.includes("not a fan") || s.includes("not good")) return "Not good";
    return "";
  };
  const findRow = (label: RegExp): any => {
    for (const [k, v] of Object.entries(answers)) if (label.test(k)) return v;
    return undefined;
  };
  return {
    dogs: mapVal(findRow(/get along.*\[\s*dogs\s*\]|^dogs\b|\bdogs\s*$/i)),
    animals: mapVal(findRow(/\banimals\b/i)),
    people: mapVal(findRow(/\bpeople\b/i)),
    sights: mapVal(findRow(/sights/i)),
  };
}
function extractAcknowledgements(answers: RawAnswers): ExtractedDog["acknowledgements"] {
  const out: ExtractedDog["acknowledgements"] = {
    training_equipment: false,
    treats: false,
    waste_disposal: false,
    onlead_socializing: false,
    equipment_supervision: false,
  };
  for (const [k, v] of Object.entries(answers)) {
    if (!asString(v).trim()) continue;
    for (const [rx, field] of ACK_ROW_TO_FIELD) if (rx.test(k)) { out[field] = true; break; }
  }
  return out;
}

function normalizeBirthDate(v: string): string {
  if (!v) return "";
  if (/^\d{4}-\d{2}-\d{2}/.test(v)) return v.slice(0, 10);
  if (/^(\d{2})\/(\d{2})\/(\d{4})$/.test(v)) return v.replace(/^(\d{2})\/(\d{2})\/(\d{4})$/, "$3-$2-$1");
  return "";
}

function titleCase(s: string): string {
  return s ? s[0].toUpperCase() + s.slice(1).toLowerCase() : s;
}

export function googleFormPayloadToExtractedData(payload: GoogleFormPayload): ExtractedData {
  const { source, answers, submittedAt } = payload;
  const ownerNameRaw = asString(getAnswer(answers, "ownerName"));
  const firstName = ownerNameRaw.split(" ")[0] || ownerNameRaw;
  const lastName = ownerNameRaw.split(" ").slice(1).join(" ") || "";

  const owner: ExtractedOwner = {
    first_name: firstName,
    last_name: lastName,
    account_holder_name: asString(getAnswer(answers, "accountHolderName")),
    email: asString(getAnswer(answers, "email")).toLowerCase().trim(),
    phone: asString(getAnswer(answers, "phone")),
    occupation: asString(getAnswer(answers, "occupation")),
    vet_name: asString(getAnswer(answers, "vetName")),
  };

  const social = extractSocialGrid(answers);
  const socialDetailsRaw = asString(getAnswer(answers, "socialBehaviorDetails"));
  const socialDetails = social.sights
    ? `${socialDetailsRaw}${socialDetailsRaw ? " | " : ""}Sights and sounds: ${social.sights}`.trim()
    : socialDetailsRaw;

  const health = mapHealthText(getAnswer(answers, "healthProblemsDetails"));
  const classInfo = mapClassType(getAnswer(answers, "classType"));

  const dog: ExtractedDog = {
    name: asString(getAnswer(answers, "dogName")),
    date_of_birth: normalizeBirthDate(asString(getAnswer(answers, "birthDate"))),
    gender: mapGender(getAnswer(answers, "gender")),
    breed: asString(getAnswer(answers, "breed")),
    spay_neuter_status: mapSpayNeuter(getAnswer(answers, "spayNeuterStatus")),
    acquired_from: mapAcquiredFrom(getAnswer(answers, "acquiredFrom")),
    acquired_from_other: asString(getAnswer(answers, "acquiredFromOther")),
    age_at_acquisition: mapAgeAtAcquisition(getAnswer(answers, "ageAtAcquisition")),
    other_pets: mapOtherPets(getAnswer(answers, "otherPets")),
    children_at_home: mapChildrenAtHome(getAnswer(answers, "childrenAtHome")),
    social_behavior: {
      with_dogs: social.dogs,
      with_other_animals: social.animals,
      with_people: social.people,
      details: socialDetails,
    },
    training_goal: mapTrainingGoal(getAnswer(answers, "trainingGoal")),
    has_behavior_problems: mapBehaviorYepNope(getAnswer(answers, "hasBehaviorProblems")),
    behavior_problems_details: asString(getAnswer(answers, "behaviorProblemsDetails")),
    has_health_problems: health.has,
    health_problems_details: health.details,
    class_type: classInfo.type,
    class_type_other: classInfo.other,
    branch_name: titleCase(source || ""),
    heard_from: mapHeardFrom(getAnswer(answers, "heardFrom")),
    whatsapp_permission: asPermission(getAnswer(answers, "whatsappPermission")),
    photo_permission: asPermission(getAnswer(answers, "photoPermission")),
    acknowledgements: extractAcknowledgements(answers),
    signature_name: asString(getAnswer(answers, "signatureName")) || ownerNameRaw,
    signature_date:
      asString(getAnswer(answers, "signatureDate")) ||
      (submittedAt ? submittedAt.slice(0, 10) : new Date().toISOString().slice(0, 10)),
  };

  return {
    owner,
    dogs: [dog],
    field_confidence: {},
    notes_for_review: [],
  };
}
