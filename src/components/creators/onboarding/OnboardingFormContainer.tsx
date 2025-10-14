
import React, { ReactNode } from "react";

interface OnboardingFormContainerProps {
  children: ReactNode;
}

const OnboardingFormContainer: React.FC<OnboardingFormContainerProps> = ({ children }) => {
  return (
    <div className="max-w-6xl mx-auto">
      {children}
    </div>
  );
};

export default OnboardingFormContainer;
