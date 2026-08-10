(function () {
  'use strict';

  const config = window.ORDER_CONFIG || {};
  const query = new URLSearchParams(window.location.search);
  const sourceFields = ['utm_source', 'utm_campaign', 'utm_content', 'ref'];

  function orderId(prefix) {
    const now = new Date();
    const day = [now.getFullYear(), String(now.getMonth() + 1).padStart(2, '0'), String(now.getDate()).padStart(2, '0')].join('');
    const random = Math.random().toString(36).slice(2, 6).toUpperCase();
    return `${prefix}-${day}-${random}`;
  }

  function normaliseWhatsApp(value) {
    return String(value || '').replace(/[^0-9]/g, '');
  }

  function textValue(form, name) {
    const input = form.elements.namedItem(name);
    return input ? String(input.value || '').trim() : '';
  }

  function selectedValue(form, name) {
    const input = form.querySelector(`[name="${name}"]:checked`);
    return input ? input.value : textValue(form, name);
  }

  function selectedLabel(form, name) {
    const selected = form.querySelector(`[name="${name}"]:checked`);
    if (!selected) return selectedValue(form, name);
    const label = selected.closest('.choice');
    return label ? label.querySelector('strong')?.textContent?.trim() || selected.value : selected.value;
  }

  function getTracking() {
    return sourceFields.reduce((result, key) => {
      result[key] = query.get(key) || '';
      return result;
    }, {});
  }

  function writeOrder(payload) {
    if (!config.sheetEndpoint) return Promise.resolve(false);
    const formData = new URLSearchParams();
    Object.entries(payload).forEach(([key, value]) => formData.append(key, typeof value === 'object' ? JSON.stringify(value) : value || ''));
    return fetch(config.sheetEndpoint, { method: 'POST', body: formData, mode: 'no-cors' })
      .then(() => true)
      .catch(() => false);
  }

  function messageFor(payload) {
    const lines = [
      `*${String(config.brandName || 'AccessUG').toUpperCase()} - NEW REQUEST*`,
      '',
      `*Reference:* ${payload.order_id}`,
      `*Offer:* ${payload.offer}`,
      `*Package:* ${payload.package || 'To be confirmed'}`,
      `*Price:* ${payload.price || 'To be confirmed'} ${payload.currency || ''}`.trim(),
      `*Name:* ${payload.name}`,
      `*WhatsApp:* ${payload.whatsapp}`
    ];
    if (payload.payment_method) lines.push(`*Payment method:* ${payload.payment_method}`);
    Object.entries(payload.details || {}).forEach(([key, value]) => {
      if (value) lines.push(`*${key}:* ${value}`);
    });
    if (payload.ref) lines.push(`*Referral:* ${payload.ref}`);
    return lines.join('\n');
  }

  function updateSummary(form) {
    const packageName = selectedLabel(form, 'package') || textValue(form, 'package');
    const selected = form.querySelector('[name="package"]:checked');
    const price = selected?.dataset.price || form.dataset.defaultPrice || 'To be confirmed';
    const currency = selected?.dataset.currency || form.dataset.defaultCurrency || '';
    const packageOutput = form.querySelector('[data-summary="package"]');
    const priceOutput = form.querySelector('[data-summary="price"]');
    if (packageOutput) packageOutput.textContent = packageName || 'Not selected';
    if (priceOutput) priceOutput.textContent = `${price}${currency ? ` ${currency}` : ''}`.trim();
  }

  function goToStep(form, next) {
    const steps = [...form.querySelectorAll('.form-step')];
    steps.forEach((step, index) => step.classList.toggle('active', index === next));
    form.querySelectorAll('.form-progress span').forEach((marker, index) => marker.classList.toggle('active', index <= next));
    if (next === steps.length - 1) updateSummary(form);
    form.closest('.form-card')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function validateCurrentStep(form) {
    const current = form.querySelector('.form-step.active');
    const inputs = [...current.querySelectorAll('input, select, textarea')].filter(input => input.required);
    for (const input of inputs) {
      if (!input.checkValidity()) {
        input.reportValidity();
        return false;
      }
    }
    return true;
  }

  function detailsFor(form) {
    const keys = (form.dataset.detailFields || '').split(',').map(key => key.trim()).filter(Boolean);
    return keys.reduce((details, key) => {
      const label = form.querySelector(`[name="${key}"]`)?.dataset.label || key.replace(/_/g, ' ');
      details[label] = selectedValue(form, key);
      return details;
    }, {});
  }

  function payloadFor(form) {
    const product = config.products?.[form.dataset.product] || {};
    const choice = form.querySelector('[name="package"]:checked');
    const rawNumber = textValue(form, 'whatsapp');
    const price = choice?.dataset.price || form.dataset.defaultPrice || '';
    const currency = choice?.dataset.currency || form.dataset.defaultCurrency || '';
    const order = {
      order_id: orderId(form.dataset.prefix || '97W'),
      created_at: new Date().toISOString(),
      source: product.source || form.dataset.product || 'website',
      offer: product.offer || form.dataset.offer || 'AccessUG request',
      package: selectedLabel(form, 'package') || form.dataset.defaultPackage || '',
      price,
      currency,
      name: textValue(form, 'name'),
      whatsapp: normaliseWhatsApp(rawNumber),
      market: textValue(form, 'market'),
      payment_method: textValue(form, 'payment_method'),
      terms_version: config.termsVersion || '',
      terms_accepted_at: new Date().toISOString(),
      pipeline_status: form.dataset.pipelineStatus || 'new_request',
      details: detailsFor(form),
      ...getTracking()
    };
    return order;
  }

  function showSuccess(form, payload) {
    const success = form.querySelector('.form-success');
    const reference = form.querySelector('[data-order-reference]');
    if (reference) reference.textContent = payload.order_id;
    if (success) success.classList.add('show');
    form.querySelector('.form-steps')?.classList.add('hidden');
    form.querySelector('.form-progress')?.classList.add('hidden');
  }

  function submitOrder(form) {
    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }
    const error = form.querySelector('.error-message');
    if (error) error.classList.remove('show');
    const payload = payloadFor(form);
    const button = form.querySelector('[type="submit"]');
    if (button) { button.disabled = true; button.textContent = 'Preparing your request...'; }
    writeOrder(payload).finally(() => {
      showSuccess(form, payload);
      const url = `https://wa.me/${config.supportWhatsApp}?text=${encodeURIComponent(messageFor(payload))}`;
      window.location.assign(url);
      if (button) { button.disabled = false; button.textContent = 'Open WhatsApp'; }
    });
  }

  document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('[data-order-form]').forEach(form => {
      form.querySelectorAll('[data-next]').forEach(button => button.addEventListener('click', () => {
        if (!validateCurrentStep(form)) return;
        const currentIndex = [...form.querySelectorAll('.form-step')].findIndex(step => step.classList.contains('active'));
        goToStep(form, currentIndex + 1);
      }));
      form.querySelectorAll('[data-back]').forEach(button => button.addEventListener('click', () => {
        const currentIndex = [...form.querySelectorAll('.form-step')].findIndex(step => step.classList.contains('active'));
        goToStep(form, Math.max(0, currentIndex - 1));
      }));
      form.querySelectorAll('[name="package"]').forEach(input => input.addEventListener('change', () => updateSummary(form)));
      form.addEventListener('submit', event => { event.preventDefault(); submitOrder(form); });
      updateSummary(form);
    });
  });
})();
