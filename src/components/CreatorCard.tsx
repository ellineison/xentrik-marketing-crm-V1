
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Creator } from '@/types';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LineChart, FileText, LogIn, Files, Share2, Loader2, DollarSign, Edit } from 'lucide-react';
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/context/AuthContext";
import { useIsMobile } from "@/hooks/use-mobile";
import SecureLoginModal from './creators/secure-logins/SecureLoginModal';

interface CreatorCardProps {
  creator: Creator;
  variant?: 'default' | 'files' | 'marketing-files';
  fileCount?: number;
  showUploadingIndicator?: boolean;
  uploadingCount?: number;
  permissions?: {
    canEdit: boolean;
    canDelete: boolean;
    canUpload: boolean;
    canDownload: boolean;
  };
}

const CreatorCard = ({ 
  creator, 
  variant = 'default', 
  fileCount = 0, 
  showUploadingIndicator = false,
  uploadingCount = 0,
  permissions 
}: CreatorCardProps) => {
  const { toast } = useToast();
  const { userRole } = useAuth();
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const [showLoginModal, setShowLoginModal] = useState(false);

  const handleShareButtonClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Generate upload link
    const uploadUrl = `/upload/${creator.id}`;
    
    // Copy link to clipboard
    navigator.clipboard.writeText(`${window.location.origin}${uploadUrl}`);
    
    toast({
      title: "Upload link copied!",
      description: `Share this link with ${creator.modelName || creator.name} to let them upload files directly.`,
    });
  };

  const handleLoginButtonClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setShowLoginModal(true);
  };

  const handleEditButtonClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    navigate(`/creators/${creator.id}`);
  };

  // Check if user has Admin privileges or permission to upload
  const isAdmin = userRole === "Admin";
  // Use permissions if provided, otherwise default to only admin having privileges
  const canUpload = permissions?.canUpload || isAdmin;

  // Get gender-specific badge styling
  const getGenderBadgeClass = (gender: string) => {
    switch (gender.toLowerCase()) {
      case 'male':
        return "bg-blue-900/40 text-blue-200 hover:bg-blue-900/60";
      case 'female':
        return "bg-pink-900/40 text-pink-200 hover:bg-pink-900/60";
      case 'trans':
        return "bg-purple-900/40 text-purple-200 hover:bg-purple-900/60";
      default:
        return "bg-gray-900/40 text-gray-200 hover:bg-gray-900/60";
    }
  };

  // Get platform-specific emblem styling - using app's muted aesthetic
  const getPlatformEmblemStyle = (platform: string) => {
    switch (platform.toLowerCase()) {
      case 'twitter':
      case 'x':
        return {
          className: "bg-slate-900/40 text-slate-200 hover:bg-slate-900/60",
          text: "X"
        };
      case 'instagram':
        return {
          className: "bg-rose-900/40 text-rose-200 hover:bg-rose-900/60",
          text: "IG"
        };
      case 'chaturbate':
        return {
          className: "bg-amber-900/40 text-amber-200 hover:bg-amber-900/60",
          text: "CB"
        };
      case 'tiktok':
        return {
          className: "bg-violet-900/40 text-violet-200 hover:bg-violet-900/60",
          text: "TT"
        };
      case 'reddit':
        return {
          className: "bg-orange-900/40 text-orange-200 hover:bg-orange-900/60",
          text: "R"
        };
      default:
        return {
          className: "bg-emerald-900/40 text-emerald-200 hover:bg-emerald-900/60",
          text: platform.charAt(0).toUpperCase()
        };
    }
  };

  return (
    <>
      <Card className="p-4 md:p-6 hover:bg-accent/5 transition-colors group cursor-pointer">
        <div className="flex items-start md:items-center gap-4 md:gap-6">
          <div className="shrink-0">
            {creator.profileImage ? (
              <img 
                src={creator.profileImage} 
                alt={creator.modelName || creator.name} 
                className="w-12 h-12 md:w-14 md:h-14 rounded-full object-cover border-2 border-primary/20 group-hover:border-primary/40 transition-all"
              />
            ) : (
              <div className="w-12 h-12 md:w-14 md:h-14 rounded-full bg-muted/50 flex items-center justify-center">
                <span className="text-lg md:text-xl font-semibold text-primary/60 group-hover:text-primary/80 transition-colors">
                  {(creator.modelName || creator.name)[0].toUpperCase()}
                </span>
              </div>
            )}
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex flex-col min-w-0">
                <div className="text-left">
                  <h3 className="text-xl md:text-2xl font-semibold group-hover:text-primary transition-colors truncate mb-1">
                    {creator.modelName || creator.name}
                  </h3>
                  {creator.email && (
                    <div className="text-sm md:text-base text-muted-foreground mb-3">
                      {creator.email}
                    </div>
                  )}
                   <div className="flex gap-2 md:gap-3 mt-2 flex-wrap">
                    <Badge 
                      variant="secondary" 
                      className={`${getGenderBadgeClass(creator.gender)} text-xs md:text-sm px-3 py-1`}
                    >
                      {creator.gender}
                    </Badge>
                    <Badge 
                      variant="secondary" 
                      className="bg-yellow-900/40 text-yellow-200 hover:bg-yellow-900/60 text-xs md:text-sm px-3 py-1"
                    >
                      {creator.team}
                    </Badge>
                    <Badge 
                      variant="secondary" 
                      className="bg-blue-900/40 text-blue-200 hover:bg-blue-900/60 text-xs md:text-sm px-3 py-1"
                    >
                      {creator.creatorType}
                    </Badge>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center justify-end gap-1.5 md:gap-3 flex-shrink-0">
                {variant === 'default' ? (
                  // Default view for Creators page
                  <>
                    {isAdmin && (
                      <div className="flex items-center gap-1.5 md:gap-3">
                        
                        <Link to={`/creator-invoices/${creator.id}`} onClick={(e) => e.stopPropagation()}>
                          <Button 
                            variant="ghost" 
                            size={isMobile ? "sm" : "default"}
                            className={`${isMobile ? 'px-2 h-8 text-xs' : 'px-4 h-10'} bg-green-600/80 text-white hover:opacity-90 transition-all`}
                          >
                            <FileText className={`${isMobile ? 'h-3 w-3 mr-1' : 'h-4 w-4 mr-2'}`} />
                            {isMobile ? 'Invoices' : 'Invoices'}
                          </Button>
                        </Link>
                        
                        <Button 
                          variant="secondary" 
                          size={isMobile ? "sm" : "default"}
                          className={`${isMobile ? 'h-8 px-2 text-xs' : 'h-10 px-4'}`}
                          onClick={handleEditButtonClick}
                        >
                          <Edit className={`${isMobile ? 'h-3 w-3 mr-1' : 'h-4 w-4 mr-2'}`} />
                          {isMobile ? 'Edit' : 'Edit Info'}
                        </Button>
                        
                      </div>
                    )}
                    
                  </>
                ) : (
                  // Files view for SharedFiles and MarketingFiles pages
                  <div className={`flex flex-col gap-2 ${variant === 'marketing-files' && isMobile ? 'items-center' : 'items-end'}`}>
                    <div className="flex items-center gap-1.5 md:gap-3">
                      <Link to={variant === 'marketing-files' ? `/creator-marketing-files/${creator.id}` : `/creator-files/${creator.id}`} onClick={(e) => e.stopPropagation()}>
                        <Button 
                          variant="ghost" 
                          size={isMobile ? "sm" : "default"}
                          className={`${isMobile ? 'px-2 h-8 text-xs' : 'px-6 h-10'} bg-gradient-premium-yellow text-black hover:opacity-90 transition-all`}
                        >
                          <Files className={`${isMobile ? 'h-3 w-3 mr-1' : 'h-4 w-4 mr-2'}`} />
                          {variant === 'marketing-files' ? 'Marketing Files' : 'Files'}
                          {fileCount > 0 && (
                            <span className={`ml-1 bg-primary/20 text-black px-1.5 py-0.5 rounded-full ${isMobile ? 'text-xs' : 'text-xs'}`}>
                              {fileCount}
                            </span>
                          )}
                          
                          {showUploadingIndicator && (
                            <span className={`ml-1 flex items-center ${isMobile ? 'text-xs' : 'text-xs'}`}>
                              <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                              {uploadingCount}
                            </span>
                          )}
                        </Button>
                      </Link>
                      
                      {/* Show Share button only for files variant (not marketing-files) */}
                      {variant !== 'marketing-files' && canUpload && (
                        <Button 
                          variant="secondary" 
                          size={isMobile ? "sm" : "default"}
                          className={`${isMobile ? 'h-8 px-2' : 'h-10 px-4'}`}
                          onClick={handleShareButtonClick}
                        >
                          <Share2 className={`${isMobile ? 'h-3 w-3' : 'h-4 w-4'}`} />
                          {!isMobile && <span className="ml-2">Share</span>}
                        </Button>
                      )}
                    </div>
                    
                    {/* Show marketing strategy badges under Marketing Files button */}
                    {variant === 'marketing-files' && creator.marketingStrategy && creator.marketingStrategy.length > 0 && (
                      <div className={`flex gap-1 md:gap-2 flex-wrap ${isMobile ? 'justify-center' : 'justify-end'}`}>
                        {creator.marketingStrategy.map((strategy) => {
                          const emblem = getPlatformEmblemStyle(strategy);
                          return (
                            <Badge 
                              key={strategy}
                              variant="secondary" 
                              className={`${emblem.className} text-xs px-2 py-0.5 font-bold transition-all duration-200 hover-scale`}
                              title={`Marketing Strategy: ${strategy}`}
                            >
                              {emblem.text}
                            </Badge>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </Card>

      <SecureLoginModal 
        open={showLoginModal} 
        onOpenChange={setShowLoginModal} 
        creatorId={creator.id} 
        creatorName={creator.modelName || creator.name}
      />
    </>
  );
};

export default CreatorCard;
