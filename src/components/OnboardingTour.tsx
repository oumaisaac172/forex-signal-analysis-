import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';

interface TourStep {
  title: string;
  content: string;
  target: string; // CSS selector
}

const steps: TourStep[] = [
  {
    title: 'Welcome!',
    content: 'Get started by uploading your first chart in the Upload section.',
    target: '#upload-section',
  },
  {
    title: 'Configure Strategies',
    content: 'Enable institutional or retail strategies to refine your analysis.',
    target: '#strategy-section',
  },
  {
    title: 'Review Signals',
    content: 'Check the results of our AI signal generation here.',
    target: '#signal-results',
  },
];

export const OnboardingTour: React.FC = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    // Check if user has already completed tour via localStorage
    const hasCompleted = localStorage.getItem('onboardingTourCompleted');
    if (!hasCompleted) {
      setIsOpen(true);
    }
  }, []);

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      setIsOpen(false);
      localStorage.setItem('onboardingTourCompleted', 'true');
    }
  };

  if (!isOpen) return null;

  const step = steps[currentStep];

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-sm rounded-lg bg-white p-6 shadow-xl dark:bg-slate-900">
        <h2 className="mb-2 text-lg font-semibold text-slate-900 dark:text-white">{step.title}</h2>
        <p className="mb-6 text-sm text-slate-600 dark:text-slate-400">{step.content}</p>
        <div className="flex justify-between">
          <button
            onClick={() => {
              setIsOpen(false);
              localStorage.setItem('onboardingTourCompleted', 'true');
            }}
            className="text-sm text-slate-500 hover:text-slate-800 dark:text-slate-400"
          >
            Skip
          </button>
          <button
            onClick={handleNext}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            {currentStep === steps.length - 1 ? 'Finish' : 'Next'}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};
