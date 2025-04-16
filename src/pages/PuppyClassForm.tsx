
import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useAuth } from "@/context/auth";
import { Helmet } from "react-helmet";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Separator } from "@/components/ui/separator";
import { FormNavigation } from "@/components/forms/FormNavigation";
import { useClassData } from "@/components/class-schedules/hooks/useClassData";
import { useParams } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Check, Loader2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";

// Basic form schema for enrollment
const formSchema = z.object({
  // Owner details
  ownerName: z.string().min(2, { message: "Name is required" }),
  ownerEmail: z.string().email({ message: "Valid email is required" }),
  ownerCell: z.string().min(5, { message: "Phone number is required" }),
  ownerOccupation: z.string().optional(),
  accountName: z.string().optional(),
  
  // Puppy/Dog details
  dogName: z.string().min(1, { message: "Dog's name is required" }),
  dogBreed: z.string().min(1, { message: "Breed is required" }),
  dogBirthDate: z.string().optional(),
  dogGender: z.enum(["Male", "Female"]).optional(),
  dogAge: z.number().optional(),
  spayNeuterStatus: z.enum(["Already done", "Not planning to spay/neuter"]).optional(),
  acquiredFrom: z.enum(["KUSA Breeder", "SPCA/AACL", "Rescue org.", "Family/friends", "Born in home", "Stray", "Advert", "Other"]).optional(),
  ageAtAcquisition: z.enum(["Less than 2 months", "2-4 months", "4-12 months", "Older than 1 year"]).optional(),
  
  // Household information
  otherPets: z.object({
    dogs: z.boolean().optional(),
    cats: z.boolean().optional(),
    birds: z.boolean().optional(),
    livestock: z.boolean().optional(),
  }).optional(),
  children: z.object({
    babies: z.boolean().optional(),
    toddlers: z.boolean().optional(),
    children: z.boolean().optional(),
    teenagers: z.boolean().optional(),
    none: z.boolean().optional(),
  }).optional(),
  
  // Social behavior
  socialBehavior: z.object({
    dogs: z.enum(["Great", "OK", "Not good"]).optional(),
    otherAnimals: z.enum(["Great", "OK", "Not good"]).optional(),
    people: z.enum(["Great", "OK", "Not good"]).optional(),
  }).optional(),
  
  // Training goals and issues
  trainingGoal: z.enum(["Competitive dog sport", "Chilled canine companion"]).optional(),
  hasBehaviorProblems: z.boolean().optional(),
  behaviorProblemsDetail: z.string().optional(),
  hasHealthProblems: z.boolean().optional(),
  healthProblemsDetail: z.string().optional(),
  
  // Permissions and agreements
  whatsAppPermission: z.boolean().optional(),
  photoPermission: z.boolean().optional(),
  offleaseSocializingAgreement: z.boolean().optional(),
  equipmentAgreement: z.boolean().optional(),
  trainingTreatsAgreement: z.boolean().optional(),
  wasteDisposalAgreement: z.boolean().optional(),
  termsAgreement: z.boolean().default(false),
  
  // Vaccination information
  vaccinated: z.boolean().default(false),
  lastVaccinationDate: z.string().optional(),
  vetClearanceLetter: z.boolean().optional(),
  
  // Which vet
  vetName: z.string().optional(),
  
  // How did you hear about us
  heardFrom: z.object({
    google: z.boolean().optional(),
    myVet: z.boolean().optional(),
    friends: z.boolean().optional(),
    breeder: z.boolean().optional(),
    shelter: z.boolean().optional(),
    beenBefore: z.boolean().optional(),
  }).optional(),
});

type FormValues = z.infer<typeof formSchema>;

export default function PuppyClassForm() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { id: scheduleId } = useParams(); // Get the schedule ID from URL params
  const { classData, scheduleData, isLoading } = useClassData({ scheduleId });
  
  const form = useForm<any>({
    resolver: zodResolver(z.object({})), // Replace with your actual form schema
    defaultValues: {
      ownerName: "",
      ownerEmail: "",
      ownerCell: "",
      ownerOccupation: "",
      accountName: "",
      dogName: "",
      dogBreed: "",
      dogBirthDate: "",
      termsAgreement: false,
      vaccinated: false,
    },
  });

  const onSubmit = async (data: FormValues) => {
    setIsSubmitting(true);
    
    try {
      // In a real application, this would submit to your backend
      console.log("Form data:", data);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast({
        title: "Form Submitted",
        description: "The puppy class registration has been submitted successfully.",
      });
      
      // Optionally redirect or reset form
      // form.reset();
    } catch (error) {
      console.error("Error submitting form:", error);
      toast({
        title: "Submission Failed",
        description: "There was an error submitting the form. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleSave = () => {
    form.handleSubmit(onSubmit)();
  };

  // Format class schedule dates nicely for display
  const formatClassDates = () => {
    if (!scheduleData?.selected_dates || scheduleData.selected_dates.length === 0) return "";
    
    // Format dates from the schedule data
    try {
      const dates = scheduleData.selected_dates
        .map((date: string) => format(new Date(date), 'MMM d'))
        .join(', ');
      return dates;
    } catch (error) {
      console.error("Error formatting class dates:", error);
      return "";
    }
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="py-10 text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>Loading class details...</p>
        </div>
      </DashboardLayout>
    );
  }

  // Helper function to safely display form error messages
  const getErrorMessage = (error: any): string => {
    if (!error) return "";
    return typeof error === 'string' ? error : error.message || "Invalid input";
  };

  return (
    <DashboardLayout>
      <Helmet>
        <title>Puppy Class Registration - McKaynine Training Centre</title>
        <style type="text/css">{`
          @media print {
            header, footer, nav, .no-print {
              display: none !important;
            }
            body * {
              visibility: hidden;
            }
            #print-section, #print-section * {
              visibility: visible;
            }
            #print-section {
              position: absolute;
              left: 0;
              top: 0;
              width: 100%;
            }
          }
        `}</style>
      </Helmet>
      
      <div className="container mx-auto py-6">
        <FormNavigation 
          title="Puppy Class Registration Form" 
          onPrint={handlePrint}
          onSave={handleSave}
          isSubmitting={isSubmitting}
        />
        
        <div id="print-section" className="mb-8">
          <Card className="mb-6 overflow-hidden">
            <div className="relative bg-blue-600 text-white p-4">
              <div className="flex justify-between items-center">
                <div>
                  <h1 className="text-3xl font-bold">McKaynine Delta</h1>
                  {classData && (
                    <p className="text-xl">
                      Puppy Class Delta - {classData.description || "Apr/May 2025"} 
                      {scheduleData && (
                        <span> {format(new Date(scheduleData.start_time), 'EEEE HH:mm')} - {format(new Date(scheduleData.end_time), 'HH:mm')}</span>
                      )}
                    </p>
                  )}
                </div>
                <div className="bg-white p-2 rounded-md">
                  <img 
                    src="/lovable-uploads/2818132a-8197-4f54-8be1-9c1dc326e404.png" 
                    alt="McKaynine Training Centre" 
                    className="h-12"
                  />
                </div>
              </div>
              <p className="text-xs mt-1">
                McKaynine Delta is a licensed franchise of McKaynine (Pty) Ltd 2024/1283575/07
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 p-6">
              <div className="md:col-span-4">
                <img 
                  src="/lovable-uploads/b7cf9e00-0b19-4e15-835d-f3ce192b2591.png" 
                  alt="Puppy and Owner" 
                  className="w-full h-auto rounded-lg border-4 border-yellow-400"
                />
              </div>
              
              <div className="md:col-span-8">
                <div className="text-center mb-6">
                  <h2 className="text-2xl font-bold text-blue-600 mb-2">
                    Puppy socialisation classes are proven to minimise problem behaviour in adult dogs.
                  </h2>
                  <h3 className="text-xl font-bold text-blue-500">
                    It's the best start to the years ahead for your pup!
                  </h3>
                </div>
                
                <div className="space-y-2">
                  {[
                    "Let us help you with the normal \"puppy problems\"",
                    "Teach your pup some really cool obedience commands",
                    "Develop and maximise your pup's social skills",
                    "Watch your pup play and expend that puppy energy",
                    "A series of fun and educational outings for you and your pup",
                    "Experienced, knowledgeable and friendly instruction"
                  ].map((benefit, index) => (
                    <div key={index} className="flex items-start">
                      <div className="text-green-500 mr-2">✓</div>
                      <p>{benefit}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            
            <div className="bg-gray-100 p-6">
              <ul className="list-disc space-y-2 pl-6">
                <li className="text-blue-600 font-semibold">
                  Camp Delta (Scouts), Craighall Road, Delta Park (map attached)
                </li>
                <li className="text-blue-600 font-semibold">
                  {scheduleData && (
                    <span>{format(new Date(scheduleData.start_time), 'HH:mm')} - {format(new Date(scheduleData.end_time), 'HH:mm')}</span>
                  )}
                </li>
                <li className="text-blue-600 font-semibold">
                  {formatClassDates()}
                  <p className="text-sm text-gray-600 italic">
                    (Missed the first class? Don't worry - you can join from the second lesson)
                  </p>
                </li>
              </ul>
              
              <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-bold text-blue-600 mb-2">How Much Does The Course Cost?</h3>
                  <p className="text-sm">
                    The two-month (6 lessons) course costs R1 430.00 per puppy plus a R195.00 enrolment fee, 
                    which includes a comprehensive Puppy Owner's Guide and a treat bag. A 25% discount applies 
                    to any simultaneous enrolment/s from the same household during the same period (not applicable to enrolment fee).
                  </p>
                </div>
                
                <div className="relative">
                  <div className="border-4 border-orange-500 rounded-xl p-4 bg-white">
                    <h3 className="text-lg font-bold text-center mb-2">Puppy Requirements</h3>
                    <p className="mb-2">
                      Puppies should start at 10-14 weeks old - exception might be made for small breeds on the upper limit
                    </p>
                    <p className="font-bold">
                      Pups MUST have had two vaccinations (latest from vet) before starting classes
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="mt-6">
                <h3 className="text-lg font-bold text-blue-600 mb-2">What Is Covered In The Lessons?</h3>
                <p className="text-sm">
                  Pups learn how to walk on a lead, sit, lie down, puppy stay, food manners and "calm on cue". 
                  Pups also get to socialise in a controlled manner and owners are shown how to address normal puppy problems. 
                  A variety of safe yet stimulating puppy "obstacle courses" also help develop co-ordination and enhance obedience. 
                  We also provide the pups with exposure to multiple novel items to increase their sensory reference base, 
                  which has been proven to increase sociability and confidence when adult.
                </p>
              </div>
            </div>
          </Card>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              <h2 className="text-2xl font-bold text-center text-blue-600 mb-6">Enrolment Form V3-24</h2>
              <p className="text-center text-sm text-gray-600 mb-6">
                © McKaynine (Pty) Ltd 2024/1283575/07
              </p>
              <p className="text-center text-sm italic mb-6">
                Please note that by submitting this form you agree to our Privacy Policy, which is detailed on our website
              </p>
              
              <div className="bg-blue-500 text-white p-4 rounded-t-md">
                <h3 className="text-xl font-bold">Owner Details</h3>
              </div>
              <div className="bg-white border border-gray-200 p-6 rounded-b-md shadow-sm">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Label htmlFor="ownerName">Name:</Label>
                    <Input 
                      id="ownerName"
                      {...form.register("ownerName")}
                      className="mt-1"
                    />
                    {form.formState.errors.ownerName && (
                      <p className="text-red-500 text-sm mt-1">{getErrorMessage(form.formState.errors.ownerName)}</p>
                    )}
                  </div>
                  
                  <div>
                    <Label htmlFor="accountName">Name of person for account (if different):</Label>
                    <Input 
                      id="accountName"
                      {...form.register("accountName")}
                      className="mt-1"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="ownerEmail">Email:</Label>
                    <Input 
                      id="ownerEmail"
                      type="email"
                      {...form.register("ownerEmail")}
                      className="mt-1"
                    />
                    {form.formState.errors.ownerEmail && (
                      <p className="text-red-500 text-sm mt-1">{getErrorMessage(form.formState.errors.ownerEmail)}</p>
                    )}
                  </div>
                  
                  <div>
                    <Label htmlFor="ownerCell">Cell:</Label>
                    <Input 
                      id="ownerCell"
                      {...form.register("ownerCell")}
                      className="mt-1"
                    />
                    {form.formState.errors.ownerCell && (
                      <p className="text-red-500 text-sm mt-1">{getErrorMessage(form.formState.errors.ownerCell)}</p>
                    )}
                  </div>
                  
                  <div>
                    <Label htmlFor="ownerOccupation">Occupation (optional):</Label>
                    <Input 
                      id="ownerOccupation"
                      {...form.register("ownerOccupation")}
                      className="mt-1"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="vetName">Which vet do you use?</Label>
                    <Input 
                      id="vetName"
                      {...form.register("vetName")}
                      className="mt-1"
                    />
                  </div>
                </div>
              </div>
              
              <div className="bg-blue-500 text-white p-4 rounded-t-md">
                <h3 className="text-xl font-bold">Puppy/Dog Details</h3>
              </div>
              <div className="bg-white border border-gray-200 p-6 rounded-b-md shadow-sm">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <Label htmlFor="dogName">Name:</Label>
                    <Input 
                      id="dogName"
                      {...form.register("dogName")}
                      className="mt-1"
                    />
                    {form.formState.errors.dogName && (
                      <p className="text-red-500 text-sm mt-1">{getErrorMessage(form.formState.errors.dogName)}</p>
                    )}
                  </div>
                  
                  <div>
                    <Label htmlFor="dogBirthDate">Birth date:</Label>
                    <Input 
                      id="dogBirthDate"
                      type="date"
                      {...form.register("dogBirthDate")}
                      className="mt-1"
                    />
                  </div>
                  
                  <div>
                    <Label>Gender:</Label>
                    <div className="flex space-x-4 mt-2">
                      <div className="flex items-center space-x-2">
                        <input
                          type="radio"
                          id="male"
                          value="Male"
                          {...form.register("dogGender")}
                          className="h-4 w-4"
                        />
                        <Label htmlFor="male" className="text-sm">Male</Label>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <input
                          type="radio"
                          id="female"
                          value="Female"
                          {...form.register("dogGender")}
                          className="h-4 w-4"
                        />
                        <Label htmlFor="female" className="text-sm">Female</Label>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <Label htmlFor="dogBreed">Breed:</Label>
                    <Input 
                      id="dogBreed"
                      {...form.register("dogBreed")}
                      className="mt-1"
                    />
                    {form.formState.errors.dogBreed && (
                      <p className="text-red-500 text-sm mt-1">{getErrorMessage(form.formState.errors.dogBreed)}</p>
                    )}
                  </div>
                  
                  <div className="col-span-2">
                    <Label>Spay/Neuter Status:</Label>
                    <div className="flex space-x-4 mt-2">
                      <div className="flex items-center space-x-2">
                        <input
                          type="radio"
                          id="alreadyDone"
                          value="Already done"
                          {...form.register("spayNeuterStatus")}
                          className="h-4 w-4"
                        />
                        <Label htmlFor="alreadyDone" className="text-sm">Already done</Label>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <input
                          type="radio"
                          id="notPlanning"
                          value="Not planning to spay/neuter"
                          {...form.register("spayNeuterStatus")}
                          className="h-4 w-4"
                        />
                        <Label htmlFor="notPlanning" className="text-sm">Not planning to spay/neuter</Label>
                      </div>
                    </div>
                  </div>
                </div>
                
                <Separator className="my-6" />
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Label>Acquired from:</Label>
                    <div className="grid grid-cols-2 gap-2 mt-2">
                      {[
                        "KUSA Breeder", "SPCA/AACL", "Rescue org.", "Family/friends",
                        "Born in home", "Stray", "Advert", "Other"
                      ].map((source) => (
                        <div key={source} className="flex items-center space-x-2">
                          <input
                            type="radio"
                            id={source.replace(/\//g, '-').toLowerCase()}
                            value={source}
                            {...form.register("acquiredFrom")}
                            className="h-4 w-4"
                          />
                          <Label 
                            htmlFor={source.replace(/\//g, '-').toLowerCase()} 
                            className="text-sm"
                          >
                            {source}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div>
                    <Label>Age at acquisition:</Label>
                    <div className="grid grid-cols-2 gap-2 mt-2">
                      {[
                        "Less than 2 months", "2-4 months", 
                        "4-12 months", "Older than 1 year"
                      ].map((age) => (
                        <div key={age} className="flex items-center space-x-2">
                          <input
                            type="radio"
                            id={age.replace(/\s+/g, '-').toLowerCase()}
                            value={age}
                            {...form.register("ageAtAcquisition")}
                            className="h-4 w-4"
                          />
                          <Label 
                            htmlFor={age.replace(/\s+/g, '-').toLowerCase()} 
                            className="text-sm"
                          >
                            {age}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                
                <Separator className="my-6" />
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Label>Other pets at home:</Label>
                    <div className="grid grid-cols-2 gap-2 mt-2">
                      {[
                        { id: "dogs", label: "Dog/s" },
                        { id: "cats", label: "Cat/s" },
                        { id: "birds", label: "Bird/s" },
                        { id: "livestock", label: "Livestock" },
                      ].map((pet) => (
                        <div key={pet.id} className="flex items-center space-x-2">
                          <Checkbox
                            id={`otherPets.${pet.id}`}
                            {...form.register(`otherPets.${pet.id}` as any)}
                          />
                          <Label 
                            htmlFor={`otherPets.${pet.id}`} 
                            className="text-sm"
                          >
                            {pet.label}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div>
                    <Label>Children at home:</Label>
                    <div className="grid grid-cols-2 gap-2 mt-2">
                      {[
                        { id: "babies", label: "Babies/toddlers" },
                        { id: "children", label: "Children" },
                        { id: "teenagers", label: "Teenagers" },
                        { id: "none", label: "None" },
                      ].map((child) => (
                        <div key={child.id} className="flex items-center space-x-2">
                          <Checkbox
                            id={`children.${child.id}`}
                            {...form.register(`children.${child.id}` as any)}
                          />
                          <Label 
                            htmlFor={`children.${child.id}`} 
                            className="text-sm"
                          >
                            {child.label}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                
                <Separator className="my-6" />
                
                <div>
                  <Label>How does your puppy/dog get along with different types of... (please give more detail if needed)</Label>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-2">
                    {[
                      { key: "dogs", label: "Dogs" },
                      { key: "otherAnimals", label: "Other animals" },
                      { key: "people", label: "People" },
                    ].map((category) => (
                      <div key={category.key} className="border p-3 rounded-md">
                        <p className="font-medium mb-2">{category.label}</p>
                        <div className="space-y-2">
                          {["Great", "OK", "Not good"].map((rating) => (
                            <div key={rating} className="flex items-center space-x-2">
                              <input
                                type="radio"
                                id={`${category.key}.${rating}`}
                                value={rating}
                                {...form.register(`socialBehavior.${category.key}` as any)}
                                className="h-4 w-4"
                              />
                              <Label 
                                htmlFor={`${category.key}.${rating}`} 
                                className="text-sm"
                              >
                                {rating}
                              </Label>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                
                <Separator className="my-6" />
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Label>What is your overall goal with your pup/dog's training?</Label>
                    <div className="space-y-2 mt-2">
                      {[
                        { id: "competitive", label: "Competitive dog sport" },
                        { id: "companion", label: "Chilled canine companion" },
                      ].map((goal) => (
                        <div key={goal.id} className="flex items-center space-x-2">
                          <input
                            type="radio"
                            id={goal.id}
                            value={goal.id === "competitive" ? "Competitive dog sport" : "Chilled canine companion"}
                            {...form.register("trainingGoal")}
                            className="h-4 w-4"
                          />
                          <Label 
                            htmlFor={goal.id} 
                            className="text-sm"
                          >
                            {goal.label}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div>
                    <div className="flex items-center space-x-4 mb-2">
                      <Label>Does your puppy/dog have any existing behaviour problems?</Label>
                      <div className="flex space-x-4">
                        <div className="flex items-center space-x-2">
                          <input
                            type="radio"
                            id="behaviorProblemsYes"
                            {...form.register("hasBehaviorProblems")}
                            value="true"
                            className="h-4 w-4"
                          />
                          <Label htmlFor="behaviorProblemsYes" className="text-sm">Yes</Label>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <input
                            type="radio"
                            id="behaviorProblemsNo"
                            {...form.register("hasBehaviorProblems")}
                            value="false"
                            className="h-4 w-4"
                          />
                          <Label htmlFor="behaviorProblemsNo" className="text-sm">No</Label>
                        </div>
                      </div>
                    </div>
                    {form.watch("hasBehaviorProblems") && (
                      <div>
                        <Label htmlFor="behaviorProblemsDetail">If you answered "Yes", please provide more detail...</Label>
                        <Textarea 
                          id="behaviorProblemsDetail"
                          {...form.register("behaviorProblemsDetail")}
                          className="mt-1"
                        />
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="mt-6">
                  <div className="flex items-center space-x-4 mb-2">
                    <Label>Does your puppy/dog have any existing health problems/disabilities?</Label>
                    <div className="flex space-x-4">
                      <div className="flex items-center space-x-2">
                        <input
                          type="radio"
                          id="healthProblemsYes"
                          {...form.register("hasHealthProblems")}
                          value="true"
                          className="h-4 w-4"
                        />
                        <Label htmlFor="healthProblemsYes" className="text-sm">Yes</Label>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <input
                          type="radio"
                          id="healthProblemsNo"
                          {...form.register("hasHealthProblems")}
                          value="false"
                          className="h-4 w-4"
                        />
                        <Label htmlFor="healthProblemsNo" className="text-sm">No</Label>
                      </div>
                    </div>
                  </div>
                  {form.watch("hasHealthProblems") && (
                    <div>
                      <Label htmlFor="healthProblemsDetail">If you answered "Yes", please provide more detail...</Label>
                      <Textarea 
                        id="healthProblemsDetail"
                        {...form.register("healthProblemsDetail")}
                        className="mt-1"
                      />
                    </div>
                  )}
                </div>
              </div>
              
              <div className="bg-blue-500 text-white p-4 rounded-t-md">
                <h3 className="text-xl font-bold">General Information</h3>
              </div>
              <div className="bg-white border border-gray-200 p-6 rounded-b-md shadow-sm">
                <div className="grid grid-cols-1 gap-6">
                  <div>
                    <Label>How did you hear about us?</Label>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-2">
                      {[
                        { id: "google", label: "Google" },
                        { id: "myVet", label: "My vet" },
                        { id: "friends", label: "Friends/family" },
                        { id: "breeder", label: "Breeder/shelter" },
                        { id: "beenBefore", label: "Been before" },
                      ].map((source) => (
                        <div key={source.id} className="flex items-center space-x-2">
                          <Checkbox
                            id={`heardFrom.${source.id}`}
                            {...form.register(`heardFrom.${source.id}` as any)}
                          />
                          <Label 
                            htmlFor={`heardFrom.${source.id}`} 
                            className="text-sm"
                          >
                            {source.label}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <Separator />
                  
                  <div className="bg-blue-50 p-4 rounded-md border border-blue-200">
                    <h4 className="text-lg font-semibold mb-2">What Do I Need To Bring?</h4>
                    <div className="space-y-2">
                      {[
                        "Puppy wearing a normal flat buckle collar",
                        "Light webbing lead (no chain or extendable leads please)",
                        "Small, soft easily consumed treats. We also sell a range of suitable treats at classes",
                        "Comfortable flat shoes and a hat in warm weather"
                      ].map((item, index) => (
                        <div key={index} className="flex items-start">
                          <div className="flex-shrink-0 h-5 w-5 text-amber-600 mr-2">
                            <Check className="h-5 w-5" />
                          </div>
                          <p className="text-sm">{item}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div className="bg-orange-50 p-4 rounded-md border border-orange-200">
                    <h4 className="text-lg font-semibold mb-2">Vaccination Requirements</h4>
                    <div className="space-y-4">
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="vaccinated"
                          {...form.register("vaccinated")}
                        />
                        <Label htmlFor="vaccinated">
                          My puppy has had two vaccinations (latest from vet) before starting classes
                        </Label>
                      </div>
                      
                      <div>
                        <Label htmlFor="lastVaccinationDate">Date of last vaccination:</Label>
                        <Input 
                          id="lastVaccinationDate"
                          type="date"
                          {...form.register("lastVaccinationDate")}
                          className="mt-1 w-full md:w-1/2"
                        />
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="vetClearanceLetter"
                          {...form.register("vetClearanceLetter")}
                        />
                        <Label htmlFor="vetClearanceLetter">
                          My vet has given me clearance to bring my puppy to class
                        </Label>
                      </div>
                    </div>
                  </div>
                  
                  <Separator />
                  
                  <div className="bg-green-50 p-4 rounded-md border border-green-200">
                    <h4 className="text-lg font-semibold mb-2">Terms and Agreements</h4>
                    <div className="space-y-4">
                      <div className="flex items-start space-x-2">
                        <Checkbox
                          id="whatsAppPermission"
                          {...form.register("whatsAppPermission")}
                          className="mt-1"
                        />
                        <Label htmlFor="whatsAppPermission" className="text-sm">
                          I give permission to be added to the class WhatsApp group for class updates and information
                        </Label>
                      </div>
                      
                      <div className="flex items-start space-x-2">
                        <Checkbox
                          id="photoPermission"
                          {...form.register("photoPermission")}
                          className="mt-1"
                        />
                        <Label htmlFor="photoPermission" className="text-sm">
                          I give permission for photos of my dog in class to be used on social media and marketing materials
                        </Label>
                      </div>
                      
                      <div className="flex items-start space-x-2">
                        <Checkbox
                          id="offleaseSocializingAgreement"
                          {...form.register("offleaseSocializingAgreement")}
                          className="mt-1"
                        />
                        <Label htmlFor="offleaseSocializingAgreement" className="text-sm">
                          I understand that puppy socializing is conducted off-lead and that my pup may get dirty during play
                        </Label>
                      </div>
                      
                      <div className="flex items-start space-x-2">
                        <Checkbox
                          id="equipmentAgreement"
                          {...form.register("equipmentAgreement")}
                          className="mt-1"
                        />
                        <Label htmlFor="equipmentAgreement" className="text-sm">
                          I agree to only use equipment recommended by the trainer
                        </Label>
                      </div>
                      
                      <div className="flex items-start space-x-2">
                        <Checkbox
                          id="trainingTreatsAgreement"
                          {...form.register("trainingTreatsAgreement")}
                          className="mt-1"
                        />
                        <Label htmlFor="trainingTreatsAgreement" className="text-sm">
                          I agree to bring suitable training treats to each class
                        </Label>
                      </div>
                      
                      <div className="flex items-start space-x-2">
                        <Checkbox
                          id="wasteDisposalAgreement"
                          {...form.register("wasteDisposalAgreement")}
                          className="mt-1"
                        />
                        <Label htmlFor="wasteDisposalAgreement" className="text-sm">
                          I agree to clean up after my dog and dispose of waste properly
                        </Label>
                      </div>
                      
                      <div className="flex items-start space-x-2">
                        <Checkbox
                          id="termsAgreement"
                          {...form.register("termsAgreement")}
                          className="mt-1"
                        />
                        <Label htmlFor="termsAgreement" className="text-sm font-bold">
                          I agree to the terms and conditions of McKaynine Training Centre
                        </Label>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="mt-8 flex justify-end">
                  <Button 
                    type="submit" 
                    disabled={isSubmitting}
                    className="bg-mckaynine-600 hover:bg-mckaynine-700"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Submitting...
                      </>
                    ) : (
                      "Submit Registration"
                    )}
                  </Button>
                </div>
              </div>
            </form>
          </Form>
        </div>
      </div>
    </DashboardLayout>
  );
}
