import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  ArrowRight,
  BadgeCheck,
  Banknote,
  Bone,
  CalendarDays,
  ClipboardList,
  Clock,
  Dog,
  Footprints,
  Heart,
  Info,
  Mail,
  MapPin,
  PawPrint,
  Phone,
  ShoppingBag,
  Sparkles,
  CheckCircle2,
} from "lucide-react";
import puppyHero from "@/assets/puppy-hero.jpg.asset.json";
import { InfoPack, PuppyCourse, formatLessonDates } from "./useInfoPackData";

const currency = (value: number) =>
  new Intl.NumberFormat("en-ZA", { style: "currency", currency: "ZAR", minimumFractionDigits: 0 }).format(value);

const HELP_ICONS = [Dog, Bone, Heart, Footprints, Sparkles, PawPrint];
const TILE_STYLES = [
  "bg-pack-tile-1 text-pack-tile-1-fg",
  "bg-pack-tile-2 text-pack-tile-2-fg",
  "bg-pack-tile-3 text-pack-tile-3-fg",
  "bg-pack-tile-4 text-pack-tile-4-fg",
  "bg-pack-tile-5 text-pack-tile-5-fg",
  "bg-pack-tile-6 text-pack-tile-6-fg",
];

interface PuppyInfoPackProps {
  packs: InfoPack[];
  activePack?: InfoPack;
  courses: PuppyCourse[];
  onSelectBranch: (branchId: string) => void;
  onStart: () => void;
}

function Card({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <section
      className={cn(
        "rounded-2xl border border-pack-border bg-card p-5 shadow-[0_1px_2px_rgba(16,24,40,0.04)]",
        className
      )}
    >
      {children}
    </section>
  );
}

function CardTitle({ icon: Icon, tone, children }: { icon: typeof PawPrint; tone: string; children: React.ReactNode }) {
  return (
    <h2 className="mb-3 flex items-center gap-2 text-base font-semibold text-pack-ink">
      <span className={cn("flex h-8 w-8 items-center justify-center rounded-xl", tone)}>
        <Icon className="h-4 w-4" />
      </span>
      {children}
    </h2>
  );
}

export function PuppyInfoPack({ packs, activePack, courses, onSelectBranch, onStart }: PuppyInfoPackProps) {
  if (!activePack) return null;

  const nextCourse = courses[0];
  const heroImage = activePack.hero_image_url || puppyHero.url;
  const year = nextCourse ? new Date(nextCourse.startTime).getFullYear() : new Date().getFullYear();

  return (
    <div className="space-y-5">
      {/* Hero */}
      <div className="grid gap-5 lg:grid-cols-[1.35fr_1fr]">
        <Card className="flex flex-col justify-between overflow-hidden p-0">
          <div className="grid gap-0 sm:grid-cols-[1.15fr_1fr]">
            <div className="p-6 sm:p-8">
              {activePack.logo_url ? (
                <img
                  src={activePack.logo_url}
                  alt={`McKaynine ${activePack.branch.name} logo`}
                  className="mb-5 h-10 w-auto object-contain"
                />
              ) : (
                <p className="mb-5 text-sm font-semibold text-pack-blue">McKaynine {activePack.branch.name}</p>
              )}

              {packs.length > 1 && (
                <div className="mb-5 inline-flex rounded-full bg-pack-blue-soft p-1">
                  {packs.map((pack) => (
                    <button
                      key={pack.id}
                      type="button"
                      onClick={() => onSelectBranch(pack.branch_id)}
                      className={cn(
                        "rounded-full px-4 py-1.5 text-xs font-semibold transition-colors",
                        pack.branch_id === activePack.branch_id
                          ? "bg-pack-blue text-pack-blue-foreground"
                          : "text-pack-blue hover:bg-card/60"
                      )}
                    >
                      {pack.branch.name}
                    </button>
                  ))}
                </div>
              )}

              <h1 className="text-3xl font-bold leading-tight tracking-tight text-pack-ink sm:text-4xl">
                {activePack.hero_heading}
              </h1>
              <p className="mt-3 max-w-md text-sm text-muted-foreground">{activePack.hero_subheading}</p>

              <div className="mt-6 flex flex-wrap items-center gap-4">
                <Button
                  onClick={onStart}
                  className="gap-2 rounded-xl bg-pack-blue px-5 text-pack-blue-foreground hover:bg-pack-blue/90"
                >
                  Start enrolment
                  <ArrowRight className="h-4 w-4" />
                </Button>
                <div className="flex flex-wrap gap-x-4 gap-y-1">
                  {activePack.trust_lines.map((line) => (
                    <span key={line} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <BadgeCheck className="h-4 w-4 text-pack-blue" />
                      {line}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <img
              src={heroImage}
              alt="A puppy at a McKaynine puppy training class"
              className="h-56 w-full object-cover sm:h-full"
              loading="eager"
            />
          </div>
        </Card>

        {/* Class dates */}
        <Card>
          <CardTitle icon={CalendarDays} tone="bg-pack-tile-1 text-pack-tile-1-fg">
            {year} class dates
          </CardTitle>
          {activePack.venue_time && (
            <p className="mb-3 inline-flex items-center gap-2 rounded-xl bg-pack-blue-soft px-3 py-1.5 text-sm font-semibold text-pack-blue">
              <Clock className="h-4 w-4" />
              {activePack.venue_time}
            </p>
          )}
          {courses.length > 0 ? (
            <ul className="space-y-2.5">
              {courses.map((course) => (
                <li key={course.id} className="rounded-xl border border-pack-border px-3 py-2">
                  <p className="text-sm font-semibold text-pack-ink">{course.className}</p>
                  <p className="text-xs text-muted-foreground">
                    {course.dates.length > 0
                      ? formatLessonDates(course.dates)
                      : new Date(course.startTime).toLocaleDateString("en-ZA", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                  </p>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">
              Enrol below and we'll confirm the next available course dates with you.
            </p>
          )}
          {activePack.venue_name && (
            <p className="mt-3 flex items-start gap-2 text-xs text-muted-foreground">
              <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-pack-blue" />
              {activePack.venue_name}
            </p>
          )}
          {activePack.missed_class_note && (
            <p className="mt-3 rounded-xl bg-pack-tile-5 px-3 py-2 text-xs text-pack-tile-5-fg">
              {activePack.missed_class_note}
            </p>
          )}
        </Card>
      </div>

      {/* Help with + fees + start */}
      <div className="grid gap-5 lg:grid-cols-[1.35fr_1fr]">
        <Card>
          <CardTitle icon={PawPrint} tone="bg-pack-tile-3 text-pack-tile-3-fg">
            What we help you with
          </CardTitle>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {activePack.help_with.map((item, index) => {
              const Icon = HELP_ICONS[index % HELP_ICONS.length];
              return (
                <div key={item} className="flex flex-col items-center gap-2 rounded-xl border border-pack-border p-3 text-center">
                  <span
                    className={cn(
                      "flex h-10 w-10 items-center justify-center rounded-full",
                      TILE_STYLES[index % TILE_STYLES.length]
                    )}
                  >
                    <Icon className="h-5 w-5" />
                  </span>
                  <span className="text-xs font-medium text-pack-ink">{item}</span>
                </div>
              );
            })}
          </div>
        </Card>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-1">
          <Card>
            <CardTitle icon={Banknote} tone="bg-pack-tile-2 text-pack-tile-2-fg">
              Course fees
            </CardTitle>
            {nextCourse ? (
              <div className="space-y-2 text-sm">
                <div className="flex items-baseline justify-between">
                  <span className="text-muted-foreground">Course fee</span>
                  <span className="text-2xl font-bold text-pack-ink">{currency(nextCourse.courseFee)}</span>
                </div>
                {nextCourse.enrollmentFee > 0 && (
                  <div className="flex items-baseline justify-between">
                    <span className="text-muted-foreground">Once-off enrolment fee</span>
                    <span className="font-semibold text-pack-ink">{currency(nextCourse.enrollmentFee)}</span>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Fees are confirmed with your booking confirmation.</p>
            )}
            {activePack.fee_includes && <p className="mt-2 text-xs text-muted-foreground">{activePack.fee_includes}</p>}
            {activePack.discount_note && (
              <p className="mt-3 rounded-xl bg-pack-tile-3 px-3 py-2 text-xs font-medium text-pack-tile-3-fg">
                {activePack.discount_note}
              </p>
            )}
          </Card>

          <Card>
            <CardTitle icon={Clock} tone="bg-pack-tile-4 text-pack-tile-4-fg">
              When can I start?
            </CardTitle>
            <ul className="space-y-2 text-sm text-muted-foreground">
              {(activePack.start_notes.length > 0
                ? activePack.start_notes
                : [activePack.start_age_note, activePack.vaccination_note].filter(Boolean) as string[]
              ).map((note) => (
                <li key={note} className="flex items-start gap-2">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-pack-blue" />
                  <span>{note}</span>
                </li>
              ))}
            </ul>
            {activePack.schedule_note && (
              <p className="mt-3 text-xs text-muted-foreground">{activePack.schedule_note}</p>
            )}
          </Card>
        </div>
      </div>

      {/* Practical info band */}
      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardTitle icon={ShoppingBag} tone="bg-pack-tile-6 text-pack-tile-6-fg">
            What to bring
          </CardTitle>
          <ul className="space-y-2 text-sm text-muted-foreground">
            {activePack.what_to_bring.map((item) => (
              <li key={item} className="flex items-start gap-2">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-pack-blue" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </Card>

        <Card>
          <CardTitle icon={ClipboardList} tone="bg-pack-tile-1 text-pack-tile-1-fg">
            Joining details
          </CardTitle>
          <ol className="space-y-2.5 text-sm text-muted-foreground">
            {activePack.joining_steps.map((step, index) => (
              <li key={step} className="flex items-start gap-2.5">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-pack-blue text-[11px] font-bold text-pack-blue-foreground">
                  {index + 1}
                </span>
                <span>{step}</span>
              </li>
            ))}
          </ol>
          {activePack.banking_details && (
            <p className="mt-3 rounded-xl bg-pack-blue-soft px-3 py-2 text-xs text-pack-ink">
              {activePack.banking_details}
            </p>
          )}
        </Card>

        <Card>
          <CardTitle icon={Info} tone="bg-pack-tile-5 text-pack-tile-5-fg">
            Before you enrol
          </CardTitle>
          <ul className="space-y-2 text-sm text-muted-foreground">
            {(activePack.before_enrol_notes.length > 0
              ? activePack.before_enrol_notes
              : [activePack.cutoff_note].filter(Boolean) as string[]
            ).map((note) => (
              <li key={note} className="flex items-start gap-2">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-pack-blue" />
                <span>{note}</span>
              </li>
            ))}
            {activePack.weather_note && (
              <li className="flex items-start gap-2">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-pack-blue" />
                <span>{activePack.weather_note}</span>
              </li>
            )}
          </ul>
          <div className="mt-3 space-y-1 text-xs">
            {activePack.contact_phone && (
              <p className="flex items-center gap-2 text-pack-ink">
                <Phone className="h-3.5 w-3.5 text-pack-blue" />
                <a href={`tel:${activePack.contact_phone.replace(/\s/g, "")}`}>{activePack.contact_phone}</a>
              </p>
            )}
            {activePack.contact_email && (
              <p className="flex items-center gap-2 text-pack-ink">
                <Mail className="h-3.5 w-3.5 text-pack-blue" />
                <a href={`mailto:${activePack.contact_email}`}>{activePack.contact_email}</a>
              </p>
            )}
          </div>
        </Card>

        <Card>
          <CardTitle icon={MapPin} tone="bg-pack-tile-2 text-pack-tile-2-fg">
            Find us
          </CardTitle>
          {activePack.map_image_url && (
            <img
              src={activePack.map_image_url}
              alt={`Map showing the McKaynine ${activePack.branch.name} training venue`}
              className="mb-3 h-32 w-full rounded-xl object-cover"
              loading="lazy"
            />
          )}
          {activePack.directions.length > 0 && (
            <ol className="list-decimal space-y-1 pl-4 text-xs text-muted-foreground">
              {activePack.directions.map((step) => (
                <li key={step}>{step}</li>
              ))}
            </ol>
          )}
          {activePack.calls_note && (
            <p className="mt-3 rounded-xl bg-pack-tile-5 px-3 py-2 text-xs text-pack-tile-5-fg">
              {activePack.calls_note}
            </p>
          )}
          {activePack.map_link && (
            <Button asChild variant="outline" size="sm" className="mt-3 w-full gap-2 rounded-xl">
              <a href={activePack.map_link} target="_blank" rel="noopener noreferrer">
                <MapPin className="h-4 w-4" />
                Open in Maps
              </a>
            </Button>
          )}
        </Card>
      </div>

      {/* Ready banner */}
      <Card className="flex flex-col items-start justify-between gap-4 bg-pack-blue sm:flex-row sm:items-center">
        <div>
          <h2 className="text-lg font-semibold text-pack-blue-foreground">Ready to get started?</h2>
          <p className="text-sm text-pack-blue-foreground/80">
            Complete the enrolment form below and we'll confirm your pup's place.
          </p>
        </div>
        <Button onClick={onStart} className="gap-2 rounded-xl bg-card text-pack-blue hover:bg-card/90">
          Complete enrolment
          <ArrowRight className="h-4 w-4" />
        </Button>
      </Card>
    </div>
  );
}
