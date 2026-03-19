import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Trash2, GripVertical } from "lucide-react";

export interface CourseRow {
  name: string;
  price: string;
  entry_criteria: string;
  dates: string;
  day_time: string;
}

interface CourseTableEditorProps {
  courses: CourseRow[];
  onChange: (courses: CourseRow[]) => void;
  footnote?: string;
  onFootnoteChange?: (footnote: string) => void;
}

const EMPTY_COURSE: CourseRow = {
  name: "",
  price: "",
  entry_criteria: "",
  dates: "",
  day_time: "",
};

export function CourseTableEditor({ courses, onChange, footnote, onFootnoteChange }: CourseTableEditorProps) {
  const updateCourse = (index: number, field: keyof CourseRow, value: string) => {
    const updated = [...courses];
    updated[index] = { ...updated[index], [field]: value };
    onChange(updated);
  };

  const addCourse = () => {
    onChange([...courses, { ...EMPTY_COURSE }]);
  };

  const removeCourse = (index: number) => {
    if (courses.length <= 1) return;
    onChange(courses.filter((_, i) => i !== index));
  };

  return (
    <Card className="border-blue-200 bg-blue-50/30">
      <CardHeader className="pb-   3">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-[#3b7dc4]" />
          Course Info Table
          <span className="text-xs text-muted-foreground font-normal">
            — This generates the blue course table in your email
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {courses.map((course, index) => (
          <div key={index} className="border rounded-lg p-3 bg-background space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <GripVertical className="h-4 w-4" />
                Course {index + 1}
              </div>
              {courses.length > 1 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeCourse(index)}
                  className="text-destructive hover:text-destructive h-7 w-7 p-0"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Course Name</Label>
                <Input
                  value={course.name}
                  onChange={(e) => updateCourse(index, "name", e.target.value)}
                  placeholder="e.g. Novice Obedience"
                  className="h-8 text-sm"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Price</Label>
                <Input
                  value={course.price}
                  onChange={(e) => updateCourse(index, "price", e.target.value)}
                  placeholder="e.g. R1,770.00"
                  className="h-8 text-sm"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Entry Criteria</Label>
                <Input
                  value={course.entry_criteria}
                  onChange={(e) => updateCourse(index, "entry_criteria", e.target.value)}
                  placeholder="e.g. Beginner Obedience"
                  className="h-8 text-sm"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Day & Time</Label>
                <Input
                  value={course.day_time}
                  onChange={(e) => updateCourse(index, "day_time", e.target.value)}
                  placeholder="e.g. Saturdays 14H00 – 15H00"
                  className="h-8 text-sm"
                />
              </div>
            </div>

            <div className="space-y-1">
              <Label className="text-xs">Dates (one line per month)</Label>
              <Textarea
                value={course.dates}
                onChange={(e) => updateCourse(index, "dates", e.target.value)}
                placeholder={"April 11th, 18th\nMay 2nd, 9th, 16th, 23rd\nJune 6th, 13th, 20th (Graduation Day!)"}
                className="text-sm min-h-[60px]"
                rows={3}
              />
            </div>
          </div>
        ))}

        <Button variant="outline" size="sm" onClick={addCourse} className="w-full">
          <Plus className="h-3.5 w-3.5 mr-1" />
          Add Another Course Option
        </Button>

        {onFootnoteChange && (
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Footnote (optional, e.g. CGC disclaimer)</Label>
            <Textarea
              value={footnote || ""}
              onChange={(e) => onFootnoteChange(e.target.value)}
              placeholder="** Please note, the CGC exercises are highly dependent on..."
              className="text-xs min-h-[40px]"
              rows={2}
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/**
 * Generate styled HTML table from structured course data
 */
export function generateCourseTableHtml(courses: CourseRow[], footnote?: string): string {
  if (!courses.length || courses.every(c => !c.name)) return "";

  const rows = courses
    .filter(c => c.name)
    .map((course, i) => {
      const bgStyle = i % 2 === 0 ? ' style="background-color: #f9f9f9;"' : "";
      const datesHtml = course.dates
        .split("\n")
        .filter(Boolean)
        .join("<br>");
      return `<tr${bgStyle}>
        <td style="padding: 10px; border: 1px solid #ddd;"><strong>${course.name}</strong></td>
        <td style="padding: 10px; border: 1px solid #ddd;">${course.price}</td>
        <td style="padding: 10px; border: 1px solid #ddd;">${course.entry_criteria}</td>
        <td style="padding: 10px; border: 1px solid #ddd;">${datesHtml}</td>
        <td style="padding: 10px; border: 1px solid #ddd;">${course.day_time}</td>
      </tr>`;
    })
    .join("\n");

  const footnoteHtml = footnote
    ? `\n    <p style="font-size: 12px; color: #666; margin-top: 10px; font-style: italic;">${footnote}</p>`
    : "";

  return `<table style="width: 100%; border-collapse: collapse; margin: 15px 0; font-size: 14px;">
      <tr style="background-color: #3b7dc4; color: white;">
        <th style="padding: 10px; text-align: left; border: 1px solid #ddd;">Course</th>
        <th style="padding: 10px; text-align: left; border: 1px solid #ddd;">Price</th>
        <th style="padding: 10px; text-align: left; border: 1px solid #ddd;">Entry Criteria</th>
        <th style="padding: 10px; text-align: left; border: 1px solid #ddd;">Dates</th>
        <th style="padding: 10px; text-align: left; border: 1px solid #ddd;">Day & Time</th>
      </tr>
      ${rows}
    </table>${footnoteHtml}`;
}
