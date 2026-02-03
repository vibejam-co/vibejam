-- Migration: 20260131140000_notifications
-- Description: Notifications for follows and signals

CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    recipient_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    actor_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    type TEXT NOT NULL CHECK (type IN ('follow', 'comment', 'reply')),
    jam_id UUID REFERENCES public.jams(id) ON DELETE CASCADE,
    signal_id UUID REFERENCES public.jam_signals(id) ON DELETE CASCADE,
    data JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    read_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_notifications_recipient_created ON public.notifications (recipient_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_recipient_unread ON public.notifications (recipient_id, read_at);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Notifications are visible to recipients"
ON public.notifications FOR SELECT
USING (auth.uid() = recipient_id);

CREATE POLICY "Recipients can update their notifications"
ON public.notifications FOR UPDATE
USING (auth.uid() = recipient_id);

CREATE POLICY "Service role inserts notifications"
ON public.notifications FOR INSERT
WITH CHECK (auth.role() = 'service_role');

-- Follow notification trigger
CREATE OR REPLACE FUNCTION public.notify_follow()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.follower_id = NEW.following_id THEN
        RETURN NULL;
    END IF;

    INSERT INTO public.notifications (recipient_id, actor_id, type, data)
    VALUES (
        NEW.following_id,
        NEW.follower_id,
        'follow',
        jsonb_build_object('follower_id', NEW.follower_id)
    );

    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_follow_notify ON public.follows;
CREATE TRIGGER on_follow_notify
AFTER INSERT ON public.follows
FOR EACH ROW EXECUTE FUNCTION public.notify_follow();

-- Signal notification trigger
CREATE OR REPLACE FUNCTION public.notify_signal()
RETURNS TRIGGER AS $$
DECLARE
    jam_creator UUID;
    parent_owner UUID;
BEGIN
    SELECT creator_id INTO jam_creator FROM public.jams WHERE id = NEW.jam_id;

    -- Notify jam creator on new comment (if not self)
    IF jam_creator IS NOT NULL AND jam_creator <> NEW.user_id THEN
        INSERT INTO public.notifications (recipient_id, actor_id, type, jam_id, signal_id, data)
        VALUES (
            jam_creator,
            NEW.user_id,
            'comment',
            NEW.jam_id,
            NEW.id,
            jsonb_build_object('jam_id', NEW.jam_id)
        );
    END IF;

    -- Notify parent comment owner on reply (if not self)
    IF NEW.parent_id IS NOT NULL THEN
        SELECT user_id INTO parent_owner FROM public.jam_signals WHERE id = NEW.parent_id;
        IF parent_owner IS NOT NULL AND parent_owner <> NEW.user_id THEN
            -- Avoid duplicate if parent owner is jam creator and already notified
            IF parent_owner <> jam_creator THEN
                INSERT INTO public.notifications (recipient_id, actor_id, type, jam_id, signal_id, data)
                VALUES (
                    parent_owner,
                    NEW.user_id,
                    'reply',
                    NEW.jam_id,
                    NEW.id,
                    jsonb_build_object('jam_id', NEW.jam_id, 'parent_id', NEW.parent_id)
                );
            END IF;
        END IF;
    END IF;

    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_signal_notify ON public.jam_signals;
CREATE TRIGGER on_signal_notify
AFTER INSERT ON public.jam_signals
FOR EACH ROW EXECUTE FUNCTION public.notify_signal();
