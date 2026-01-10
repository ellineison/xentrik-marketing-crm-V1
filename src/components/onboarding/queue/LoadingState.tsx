
import React from "react";
import { Loader2 } from "lucide-react";

const LoadingState: React.FC = () => {
  return (
    <div className="text-center py-8 md:py-12 text-foreground">
      <Loader2 className="h-8 w-8 md:h-10 md:w-10 mx-auto mb-3 animate-spin text-primary" />
      <p className="text-sm md:text-base">Loading submissions...</p>
    </div>
  );
};

export default LoadingState;
