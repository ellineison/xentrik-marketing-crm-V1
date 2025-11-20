import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Eye, EyeOff, Save } from 'lucide-react';
import { Creator } from '../../types';
import { useToast } from '@/hooks/use-toast';
import { LoginDetail } from '@/hooks/useSecureLogins';
import SocialMediaManager from './SocialMediaManager';
import LockButton from './LockButton';

interface LoginDetailsEditorProps {
  creator: Creator;
  loginDetails: {
    [platform: string]: LoginDetail;
  };
  onUpdateLogin: (platform: string, field: string, value: string) => void;
  onSaveLoginDetails: (platform: string) => void;
  onLock: () => void;
}

const LoginDetailsEditor: React.FC<LoginDetailsEditorProps> = ({
  creator,
  loginDetails,
  onUpdateLogin,
  onSaveLoginDetails,
  onLock
}) => {
  const [showPasswords, setShowPasswords] = useState<Record<string, boolean>>({});
  const { toast } = useToast();

  const togglePasswordVisibility = (platform: string) => {
    setShowPasswords(prev => ({
      ...prev,
      [platform]: !prev[platform]
    }));
  };

  const getLoginDetail = (platform: string, field: keyof LoginDetail) => {
    if (!loginDetails[platform]) return "";
    return loginDetails[platform][field] || "";
  };

  const handleInputChange = (platform: string, field: string, value: string) => {
    onUpdateLogin(platform, field, value);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{creator.modelName || creator.name}'s Login Details</CardTitle>
          <CardDescription>
            Securely store login information for {creator.modelName || creator.name}'s accounts
          </CardDescription>
        </CardHeader>
        <CardContent>
          <SocialMediaManager creator={creator} onLock={onLock} />
          
          {Object.entries(creator.socialLinks).filter(([_, url]) => url).length > 0 && (
            <div className="mt-8">
              <h4 className="text-lg font-semibold mb-4">Platform Login Details</h4>
              <Tabs defaultValue={Object.keys(creator.socialLinks).find(platform => creator.socialLinks[platform])}>
                <TabsList className="mb-4">
                  {Object.entries(creator.socialLinks)
                    .filter(([_, url]) => url)
                    .map(([platform, _]) => (
                      <TabsTrigger key={platform} value={platform} className="capitalize rounded-[15px]">
                        {platform}
                      </TabsTrigger>
                    ))}
                </TabsList>
                
                {Object.entries(creator.socialLinks)
                  .filter(([_, url]) => url)
                  .map(([platform, url]) => (
                    <TabsContent key={platform} value={platform}>
                      <div className="space-y-4">
                        <div>
                          <Label>Account URL</Label>
                          <div className="p-2 border rounded-[15px] mt-1 bg-muted/30">
                            {url}
                          </div>
                        </div>
                        
                        <div className="space-y-2">
                          <Label>Username</Label>
                          <Input 
                            placeholder="Enter username"
                            value={getLoginDetail(platform, "username")}
                            onChange={(e) => handleInputChange(platform, "username", e.target.value)}
                            className="rounded-[15px]"
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <Label>Password</Label>
                          <div className="flex">
                            <Input 
                              type={showPasswords[platform] ? "text" : "password"}
                              placeholder="Enter password"
                              value={getLoginDetail(platform, "password")}
                              onChange={(e) => handleInputChange(platform, "password", e.target.value)}
                              className="flex-1 rounded-[15px]"
                            />
                            <Button 
                              type="button" 
                              variant="outline" 
                              size="icon"
                              onClick={() => togglePasswordVisibility(platform)}
                              className="ml-2 rounded-[15px] transition-all duration-300 hover:opacity-90"
                            >
                              {showPasswords[platform] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </Button>
                          </div>
                        </div>
                        
                        <div className="space-y-2">
                          <Label>Additional Notes</Label>
                          <Input 
                            placeholder="Any additional information"
                            value={getLoginDetail(platform, "notes")}
                            onChange={(e) => handleInputChange(platform, "notes", e.target.value)}
                            className="rounded-[15px]"
                          />
                        </div>
                        
                        <Button 
                          onClick={() => onSaveLoginDetails(platform)}
                          className="w-full mt-4 rounded-[15px]"
                          variant="premium"
                        >
                          <Save className="w-4 h-4 mr-2" />
                          Save {platform} Login Details
                        </Button>
                      </div>
                    </TabsContent>
                  ))}
              </Tabs>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default LoginDetailsEditor;
