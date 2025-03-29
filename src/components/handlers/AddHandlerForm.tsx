
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useQueryClient } from "@tanstack/react-query";

const formSchema = z.object({
  firstName: z.string().min(2, {
    message: "First name must be at least 2 characters.",
  }),
  lastName: z.string().min(2, {
    message: "Last name must be at least 2 characters.",
  }),
  email: z.string().email({
    message: "Please enter a valid email address.",
  }),
  phone: z.string().optional(),
  dogName: z.string().min(1, {
    message: "Dog name is required.",
  }),
  breed: z.string().min(1, {
    message: "Breed is required.",
  }),
  dogDob: z.string().optional(),
  assessment: z.string().optional(),
  comments: z.string().optional(),
  whatsApp: z.boolean().default(false),
  photoPermission: z.boolean().default(false),
  classEnrollment: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface AddHandlerFormProps {
  onSuccess: () => void;
}

export function AddHandlerForm({ onSuccess }: AddHandlerFormProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const queryClient = useQueryClient();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      dogName: "",
      breed: "",
      dogDob: "",
      assessment: "",
      comments: "",
      whatsApp: false,
      photoPermission: false,
      classEnrollment: "",
    },
  });

  const classOptions = [
    { value: "puppy", label: "PUPPY" },
    { value: "eo", label: "EO" },
    { value: "bronze_cgc", label: "BRONZE CGC" },
    { value: "silver_cgc", label: "SILVER CGC" },
    { value: "beginner", label: "BEGINNER" },
    { value: "novice", label: "NOVICE" },
    { value: "wt_a_test", label: "WT/A-TEST" },
    { value: "yoga", label: "YOGA" },
  ];

  async function onSubmit(data: FormValues) {
    setIsSubmitting(true);

    try {
      // Insert client data
      const { data: clientData, error: clientError } = await supabase
        .from("clients")
        .insert({
          first_name: data.firstName,
          last_name: data.lastName,
          email: data.email,
          phone: data.phone,
          notes: data.comments || null,
        })
        .select("id")
        .single();

      if (clientError) throw clientError;

      // Insert dog data
      const { error: dogError } = await supabase.from("dogs").insert({
        name: data.dogName,
        breed: data.breed,
        client_id: clientData.id,
        behavior_notes: data.assessment || null,
        notes: `${data.classEnrollment ? `Class: ${data.classEnrollment}` : ""}
WhatsApp: ${data.whatsApp ? "Yes" : "No"}
Photo Permission: ${data.photoPermission ? "Yes" : "No"}`,
      });

      if (dogError) throw dogError;

      toast({
        title: "Handler added successfully",
        description: "The new handler and dog have been added to the system.",
      });

      // Refresh the handlers list
      queryClient.invalidateQueries({ queryKey: ["handlers"] });
      
      // Close the modal
      onSuccess();
    } catch (error) {
      console.error("Error adding handler:", error);
      toast({
        title: "Failed to add handler",
        description: "There was an error adding the handler. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="firstName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>First Name</FormLabel>
                <FormControl>
                  <Input placeholder="John" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="lastName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Last Name</FormLabel>
                <FormControl>
                  <Input placeholder="Doe" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input type="email" placeholder="john.doe@example.com" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="phone"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Phone Number</FormLabel>
              <FormControl>
                <Input placeholder="+1 (123) 456-7890" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="dogName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Dog's Name</FormLabel>
                <FormControl>
                  <Input placeholder="Buddy" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="breed"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Breed</FormLabel>
                <FormControl>
                  <Input placeholder="Golden Retriever" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="dogDob"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Date of Birth</FormLabel>
              <FormControl>
                <Input type="date" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="assessment"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Assessment</FormLabel>
              <FormControl>
                <Textarea placeholder="General assessment notes" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="classEnrollment"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Class Enrollment</FormLabel>
              <FormControl>
                <RadioGroup
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                  className="grid grid-cols-2 gap-2"
                >
                  {classOptions.map((option) => (
                    <FormItem key={option.value} className="flex items-center space-x-2 space-y-0">
                      <FormControl>
                        <RadioGroupItem value={option.value} />
                      </FormControl>
                      <FormLabel className="font-normal">{option.label}</FormLabel>
                    </FormItem>
                  ))}
                </RadioGroup>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="comments"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Comments</FormLabel>
              <FormControl>
                <Textarea placeholder="Additional comments" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex flex-col space-y-4">
          <FormField
            control={form.control}
            name="whatsApp"
            render={({ field }) => (
              <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
                <div className="space-y-1 leading-none">
                  <FormLabel>WhatsApp</FormLabel>
                </div>
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="photoPermission"
            render={({ field }) => (
              <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
                <div className="space-y-1 leading-none">
                  <FormLabel>Photo Permission</FormLabel>
                </div>
              </FormItem>
            )}
          />
        </div>

        <Button
          type="submit"
          className="w-full bg-mckaynine-600 hover:bg-mckaynine-700"
          disabled={isSubmitting}
        >
          {isSubmitting ? "Adding Handler..." : "Add Handler"}
        </Button>
      </form>
    </Form>
  );
}
