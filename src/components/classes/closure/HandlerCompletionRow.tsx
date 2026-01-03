import { TableCell, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { HandlerCompletionData } from "./types";

interface HandlerCompletionRowProps {
  data: HandlerCompletionData;
  onChange: (data: HandlerCompletionData) => void;
  index: number;
}

export function HandlerCompletionRow({ data, onChange, index }: HandlerCompletionRowProps) {
  const handleChange = (field: keyof HandlerCompletionData, value: any) => {
    onChange({ ...data, [field]: value });
  };

  return (
    <TableRow className={index % 2 === 0 ? "bg-muted/30" : ""}>
      <TableCell className="font-medium">
        <div>
          <div className="font-semibold">{data.handler_name}</div>
          <div className="text-sm text-muted-foreground">{data.dog_name}</div>
        </div>
      </TableCell>
      
      <TableCell>
        <Select
          value={data.result_status}
          onValueChange={(value) => handleChange('result_status', value)}
        >
          <SelectTrigger className="w-[130px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="passed">
              <span className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-green-500"></span>
                Passed
              </span>
            </SelectItem>
            <SelectItem value="no_pass">
              <span className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-red-500"></span>
                No Pass
              </span>
            </SelectItem>
            <SelectItem value="incomplete">
              <span className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                Incomplete
              </span>
            </SelectItem>
            <SelectItem value="did_not_grade">
              <span className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-gray-400"></span>
                Did Not Grade
              </span>
            </SelectItem>
            <SelectItem value="did_not_attend">
              <span className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-gray-300"></span>
                Did Not Attend
              </span>
            </SelectItem>
          </SelectContent>
        </Select>
      </TableCell>
      
      <TableCell>
        <Input
          type="number"
          min={0}
          max={100}
          placeholder="%"
          className="w-[70px]"
          value={data.pass_percentage ?? ""}
          onChange={(e) => handleChange('pass_percentage', e.target.value ? Number(e.target.value) : null)}
        />
      </TableCell>
      
      <TableCell>
        <Select
          value={data.next_action}
          onValueChange={(value) => handleChange('next_action', value)}
        >
          <SelectTrigger className="w-[140px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="continuing">
              <span className="flex items-center gap-2">
                ➡️ Continuing
              </span>
            </SelectItem>
            <SelectItem value="wants_info">
              <span className="flex items-center gap-2">
                📧 Wants Info
              </span>
            </SelectItem>
            <SelectItem value="stopping">
              <span className="flex items-center gap-2">
                ⏹️ Stopping
              </span>
            </SelectItem>
            <SelectItem value="none">
              <span className="flex items-center gap-2">
                — None
              </span>
            </SelectItem>
          </SelectContent>
        </Select>
      </TableCell>
      
      <TableCell>
        <Textarea
          placeholder="Notes..."
          className="min-h-[38px] h-[38px] resize-none text-sm"
          value={data.result_notes}
          onChange={(e) => handleChange('result_notes', e.target.value)}
        />
      </TableCell>
    </TableRow>
  );
}
