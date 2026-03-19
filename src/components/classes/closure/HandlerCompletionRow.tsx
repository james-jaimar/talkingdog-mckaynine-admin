import { TableCell, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { HandlerCompletionData } from "./types";
import { useClassTypes } from "@/hooks/useClassTypes";
import { useTermOptions } from "@/hooks/useTermOptions";
import { useMonthOptions } from "@/hooks/useMonthOptions";

interface HandlerCompletionRowProps {
  data: HandlerCompletionData;
  onChange: (data: HandlerCompletionData) => void;
  index: number;
  showContinuingColumns?: boolean;
  showMonthColumn?: boolean;
}

export function HandlerCompletionRow({ data, onChange, index, showContinuingColumns = false, showMonthColumn = false }: HandlerCompletionRowProps) {
  const { terms } = useTermOptions();
  const { classTypeNames } = useClassTypes();
  const { months } = useMonthOptions();
  
  const handleChange = (field: keyof HandlerCompletionData, value: any) => {
    onChange({ ...data, [field]: value });
  };

  const handleTermChange = (value: string) => {
    const [termNum, year] = value.split("-");
    onChange({
      ...data,
      next_term_number: termNum,
      next_term_year: parseInt(year),
    });
  };

  const selectedTermValue = data.next_term_number && data.next_term_year 
    ? `${data.next_term_number}-${data.next_term_year}` 
    : "";

  const isContinuing = data.next_action === "continuing";
  const showMonthPicker = data.next_action === "continuing" || data.next_action === "wants_info";

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

      {/* Conditionally show Term and Class columns when any handler is Continuing */}
      {showContinuingColumns && (
        <>
          <TableCell>
            {isContinuing ? (
              <Select value={selectedTermValue} onValueChange={handleTermChange}>
                <SelectTrigger className="w-[130px]">
                  <SelectValue placeholder="Select term" />
                </SelectTrigger>
                <SelectContent>
                  {terms.map((term) => (
                    <SelectItem key={`${term.term_number}-${term.year}`} value={`${term.term_number}-${term.year}`}>
                      {term.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <span className="text-muted-foreground text-sm">—</span>
            )}
          </TableCell>
          <TableCell>
            {isContinuing ? (
              <Select
                value={data.next_class_type || ""}
                onValueChange={(value) => handleChange('next_class_type', value)}
              >
                <SelectTrigger className="w-[130px]">
                  <SelectValue placeholder="Select class" />
                </SelectTrigger>
                <SelectContent>
                  {classTypeNames.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <span className="text-muted-foreground text-sm">—</span>
            )}
          </TableCell>
        </>
      )}

      {/* Target Month - shown when any handler has wants_info or continuing */}
      {completionData_showMonth && (
        <TableCell>
          {showMonthPicker ? (
            <Select
              value={data.target_month || "none"}
              onValueChange={(value) => handleChange('target_month', value === "none" ? undefined : value)}
            >
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Select month" />
              </SelectTrigger>
              <SelectContent className="max-h-60">
                <SelectItem value="none">None</SelectItem>
                {months.map((m) => (
                  <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            <span className="text-muted-foreground text-sm">—</span>
          )}
        </TableCell>
      )}
      
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
