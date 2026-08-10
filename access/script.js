// --- STATE MANAGEMENT ---
let user = {
    name: "", country: "UG", currency: "UGX", rate: 1,
    serviceDisplay: "", service: "", planTitle: "", device: "", activePlanIndex: 0
};

// --- ELITE PRICING DATA ---
// NOTE: Prime Logo applies to ALL Netflix plans now!
const planData = {
    netflix: {
        features: [
            '<i class="fas fa-tv"></i> 4K UHD Quality',
            '<i class="fas fa-users"></i> 2+ Devices',
            '<i class="fas fa-download"></i> Offline Downloads',
            '<i class="fas fa-headset"></i> 24/7 Support'
        ],
        plans: [
            { title: "1 Year", price: 250000, oldPrice: 500000, giftHtml: `<img src="../IMAGES/prime-video.png" alt="Prime"> 1 Year Free Prime` },
            { title: "9 Months", price: 200000, oldPrice: 400000, giftHtml: `<img src="../IMAGES/prime-video.png" alt="Prime"> 9 Months Free Prime` },
            { title: "6 Months", price: 150000, oldPrice: 300000, giftHtml: `<img src="../IMAGES/prime-video.png" alt="Prime"> 6 Months Free Prime` },
            { title: "3 Months", price: 90000, oldPrice: 180000, giftHtml: `<img src="../IMAGES/prime-video.png" alt="Prime"> 3 Months Free Prime` }
        ]
    },
    prime: {
        features: [
            '<i class="fas fa-crown"></i> Amazon Originals',
            '<i class="fas fa-tv"></i> 4K UHD Quality',
            '<i class="fas fa-mobile-alt"></i> Any Device'
        ],
        plans: [
            { title: "1 Year", price: 150000, oldPrice: 300000, giftHtml: `<img src="../IMAGES/netflix.png" alt="Netflix"> 1 Month Free Netflix` },
            { title: "6 Months", price: 120000, oldPrice: 240000, giftHtml: `<img src="../IMAGES/netflix.png" alt="Netflix"> 1 Month Free Netflix` },
            { title: "3 Months", price: 80000, oldPrice: 160000, giftHtml: `<img src="../IMAGES/netflix.png" alt="Netflix"> 1 Month Free Netflix` }
        ]
    }
};

// --- INITIALIZATION ---
document.addEventListener('DOMContentLoaded', () => {
    const countryBtns = document.querySelectorAll('.country-btn');
    countryBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            countryBtns.forEach(b => b.classList.remove('active'));
            const target = e.currentTarget;
            target.classList.add('active');
            user.country = target.getAttribute('data-country');
            user.currency = target.getAttribute('data-currency');
            user.rate = parseFloat(target.getAttribute('data-rate'));
        });
    });
});

// --- NAVIGATION & TRACKER ---
function updateTracker() {
    const tracker = document.getElementById('selection-tracker');
    if (!user.service) { tracker.style.display = 'none'; return; }
    
    tracker.style.display = 'flex';
    document.getElementById('track-svc').innerText = user.serviceDisplay;
    document.getElementById('track-plan').innerText = user.planTitle || "...";
    
    if (user.device) {
        document.getElementById('sep-dev').style.display = 'block';
        document.getElementById('track-dev').style.display = 'block';
        document.getElementById('track-dev').innerText = user.device;
    } else {
        document.getElementById('sep-dev').style.display = 'none';
        document.getElementById('track-dev').style.display = 'none';
    }
}

function switchStep(fromId, toId) {
    document.getElementById(fromId).classList.remove('active');
    document.getElementById(toId).classList.add('active');
    updateTracker();
}

function goBack(toId) {
    document.querySelectorAll('.wizard-step').forEach(s => s.classList.remove('active'));
    document.getElementById(toId).classList.add('active');
    
    if (toId === 'step-onboard') { user.service = ""; user.planTitle = ""; user.device = ""; }
    if (toId === 'step-service') { user.planTitle = ""; user.device = ""; }
    if (toId === 'step-plans') { user.device = ""; }
    updateTracker();
}

// --- ONBOARDING & SERVICE ---
function initiatePortal() {
    const nameInput = document.getElementById('userName').value.trim();
    if (!nameInput) { alert("Please enter your full name to continue."); return; }
    user.name = nameInput;
    switchStep('step-onboard', 'step-service');
}

function selectService(displayName, serviceId) {
    user.serviceDisplay = displayName;
    user.service = serviceId;
    document.body.setAttribute('data-theme', serviceId);
    
    if (serviceId === 'spotify') {
        switchStep('step-service', 'step-spotify');
    } else {
        user.activePlanIndex = 0; // Default to first plan
        renderAdvancedPlans(serviceId);
        switchStep('step-service', 'step-plans');
    }
}

// --- ADVANCED SLIDER LOGIC ---
function renderAdvancedPlans(service) {
    const data = planData[service];
    
    // Inject Features
    document.getElementById('showcase-features').innerHTML = data.features.map(f => `<div class="f-pill">${f}</div>`).join('');
    
    // Inject Slider Buttons
    const slider = document.getElementById('duration-slider');
    slider.innerHTML = '';
    data.plans.forEach((plan, index) => {
        const btn = document.createElement('button');
        btn.className = `slider-btn ${index === user.activePlanIndex ? 'active' : ''}`;
        btn.innerText = plan.title;
        btn.onclick = () => updateShowcase(index);
        slider.appendChild(btn);
    });

    // Render Initial Showcase
    updateShowcase(user.activePlanIndex);
}

function updateShowcase(index) {
    user.activePlanIndex = index;
    const plan = planData[user.service].plans[index];
    user.planTitle = plan.title;
    
    // Update Slider UI
    const btns = document.querySelectorAll('.slider-btn');
    btns.forEach((b, i) => {
        b.classList.toggle('active', i === index);
    });

    // Calculate Price
    let newP = "", oldP = "";
    if (user.currency === "USD") {
        newP = `$${Math.round(plan.price * user.rate)}`;
        oldP = `$${Math.round(plan.oldPrice * user.rate)}`;
    } else {
        newP = `${(plan.price / 1000)}K`;
        oldP = `${(plan.oldPrice / 1000)}K`;
    }

    // Animate Update
    const showcase = document.getElementById('plan-showcase');
    showcase.style.transform = 'scale(0.98)';
    showcase.style.opacity = '0.8';
    
    setTimeout(() => {
        document.getElementById('showcase-old').innerText = oldP;
        document.getElementById('showcase-new').innerHTML = `${newP} <small>${user.currency}</small>`;
        document.getElementById('showcase-gift').innerHTML = plan.giftHtml;
        
        showcase.style.transform = 'scale(1)';
        showcase.style.opacity = '1';
        updateTracker();
    }, 150);
}

function confirmPlan() {
    if (user.service === 'prime') { finishPrime(); } else { switchStep('step-plans', 'step-device'); }
}

// --- DEVICE & FINAL INSTRUCTIONS ---
function selectDevice(device) {
    user.device = device;
    finishNetflix(device);
}

function copyText(elementId, btnElement) {
    const text = document.getElementById(elementId).innerText;
    navigator.clipboard.writeText(text).then(() => {
        const originalText = btnElement.innerHTML;
        btnElement.innerHTML = `<i class="fas fa-check"></i> Copied`;
        btnElement.classList.add('copied');
        setTimeout(() => { btnElement.innerHTML = originalText; btnElement.classList.remove('copied'); }, 2000);
    });
}

function finishNetflix(device) {
    document.getElementById('final-back-btn').setAttribute('onclick', "goBack('step-device')");
    updateTracker();

    const vaultHtml = `
        <div class="credential-vault">
            <div class="cred-row">
                <div class="cred-info">
                    <span>Email Address</span>
                    <strong id="nf-email">cartelug6@gmail.com</strong>
                </div>
                <button class="btn-copy" onclick="copyText('nf-email', this)"><i class="far fa-copy"></i> Copy</button>
            </div>
            <div class="cred-row">
                <div class="cred-info">
                    <span>Password</span>
                    <strong id="nf-pass">cartel261</strong>
                </div>
                <button class="btn-copy" onclick="copyText('nf-pass', this)"><i class="far fa-copy"></i> Copy</button>
            </div>
        </div>
    `;

    let stepsHtml = "";
    if (device === 'Smart TV') {
        stepsHtml = `
            <div class="step-timeline">
                <div class="t-step"><div class="t-num">1</div><div class="t-text">Open the Netflix app directly on your TV and select <b>Sign In</b>.</div></div>
                <div class="t-step"><div class="t-num">2</div><div class="t-text">If a code screen appears, ignore the code and choose <b>"Use Remote"</b> instead.</div></div>
                <div class="t-step"><div class="t-num">3</div><div class="t-text">If prompted with sending a link, choose <b>"Use Password Instead"</b>.</div></div>
                <div class="t-step"><div class="t-num">4</div><div class="t-text">Enter the Email and Password above, tap Sign In, and wait at the <b>"Who's watching?" (Profiles)</b> screen.</div></div>
            </div>
        `;
    } else if (device === 'TV') {
        stepsHtml = `
            <div class="step-timeline">
                <div class="t-step"><div class="t-num">1</div><div class="t-text">Use your connected device remote (Firestick/Console) and open Netflix.</div></div>
                <div class="t-step"><div class="t-num">2</div><div class="t-text">Select <b>Sign In</b>. If a code screen appears, choose <b>"Use Remote"</b>.</div></div>
                <div class="t-step"><div class="t-num">3</div><div class="t-text">If prompted, choose <b>"Use Password Instead"</b>.</div></div>
                <div class="t-step"><div class="t-num">4</div><div class="t-text">Enter the Email and Password above, tap Sign In, and wait at the <b>"Who's watching?" (Profiles)</b> screen.</div></div>
            </div>
        `;
    } else {
        stepsHtml = `
            <div class="step-timeline">
                <div class="t-step"><div class="t-num">1</div><div class="t-text">Open Netflix and log out of any existing accounts.</div></div>
                <div class="t-step"><div class="t-num">2</div><div class="t-text">Tap <b>Sign In</b> and enter the Email and Password shown above.</div></div>
                <div class="t-step"><div class="t-num">3</div><div class="t-text">Tap Sign In and wait at the <b>"Who's watching?" (Profiles)</b> screen.</div></div>
            </div>
        `;
    }

    const msg = encodeURIComponent(`Hello accessug i'm at the profiles screen.`);
    
    document.getElementById('final-content').innerHTML = `
        <div class="guide-wrapper">
            ${vaultHtml}
            ${stepsHtml}
            <a href="https://wa.me/256762193386?text=${msg}" class="btn btn-whatsapp"><i class="fab fa-whatsapp"></i> I am at the Profiles Screen</a>
        </div>
    `;
    
    switchStep('step-device', 'step-final');
}

function finishPrime() {
    document.getElementById('final-back-btn').setAttribute('onclick', "goBack('step-plans')");
    updateTracker();
    
    const vaultHtml = `
        <div class="credential-vault">
            <div class="cred-row">
                <div class="cred-info">
                    <span>Prime Login Email</span>
                    <strong id="pm-email">cartelug1@gmail.com</strong>
                </div>
                <button class="btn-copy" onclick="copyText('pm-email', this)"><i class="far fa-copy"></i> Copy</button>
            </div>
        </div>
    `;

    const msg = encodeURIComponent(`Hello AccessUG, my name is ${user.name}. I have entered the Prime email, please send me the password.`);
    
    document.getElementById('final-content').innerHTML = `
        <div class="guide-wrapper">
            ${vaultHtml}
            <div class="step-timeline">
                <div class="t-step"><div class="t-num">1</div><div class="t-text">Open Prime Video and select <b>Sign In</b>.</div></div>
                <div class="t-step"><div class="t-num">2</div><div class="t-text">Enter the Email Address shown above.</div></div>
                <div class="t-step"><div class="t-num">3</div><div class="t-text">Click the button below to request the secure password on WhatsApp.</div></div>
            </div>
            <a href="https://wa.me/256762193386?text=${msg}" class="btn btn-whatsapp"><i class="fab fa-whatsapp"></i> Request Prime Password</a>
        </div>
    `;
    
    switchStep('step-plans', 'step-final');
}

function sendSpotifyWhatsApp() {
    const msg = encodeURIComponent(`Hello AccessUG, my name is ${user.name}. I have accepted the invite, please send me the Address to join.`);
    window.location.href = `https://wa.me/256762193386?text=${msg}`;
}