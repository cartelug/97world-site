(function (window, document) {
    'use strict';

    var P = window.K97Pricing;
    var id = new URL(window.location.href).searchParams.get('product');
    var product = P && P.DIGITAL_PRODUCTS && P.DIGITAL_PRODUCTS[id];
    if (!product) { window.location.replace('/subs/'); return; }

    var selected = null;
    var root = document.documentElement;
    root.style.setProperty('--brand', product.brand || '#43f5a5');
    root.style.setProperty('--brand2', product.brand ? product.brand + '28' : '#16231e');
    document.title = product.name + ' | 97 World';

    function text(selector, value) {
        document.querySelectorAll(selector).forEach(function (node) { node.textContent = value; });
    }

    function money(value) { return Number(value).toLocaleString('en-US') + ' UGX'; }
    function escapeHTML(value) {
        return String(value).replace(/[&<>'"]/g, function (char) { return { '&':'&amp;', '<':'&lt;', '>':'&gt;', "'":'&#39;', '"':'&quot;' }[char]; });
    }

    text('[data-category]', product.category.toUpperCase() + ' · ' + product.fulfilment.toUpperCase());
    text('[data-product-name]', product.name);
    text('[data-description]', product.description);
    text('[data-product-mark], [data-summary-mark]', product.mark || product.name.charAt(0));
    text('[data-summary-category]', product.category);
    text('[data-summary-name]', product.name);
    text('[data-fulfilment]', product.fulfilment);

    var notice = document.querySelector('[data-notice]');
    if (product.notice) { notice.textContent = product.notice; notice.hidden = false; }

    var grid = document.querySelector('[data-plan-grid]');
    var quote = document.querySelector('[data-quote-state]');
    var order = document.querySelector('[data-order-button]');

    function selectPlan(tier, button) {
        if (!tier.orderable) return;
        selected = tier;
        document.querySelectorAll('.plan-card').forEach(function (node) { node.classList.toggle('is-selected', node === button); });
        text('[data-summary-plan]', tier.name);
        text('[data-summary-price]', money(tier.ugx));
        order.disabled = false;
        order.querySelector('span').textContent = 'Continue on WhatsApp';
        if (window.Motion) window.Motion.flash(document.querySelector('.summary-total'));
    }

    if (product.tiers && product.tiers.length) {
        grid.innerHTML = product.tiers.map(function (tier) {
            return '<button class="plan-card m-press" type="button" data-tier="' + escapeHTML(tier.id) + '"' + (tier.orderable ? '' : ' disabled') + '>' +
                (tier.tag ? '<em>' + escapeHTML(tier.tag) + '</em>' : '') + '<small>' + escapeHTML(product.fulfilment) + '</small><h3>' + escapeHTML(tier.name) + '</h3><strong>' + money(tier.ugx) + '</strong></button>';
        }).join('');
        grid.querySelectorAll('[data-tier]').forEach(function (button) {
            button.addEventListener('click', function () {
                var tier = product.tiers.find(function (item) { return item.id === button.dataset.tier; });
                if (tier) selectPlan(tier, button);
            });
        });
        if (!product.tiers.some(function (tier) { return tier.orderable; })) {
            quote.hidden = false;
            text('[data-summary-plan]', 'Stock and compatibility check');
            text('[data-summary-price]', 'Quoted first');
            order.disabled = false;
            order.querySelector('span').textContent = 'Ask 97 Concierge';
        }
    } else {
        quote.hidden = false;
        grid.hidden = true;
        text('[data-summary-plan]', 'Custom availability check');
        text('[data-summary-price]', 'Quoted first');
        order.disabled = false;
        order.querySelector('span').textContent = 'Ask 97 Concierge';
    }

    order.addEventListener('click', function () {
        if (order.disabled) return;
        var packageLine = selected ? selected.name + ' — ' + money(selected.ugx) : 'Please confirm availability and price';
        var message = [
            'Hello 97 Concierge, I want to order:',
            '',
            '*' + product.name + '*',
            'Package: ' + packageLine,
            'Fulfilment: ' + product.fulfilment,
            'Region: Uganda',
            '',
            'Please confirm stock, compatibility and payment details.'
        ].join('\n');
        window.open('https://wa.me/256762193386?text=' + encodeURIComponent(message), '_blank', 'noopener');
    });
})(window, document);
