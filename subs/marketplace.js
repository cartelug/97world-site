/** 97 WORLD — /subs/ marketplace interaction layer */
(function (window, document) {
    'use strict';

    var P = window.K97Pricing;
    var Brandmarks = window.K97Brandmarks;
    var PRODUCTS = window.K97MarketplaceData || [];
    var grid = document.querySelector('[data-product-grid]');
    if (!grid || !PRODUCTS.length) return;

    var PRODUCT_BY_ID = {};
    PRODUCTS.forEach(function (product) { PRODUCT_BY_ID[product.id] = product; });

    var BRANDS = {
        canva: ['#17d5ce', '#382081'], capcut: ['#37e7d7', '#111419'],
        'google-ai': ['#768dff', '#263a87'], coursera: ['#2b7fea', '#032460'],
        duolingo: ['#75df25', '#245908'], perplexity: ['#45bac2', '#0a3034'],
        prime: ['#1596e9', '#071929'], apple: ['#c3cad4', '#252a33'],
        crunchyroll: ['#ff8d43', '#4b1705'], linkedin: ['#2d8bdf', '#06274a'],
        adobe: ['#ff6258', '#4c0b08'], xbox: ['#38c556', '#0b3816'], roblox: ['#ed463c', '#3d0d0a'],
        'mobile-legends': ['#ffd65a', '#123a83'], 'free-fire': ['#ffb31a', '#3a2100'], pubg: ['#d99b2b', '#332208'],
        valorant: ['#ff4655', '#3a0b12'], steam: ['#66c0f4', '#122d43'], playstation: ['#2d8df0', '#05284d'],
        'google-play': ['#4ee48b', '#103626'], 'apple-credit': ['#d4d8df', '#30343c'], netflix: ['#e50914', '#390005'],
        discord: ['#8791ff', '#232964'], 'youtube-premium': ['#ff3333', '#420000'], 'spotify-premium': ['#1ed760', '#092716'],
        software: ['#a880ff', '#241044'], fortnite: ['#a48aff', '#2d1963'], efootball: ['#e8ff00', '#1428ff'], cod: ['#f4d03f', '#272727']
    };
    var CATEGORY_LABELS = { all: 'All products', gaming: 'Gaming', gifts: 'Gift cards', create: 'Create', watch: 'Entertainment', work: 'Work', ai: 'AI', learn: 'Learn' };
    var VALID_CATEGORIES = Object.keys(CATEGORY_LABELS);
    var REGION_KEY = 'k97_region';
    var RECENT_KEY = 'k97_marketplace_recent';
    var REQUEST_KEY = 'k97_marketplace_requests';
    var reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var url = new URL(window.location.href);
    var initialCategory = url.searchParams.get('category');
    var state = {
        category: VALID_CATEGORIES.indexOf(initialCategory) > -1 ? initialCategory : 'all',
        query: (url.searchParams.get('q') || '').trim(),
        sort: 'featured',
        region: getRegion()
    };
    var searchTimer = null;
    var lastZeroQuery = '';
    var lastFocus = null;
    var activeQuickProduct = null;

    function safeGet(key, fallback) {
        try { var value = JSON.parse(localStorage.getItem(key)); return value || fallback; }
        catch (e) { return fallback; }
    }

    function safeSet(key, value) {
        try { localStorage.setItem(key, JSON.stringify(value)); }
        catch (e) { /* Storage can be unavailable in private mode. */ }
    }

    function getRegion() {
        var saved = P && P.Region ? P.Region.get() : null;
        if (saved === 'UG' || saved === 'SS') return saved;
        try { return localStorage.getItem(REGION_KEY) === 'SS' ? 'SS' : 'UG'; }
        catch (e) { return 'UG'; }
    }

    function track(name, detail) {
        var payload = Object.assign({ event: name, region: state.region, path: '/subs/' }, detail || {});
        window.dispatchEvent(new CustomEvent('k97:analytics', { detail: payload }));
        if (Array.isArray(window.dataLayer)) window.dataLayer.push(payload);
    }

    function productHref(product) { return product.href || '/subs/' + product.slug + '/'; }

    function ensureProductCards() {
        PRODUCTS.forEach(function (product, index) {
            if (document.querySelector('[data-product="' + product.id + '"]')) return;
            var colors = BRANDS[product.art] || ['#43f5a5', '#16231e'];
            var uses = (product.useCases || []).slice(0, 2);
            var badge = product.badge ? '<i>' + escapeHTML(product.badge) + '</i>' : '';
            var article = document.createElement('article');
            article.className = 'product-card art-digital reveal-section m-lift';
            article.dataset.product = product.id;
            article.dataset.order = String(index);
            article.style.setProperty('--brand', colors[0]);
            article.style.setProperty('--brand2', colors[1]);
            article.innerHTML = '<a class="product-card-link" href="' + productHref(product) + '" aria-label="View ' + escapeHTML(product.name) + '" data-product-link="' + product.id + '"></a>' +
                '<div class="product-art" aria-hidden="true"><span class="digital-orbit orbit-a"></span><span class="digital-orbit orbit-b"></span><span class="product-department">' + escapeHTML(CATEGORY_LABELS[product.primaryCategory] || product.label) + '</span><b class="product-logo">' + markHTML(product) + '</b></div>' +
                '<div class="product-body"><div class="product-topline"><span>' + escapeHTML(product.label) + '</span>' + badge + '</div><h3>' + escapeHTML(product.name) + '</h3><p>' + escapeHTML(product.description) + '</p>' +
                '<ul>' + uses.map(function (item) { return '<li>' + escapeHTML(item) + '</li>'; }).join('') + '</ul><div class="product-bottom"><div><small>' + (hasLocalPrice(product) ? 'From' : 'Availability') + '</small><strong data-price="' + product.id + '">' + escapeHTML(priceText(product)) + '</strong></div><span class="status"><i></i> ' + statusText(product) + '</span></div></div>' +
                '<button class="quick-button" type="button" aria-label="Quick view ' + escapeHTML(product.name) + '" data-quick="' + product.id + '">+</button>';
            grid.appendChild(article);
        });
    }

    grid.textContent = '';
    ensureProductCards();
    grid.classList.add('is-ready');
    var CARD_BY_ID = {};
    document.querySelectorAll('[data-product]').forEach(function (card) { CARD_BY_ID[card.dataset.product] = card; });

    function tierFor(product) {
        var sub = P && ((P.SUBSCRIPTIONS && P.SUBSCRIPTIONS[product.id]) || (P.DIGITAL_PRODUCTS && P.DIGITAL_PRODUCTS[product.id]));
        if (!sub || !sub.tiers || !sub.tiers.length) return null;
        return sub.tiers[0];
    }

    function canStartOrder(product) {
        var pricedProduct = P && ((P.SUBSCRIPTIONS && P.SUBSCRIPTIONS[product.id]) || (P.DIGITAL_PRODUCTS && P.DIGITAL_PRODUCTS[product.id]));
        return !!pricedProduct && hasLocalPrice(product) && pricedProduct.tiers.some(function (tier) { return tier.orderable !== false; });
    }

    function statusText(product) {
        if (canStartOrder(product)) return 'Available';
        if (hasLocalPrice(product)) return 'Check first';
        return 'Request';
    }

    function hasLocalPrice(product) {
        return isFinite(startingValue(product, state.region));
    }

    function startingValue(product, region) {
        var tier = tierFor(product);
        if (!tier) return Number.POSITIVE_INFINITY;
        var value = region === 'SS' ? tier.usd : tier.ugx;
        return value == null ? Number.POSITIVE_INFINITY : value;
    }

    function money(value, region) {
        if (value == null || !isFinite(value)) return 'View plans';
        return region === 'SS' ? '$' + Number(value).toLocaleString('en-US') : Number(value).toLocaleString('en-US') + ' UGX';
    }

    function priceText(product) {
        return hasLocalPrice(product) ? money(startingValue(product, state.region), state.region) : 'Ask for quote';
    }

    function updatePrices() {
        document.querySelectorAll('[data-price]').forEach(function (node) {
            var product = PRODUCT_BY_ID[node.dataset.price];
            if (product) {
                var priced = hasLocalPrice(product);
                node.textContent = priceText(product);
                var bottom = node.closest('.product-bottom');
                if (bottom) {
                    var label = bottom.querySelector('small');
                    var status = bottom.querySelector('.status');
                    if (label) label.textContent = priced ? 'From' : 'Availability';
                    if (status) status.innerHTML = '<i></i> ' + statusText(product);
                }
            }
        });
        if (activeQuickProduct) {
            var quickPrice = document.querySelector('[data-quick-price]');
            if (quickPrice) quickPrice.textContent = priceText(activeQuickProduct);
        }
        renderRecent();
    }

    function normalize(value) {
        return String(value || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9+]+/g, ' ').trim();
    }

    function exactOrContains(values, query) {
        var score = 0;
        values.forEach(function (value) {
            var normalized = normalize(value);
            if (normalized === query) score = Math.max(score, 86);
            else if (normalized.indexOf(query) !== -1 || query.indexOf(normalized) !== -1) score = Math.max(score, 55);
        });
        return score;
    }

    function scoreProduct(product, rawQuery) {
        var query = normalize(rawQuery);
        if (!query) return product.popularity + product.manualBoost;
        var name = normalize(product.name);
        var score = 0;

        if (name === query) score = 100;
        else if (name.indexOf(query) === 0) score = 92;
        score = Math.max(score, exactOrContains(product.aliases || [], query));

        var intentFields = (product.intents || []).concat(product.useCases || []);
        intentFields.forEach(function (value) {
            var normalized = normalize(value);
            if (normalized.indexOf(query) !== -1 || query.indexOf(normalized) !== -1) score = Math.max(score, 78);
        });

        if (normalize(product.primaryCategory) === query) score = Math.max(score, 68);
        (product.keywords || []).forEach(function (value) {
            var normalized = normalize(value);
            if (normalized.indexOf(query) !== -1 || query.indexOf(normalized) !== -1) score = Math.max(score, 55);
        });
        (product.categories || []).filter(function (cat) { return cat !== product.primaryCategory; }).forEach(function (cat) {
            if (normalize(cat) === query) score = Math.max(score, 42);
        });
        if (normalize(product.description).indexOf(query) !== -1) score = Math.max(score, 20);

        var words = query.split(/\s+/).filter(Boolean);
        var corpus = normalize([
            product.name, product.label, product.description,
            (product.aliases || []).join(' '), (product.keywords || []).join(' '),
            (product.intents || []).join(' '), (product.useCases || []).join(' '),
            (product.audience || []).join(' '), (product.categories || []).join(' ')
        ].join(' '));
        var matchedWords = words.filter(function (word) { return corpus.indexOf(word) !== -1; });
        if (!score && matchedWords.length !== words.length) return -1;
        if (matchedWords.length === words.length) score += Math.min(words.length * 3, 12);
        if (!score) return -1;

        score += Math.min(product.popularity || 0, 12);
        if (product.availability[state.region] === 'available') score += 10;
        score += Math.min(product.manualBoost || 0, 10);
        return score;
    }

    function rankedProducts(query) {
        return PRODUCTS.map(function (product, index) {
            return { product: product, score: scoreProduct(product, query), index: index };
        }).filter(function (entry) { return entry.score >= 0; })
            .sort(function (a, b) { return b.score - a.score || a.index - b.index; });
    }

    function matchesState(product, score) {
        var inCategory = state.category === 'all' || product.categories.indexOf(state.category) !== -1;
        return inCategory && score >= 0 && product.availability[state.region] !== 'unavailable';
    }

    function syncCategoryButtons() {
        document.querySelectorAll('[data-category]').forEach(function (button) {
            var active = button.dataset.category === state.category;
            button.classList.toggle('is-active', active);
            button.setAttribute('aria-pressed', String(active));
        });
    }

    function syncUrl() {
        var next = new URL(window.location.href);
        if (state.query) next.searchParams.set('q', state.query); else next.searchParams.delete('q');
        if (state.category !== 'all') next.searchParams.set('category', state.category); else next.searchParams.delete('category');
        window.history.replaceState({}, '', next.pathname + next.search + next.hash);
    }

    function applyState(options) {
        options = options || {};
        var ranked = rankedProducts(state.query);
        var visible = ranked.filter(function (entry) { return matchesState(entry.product, entry.score); });

        if (state.sort === 'price-low') {
            visible.sort(function (a, b) { return startingValue(a.product, state.region) - startingValue(b.product, state.region); });
        } else if (state.sort === 'name') {
            visible.sort(function (a, b) { return a.product.name.localeCompare(b.product.name); });
        } else if (!state.query) {
            visible.sort(function (a, b) {
                return (b.product.manualBoost + b.product.popularity) - (a.product.manualBoost + a.product.popularity);
            });
        }

        PRODUCTS.forEach(function (product) {
            var card = CARD_BY_ID[product.id];
            if (card) card.hidden = true;
        });
        visible.forEach(function (entry) {
            var card = CARD_BY_ID[entry.product.id];
            if (!card) return;
            card.hidden = false;
            grid.appendChild(card);
        });

        var countNode = document.querySelector('[data-result-count]');
        if (countNode) countNode.textContent = String(visible.length);
        var summary = countNode && countNode.parentElement;
        if (summary) summary.lastChild.textContent = ' product' + (visible.length === 1 ? '' : 's') + ' available';
        var noResults = document.querySelector('[data-no-results]');
        if (noResults) noResults.hidden = visible.length !== 0;

        if (!visible.length && state.query && lastZeroQuery !== state.query) {
            lastZeroQuery = state.query;
            track('search_zero_result', { query: state.query, category: state.category });
        }

        var requestLink = document.querySelector('[data-request-product]');
        if (requestLink) {
            var requestText = 'Hi 97 Concierge, I searched for "' + (state.query || CATEGORY_LABELS[state.category]) + '" but could not find it. Can you help?';
            requestLink.href = 'https://wa.me/256762193386?text=' + encodeURIComponent(requestText);
        }

        syncCategoryButtons();
        syncUrl();
        if (options.scroll) scrollToCatalogue();
        return visible;
    }

    function scrollToCatalogue() {
        var catalogue = document.getElementById('catalogue');
        if (catalogue) catalogue.scrollIntoView({ behavior: reducedMotion ? 'auto' : 'smooth', block: 'start' });
    }

    function setCategory(category, shouldScroll) {
        if (VALID_CATEGORIES.indexOf(category) === -1) category = 'all';
        state.category = category;
        state.query = '';
        syncSearchInputs('');
        applyState({ scroll: shouldScroll });
        track('category_select', { category: category });
    }

    function syncSearchInputs(value) {
        var desktop = document.querySelector('[data-desktop-search]');
        var mobile = document.querySelector('[data-mobile-search]');
        if (desktop && desktop.value !== value) desktop.value = value;
        if (mobile && mobile.value !== value) mobile.value = value;
    }

    function queueSearchTrack(query, source) {
        window.clearTimeout(searchTimer);
        if (!query) return;
        searchTimer = window.setTimeout(function () { track('search_query', { query: query, source: source }); }, 300);
    }

    function search(query, source, shouldScroll) {
        state.query = String(query || '').trim();
        state.category = 'all';
        syncSearchInputs(state.query);
        var results = applyState({ scroll: shouldScroll });
        queueSearchTrack(state.query, source);
        return results;
    }

    function markHTML(product) {
        if (Brandmarks && Brandmarks.render) return Brandmarks.render(product.id);
        if (product.logo) return '<img src="' + product.logo + '" width="26" height="26" alt="">';
        return escapeHTML(product.mark || product.name.charAt(0));
    }

    function hydrateStaticBrandmarks() {
        if (!Brandmarks || !Brandmarks.render) return;
        document.querySelectorAll('[data-brand-logo]').forEach(function (node) {
            node.innerHTML = Brandmarks.render(node.dataset.brandLogo);
        });
    }

    function hydrateDepartmentCounts() {
        document.querySelectorAll('[data-department-count]').forEach(function (node) {
            var category = node.dataset.departmentCount;
            var count = PRODUCTS.filter(function (product) { return product.categories.indexOf(category) !== -1; }).length;
            node.textContent = count + ' product' + (count === 1 ? '' : 's');
        });
    }

    function escapeHTML(value) {
        return String(value).replace(/[&<>'"]/g, function (char) {
            return { '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[char];
        });
    }

    function resultHTML(product) {
        var priceLead = hasLocalPrice(product) ? 'From ' : '';
        return '<a class="search-result" href="' + productHref(product) + '" role="option" data-product-link="' + product.id + '">' +
            '<span class="result-mark">' + markHTML(product) + '</span>' +
            '<span class="result-copy"><b>' + escapeHTML(product.name) + '</b><small>' + escapeHTML(product.label) + ' · ' + priceLead + escapeHTML(priceText(product)) + '</small></span>' +
            '<i aria-hidden="true">→</i></a>';
    }

    function renderDesktopResults(query) {
        var panel = document.querySelector('[data-desktop-results]');
        var input = document.querySelector('[data-desktop-search]');
        if (!panel || !input) return;
        var ranked = rankedProducts(query).filter(function (entry) { return matchesState(entry.product, entry.score); }).slice(0, 6);
        panel.innerHTML = ranked.length ? ranked.map(function (entry) { return resultHTML(entry.product); }).join('') : '<p class="search-empty">No match yet. Press Enter to request it through 97 Concierge.</p>';
        panel.hidden = false;
        input.setAttribute('aria-expanded', 'true');
    }

    function closeDesktopResults() {
        var panel = document.querySelector('[data-desktop-results]');
        var input = document.querySelector('[data-desktop-search]');
        if (panel) panel.hidden = true;
        if (input) input.setAttribute('aria-expanded', 'false');
    }

    function renderMobileSearch(query) {
        var suggestions = document.querySelector('[data-mobile-suggestions]');
        var resultsNode = document.querySelector('[data-mobile-results]');
        var count = document.querySelector('[data-mobile-search-count]');
        if (!resultsNode || !suggestions) return;
        if (!query.trim()) {
            suggestions.hidden = false;
            resultsNode.hidden = true;
            if (count) count.textContent = PRODUCTS.length + ' products';
            return;
        }
        var ranked = rankedProducts(query).filter(function (entry) { return entry.product.availability[state.region] === 'available'; });
        suggestions.hidden = true;
        resultsNode.hidden = false;
        if (count) count.textContent = ranked.length + ' result' + (ranked.length === 1 ? '' : 's');
        resultsNode.innerHTML = ranked.length ? ranked.map(function (entry) { return resultHTML(entry.product); }).join('') :
            '<div class="search-empty"><p>No match for “' + escapeHTML(query) + '”.</p><a href="https://wa.me/256762193386?text=' + encodeURIComponent('Hi 97 Concierge, I am looking for ' + query + '.') + '" target="_blank" rel="noopener" data-mobile-request>Request it through 97 Concierge →</a></div>';
    }

    function layerOpen(layer) { return layer && !layer.hidden; }

    function closeAllLayers(except) {
        [document.querySelector('[data-region-dialog]'), document.querySelector('[data-menu-dialog]'), document.querySelector('[data-search-dialog]'), document.querySelector('[data-quick-dialog]')]
            .forEach(function (layer) { if (layer && layer !== except) layer.hidden = true; });
        if (!except) document.body.classList.remove('dialog-open');
    }

    function openLayer(layer, focusSelector) {
        if (!layer) return;
        closeAllLayers(layer);
        lastFocus = document.activeElement;
        layer.hidden = false;
        document.body.classList.add('dialog-open');
        window.requestAnimationFrame(function () {
            var target = layer.querySelector(focusSelector || 'button, a, input');
            if (target) target.focus();
        });
    }

    function closeLayer(layer) {
        if (!layer) return;
        layer.hidden = true;
        if (![document.querySelector('[data-region-dialog]'), document.querySelector('[data-menu-dialog]'), document.querySelector('[data-search-dialog]'), document.querySelector('[data-quick-dialog]')].some(layerOpen)) {
            document.body.classList.remove('dialog-open');
        }
        if (lastFocus && lastFocus.focus) lastFocus.focus();
    }

    function focusTrap(event, layer, close) {
        if (!layerOpen(layer)) return;
        if (event.key === 'Escape') { event.preventDefault(); close(); return; }
        if (event.key !== 'Tab') return;
        var nodes = Array.prototype.slice.call(layer.querySelectorAll('a[href], button:not([disabled]), input:not([disabled]), select:not([disabled])')).filter(function (node) { return node.offsetParent !== null; });
        if (!nodes.length) return;
        var first = nodes[0], last = nodes[nodes.length - 1];
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
        else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    }

    function openRegion() {
        var layer = document.querySelector('[data-region-dialog]');
        updateRegionUI();
        openLayer(layer, '[data-region="' + state.region + '"]');
    }

    function updateRegionUI() {
        var isSS = state.region === 'SS';
        document.querySelectorAll('[data-region-flag]').forEach(function (node) { node.textContent = isSS ? '🇸🇸' : '🇺🇬'; });
        document.querySelectorAll('[data-region-currency]').forEach(function (node) { node.textContent = isSS ? 'USD' : 'UGX'; });
        document.querySelectorAll('[data-region-label]').forEach(function (node) { node.textContent = isSS ? 'South Sudan · USD' : 'Uganda · UGX'; });
        document.querySelectorAll('[data-region]').forEach(function (node) { node.classList.toggle('is-active', node.dataset.region === state.region); });
    }

    function setRegion(region) {
        if (region !== 'UG' && region !== 'SS') return;
        state.region = region;
        if (P && P.Region) P.Region.set(region);
        else { try { localStorage.setItem(REGION_KEY, region); } catch (e) { /* ignore */ } }
        updateRegionUI();
        updatePrices();
        applyState();
        track('region_change', { selected_region: region });
    }

    function addRecent(productId) {
        if (!PRODUCT_BY_ID[productId]) return;
        var recent = safeGet(RECENT_KEY, []).filter(function (id) { return id !== productId && PRODUCT_BY_ID[id]; });
        recent.unshift(productId);
        safeSet(RECENT_KEY, recent.slice(0, 6));
        renderRecent();
    }

    function renderRecent() {
        var section = document.querySelector('[data-recent-section]');
        var rail = document.querySelector('[data-recent-rail]');
        if (!section || !rail) return;
        var recent = safeGet(RECENT_KEY, []).map(function (id) { return PRODUCT_BY_ID[id]; }).filter(Boolean);
        section.hidden = recent.length === 0;
        rail.innerHTML = recent.map(function (product) {
            var colors = BRANDS[product.art] || ['#43f5a5', '#16231e'];
            var priceLead = hasLocalPrice(product) ? 'From ' : '';
            return '<article class="recent-card" style="--brand:' + colors[0] + ';--brand2:' + colors[1] + '">' +
                '<div class="recent-card-art">' + markHTML(product) + '</div><div class="recent-card-copy"><small>' + escapeHTML(product.label) + '</small><h3>' + escapeHTML(product.name) + '</h3><strong>' + priceLead + escapeHTML(priceText(product)) + '</strong></div>' +
                '<a href="' + productHref(product) + '" aria-label="View ' + escapeHTML(product.name) + ' plans" data-product-link="' + product.id + '"></a></article>';
        }).join('');
    }

    function openQuick(productId) {
        var product = PRODUCT_BY_ID[productId];
        if (!product) return;
        activeQuickProduct = product;
        addRecent(product.id);
        var layer = document.querySelector('[data-quick-dialog]');
        var art = document.querySelector('[data-quick-art]');
        var colors = BRANDS[product.art] || ['#43f5a5', '#16231e'];
        art.style.setProperty('--brand', colors[0]); art.style.setProperty('--brand2', colors[1]);
        document.querySelector('[data-quick-mark]').innerHTML = markHTML(product);
        document.querySelector('[data-quick-category]').textContent = product.label.toUpperCase();
        document.querySelector('[data-quick-name]').textContent = product.name;
        document.querySelector('[data-quick-description]').textContent = product.description;
        document.querySelector('[data-quick-uses]').innerHTML = product.useCases.map(function (item) { return '<li>' + escapeHTML(item) + '</li>'; }).join('');
        document.querySelector('[data-quick-price]').textContent = priceText(product);
        var orderReady = canStartOrder(product);
        var quickStatus = document.querySelector('[data-quick-status]');
        if (quickStatus) quickStatus.innerHTML = '<i></i> ' + (orderReady ? 'Available now' : 'Check availability');
        var cta = document.querySelector('[data-quick-cta]');
        cta.href = productHref(product); cta.dataset.productLink = product.id; cta.firstChild.nodeValue = orderReady ? 'View plans ' : 'Check availability ';
        var relatedWrap = document.querySelector('[data-quick-related]');
        var relatedList = document.querySelector('[data-related-list]');
        var related = (product.related || []).map(function (id) { return PRODUCT_BY_ID[id]; }).filter(Boolean).slice(0, 2);
        relatedWrap.hidden = related.length === 0;
        relatedList.innerHTML = related.map(function (item) { return '<a class="related-link" href="' + productHref(item) + '" data-product-link="' + item.id + '"><b>' + markHTML(item) + '</b><span>' + escapeHTML(item.name) + '</span><i>→</i></a>'; }).join('');
        openLayer(layer, '[data-quick-close]');
        track('quick_view_open', { product_id: product.id });
    }

    function recordRequest(source) {
        var requests = safeGet(REQUEST_KEY, []);
        requests.unshift({ query: state.query, region: state.region, currency: state.region === 'SS' ? 'USD' : 'UGX', timestamp: new Date().toISOString(), source: source, resultCount: 0 });
        safeSet(REQUEST_KEY, requests.slice(0, 50));
        track('product_request', { query: state.query, source: source });
    }

    document.querySelectorAll('[data-category]').forEach(function (button) {
        button.addEventListener('click', function () { setCategory(button.dataset.category, true); });
    });
    document.querySelectorAll('[data-category-jump]').forEach(function (button) {
        button.addEventListener('click', function () { setCategory(button.dataset.categoryJump, true); });
    });

    var sort = document.querySelector('[data-sort]');
    if (sort) sort.addEventListener('change', function () { state.sort = sort.value; applyState(); track('sort_change', { sort: state.sort }); });

    var desktopInput = document.querySelector('[data-desktop-search]');
    var desktopForm = document.querySelector('[data-desktop-search-form]');
    if (desktopInput) {
        desktopInput.value = state.query;
        desktopInput.addEventListener('focus', function () { renderDesktopResults(desktopInput.value); track('search_open', { source: 'desktop' }); });
        desktopInput.addEventListener('input', function () { search(desktopInput.value, 'desktop', false); renderDesktopResults(desktopInput.value); });
        desktopInput.addEventListener('keydown', function (event) {
            var panel = document.querySelector('[data-desktop-results]');
            if (!panel || panel.hidden) return;
            var items = Array.prototype.slice.call(panel.querySelectorAll('.search-result'));
            var selected = panel.querySelector('.is-selected');
            var index = items.indexOf(selected);
            if (event.key === 'ArrowDown') { event.preventDefault(); index = Math.min(index + 1, items.length - 1); }
            else if (event.key === 'ArrowUp') { event.preventDefault(); index = Math.max(index - 1, 0); }
            else if (event.key === 'Enter' && selected) { event.preventDefault(); selected.click(); return; }
            else if (event.key === 'Escape') { closeDesktopResults(); return; }
            else return;
            items.forEach(function (item, i) { item.classList.toggle('is-selected', i === index); });
        });
    }
    if (desktopForm) desktopForm.addEventListener('submit', function (event) { event.preventDefault(); closeDesktopResults(); search(desktopInput.value, 'desktop_submit', true); });
    document.addEventListener('click', function (event) { if (!event.target.closest('.desktop-search')) closeDesktopResults(); });
    document.addEventListener('keydown', function (event) {
        if (event.key === '/' && !event.metaKey && !event.ctrlKey && !event.altKey && !/input|textarea|select/i.test(document.activeElement.tagName)) {
            event.preventDefault(); if (desktopInput && window.innerWidth > 760) desktopInput.focus(); else openSearch();
        }
    });

    var searchLayer = document.querySelector('[data-search-dialog]');
    var mobileInput = document.querySelector('[data-mobile-search]');
    function openSearch() {
        syncSearchInputs(state.query);
        renderMobileSearch(state.query);
        openLayer(searchLayer, '[data-mobile-search]');
        track('search_open', { source: 'mobile' });
    }
    function closeSearch() { closeLayer(searchLayer); }
    document.querySelectorAll('[data-search-open]').forEach(function (button) { button.addEventListener('click', openSearch); });
    document.querySelectorAll('[data-search-close]').forEach(function (button) { button.addEventListener('click', closeSearch); });
    if (mobileInput) mobileInput.addEventListener('input', function () { search(mobileInput.value, 'mobile', false); renderMobileSearch(mobileInput.value); });
    var mobileForm = document.querySelector('[data-mobile-search-form]');
    if (mobileForm) mobileForm.addEventListener('submit', function (event) { event.preventDefault(); search(mobileInput.value, 'mobile_submit', true); closeSearch(); });
    var mobileClear = document.querySelector('[data-mobile-search-clear]');
    if (mobileClear) mobileClear.addEventListener('click', function () { search('', 'mobile_clear', false); renderMobileSearch(''); mobileInput.focus(); });

    document.querySelectorAll('[data-search-term]').forEach(function (button) {
        button.addEventListener('click', function () {
            var term = button.dataset.searchTerm;
            if (layerOpen(searchLayer)) { search(term, 'suggestion', false); renderMobileSearch(term); if (mobileInput) mobileInput.focus(); }
            else { search(term, 'popular', true); if (desktopInput) renderDesktopResults(term); }
        });
    });

    document.querySelectorAll('[data-region-open]').forEach(function (button) { button.addEventListener('click', openRegion); });
    var regionLayer = document.querySelector('[data-region-dialog]');
    document.querySelectorAll('[data-dialog-close]').forEach(function (button) { button.addEventListener('click', function () { closeLayer(regionLayer); }); });
    document.querySelectorAll('[data-region]').forEach(function (button) { button.addEventListener('click', function () { setRegion(button.dataset.region); closeLayer(regionLayer); }); });

    var menuLayer = document.querySelector('[data-menu-dialog]');
    document.querySelectorAll('[data-menu-open]').forEach(function (button) { button.addEventListener('click', function () { openLayer(menuLayer, '[data-menu-close]'); }); });
    document.querySelectorAll('[data-menu-close]').forEach(function (button) {
        if (!button.hasAttribute('data-region-open')) button.addEventListener('click', function () { closeLayer(menuLayer); });
    });

    var quickLayer = document.querySelector('[data-quick-dialog]');
    document.querySelectorAll('[data-quick]').forEach(function (button) { button.addEventListener('click', function () { openQuick(button.dataset.quick); }); });
    document.querySelectorAll('[data-quick-close]').forEach(function (button) { button.addEventListener('click', function () { closeLayer(quickLayer); }); });

    document.addEventListener('click', function (event) {
        var link = event.target.closest('[data-product-link]');
        if (link) { addRecent(link.dataset.productLink); track('product_click', { product_id: link.dataset.productLink, source: link.closest('.search-results-panel, .mobile-search-results') ? 'search' : 'marketplace' }); }
        var request = event.target.closest('[data-request-product]');
        if (request) recordRequest('catalogue_zero_result');
        var mobileRequest = event.target.closest('[data-mobile-request]');
        if (mobileRequest) recordRequest('mobile_search_zero_result');
    });

    var clearSearch = document.querySelector('[data-clear-search]');
    if (clearSearch) clearSearch.addEventListener('click', function () { search('', 'clear', false); });
    var clearRecent = document.querySelector('[data-clear-recent]');
    if (clearRecent) clearRecent.addEventListener('click', function () { safeSet(RECENT_KEY, []); renderRecent(); });
    var concierge = document.querySelector('[data-concierge]');
    if (concierge) concierge.addEventListener('click', function () { track('concierge_click', { source: 'concierge_section' }); });

    document.addEventListener('keydown', function (event) {
        focusTrap(event, regionLayer, function () { closeLayer(regionLayer); });
        focusTrap(event, menuLayer, function () { closeLayer(menuLayer); });
        focusTrap(event, searchLayer, closeSearch);
        focusTrap(event, quickLayer, function () { closeLayer(quickLayer); });
    });

    var hero = document.querySelector('[data-hero]');
    var sticky = document.querySelector('[data-sticky-discovery]');
    if (hero && sticky && 'IntersectionObserver' in window) {
        new IntersectionObserver(function (entries) {
            var visible = !entries[0].isIntersecting;
            sticky.classList.toggle('is-visible', visible);
            sticky.setAttribute('aria-hidden', String(!visible));
            sticky.inert = !visible;
        }, { rootMargin: '-72px 0px 0px', threshold: 0 }).observe(hero);
    }

    var marketNav = document.querySelector('[data-market-nav]');
    var scrollRaf = null;
    window.addEventListener('scroll', function () {
        if (scrollRaf) return;
        scrollRaf = window.requestAnimationFrame(function () { if (marketNav) marketNav.classList.toggle('is-fixed', window.scrollY > 12); scrollRaf = null; });
    }, { passive: true });

    if ('IntersectionObserver' in window && !reducedMotion) {
        var revealObserver = new IntersectionObserver(function (entries, observer) {
            entries.forEach(function (entry) { if (entry.isIntersecting) { entry.target.classList.add('is-visible'); observer.unobserve(entry.target); } });
        }, { rootMargin: '0px 0px -7%', threshold: .08 });
        document.querySelectorAll('.reveal-section').forEach(function (node) { revealObserver.observe(node); });
    } else document.querySelectorAll('.reveal-section').forEach(function (node) { node.classList.add('is-visible'); });

    hydrateStaticBrandmarks();
    hydrateDepartmentCounts();
    updateRegionUI();
    updatePrices();
    syncSearchInputs(state.query);
    applyState();
    renderRecent();
    track('marketplace_view', { product_count: PRODUCTS.length });

})(window, document);
