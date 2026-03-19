/**
 * Congratulations Email Templates
 * These templates use {{course_table}} and {{course_description}} placeholders
 * which are rendered from structured data at send time.
 */

import type { CourseRow } from "@/components/email-templates/CourseTableEditor";
import type { CourseDescription } from "@/components/email-templates/CourseDescriptionEditor";

export interface CongratsTemplate {
  name: string;
  subject: string;
  classType: string | null;
  content: string;
  defaultCourses?: CourseRow[];
  defaultFootnote?: string;
  defaultDescriptions?: CourseDescription[];
}

const CGC_FOOTNOTE = "** Please note, the CGC exercises are highly dependent on the presence of other dogs and handlers, and the full benefit of the course cannot be guaranteed with inadequate enrolments. Therefore, the CGC will only be available should enough handlers be enrolled. Please make payment as payment confirms numbers. Refunds/credits will be made if class does not take place.";

// Shared template body with placeholders
function makeCongratsContent(options: {
  completedText: string;
  nextTitle: string;
  nextIntro: string;
  closingText?: string;
}): string {
  const closing = options.closingText || "Should you wish to enroll, kindly confirm via email and send through your proof of payment.";
  return `<div class="email-content">
  <p>Dear {{handler_name}},</p>
  
  <p>${options.completedText}</p>
  
  {{#if custom_message}}
  <p>{{custom_message}}</p>
  {{/if}}
  
  <div style="background-color: #e8f0fe; padding: 20px; border-radius: 8px; margin: 20px 0;">
    <h3 style="margin: 0 0 12px 0; color: #2c5530;">${options.nextTitle}</h3>
    <p style="margin: 0 0 15px 0;">${options.nextIntro}</p>
    
    {{course_table}}
  </div>
  
  {{course_description}}
  
  <p>${closing}</p>
  
  <p>Looking forward to your response.</p>
  
  {{signature}}
</div>`;
}

// Template 1: Beginner Only (after passing CGC Bronze)
export const BEGINNER_ONLY_TEMPLATE: CongratsTemplate = {
  name: "Congrats on Bronze - Now Beginner Only",
  subject: "Congratulations! Next Step: Beginner Obedience",
  classType: "CGC Bronze",
  content: makeCongratsContent({
    completedText: "Congratulations on completing and passing the McKaynine CGC Bronze course with {{dog_name}}!",
    nextTitle: "What's Next: Beginner Obedience",
    nextIntro: "This qualifies you to join <strong>Beginner Obedience</strong> – please find the relevant information below:",
    closingText: "Should you wish to enroll in this course, kindly confirm via email and send through your proof of payment.",
  }),
  defaultCourses: [{
    name: "Beginner Obedience",
    price: "R1,770.00",
    entry_criteria: "CGC Bronze",
    dates: "January 17th, 24th, 31st\nFebruary 7th, 14th, 21st, 28th\nMarch 7th, 14th (Graduation Day!)",
    day_time: "Saturdays 14H00 – 15H00",
  }],
  defaultDescriptions: [{
    title: "Beginner Obedience",
    items: "Heel on a loose lead, including left, right, and about turns on the move\nSit Stay, recall to the front, return to heel off lead\nRetrieve article off lead\nSit stay off lead – 1 minute\nDown stay off lead – 2 minutes in sight",
  }],
};

// Template 2: Congrats on Beginner - Now Silver or Novice
export const BEGINNER_TO_SILVER_OR_NOVICE_TEMPLATE: CongratsTemplate = {
  name: "Congrats on Beginner - Now Silver or Novice",
  subject: "Congratulations! Next Steps: CGC Silver or Novice Obedience",
  classType: "Beginner",
  content: makeCongratsContent({
    completedText: "Congratulations on completing and passing the McKaynine Beginner Obedience course with {{dog_name}}!",
    nextTitle: "What's Next: CGC Silver or Novice Obedience",
    nextIntro: "This qualifies you to join either <strong>CGC Silver</strong> or <strong>Novice Obedience</strong> – please find the relevant information below:",
    closingText: "Should you wish to enroll in any of these courses, kindly confirm via email and send through your proof of payment.",
  }),
  defaultCourses: [
    { name: "CGC Silver**", price: "R1,680.00", entry_criteria: "CGC Bronze", dates: "January 17th, 24th, 31st\nFebruary 7th, 14th, 21st, 28th\nMarch 7th, 14th (Graduation Day!)", day_time: "Saturdays 14H00 – 15H00" },
    { name: "Novice Obedience", price: "R1,770.00", entry_criteria: "Beginner Obedience", dates: "January 17th, 24th, 31st\nFebruary 7th, 14th, 21st, 28th\nMarch 7th, 14th (Graduation Day!)", day_time: "Saturdays 14H00 – 15H00" },
  ],
  defaultFootnote: CGC_FOOTNOTE,
  defaultDescriptions: [
    {
      title: "CGC Silver",
      items: "Controlled greeting - The object is to demonstrate that the dog will not jump up\nExamination of dog - The object is to demonstrate that the dog will allow inspection of its body by a stranger\nPlay with the dog - The object is to demonstrate that the dog will play with its handler\nRejoin Handler - The object is for the dog to remain steady while the handler leaves\nFood manners - The object is for the dog to have good manners when aware of people's food\nCome away from distractions - The object is for the handler to remain in control of their dog when there are distractions\nRoad Walk - The object is to test the ability of the dog to walk on lead under control\nStay in one place for two minutes\nVehicle control - The object is for the handler to get the dog in and out of a vehicle in a controlled manner\nResponsibility & care - The object is to test the knowledge of the handler on this subject",
    },
    {
      title: "Novice Obedience",
      items: "Heel on a loose lead, including left, right, and about turns on the move\nHeel off lead, including right, left and about turns on the move\nStationary Turns\nChange of pace\nRecall and Finish – Handler leaves the dog in a sit position and takes 20 paces away from the dog\nRetrieve handler's article\nSit Stay – 20 paces away from dog for 1 minute\nDown Stay – 20 paces away from dog for 3 minutes\nSend away – Taught but not for grading but as a precursor to A Test",
    },
  ],
};

// Template 3: Congrats on Bronze - Now Silver or Beginner
export const BRONZE_TO_SILVER_OR_BEGINNER_TEMPLATE: CongratsTemplate = {
  name: "Congrats on Bronze - Now Silver or Beginner",
  subject: "Congratulations! Next Steps: CGC Silver or Beginner Obedience",
  classType: "CGC Bronze",
  content: makeCongratsContent({
    completedText: "Congratulations on completing and passing the McKaynine CGC Bronze course with {{dog_name}}!",
    nextTitle: "What's Next: CGC Silver or Beginner Obedience",
    nextIntro: "This qualifies you to join either <strong>CGC Silver</strong> or <strong>Beginner Obedience</strong> – please find the relevant information below:",
    closingText: "Should you wish to enroll in any of these courses, kindly confirm via email and send through your proof of payment.",
  }),
  defaultCourses: [
    { name: "CGC Silver**", price: "R1,680.00", entry_criteria: "CGC Bronze", dates: "January 17th, 24th, 31st\nFebruary 7th, 14th, 21st, 28th\nMarch 7th, 14th (Graduation Day!)", day_time: "Saturdays 14H00 – 15H00" },
    { name: "Beginner Obedience", price: "R1,770.00", entry_criteria: "CGC Bronze", dates: "January 17th, 24th, 31st\nFebruary 7th, 14th, 21st, 28th\nMarch 7th, 14th (Graduation Day!)", day_time: "Saturdays 14H00 – 15H00" },
  ],
  defaultFootnote: CGC_FOOTNOTE,
  defaultDescriptions: [
    {
      title: "Beginner Obedience",
      items: "Heel on a loose lead, including left, right, and about turns on the move\nSit Stay, recall to the front, return to heel off lead\nRetrieve article off lead\nSit stay off lead – 1 minute\nDown stay off lead – 2 minutes in sight",
    },
    {
      title: "CGC Silver",
      items: "Controlled greeting - The object is to demonstrate that the dog will not jump up\nExamination of dog - The object is to demonstrate that the dog will allow inspection of its body by a stranger\nPlay with the dog - The object is to demonstrate that the dog will play with its handler\nRejoin Handler - The object is for the dog to remain steady while the handler leaves\nFood manners - The object is for the dog to have good manners when aware of people's food\nCome away from distractions - The object is for the handler to remain in control of their dog when there are distractions\nRoad Walk - The object is to test the ability of the dog to walk on lead under control\nStay in one place for two minutes\nVehicle control - The object is for the handler to get the dog in and out of a vehicle in a controlled manner\nResponsibility & care - The object is to test the knowledge of the handler on this subject",
    },
  ],
};

// Template 4: Congrats on EO - Now CGC Only
export const EO_TO_CGC_ONLY_TEMPLATE: CongratsTemplate = {
  name: "Congrats on EO - Now CGC Bronze Only",
  subject: "Congratulations! Next Step: CGC Bronze",
  classType: "EO",
  content: makeCongratsContent({
    completedText: "Congratulations on passing the Elementary Obedience course with {{dog_name}}!",
    nextTitle: "What's Next: CGC Bronze",
    nextIntro: "This qualifies you to join <strong>CGC Bronze</strong> – please find the relevant details below:",
    closingText: "Should you wish to enroll, kindly confirm via email and send through your proof of payment.",
  }),
  defaultCourses: [{
    name: "CGC Bronze**",
    price: "R1,680.00",
    entry_criteria: "Elementary Obedience",
    dates: "January 17th, 24th, 31st\nFebruary 7th, 14th, 21st, 28th\nMarch 7th, 14th (Graduation Day!)",
    day_time: "Saturdays 15H00 – 16H00",
  }],
  defaultFootnote: CGC_FOOTNOTE,
  defaultDescriptions: [{
    title: "CGC (Canine Good Citizenship) Bronze",
    items: "Accepting examination and grooming by a stranger\nCalm down after play\nRelease from lead, play, recall and attach lead\nWalk on loose lead without distraction\nGate manners\nMeet & greet another handler and dog\nWalk on a lead passing people and dogs\nReaction to distractions\nLie down and stay to command - 7 metres\nSupervised isolation",
  }],
};

// Template 5: Congrats on EO - Now CGC or Beginner
export const EO_TO_CGC_OR_BEGINNER_TEMPLATE: CongratsTemplate = {
  name: "Congrats on EO - Now CGC Bronze or Beginner",
  subject: "Congratulations! Next Steps: CGC Bronze or Beginner Obedience",
  classType: "EO",
  content: makeCongratsContent({
    completedText: "Congratulations on passing the Elementary Obedience course with such excellent results with {{dog_name}}!",
    nextTitle: "What's Next: CGC Bronze or Beginner Obedience",
    nextIntro: "This qualifies you to join either <strong>CGC Bronze</strong> or <strong>Beginner Obedience</strong> – please find the relevant details below:",
    closingText: "Should you wish to enroll in any of these courses, kindly confirm via email and send through your proof of payment.",
  }),
  defaultCourses: [
    { name: "CGC Bronze**", price: "R1,680.00", entry_criteria: "Elementary Obedience", dates: "January 17th, 24th, 31st\nFebruary 7th, 14th, 21st, 28th\nMarch 7th, 14th (Graduation Day!)", day_time: "Saturdays 15H00 – 16H00" },
    { name: "Beginner Obedience", price: "R1,770.00", entry_criteria: "Elementary Obedience", dates: "January 17th, 24th, 31st\nFebruary 7th, 14th, 21st, 28th\nMarch 7th, 14th (Graduation Day!)", day_time: "Saturdays 14H00 – 15H00" },
  ],
  defaultFootnote: CGC_FOOTNOTE,
  defaultDescriptions: [
    {
      title: "CGC (Canine Good Citizenship) Bronze",
      items: "Accepting examination and grooming by a stranger\nCalm down after play\nRelease from lead, play, recall and attach lead\nWalk on loose lead without distraction\nGate manners\nMeet & greet another handler and dog\nWalk on a lead passing people and dogs\nReaction to distractions\nLie down and stay to command - 7 metres\nSupervised isolation",
    },
    {
      title: "Beginner Obedience",
      items: "Heel on a loose lead, including left, right, and about turns on the move\nSit Stay, recall to the front, return to heel off lead\nRetrieve article off lead\nSit stay off lead – 1 minute\nDown stay off lead – 2 minutes in sight",
    },
  ],
};

// Template 6: Novice Only (after Beginner)
export const NOVICE_ONLY_TEMPLATE: CongratsTemplate = {
  name: "Congrats on Beginner - Now Novice Only",
  subject: "Congratulations! Next Step: Novice Obedience",
  classType: "Beginner",
  content: makeCongratsContent({
    completedText: "Congratulations on completing and passing the McKaynine Beginner Obedience course with {{dog_name}}!",
    nextTitle: "What's Next: Novice Obedience",
    nextIntro: "This qualifies you to join <strong>Novice Obedience</strong> – please find the relevant information below:",
    closingText: "Should you wish to enroll in this course, kindly confirm via email and send through your proof of payment.",
  }),
  defaultCourses: [{
    name: "Novice Obedience",
    price: "R1,770.00",
    entry_criteria: "Beginner Obedience",
    dates: "January 17th, 24th, 31st\nFebruary 7th, 14th, 21st, 28th\nMarch 7th, 14th (Graduation Day!)",
    day_time: "Saturdays 14H00 – 15H00",
  }],
  defaultDescriptions: [{
    title: "Novice Obedience",
    items: "Heel on a loose lead, including left, right, and about turns on the move\nHeel off lead, including right, left and about turns on the move\nStationary Turns\nChange of pace\nRecall and Finish – Handler leaves the dog in a sit position and takes 20 paces away from the dog. On command the dog recalls to the handler and sits in front of the handler. On command the dog returns to the heel position\nRetrieve handler's article\nSit Stay – 20 paces away from dog for 1 minute\nDown Stay – 20 paces away from dog for 3 minutes\nSend away – Taught but not for grading but as a precursor to A Test",
  }],
};

// Template 7: Silver CGC Only
export const SILVER_CGC_ONLY_TEMPLATE: CongratsTemplate = {
  name: "Silver CGC Info",
  subject: "CGC Silver Course Information",
  classType: "CGC Bronze",
  content: makeCongratsContent({
    completedText: "Looking forward to having you and {{dog_name}} join our Silver CGC course – please find the relevant details below:",
    nextTitle: "CGC Silver Course Details",
    nextIntro: "",
    closingText: "Should you wish to enroll in this course, kindly confirm via email and send through your proof of payment.",
  }),
  defaultCourses: [{
    name: "CGC Silver**",
    price: "R1,680.00",
    entry_criteria: "CGC Bronze",
    dates: "January 17th, 24th, 31st\nFebruary 7th, 14th, 21st, 28th\nMarch 7th, 14th (Graduation Day!)",
    day_time: "Saturdays 14H00 – 15H00",
  }],
  defaultFootnote: CGC_FOOTNOTE,
  defaultDescriptions: [{
    title: "CGC Silver",
    items: "Controlled greeting - The object is to demonstrate that the dog will not jump up\nExamination of dog - The object is to demonstrate that the dog will allow inspection of its body by a stranger as might be undertaken by a veterinary surgeon\nPlay with the dog - The object is to demonstrate that the dog will play with its handler\nRejoin Handler - The object is for the dog to remain steady while the handler leaves\nFood manners - The object is for the dog to have good manners when aware of people's food\nCome away from distractions - The object is for the handler to remain in control of their dog when there are distractions\nRoad Walk - The object is to test the ability of the dog to walk on lead under control\nStay in one place for two minutes - The object is that the dog will stay on the spot while the handler moves away for two minutes\nVehicle control - The object is for the handler to get the dog in and out of a vehicle in a controlled manner\nResponsibility & care - The object is to test the knowledge of the handler on this subject",
  }],
};

// Template 8: Working Trials / A-Test (no table, uses simple layout)
export const WT_A_TEST_TEMPLATE: CongratsTemplate = {
  name: "Working Trials / A-Test Info",
  subject: "Working Trials / A-Test / Scent - New Term Details",
  classType: "WT",
  content: `<div class="email-content">
  <p>Dear {{handler_name}},</p>
  
  <p>Hope this email finds you and {{dog_name}} well.</p>
  
  {{#if custom_message}}
  <p>{{custom_message}}</p>
  {{/if}}
  
  <div style="background-color: #e8f0fe; padding: 20px; border-radius: 8px; margin: 20px 0;">
    <h3 style="margin: 0 0 12px 0; color: #2c5530;">Working Trials / A-Test / Scent - New Term Details</h3>
    
    {{course_table}}
    
    <p style="font-size: 13px; color: #2c5530; margin-top: 10px;">(Please note that your course price remains the same as last year 😊)</p>
  </div>
  
  <p>We look forward to having you join us again for another fun-filled year of instruction under Steve.</p>
  
  <p>Looking forward to receiving your proof of payment and to seeing you soon.</p>
  
  {{signature}}
</div>`,
  defaultCourses: [{
    name: "Working Trials / A-Test / Scent",
    price: "R2,160.00",
    entry_criteria: "Novice Obedience / Invitation",
    dates: "January 17th, 24th, 31st\nFebruary 7th, 14th, 21st, 28th\nMarch 7th, 14th (Graduation Day!)",
    day_time: "Saturdays 15H00 – 16H00",
  }],
};

// Export all templates
export const CONGRATS_TEMPLATES: CongratsTemplate[] = [
  BEGINNER_ONLY_TEMPLATE,
  BEGINNER_TO_SILVER_OR_NOVICE_TEMPLATE,
  BRONZE_TO_SILVER_OR_BEGINNER_TEMPLATE,
  EO_TO_CGC_ONLY_TEMPLATE,
  EO_TO_CGC_OR_BEGINNER_TEMPLATE,
  NOVICE_ONLY_TEMPLATE,
  SILVER_CGC_ONLY_TEMPLATE,
  WT_A_TEST_TEMPLATE,
];

// Helper to get template by name
export function getCongratsTemplate(name: string): CongratsTemplate | undefined {
  return CONGRATS_TEMPLATES.find(t => t.name === name);
}
