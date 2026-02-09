import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, BookOpen, Sparkles } from 'lucide-react';
import { useWordOfTheDay } from '@/hooks/useWordOfTheDay';

const WordOfTheDayWidget: React.FC = () => {
  const { dailyWord, isLoading, error } = useWordOfTheDay();

  if (isLoading) {
    return (
      <Card className="bg-gradient-to-br from-purple-500/10 to-pink-500/5 border-purple-500/20">
        <CardContent className="py-8 flex items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-purple-500" />
        </CardContent>
      </Card>
    );
  }

  if (error || !dailyWord) {
    return null; // Silently fail - widget is optional
  }

  return (
    <Card className="bg-gradient-to-br from-purple-500/10 to-pink-500/5 border-purple-500/20 overflow-hidden">
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-medium text-muted-foreground flex items-center gap-2">
          <BookOpen className="h-5 w-5" />
          Word of the Day
          <Sparkles className="h-4 w-4 text-yellow-500" />
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="flex items-baseline gap-3">
            <h3 className="text-3xl font-bold text-purple-400" style={{ fontFamily: "'Orbitron', sans-serif" }}>{dailyWord.word}</h3>
            {dailyWord.part_of_speech && (
              <Badge variant="outline" className="text-sm text-purple-300 border-purple-300/50">
                {dailyWord.part_of_speech}
              </Badge>
            )}
          </div>
          {dailyWord.definition && (
            <p className="text-base text-muted-foreground italic">
              "{dailyWord.definition}"
            </p>
          )}
          <p className="text-sm text-muted-foreground mt-3">
            Use this word in your conversations today! 🎯
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default WordOfTheDayWidget;
