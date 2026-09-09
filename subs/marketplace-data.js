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
        },
        {
            id: 'xbox-game-pass', href: '/subs/digital/?product=xbox-game-pass', name: 'Xbox Game Pass Ultimate', label: 'Console gaming',
            primaryCategory: 'gaming', categories: ['gaming'], aliases: ['game pass', 'xbox ultimate', 'xgpu'],
            keywords: ['xbox', 'games', 'console', 'pc gaming', 'subscription', 'ultimate'], intents: ['play xbox games', 'get game pass'],
            useCases: ['Xbox & PC games', 'Customer-redeemed key', '1–3 month plans'], audience: ['gamers'],
            description: 'Game Pass Ultimate through a customer-redeemed digital key, with region checks before payment.',
            art: 'xbox', mark: 'X', badge: 'Gaming pick', popularity: 15, manualBoost: 14, related: ['xbox-gift-card', 'steam-wallet'], alternatives: ['steam-wallet'],
            availability: { UG: 'available', SS: 'request' }
        },
        {
            id: 'roblox-gift-card', href: '/subs/digital/?product=roblox-gift-card', name: 'Roblox Gift Card', label: 'Robux & Roblox credit',
            primaryCategory: 'gaming', categories: ['gaming', 'gifts'], aliases: ['robux', 'roblox', 'blox fruits'],
            keywords: ['robux', 'gamepasses', 'gift card', 'gaming'], intents: ['buy robux', 'get a roblox card'],
            useCases: ['Robux', 'Games & passes', 'Redeemable code'], audience: ['gamers', 'parents'],
            description: 'Redeemable Roblox credit with the card currency confirmed before payment.',
            art: 'roblox', mark: 'R', badge: 'Popular', popularity: 14, manualBoost: 12, related: ['xbox-game-pass', 'google-play-credit'], alternatives: ['google-play-credit'],
            availability: { UG: 'available', SS: 'request' }
        },
        {
            id: 'mobile-legends', href: '/subs/digital/?product=mobile-legends', name: 'Mobile Legends Diamonds', label: 'Player-ID top-up',
            primaryCategory: 'gaming', categories: ['gaming'], aliases: ['mlbb', 'mobile legends', 'diamonds'],
            keywords: ['ml', 'diamonds', 'moba', 'player id', 'server id'], intents: ['buy mobile legends diamonds', 'top up mlbb'],
            useCases: ['706 Diamonds', 'Player-ID delivery', 'No password'], audience: ['mobile gamers'],
            description: 'Diamonds delivered using Player ID and Server ID—never your password.',
            art: 'mobile-legends', mark: 'ML', badge: 'Fast top-up', popularity: 14, manualBoost: 12, related: ['free-fire', 'pubg-mobile'], alternatives: ['free-fire', 'pubg-mobile'],
            availability: { UG: 'available', SS: 'request' }
        },
        {
            id: 'free-fire', href: '/subs/digital/?product=free-fire', name: 'Free Fire Diamonds', label: 'Player-ID top-up',
            primaryCategory: 'gaming', categories: ['gaming'], aliases: ['freefire', 'ff diamonds', 'garena'],
            keywords: ['diamonds', 'battle royale', 'player id'], intents: ['buy free fire diamonds', 'top up free fire'],
            useCases: ['1,060 Diamonds', 'Compatibility checked', 'No password'], audience: ['mobile gamers'],
            description: 'Password-free diamonds after Uganda compatibility and stock are confirmed.',
            art: 'free-fire', mark: 'FF', badge: 'Check first', popularity: 12, manualBoost: 8, related: ['mobile-legends', 'pubg-mobile'], alternatives: ['mobile-legends'],
            availability: { UG: 'available', SS: 'request' }
        },
        {
            id: 'pubg-mobile', href: '/subs/digital/?product=pubg-mobile', name: 'PUBG Mobile UC', label: 'Player-ID top-up',
            primaryCategory: 'gaming', categories: ['gaming'], aliases: ['pubg', 'uc', 'pubg mobile'],
            keywords: ['unknown cash', 'uc', 'battle royale', 'player id'], intents: ['buy pubg uc', 'top up pubg'],
            useCases: ['325–1,800 UC', 'Direct top-up', 'No password'], audience: ['mobile gamers'],
            description: 'UC sent directly to your PUBG Player ID without account access.',
            art: 'pubg', mark: 'PUBG', badge: null, popularity: 12, manualBoost: 8, related: ['mobile-legends', 'free-fire'], alternatives: ['mobile-legends'],
            availability: { UG: 'available', SS: 'request' }
        },
        {
            id: 'valorant-points', href: '/subs/digital/?product=valorant-points', name: 'Valorant Points', label: 'Region-matched Riot key',
            primaryCategory: 'gaming', categories: ['gaming', 'gifts'], aliases: ['vp', 'riot points', 'valorant gift card'],
            keywords: ['riot', 'valorant', 'points', 'digital key'], intents: ['buy valorant points'], useCases: ['Digital key', 'Region matched', 'Request a quote'], audience: ['pc gamers'],
            description: 'Customer-redeemed Valorant credit matched to your Riot account region.',
            art: 'valorant', mark: 'V', badge: 'Request', popularity: 9, manualBoost: 4, related: ['steam-wallet'], alternatives: ['steam-wallet'], availability: { UG: 'available', SS: 'request' }
        },
        {
            id: 'steam-wallet', href: '/subs/digital/?product=steam-wallet', name: 'Steam Wallet', label: 'PC gaming credit',
            primaryCategory: 'gifts', categories: ['gifts', 'gaming'], aliases: ['steam card', 'steam credit', 'pc games'], keywords: ['wallet', 'gift card', 'games', 'pc'],
            intents: ['buy steam credit', 'buy pc games'], useCases: ['US$20 & US$50', 'Digital credit', 'PC game purchases'], audience: ['pc gamers'],
            description: 'Steam Wallet credit with account-country and currency compatibility checked.',
            art: 'steam', mark: 'S', badge: 'Gift card', popularity: 13, manualBoost: 9, related: ['xbox-game-pass', 'valorant-points'], alternatives: ['xbox-game-pass'], availability: { UG: 'available', SS: 'request' }
        },
        {
            id: 'psn-wallet', href: '/subs/digital/?product=psn-wallet', name: 'PlayStation Store', label: 'PSN wallet code',
            primaryCategory: 'gifts', categories: ['gifts', 'gaming'], aliases: ['psn', 'playstation card', 'ps store'], keywords: ['playstation', 'ps5', 'ps4', 'wallet', 'gift card'],
            intents: ['buy psn card', 'buy playstation credit'], useCases: ['US$25 card', 'Digital code', 'Region matched'], audience: ['console gamers'],
            description: 'A PlayStation Store code matched to your PSN account region.',
            art: 'playstation', mark: 'PS', badge: null, popularity: 11, manualBoost: 7, related: ['xbox-gift-card', 'xbox-game-pass'], alternatives: ['xbox-gift-card'], availability: { UG: 'available', SS: 'request' }
        },
        {
            id: 'xbox-gift-card', href: '/subs/digital/?product=xbox-gift-card', name: 'Xbox Gift Card', label: 'Xbox wallet code',
            primaryCategory: 'gifts', categories: ['gifts', 'gaming'], aliases: ['xbox card', 'microsoft gift card'], keywords: ['xbox', 'wallet', 'gift card', 'console'],
            intents: ['buy xbox credit'], useCases: ['US$25 card', 'Digital code', 'Stock confirmed first'], audience: ['console gamers'],
            description: 'Xbox credit matched to your account country and currency.',
            art: 'xbox', mark: 'X', badge: 'Check stock', popularity: 9, manualBoost: 4, related: ['xbox-game-pass', 'psn-wallet'], alternatives: ['psn-wallet'], availability: { UG: 'available', SS: 'request' }
        },
        {
            id: 'google-play-credit', href: '/subs/digital/?product=google-play-credit', name: 'Google Play Credit', label: 'Android app credit',
            primaryCategory: 'gifts', categories: ['gifts'], aliases: ['google play card', 'play store credit'], keywords: ['android', 'apps', 'games', 'gift card'], intents: ['buy google play credit'],
            useCases: ['US$10 card', 'Apps & games', 'Country checked'], audience: ['android users'], description: 'Google Play credit sold after confirming the Play account country.',
            art: 'google-play', mark: 'G', badge: null, popularity: 10, manualBoost: 4, related: ['apple-gift-card', 'roblox-gift-card'], alternatives: ['apple-gift-card'], availability: { UG: 'available', SS: 'request' }
        },
        {
            id: 'apple-gift-card', href: '/subs/digital/?product=apple-gift-card', name: 'Apple Gift Card', label: 'Apple account credit',
            primaryCategory: 'gifts', categories: ['gifts'], aliases: ['itunes card', 'apple credit', 'app store card'], keywords: ['iphone', 'ipad', 'apps', 'music', 'gift card'],
            intents: ['buy apple gift card', 'buy itunes credit'], useCases: ['US$10 card', 'Apps & media', 'Country checked'], audience: ['apple users'], description: 'Apple credit matched to your Apple Account country.',
            art: 'apple-credit', mark: '', badge: null, popularity: 10, manualBoost: 4, related: ['google-play-credit'], alternatives: ['google-play-credit'], availability: { UG: 'available', SS: 'request' }
        },
        {
            id: 'netflix-gift-card', href: '/subs/digital/?product=netflix-gift-card', name: 'Netflix Gift Card', label: 'Streaming credit',
            primaryCategory: 'watch', categories: ['watch', 'gifts'], aliases: ['netflix card', 'netflix credit'], keywords: ['movies', 'series', 'streaming', 'gift card'], intents: ['pay for netflix', 'buy netflix card'],
            useCases: ['US$25 card', 'Digital code', 'Billing country checked'], audience: ['film fans', 'families'], description: 'Netflix credit matched to your billing currency and account country.',
            art: 'netflix', mark: 'N', badge: 'Gift card', popularity: 13, manualBoost: 7, related: ['prime-video', 'apple-tv-plus'], alternatives: ['prime-video'], availability: { UG: 'available', SS: 'request' }
        },
        {
            id: 'discord-nitro', href: '/subs/digital/?product=discord-nitro', name: 'Discord Nitro', label: 'Community premium',
            primaryCategory: 'watch', categories: ['watch', 'gaming'], aliases: ['nitro', 'discord premium'], keywords: ['discord', 'gaming', 'community', 'boost'], intents: ['buy discord nitro'],
            useCases: ['1 or 12 months', 'Digital key', 'Account eligibility checked'], audience: ['gamers', 'communities'], description: 'A customer-redeemed Nitro key, subject to region and account eligibility.',
            art: 'discord', mark: 'D', badge: null, popularity: 8, manualBoost: 4, related: ['xbox-game-pass'], alternatives: ['xbox-game-pass'], availability: { UG: 'available', SS: 'request' }
        },
        {
            id: 'youtube-premium', href: '/subs/digital/?product=youtube-premium', name: 'YouTube Premium', label: 'Ad-free video & music',
            primaryCategory: 'watch', categories: ['watch'], aliases: ['youtube music', 'remove youtube ads'], keywords: ['ad free', 'music', 'video', 'subscription'], intents: ['remove youtube ads', 'get youtube music'],
            useCases: ['Ad-free viewing', 'YouTube Music', 'Eligibility checked'], audience: ['video viewers', 'music fans'], description: 'Requested through 97 Concierge after account and plan eligibility are confirmed.',
            art: 'youtube-premium', mark: '▶', badge: 'Request', popularity: 15, manualBoost: 9, related: ['spotify-premium', 'prime-video'], alternatives: ['spotify-premium'], availability: { UG: 'available', SS: 'request' }
        },
        {
            id: 'spotify-premium', href: '/subs/digital/?product=spotify-premium', name: 'Spotify Premium', label: 'Music premium',
            primaryCategory: 'watch', categories: ['watch'], aliases: ['spotify', 'music premium'], keywords: ['music', 'ad free', 'streaming', 'subscription'], intents: ['get spotify premium', 'listen without ads'],
            useCases: ['Ad-free music', 'Offline listening', 'Eligibility checked'], audience: ['music fans'], description: 'Requested through 97 Concierge after country and account eligibility are checked.',
            art: 'spotify-premium', mark: 'S', badge: 'Request', popularity: 14, manualBoost: 8, related: ['youtube-premium'], alternatives: ['youtube-premium'], availability: { UG: 'available', SS: 'request' }
        },
        {
            id: 'software-licenses', href: '/subs/digital/?product=software-licenses', name: 'Software Licence Keys', label: 'Licensed software',
            primaryCategory: 'work', categories: ['work'], aliases: ['software key', 'license', 'licence'], keywords: ['productivity', 'business', 'apps', 'key'], intents: ['buy a software license'],
            useCases: ['Customer-redeemed key', 'Authorized sources only', 'Custom quote'], audience: ['professionals', 'businesses'], description: 'Legitimate software licence keys sourced and quoted for your exact application.',
            art: 'software', mark: 'KEY', badge: 'Request', popularity: 7, manualBoost: 3, related: ['adobe-creative-cloud', 'google-ai-pro'], alternatives: ['adobe-creative-cloud'], availability: { UG: 'available', SS: 'request' }
        },
        {
            id: 'fortnite-gifts', href: '/subs/digital/?product=fortnite-gifts', name: 'Fortnite Gifts & V-Bucks', label: 'Password-free fulfilment only',
            primaryCategory: 'gaming', categories: ['gaming'], aliases: ['fortnite', 'vbucks', 'v-bucks'], keywords: ['epic games', 'gift', 'battle royale'], intents: ['buy v bucks', 'buy fortnite gift'],
            useCases: ['Gift/code routes', 'No account password', 'Request availability'], audience: ['gamers'], description: 'We only accept Fortnite orders that can be delivered without logging into your account.',
            art: 'fortnite', mark: 'F', badge: 'Request', popularity: 13, manualBoost: 6, related: ['xbox-game-pass', 'psn-wallet'], alternatives: ['xbox-game-pass'], availability: { UG: 'available', SS: 'request' }
        },
        {
            id: 'efootball-coins', href: '/subs/digital/?product=efootball-coins', name: 'eFootball Coins', label: 'Clean route required',
            primaryCategory: 'gaming', categories: ['gaming'], aliases: ['pes coins', 'e football'], keywords: ['football', 'coins', 'mobile game'], intents: ['buy efootball coins'],
            useCases: ['Official route only', 'No account password', 'Request availability'], audience: ['football gamers'], description: 'Quoted only when a password-free official or Player-ID route is available.',
            art: 'efootball', mark: 'eF', badge: 'Request', popularity: 14, manualBoost: 7, related: ['cod-mobile-cp', 'pubg-mobile'], alternatives: ['pubg-mobile'], availability: { UG: 'available', SS: 'request' }
        },
        {
            id: 'cod-mobile-cp', href: '/subs/digital/?product=cod-mobile-cp', name: 'Call of Duty Mobile CP', label: 'Clean route required',
            primaryCategory: 'gaming', categories: ['gaming'], aliases: ['codm', 'cod mobile', 'cp'], keywords: ['call of duty', 'points', 'mobile game'], intents: ['buy cod mobile cp'],
            useCases: ['Official route only', 'No account password', 'Request availability'], audience: ['mobile gamers'], description: 'Quoted only through a clean password-free fulfilment route.',
            art: 'cod', mark: 'CP', badge: 'Request', popularity: 12, manualBoost: 5, related: ['pubg-mobile', 'efootball-coins'], alternatives: ['pubg-mobile'], availability: { UG: 'available', SS: 'request' }
        }
    ];

})(window);
