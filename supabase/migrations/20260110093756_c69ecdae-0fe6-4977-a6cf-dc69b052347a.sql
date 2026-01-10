-- Create model_schedules table for calendar events per creator
CREATE TABLE public.model_schedules (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    creator_id TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    end_time TIMESTAMP WITH TIME ZONE NOT NULL,
    all_day BOOLEAN NOT NULL DEFAULT false,
    color TEXT DEFAULT '#3b82f6',
    created_by UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    CONSTRAINT fk_creator FOREIGN KEY (creator_id) REFERENCES public.creators(id) ON DELETE CASCADE,
    CONSTRAINT fk_created_by FOREIGN KEY (created_by) REFERENCES public.profiles(id) ON DELETE SET NULL
);

-- Enable Row Level Security
ALTER TABLE public.model_schedules ENABLE ROW LEVEL SECURITY;

-- Admins can manage all schedules (create, read, update, delete)
CREATE POLICY "Admins can manage all schedules"
ON public.model_schedules
FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid()
        AND (profiles.role = 'Admin' OR 'Admin' = ANY(profiles.roles))
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid()
        AND (profiles.role = 'Admin' OR 'Admin' = ANY(profiles.roles))
    )
);

-- VAs, Chatters, and Marketing Team can view schedules
CREATE POLICY "Authorized users can view schedules"
ON public.model_schedules
FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid()
        AND (
            profiles.role IN ('Admin', 'VA', 'Chatter', 'Marketing Team')
            OR 'Admin' = ANY(profiles.roles)
            OR 'VA' = ANY(profiles.roles)
            OR 'Chatter' = ANY(profiles.roles)
            OR 'Marketing Team' = ANY(profiles.roles)
        )
    )
);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_model_schedules_updated_at
BEFORE UPDATE ON public.model_schedules
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for faster queries
CREATE INDEX idx_model_schedules_creator_id ON public.model_schedules(creator_id);
CREATE INDEX idx_model_schedules_start_time ON public.model_schedules(start_time);
CREATE INDEX idx_model_schedules_end_time ON public.model_schedules(end_time);