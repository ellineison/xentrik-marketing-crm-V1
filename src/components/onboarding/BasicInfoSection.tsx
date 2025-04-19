import React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Gender, Team, CreatorType } from "@/types";

interface BasicInfoSectionProps {
  name: string;
  setName: (name: string) => void;
  gender: Gender;
  setGender: (gender: Gender) => void;
  team: Team;
  setTeam: (team: Team) => void;
  creatorType: CreatorType;
  setCreatorType: (type: CreatorType) => void;
  errors: {
    name?: string;
    gender?: string;
    team?: string;
    creatorType?: string;
  };
}

const BasicInfoSection: React.FC<BasicInfoSectionProps> = ({
  name,
  setName,
  gender,
  setGender,
  team,
  setTeam,
  creatorType,
  setCreatorType,
  errors = {}
}) => {
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold">Basic Information</h2>
      <div className="grid grid-cols-1 gap-4">
        <div className="space-y-2">
          <Label htmlFor="name" className="flex items-center">
            Name <span className="text-red-500 ml-1">*</span>
          </Label>
          <Input 
            id="name" 
            value={name} 
            onChange={(e) => setName(e.target.value)} 
            className={errors.name ? "border-red-500" : ""} 
            placeholder="Enter creator name"
            required
          />
          {errors.name && (
            <p className="text-red-500 text-sm">{errors.name}</p>
          )}
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="gender" className="flex items-center">
            Gender <span className="text-red-500 ml-1">*</span>
          </Label>
          <Select 
            onValueChange={(value) => setGender(value as Gender)} 
            value={gender}
          >
            <SelectTrigger id="gender" className={errors.gender ? "border-red-500" : ""}>
              <SelectValue placeholder="Select gender" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Male">Male</SelectItem>
              <SelectItem value="Female">Female</SelectItem>
              <SelectItem value="Trans">Trans</SelectItem>
            </SelectContent>
          </Select>
          {errors.gender && (
            <p className="text-red-500 text-sm">{errors.gender}</p>
          )}
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="team" className="flex items-center">
            Team <span className="text-red-500 ml-1">*</span>
          </Label>
          <Select 
            onValueChange={(value) => setTeam(value as Team)} 
            value={team}
          >
            <SelectTrigger id="team" className={errors.team ? "border-red-500" : ""}>
              <SelectValue placeholder="Select team" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="A Team">A Team</SelectItem>
              <SelectItem value="B Team">B Team</SelectItem>
              <SelectItem value="C Team">C Team</SelectItem>
            </SelectContent>
          </Select>
          {errors.team && (
            <p className="text-red-500 text-sm">{errors.team}</p>
          )}
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="creatorType" className="flex items-center">
            Creator Type <span className="text-red-500 ml-1">*</span>
          </Label>
          <Select 
            onValueChange={(value) => setCreatorType(value as CreatorType)} 
            value={creatorType}
          >
            <SelectTrigger id="creatorType" className={errors.creatorType ? "border-red-500" : ""}>
              <SelectValue placeholder="Select creator type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Real">Real</SelectItem>
              <SelectItem value="AI">AI</SelectItem>
            </SelectContent>
          </Select>
          {errors.creatorType && (
            <p className="text-red-500 text-sm">{errors.creatorType}</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default BasicInfoSection;
