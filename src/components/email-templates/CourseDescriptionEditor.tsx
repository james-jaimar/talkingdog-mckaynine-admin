import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Trash2 } from "lucide-react";

export interface CourseDescription {
  title: string;
  items: string; // newline-separated bullet points
}

interface CourseDescriptionEditorProps {
  descriptions: CourseDescription[];
  onChange: (descriptions: CourseDescription[]) => void;
}

export function CourseDescriptionEditor({ descriptions, onChange }: CourseDescriptionEditorProps) {
  const updateDescription = (index: number, field: keyof CourseDescription, value: string) => {
    const updated = [...descriptions];
    updated[index] = { ...updated[index], [field]: value };
    onChange(updated);
  };

  const addDescription = () => {
    onChange([...descriptions, { title: "", items: "" }]);
  };

  const removeDescription = (index: number) => {
    if (descriptions.length <= 1) return;
    onChange(descriptions.filter((_, i) => i !== index));
  };

  return (
    <Card className="border-green-200 bg-green-50/30">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-[#2c5530]" />
          Course Descriptions
          <span className="text-xs text-muted-foreground font-normal">
            — Each course gets a bullet-point list
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {descriptions.map((desc, index) => (
          <div key={index} className="border rounded-lg p-3 bg-background space-y-2">
            <div className="flex items-center justify-between">
              <div className="space-y-1 flex-1 mr-2">
                <Label className="text-xs">Course Title</Label>
                <Input
                  value={desc.title}
                  onChange={(e) => updateDescription(index, "title", e.target.value)}
                  placeholder="e.g. Novice Obedience"
                  className="h-8 text-sm"
                />
              </div>
              {descriptions.length > 1 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeDescription(index)}
                  className="text-destructive hover:text-destructive h-7 w-7 p-0 mt-5"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              )}
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Bullet Points (one per line)</Label>
              <Textarea
                value={desc.items}
                onChange={(e) => updateDescription(index, "items", e.target.value)}
                placeholder={"Heel on a loose lead, including left, right, and about turns\nSit Stay, recall to the front, return to heel off lead\nRetrieve article off lead"}
                className="text-sm min-h-[80px]"
                rows={4}
              />
            </div>
          </div>
        ))}

        <Button variant="outline" size="sm" onClick={addDescription} className="w-full">
          <Plus className="h-3.5 w-3.5 mr-1" />
          Add Another Course Description
        </Button>
      </CardContent>
    </Card>
  );
}

/**
 * Generate styled HTML from structured course descriptions
 */
export function generateCourseDescriptionHtml(descriptions: CourseDescription[]): string {
  if (!descriptions.length || descriptions.every(d => !d.title && !d.items)) return "";

  return descriptions
    .filter(d => d.title || d.items)
    .map(desc => {
      const items = desc.items
        .split("\n")
        .filter(Boolean)
        .map(item => `      <li>${item.trim()}</li>`)
        .join("\n");

      return `<div style="margin: 20px 0;">
    <h4 style="color: #2c5530; margin-bottom: 10px;">Course Description - ${desc.title}:</h4>
    <ul style="margin: 0; padding-left: 20px; color: #444;">
${items}
    </ul>
  </div>`;
    })
    .join("\n");
}
