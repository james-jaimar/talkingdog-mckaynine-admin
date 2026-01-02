
import React from "react";
import { Separator } from "@/components/ui/separator";

interface PuppyClassLayoutProps {
  children: React.ReactNode;
}

export function PuppyClassLayout({ children }: PuppyClassLayoutProps) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-6">
      <div className="text-center space-y-6">
        {/* McKaynine Logo and Header */}
        <div className="flex justify-center items-center">
          <img 
            src="/lovable-uploads/mckaynine_delta_long_2025.png" 
            alt="McKaynine Delta" 
            className="max-w-md h-auto"
          />
        </div>
        
        <h3 className="text-xl font-semibold">PUPPY CLASS REGISTRATION FORM</h3>
        
        {/* CCPDT Certification Logo */}
        <div className="flex justify-center mt-2">
          <img 
            src="/lovable-uploads/65ea046d-74b2-4869-ac94-40dd660880f4.png" 
            alt="CCPDT Certification Council" 
            className="h-16 object-contain"
          />
        </div>
        
        {/* Puppy Age Requirements Banner */}
        <div className="flex justify-center mt-4">
          <img 
            src="/lovable-uploads/a70bc5f3-b169-40c9-99d9-4f4fb073bf0c.png" 
            alt="Puppy Age Requirements" 
            className="max-w-full h-auto"
          />
        </div>
        
        <p className="text-sm text-gray-600">
          Please complete this form and return it to us before the first day of class.
        </p>
      </div>
      
      <Separator className="my-6" />
      
      {children}
      
      <div className="flex flex-col items-center space-y-6 mt-8">
        {/* What to Bring Banner */}
        <div className="w-full max-w-md">
          <img 
            src="/lovable-uploads/9479920e-e356-4ff5-b7e9-3dc4b3f5bae6.png" 
            alt="What to Bring" 
            className="max-w-full h-auto"
          />
        </div>
        
        {/* Weather Notice */}
        <div className="w-full max-w-xs">
          <img 
            src="/lovable-uploads/3df24b44-84c7-47e4-8559-30790479270c.png" 
            alt="Weather Notice" 
            className="max-w-full h-auto"
          />
        </div>
        
        {/* Looking Forward Banner */}
        <div className="w-full max-w-md mt-4">
          <img 
            src="/lovable-uploads/a5b4890b-5e18-443c-997a-6c73d37a6d3b.png" 
            alt="Looking Forward" 
            className="max-w-full h-auto"
          />
        </div>
        
        {/* Location Map */}
        <div className="w-full max-w-lg mt-6">
          <h4 className="text-lg font-semibold text-center mb-2">Our Location</h4>
          <img 
            src="/lovable-uploads/280e5335-4dfb-43f0-8e77-b077eb2a371b.png" 
            alt="McKaynine Location Map" 
            className="max-w-full h-auto rounded-lg border border-gray-300"
          />
        </div>
        
        <div className="text-center text-sm text-gray-500 pt-4">
          <p>Thank you for registering your puppy with McKaynine Training Centre.</p>
          <p>We look forward to helping you and your puppy on your training journey.</p>
        </div>
      </div>
      
      {/* Dog Training Images */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
        <img 
          src="/lovable-uploads/bf0f9016-aafa-484a-9a0a-7adff2afee2c.png" 
          alt="Dog and Owner" 
          className="rounded-lg h-auto w-full object-cover"
        />
        <img 
          src="/lovable-uploads/ed8379e7-33c8-4a58-aed2-42b44f26b6f1.png" 
          alt="Dog and Owner" 
          className="rounded-lg h-auto w-full object-cover"
        />
        <img 
          src="/lovable-uploads/1a8d18ae-422f-4c86-8118-3b8910831c3f.png" 
          alt="Dog Training Walk" 
          className="rounded-lg h-auto w-full object-cover"
        />
      </div>
    </div>
  );
}
