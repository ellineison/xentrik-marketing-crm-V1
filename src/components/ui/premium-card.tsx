
import React from "react";
import { Card, CardContent, CardFooter, CardHeader } from "./card";
import { cn } from "@/lib/utils";

interface PremiumCardProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
  headerClassName?: string;
  contentClassName?: string;
  footerClassName?: string;
  header?: React.ReactNode;
  footer?: React.ReactNode;
}

export const PremiumCard: React.FC<PremiumCardProps> = ({
  className,
  headerClassName,
  contentClassName,
  footerClassName,
  header,
  footer,
  children,
  ...props
}) => {
  return (
    <Card
      className={cn(
        "bg-card/50 backdrop-blur-sm border border-border/50 rounded-xl overflow-hidden",
        className
      )}
      {...props}
    >
      {header && <CardHeader className={cn("p-6", headerClassName)}>{header}</CardHeader>}
      <CardContent className={cn("p-6", !header && "pt-6", contentClassName)}>
        {children}
      </CardContent>
      {footer && <CardFooter className={cn("p-6 border-t border-border/50", footerClassName)}>{footer}</CardFooter>}
    </Card>
  );
};

export default PremiumCard;
