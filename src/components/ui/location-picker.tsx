
import React, { useState, useEffect, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { MapPin, Search, Clock } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { getTimezoneFromCoordinates, formatTimeForTimezone } from '@/utils/timezoneUtils';

interface LocationSuggestion {
  display_name: string;
  lat: string;
  lon: string;
  place_id: string;
  timezone?: string;
}

interface LocationPickerProps {
  value: string;
  onChange: (location: string, coordinates?: { lat: number; lon: number }, timezone?: string) => void;
  placeholder?: string;
  className?: string;
  showCurrentTime?: boolean;
}

// Fallback location data for common cities when API fails
const FALLBACK_LOCATIONS: LocationSuggestion[] = [
  { display_name: "Manila, Philippines", lat: "14.5995", lon: "120.9842", place_id: "manila" },
  { display_name: "New York, NY, USA", lat: "40.7128", lon: "-74.0060", place_id: "new-york" },
  { display_name: "London, England, United Kingdom", lat: "51.5074", lon: "-0.1278", place_id: "london" },
  { display_name: "Tokyo, Japan", lat: "35.6762", lon: "139.6503", place_id: "tokyo" },
  { display_name: "Sydney, Australia", lat: "-33.8688", lon: "151.2093", place_id: "sydney" },
  { display_name: "Paris, France", lat: "48.8566", lon: "2.3522", place_id: "paris" },
  { display_name: "Berlin, Germany", lat: "52.5200", lon: "13.4050", place_id: "berlin" },
  { display_name: "Los Angeles, CA, USA", lat: "34.0522", lon: "-118.2437", place_id: "los-angeles" },
  { display_name: "Dubai, UAE", lat: "25.2048", lon: "55.2708", place_id: "dubai" },
  { display_name: "Singapore", lat: "1.3521", lon: "103.8198", place_id: "singapore" },
  { display_name: "Mumbai, India", lat: "19.0760", lon: "72.8777", place_id: "mumbai" },
  { display_name: "Bangkok, Thailand", lat: "13.7563", lon: "100.5018", place_id: "bangkok" },
  { display_name: "Hong Kong", lat: "22.3193", lon: "114.1694", place_id: "hong-kong" },
  { display_name: "Seoul, South Korea", lat: "37.5665", lon: "126.9780", place_id: "seoul" },
  { display_name: "Toronto, Canada", lat: "43.6532", lon: "-79.3832", place_id: "toronto" },
];

export const LocationPicker: React.FC<LocationPickerProps> = ({
  value,
  onChange,
  placeholder = "Search for a location...",
  className = "",
  showCurrentTime = false
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [suggestions, setSuggestions] = useState<LocationSuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState(value);
  const [selectedTimezone, setSelectedTimezone] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState<string>('');
  const [apiError, setApiError] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout>();

  // Sync searchTerm with value prop when it changes
  useEffect(() => {
    setSearchTerm(value);
  }, [value]);

  // Update current time if timezone is available
  useEffect(() => {
    if (selectedTimezone && showCurrentTime) {
      const updateTime = () => {
        const formattedTime = formatTimeForTimezone(selectedTimezone);
        setCurrentTime(formattedTime);
      };

      updateTime();
      const interval = setInterval(updateTime, 1000);
      return () => clearInterval(interval);
    }
  }, [selectedTimezone, showCurrentTime]);

  const searchLocations = async (query: string) => {
    if (query.length < 2) {
      setSuggestions([]);
      return;
    }

    setLoading(true);
    setApiError(false);
    
    try {
      // Try Nominatim API first
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5&addressdetails=1`
      );
      
      if (!response.ok) {
        throw new Error('API request failed');
      }
      
      const data = await response.json();
      
      // Format the suggestions
      const formattedSuggestions: LocationSuggestion[] = data.map((item: any) => ({
        display_name: item.display_name,
        lat: item.lat,
        lon: item.lon,
        place_id: item.place_id
      }));
      
      setSuggestions(formattedSuggestions);
    } catch (error) {
      console.error('Error fetching locations:', error);
      setApiError(true);
      
      // Fallback to local search when API fails
      const filteredFallback = FALLBACK_LOCATIONS.filter(location =>
        location.display_name.toLowerCase().includes(query.toLowerCase())
      );
      setSuggestions(filteredFallback);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchTerm(query);
    
    // Clear existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    // Debounce the search
    timeoutRef.current = setTimeout(() => {
      if (query.trim()) {
        searchLocations(query);
        setIsOpen(true);
      } else {
        setSuggestions([]);
        setIsOpen(false);
      }
    }, 300);
  };

  const handleSuggestionClick = async (suggestion: LocationSuggestion) => {
    const lat = parseFloat(suggestion.lat);
    const lon = parseFloat(suggestion.lon);
    
    // Get timezone using improved geographic inference with DST awareness
    const timezone = getTimezoneFromCoordinates(lat, lon);
    
    setSearchTerm(suggestion.display_name);
    setSelectedTimezone(timezone);
    setIsOpen(false);
    setSuggestions([]);
    
    onChange(suggestion.display_name, { lat, lon }, timezone);
  };

  const handleInputFocus = () => {
    if (suggestions.length > 0) {
      setIsOpen(true);
    } else if (searchTerm.length >= 2) {
      // Trigger search on focus if there's existing text
      searchLocations(searchTerm);
      setIsOpen(true);
    }
  };

  const handleInputBlur = () => {
    // If user typed text but didn't select from dropdown, save as plain text immediately
    if (searchTerm && searchTerm !== value) {
      onChange(searchTerm);
    }
    // Delay closing dropdown to allow clicking on suggestions
    setTimeout(() => {
      setIsOpen(false);
    }, 200);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      setIsOpen(false);
      setSuggestions([]);
      // Save the plain text value
      if (searchTerm) {
        onChange(searchTerm);
      }
    }
  };

  return (
    <div className={`relative ${className}`}>
      <div className="relative">
        <Input
          ref={inputRef}
          value={searchTerm}
          onChange={handleInputChange}
          onFocus={handleInputFocus}
          onBlur={handleInputBlur}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="pr-10"
        />
        <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
          {loading ? (
            <Search className="h-4 w-4 animate-spin" />
          ) : (
            <MapPin className="h-4 w-4 text-muted-foreground" />
          )}
        </div>
      </div>
      
      {showCurrentTime && currentTime && (
        <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
          <Clock className="h-3 w-3" />
          <span>Local time: {currentTime}</span>
        </div>
      )}
      
      {isOpen && suggestions.length > 0 && (
        <Card className="absolute top-full left-0 right-0 z-50 mt-1 max-h-60 overflow-y-auto bg-background border shadow-lg">
          <CardContent className="p-0">
            {apiError && (
              <div className="px-3 py-2 text-xs text-muted-foreground bg-muted/50 border-b">
                Using offline locations (API unavailable)
              </div>
            )}
            {suggestions.map((suggestion) => (
              <Button
                key={suggestion.place_id}
                variant="ghost"
                className="w-full justify-start text-left h-auto p-3 rounded-none border-b last:border-b-0 hover:bg-muted/50"
                onClick={() => handleSuggestionClick(suggestion)}
              >
                <div className="flex items-start gap-2">
                  <MapPin className="h-4 w-4 mt-0.5 text-muted-foreground flex-shrink-0" />
                  <span className="text-sm break-words">{suggestion.display_name}</span>
                </div>
              </Button>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default LocationPicker;
