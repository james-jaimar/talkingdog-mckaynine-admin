
import React from "react";
import { Separator } from "@/components/ui/separator";

interface PuppyClassLayoutProps {
  children: React.ReactNode;
}

export function PuppyClassLayout({ children }: PuppyClassLayoutProps) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-6">
      <div className="text-center space-y-4">
        <h2 className="text-2xl font-bold text-mckaynine-700">McKaynine Training Centre</h2>
        <h3 className="text-xl font-semibold">PUPPY CLASS REGISTRATION FORM</h3>
        <p className="text-sm text-gray-600">
          Please complete this form and return it to us before the first day of class.
        </p>
      </div>
      
      <Separator className="my-6" />
      
      {children}
      
      <div className="text-center text-sm text-gray-500 pt-4">
        <p>Thank you for registering your puppy with McKaynine Training Centre.</p>
        <p>We look forward to helping you and your puppy on your training journey.</p>
      </div>
    </div>
  );
}
