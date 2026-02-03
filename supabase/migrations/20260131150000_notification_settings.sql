-- Migration: 20260131150000_notification_settings
-- Description: Notification preferences for users

CREATE TABLE IF NOT EXISTS public.notification_settings (
    recipient_id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
    notify_follow BOOLEAN NOT NULL DEFAULT true,
    notify_comment BOOLEAN NOT NULL DEFAULT true,
    notify_reply BOOLEAN NOT NULL DEFAULT true,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.notification_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own notification settings"
ON public.notification_settings FOR SELECT
USING (auth.uid() = recipient_id);

CREATE POLICY "Users can update own notification settings"
ON public.notification_settings FOR UPDATE
USING (auth.uid() = recipient_id);

CREATE POLICY "Users can insert own notification settings"
ON public.notification_settings FOR INSERT
WITH CHECK (auth.uid() = recipient_id);

-- Update notification triggers to respect settings
CREATE OR REPLACE FUNCTION public.notify_follow()
RETURNS TRIGGER AS $$
DECLARE
    prefs record;
BEGIN
    IF NEW.follower_id = NEW.following_id THEN
        RETURN NULL;
    END IF;

    SELECT * INTO prefs FROM public.notification_settings WHERE recipient_id = NEW.following_id;
    IF prefs.notify_follow IS NOT TRUE AND prefs.recipient_id IS NOT NULL THEN
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

CREATE OR REPLACE FUNCTION public.notify_signal()
RETURNS TRIGGER AS $$
DECLARE
    jam_creator UUID;
    parent_owner UUID;
    prefs_creator record;
    prefs_parent record;
BEGIN
    SELECT creator_id INTO jam_creator FROM public.jams WHERE id = NEW.jam_id;

    -- Notify jam creator on new comment (if not self)
    IF jam_creator IS NOT NULL AND jam_creator <> NEW.user_id THEN
        SELECT * INTO prefs_creator FROM public.notification_settings WHERE recipient_id = jam_creator;
        IF prefs_creator.notify_comment IS TRUE OR prefs_creator.recipient_id IS NULL THEN
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
    END IF;

    -- Notify parent comment owner on reply (if not self)
    IF NEW.parent_id IS NOT NULL THEN
        SELECT user_id INTO parent_owner FROM public.jam_signals WHERE id = NEW.parent_id;
        IF parent_owner IS NOT NULL AND parent_owner <> NEW.user_id THEN
            SELECT * INTO prefs_parent FROM public.notification_settings WHERE recipient_id = parent_owner;
            IF prefs_parent.notify_reply IS TRUE OR prefs_parent.recipient_id IS NULL THEN
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
    END IF;

    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
