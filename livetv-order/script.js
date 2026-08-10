// --- STRICTLY PRESERVED DATA & CALCULATORS ---
const regionData = {
    UG: {
        currency: "UGX",
        prices: {
            "1year": { display: "180,000", raw: "180000" },
            "6mo": { display: "150,000", raw: "150000" },
            "3mo": { display: "120,000", raw: "120000" }
        },
        payments: ["MTN Mobile Money", "Airtel Money", "Cash in Office (Kampala)"]
    },
    SS: {
        currency: "USD",
        prices: {
            "1year": { display: "70", raw: "70" },
            "6mo": { display: "45", raw: "45" },
            "3mo": { display: "35", raw: "35" }
        },
        payments: ["Mobile Money Agent", "Cash in South Sudan"]
    },
    CD: {
        currency: "USD",
        prices: {
            "1year": { display: "70", raw: "70" },
            "6mo": { display: "45", raw: "45" },
            "3mo": { display: "35", raw: "35" }
        },
        payments: ["Mobile Money"]
    }
};

let currentRegion = null;
let selectedPlanName = '';
let selectedPlanRawPrice = '';
let calculatedExpiryText = '';
let currentStepIndex = 0;
const totalSteps = 6;

// Custom Ordinal Calculator
function getOrdinalNum(n) {
    return n + (n > 0 ? ['th', 'st', 'nd', 'rd'][(n > 3 && n < 21) || n % 10 > 3 ? 0 : n % 10] : '');
}

function formatPremiumDate(date) {
    const day = getOrdinalNum(date.getDate());
    const month = date.toLocaleDateString('en-GB', { month: 'short' });
    const year = date.getFullYear();
    return `${day} ${month} ${year}`;
}

function calculateExpiryDates() {
    const today = new Date();
    let d3 = new Date(today); d3.setMonth(d3.getMonth() + 3);
    document.querySelector('.dynamic-date-3').textContent = `Covered until ${formatPremiumDate(d3)}`;
    let d6 = new Date(today); d6.setMonth(d6.getMonth() + 6);
    document.querySelector('.dynamic-date-6').textContent = `Covered until ${formatPremiumDate(d6)}`;
    let d12 = new Date(today); d12.setFullYear(d12.getFullYear() + 1);
    document.querySelector('.dynamic-date-12').textContent = `Covered until ${formatPremiumDate(d12)}`;
}

// --- WIZARD NAVIGATION & LOGIC ---
function updateProgress(step) {
    const pct = (step / totalSteps) * 100;
    document.getElementById('progress-bar').style.width = pct + '%';
    currentStepIndex = step;
}

function selectRegion(regionCode, el) {
    if(navigator.vibrate) navigator.vibrate(40);
    
    document.querySelectorAll('.region-card').forEach(c => c.classList.remove('selected'));
    el.classList.add('selected');

    currentRegion = regionCode;
    const data = regionData[regionCode];

    calculateExpiryDates();

    document.getElementById('price-1year').textContent = data.prices["1year"].display;
    document.getElementById('price-6mo').textContent = data.prices["6mo"].display;
    document.getElementById('price-3mo').textContent = data.prices["3mo"].display;
    
    document.querySelectorAll('.currency').forEach(el => {
        el.textContent = (regionCode === 'SS' || regionCode === 'CD') ? '$' : data.currency + ' ';
    });

    const paymentSelect = document.getElementById('paymentMethod');
    paymentSelect.innerHTML = `<option value="" disabled selected>Select how you will pay later</option>`;
    data.payments.forEach(method => {
        let opt = document.createElement('option');
        opt.value = method;
        opt.textContent = method;
        paymentSelect.appendChild(opt);
    });

    setTimeout(() => { nextStep(1); triggerStep1Animations(); }, 350);
}

function nextStep(stepNum) {
    const current = document.querySelector('.wizard-step.active');
    const next = document.getElementById(`step-${stepNum}`);

    if(current) {
        current.classList.remove('active');
        current.classList.add('slide-out-left');
    }
    
    next.classList.remove('slide-out-left');
    next.classList.add('active');
    
    updateProgress(stepNum);
    if(navigator.vibrate) navigator.vibrate(30);
    window.scrollTo({ top: 0, behavior: 'smooth' });

    if(stepNum === 5) triggerStep5Animations();
}

function revealPricing() {
    document.getElementById('wizard-card').classList.add('expanded');
    nextStep(6);
}

// Staggered Animations
function triggerStep1Animations() {
    const cards = document.querySelectorAll('.testimonial-card');
    cards.forEach((c, i) => { setTimeout(() => c.classList.add('show'), 150 + (i * 100)); });
}
function triggerStep5Animations() {
    const pillars = document.querySelectorAll('.guarantee-pillar');
    pillars.forEach((p, i) => { setTimeout(() => p.classList.add('show'), 100 + (i * 150)); });
}

// --- CHECKOUT & BOTTOM SHEET ---
function selectPlan(el, planName, planId) {
    el.classList.add('selected');
    if(navigator.vibrate) navigator.vibrate([30, 50]); 
    
    setTimeout(() => {
        openCheckout(planName, planId, el.classList.contains('premium'));
        el.classList.remove('selected');
    }, 400); 
}

function openCheckout(planName, planId, isPremium) {
    const data = regionData[currentRegion];
    selectedPlanName = planName;
    selectedPlanRawPrice = data.prices[planId].raw;

    let durationClass = planId === '1year' ? '.dynamic-date-12' : planId === '6mo' ? '.dynamic-date-6' : '.dynamic-date-3';
    calculatedExpiryText = document.querySelector(durationClass).textContent.trim();

    document.getElementById('summary-plan-name').textContent = planName;
    document.getElementById('summary-expiry').textContent = calculatedExpiryText;
    
    const prefix = (currentRegion === 'SS' || currentRegion === 'CD') ? '$' : data.currency + ' ';
    document.getElementById('summary-plan-price').textContent = `${prefix}${data.prices[planId].display}`;

    const banner = document.getElementById('sheet-banner');
    if(isPremium) banner.classList.add('premium-banner');
    else banner.classList.remove('premium-banner');

    const phoneInput = document.getElementById('clientNumber');
    const prefixMap = { 'UG': '+256 ', 'SS': '+211 ', 'CD': '+243 ' };
    if(!phoneInput.value) phoneInput.value = prefixMap[currentRegion] || '';

    document.getElementById('checkout-sheet').classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeCheckout(force = false) {
    if(force === true || event.target.id === 'checkout-sheet') {
        document.getElementById('checkout-sheet').classList.remove('active');
        document.body.style.overflow = 'auto';
    }
}

// --- FORM EVENTS ---
document.addEventListener('DOMContentLoaded', () => {
    // Phone Auto-format
    document.getElementById('clientNumber').addEventListener('input', function(e) {
        const prefix = currentRegion === 'UG' ? '+256 ' : currentRegion === 'SS' ? '+211 ' : '+243 ';
        if (!this.value.startsWith(prefix.trim())) {
            this.value = prefix;
        }
    });

    // Remove Error state gracefully on typing
    document.querySelectorAll('.input-group input, .input-group select').forEach(el => {
        el.addEventListener('input', () => el.parentElement.classList.remove('error'));
    });
});

function toggleReferral(cb) {
    const slideBox = document.getElementById('ref-input-slide');
    const inputField = document.getElementById('referralCode');
    if(cb.checked) {
        slideBox.classList.add('open');
        setTimeout(() => inputField.focus(), 200);
    } else {
        slideBox.classList.remove('open');
        inputField.value = ""; 
    }
}

// --- SUBMISSION & WEBHOOK ---
async function submitOrder(e) {
    e.preventDefault(); 
    let hasError = false;

    const nameEl = document.getElementById('clientName');
    const numEl = document.getElementById('clientNumber');
    const payEl = document.getElementById('paymentMethod');

    if(!nameEl.value.trim()) { nameEl.parentElement.classList.add('error'); hasError = true; }
    if(numEl.value.replace(/\D/g, '').length < 8) { numEl.parentElement.classList.add('error'); hasError = true; }
    if(!payEl.value) { payEl.parentElement.classList.add('error'); hasError = true; }

    if(hasError) {
        if(navigator.vibrate) navigator.vibrate(100);
        return false;
    }

    const name = nameEl.value.trim();
    const rawNumber = numEl.value.trim();
    const payment = payEl.value;
    const referrer = document.getElementById('referralCode').value.trim() || "Funnel Setup";

    const submitBtn = document.getElementById('submit-btn');
    submitBtn.innerHTML = 'Opening WhatsApp...';
    submitBtn.style.pointerEvents = 'none';
    if(navigator.vibrate) navigator.vibrate([100, 50, 100]);

    const cleanNumber = rawNumber.replace(/\D/g, ''); 
    const sheetNumber = "'" + cleanNumber; 
    const data = regionData[currentRegion];

    const formData = new URLSearchParams();
    formData.append('ClientName', name);
    formData.append('Number', sheetNumber);
    formData.append('Service', 'AccessUG LiveTV');
    formData.append('Package', selectedPlanName);
    formData.append('Price', selectedPlanRawPrice); 
    formData.append('Referrer', referrer);

    try {
        fetch("https://script.google.com/macros/s/AKfycbzsER7toUR8OwPWPic7Oqbbjz-ew2pR_HJ4Um3V9o6eVmlf730ibwF7ELv6GCekmgl2aA/exec", { 
            method: 'POST', body: formData, mode: 'no-cors' 
        });
    } catch (err) { }

    const phone = "256762193386"; 
    
    let message = `*🟢 NEW LIVETV ORDER [${currentRegion}]*\n`;
    message += `━━━━━━━━━━━━━━━━━━━━━\n`;
    message += `*Package:* ${selectedPlanName}\n`;
    message += `*Validity:* ${calculatedExpiryText.replace('Covered until ', '')}\n`; 
    message += `*Amount:* ${selectedPlanRawPrice} ${data.currency}\n\n`;
    message += `*Client Name:* ${name}\n`;
    message += `*WhatsApp:* ${cleanNumber}\n`;
    message += `*Payment Via:* ${payment}\n`;
    if(referrer !== "Funnel Setup") message += `*Referred By:* ${referrer}\n`;
    message += `━━━━━━━━━━━━━━━━━━━━━\n`;
    message += `_Please assist with immediate device configuration._`;

    const url = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
    
    setTimeout(() => { window.location.href = url; }, 600);
}

// --- EXIT INTELLIGENCE ---
let idleTime = 0;
let exitShown = false;

function resetIdle() { idleTime = 0; }
window.addEventListener('touchstart', resetIdle);
window.addEventListener('mousemove', resetIdle);
window.addEventListener('scroll', resetIdle);

setInterval(() => {
    idleTime++;
    if (idleTime >= 8 && currentStepIndex >= 3 && !exitShown) {
        document.getElementById('exit-pill').classList.add('visible');
        exitShown = true;
    }
}, 1000);

function dismissExit(e) {
    if(e) e.stopPropagation();
    document.getElementById('exit-pill').classList.remove('visible');
}

function triggerExitWhatsApp() {
    const url = `https://wa.me/256762193386?text=${encodeURIComponent("Hi, I was looking at the AccessUG LiveTV plans but I have a quick question before I order.")}`;
    window.location.href = url;
}