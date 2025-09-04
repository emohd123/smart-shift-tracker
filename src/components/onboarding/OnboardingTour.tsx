
import { useState, useEffect } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type TourStep = {
  title: string;
  description: string;
  targetSelector: string;
  position: "top" | "right" | "bottom" | "left";
};

interface OnboardingTourProps {
  steps: TourStep[];
  onComplete?: () => void;
  storageKey?: string;
}

export function OnboardingTour({
  steps,
  onComplete,
  storageKey = "app-tour-completed",
}: OnboardingTourProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });

  // Check if the tour has been completed before
  useEffect(() => {
    const tourCompleted = localStorage.getItem(storageKey);
    if (!tourCompleted) {
      setIsVisible(true);
    }
  }, [storageKey]);

  // Position the tour card relative to the target element
  useEffect(() => {
    if (!isVisible) return;

    const positionCard = () => {
      const step = steps[currentStep];
      const targetElement = document.querySelector(step.targetSelector);

      if (!targetElement) return;

      const targetRect = targetElement.getBoundingClientRect();
      const windowHeight = window.innerHeight;
      const windowWidth = window.innerWidth;
      let top = 0;
      let left = 0;

      // Position based on the specified direction
      switch (step.position) {
        case "top":
          top = targetRect.top - 10;
          left = targetRect.left + targetRect.width / 2;
          break;
        case "right":
          top = targetRect.top + targetRect.height / 2;
          left = targetRect.right + 10;
          break;
        case "bottom":
          top = targetRect.bottom + 10;
          left = targetRect.left + targetRect.width / 2;
          break;
        case "left":
          top = targetRect.top + targetRect.height / 2;
          left = targetRect.left - 10;
          break;
      }

      // Ensure the card stays within viewport
      if (left < 20) left = 20;
      if (left > windowWidth - 320) left = windowWidth - 320;
      if (top < 20) top = 20;
      if (top > windowHeight - 200) top = windowHeight - 200;

      setPosition({ top, left });
    };

    positionCard();
    window.addEventListener("resize", positionCard);
    window.addEventListener("scroll", positionCard);

    return () => {
      window.removeEventListener("resize", positionCard);
      window.removeEventListener("scroll", positionCard);
    };
  }, [currentStep, isVisible, steps]);

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = () => {
    setIsVisible(false);
    localStorage.setItem(storageKey, "true");
    if (onComplete) onComplete();
  };

  if (!isVisible) return null;

  return (
    <div
      className="fixed z-50 transition-all duration-300"
      style={{ top: `${position.top}px`, left: `${position.left}px` }}
    >
      <Card className="w-80 transform -translate-x-1/2 shadow-lg animate-fade-in">
        <CardHeader className="pb-2">
          <div className="flex justify-between items-center">
            <CardTitle className="text-lg">
              {steps[currentStep].title}
            </CardTitle>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={handleComplete}
            >
              <X size={14} />
            </Button>
          </div>
          <CardDescription>
            {steps[currentStep].description}
          </CardDescription>
        </CardHeader>
        <CardFooter className="pt-2 flex justify-between">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handlePrev}
              disabled={currentStep === 0}
            >
              Previous
            </Button>
            <Button
              variant="default"
              size="sm"
              onClick={handleNext}
            >
              {currentStep < steps.length - 1 ? "Next" : "Finish"}
            </Button>
          </div>
          <div className="text-xs text-muted-foreground">
            {currentStep + 1}/{steps.length}
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
