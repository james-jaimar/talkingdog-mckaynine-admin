
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { useClassesListData } from "@/hooks/useClassesListData";
import { Loader2 } from "lucide-react";

export function ClassesListReport() {
  const { data: classesData = [], isLoading } = useClassesListData();

  if (isLoading) {
    return (
      <Card className="w-full">
        <CardContent className="flex items-center justify-center h-36">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Classes List</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {classesData.map((classGroup) => (
            <div key={classGroup.className} className="border rounded-lg">
              <div className="bg-muted p-4 rounded-t-lg">
                <h3 className="text-lg font-bold">{classGroup.className}</h3>
              </div>
              <div className="divide-y">
                {classGroup.handlers.map((handler) => (
                  <div key={`${handler.clientId}-${handler.dogId}`} className="p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium">
                          {handler.clientName}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {handler.dogName} ({handler.dogBreed})
                        </p>
                      </div>
                      <div className="text-right">
                        <div className={`text-sm ${handler.paymentStatus === 'paid' ? 'text-green-600' : 'text-red-600'}`}>
                          {handler.paymentStatus === 'paid' ? 'Paid' : 'Unpaid'}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Attendance: {handler.attendanceCount} / {handler.totalClasses}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
