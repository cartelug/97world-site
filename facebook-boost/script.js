/**
 * ==========================================================================
 * ACCESSUG ELITE FACEBOOK ENGINE (V12)
 * Features: Trust Slider Modal, Username Input, Strict Number Validation
 * ==========================================================================
 */

const SysConfig = {
    // ⚠️ Replace with your newly deployed Web App URL
    sheetURL: 'https://script.google.com/macros/s/AKfycbzsER7toUR8OwPWPic7Oqbbjz-ew2pR_HJ4Um3V9o6eVmlf730ibwF7ELv6GCekmgl2aA/exec', 
    whatsapp: '256762193386',
    
    // Core Package Tiers
    matrix: {
        'UGX': [
            { id: 0, title: "Advanced", price: 375000, perks: ["10k Followers", "3k Page Likes", "3k Reactions", "5k Post Likes"] },
            { id: 1, title: "Pro", price: 506250, perks: ["15k Followers", "5k Page Likes", "5k Reactions", "10k Post Likes"] },
            { id: 2, title: "Elite", price: 618750, isHot: true, perks: ["20k Followers", "7.5k Page Likes", "7.5k Reactions", "15k Post Likes"] },
            { id: 3, title: "Ultimate", price: 750000, isMax: true, perks: ["30k Followers", "10k Page Likes", "10k Reactions", "20k Post Likes"] }
        ],
        'USD': [
            { id: 0, title: "Advanced", price: 100, perks: ["10k Followers", "3k Page Likes", "3k Reactions", "5k Post Likes"] },
            { id: 1, title: "Pro", price: 135, perks: ["15k Followers", "5k Page Likes", "5k Reactions", "10k Post Likes"] },
            { id: 2, title: "Elite", price: 165, isHot: true, perks: ["20k Followers", "7.5k Page Likes", "7.5k Reactions", "15k Post Likes"] },
            { id: 3, title: "Ultimate", price: 200, isMax: true, perks: ["30k Followers", "10k Page Likes", "10k Reactions", "20k Post Likes"] }
        ]
    }
};

const State = {
    geo: 'UGX',
    countryCode: 'UG',
    selectedId: -1,
    refActive: false,
    calcPrice: 0
};

const FbApp = {

    init() {
        const savedGeo = localStorage.getItem('accessug_curr_fb');
        const savedCode = localStorage.getItem('accessug_code_fb');
        
        if (savedGeo && savedCode) {
            this.setCountry(savedGeo, savedCode, false);
        } else {
            document.getElementById('country-modal').setAttribute('aria-hidden', 'false');
        }

        // Live Event Listeners for Validation
        document.getElementById('client-name').addEventListener('input', () => this.validateFlow());
        document.getElementById('client-number').addEventListener('input', () => this.validateFlow());
        document.getElementById('fb-link').addEventListener('input', () => this.validateFlow());
    },

    setCountry(currency, code, save = true) {
        if(save) {
            localStorage.setItem('accessug_curr_fb', currency);
            localStorage.setItem('accessug_code_fb', code);
        }
        State.geo = currency;
        State.countryCode = code;
        
        document.getElementById('country-modal').setAttribute('aria-hidden', 'true');
        
        // Dynamic WhatsApp Placeholder
        const phoneInput = document.getElementById('client-number');
        if (code === 'UG') phoneInput.placeholder = "E.g. +256 700 000 000";
        else if (code === 'SS') phoneInput.placeholder = "E.g. +211 000 000 000";
        else if (code === 'CD') phoneInput.placeholder = "E.g. +243 000 000 000";

        State.selectedId = -1; 
        
        this.renderGrid();
        this.updateDock();
        this.validateFlow();
    },

    renderGrid() {
        const grid = document.getElementById('package-list');
        grid.innerHTML = '';
        
        const tiers = SysConfig.matrix[State.geo];
        const sym = State.geo === 'USD' ? '$' : '';
        const cur = State.geo === 'UGX' ? 'UGX' : 'USD';

        tiers.forEach((tier) => {
            const isAct = State.selectedId === tier.id ? 'active' : '';
            
            let tag = '';
            if(tier.isHot) tag = `<div class="badge-tag hot">Most Popular</div>`;
            if(tier.isMax) tag = `<div class="badge-tag">Max Impact</div>`;

            let icons = ['fa-user-plus', 'fa-thumbs-up', 'fa-heart', 'fa-comment-dots'];
            let listHTML = tier.perks.map((p, i) => `<li><i class="fas ${icons[i]} f-icon"></i> ${p}</li>`).join('');

            grid.innerHTML += `
                <div class="pack-card ${isAct}" onclick="FbApp.selectTier(${tier.id})">
                    ${tag}
                    <div class="pack-header">
                        <h3 class="pack-name">${tier.title}</h3>
                        <div class="pack-price-box">
                            <span class="pack-price">${sym}${tier.price.toLocaleString()}</span>
                            <span class="pack-curr">${cur}</span>
                        </div>
                    </div>
                    <ul class="pack-features">
                        ${listHTML}
                    </ul>
                </div>
            `;
        });
    },

    selectTier(id) {
        State.selectedId = id;
        this.renderGrid();
        this.updateDock();
        this.validateFlow();
        
        if (navigator.vibrate) navigator.vibrate(15);
        
        // Smooth scroll to form
        setTimeout(() => {
            document.getElementById('details-section').scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 150);
    },

    toggleReferral() {
        State.refActive = !State.refActive;
        const drawer = document.getElementById('ref-drawer');
        const btn = document.getElementById('ref-btn');
        
        if (State.refActive) {
            drawer.classList.add('show');
            btn.classList.add('active');
            setTimeout(() => document.getElementById('ref-code').focus(), 300);
        } else {
            drawer.classList.remove('show');
            btn.classList.remove('active');
            document.getElementById('ref-code').value = ''; 
        }
    },

    updateDock() {
        const valUI = document.getElementById('ui-val');
        const curUI = document.getElementById('ui-curr');

        if (State.selectedId === -1) {
            valUI.innerText = "0";
            curUI.innerText = State.geo;
            State.calcPrice = 0;
            return;
        }

        const tier = SysConfig.matrix[State.geo][State.selectedId];
        State.calcPrice = tier.price;

        if (State.geo === 'USD') {
            valUI.innerText = `$${tier.price}`;
            curUI.innerText = 'USD';
        } else {
            valUI.innerText = tier.price.toLocaleString();
            curUI.innerText = 'UGX';
        }
    },

    validateFlow() {
        const nameVal = document.getElementById('client-name').value.trim();
        const numVal = document.getElementById('client-number').value.trim();
        const linkVal = document.getElementById('fb-link').value.trim(); // Now just Username/Page Name
        const btn = document.getElementById('btn-submit');
        const txt = document.getElementById('btn-text');

        // Text input validation (no longer requires URL)
        if (State.selectedId > -1 && nameVal.length > 2 && numVal.length > 8 && linkVal.length > 2) {
            btn.disabled = false;
            txt.innerText = "Place Order";
        } else {
            btn.disabled = true;
            if (State.selectedId === -1) txt.innerText = "Select Package";
            else if (nameVal.length <= 2) txt.innerText = "Enter Your Name";
            else if (numVal.length <= 8) txt.innerText = "Enter WhatsApp Number";
            else txt.innerText = "Enter Username / Page Name";
        }
    },

    // --- NEW TRUST SLIDER LOGIC ---
    openTrustModal() {
        if (document.getElementById('btn-submit').disabled) return;
        
        // Populate Slide 3 dynamically
        const tier = SysConfig.matrix[State.geo][State.selectedId];
        const displayPrice = State.geo === 'USD' ? `$${tier.price}` : `${tier.price.toLocaleString()} UGX`;
        const targetName = document.getElementById('fb-link').value.trim();

        document.getElementById('sum-target').innerText = targetName;
        document.getElementById('sum-package').innerText = `${tier.title} Tier`;
        document.getElementById('sum-price').innerText = displayPrice;

        // Reset to slide 1 & open
        this.nextSlide(1);
        document.getElementById('trust-modal').setAttribute('aria-hidden', 'false');
    },

    closeTrustModal() {
        document.getElementById('trust-modal').setAttribute('aria-hidden', 'true');
    },

    nextSlide(stepNumber) {
        // Hide all slides
        document.querySelectorAll('.slider-pane').forEach(el => el.classList.remove('active'));
        // Deactivate all dots
        document.querySelectorAll('.dot').forEach(el => el.classList.remove('active'));
        
        // Show current
        document.getElementById(`slide-${stepNumber}`).classList.add('active');
        document.getElementById(`dot-${stepNumber}`).classList.add('active');
    },

    finalizeOrder() {
        const clientName = document.getElementById('client-name').value.trim();
        const rawNumber = document.getElementById('client-number').value.trim();
        const pageLink = document.getElementById('fb-link').value.trim();
        const refInput = document.getElementById('ref-code').value.trim();
        
        // The Plain Text Number Sanitizer
        const cleanNumber = rawNumber.replace(/\D/g, ''); 
        const sheetNumber = "'" + cleanNumber; 

        // Process Referrer
        const finalReferrer = (State.refActive && refInput !== "") ? refInput : "Direct";

        const tier = SysConfig.matrix[State.geo][State.selectedId];
        const displayPrice = State.geo === 'USD' ? `$${tier.price}` : `${tier.price.toLocaleString()} UGX`;

        // 1. GOOGLE SHEETS SYNC
        const payload = new URLSearchParams();
        payload.append('ClientName', clientName);
        payload.append('Number', sheetNumber);
        payload.append('Service', `Facebook Boost [${State.geo}]`);
        payload.append('Package', `${tier.title} Tier`);
        payload.append('Price', State.calcPrice.toString());
        payload.append('Referrer', finalReferrer);

        try {
            fetch(SysConfig.sheetURL, { method: 'POST', body: payload, mode: 'no-cors' });
        } catch (err) {
            console.log("Sheet sync bypassed");
        }

        // 2. WHATSAPP BRIDGE
        let msg = `🚀 *NEW FACEBOOK BOOST*\n\n`;
        msg += `*Client Name:* ${clientName}\n`;
        msg += `*WhatsApp:* ${cleanNumber}\n`;
        msg += `*Package:* ${tier.title} Tier\n`;
        msg += `*Total:* ${displayPrice}\n\n`;
        msg += `👤 *Target Page:* ${pageLink}\n`;
        msg += `🎁 *Referrer:* ${finalReferrer}\n\n`;
        msg += `_I have accepted the terms and am ready to pay the 30% deposit._`;

        // UI Loading State on the Modal Button
        const btn = document.getElementById('btn-final-confirm');
        document.getElementById('final-btn-text').innerText = "Securing...";
        btn.querySelector('i').classList.replace('fa-whatsapp', 'fa-circle-notch');
        btn.querySelector('i').classList.add('fa-spin');
        btn.style.opacity = '0.8';
        btn.style.pointerEvents = 'none';
        
        // Execute Redirect
        setTimeout(() => {
            window.location.href = `https://wa.me/${SysConfig.whatsapp}?text=${encodeURIComponent(msg)}`;
            
            setTimeout(() => {
                this.closeTrustModal();
                document.getElementById('final-btn-text').innerText = "Confirm & Proceed";
                btn.querySelector('i').classList.replace('fa-circle-notch', 'fa-whatsapp');
                btn.querySelector('i').classList.remove('fa-spin');
                btn.style.opacity = '1';
                btn.style.pointerEvents = 'auto';
            }, 2000);
        }, 1000);
    }
};

// Start System
document.addEventListener('DOMContentLoaded', () => FbApp.init());