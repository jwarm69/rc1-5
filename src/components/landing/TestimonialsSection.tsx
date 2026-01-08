import { useState, useEffect, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";

const testimonials = [
  {
    quote: "I open it each morning, see what to do, and start. Simple.",
    name: "Sarah Mitchell",
    title: "Agent, Austin TX",
    timeAgo: "3 months ago",
    initials: "SM",
    rating: 5
  },
  {
    quote: "Less noise than other tools. I stopped maintaining my CRM.",
    name: "Marcus Chen",
    title: "Agent, Miami FL",
    timeAgo: "2 months ago",
    initials: "MC",
    rating: 5
  },
  {
    quote: "It knows who I should call. I just follow the list.",
    name: "Jennifer Torres",
    title: "Team Lead, Phoenix AZ",
    timeAgo: "1 month ago",
    initials: "JT",
    rating: 5
  },
  {
    quote: "My follow-up improved. I didn't have to think about it.",
    name: "David Williams",
    title: "Broker, Denver CO",
    timeAgo: "2 weeks ago",
    initials: "DW",
    rating: 5
  },
  {
    quote: "Quiet and useful. Doesn't demand attention.",
    name: "Amanda Foster",
    title: "Consultant, Seattle WA",
    timeAgo: "1 week ago",
    initials: "AF",
    rating: 5
  }
];

export function TestimonialsSection() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const isMobile = useIsMobile();

  const goToPrevious = useCallback(() => {
    if (isAnimating) return;
    setIsAnimating(true);
    setCurrentIndex((prev) => (prev === 0 ? testimonials.length - 1 : prev - 1));
    setTimeout(() => setIsAnimating(false), 500);
  }, [isAnimating]);

  const goToNext = useCallback(() => {
    if (isAnimating) return;
    setIsAnimating(true);
    setCurrentIndex((prev) => (prev === testimonials.length - 1 ? 0 : prev + 1));
    setTimeout(() => setIsAnimating(false), 500);
  }, [isAnimating]);

  // Auto-advance every 6 seconds
  useEffect(() => {
    const interval = setInterval(goToNext, 6000);
    return () => clearInterval(interval);
  }, [goToNext]);

  const currentTestimonial = testimonials[currentIndex];

  return (
    <section className="py-16 md:py-24 px-5 md:px-6 bg-background relative overflow-hidden">
      {/* Background glow effects - reduced on mobile */}
      <div className="absolute top-1/2 left-1/4 w-64 md:w-96 h-64 md:h-96 bg-primary/5 rounded-full blur-3xl -translate-y-1/2" />
      <div className="absolute top-1/2 right-1/4 w-52 md:w-80 h-52 md:h-80 bg-accent/5 rounded-full blur-3xl -translate-y-1/2" />
      
      <div className="max-w-4xl mx-auto relative z-10">
        {/* Section header */}
        <div className="text-center mb-10 md:mb-16">
          <h2 className="text-2xl md:text-3xl lg:text-4xl font-light text-foreground">
            What agents say
          </h2>
        </div>

        {/* Carousel container */}
        <div className="relative flex items-center">
          {/* Previous button - hidden on mobile, use swipe instead */}
          <Button
            variant="outline"
            size="icon"
            onClick={goToPrevious}
            disabled={isAnimating}
            className="absolute -left-2 md:-left-16 z-20 h-10 w-10 md:h-12 md:w-12 rounded-full bg-card/80 border-border/50 hover:border-primary/50 hover:bg-card shadow-lg backdrop-blur-sm transition-all duration-300 hover:shadow-primary/20 hidden md:flex"
          >
            <ChevronLeft className="h-5 w-5 text-muted-foreground" />
          </Button>

          {/* Testimonial card */}
          <Card 
            className={`w-full bg-card/60 border-border/30 backdrop-blur-sm shadow-2xl transition-all duration-500 ${
              isAnimating ? 'opacity-0 scale-95' : 'opacity-100 scale-100'
            }`}
            style={{
              boxShadow: '0 25px 80px -20px hsl(var(--primary) / 0.1), 0 0 40px hsl(var(--accent) / 0.05)'
            }}
          >
            <CardContent className="p-6 md:p-8 lg:p-12">

              {/* Quote */}
              <blockquote className="text-foreground/90 text-base md:text-lg lg:text-xl xl:text-2xl leading-relaxed mb-6 md:mb-8 italic font-light">
                "{currentTestimonial.quote}"
              </blockquote>

              {/* Author info */}
              <div className="flex items-center gap-3 md:gap-4">
                <Avatar className="h-10 w-10 md:h-12 md:w-12 border-2 border-primary/30 testimonial-avatar-glow">
                  <AvatarFallback className="bg-gradient-to-br from-primary/20 to-accent/20 text-foreground font-medium text-sm md:text-base">
                    {currentTestimonial.initials}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-foreground font-medium text-sm md:text-base">
                    {currentTestimonial.name}
                  </p>
                  <p className="text-muted-foreground text-xs md:text-sm">
                    {currentTestimonial.timeAgo}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Next button - hidden on mobile */}
          <Button
            variant="outline"
            size="icon"
            onClick={goToNext}
            disabled={isAnimating}
            className="absolute -right-2 md:-right-16 z-20 h-10 w-10 md:h-12 md:w-12 rounded-full bg-card/80 border-border/50 hover:border-primary/50 hover:bg-card shadow-lg backdrop-blur-sm transition-all duration-300 hover:shadow-primary/20 hidden md:flex"
          >
            <ChevronRight className="h-5 w-5 text-muted-foreground" />
          </Button>
        </div>

        {/* Mobile swipe navigation buttons */}
        <div className="flex justify-center gap-4 mt-6 md:hidden">
          <Button
            variant="outline"
            size="icon"
            onClick={goToPrevious}
            disabled={isAnimating}
            className="h-12 w-12 rounded-full bg-card/80 border-border/50"
          >
            <ChevronLeft className="h-5 w-5 text-muted-foreground" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={goToNext}
            disabled={isAnimating}
            className="h-12 w-12 rounded-full bg-card/80 border-border/50"
          >
            <ChevronRight className="h-5 w-5 text-muted-foreground" />
          </Button>
        </div>

        {/* Dot indicators */}
        <div className="flex justify-center gap-2 mt-6 md:mt-8">
          {testimonials.map((_, index) => (
            <button
              key={index}
              onClick={() => {
                if (!isAnimating && index !== currentIndex) {
                  setIsAnimating(true);
                  setCurrentIndex(index);
                  setTimeout(() => setIsAnimating(false), 500);
                }
              }}
              className={`transition-all duration-300 rounded-full touch-target-sm ${
                index === currentIndex
                  ? 'w-8 h-2 testimonial-dot-active'
                  : 'w-2 h-2 bg-muted-foreground/30 hover:bg-muted-foreground/50'
              }`}
              aria-label={`Go to testimonial ${index + 1}`}
            />
          ))}
        </div>

      </div>
    </section>
  );
}
