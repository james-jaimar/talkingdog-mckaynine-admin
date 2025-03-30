
import { useQuery } from "@tanstack/react-query";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Edit, Dog } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";

export default function HandlerDetail() {
  const { handlerId } = useParams();
  
  const { data: handler, isLoading } = useQuery({
    queryKey: ['handler', handlerId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('clients')
        .select(`
          id,
          first_name,
          last_name,
          email,
          phone,
          address,
          city,
          postal_code,
          notes,
          created_at,
          dogs (
            id,
            name,
            breed,
            age,
            weight,
            notes,
            behavior_notes,
            medical_notes,
            avatar_url
          )
        `)
        .eq('id', handlerId)
        .single();
      
      if (error) throw error;
      return data;
    }
  });

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="icon" asChild>
              <Link to="/handlers">
                <ArrowLeft className="h-4 w-4" />
              </Link>
            </Button>
            <h1 className="text-3xl font-bold text-gray-900">
              {isLoading ? 'Loading...' : `${handler?.first_name} ${handler?.last_name}`}
            </h1>
          </div>
          <Button variant="outline">
            <Edit className="h-4 w-4 mr-2" />
            Edit Handler
          </Button>
        </div>

        {isLoading ? (
          <div className="flex justify-center p-12">
            <div className="animate-pulse text-gray-500">Loading handler details...</div>
          </div>
        ) : handler ? (
          <div className="grid gap-6 grid-cols-1 lg:grid-cols-3">
            {/* Handler Information */}
            <Card className="lg:col-span-1 border border-gray-200 shadow-sm">
              <CardHeader className="bg-gray-50 border-b border-gray-200">
                <CardTitle>Handler Information</CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-4">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Email</p>
                    <p className="text-gray-900">{handler.email}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Phone</p>
                    <p className="text-gray-900">{handler.phone || "Not provided"}</p>
                  </div>
                  <Separator />
                  <div>
                    <p className="text-sm font-medium text-gray-500">Address</p>
                    <p className="text-gray-900">{handler.address || "Not provided"}</p>
                    {(handler.city || handler.postal_code) && (
                      <p className="text-gray-900">
                        {handler.city}{handler.city && handler.postal_code && ", "}{handler.postal_code}
                      </p>
                    )}
                  </div>
                  <Separator />
                  <div>
                    <p className="text-sm font-medium text-gray-500">Member Since</p>
                    <p className="text-gray-900">{new Date(handler.created_at).toLocaleDateString()}</p>
                  </div>
                  {handler.notes && (
                    <>
                      <Separator />
                      <div>
                        <p className="text-sm font-medium text-gray-500">Notes</p>
                        <p className="text-gray-900 whitespace-pre-line">{handler.notes}</p>
                      </div>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Dogs Information */}
            <Card className="lg:col-span-2 border border-gray-200 shadow-sm">
              <CardHeader className="bg-gray-50 border-b border-gray-200">
                <CardTitle>Dogs</CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                {handler.dogs && handler.dogs.length > 0 ? (
                  <div className="space-y-6">
                    {handler.dogs.map((dog) => (
                      <div key={dog.id} className="border rounded-lg overflow-hidden">
                        <div className="bg-gray-50 p-4 border-b flex justify-between items-center">
                          <div className="flex items-center space-x-3">
                            {dog.avatar_url ? (
                              <img 
                                src={dog.avatar_url} 
                                alt={dog.name} 
                                className="h-10 w-10 rounded-full object-cover"
                              />
                            ) : (
                              <div className="h-10 w-10 bg-mckaynine-100 text-mckaynine-600 rounded-full flex items-center justify-center">
                                <Dog className="h-6 w-6" />
                              </div>
                            )}
                            <div>
                              <h3 className="font-semibold">{dog.name}</h3>
                              <p className="text-sm text-gray-500">{dog.breed}</p>
                            </div>
                          </div>
                          <Button size="sm" variant="outline">View Details</Button>
                        </div>
                        <div className="p-4">
                          <Tabs defaultValue="basic">
                            <TabsList className="mb-4">
                              <TabsTrigger value="basic">Basic Info</TabsTrigger>
                              <TabsTrigger value="behavior">Behavior</TabsTrigger>
                              <TabsTrigger value="medical">Medical</TabsTrigger>
                            </TabsList>
                            <TabsContent value="basic" className="p-2">
                              <div className="grid grid-cols-2 gap-4">
                                {dog.age && (
                                  <div>
                                    <p className="text-sm font-medium text-gray-500">Age</p>
                                    <p>{dog.age} years</p>
                                  </div>
                                )}
                                {dog.weight && (
                                  <div>
                                    <p className="text-sm font-medium text-gray-500">Weight</p>
                                    <p>{dog.weight} lbs</p>
                                  </div>
                                )}
                                {dog.notes && (
                                  <div className="col-span-2">
                                    <p className="text-sm font-medium text-gray-500">Notes</p>
                                    <p className="whitespace-pre-line">{dog.notes}</p>
                                  </div>
                                )}
                              </div>
                            </TabsContent>
                            <TabsContent value="behavior" className="p-2">
                              {dog.behavior_notes ? (
                                <div>
                                  <p className="whitespace-pre-line">{dog.behavior_notes}</p>
                                </div>
                              ) : (
                                <p className="text-gray-500 italic">No behavior notes recorded</p>
                              )}
                            </TabsContent>
                            <TabsContent value="medical" className="p-2">
                              {dog.medical_notes ? (
                                <div>
                                  <p className="whitespace-pre-line">{dog.medical_notes}</p>
                                </div>
                              ) : (
                                <p className="text-gray-500 italic">No medical notes recorded</p>
                              )}
                            </TabsContent>
                          </Tabs>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Dog className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-lg font-medium">No dogs registered</h3>
                    <p className="mt-1 text-sm text-gray-500">
                      This handler doesn't have any dogs registered yet.
                    </p>
                    <Button className="mt-4" variant="outline">
                      Add Dog
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Upcoming Classes/Bookings can be added here as another card */}
          </div>
        ) : (
          <div className="text-center py-16">
            <h3 className="text-xl font-medium mb-2">Handler not found</h3>
            <p className="text-sm text-gray-500 mb-8">
              The handler you're looking for doesn't exist or has been removed.
            </p>
            <Button asChild variant="mckaynine">
              <Link to="/handlers">Back to Handlers</Link>
            </Button>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
