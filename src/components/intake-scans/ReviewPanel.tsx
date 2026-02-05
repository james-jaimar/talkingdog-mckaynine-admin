import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScanProcessingJob, ExtractedData, ExtractedDog, ConfidenceLevel } from "./types";
import { ConfidenceIndicator } from "./ConfidenceIndicator";
import { ScanViewer, ScanThumbnail } from "./ScanViewer";
import { Eye, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface ReviewPanelProps {
  job: ScanProcessingJob | null;
  onUpdateData: (data: ExtractedData) => void;
}

export function ReviewPanel({ job, onUpdateData }: ReviewPanelProps) {
  const [viewerOpen, setViewerOpen] = useState(false);
  const [activeDogTab, setActiveDogTab] = useState("0");

  if (!job) {
    return (
      <Card className="h-full flex items-center justify-center">
        <CardContent className="text-center text-muted-foreground">
          <p>Select a job from the queue to review</p>
        </CardContent>
      </Card>
    );
  }

  if (job.status === 'queued') {
    return (
      <Card className="h-full flex items-center justify-center">
        <CardContent className="text-center text-muted-foreground">
          <p>This job hasn't been processed yet.</p>
          <p className="text-sm mt-2">Click the play button to extract data.</p>
        </CardContent>
      </Card>
    );
  }

  if (job.status === 'processing') {
    return (
      <Card className="h-full flex items-center justify-center">
        <CardContent className="text-center text-muted-foreground">
          <p>Processing... Please wait.</p>
        </CardContent>
      </Card>
    );
  }

  if (job.status === 'error') {
    return (
      <Card className="h-full flex items-center justify-center">
        <CardContent className="text-center">
          <p className="text-destructive font-medium">Extraction Failed</p>
          <p className="text-sm text-muted-foreground mt-2">{job.error_message || 'Unknown error'}</p>
        </CardContent>
      </Card>
    );
  }

  const data = job.extracted_data;
  if (!data) {
    return (
      <Card className="h-full flex items-center justify-center">
        <CardContent className="text-center text-muted-foreground">
          <p>No extracted data available</p>
        </CardContent>
      </Card>
    );
  }

  const getConfidence = (fieldPath: string): ConfidenceLevel => {
    return job.field_confidence?.[fieldPath] || 'high';
  };

  const updateOwnerField = (field: keyof typeof data.owner, value: string) => {
    onUpdateData({
      ...data,
      owner: { ...data.owner, [field]: value }
    });
  };

  const updateDogField = (dogIndex: number, field: keyof ExtractedDog, value: any) => {
    const updatedDogs = [...data.dogs];
    updatedDogs[dogIndex] = { ...updatedDogs[dogIndex], [field]: value };
    onUpdateData({ ...data, dogs: updatedDogs });
  };

  const updateDogSocialBehavior = (dogIndex: number, field: string, value: string) => {
    const updatedDogs = [...data.dogs];
    updatedDogs[dogIndex] = {
      ...updatedDogs[dogIndex],
      social_behavior: { ...updatedDogs[dogIndex].social_behavior, [field]: value }
    };
    onUpdateData({ ...data, dogs: updatedDogs });
  };

  const updateDogAcknowledgement = (dogIndex: number, field: string, value: boolean) => {
    const updatedDogs = [...data.dogs];
    updatedDogs[dogIndex] = {
      ...updatedDogs[dogIndex],
      acknowledgements: { ...updatedDogs[dogIndex].acknowledgements, [field]: value }
    };
    onUpdateData({ ...data, dogs: updatedDogs });
  };

  return (
    <>
      <Card className="h-full flex flex-col">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center justify-between">
            <span>Review & Edit</span>
            <div className="flex items-center gap-2">
              <ScanThumbnail
                fileUrl={job.file_url}
                filename={job.filename}
                onClick={() => setViewerOpen(true)}
              />
              <Button variant="outline" size="sm" onClick={() => setViewerOpen(true)}>
                <Eye className="h-4 w-4 mr-1" />
                View Scan
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="flex-1 overflow-hidden">
          <Tabs defaultValue="owner" className="h-full flex flex-col">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="owner">Owner</TabsTrigger>
              <TabsTrigger value="dogs">Dogs ({data.dogs.length})</TabsTrigger>
              <TabsTrigger value="permissions">Permissions</TabsTrigger>
              <TabsTrigger value="signature">Signature</TabsTrigger>
            </TabsList>

            <ScrollArea className="flex-1 mt-4">
              {/* Owner Tab */}
              <TabsContent value="owner" className="mt-0 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    label="First Name"
                    value={data.owner.first_name}
                    onChange={(v) => updateOwnerField('first_name', v)}
                    confidence={getConfidence('owner.first_name')}
                    required
                  />
                  <FormField
                    label="Last Name"
                    value={data.owner.last_name}
                    onChange={(v) => updateOwnerField('last_name', v)}
                    confidence={getConfidence('owner.last_name')}
                  />
                </div>
                <FormField
                  label="Email"
                  value={data.owner.email}
                  onChange={(v) => updateOwnerField('email', v)}
                  confidence={getConfidence('owner.email')}
                  required
                  type="email"
                />
                <FormField
                  label="Phone"
                  value={data.owner.phone}
                  onChange={(v) => updateOwnerField('phone', v)}
                  confidence={getConfidence('owner.phone')}
                />
                <FormField
                  label="Account Holder Name"
                  value={data.owner.account_holder_name}
                  onChange={(v) => updateOwnerField('account_holder_name', v)}
                  confidence={getConfidence('owner.account_holder_name')}
                />
                <FormField
                  label="Occupation"
                  value={data.owner.occupation}
                  onChange={(v) => updateOwnerField('occupation', v)}
                  confidence={getConfidence('owner.occupation')}
                />
                <FormField
                  label="Vet Name"
                  value={data.owner.vet_name}
                  onChange={(v) => updateOwnerField('vet_name', v)}
                  confidence={getConfidence('owner.vet_name')}
                />
              </TabsContent>

              {/* Dogs Tab */}
              <TabsContent value="dogs" className="mt-0">
                {data.dogs.length > 1 && (
                  <TabsList className="mb-4">
                    {data.dogs.map((_, idx) => (
                      <TabsTrigger
                        key={idx}
                        value={String(idx)}
                        onClick={() => setActiveDogTab(String(idx))}
                        className={activeDogTab === String(idx) ? 'bg-accent' : ''}
                      >
                        Dog {idx + 1}
                      </TabsTrigger>
                    ))}
                  </TabsList>
                )}

                {data.dogs.map((dog, dogIndex) => (
                  <div
                    key={dogIndex}
                    className={cn(
                      "space-y-4",
                      data.dogs.length > 1 && activeDogTab !== String(dogIndex) && "hidden"
                    )}
                  >
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        label="Dog Name"
                        value={dog.name}
                        onChange={(v) => updateDogField(dogIndex, 'name', v)}
                        confidence={getConfidence(`dogs.${dogIndex}.name`)}
                        required
                      />
                      <FormField
                        label="Breed"
                        value={dog.breed}
                        onChange={(v) => updateDogField(dogIndex, 'breed', v)}
                        confidence={getConfidence(`dogs.${dogIndex}.breed`)}
                        required
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        label="Date of Birth"
                        value={dog.date_of_birth}
                        onChange={(v) => updateDogField(dogIndex, 'date_of_birth', v)}
                        confidence={getConfidence(`dogs.${dogIndex}.date_of_birth`)}
                        type="date"
                      />
                      <div>
                        <Label className="flex items-center gap-2">
                          Gender
                          <ConfidenceIndicator level={getConfidence(`dogs.${dogIndex}.gender`)} />
                        </Label>
                        <Select
                          value={dog.gender}
                          onValueChange={(v) => updateDogField(dogIndex, 'gender', v)}
                        >
                          <SelectTrigger className="mt-1">
                            <SelectValue placeholder="Select gender" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="male">Male</SelectItem>
                            <SelectItem value="female">Female</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div>
                      <Label className="flex items-center gap-2">
                        Spay/Neuter Status
                        <ConfidenceIndicator level={getConfidence(`dogs.${dogIndex}.spay_neuter_status`)} />
                      </Label>
                      <Select
                        value={dog.spay_neuter_status}
                        onValueChange={(v) => updateDogField(dogIndex, 'spay_neuter_status', v)}
                      >
                        <SelectTrigger className="mt-1">
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="When old enough">When old enough</SelectItem>
                          <SelectItem value="Already done">Already done</SelectItem>
                          <SelectItem value="Not planning to">Not planning to</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="flex items-center gap-2">
                          Acquired From
                          <ConfidenceIndicator level={getConfidence(`dogs.${dogIndex}.acquired_from`)} />
                        </Label>
                        <Select
                          value={dog.acquired_from}
                          onValueChange={(v) => updateDogField(dogIndex, 'acquired_from', v)}
                        >
                          <SelectTrigger className="mt-1">
                            <SelectValue placeholder="Select source" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="KUSA breeder">KUSA breeder</SelectItem>
                            <SelectItem value="Breeder">Breeder</SelectItem>
                            <SelectItem value="Rescue">Rescue</SelectItem>
                            <SelectItem value="Shelter">Shelter</SelectItem>
                            <SelectItem value="SPCA/AACL">SPCA/AACL</SelectItem>
                            <SelectItem value="Rescue org">Rescue org</SelectItem>
                            <SelectItem value="Family/friends">Family/friends</SelectItem>
                            <SelectItem value="Advert">Advert</SelectItem>
                            <SelectItem value="Born in home">Born in home</SelectItem>
                            <SelectItem value="Stray">Stray</SelectItem>
                            <SelectItem value="Other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label className="flex items-center gap-2">
                          Age at Acquisition
                          <ConfidenceIndicator level={getConfidence(`dogs.${dogIndex}.age_at_acquisition`)} />
                        </Label>
                        <Select
                          value={dog.age_at_acquisition}
                          onValueChange={(v) => updateDogField(dogIndex, 'age_at_acquisition', v)}
                        >
                          <SelectTrigger className="mt-1">
                            <SelectValue placeholder="Select age" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Less than 2 months">Less than 2 months</SelectItem>
                            <SelectItem value="2-4 months">2-4 months</SelectItem>
                            <SelectItem value="4-12 months">4-12 months</SelectItem>
                            <SelectItem value="Older than 1 year">Older than 1 year</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="flex items-center gap-2">
                          Children at Home
                          <ConfidenceIndicator level={getConfidence(`dogs.${dogIndex}.children_at_home`)} />
                        </Label>
                        <Select
                          value={dog.children_at_home}
                          onValueChange={(v) => updateDogField(dogIndex, 'children_at_home', v)}
                        >
                          <SelectTrigger className="mt-1">
                            <SelectValue placeholder="Select" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Babies/toddlers">Babies/Toddlers</SelectItem>
                            <SelectItem value="Children">Children</SelectItem>
                            <SelectItem value="Teenagers">Teenagers</SelectItem>
                            <SelectItem value="None">None</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label className="flex items-center gap-2">
                          Other Pets at Home
                          <ConfidenceIndicator level={getConfidence(`dogs.${dogIndex}.other_pets`)} />
                        </Label>
                        <Select
                          value={Array.isArray(dog.other_pets) && dog.other_pets.length > 0 
                            ? (typeof dog.other_pets[0] === 'string' ? dog.other_pets[0] : 'none')
                            : 'none'}
                          onValueChange={(v) => updateDogField(dogIndex, 'other_pets', v === 'none' ? [] : [v])}
                        >
                          <SelectTrigger className="mt-1">
                            <SelectValue placeholder="Select" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="dogs">Dog/s</SelectItem>
                            <SelectItem value="cats">Cat/s</SelectItem>
                            <SelectItem value="dogs_and_cats">Dogs and cats</SelectItem>
                            <SelectItem value="birds">Bird/s</SelectItem>
                            <SelectItem value="livestock">Livestock</SelectItem>
                            <SelectItem value="none">None</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    
                    <div className="border-t pt-4 mt-4">
                      <h4 className="font-medium mb-3">Social Behavior</h4>
                      <div className="grid grid-cols-3 gap-4">
                        <div>
                          <Label>With Dogs</Label>
                          <Select
                            value={dog.social_behavior?.with_dogs || ''}
                            onValueChange={(v) => updateDogSocialBehavior(dogIndex, 'with_dogs', v)}
                          >
                            <SelectTrigger className="mt-1">
                              <SelectValue placeholder="Select" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Great">Great</SelectItem>
                              <SelectItem value="OK">OK</SelectItem>
                              <SelectItem value="Not good">Not good</SelectItem>
                              <SelectItem value="Unknown">Unknown</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label>With Animals</Label>
                          <Select
                            value={dog.social_behavior?.with_other_animals || ''}
                            onValueChange={(v) => updateDogSocialBehavior(dogIndex, 'with_other_animals', v)}
                          >
                            <SelectTrigger className="mt-1">
                              <SelectValue placeholder="Select" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Great">Great</SelectItem>
                              <SelectItem value="OK">OK</SelectItem>
                              <SelectItem value="Not good">Not good</SelectItem>
                              <SelectItem value="Unknown">Unknown</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label>With People</Label>
                          <Select
                            value={dog.social_behavior?.with_people || ''}
                            onValueChange={(v) => updateDogSocialBehavior(dogIndex, 'with_people', v)}
                          >
                            <SelectTrigger className="mt-1">
                              <SelectValue placeholder="Select" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Great">Great</SelectItem>
                              <SelectItem value="OK">OK</SelectItem>
                              <SelectItem value="Not good">Not good</SelectItem>
                              <SelectItem value="Unknown">Unknown</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div className="mt-3">
                        <Label>Details / Notes</Label>
                        <Input
                          value={dog.social_behavior?.details || ''}
                          onChange={(e) => updateDogSocialBehavior(dogIndex, 'details', e.target.value)}
                          placeholder="e.g., Bit rough with dogs, fine with most people"
                          className="mt-1"
                        />
                      </div>
                    </div>

                    <div className="border-t pt-4 mt-4">
                      <h4 className="font-medium mb-3">Training & Health</h4>
                      <div>
                        <Label className="flex items-center gap-2">
                          Training Goal
                          <ConfidenceIndicator level={getConfidence(`dogs.${dogIndex}.training_goal`)} />
                        </Label>
                        <Select
                          value={dog.training_goal || 'Chilled canine companion'}
                          onValueChange={(v) => updateDogField(dogIndex, 'training_goal', v)}
                        >
                          <SelectTrigger className="mt-1">
                            <SelectValue placeholder="Select goal" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Competitive dog sport">🏆 Competitive Dog Sport</SelectItem>
                            <SelectItem value="Chilled canine companion">🛋️ Chilled Canine Companion</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="flex items-center gap-4 mt-4">
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={dog.has_behavior_problems}
                            onCheckedChange={(v) => updateDogField(dogIndex, 'has_behavior_problems', v)}
                          />
                          <Label>Has Behavior Problems</Label>
                        </div>
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={dog.has_health_problems}
                            onCheckedChange={(v) => updateDogField(dogIndex, 'has_health_problems', v)}
                          />
                          <Label>Has Health Problems</Label>
                        </div>
                      </div>
                      {dog.has_behavior_problems && (
                        <FormField
                          label="Behavior Problems Details"
                          value={dog.behavior_problems_details}
                          onChange={(v) => updateDogField(dogIndex, 'behavior_problems_details', v)}
                          confidence={getConfidence(`dogs.${dogIndex}.behavior_problems_details`)}
                          multiline
                          className="mt-3"
                        />
                      )}
                      {dog.has_health_problems && (
                        <FormField
                          label="Health Problems Details"
                          value={dog.health_problems_details}
                          onChange={(v) => updateDogField(dogIndex, 'health_problems_details', v)}
                          confidence={getConfidence(`dogs.${dogIndex}.health_problems_details`)}
                          multiline
                          className="mt-3"
                        />
                      )}
                    </div>

                    <div className="border-t pt-4 mt-4">
                      <h4 className="font-medium mb-3">Class Enrollment</h4>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label>Class Type</Label>
                          <Select
                            value={dog.class_type}
                            onValueChange={(v) => updateDogField(dogIndex, 'class_type', v)}
                          >
                            <SelectTrigger className="mt-1">
                              <SelectValue placeholder="Select class" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Puppy">Puppy</SelectItem>
                              <SelectItem value="EO">EO</SelectItem>
                              <SelectItem value="CGC Bronze">CGC Bronze</SelectItem>
                              <SelectItem value="CGC Silver">CGC Silver</SelectItem>
                              <SelectItem value="Beginner">Beginner</SelectItem>
                              <SelectItem value="Novice">Novice</SelectItem>
                              <SelectItem value="WT">WT</SelectItem>
                              <SelectItem value="A-Test">A-Test</SelectItem>
                              <SelectItem value="Yoga">Yoga</SelectItem>
                              <SelectItem value="Other">Other</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <FormField
                          label="Branch"
                          value={dog.branch_name}
                          onChange={(v) => updateDogField(dogIndex, 'branch_name', v)}
                          confidence={getConfidence(`dogs.${dogIndex}.branch_name`)}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </TabsContent>

              {/* Permissions Tab */}
              <TabsContent value="permissions" className="mt-0 space-y-4">
                {data.dogs.map((dog, dogIndex) => (
                  <div key={dogIndex} className="space-y-4">
                    {data.dogs.length > 1 && (
                      <h4 className="font-medium">Dog {dogIndex + 1}: {dog.name}</h4>
                    )}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>WhatsApp Permission</Label>
                        <Select
                          value={dog.whatsapp_permission}
                          onValueChange={(v) => updateDogField(dogIndex, 'whatsapp_permission', v)}
                        >
                          <SelectTrigger className="mt-1">
                            <SelectValue placeholder="Select" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="yes">Yes</SelectItem>
                            <SelectItem value="no">No</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>Photo Permission</Label>
                        <Select
                          value={dog.photo_permission}
                          onValueChange={(v) => updateDogField(dogIndex, 'photo_permission', v)}
                        >
                          <SelectTrigger className="mt-1">
                            <SelectValue placeholder="Select" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="yes">Yes</SelectItem>
                            <SelectItem value="yes_not_minors">Yes, but not minors</SelectItem>
                            <SelectItem value="no">No</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    
                    <div className="border-t pt-4 mt-4">
                      <h4 className="font-medium mb-3">How Did You Hear About Us?</h4>
                      <div className="flex flex-wrap gap-2">
                        {['Google', 'Vet', 'Friends/Family', 'Breeder/Shelter', 'Been Before'].map((source) => {
                          const sourceKey = source.toLowerCase().replace(/[^a-z]/g, '_');
                          const isSelected = Array.isArray(dog.heard_from) && dog.heard_from.includes(source);
                          return (
                            <button
                              key={source}
                              type="button"
                              onClick={() => {
                                const current = Array.isArray(dog.heard_from) ? dog.heard_from : [];
                                const updated = isSelected
                                  ? current.filter(s => s !== source)
                                  : [...current, source];
                                updateDogField(dogIndex, 'heard_from', updated);
                              }}
                              className={`px-3 py-1.5 rounded-full border text-sm transition-colors ${
                                isSelected
                                  ? 'bg-primary text-primary-foreground border-primary'
                                  : 'bg-background border-input hover:bg-accent'
                              }`}
                            >
                              {isSelected && <span className="mr-1">✓</span>}
                              {source}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div className="border-t pt-4 mt-4">
                      <h4 className="font-medium mb-3">Acknowledgements</h4>
                      <div className="space-y-3">
                        {[
                          { key: 'training_equipment', label: 'Training Equipment' },
                          { key: 'treats', label: 'Treats Policy' },
                          { key: 'waste_disposal', label: 'Waste Disposal' },
                          { key: 'onlead_socializing', label: 'On-Lead Socializing' },
                          { key: 'equipment_supervision', label: 'Equipment Supervision' }
                        ].map(({ key, label }) => (
                          <div key={key} className="flex items-center gap-2">
                            <Switch
                              checked={dog.acknowledgements?.[key as keyof typeof dog.acknowledgements] || false}
                              onCheckedChange={(v) => updateDogAcknowledgement(dogIndex, key, v)}
                            />
                            <Label>{label}</Label>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </TabsContent>

              {/* Signature Tab */}
              <TabsContent value="signature" className="mt-0 space-y-4">
                {data.dogs.map((dog, dogIndex) => (
                  <div key={dogIndex} className="space-y-4">
                    {data.dogs.length > 1 && (
                      <h4 className="font-medium">Dog {dogIndex + 1}: {dog.name}</h4>
                    )}
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        label="Signer Name"
                        value={dog.signature_name}
                        onChange={(v) => updateDogField(dogIndex, 'signature_name', v)}
                        confidence={getConfidence(`dogs.${dogIndex}.signature_name`)}
                      />
                      <FormField
                        label="Signed Date"
                        value={dog.signature_date}
                        onChange={(v) => updateDogField(dogIndex, 'signature_date', v)}
                        confidence={getConfidence(`dogs.${dogIndex}.signature_date`)}
                        type="date"
                      />
                    </div>
                  </div>
                ))}
              </TabsContent>
            </ScrollArea>
          </Tabs>
        </CardContent>
      </Card>

      <ScanViewer
        fileUrl={job.file_url}
        filename={job.filename}
        isOpen={viewerOpen}
        onClose={() => setViewerOpen(false)}
      />
    </>
  );
}

// Helper component for form fields with local state to prevent keystroke lag
interface FormFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  confidence?: ConfidenceLevel;
  required?: boolean;
  type?: 'text' | 'email' | 'date';
  multiline?: boolean;
  className?: string;
}

function FormField({ 
  label, 
  value, 
  onChange, 
  confidence = 'high', 
  required = false, 
  type = 'text',
  multiline = false,
  className 
}: FormFieldProps) {
  // Use local state for immediate responsiveness
  const [localValue, setLocalValue] = useState(value || '');
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastSentValueRef = useRef(value || '');
  const isFocusedRef = useRef(false);
  
  // Only sync when external value changes AND we're not focused (user not typing)
  useEffect(() => {
    // Don't override local state while user is actively typing
    if (!isFocusedRef.current && value !== lastSentValueRef.current) {
      setLocalValue(value || '');
      lastSentValueRef.current = value || '';
    }
  }, [value]);
  
  const handleChange = (newValue: string) => {
    // Update local state immediately for responsive typing
    setLocalValue(newValue);
    
    // Debounce the parent update
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    timeoutRef.current = setTimeout(() => {
      lastSentValueRef.current = newValue;
      onChange(newValue);
    }, 300);
  };
  
  const handleFocus = () => {
    isFocusedRef.current = true;
  };
  
  const handleBlur = () => {
    isFocusedRef.current = false;
    // Sync with parent on blur if there's a pending value
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      lastSentValueRef.current = localValue;
      onChange(localValue);
    }
  };
  
  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return (
    <div className={className}>
      <Label className="flex items-center gap-2">
        {label}
        {required && <span className="text-destructive">*</span>}
        <ConfidenceIndicator level={confidence} />
      </Label>
      {multiline ? (
        <Textarea
          value={localValue}
          onChange={(e) => handleChange(e.target.value)}
          onFocus={handleFocus}
          onBlur={handleBlur}
          className="mt-1"
          rows={3}
        />
      ) : (
        <Input
          type={type}
          value={localValue}
          onChange={(e) => handleChange(e.target.value)}
          onFocus={handleFocus}
          onBlur={handleBlur}
          className="mt-1"
        />
      )}
    </div>
  );
}