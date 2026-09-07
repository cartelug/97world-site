/**
 * 97 WORLD — MARKETPLACE DISCOVERY DATA
 *
 * Page-local metadata for /subs/. Prices and terms deliberately remain in
 * /assets/pricing.js, the site's only commercial source of truth.
 */
(function (window) {
    'use strict';

    window.K97MarketplaceData = [
        {
            id: 'canva-pro', slug: 'canva', name: 'Canva Pro', label: 'Design & creativity',
            primaryCategory: 'create', categories: ['create', 'work'],
            aliases: ['canva', 'design app', 'graphic design'],
            keywords: ['poster', 'flyer', 'social media', 'presentation', 'logo', 'template', 'brand'],
            intents: ['make a poster', 'design social posts', 'create a business presentation'],
            useCases: ['Posters & social', 'Presentations', 'Everyday design'],
            audience: ['creators', 'students', 'businesses'],
            description: 'Create polished presentations, posters and social graphics with premium design tools.',
            art: 'canva', mark: 'C', badge: 'Featured', popularity: 12, manualBoost: 10,
            related: ['capcut-pro', 'adobe-creative-cloud'], alternatives: ['adobe-creative-cloud'],
            availability: { UG: 'available', SS: 'available' }
        },
        {
            id: 'capcut-pro', slug: 'capcut', name: 'CapCut Pro', label: 'Video & motion',
            primaryCategory: 'create', categories: ['create'],
            aliases: ['capcut', 'video editor', 'editing app'],
            keywords: ['tiktok', 'reels', 'short video', 'captions', 'effects', 'edit'],
            intents: ['edit tiktok videos', 'make reels', 'add captions to video'],
            useCases: ['Short-form video', 'Captions & effects', 'Creator workflow'],
            audience: ['creators', 'businesses'],
            description: 'Edit short-form videos with a faster workflow for social content and everyday production.',
            art: 'capcut', mark: '✕', badge: 'Creator pick', popularity: 11, manualBoost: 9,
            related: ['canva-pro', 'adobe-creative-cloud'], alternatives: ['adobe-creative-cloud'],
            availability: { UG: 'available', SS: 'available' }
        },
        {
            id: 'google-ai-pro', slug: 'google-ai', name: 'Google AI Pro', label: 'AI & productivity',
            primaryCategory: 'ai', categories: ['ai', 'work'],
            aliases: ['gemini', 'google gemini', 'google ai'],
            keywords: ['artificial intelligence', 'research', 'writing', 'brainstorm', 'productivity'],
            intents: ['use gemini pro', 'research with ai', 'write with ai'],
            useCases: ['Research', 'Writing support', 'Everyday AI'],
            audience: ['students', 'professionals', 'businesses'],
            description: 'Research, draft and work through ideas with Google’s premium AI experience.',
            art: 'google-ai', mark: 'G', badge: null, popularity: 9, manualBoost: 4,
            related: ['perplexity-pro', 'coursera-plus'], alternatives: ['perplexity-pro'],
            availability: { UG: 'available', SS: 'available' }
        },
        {
            id: 'coursera-plus', slug: 'coursera', name: 'Coursera Plus', label: 'Courses & learning',
            primaryCategory: 'learn', categories: ['learn', 'work'],
            aliases: ['coursera', 'online courses', 'course platform'],
            keywords: ['learn', 'study', 'certificate', 'career', 'skills', 'education'],
            intents: ['learn a new skill', 'take online courses', 'study for my career'],
            useCases: ['Career skills', 'Flexible study', 'Learning library'],
            audience: ['students', 'professionals'],
            description: 'Build practical skills through a broad library of flexible online learning.',
            art: 'coursera', logo: '/assets/logos/coursera.svg', mark: 'C', badge: null, popularity: 7, manualBoost: 2,
            related: ['duolingo-super', 'linkedin-premium-career'], alternatives: ['duolingo-super'],
            availability: { UG: 'available', SS: 'available' }
        },
        {
            id: 'duolingo-super', slug: 'duolingo', name: 'Duolingo Super', label: 'Language learning',
            primaryCategory: 'learn', categories: ['learn'],
            aliases: ['duolingo', 'super duolingo', 'language app'],
            keywords: ['language', 'learn', 'study', 'practice', 'lessons', 'spanish', 'french'],
            intents: ['learn a language', 'practice french', 'practice spanish'],
            useCases: ['Daily practice', 'Guided lessons', 'Language goals'],
            audience: ['students', 'travellers'],
            description: 'Keep language practice focused with a smoother premium learning experience.',
            art: 'duolingo', logo: '/assets/logos/duolingo.svg', mark: 'D', badge: null, popularity: 6, manualBoost: 1,
            related: ['coursera-plus'], alternatives: ['coursera-plus'],
            availability: { UG: 'available', SS: 'available' }
        },
        {
            id: 'perplexity-pro', slug: 'perplexity', name: 'Perplexity Pro', label: 'AI search & research',
            primaryCategory: 'ai', categories: ['ai', 'work'],
            aliases: ['perplexity', 'perplexity ai', 'ai search'],
            keywords: ['research', 'sources', 'answers', 'search engine', 'artificial intelligence'],
            intents: ['research with sources', 'find answers with ai', 'ai search'],
            useCases: ['Source-led answers', 'Deeper research', 'Fast discovery'],
            audience: ['students', 'researchers', 'professionals'],
            description: 'Move from question to source-led answer with a premium AI research workflow.',
            art: 'perplexity', logo: '/assets/logos/perplexity.svg', mark: 'P', badge: null, popularity: 8, manualBoost: 3,
            related: ['google-ai-pro', 'coursera-plus'], alternatives: ['google-ai-pro'],
            availability: { UG: 'available', SS: 'available' }
        },
        {
            id: 'prime-video', slug: 'prime', name: 'Prime Video', label: 'Movies & series',
            primaryCategory: 'watch', categories: ['watch'],
            aliases: ['amazon prime', 'amazon prime video', 'prime'],
            keywords: ['movies', 'series', 'streaming', 'tv', 'entertainment', 'watch'],
            intents: ['watch movies', 'stream a series', 'find entertainment'],
            useCases: ['Movies', 'Series', 'Streaming nights'],
            audience: ['families', 'film fans'],
            description: 'Stream movies and series with fixed-term access and local support when you need it.',
            art: 'prime', mark: 'prime', badge: 'Watch pick', popularity: 10, manualBoost: 8,
            related: ['apple-tv-plus', 'crunchyroll'], alternatives: ['apple-tv-plus', 'crunchyroll'],
            availability: { UG: 'available', SS: 'available' }
        },
        {
            id: 'apple-tv-plus', slug: 'apple-tv', name: 'Apple TV+', label: 'Original films & series',
            primaryCategory: 'watch', categories: ['watch'],
            aliases: ['apple tv', 'apple tv plus', 'appletv'],
            keywords: ['movies', 'series', 'streaming', 'tv', 'originals', 'entertainment'],
            intents: ['watch apple tv', 'stream original series', 'watch films'],
            useCases: ['Original series', 'Films', 'Premium streaming'],
            audience: ['film fans', 'families'],
            description: 'Watch Apple original films and series through a simple fixed-term plan.',
            art: 'apple', mark: 'tv+', badge: null, popularity: 5, manualBoost: 1,
            related: ['prime-video', 'crunchyroll'], alternatives: ['prime-video'],
            availability: { UG: 'available', SS: 'available' }
        },
        {
            id: 'crunchyroll', slug: 'crunchyroll', name: 'Crunchyroll', label: 'Anime streaming',
            primaryCategory: 'watch', categories: ['watch'],
            aliases: ['crunchy roll', 'anime app'],
            keywords: ['anime', 'streaming', 'series', 'shows', 'watch'],
            intents: ['watch anime', 'stream anime series'],
            useCases: ['Anime series', 'New episodes', 'Streaming'],
            audience: ['anime fans'],
            description: 'Keep your anime watchlist moving with fixed-term premium access.',
            art: 'crunchyroll', logo: '/assets/logos/crunchyroll.svg', mark: 'C', badge: null, popularity: 6, manualBoost: 2,
            related: ['prime-video', 'apple-tv-plus'], alternatives: ['prime-video'],
            availability: { UG: 'available', SS: 'available' }
        },
        {
            id: 'linkedin-premium-career', slug: 'linkedin-premium', name: 'LinkedIn Premium Career', label: 'Career & opportunity',
            primaryCategory: 'work', categories: ['work', 'learn'],
            aliases: ['linkedin premium', 'linkedin career', 'premium career'],
            keywords: ['jobs', 'career', 'networking', 'professional', 'learning', 'work'],
            intents: ['find a job', 'grow my career', 'improve my linkedin'],
            useCases: ['Job search', 'Career insights', 'Professional growth'],
            audience: ['professionals', 'job seekers'],
            description: 'Strengthen your job search and professional presence with premium career tools.',
            art: 'linkedin', mark: 'in', badge: null, popularity: 5, manualBoost: 2,
            related: ['coursera-plus', 'canva-pro'], alternatives: ['coursera-plus'],
            availability: { UG: 'available', SS: 'available' }
        },
        {
            id: 'adobe-creative-cloud', slug: 'adobe', name: 'Adobe Creative Cloud', label: 'Professional creative suite',
            primaryCategory: 'create', categories: ['create', 'work'],
            aliases: ['adobe', 'creative cloud', 'adobe cc'],
            keywords: ['photoshop', 'illustrator', 'premiere', 'design', 'photo', 'video', 'creative'],
            intents: ['edit professional photos', 'create graphics', 'edit professional video'],
            useCases: ['Design', 'Photo', 'Video'],
            audience: ['creatives', 'professionals', 'businesses'],
            description: 'Bring professional design, photo and video workflows into one creative suite.',
            art: 'adobe', mark: 'A', badge: null, popularity: 7, manualBoost: 3,
            related: ['canva-pro', 'capcut-pro'], alternatives: ['canva-pro', 'capcut-pro'],
            availability: { UG: 'available', SS: 'available' }
        }
    ];

})(window);
