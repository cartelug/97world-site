/**
 * ==========================================================================
 * ACCESSUG INSTAGRAM ENGINE (V6 - FULL SYNC & SANITIZATION LOGIC)
 * ==========================================================================
 */

const AppConfig = {
    // ---> THE LIVE GOOGLE SHEETS WEB APP URL <---
    googleSheetUrl: 'https://script.google.com/macros/s/AKfycbzsER7toUR8OwPWPic7Oqbbjz-ew2pR_HJ4Um3V9o6eVmlf730ibwF7ELv6GCekmgl2aA/exec', 
    whatsappNumber: '256762193386',
    
    // Strict Pricing Arrays (Same constraints, adapted for IG context)
    prices: {
        'UGX': {
            followers: [ 
                { v: 1000, p: 75000 }, { v: 4000, p: 141000 }, 
                { v: 7000, p: 208000 }, { v: 10000, p: 250000 } 
            ],
            likes: [ 
                { v: 1000, p: 50000 }, { v: 4000, p: 83000 }, 
                { v: 7000, p: 116000 }, { v: 10000, p: 150000 } 
            ],
            rules: { floor: 50000, ceiling: 360000, symbol: 'UGX' }
        },
        'USD': {
            followers: [ 
                { v: 3000, p: 35 }, { v: 5000, p: 50 }, 
                { v: 8000, p: 75 }, { v: 10000, p: 100 } 
            ],
            likes: [ 
                { v: 2500, p: 35 }, { v: 5000, p: 50 }, 
                { v: 7500, p: 75 }, { v: 10000, p: 100 } 
            ],
            rules: { floor: 35, ceiling: 100, symbol: '$' }
        }
    }
};

const AppState = {
    country: 'UGX',
    countryCode: 'UG',
    folSelection: -1,   
    likSelection: -1,   
    videoSplits: 5,
    hasReferrer: false,
    isProcessing: false,
    finalMathematicalPrice: 0 
};

const InstaApp = {

    init() {
        const savedRegion = localStorage.getItem('accessug_loc_ig');
        const savedCode = localStorage.getItem('accessug_code_ig');
        
        if (savedRegion && savedCode) {
            this.setCountry(savedRegion, savedCode, false);
        } else {
            this.openCountryModal();
        }

        ['client-name', 'client-number', 'target-username', 'referrer-name'].forEach(id => {
            const el = document.getElementById(id);
            if(el) {
                el.addEventListener('keypress', (e) => {
                    if (e.key === 'Enter' && !AppState.isProcessing) this.processCheckout();
                });
            }
        });
    },

    openCountryModal() {
        document.getElementById('country-modal').setAttribute('aria-hidden', 'false');
    },

    setCountry(currency, code = 'UG', saveToMemory = true) {
        if(saveToMemory) {
            localStorage.setItem('accessug_loc_ig', currency);
            localStorage.setItem('accessug_code_ig', code);
        }
        AppState.country = currency;
        AppState.countryCode = code;
        
        document.getElementById('country-modal').setAttribute('aria-hidden', 'true');
        document.getElementById('ui-region-badge').innerText = currency;

        const phoneInput = document.getElementById('client-number');
        if (phoneInput) {
            if (code === 'UG') phoneInput.placeholder = "e.g. +256 700 000 000";
            else if (code === 'SS') phoneInput.placeholder = "e.g. +211 000 000 000";
            else if (code === 'CD') phoneInput.placeholder = "e.g. +243 000 000 000";
        }
        
        AppState.folSelection = 0;
        AppState.likSelection = -1;
        AppState.videoSplits = 5;
        
        this.renderBentoGrids();
        this.calculateMath();
    },

    renderBentoGrids() {
        const matrix = AppConfig.prices[AppState.country];
        const formatVol = (v) => v >= 1000 ? (v/1000) + 'k' : v;
        const formatPrice = (p) => AppState.country === 'USD' ? `$${p}` : `${p.toLocaleString()} UGX`;

        const gridFol = document.getElementById('grid-followers');
        gridFol.innerHTML = '';
        
        matrix.followers.forEach((tier, index) => {
            let activeClass = AppState.folSelection === index ? 'selected-purple' : '';
            gridFol.innerHTML += `
                <div class="pack-btn ${activeClass}" onclick="InstaApp.selectTier('fol', ${index})">
                    <span class="p-vol">${formatVol(tier.v)}</span>
                    <span class="p-price">${formatPrice(tier.p)}</span>
                </div>
            `;
        });
        
        let skipFolClass = AppState.folSelection === -1 ? 'selected-skip' : '';
        gridFol.innerHTML += `
            <div class="pack-btn skip-btn ${skipFolClass}" onclick="InstaApp.selectTier('fol', -1)" style="grid-column: span 2;">
                <span class="p-vol">I don't need Followers</span>
            </div>
        `;

        const gridLik = document.getElementById('grid-likes');
        gridLik.innerHTML = '';
        
        matrix.likes.forEach((tier, index) => {
            let activeClass = AppState.likSelection === index ? 'selected-pink' : '';
            let freeViews = formatVol(tier.v * 2);
            gridLik.innerHTML += `
                <div class="pack-btn ${activeClass}" onclick="InstaApp.selectTier('lik', ${index})">
                    <span class="p-vol">${formatVol(tier.v)}</span>
                    <span class="p-views">+ ${freeViews} Views</span>
                    <span class="p-price">${formatPrice(tier.p)}</span>
                </div>
            `;
        });

        let skipLikClass = AppState.likSelection === -1 ? 'selected-skip' : '';
        gridLik.innerHTML += `
            <div class="pack-btn skip-btn ${skipLikClass}" onclick="InstaApp.selectTier('lik', -1)" style="grid-column: span 2;">
                <span class="p-vol">I don't need Likes</span>
            </div>
        `;

        const splitterUI = document.getElementById('split-ui-box');
        if (AppState.likSelection > -1) {
            splitterUI.style.display = 'flex';
        } else {
            splitterUI.style.display = 'none';
        }
    },

    selectTier(type, index) {
        if (AppState.isProcessing) return;
        
        if (type === 'fol') AppState.folSelection = index;
        if (type === 'lik') AppState.likSelection = index;
        
        this.renderBentoGrids();
        this.calculateMath();
        this.triggerVibration();
    },

    adjustSplit(direction) {
        if (AppState.isProcessing) return;
        
        AppState.videoSplits += direction;
        if (AppState.videoSplits < 1) AppState.videoSplits = 1;
        if (AppState.videoSplits > 10) AppState.videoSplits = 10;
        
        document.getElementById('split-counter-ui').innerText = AppState.videoSplits;
        this.calculateMath();
        this.triggerVibration();
    },

    toggleReferrer(hasFriend) {
        if (AppState.isProcessing) return;
        AppState.hasReferrer = hasFriend;
        
        const btnNo = document.getElementById('ref-no');
        const btnYes = document.getElementById('ref-yes');
        const drawer = document.getElementById('referrer-drawer');
        
        if (hasFriend) {
            btnNo.classList.remove('active');
            btnYes.classList.add('active');
            drawer.classList.add('is-open');
            setTimeout(() => document.getElementById('referrer-name').focus(), 250);
        } else {
            btnYes.classList.remove('active');
            btnNo.classList.add('active');
            drawer.classList.remove('is-open');
            document.getElementById('referrer-name').value = ''; 
        }
    },

    triggerVibration() {
        if (navigator.vibrate) navigator.vibrate(10);
    },

    calculateMath() {
        const matrix = AppConfig.prices[AppState.country];
        let runningTotal = 0;
        let activeCategories = 0;

        if (AppState.folSelection > -1) {
            runningTotal += matrix.followers[AppState.folSelection].p;
            activeCategories++;
        }
        
        if (AppState.likSelection > -1) {
            const likObj = matrix.likes[AppState.likSelection];
            runningTotal += likObj.p;
            activeCategories++;
            
            const likesPerPost = Math.floor(likObj.v / AppState.videoSplits);
            document.getElementById('split-math-output').innerText = `~${likesPerPost.toLocaleString()} Likes per post/reel`;
        }

        let finalPrice = runningTotal;
        
        const tagCombo = document.getElementById('ui-badge-combo');
        const tagMax = document.getElementById('ui-badge-max');
        const textStrike = document.getElementById('ui-strike-price');

        tagCombo.style.display = 'none';
        tagMax.style.display = 'none';
        textStrike.innerText = '';

        if (activeCategories === 2 && runningTotal > 0) {
            finalPrice = runningTotal * 0.90;
            tagCombo.style.display = 'flex';
            textStrike.innerText = AppState.country === 'USD' ? `$${runningTotal}` : runningTotal.toLocaleString();
        }

        if (activeCategories > 0) {
            if (finalPrice < matrix.rules.floor) finalPrice = matrix.rules.floor;
            if (finalPrice >= matrix.rules.ceiling) {
                finalPrice = matrix.rules.ceiling;
                tagCombo.style.display = 'none'; 
                tagMax.style.display = 'flex';
                textStrike.innerText = ''; 
            }
        } else {
            finalPrice = 0;
        }

        if (AppState.country === 'USD') {
            document.getElementById('ui-final-price').innerText = `$${finalPrice}`;
            document.getElementById('ui-final-curr').innerText = '';
        } else {
            document.getElementById('ui-final-price').innerText = finalPrice.toLocaleString();
            document.getElementById('ui-final-curr').innerText = 'UGX';
        }
        
        AppState.finalMathematicalPrice = finalPrice;
    },

    async processCheckout() {
        if (AppState.isProcessing) return;

        if (AppState.folSelection === -1 && AppState.likSelection === -1) {
            this.showToast("Please select a Follower or Like package.", "error");
            return;
        }

        const clientName = document.getElementById('client-name').value.trim();
        if (!clientName) {
            this.showToast("Please enter your Full Name.", "error");
            document.getElementById('client-name').focus();
            return;
        }

        const rawNumber = document.getElementById('client-number').value.trim();
        if (rawNumber.length < 8) {
            this.showToast("Please enter a valid WhatsApp Number.", "error");
            document.getElementById('client-number').focus();
            return;
        }

        const clientUsername = document.getElementById('target-username').value.trim();
        if (!clientUsername) {
            this.showToast("Please enter your Instagram Username.", "error");
            document.getElementById('target-username').focus();
            return;
        }

        const cleanNumber = rawNumber.replace(/\D/g, ''); 
        const sheetNumber = "'" + cleanNumber; 

        let referrerText = "Direct";
        if (AppState.hasReferrer) {
            const inputVal = document.getElementById('referrer-name').value.trim();
            if (inputVal) referrerText = inputVal;
        }

        this.setLoading(true);

        const matrix = AppConfig.prices[AppState.country];
        let sheetPackageStr = "";
        let waPackageStr = "";
        
        if (AppState.folSelection > -1) {
            let folVol = matrix.followers[AppState.folSelection].v;
            sheetPackageStr += `${folVol} Followers. `;
            waPackageStr += `🚀 *Followers:* ${folVol.toLocaleString()}\n`;
        }
        
        if (AppState.likSelection > -1) {
            let likVol = matrix.likes[AppState.likSelection].v;
            let freeViews = likVol * 2;
            let splits = AppState.videoSplits;
            sheetPackageStr += `${likVol} Likes (Split ${splits}) + ${freeViews} Views.`;
            waPackageStr += `❤️ *Likes:* ${likVol.toLocaleString()} (Across ${splits} posts)\n`;
            waPackageStr += `👁️ *Free Views:* ${freeViews.toLocaleString()}\n`;
        }
        
        sheetPackageStr += ` [Target: ${clientUsername}]`;

        const formData = new URLSearchParams();
        formData.append('ClientName', clientName);
        formData.append('Number', sheetNumber);
        formData.append('Service', `Instagram Boost [${AppState.country}]`);
        formData.append('Package', sheetPackageStr.trim());
        formData.append('Price', AppState.finalMathematicalPrice.toString()); 
        formData.append('Referrer', referrerText);

        try {
            await fetch(AppConfig.googleSheetUrl, { 
                method: 'POST', 
                body: formData, 
                mode: 'no-cors' 
            });
        } catch (e) { 
            console.log("Sheet sync bypassed, proceeding to WhatsApp."); 
        }

        const waTotalDisplay = AppState.country === 'USD' ? `$${AppState.finalMathematicalPrice}` : `${AppState.finalMathematicalPrice.toLocaleString()} UGX`;
        
        let message = `*NEW INSTAGRAM ORDER [${clientUsername.toUpperCase()}]*\n\n`;
        message += `*Service:* Instagram Boost\n`;
        message += `*Client Name:* ${clientName}\n`;
        message += `*WhatsApp:* ${cleanNumber}\n`;
        message += `*Package:* \n${waPackageStr}\n`;
        message += `*Price:* ${waTotalDisplay}\n`;
        message += `*Referrer:* ${referrerText}\n`;
        message += `*Username:* ${clientUsername}`;

        window.location.href = `https://wa.me/${AppConfig.whatsappNumber}?text=${encodeURIComponent(message)}`;
        
        setTimeout(() => this.setLoading(false), 5000);
    },

    setLoading(isLoading) {
        AppState.isProcessing = isLoading;
        const btnNode = document.getElementById('btn-submit');
        const btnText = document.getElementById('btn-text');
        const btnIcon = document.getElementById('btn-icon');
        const btnSpinner = document.getElementById('btn-spinner');

        if (isLoading) {
            btnNode.disabled = true;
            btnText.innerText = "Securing Order...";
            btnIcon.style.display = 'none';
            btnSpinner.style.display = 'block';
        } else {
            btnNode.disabled = false;
            btnText.innerText = "Place Order";
            btnIcon.style.display = 'inline-block';
            btnSpinner.style.display = 'none';
        }
    },

    showToast(message, type = 'error') {
        const wrapper = document.getElementById('toast-wrapper');
        const toast = document.createElement('div');
        toast.className = `toast-msg ${type}-toast`;
        
        const iconClass = type === 'error' ? 'fa-exclamation-circle' : 'fa-check-circle';
        toast.innerHTML = `<i class="fas ${iconClass}"></i> <span>${message}</span>`;
        
        wrapper.appendChild(toast);
        this.triggerVibration();

        setTimeout(() => {
            toast.classList.add('fade-out');
            toast.addEventListener('animationend', () => toast.remove());
        }, 3500);
    }
};

InstaApp.init();