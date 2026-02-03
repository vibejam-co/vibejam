-- Seed Data: Canonical Badge Definitions

INSERT INTO public.badge_definitions (id, tier, category, metadata)
VALUES 
    (
        'founding_creator', 
        10, 
        'identity', 
        '{
            "name": "Founding Creator", 
            "description": "Among the first to join VibeJam.", 
            "icon": "💎",
            "aura_color": "#E6C89A" 
        }'::jsonb
    ),
    (
        'early_adopter',
        5,
        'identity',
        '{
            "name": "Early Adopter",
            "description": "Joined during the beta phase.",
            "icon": "🚀",
            "aura_color": "#3B82F6"
        }'::jsonb
    ),
    (
        'trendsetter',
        8,
        'achievement',
        '{
            "name": "Trendsetter",
            "description": "Created a Jam that reached 100+ upvotes.",
            "icon": "🔥",
            "aura_color": "#F43F5E"
        }'::jsonb
    )
ON CONFLICT (id) DO UPDATE 
SET 
    metadata = EXCLUDED.metadata,
    tier = EXCLUDED.tier;
