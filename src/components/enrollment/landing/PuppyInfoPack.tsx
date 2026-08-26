import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  ArrowRight,
  BadgeCheck,
  Banknote,
  CalendarDays,
  Car,
  CheckCircle2,
  CloudSun,
  Mail,
  MapPin,
  PawPrint,
  Phone,
  Quote,
  ShoppingBag,
  Syringe,
} from "lucide-react";
import puppyHero from "@/assets/puppy-hero.jpg.asset.json";
import { InfoPack, PuppyCourse } from "./useInfoPackData";

const currency = (value: number) =>
  new Intl.NumberFormat("en-ZA", { style: "currency", currency: "ZAR", minimumFractionDigits: 0 }).format(value);

const formatDate = (value: string) => {
  const date = new Date(value);
  return date.toLocaleDateString("en-ZA", { weekday: "short", day: "numeric", month: "short" });
};

interface PuppyInfoPackProps {
  packs: InfoPack[];
  activePack?: InfoPack;
  courses: PuppyCourse[];
  onSelectBranch: (branchId: string) => void;
  onStart: () => void;
}

export function PuppyInfoPack({ packs, activePack, courses, onSelectBranch, onStart }: PuppyInfoPackProps) {
  if (!activePack) return null;

  const nextCourse = courses[0];
  const heroImage = activePack.hero_image_url || puppyHero.url;

  return (
    <div className="space-y-8">
      {/* Hero */}
      <section className="relative overflow-hidden rounded-3xl">
        <img
          src={heroImage}
          alt="A puppy learning at a McKaynine puppy training class"
          className="h-64 w-full object-cover sm:h-80 lg:h-96"
          loading="eager"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/50 to-black/20" />
        <div className="absolute inset-0 flex flex-col justify-end p-6 sm:p-10">
          <Badge className="mb-3 w-fit bg-customer-accent text-white hover:bg-customer-accent">
            {activePack.branch.name} · Puppy Class
          </Badge>
          <h1 className="max-w-2xl text-2xl font-bold text-white sm:text-4xl">{activePack.hero_heading}</h1>
          <p className="mt-2 max-w-xl text-sm text-white/90 sm:text-base">{activePack.hero_subheading}</p>
          <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2">
            {activePack.trust_lines.map((line) => (
              <span key={line} className="flex items-center gap-2 text-xs text-white/90 sm:text-sm">
                <BadgeCheck className="h-4 w-4 text-customer-accent" />
                {line}
              </span>
            ))}
          </div>
          <Button onClick={onStart} className="mt-5 w-fit gap-2 bg-customer-accent text-white hover:bg-customer-accent/90">
            Start your enrolment
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </section>

      {/* Branch selector */}
      {packs.length > 1 && (
        <section className="space-y-2">
          <p className="text-sm font-medium text-muted-foreground">Choose your branch</p>
          <div className="flex flex-wrap gap-2">
            {packs.map((pack) => (
              <button
                key={pack.id}
                type="button"
                onClick={() => onSelectBranch(pack.branch_id)}
                className={cn(
                  "rounded-xl border-2 px-4 py-2 text-sm font-medium transition-all",
                  pack.branch_id === activePack.branch_id
                    ? "border-customer-accent bg-customer-accent/10"
                    : "border-border hover:border-customer-accent/50"
                )}
              >
                {pack.branch.name}
              </button>
            ))}
          </div>
        </section>
      )}

      {/* What we help with */}
      <section>
        <h2 className="mb-3 text-xl font-semibold">What we help you with</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {activePack.help_with.map((item) => (
            <Card key={item} className="flex items-center gap-2 border-0 bg-white p-4 shadow-sm">
              <PawPrint className="h-4 w-4 shrink-0 text-customer-accent" />
              <span className="text-sm font-medium">{item}</span>
            </Card>
          ))}
        </div>
      </section>

      {/* Where & when + fees */}
      <section className="grid gap-4 lg:grid-cols-2">
        <Card className="border-0 bg-white p-6 shadow-sm">
          <h2 className="mb-3 flex items-center gap-2 text-lg font-semibold">
            <CalendarDays className="h-5 w-5 text-customer-accent" />
            Where &amp; when
          </h2>
          <div className="space-y-3 text-sm">
            {activePack.venue_name && (
              <p className="flex items-start gap-2">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-customer-accent" />
                <span>
                  {activePack.venue_name}
                  {activePack.venue_time && <span className="block text-muted-foreground">{activePack.venue_time}</span>}
                </span>
              </p>
            )}
            {courses.length > 0 ? (
              <div className="space-y-2">
                <p className="font-medium">Upcoming courses</p>
                <ul className="space-y-2">
                  {courses.map((course) => (
                    <li key={course.id} className="rounded-xl bg-customer-accent/5 px-3 py-2">
                      <span className="font-medium">{course.className}</span>
                      <span className="block text-muted-foreground">
                        Starts {formatDate(course.startTime)}
                        {course.dates.length > 1 && ` · ${course.dates.length} lessons`}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            ) : (
              <p className="text-muted-foreground">
                Enrol below and we'll confirm the next available course dates with you.
              </p>
            )}
            {activePack.schedule_note && <p className="text-muted-foreground">{activePack.schedule_note}</p>}
            {activePack.start_age_note && (
              <p className="flex items-start gap-2 text-muted-foreground">
                <PawPrint className="mt-0.5 h-4 w-4 shrink-0 text-customer-accent" />
                {activePack.start_age_note}
              </p>
            )}
            {activePack.vaccination_note && (
              <p className="flex items-start gap-2 text-muted-foreground">
                <Syringe className="mt-0.5 h-4 w-4 shrink-0 text-customer-accent" />
                {activePack.vaccination_note}
              </p>
            )}
          </div>
        </Card>

        <Card className="border-0 bg-white p-6 shadow-sm">
          <h2 className="mb-3 flex items-center gap-2 text-lg font-semibold">
            <Banknote className="h-5 w-5 text-customer-accent" />
            Fees
          </h2>
          {nextCourse ? (
            <div className="space-y-2 text-sm">
              <div className="flex items-baseline justify-between rounded-xl bg-customer-accent/5 px-3 py-2">
                <span className="text-muted-foreground">Course fee</span>
                <span className="text-xl font-bold">{currency(nextCourse.courseFee)}</span>
              </div>
              {nextCourse.enrollmentFee > 0 && (
                <div className="flex items-baseline justify-between rounded-xl bg-customer-accent/5 px-3 py-2">
                  <span className="text-muted-foreground">Once-off enrolment fee</span>
                  <span className="font-semibold">{currency(nextCourse.enrollmentFee)}</span>
                </div>
              )}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Fees are confirmed with your booking confirmation.</p>
          )}
          <div className="mt-3 space-y-2 text-sm text-muted-foreground">
            {activePack.fee_includes && <p>{activePack.fee_includes}</p>}
            {activePack.discount_note && <p>{activePack.discount_note}</p>}
            {activePack.banking_details && (
              <p className="rounded-xl bg-muted px-3 py-2 text-foreground">{activePack.banking_details}</p>
            )}
            {activePack.cutoff_note && <p>{activePack.cutoff_note}</p>}
          </div>
        </Card>
      </section>

      {/* What to bring + how to join */}
      <section className="grid gap-4 lg:grid-cols-2">
        <Card className="border-0 bg-white p-6 shadow-sm">
          <h2 className="mb-3 flex items-center gap-2 text-lg font-semibold">
            <ShoppingBag className="h-5 w-5 text-customer-accent" />
            What to bring
          </h2>
          <ul className="space-y-2 text-sm">
            {activePack.what_to_bring.map((item) => (
              <li key={item} className="flex items-start gap-2">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-customer-accent" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </Card>

        <Card className="border-0 bg-white p-6 shadow-sm">
          <h2 className="mb-3 text-lg font-semibold">How to join</h2>
          <ol className="space-y-3 text-sm">
            {activePack.joining_steps.map((step, index) => (
              <li key={step} className="flex items-start gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-customer-accent text-xs font-bold text-white">
                  {index + 1}
                </span>
                <span>{step}</span>
              </li>
            ))}
          </ol>
        </Card>
      </section>

      {/* Directions & notes */}
      {(activePack.directions.length > 0 || activePack.calls_note || activePack.weather_note) && (
        <section className="grid gap-4 lg:grid-cols-2">
          {activePack.directions.length > 0 && (
            <Card className="border-0 bg-white p-6 shadow-sm">
              <h2 className="mb-3 flex items-center gap-2 text-lg font-semibold">
                <Car className="h-5 w-5 text-customer-accent" />
                Finding us
              </h2>
              <ol className="list-decimal space-y-1 pl-5 text-sm text-muted-foreground">
                {activePack.directions.map((step) => (
                  <li key={step}>{step}</li>
                ))}
              </ol>
              {activePack.map_link && (
                <Button asChild variant="outline" size="sm" className="mt-4 gap-2">
                  <a href={activePack.map_link} target="_blank" rel="noopener noreferrer">
                    <MapPin className="h-4 w-4" />
                    Open in Maps
                  </a>
                </Button>
              )}
            </Card>
          )}
          <Card className="border-0 bg-white p-6 shadow-sm">
            <h2 className="mb-3 flex items-center gap-2 text-lg font-semibold">
              <CloudSun className="h-5 w-5 text-customer-accent" />
              Good to know
            </h2>
            <div className="space-y-3 text-sm text-muted-foreground">
              {activePack.calls_note && <p>{activePack.calls_note}</p>}
              {activePack.weather_note && <p>{activePack.weather_note}</p>}
              <div className="space-y-1 pt-2 text-foreground">
                {activePack.contact_phone && (
                  <p className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-customer-accent" />
                    <a href={`tel:${activePack.contact_phone.replace(/\s/g, "")}`}>{activePack.contact_phone}</a>
                  </p>
                )}
                {activePack.contact_email && (
                  <p className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-customer-accent" />
                    <a href={`mailto:${activePack.contact_email}`}>{activePack.contact_email}</a>
                  </p>
                )}
              </div>
            </div>
          </Card>
        </section>
      )}

      {/* Testimonial */}
      {activePack.testimonial_quote && (
        <section>
          <Card className="border-0 bg-customer-accent/5 p-6 shadow-sm">
            <Quote className="mb-2 h-6 w-6 text-customer-accent" />
            <blockquote className="text-base italic">"{activePack.testimonial_quote}"</blockquote>
            {activePack.testimonial_author && (
              <p className="mt-2 text-sm font-medium text-muted-foreground">— {activePack.testimonial_author}</p>
            )}
          </Card>
        </section>
      )}
    </div>
  );
}
