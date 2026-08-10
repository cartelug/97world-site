let currentPlan = null;
let platformChoice = null;

function selectPlan(cardElement, planName, stats, likes, price) {
    // 1. Visual selection
    document.querySelectorAll('.plan-card').forEach(c => c.classList.remove('selected'));
    cardElement.classList.add('selected');

    // 2. Store data
    // Parse stats for splitting later (Simple regex or just string storage)
    let coreFollowers = "0";
    let bonusFollowers = "1,000"; 
    
    if(planName.includes("VVIP")) coreFollowers = "10,000";
    if(planName.includes("Starter")) coreFollowers = "6,000";
    if(planName.includes("Creator")) coreFollowers = "4,000";

    currentPlan = { name: planName, stats: stats, likes: likes, price: price, core: coreFollowers, bonus: bonusFollowers };

    // 3. Update Summary
    document.getElementById('sum-plan').textContent = planName + " ($" + price + ")";
    document.getElementById('sum-total').textContent = "$" + price + " USD";

    // 4. Enable button
    const btn = document.getElementById('btn-step-1');
    btn.classList.remove('disabled');
    
    // 5. Smart Scroll
    setTimeout(() => {
        btn.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 350);
}

function selectPlatform(cardElement, choice) {
    // 1. Visual selection
    document.querySelectorAll('.plat-card').forEach(c => c.classList.remove('selected'));
    cardElement.classList.add('selected');

    // 2. Store choice
    platformChoice = choice;
    document.getElementById('sum-plat').textContent = choice;

    // 3. Update Info Note based on logic
    const infoBox = document.getElementById('split-info');
    if (choice === 'Ultimate Mix') {
        infoBox.innerHTML = `<i class="fas fa-random"></i> <b>Split:</b> ${currentPlan.core} on TikTok + ${currentPlan.bonus} on Instagram.`;
    } else if (choice === 'Instagram Only') {
        infoBox.innerHTML = `<i class="fab fa-instagram"></i> <b>Total:</b> ${currentPlan.core.replace(',','').replace('000','K')} + 1K Bonus all on Instagram.`;
    } else {
        infoBox.innerHTML = `<i class="fab fa-tiktok"></i> <b>Total:</b> ${currentPlan.core.replace(',','').replace('000','K')} + 1K Bonus all on TikTok.`;
    }

    // 4. Enable Button
    const btn = document.getElementById('btn-step-2');
    btn.classList.remove('disabled');
    
    // 5. Smart Scroll
    setTimeout(() => {
        btn.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 350);
}

function goToStep(stepNumber) {
    // Hide all steps
    document.querySelectorAll('.wizard-step').forEach(s => s.classList.remove('active-step'));
    
    // Show target step
    document.getElementById('step-' + stepNumber).classList.add('active-step');
    
    // Update progress
    document.querySelectorAll('.step').forEach(s => {
        if(parseInt(s.dataset.step) <= stepNumber) {
            s.classList.add('active');
        } else {
            s.classList.remove('active');
        }
    });

    document.querySelector('.wizard-card').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function validateAndSend() {
    const handle = document.getElementById('socialHandle').value.trim();
    const name = document.getElementById('clientName').value.trim();
    const payment = document.getElementById('paymentMethod').value;

    if (!handle || !name) {
        alert("Please enter your Social Handle and Name.");
        return false;
    }

    // LOGIC: Determine exact text description
    let details = "";
    if (platformChoice === 'Ultimate Mix') {
        details = `${currentPlan.core} on TikTok + ${currentPlan.bonus} on Instagram`;
    } else {
        // e.g. 11,000 Followers on Instagram Only
        const total = parseInt(currentPlan.core.replace(',','')) + 1000;
        details = `${total.toLocaleString()} Followers on ${platformChoice}`;
    }

    // GENERATE EXACT WHATSAPP MESSAGE FORMAT
    const phone = "256762193386";
    
    let message = `Order for Cartelug:\n\n`;
    message += `*Service:* Viral Boost Package\n`;
    message += `*Level:* ${currentPlan.name} ($${currentPlan.price})\n`;
    message += `*Target:* ${platformChoice}\n`;
    message += `*Details:* ${details}\n`;
    message += `*Likes:* ${currentPlan.likes} (Included)\n`;
    message += `*Handle:* ${handle}\n`;
    message += `*Name:* ${name}\n`;
    message += `*Payment:* ${payment}`;

    const url = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
    
    window.location.href = url;
    return false;
}