"use client";

import { 
  Shield, 
  MessageCircle, 
  Calendar,
  Star,
  MapPin,
  Clock,
  Users,
  BookOpen,
  CheckCircle,
  TrendingUp,
  Heart,
  Award
} from "lucide-react";
import { BentoGrid, BentoCard } from "@/components/ui/BentoGrid";

export default function FeaturesBentoGrid() {
  return (
    <section className="py-16 sm:py-24 bg-neutral-50">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold tracking-tight text-neutral-900 sm:text-4xl">
            Alt du trenger for vellykket privatlæring
          </h2>
          <p className="mt-4 text-lg text-neutral-600 text-pretty max-w-2xl mx-auto">
            TutorConnect kombinerer trygghet, enkelhet og effektivitet for den beste læringsopplevelsen i Norge
          </p>
        </div>

        <BentoGrid className="mx-auto max-w-6xl">
          {/* Large Feature - Safety & Verification */}
          <BentoCard
            className="md:col-span-2 lg:col-span-2"
            icon={
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-brand-100 to-brand-200">
                <Shield className="h-6 w-6 text-brand-600" />
              </div>
            }
            title="Verifiserte profiler"
            description="Alle lærere gjennomgår grundig bakgrunnssjekk og kvalifikasjonsverifikasjon for din trygghet."
          >
            <div className="flex items-center justify-between mt-6">
              <div className="flex items-center space-x-4">
                <div className="flex -space-x-2">
                  <div className="w-8 h-8 rounded-full bg-brand-200 border-2 border-white flex items-center justify-center">
                    <CheckCircle className="w-4 h-4 text-brand-600" />
                  </div>
                  <div className="w-8 h-8 rounded-full bg-success-200 border-2 border-white flex items-center justify-center">
                    <Award className="w-4 h-4 text-success-600" />
                  </div>
                  <div className="w-8 h-8 rounded-full bg-warning-200 border-2 border-white flex items-center justify-center">
                    <Star className="w-4 h-4 text-warning-600" />
                  </div>
                </div>
                <div className="text-left">
                  <p className="text-sm font-medium text-neutral-900">500+ verifiserte lærere</p>
                  <p className="text-xs text-neutral-600">100% bakgrunnssjekket</p>
                </div>
              </div>
            </div>
          </BentoCard>

          {/* Real-time Chat */}
          <BentoCard
            className="lg:col-span-1"
            icon={
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-success-100 to-success-200">
                <MessageCircle className="h-6 w-6 text-success-600" />
              </div>
            }
            title="Sanntid chat"
            description="Kommuniser direkte med lærere og studenter via vår innebygde meldingssystem."
          >
            <div className="mt-4 space-y-2">
              <div className="flex items-center text-sm text-success-700">
                <div className="w-2 h-2 bg-success-400 rounded-full mr-2 animate-pulse" />
                Aktive samtaler: 156
              </div>
              <div className="text-xs text-neutral-600">
                Gjennomsnittlig responstid: &lt; 5 min
              </div>
            </div>
          </BentoCard>

          {/* Easy Booking */}
          <BentoCard
            className="lg:col-span-1"
            icon={
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-warning-100 to-warning-200">
                <Calendar className="h-6 w-6 text-warning-600" />
              </div>
            }
            title="Enkel booking"
            description="Book timer direkte gjennom plattformen med automatiske påminnelser og bekreftelser."
          >
            <div className="mt-4 space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-neutral-600">Denne uken:</span>
                <span className="font-medium text-neutral-900">247 timer booket</span>
              </div>
              <div className="flex items-center text-xs text-neutral-500">
                <Clock className="w-3 h-3 mr-1" />
                Fleksible tidspunkt tilgjengelig
              </div>
            </div>
          </BentoCard>

          {/* Location Coverage */}
          <BentoCard
            className="md:col-span-2 lg:col-span-1"
            icon={
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-blue-100 to-blue-200">
                <MapPin className="h-6 w-6 text-blue-600" />
              </div>
            }
            title="Hele Norge dekket"
            description="Fra Kristiansand til Tromsø - finn kvalifiserte lærere i ditt nærområde."
          >
            <div className="mt-4">
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="text-neutral-600">Oslo: 156 lærere</div>
                <div className="text-neutral-600">Bergen: 89 lærere</div>
                <div className="text-neutral-600">Trondheim: 67 lærere</div>
                <div className="text-neutral-600">Stavanger: 52 lærere</div>
              </div>
            </div>
          </BentoCard>

          {/* High Ratings */}
          <BentoCard
            className="lg:col-span-1"
            icon={
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-yellow-100 to-yellow-200">
                <Star className="h-6 w-6 text-yellow-600" />
              </div>
            }
            title="Høy tilfredshet"
            description="98% av våre brukere anbefaler TutorConnect til andre."
          >
            <div className="mt-4">
              <div className="flex items-center space-x-2 mb-2">
                <div className="flex">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star key={star} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <span className="text-sm font-medium text-neutral-900">4.9/5</span>
              </div>
              <p className="text-xs text-neutral-600">Basert på 2,847 anmeldelser</p>
            </div>
          </BentoCard>

          {/* Success Stories */}
          <BentoCard
            className="md:col-span-2 lg:col-span-2"
            icon={
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-purple-100 to-purple-200">
                <TrendingUp className="h-6 w-6 text-purple-600" />
              </div>
            }
            title="Dokumentert fremgang"
            description="Våre studenter oppnår målbare forbedringer i karakterer og selvtillit."
          >
            <div className="mt-6 grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-purple-600">+1.3</div>
                <div className="text-xs text-neutral-600">Gj.snitt karakterforbedring</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-brand-600">87%</div>
                <div className="text-xs text-neutral-600">Oppnår ønskede mål</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-success-600">+45%</div>
                <div className="text-xs text-neutral-600">Økt selvtillit</div>
              </div>
            </div>
          </BentoCard>

          {/* Subjects Available */}
          <BentoCard
            className="lg:col-span-1"
            icon={
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-green-100 to-green-200">
                <BookOpen className="h-6 w-6 text-green-600" />
              </div>
            }
            title="15+ fag tilgjengelig"
            description="Fra matematikk til norsk - vi dekker alle hovedfag og mange spesialfag."
          >
            <div className="mt-4 flex flex-wrap gap-1">
              {["Matematikk", "Norsk", "Engelsk", "Fysikk", "Kjemi", "+10 flere"].map((subject, index) => (
                <span
                  key={subject}
                  className={cn(
                    "px-2 py-1 rounded text-xs font-medium",
                    index < 3 
                      ? "bg-green-100 text-green-700" 
                      : index < 5 
                      ? "bg-blue-100 text-blue-700"
                      : "bg-neutral-100 text-neutral-600"
                  )}
                >
                  {subject}
                </span>
              ))}
            </div>
          </BentoCard>

          {/* Community Support */}
          <BentoCard
            className="md:col-span-2 lg:col-span-1"
            icon={
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-rose-100 to-rose-200">
                <Heart className="h-6 w-6 text-rose-600" />
              </div>
            }
            title="Sterkt fellesskap"
            description="Bli del av en støttende community av lærere, studenter og foreldre i hele Norge."
          >
            <div className="mt-4 space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-neutral-600">Aktive medlemmer:</span>
                <span className="font-medium text-neutral-900">2,847</span>
              </div>
              <div className="flex items-center text-xs text-rose-600">
                <Users className="w-3 h-3 mr-1" />
                Voksende fellesskap
              </div>
            </div>
          </BentoCard>
        </BentoGrid>
      </div>
    </section>
  );
}

function cn(...classes: (string | undefined | false | null)[]): string {
  return classes.filter(Boolean).join(' ');
}