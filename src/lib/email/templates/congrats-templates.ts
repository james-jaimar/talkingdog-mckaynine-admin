/**
 * Congratulations Email Templates
 * These templates are used when handlers complete a class and are being invited to the next class
 * 
 * Template Structure:
 * - Congratulations message
 * - Personal note (optional - uses {{custom_message}})
 * - What's Next section with course options
 * - Course description(s)
 * - Payment/booking information
 */

export interface CongratsTemplate {
  name: string;
  subject: string;
  classType: string | null; // The class they just completed
  content: string;
}

// Template 1: Beginner Only (after passing CGC Bronze, qualified for Beginner only)
export const BEGINNER_ONLY_TEMPLATE: CongratsTemplate = {
  name: "Congrats on Bronze - Now Beginner Only",
  subject: "Congratulations! Next Step: Beginner Obedience",
  classType: "CGC Bronze",
  content: `<div class="email-content">
  <p>Dear {{handler_name}},</p>
  
  <p>Congratulations on completing and passing the McKaynine CGC Bronze course with {{dog_name}}!</p>
  
  {{#if custom_message}}
  <p>{{custom_message}}</p>
  {{/if}}
  
  <div style="background-color: #e8f0fe; padding: 20px; border-radius: 8px; margin: 20px 0;">
    <h3 style="margin: 0 0 12px 0; color: #2c5530;">What's Next: Beginner Obedience</h3>
    <p style="margin: 0 0 15px 0;">This qualifies you to join <strong>Beginner Obedience</strong> – please find the relevant information below:</p>
    
    <table style="width: 100%; border-collapse: collapse; margin: 15px 0; font-size: 14px;">
      <tr style="background-color: #3b7dc4; color: white;">
        <th style="padding: 10px; text-align: left; border: 1px solid #ddd;">Course</th>
        <th style="padding: 10px; text-align: left; border: 1px solid #ddd;">Price</th>
        <th style="padding: 10px; text-align: left; border: 1px solid #ddd;">Entry Criteria</th>
        <th style="padding: 10px; text-align: left; border: 1px solid #ddd;">Dates</th>
        <th style="padding: 10px; text-align: left; border: 1px solid #ddd;">Day & Time</th>
      </tr>
      <tr style="background-color: #f9f9f9;">
        <td style="padding: 10px; border: 1px solid #ddd;"><strong>Beginner Obedience</strong></td>
        <td style="padding: 10px; border: 1px solid #ddd;">R1,770.00</td>
        <td style="padding: 10px; border: 1px solid #ddd;">CGC Bronze</td>
        <td style="padding: 10px; border: 1px solid #ddd;">January 17th, 24th, 31st<br>February 7th, 14th, 21st, 28th<br>March 7th, 14th (Graduation Day!)</td>
        <td style="padding: 10px; border: 1px solid #ddd;">Saturdays 14H00 – 15H00</td>
      </tr>
    </table>
  </div>
  
  <div style="margin: 20px 0;">
    <h4 style="color: #2c5530; margin-bottom: 10px;">Course Description - Beginner Obedience:</h4>
    <ul style="margin: 0; padding-left: 20px; color: #444;">
      <li>Heel on a loose lead, including left, right, and about turns on the move</li>
      <li>Sit Stay, recall to the front, return to heel off lead</li>
      <li>Retrieve article off lead</li>
      <li>Sit stay off lead – 1 minute</li>
      <li>Down stay off lead – 2 minutes in sight</li>
    </ul>
  </div>
  
  <p>Should you wish to enroll in this course, kindly confirm via email and send through your proof of payment.</p>
  
  <p>Looking forward to your response.</p>
  
  <p>Kind regards,<br>Ady</p>
</div>`
};

// Template 2: Congrats on Beginner - Now Silver or Novice
export const BEGINNER_TO_SILVER_OR_NOVICE_TEMPLATE: CongratsTemplate = {
  name: "Congrats on Beginner - Now Silver or Novice",
  subject: "Congratulations! Next Steps: CGC Silver or Novice Obedience",
  classType: "Beginner",
  content: `<div class="email-content">
  <p>Dear {{handler_name}},</p>
  
  <p>Congratulations on completing and passing the McKaynine Beginner Obedience course with {{dog_name}}!</p>
  
  {{#if custom_message}}
  <p>{{custom_message}}</p>
  {{/if}}
  
  <div style="background-color: #e8f0fe; padding: 20px; border-radius: 8px; margin: 20px 0;">
    <h3 style="margin: 0 0 12px 0; color: #2c5530;">What's Next: CGC Silver or Novice Obedience</h3>
    <p style="margin: 0 0 15px 0;">This qualifies you to join either <strong>CGC Silver</strong> or <strong>Novice Obedience</strong> – please find the relevant information below:</p>
    
    <table style="width: 100%; border-collapse: collapse; margin: 15px 0; font-size: 14px;">
      <tr style="background-color: #3b7dc4; color: white;">
        <th style="padding: 10px; text-align: left; border: 1px solid #ddd;">Course</th>
        <th style="padding: 10px; text-align: left; border: 1px solid #ddd;">Price</th>
        <th style="padding: 10px; text-align: left; border: 1px solid #ddd;">Entry Criteria</th>
        <th style="padding: 10px; text-align: left; border: 1px solid #ddd;">Dates</th>
        <th style="padding: 10px; text-align: left; border: 1px solid #ddd;">Day & Time</th>
      </tr>
      <tr style="background-color: #f9f9f9;">
        <td style="padding: 10px; border: 1px solid #ddd;"><strong>CGC Silver**</strong></td>
        <td style="padding: 10px; border: 1px solid #ddd;">R1,680.00</td>
        <td style="padding: 10px; border: 1px solid #ddd;">CGC Bronze</td>
        <td style="padding: 10px; border: 1px solid #ddd;">January 17th, 24th, 31st<br>February 7th, 14th, 21st, 28th<br>March 7th, 14th (Graduation Day!)</td>
        <td style="padding: 10px; border: 1px solid #ddd;">Saturdays 14H00 – 15H00</td>
      </tr>
      <tr>
        <td style="padding: 10px; border: 1px solid #ddd;"><strong>Novice Obedience</strong></td>
        <td style="padding: 10px; border: 1px solid #ddd;">R1,770.00</td>
        <td style="padding: 10px; border: 1px solid #ddd;">Beginner Obedience</td>
        <td style="padding: 10px; border: 1px solid #ddd;">January 17th, 24th, 31st<br>February 7th, 14th, 21st, 28th<br>March 7th, 14th (Graduation Day!)</td>
        <td style="padding: 10px; border: 1px solid #ddd;">Saturdays 14H00 – 15H00</td>
      </tr>
    </table>
    
    <p style="font-size: 12px; color: #666; margin-top: 10px; font-style: italic;">** Please note, the CGC exercises are highly dependent on the presence of other dogs and handlers, and the full benefit of the course cannot be guaranteed with inadequate enrolments. Therefore, the CGC will only be available should enough handlers be enrolled. Please make payment as payment confirms numbers. Refunds/credits will be made if class does not take place.</p>
  </div>
  
  <div style="margin: 20px 0;">
    <h4 style="color: #2c5530; margin-bottom: 10px;">Course Description - CGC Silver:</h4>
    <ul style="margin: 0 0 15px 0; padding-left: 20px; color: #444;">
      <li>Controlled greeting - The object is to demonstrate that the dog will not jump up</li>
      <li>Examination of dog - The object is to demonstrate that the dog will allow inspection of its body by a stranger</li>
      <li>Play with the dog - The object is to demonstrate that the dog will play with its handler</li>
      <li>Rejoin Handler - The object is for the dog to remain steady while the handler leaves</li>
      <li>Food manners - The object is for the dog to have good manners when aware of people's food</li>
      <li>Come away from distractions - The object is for the handler to remain in control of their dog when there are distractions</li>
      <li>Road Walk - The object is to test the ability of the dog to walk on lead under control</li>
      <li>Stay in one place for two minutes</li>
      <li>Vehicle control - The object is for the handler to get the dog in and out of a vehicle in a controlled manner</li>
      <li>Responsibility & care - The object is to test the knowledge of the handler on this subject</li>
    </ul>
    
    <h4 style="color: #2c5530; margin-bottom: 10px;">Course Description - Novice Obedience:</h4>
    <ul style="margin: 0; padding-left: 20px; color: #444;">
      <li>Heel on a loose lead, including left, right, and about turns on the move</li>
      <li>Heel off lead, including right, left and about turns on the move</li>
      <li>Stationary Turns</li>
      <li>Change of pace</li>
      <li>Recall and Finish – Handler leaves the dog in a sit position and takes 20 paces away from the dog</li>
      <li>Retrieve handler's article</li>
      <li>Sit Stay – 20 paces away from dog for 1 minute</li>
      <li>Down Stay – 20 paces away from dog for 3 minutes</li>
      <li>Send away – Taught but not for grading but as a precursor to A Test</li>
    </ul>
  </div>
  
  <p>Should you wish to enroll in any of these courses, kindly confirm via email and send through your proof of payment.</p>
  
  <p>Looking forward to your response.</p>
  
  <p>Kind regards,<br>Ady</p>
</div>`
};

// Template 3: Congrats on Bronze - Now Silver or Beginner
export const BRONZE_TO_SILVER_OR_BEGINNER_TEMPLATE: CongratsTemplate = {
  name: "Congrats on Bronze - Now Silver or Beginner",
  subject: "Congratulations! Next Steps: CGC Silver or Beginner Obedience",
  classType: "CGC Bronze",
  content: `<div class="email-content">
  <p>Dear {{handler_name}},</p>
  
  <p>Congratulations on completing and passing the McKaynine CGC Bronze course with {{dog_name}}!</p>
  
  {{#if custom_message}}
  <p>{{custom_message}}</p>
  {{/if}}
  
  <div style="background-color: #e8f0fe; padding: 20px; border-radius: 8px; margin: 20px 0;">
    <h3 style="margin: 0 0 12px 0; color: #2c5530;">What's Next: CGC Silver or Beginner Obedience</h3>
    <p style="margin: 0 0 15px 0;">This qualifies you to join either <strong>CGC Silver</strong> or <strong>Beginner Obedience</strong> – please find the relevant information below:</p>
    
    <table style="width: 100%; border-collapse: collapse; margin: 15px 0; font-size: 14px;">
      <tr style="background-color: #3b7dc4; color: white;">
        <th style="padding: 10px; text-align: left; border: 1px solid #ddd;">Course</th>
        <th style="padding: 10px; text-align: left; border: 1px solid #ddd;">Price</th>
        <th style="padding: 10px; text-align: left; border: 1px solid #ddd;">Entry Criteria</th>
        <th style="padding: 10px; text-align: left; border: 1px solid #ddd;">Dates</th>
        <th style="padding: 10px; text-align: left; border: 1px solid #ddd;">Day & Time</th>
      </tr>
      <tr style="background-color: #f9f9f9;">
        <td style="padding: 10px; border: 1px solid #ddd;"><strong>CGC Silver**</strong></td>
        <td style="padding: 10px; border: 1px solid #ddd;">R1,680.00</td>
        <td style="padding: 10px; border: 1px solid #ddd;">CGC Bronze</td>
        <td style="padding: 10px; border: 1px solid #ddd;">January 17th, 24th, 31st<br>February 7th, 14th, 21st, 28th<br>March 7th, 14th (Graduation Day!)</td>
        <td style="padding: 10px; border: 1px solid #ddd;">Saturdays 14H00 – 15H00</td>
      </tr>
      <tr>
        <td style="padding: 10px; border: 1px solid #ddd;"><strong>Beginner Obedience</strong></td>
        <td style="padding: 10px; border: 1px solid #ddd;">R1,770.00</td>
        <td style="padding: 10px; border: 1px solid #ddd;">CGC Bronze</td>
        <td style="padding: 10px; border: 1px solid #ddd;">January 17th, 24th, 31st<br>February 7th, 14th, 21st, 28th<br>March 7th, 14th (Graduation Day!)</td>
        <td style="padding: 10px; border: 1px solid #ddd;">Saturdays 14H00 – 15H00</td>
      </tr>
    </table>
    
    <p style="font-size: 12px; color: #666; margin-top: 10px; font-style: italic;">** Please note, the CGC exercises are highly dependent on the presence of other dogs and handlers, and the full benefit of the course cannot be guaranteed with inadequate enrolments. Therefore, the CGC will only be available should enough handlers be enrolled. Please make payment as payment confirms numbers. Refunds/credits will be made if class does not take place.</p>
  </div>
  
  <div style="margin: 20px 0;">
    <h4 style="color: #2c5530; margin-bottom: 10px;">Course Description - Beginner Obedience:</h4>
    <ul style="margin: 0 0 15px 0; padding-left: 20px; color: #444;">
      <li>Heel on a loose lead, including left, right, and about turns on the move</li>
      <li>Sit Stay, recall to the front, return to heel off lead</li>
      <li>Retrieve article off lead</li>
      <li>Sit stay off lead – 1 minute</li>
      <li>Down stay off lead – 2 minutes in sight</li>
    </ul>
    
    <h4 style="color: #2c5530; margin-bottom: 10px;">Course Description - CGC Silver:</h4>
    <ul style="margin: 0; padding-left: 20px; color: #444;">
      <li>Controlled greeting - The object is to demonstrate that the dog will not jump up</li>
      <li>Examination of dog - The object is to demonstrate that the dog will allow inspection of its body by a stranger</li>
      <li>Play with the dog - The object is to demonstrate that the dog will play with its handler</li>
      <li>Rejoin Handler - The object is for the dog to remain steady while the handler leaves</li>
      <li>Food manners - The object is for the dog to have good manners when aware of people's food</li>
      <li>Come away from distractions - The object is for the handler to remain in control of their dog when there are distractions</li>
      <li>Road Walk - The object is to test the ability of the dog to walk on lead under control</li>
      <li>Stay in one place for two minutes</li>
      <li>Vehicle control - The object is for the handler to get the dog in and out of a vehicle in a controlled manner</li>
      <li>Responsibility & care - The object is to test the knowledge of the handler on this subject</li>
    </ul>
  </div>
  
  <p>Should you wish to enroll in any of these courses, kindly confirm via email and send through your proof of payment.</p>
  
  <p>Looking forward to your response.</p>
  
  <p>Kind regards,<br>Ady</p>
</div>`
};

// Template 4: Congrats on EO - Now CGC Only
export const EO_TO_CGC_ONLY_TEMPLATE: CongratsTemplate = {
  name: "Congrats on EO - Now CGC Bronze Only",
  subject: "Congratulations! Next Step: CGC Bronze",
  classType: "EO",
  content: `<div class="email-content">
  <p>Dear {{handler_name}},</p>
  
  <p>Congratulations on passing the Elementary Obedience course with {{dog_name}}!</p>
  
  {{#if custom_message}}
  <p>{{custom_message}}</p>
  {{/if}}
  
  <div style="background-color: #e8f0fe; padding: 20px; border-radius: 8px; margin: 20px 0;">
    <h3 style="margin: 0 0 12px 0; color: #2c5530;">What's Next: CGC Bronze</h3>
    <p style="margin: 0 0 15px 0;">This qualifies you to join <strong>CGC Bronze</strong> – please find the relevant details below:</p>
    
    <table style="width: 100%; border-collapse: collapse; margin: 15px 0; font-size: 14px;">
      <tr style="background-color: #3b7dc4; color: white;">
        <th style="padding: 10px; text-align: left; border: 1px solid #ddd;">Course</th>
        <th style="padding: 10px; text-align: left; border: 1px solid #ddd;">Price</th>
        <th style="padding: 10px; text-align: left; border: 1px solid #ddd;">Entry Criteria</th>
        <th style="padding: 10px; text-align: left; border: 1px solid #ddd;">Dates</th>
        <th style="padding: 10px; text-align: left; border: 1px solid #ddd;">Day & Time</th>
      </tr>
      <tr style="background-color: #f9f9f9;">
        <td style="padding: 10px; border: 1px solid #ddd;"><strong>CGC Bronze**</strong></td>
        <td style="padding: 10px; border: 1px solid #ddd;">R1,680.00</td>
        <td style="padding: 10px; border: 1px solid #ddd;">Elementary Obedience</td>
        <td style="padding: 10px; border: 1px solid #ddd;">January 17th, 24th, 31st<br>February 7th, 14th, 21st, 28th<br>March 7th, 14th (Graduation Day!)</td>
        <td style="padding: 10px; border: 1px solid #ddd;">Saturdays 15H00 – 16H00</td>
      </tr>
    </table>
    
    <p style="font-size: 12px; color: #666; margin-top: 10px; font-style: italic;">** Please note, the CGC exercises are highly dependent on the presence of other dogs and handlers, and the full benefit of the course cannot be guaranteed with inadequate enrolments. Therefore, the CGC will only be available should enough handlers be enrolled. Please make payment as payment confirms numbers. Refunds/credits will be made if class does not take place.</p>
  </div>
  
  <div style="margin: 20px 0;">
    <h4 style="color: #2c5530; margin-bottom: 10px;">Course Description - CGC (Canine Good Citizenship) Bronze:</h4>
    <ul style="margin: 0; padding-left: 20px; color: #444;">
      <li>Accepting examination and grooming by a stranger</li>
      <li>Calm down after play</li>
      <li>Release from lead, play, recall and attach lead</li>
      <li>Walk on loose lead without distraction</li>
      <li>Gate manners</li>
      <li>Meet & greet another handler and dog</li>
      <li>Walk on a lead passing people and dogs</li>
      <li>Reaction to distractions</li>
      <li>Lie down and stay to command - 7 metres</li>
      <li>Supervised isolation</li>
    </ul>
  </div>
  
  <p>Should you wish to enroll, kindly confirm via email and send through your proof of payment.</p>
  
  <p>Looking forward to your response.</p>
  
  <p>Kind regards,<br>Ady</p>
</div>`
};

// Template 5: Congrats on EO - Now CGC or Beginner
export const EO_TO_CGC_OR_BEGINNER_TEMPLATE: CongratsTemplate = {
  name: "Congrats on EO - Now CGC Bronze or Beginner",
  subject: "Congratulations! Next Steps: CGC Bronze or Beginner Obedience",
  classType: "EO",
  content: `<div class="email-content">
  <p>Dear {{handler_name}},</p>
  
  <p>Congratulations on passing the Elementary Obedience course with such excellent results with {{dog_name}}!</p>
  
  {{#if custom_message}}
  <p>{{custom_message}}</p>
  {{/if}}
  
  <div style="background-color: #e8f0fe; padding: 20px; border-radius: 8px; margin: 20px 0;">
    <h3 style="margin: 0 0 12px 0; color: #2c5530;">What's Next: CGC Bronze or Beginner Obedience</h3>
    <p style="margin: 0 0 15px 0;">This qualifies you to join either <strong>CGC Bronze</strong> or <strong>Beginner Obedience</strong> – please find the relevant details below:</p>
    
    <table style="width: 100%; border-collapse: collapse; margin: 15px 0; font-size: 14px;">
      <tr style="background-color: #3b7dc4; color: white;">
        <th style="padding: 10px; text-align: left; border: 1px solid #ddd;">Course</th>
        <th style="padding: 10px; text-align: left; border: 1px solid #ddd;">Price</th>
        <th style="padding: 10px; text-align: left; border: 1px solid #ddd;">Entry Criteria</th>
        <th style="padding: 10px; text-align: left; border: 1px solid #ddd;">Dates</th>
        <th style="padding: 10px; text-align: left; border: 1px solid #ddd;">Day & Time</th>
      </tr>
      <tr style="background-color: #f9f9f9;">
        <td style="padding: 10px; border: 1px solid #ddd;"><strong>CGC Bronze**</strong></td>
        <td style="padding: 10px; border: 1px solid #ddd;">R1,680.00</td>
        <td style="padding: 10px; border: 1px solid #ddd;">Elementary Obedience</td>
        <td style="padding: 10px; border: 1px solid #ddd;">January 17th, 24th, 31st<br>February 7th, 14th, 21st, 28th<br>March 7th, 14th (Graduation Day!)</td>
        <td style="padding: 10px; border: 1px solid #ddd;">Saturdays 15H00 – 16H00</td>
      </tr>
      <tr>
        <td style="padding: 10px; border: 1px solid #ddd;"><strong>Beginner Obedience</strong></td>
        <td style="padding: 10px; border: 1px solid #ddd;">R1,770.00</td>
        <td style="padding: 10px; border: 1px solid #ddd;">Elementary Obedience</td>
        <td style="padding: 10px; border: 1px solid #ddd;">January 17th, 24th, 31st<br>February 7th, 14th, 21st, 28th<br>March 7th, 14th (Graduation Day!)</td>
        <td style="padding: 10px; border: 1px solid #ddd;">Saturdays 14H00 – 15H00</td>
      </tr>
    </table>
    
    <p style="font-size: 12px; color: #666; margin-top: 10px; font-style: italic;">** Please note, the CGC exercises are highly dependent on the presence of other dogs and handlers, and the full benefit of the course cannot be guaranteed with inadequate enrolments. Therefore, the CGC will only be available should enough handlers be enrolled. Please make payment as payment confirms numbers. Refunds/credits will be made if class does not take place.</p>
  </div>
  
  <div style="margin: 20px 0;">
    <h4 style="color: #2c5530; margin-bottom: 10px;">Course Description - CGC (Canine Good Citizenship) Bronze:</h4>
    <ul style="margin: 0 0 15px 0; padding-left: 20px; color: #444;">
      <li>Accepting examination and grooming by a stranger</li>
      <li>Calm down after play</li>
      <li>Release from lead, play, recall and attach lead</li>
      <li>Walk on loose lead without distraction</li>
      <li>Gate manners</li>
      <li>Meet & greet another handler and dog</li>
      <li>Walk on a lead passing people and dogs</li>
      <li>Reaction to distractions</li>
      <li>Lie down and stay to command - 7 metres</li>
      <li>Supervised isolation</li>
    </ul>
    
    <h4 style="color: #2c5530; margin-bottom: 10px;">Course Description - Beginner Obedience:</h4>
    <ul style="margin: 0; padding-left: 20px; color: #444;">
      <li>Heel on a loose lead, including left, right, and about turns on the move</li>
      <li>Sit Stay, recall to the front, return to heel off lead</li>
      <li>Retrieve article off lead</li>
      <li>Sit stay off lead – 1 minute</li>
      <li>Down stay off lead – 2 minutes in sight</li>
    </ul>
  </div>
  
  <p>Should you wish to enroll in any of these courses, kindly confirm via email and send through your proof of payment.</p>
  
  <p>Looking forward to your response.</p>
  
  <p>Kind regards,<br>Ady</p>
</div>`
};

// Template 6: Novice Only (after Beginner)
export const NOVICE_ONLY_TEMPLATE: CongratsTemplate = {
  name: "Congrats on Beginner - Now Novice Only",
  subject: "Congratulations! Next Step: Novice Obedience",
  classType: "Beginner",
  content: `<div class="email-content">
  <p>Dear {{handler_name}},</p>
  
  <p>Congratulations on completing and passing the McKaynine Beginner Obedience course with {{dog_name}}!</p>
  
  {{#if custom_message}}
  <p>{{custom_message}}</p>
  {{/if}}
  
  <div style="background-color: #e8f0fe; padding: 20px; border-radius: 8px; margin: 20px 0;">
    <h3 style="margin: 0 0 12px 0; color: #2c5530;">What's Next: Novice Obedience</h3>
    <p style="margin: 0 0 15px 0;">This qualifies you to join <strong>Novice Obedience</strong> – please find the relevant information below:</p>
    
    <table style="width: 100%; border-collapse: collapse; margin: 15px 0; font-size: 14px;">
      <tr style="background-color: #3b7dc4; color: white;">
        <th style="padding: 10px; text-align: left; border: 1px solid #ddd;">Course</th>
        <th style="padding: 10px; text-align: left; border: 1px solid #ddd;">Price</th>
        <th style="padding: 10px; text-align: left; border: 1px solid #ddd;">Entry Criteria</th>
        <th style="padding: 10px; text-align: left; border: 1px solid #ddd;">Dates</th>
        <th style="padding: 10px; text-align: left; border: 1px solid #ddd;">Day & Time</th>
      </tr>
      <tr style="background-color: #f9f9f9;">
        <td style="padding: 10px; border: 1px solid #ddd;"><strong>Novice Obedience</strong></td>
        <td style="padding: 10px; border: 1px solid #ddd;">R1,770.00</td>
        <td style="padding: 10px; border: 1px solid #ddd;">Beginner Obedience</td>
        <td style="padding: 10px; border: 1px solid #ddd;">January 17th, 24th, 31st<br>February 7th, 14th, 21st, 28th<br>March 7th, 14th (Graduation Day!)</td>
        <td style="padding: 10px; border: 1px solid #ddd;">Saturdays 14H00 – 15H00</td>
      </tr>
    </table>
  </div>
  
  <div style="margin: 20px 0;">
    <h4 style="color: #2c5530; margin-bottom: 10px;">Course Description - Novice Obedience:</h4>
    <ul style="margin: 0; padding-left: 20px; color: #444;">
      <li>Heel on a loose lead, including left, right, and about turns on the move</li>
      <li>Heel off lead, including right, left and about turns on the move</li>
      <li>Stationary Turns</li>
      <li>Change of pace</li>
      <li>Recall and Finish – Handler leaves the dog in a sit position and takes 20 paces away from the dog. On command the dog recalls to the handler and sits in front of the handler. On command the dog returns to the heel position</li>
      <li>Retrieve handler's article</li>
      <li>Sit Stay – 20 paces away from dog for 1 minute</li>
      <li>Down Stay – 20 paces away from dog for 3 minutes</li>
      <li>Send away – Taught but not for grading but as a precursor to A Test</li>
    </ul>
  </div>
  
  <p>Should you wish to enroll in this course, kindly confirm via email and send through your proof of payment.</p>
  
  <p>Looking forward to your response.</p>
  
  <p>Kind regards,<br>Ady</p>
</div>`
};

// Template 7: Silver CGC Only
export const SILVER_CGC_ONLY_TEMPLATE: CongratsTemplate = {
  name: "Silver CGC Info",
  subject: "CGC Silver Course Information",
  classType: "CGC Bronze",
  content: `<div class="email-content">
  <p>Dear {{handler_name}},</p>
  
  <p>Looking forward to having you and {{dog_name}} join our Silver CGC course – please find the relevant details below:</p>
  
  {{#if custom_message}}
  <p>{{custom_message}}</p>
  {{/if}}
  
  <div style="background-color: #e8f0fe; padding: 20px; border-radius: 8px; margin: 20px 0;">
    <h3 style="margin: 0 0 12px 0; color: #2c5530;">CGC Silver Course Details</h3>
    
    <table style="width: 100%; border-collapse: collapse; margin: 15px 0; font-size: 14px;">
      <tr style="background-color: #3b7dc4; color: white;">
        <th style="padding: 10px; text-align: left; border: 1px solid #ddd;">Course</th>
        <th style="padding: 10px; text-align: left; border: 1px solid #ddd;">Price</th>
        <th style="padding: 10px; text-align: left; border: 1px solid #ddd;">Entry Criteria</th>
        <th style="padding: 10px; text-align: left; border: 1px solid #ddd;">Dates</th>
        <th style="padding: 10px; text-align: left; border: 1px solid #ddd;">Day & Time</th>
      </tr>
      <tr style="background-color: #f9f9f9;">
        <td style="padding: 10px; border: 1px solid #ddd;"><strong>CGC Silver**</strong></td>
        <td style="padding: 10px; border: 1px solid #ddd;">R1,680.00</td>
        <td style="padding: 10px; border: 1px solid #ddd;">CGC Bronze</td>
        <td style="padding: 10px; border: 1px solid #ddd;">January 17th, 24th, 31st<br>February 7th, 14th, 21st, 28th<br>March 7th, 14th (Graduation Day!)</td>
        <td style="padding: 10px; border: 1px solid #ddd;">Saturdays 14H00 – 15H00</td>
      </tr>
    </table>
    
    <p style="font-size: 12px; color: #666; margin-top: 10px; font-style: italic;">** Please note, the CGC exercises are highly dependent on the presence of other dogs and handlers, and the full benefit of the course cannot be guaranteed with inadequate enrolments. Therefore, the CGC will only be available should enough handlers be enrolled. Please make payment as payment confirms numbers. Refunds/credits will be made if class does not take place.</p>
  </div>
  
  <div style="margin: 20px 0;">
    <h4 style="color: #2c5530; margin-bottom: 10px;">Course Description - CGC Silver:</h4>
    <ul style="margin: 0; padding-left: 20px; color: #444;">
      <li>Controlled greeting - The object is to demonstrate that the dog will not jump up</li>
      <li>Examination of dog - The object is to demonstrate that the dog will allow inspection of its body by a stranger as might be undertaken by a veterinary surgeon</li>
      <li>Play with the dog - The object is to demonstrate that the dog will play with its handler</li>
      <li>Rejoin Handler - The object is for the dog to remain steady while the handler leaves</li>
      <li>Food manners - The object is for the dog to have good manners when aware of people's food</li>
      <li>Come away from distractions - The object is for the handler to remain in control of their dog when there are distractions</li>
      <li>Road Walk - The object is to test the ability of the dog to walk on lead under control</li>
      <li>Stay in one place for two minutes - The object is that the dog will stay on the spot while the handler moves away for two minutes</li>
      <li>Vehicle control - The object is for the handler to get the dog in and out of a vehicle in a controlled manner</li>
      <li>Responsibility & care - The object is to test the knowledge of the handler on this subject</li>
    </ul>
  </div>
  
  <p>Should you wish to enroll in this course, kindly confirm via email and send through your proof of payment.</p>
  
  <p>Looking forward to your response.</p>
  
  <p>Kind regards,<br>Ady</p>
</div>`
};

// Template 8: Working Trials / A-Test
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
    
    <table style="width: 100%; border-collapse: collapse; margin: 15px 0; font-size: 14px;">
      <tr>
        <td style="padding: 8px 0; color: #555; width: 120px;"><strong>Dates:</strong></td>
        <td style="padding: 8px 0;">January 17th, 24th, 31st<br>February 7th, 14th, 21st, 28th<br>March 7th, 14th (Graduation Day!)</td>
      </tr>
      <tr>
        <td style="padding: 8px 0; color: #555;"><strong>Time:</strong></td>
        <td style="padding: 8px 0;">15H00 – 16H00</td>
      </tr>
      <tr>
        <td style="padding: 8px 0; color: #555;"><strong>Cost:</strong></td>
        <td style="padding: 8px 0;"><strong>R2,160.00</strong></td>
      </tr>
    </table>
    
    <p style="font-size: 13px; color: #2c5530; margin-top: 10px;">(Please note that your course price remains the same as last year 😊)</p>
  </div>
  
  <p>We look forward to having you join us again for another fun-filled year of instruction under Steve.</p>
  
  <p>Looking forward to receiving your proof of payment and to seeing you soon.</p>
  
  <p>Kind regards,<br>Ady</p>
</div>`
};

// Export all templates for easy access
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
