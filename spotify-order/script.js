// --- REGION & PRICING ENGINE ---
const regionData = {
    UG: {
        name: "Uganda",
        currency: "UGX",
        prices: {
            "1year": { old: "240K", new: "120K", rawValue: "120,000" },
            "9mo": { old: "180K", new: "90K", rawValue: "90,000" },
            "6mo": { old: "120K", new: "60K", rawValue: "60,000" }
        },
        payments: ["MTN Mobile Money", "Airtel Money", "Cash in Office (Kampala)"]
    },
    SS: {
        name: "South Sudan",
        currency: "USD",
        prices: {
            "1year": { old: "$80", new: "$40", rawValue: "40" },
            "9mo": { old: "$60", new: "$30", rawValue: "30" },
            "6mo": { old: "$40", new: "$20", rawValue: "20" }
        },
        payments: ["MoMo - wire via agent", "Give cash in South Sudan"]
    },
    CD: {
        name: "DRC Congo",
        currency: "USD",
        prices: {
            "1year": { old: "$80", new: "$40", rawValue: "40" },
            "9mo": { old: "$60", new: "$30", rawValue: "30" },
            "6mo": { old: "$40", new: "$20", rawValue: "20" }
        },
        payments: ["Mobile Money"]
    }
};

let currentRegion = null;
let currentPlanName = null;
let currentPlanDuration = null; 
let unlockedGifts = 0;

// Prevent scrolling while gatekeeper is open
document.body.style.overflow = 'hidden';

// --- INITIALIZE REGION ---
function setRegion(regionCode) {
    currentRegion = regionCode;
    const data = regionData[regionCode];

    // 1. Inject Prices into the DOM dynamically
    const plans = document.querySelectorAll('.plan-card');
    
    // Ultimate Value (1 Year)
    plans[0].setAttribute('onclick', `selectPlan(this, '1 Year', '1year')`);
    plans[0].querySelector('.old-price').textContent = data.prices["1year"].old;
    plans[0].querySelector('.new-price').textContent = data.prices["1year"].new;
    plans[0].querySelector('.currency').textContent = data.currency;

    // Best Seller (9 Months)
    plans[1].setAttribute('onclick', `selectPlan(this, '9 Months', '9mo')`);
    plans[1].querySelector('.old-price').textContent = data.prices["9mo"].old;
    plans[1].querySelector('.new-price').textContent = data.prices["9mo"].new;
    plans[1].querySelector('.currency').textContent = data.currency;

    // Starter (6 Months)
    plans[2].setAttribute('onclick', `selectPlan(this, '6 Months', '6mo')`);
    plans[2].querySelector('.old-price').textContent = data.prices["6mo"].old;
    plans[2].querySelector('.new-price').textContent = data.prices["6mo"].new;
    plans[2].querySelector('.currency').textContent = data.currency;

    // 2. Populate Payment Methods
    const paymentSelect = document.getElementById('paymentMethod');
    paymentSelect.innerHTML = "";
    data.payments.forEach(method => {
        let opt = document.createElement('option');
        opt.value = method;
        opt.textContent = method;
        paymentSelect.appendChild(opt);
    });

    // 3. Dynamic WhatsApp Placeholder
    const phoneInput = document.getElementById('clientNumber');
    if (phoneInput) {
        if (regionCode === 'UG') phoneInput.placeholder = "e.g. +256 700 000 000";
        else if (regionCode === 'SS') phoneInput.placeholder = "e.g. +211 000 000 000";
        else if (regionCode === 'CD') phoneInput.placeholder = "e.g. +243 000 000 000";
    }

    // 4. Clear Gatekeeper with smooth fade
    const gatekeeper = document.getElementById('region-gatekeeper');
    gatekeeper.style.opacity = '0';
    gatekeeper.style.pointerEvents = 'none';
    setTimeout(() => {
        gatekeeper.style.display = 'none';
        document.body.style.overflow = 'auto'; // Allow scrolling again
    }, 500);
}

// --- WIZARD LOGIC ---
function selectPlan(cardElement, planName, planId) {
    // 1. Visual selection
    document.querySelectorAll('.plan-card').forEach(c => c.classList.remove('selected'));
    cardElement.classList.add('selected');

    // 2. Store data
    currentPlanName = planName;
    currentPlanDuration = planName; 
    
    const data = regionData[currentRegion];
    const rawPrice = data.prices[planId].rawValue;

    // 3. Update Summary
    document.getElementById('sum-total').textContent = `${rawPrice} ${data.currency}`;

    // 4. Set the Netflix Gift text permanently to 1 Month Free
    document.querySelector('#bonus-1 p').textContent = `1 Month Free`;

    // 5. Enable button text
    const btn = document.getElementById('btn-step-1');
    btn.classList.remove('disabled');
    btn.innerHTML = `Continue <i class="fas fa-arrow-right"></i>`;

    // 6. Smooth scroll
    setTimeout(() => {
        btn.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 350);
}

function unlockBonus(id) {
    const el = document.getElementById('bonus-' + id);
    if(el.classList.contains('unlocked')) return;

    el.classList.remove('locked');
    el.classList.add('unlocked');
    el.querySelector('.status').textContent = "CLAIMED";
    
    unlockedGifts++;

    if(unlockedGifts >= 2) {
        document.getElementById('btn-step-2').classList.remove('disabled');
    }
}

function goToStep(stepNumber) {
    document.querySelectorAll('.wizard-step').forEach(s => s.classList.remove('active-step'));
    document.getElementById('step-' + stepNumber).classList.add('active-step');
    
    document.querySelectorAll('.step').forEach(s => {
        s.classList.toggle('active', parseInt(s.dataset.step) <= stepNumber);
    });

    document.querySelector('.wizard-card').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

async function validateAndSend() {
    const name = document.getElementById('clientName').value.trim();
    const rawNumber = document.getElementById('clientNumber').value.trim();
    const payment = document.getElementById('paymentMethod').value;
    // Add this line to grab the referral code
    const referrer = document.getElementById('referralCode')?.value.trim() || "Direct";

    // Form Validation
    if (!name) {
        alert("Please enter your Full Name.");
        document.getElementById('clientName').focus();
        return false;
    }
    if (rawNumber.length < 8) {
        alert("Please enter a valid WhatsApp Number.");
        document.getElementById('clientNumber').focus();
        return false;
    }

    // Number Sanitizer for Plain Text in Sheets
    const cleanNumber = rawNumber.replace(/\D/g, ''); 
    const sheetNumber = "'" + cleanNumber; 

    const data = regionData[currentRegion];
    
    let rawPrice = "0";
    if (currentPlanName.includes("1 Year")) rawPrice = data.prices["1year"].rawValue;
    else if (currentPlanName.includes("9 Months")) rawPrice = data.prices["9mo"].rawValue;
    else if (currentPlanName.includes("6 Months")) rawPrice = data.prices["6mo"].rawValue;

    // --- START: GOOGLE SHEETS INTEGRATION ---
    // This sends data to your sheet in the background
    const formData = new URLSearchParams();
    formData.append('ClientName', name);
    formData.append('Number', sheetNumber); // Added newly captured number
    formData.append('Service', 'Spotify Premium'); // FIXED: Was incorrectly labeled Netflix Premium
    formData.append('Package', currentPlanName);
    formData.append('Price', rawPrice.replace(/,/g, '')); // Removes commas for math
    formData.append('Referrer', referrer);

    try {
        // Uses your Google Web App URL
        fetch("https://script.google.com/macros/s/AKfycbzsER7toUR8OwPWPic7Oqbbjz-ew2pR_HJ4Um3V9o6eVmlf730ibwF7ELv6GCekmgl2aA/exec", { 
            method: 'POST', 
            body: formData, 
            mode: 'no-cors' 
        });
    } catch (e) { console.log("Sheets sync failed, proceeding to WhatsApp."); }
    // --- END: GOOGLE SHEETS INTEGRATION ---

    const phone = "256762193386"; 
    
    let message = `*NEW ORDER [${data.name.toUpperCase()}]*\n\n`;
    message += `*Service:* Spotify Premium\n`;
    message += `*Package:* ${currentPlanName}\n`;
    message += `*Price:* ${rawPrice} ${data.currency}\n`;
    message += `*Referrer:* ${referrer}\n\n`; 
    message += `*Name:* ${name}\n`;
    message += `*WhatsApp:* ${cleanNumber}\n`; // Added to message
    message += `*Payment Method:* ${payment}`;

    const url = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
    window.location.href = url;
    return false;
}

// --- DUAL-PILL REFERRAL LOGIC ---
function switchReferral(isYes) {
    const btnNo = document.getElementById('btn-ref-no');
    const btnYes = document.getElementById('btn-ref-yes');
    const slideBox = document.getElementById('ref-input-slide');
    const inputField = document.getElementById('referralCode');

    if (isYes) {
        btnNo.classList.remove('active');
        btnYes.classList.add('active');
        slideBox.classList.add('open');
        setTimeout(() => inputField.focus(), 150); // Auto-focuses keyboard
    } else {
        btnYes.classList.remove('active');
        btnNo.classList.add('active');
        slideBox.classList.remove('open');
        inputField.value = ""; // Clears the box if they change their mind
    }
}