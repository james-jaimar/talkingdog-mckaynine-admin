import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { FileDown, ScrollText } from "lucide-react";
import { termsSections, indemnityPoints, homeTrainSections, LegalSection } from "./legalContent";
import vetClearanceForm from "@/assets/vet-clearance-form.pdf.asset.json";

function SectionList({ sections }: { sections: LegalSection[] }) {
  return (
    <div className="space-y-4">
      {sections.map((section) => (
        <div key={section.title}>
          <h4 className="font-semibold text-sm mb-1">{section.title}</h4>
          <ul className="list-disc pl-5 space-y-1 text-sm text-muted-foreground">
            {section.points.map((point, i) => (
              <li key={i}>{point}</li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}

export function LegalAccordions() {
  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-xl font-semibold flex items-center gap-2">
          <ScrollText className="h-5 w-5 text-customer-accent" />
          The important bits
        </h2>
        <Button asChild variant="outline" size="sm" className="gap-2">
          <a href={vetClearanceForm.url} target="_blank" rel="noopener noreferrer">
            <FileDown className="h-4 w-4" />
            Vet clearance form (PDF)
          </a>
        </Button>
      </div>

      <Accordion type="single" collapsible className="rounded-2xl border bg-white px-4">
        <AccordionItem value="terms">
          <AccordionTrigger className="text-left">Terms &amp; Conditions</AccordionTrigger>
          <AccordionContent>
            <p className="text-sm text-muted-foreground mb-4">
              Our terms and conditions are largely set up to ensure safety for all dogs and handlers. Unless otherwise
              stated, they apply to all training classes, whether group or private and whether at a McKaynine venue, or a
              private or public space.
            </p>
            <SectionList sections={termsSections} />
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="indemnity">
          <AccordionTrigger className="text-left">Indemnity</AccordionTrigger>
          <AccordionContent>
            <ul className="list-disc pl-5 space-y-1 text-sm text-muted-foreground">
              {indemnityPoints.map((point, i) => (
                <li key={i}>{point}</li>
              ))}
            </ul>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="hometrain" className="border-b-0">
          <AccordionTrigger className="text-left">HomeTrain addendum (private lessons)</AccordionTrigger>
          <AccordionContent>
            <p className="text-sm text-muted-foreground mb-4">
              This addendum forms part of McKaynine's Terms &amp; Conditions and applies to private, in-home training. All
              clauses of the original Terms &amp; Conditions remain in force.
            </p>
            <SectionList sections={homeTrainSections} />
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </section>
  );
}
