import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  ArrowRight,
  BadgeCheck,
  Banknote,
  Bone,
  CalendarDays,
  Check,
  Clock3,
  Dog,
  ExternalLink,
  Footprints,
  Heart,
  Info,
  Mail,
  MapPin,
  PawPrint,
  Phone,
  ShoppingBag,
  Sparkles,
  ClipboardCheck,
} from "lucide-react";
import { InfoPack, PuppyCourse, formatLessonDates } from "./useInfoPackData";
import deltaLogoFallback from "@/assets/mckaynine_delta_long_2025.png";

const TRAINER = "/images/puppy-registration/trainer-and-puppy.jpg";
const GREAT_DANE = "/images/puppy-registration/great-dane-puppy.jpg";
const icons = [Dog, Bone, Heart, Footprints, Sparkles, PawPrint];
const tones = [
  "bg-sky-100 text-sky-700",
  "bg-emerald-100 text-emerald-700",
  "bg-violet-100 text-violet-700",
  "bg-amber-100 text-amber-700",
  "bg-rose-100 text-rose-700",
  "bg-teal-100 text-teal-700",
];
const money = (n: number) =>
  new Intl.NumberFormat("en-ZA", {
    style: "currency",
    currency: "ZAR",
    minimumFractionDigits: 0,
  }).format(n);

interface Props {
  packs: InfoPack[];
  activePack?: InfoPack;
  courses: PuppyCourse[];
  onSelectBranch: (id: string) => void;
  onStart: () => void;
}

function Card({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section
      className={cn(
        "rounded-[1.4rem] border border-pack-border/90 bg-white shadow-[0_18px_50px_-35px_rgba(20,49,91,.45)]",
        className,
      )}
    >
      {children}
    </section>
  );
}

function Heading({
  icon: Icon,
  children,
}: {
  icon: typeof PawPrint;
  children: React.ReactNode;
}) {
  return (
    <h2 className="flex items-center gap-2.5 text-lg font-extrabold tracking-tight text-pack-ink">
      <span className="grid h-9 w-9 place-items-center rounded-xl bg-pack-blue-soft text-pack-blue">
        <Icon className="h-[18px] w-[18px]" />
      </span>
      {children}
    </h2>
  );
}

function Bullets({ items }: { items: string[] }) {
  return (
    <ul className="mt-4 space-y-2.5">
      {items.map((item) => (
        <li
          key={item}
          className="flex items-start gap-2.5 text-sm leading-relaxed text-slate-600"
        >
          <span className="mt-0.5 grid h-[18px] w-[18px] shrink-0 place-items-center rounded-full border border-emerald-300 bg-emerald-50 text-emerald-700">
            <Check className="h-3 w-3" />
          </span>
          {item}
        </li>
      ))}
    </ul>
  );
}

function Branches({
  packs,
  active,
  select,
}: {
  packs: InfoPack[];
  active: InfoPack;
  select: (id: string) => void;
}) {
  if (packs.length < 2) return null;
  return (
    <div className="inline-flex rounded-full border border-white/70 bg-white/80 p-1 shadow-sm backdrop-blur">
      {packs.map((p) => (
        <button
          key={p.id}
          type="button"
          onClick={() => select(p.branch_id)}
          className={cn(
            "rounded-full px-4 py-1.5 text-xs font-bold transition",
            p.branch_id === active.branch_id
              ? "bg-pack-blue text-white"
              : "text-pack-blue hover:bg-pack-blue-soft",
          )}
        >
          {p.branch.name}
        </button>
      ))}
    </div>
  );
}

function Hero({
  packs,
  activePack: p,
  courses,
  onSelectBranch,
  onStart,
}: Props & { activePack: InfoPack }) {
  const year = courses[0]
    ? new Date(courses[0].startTime).getFullYear()
    : new Date().getFullYear();
  return (
    <Card className="relative overflow-hidden border-0 bg-[#f8f4ed]">
      <div className="relative grid min-h-[354px] lg:grid-cols-[1.04fr_.78fr_.46fr]">
        <div className="z-10 flex flex-col justify-between p-6 sm:p-7 lg:p-8">
          <div>
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3 lg:justify-start">
              {p.logo_url ? (
                <img
                  src={p.logo_url}
                  onError={(event) => {
                    event.currentTarget.src = deltaLogoFallback;
                  }}
                  alt={`McKaynine ${p.branch.name} logo`}
                  className="h-10 w-auto max-w-[190px] object-contain mix-blend-multiply"
                />
              ) : (
                <strong className="text-pack-blue">
                  McKaynine {p.branch.name}
                </strong>
              )}
              <Branches packs={packs} active={p} select={onSelectBranch} />
            </div>
            <p className="mb-2 text-[11px] font-bold uppercase tracking-[.18em] text-pack-blue/65">
              Puppy training · {p.branch.name}
            </p>
            <h1 className="max-w-xl text-[clamp(2.25rem,3.5vw,3.65rem)] font-extrabold leading-[.98] tracking-[-.045em] text-pack-ink">
              {p.hero_heading}
            </h1>
            <p className="mt-3 max-w-lg text-sm leading-relaxed text-slate-600 sm:text-base">
              {p.hero_subheading}
            </p>
          </div>
          <div className="mt-5 flex flex-wrap items-center gap-3">
            <Button
              onClick={onStart}
              size="lg"
              className="h-11 rounded-xl bg-[#1457c8] px-5 font-bold text-white shadow-lg hover:bg-[#1049aa]"
            >
              Start enrolment <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
            <div className="flex flex-wrap gap-x-4 gap-y-2">
              {p.trust_lines.slice(0, 2).map((line) => (
                <span
                  key={line}
                  className="flex max-w-[180px] items-center gap-2 text-xs leading-snug text-slate-600"
                >
                  <BadgeCheck className="h-5 w-5 shrink-0 text-[#90775f]" />
                  {line}
                </span>
              ))}
            </div>
          </div>
        </div>
        <div className="relative min-h-[280px] overflow-hidden lg:min-h-full">
          <img
            src={TRAINER}
            alt="McKaynine trainer holding a puppy"
            className="absolute inset-0 h-full w-full object-cover object-[50%_32%]"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#f8f4ed] via-transparent to-transparent" />
        </div>
        <div className="z-10 flex items-center p-4 lg:-ml-6 lg:pr-5">
          <div className="w-full rounded-[1.2rem] border border-white/80 bg-white/95 p-4 shadow-2xl backdrop-blur">
            <div className="mb-3 flex items-center gap-2.5">
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-emerald-50 text-emerald-700">
                <CalendarDays className="h-5 w-5" />
              </span>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Upcoming
                </p>
                <h2 className="text-base font-extrabold text-pack-ink">
                  {year} class dates
                </h2>
              </div>
            </div>
            {p.venue_time && (
              <p className="mb-3 flex items-center gap-2 text-xs font-bold text-pack-ink">
                <Clock3 className="h-4 w-4 text-pack-blue" />
                {p.venue_time}
              </p>
            )}
            {courses.length ? (
              <div className="space-y-2">
                {courses.slice(0, 3).map((c) => (
                  <div
                    key={c.id}
                    className="rounded-xl border border-pack-border bg-slate-50 p-2.5"
                  >
                    <p className="text-xs font-bold text-pack-ink">
                      {c.className}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      {c.dates.length
                        ? formatLessonDates(c.dates)
                        : new Date(c.startTime).toLocaleDateString("en-ZA", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="rounded-xl bg-slate-50 p-3 text-xs leading-relaxed text-slate-600">
                Enrol below and we&apos;ll confirm the next available course
                dates with you.
              </p>
            )}
            {p.venue_name && (
              <p className="mt-4 flex items-start gap-2 text-xs leading-relaxed text-slate-600">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-pack-blue" />
                {p.venue_name}
              </p>
            )}
            {p.missed_class_note && (
              <p className="mt-4 rounded-xl bg-emerald-50 p-3 text-xs font-medium leading-relaxed text-emerald-900">
                {p.missed_class_note}
              </p>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}

function Help({ p }: { p: InfoPack }) {
  return (
    <Card className="relative overflow-hidden p-5">
      <div className="flex items-center justify-between gap-4">
        <Heading icon={PawPrint}>What we help with</Heading>
        <img
          src={GREAT_DANE}
          alt="Great Dane puppy running on grass"
          className="hidden h-12 w-20 rounded-xl object-cover sm:block"
        />
      </div>
      <div className="mt-4 grid grid-cols-2 gap-2.5 sm:grid-cols-3 xl:grid-cols-6">
        {p.help_with.map((item, i) => {
          const Icon = icons[i % icons.length];
          return (
            <div
              key={item}
              className="rounded-xl border border-pack-border bg-slate-50/65 px-2 py-3 text-center"
            >
              <span
                className={cn(
                  "mx-auto grid h-10 w-10 place-items-center rounded-full",
                  tones[i % tones.length],
                )}
              >
                <Icon className="h-[18px] w-[18px]" />
              </span>
              <p className="mt-2 text-xs font-bold leading-tight text-pack-ink">
                {item}
              </p>
            </div>
          );
        })}
      </div>
    </Card>
  );
}

function Fees({ p, courses }: { p: InfoPack; courses: PuppyCourse[] }) {
  const c = courses[0];
  const notes = p.start_notes.length
    ? p.start_notes
    : ([p.start_age_note, p.vaccination_note].filter(Boolean) as string[]);
  return (
    <>
      <Card className="overflow-hidden bg-[#f3e6d8] p-5">
        <Heading icon={Banknote}>Course fees</Heading>
        {c ? (
          <div className="mt-4 space-y-2">
            <div className="flex items-baseline justify-between rounded-xl bg-white/80 p-3">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                Course
              </p>
              <p className="text-xl font-extrabold text-pack-ink">
                {money(c.courseFee)}
              </p>
            </div>
            <div className="flex items-baseline justify-between rounded-xl bg-white/65 p-3">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                Enrolment
              </p>
              <p className="text-lg font-extrabold text-pack-ink">
                {money(c.enrollmentFee)}
              </p>
            </div>
          </div>
        ) : (
          <p className="mt-5 rounded-xl bg-white/70 p-4 text-sm text-slate-600">
            Fees are confirmed with your booking confirmation.
          </p>
        )}
        {p.fee_includes && (
          <p className="mt-4 text-sm text-slate-700">{p.fee_includes}</p>
        )}
        {p.discount_note && (
          <p className="mt-4 rounded-xl border border-[#d6bfa9] bg-white/55 p-3 text-sm font-semibold text-pack-ink">
            {p.discount_note}
          </p>
        )}
      </Card>
      <Card className="bg-[#edf6f2] p-5">
        <Heading icon={Clock3}>When can my puppy start?</Heading>
        <Bullets items={notes} />
      </Card>
    </>
  );
}

function Practical({ p }: { p: InfoPack }) {
  const before = p.before_enrol_notes.length
    ? p.before_enrol_notes
    : ([p.cutoff_note].filter(Boolean) as string[]);
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-[.92fr_1.32fr_.88fr_1.18fr]">
      <Card className="p-5">
        <Heading icon={ShoppingBag}>What to bring</Heading>
        <Bullets items={p.what_to_bring} />
      </Card>
      <Card className="p-5">
        <Heading icon={ClipboardCheck}>Joining details</Heading>
        <ol className="mt-4 space-y-3">
          {p.joining_steps.map((step, i) => (
            <li
              key={step}
              className="flex items-start gap-3 text-sm leading-relaxed text-slate-600"
            >
              <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-[#1457c8] text-[11px] font-extrabold text-white">
                {i + 1}
              </span>
              {step}
            </li>
          ))}
        </ol>
        {p.banking_details && (
          <p className="mt-4 rounded-xl border border-blue-100 bg-pack-blue-soft p-3 text-xs leading-relaxed text-pack-ink">
            {p.banking_details}
          </p>
        )}
      </Card>
      <Card className="p-5">
        <Heading icon={Info}>Before you enrol</Heading>
        <Bullets items={before} />
        {p.weather_note && (
          <p className="mt-3 text-sm leading-relaxed text-slate-600">
            {p.weather_note}
          </p>
        )}
        <div className="mt-5 space-y-2 border-t border-pack-border pt-4 text-xs font-semibold text-pack-ink">
          {p.contact_phone && (
            <a
              href={`tel:${p.contact_phone.replace(/\s/g, "")}`}
              className="flex items-center gap-2"
            >
              <Phone className="h-4 w-4 text-pack-blue" />
              {p.contact_phone}
            </a>
          )}
          {p.contact_email && (
            <a
              href={`mailto:${p.contact_email}`}
              className="flex items-center gap-2"
            >
              <Mail className="h-4 w-4 text-pack-blue" />
              {p.contact_email}
            </a>
          )}
        </div>
      </Card>
      <FindUs p={p} />
    </div>
  );
}

function FindUs({ p }: { p: InfoPack }) {
  return (
    <Card className="overflow-hidden p-5">
      <Heading icon={MapPin}>Find us</Heading>
      {p.map_image_url && (
        <img
          src={p.map_image_url}
          alt={`Map showing the McKaynine ${p.branch.name} venue`}
          className="mt-4 h-28 w-full rounded-xl object-cover"
        />
      )}
      <ol className="mt-3 space-y-1.5">
        {p.directions.map((step, i) => (
          <li
            key={step}
            className="flex items-start gap-2 text-[11px] leading-relaxed text-slate-600"
          >
            <span className="grid h-4 w-4 shrink-0 place-items-center rounded-full bg-pack-blue-soft text-[9px] font-bold text-pack-blue">
              {i + 1}
            </span>
            {step}
          </li>
        ))}
      </ol>
      {p.calls_note && (
        <p className="mt-3 rounded-lg bg-amber-50 p-2 text-[10px] leading-relaxed text-amber-950">
          {p.calls_note}
        </p>
      )}
      {p.map_link && (
        <Button
          asChild
          variant="outline"
          size="sm"
          className="mt-3 w-full rounded-lg text-pack-blue"
        >
          <a href={p.map_link} target="_blank" rel="noreferrer">
            Open in Maps <ExternalLink className="ml-2 h-3.5 w-3.5" />
          </a>
        </Button>
      )}
    </Card>
  );
}

function Ready({ onStart }: { onStart: () => void }) {
  return (
    <section className="relative overflow-hidden rounded-[1.4rem] bg-[#1457c8] px-6 py-7 text-white shadow-xl sm:px-9">
      <div className="relative flex flex-col items-start justify-between gap-5 sm:flex-row sm:items-center">
        <div className="flex items-center gap-4">
          <span className="grid h-12 w-12 place-items-center rounded-2xl bg-white/15">
            <PawPrint className="h-6 w-6" />
          </span>
          <div>
            <h2 className="text-2xl font-extrabold">Ready to get started?</h2>
            <p className="mt-1 text-sm text-white/75">
              Complete the enrolment form and we&apos;ll confirm your
              puppy&apos;s place.
            </p>
          </div>
        </div>
        <Button
          onClick={onStart}
          size="lg"
          className="h-12 rounded-xl bg-white px-6 font-bold text-[#1457c8] hover:bg-blue-50"
        >
          Complete enrolment <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </section>
  );
}

export function PuppyInfoPack(props: Props) {
  const p = props.activePack;
  if (!p) return null;
  return (
    <div className="space-y-5">
      <Hero {...props} activePack={p} />
      <div className="grid gap-4 xl:grid-cols-[1.55fr_.68fr_.77fr]">
        <Help p={p} />
        <Fees p={p} courses={props.courses} />
      </div>
      <Practical p={p} />
      <Ready onStart={props.onStart} />
    </div>
  );
}
