(function () {
    'use strict';

    var API = 'https://the97-orders.carteluganda.workers.dev';
    var pricing = window.K97Pricing;
    var params = new URLSearchParams(window.location.search);
    var ref = (params.get('ref') || '').trim().toUpperCase();
    var preview = params.get('preview') === '1' && !ref;
    var trackUrl = '/track/?ref=' + encodeURIComponent(ref);
    var method = null;
    var retryTimer;
    var retries = 0;
    var $ = function (id) { return document.getElementById(id); };

    var networks = pricing.REGIONS.UG.payments.map(function (label) {
        var parts = label.split(' — Code ');
        return { id: /^MTN/.test(label) ? 'mtn' : 'airtel', label: parts[0], code: parts[1] };
    });

    function select(network) {
        method = network;
        $('payMethods').querySelectorAll('button').forEach(function (button) {
            var active = button.dataset.network === method.id;
            button.classList.toggle('is-on', active);
            button.setAttribute('aria-pressed', String(active));
        });

        $('payInstructions').textContent = preview
            ? 'For a saved order, the ' + network.label + ' merchant code appears here.'
            : 'On your phone, choose merchant payment. Enter the code shown here and the exact deposit. Then enter the transaction reference below.';
        if (window.Motion) window.Motion.flash($('payInstructions'));
        if (preview) return;

        $('codeValue').textContent = network.code;
        $('copyCode').textContent = 'Copy code';
        $('merchantCode').hidden = false;
        $('reportForm').hidden = false;
    }

    function buildNetworkOptions() {
        networks.forEach(function (network) {
            var button = document.createElement('button');
            button.type = 'button';
            button.className = 'pay-opt m-press';
            button.dataset.network = network.id;
            button.setAttribute('aria-pressed', 'false');
            button.textContent = network.label;
            button.addEventListener('click', function () { select(network); });
            $('payMethods').appendChild(button);
        });
        var block = $('merchantCode');
        var code = document.createElement('b');
        code.id = 'codeValue';
        var copy = document.createElement('button');
        copy.type = 'button';
        copy.id = 'copyCode';
        copy.className = 'pay-copy m-press';
        copy.textContent = 'Copy code';
        copy.addEventListener('click', async function () {
            try {
                await navigator.clipboard.writeText(method.code);
                copy.textContent = 'Copied';
            } catch (error) {
                copy.textContent = 'Select code to copy';
                var range = document.createRange();
                range.selectNodeContents(code);
                window.getSelection().removeAllRanges();
                window.getSelection().addRange(range);
            }
        });
        block.append(code, copy);
    }

    function showOrder(order) {
        $('payRef').textContent = ref;
        $('payDeposit').textContent = pricing.money(order.deposit, order.currency);
        $('payBalance').textContent = pricing.money(order.balance, order.currency);
        $('payTotal').textContent = pricing.money(order.amount, order.currency);
        $('payState').hidden = true;
        $('payLayout').hidden = false;
    }

    async function loadOrder() {
        window.clearTimeout(retryTimer);
        $('payStateText').textContent = 'Checking your order…';
        $('retryLookup').hidden = true;
        $('startOrder').hidden = true;
        $('payState').hidden = false;
        $('payLayout').hidden = true;
        try {
            var response = await fetch(API + '/order/status?ref=' + encodeURIComponent(ref), { cache: 'no-store' });
            if (response.status === 404 && retries < 2) {
                retries += 1;
                $('payStateText').textContent = 'Waiting for your order to sync.';
                retryTimer = window.setTimeout(loadOrder, 3500);
                return;
            }
            if (!response.ok) throw new Error('Unavailable');

            var order = await response.json();
            if (!order.ok || order.ref !== ref) throw new Error('Invalid order');
            if (order.checkoutFlow !== 'payment-page' || order.status !== 'pending') {
                window.location.replace(trackUrl);
                return;
            }
            if (order.currency !== 'UGX' || !Number.isSafeInteger(order.deposit) || order.deposit <= 0 ||
                !Number.isSafeInteger(order.balance) || order.balance < 0 || order.deposit + order.balance !== order.amount) {
                throw new Error('Invalid amount');
            }
            showOrder(order);
        } catch (error) {
            $('payStateText').textContent = 'We couldn’t load payment details for this order. Check again before sending money.';
            $('retryLookup').hidden = false;
        }
    }

    $('retryLookup').addEventListener('click', function () {
        retries = 0;
        loadOrder();
    });

    $('reportForm').addEventListener('submit', async function (event) {
        event.preventDefault();
        var button = $('sendTransfer');
        if (preview || !method || button.disabled) return;
        var field = $('transferRef');
        var note = field.value.trim();
        if (!note) {
            $('reportError').textContent = 'Enter the transaction reference from your Mobile Money message.';
            $('reportError').hidden = false;
            field.focus();
            return;
        }
        button.disabled = true;
        button.textContent = 'Reporting transfer…';
        $('reportError').hidden = true;
        var choices = $('payMethods').querySelectorAll('button');
        choices.forEach(function (choice) { choice.disabled = true; });
        try {
            var response = await fetch(API + '/order/confirm', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ref: ref, method: method.id, note: note })
            });
            if (!response.ok || !(await response.json()).ok) throw new Error('Transfer report failed');
            window.location.replace(trackUrl);
        } catch (error) {
            $('reportError').textContent = 'We couldn’t confirm that your report was saved. Try again with the same transaction reference.';
            $('reportError').hidden = false;
            button.disabled = false;
            button.textContent = 'Report transfer';
            choices.forEach(function (choice) { choice.disabled = false; });
        }
    });

    buildNetworkOptions();
    if (preview) {
        $('payState').hidden = true;
        $('payLayout').hidden = false;
        $('payOrderLine').hidden = true;
        $('payTotals').hidden = true;
        $('payDemo').hidden = false;
    } else if (/^K97-[A-Z0-9-]{1,40}$/.test(ref)) {
        $('navTrack').href = trackUrl;
        loadOrder();
    } else {
        $('payStateText').textContent = 'Start a growth order to get your payment details.';
        $('startOrder').hidden = false;
    }
})();
