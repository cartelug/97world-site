document.addEventListener('DOMContentLoaded', () => {
    
    // --- 1. WIZARD LOGIC ---
    window.nextCard = function(cardNumber) {
        // Mark current active card as completed (slide out left)
        const current = document.querySelector('.truth-card.active');
        if(current) {
            current.classList.remove('active');
            current.classList.add('completed');
        }

        // Activate next card (slide in from right)
        const next = document.getElementById(`card-${cardNumber}`);
        if(next) {
            next.classList.add('active');
        }
    };

    window.revealProof = function() {
        // 1. Hide the wizard completely or mark final card done
        const current = document.querySelector('.truth-card.active');
        if(current) {
            current.innerHTML = '<div class="icon-ring" style="background:var(--primary); color:#000"><i class="fas fa-check"></i></div><h3>Verified.</h3><p>Welcome to the honest side of the internet.</p>';
        }

        // 2. Reveal the hidden sections with a smooth fade
        const sections = document.querySelectorAll('.hidden-section');
        sections.forEach(sec => {
            sec.classList.add('section-visible');
            // Scroll to the first revealed section smoothly
            if(sec.id === 'proof-vault') {
                setTimeout(() => {
                    sec.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }, 500);
            }
        });
    };

    // --- 2. CAROUSEL LOGIC ---
    const track = document.getElementById('track');
    const prevBtn = document.querySelector('.prev-btn');
    const nextBtn = document.querySelector('.next-btn');

    if (track && prevBtn && nextBtn) {
        nextBtn.addEventListener('click', () => {
            track.scrollBy({ left: track.clientWidth, behavior: 'smooth' });
        });
        prevBtn.addEventListener('click', () => {
            track.scrollBy({ left: -track.clientWidth, behavior: 'smooth' });
        });
    }

    // --- 3. IMAGE ERROR HANDLING ---
    const images = document.querySelectorAll('.slide img');
    images.forEach(img => {
        img.addEventListener('error', function() {
            this.parentElement.style.display = 'none';
        });
    });
});