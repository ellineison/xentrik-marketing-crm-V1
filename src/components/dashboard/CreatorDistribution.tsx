
import React from "react";
import { LineChart } from "lucide-react";

interface CreatorDistributionProps {
  isLoading: boolean;
  maleCreators: number;
  femaleCreators: number;
  transCreators: number;
  aiCreators: number;
}

const CreatorDistribution: React.FC<CreatorDistributionProps> = ({
  isLoading,
  maleCreators,
  femaleCreators,
  transCreators,
  aiCreators,
}) => {
  return (
    <div className="premium-card mb-8 hover:border-brand-yellow/50">
      <h2 className="text-xl font-bold mb-6 text-foreground flex items-center">
        <LineChart className="h-5 w-5 mr-2 text-brand-yellow" />
        Creator Distribution
      </h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        <DistributionItem label="Male" value={maleCreators} isLoading={isLoading} />
        <DistributionItem label="Female" value={femaleCreators} isLoading={isLoading} />
        <DistributionItem label="Trans" value={transCreators} isLoading={isLoading} />
        <DistributionItem label="AI" value={aiCreators} isLoading={isLoading} />
      </div>
    </div>
  );
};

interface DistributionItemProps {
  label: string;
  value: number;
  isLoading: boolean;
}

const DistributionItem: React.FC<DistributionItemProps> = ({ label, value, isLoading }) => (
  <div className="p-4 rounded-lg bg-card/50 border border-border hover:border-primary/30 transition-all">
    <h3 className="text-sm font-medium text-muted-foreground mb-1">{label}</h3>
    <p className="text-2xl font-bold text-foreground">{isLoading ? '...' : value}</p>
  </div>
);

export default CreatorDistribution;
