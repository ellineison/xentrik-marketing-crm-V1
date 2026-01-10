
import React from "react";
import { Control } from "react-hook-form";
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { OnboardingFormValues } from "./OnboardingForm";
import { Instagram, Twitter, Video, Youtube } from "lucide-react";
import { RedditIcon } from "@/components/icons/RedditIcon";

const TiktokIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-brand-tiktok">
    <path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5" />
  </svg>
);

interface OnboardingSocialLinksProps {
  control: Control<OnboardingFormValues>;
}

const OnboardingSocialLinks: React.FC<OnboardingSocialLinksProps> = ({ control }) => {
  return (
    <div className="rounded-xl bg-gradient-to-br from-card/50 to-card/30 backdrop-blur-sm p-6 border border-border/50 shadow-lg">
      <h2 className="text-lg font-semibold mb-4 text-foreground">Social Media Links</h2>
      <div className="grid gap-4">
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={control}
            name="instagram"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="flex items-center gap-1.5">
                  <Instagram className="h-4 w-4 text-pink-500" /> Instagram
                </FormLabel>
                <FormControl>
                  <Input placeholder="https://instagram.com/profile" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={control}
            name="tiktok"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="flex items-center gap-1.5">
                  <TiktokIcon /> <span className="ml-1">TikTok</span>
                </FormLabel>
                <FormControl>
                  <Input placeholder="https://tiktok.com/@username" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={control}
            name="twitter"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="flex items-center gap-1.5">
                  <Twitter className="h-4 w-4 text-blue-500" /> Twitter
                </FormLabel>
                <FormControl>
                  <Input placeholder="https://twitter.com/username" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={control}
            name="reddit"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="flex items-center gap-1.5">
                  <RedditIcon className="h-4 w-4" /> <span className="ml-1">Reddit</span>
                </FormLabel>
                <FormControl>
                  <Input placeholder="https://reddit.com/user/username" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      </div>
    </div>
  );
};

export default OnboardingSocialLinks;
