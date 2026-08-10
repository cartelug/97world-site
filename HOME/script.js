/**
 * ACCESSUG - MASTER INTERACTIVE ENGINE (100% Optimized)
 * Location: HOME/script.js
 */

document.addEventListener('DOMContentLoaded', () => {

    // === 1. DYNAMIC SPOTLIGHT (GPU Accelerated) ===
    // transform-only updates (not left/top) so this stays on the compositor
    // thread and never forces a layout reflow on mousemove.
    const spotlight = document.getElementById('spotlight');
    if (window.matchMedia("(pointer: fine)").matches) {
        let spotlightRaf = null;
        window.addEventListener('mousemove', (e) => {
            if (spotlightRaf) return;
            spotlightRaf = requestAnimationFrame(() => {
                spotlight.style.transform = `translate3d(${e.clientX}px, ${e.clientY}px, 0) translate(-50%, -50%)`;
                spotlightRaf = null;
            });
        });
        document.addEventListener('mouseleave', () => spotlight.style.opacity = '0');
        document.addEventListener('mouseenter', () => spotlight.style.opacity = '1');
    } else {
        spotlight.style.display = 'none';
    }

    // === 1.5 HERO ROTATOR ("Get Followers. / A Website. / A System. ...") ===
    const rotator = document.getElementById('heroRotator');
    if (rotator && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        const words = ['Followers.', 'A Website.', 'A System.', 'Business Emails.', 'Social Management.', 'Fliers.'];
        let idx = 0;
        setInterval(() => {
            const current = rotator.querySelector('.rotator-word');
            if (!current) return;
            current.classList.remove('is-current');
            current.classList.add('is-leaving');
            idx = (idx + 1) % words.length;
            setTimeout(() => {
                current.remove();
                const next = document.createElement('span');
                next.className = 'rotator-word is-current';
                next.textContent = words[idx];
                rotator.appendChild(next);
            }, 350);
        }, 2600);
    }

    // === 2. PRECISION NAVBAR ===
    const navbar = document.getElementById('navbar');
    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
    }, { passive: true });

    // === 3. MASTER SCROLL ANIMATION ENGINE ===
    const observerOptions = { root: null, rootMargin: '0px 0px -10% 0px', threshold: 0 };
    
    const revealObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('is-visible');
                
                if (entry.target.querySelector('.anim-counter') && !entry.target.classList.contains('counted')) {
                    entry.target.classList.add('counted');
                    runCounters(entry.target);
                }
                
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);

    const animElements = document.querySelectorAll('.fade-up, .scale-in, .slide-in-right, .fade-in');
    animElements.forEach(el => revealObserver.observe(el));


    // === 4. VAULT APP-DOCK FILTER & SEARCH ENGINE ===
    const vaultTrack = document.getElementById('vault-track');
    const cards = document.querySelectorAll('.spatial-card');
    const filterPills = document.querySelectorAll('.dock-btn'); 
    const searchInput = document.getElementById('vault-search');

    // Function to apply filters and search simultaneously
    const applyFilters = () => {
        const activeFilter = document.querySelector('.dock-btn.active').getAttribute('data-filter');
        const searchTerm = searchInput.value.toLowerCase().trim();
        let firstMatch = null;

        cards.forEach(card => {
            const matchesCategory = activeFilter === 'all' || card.getAttribute('data-category') === activeFilter;
            const textContent = card.innerText.toLowerCase();
            const keywords = (card.getAttribute('data-keywords') || "").toLowerCase();
            const matchesSearch = searchTerm === "" || textContent.includes(searchTerm) || keywords.includes(searchTerm);

            if (matchesCategory && matchesSearch) {
                card.style.display = 'flex';
                // Trigger reflow to restart pill animations
                card.classList.remove('is-visible');
                void card.offsetWidth;
                card.classList.add('is-visible');
                if(!firstMatch) firstMatch = card;
            } else {
                card.style.display = 'none';
            }
        });

        if(firstMatch && vaultTrack) {
            vaultTrack.scrollTo({ left: 0, behavior: 'smooth' });
        }
    };

    // Filter Buttons
    if(filterPills.length > 0) {
        filterPills.forEach(pill => {
            pill.addEventListener('click', () => {
                filterPills.forEach(p => p.classList.remove('active'));
                pill.classList.add('active');
                applyFilters();
            });
        });
    }

    // Search Input Event
    if(searchInput) {
        searchInput.addEventListener('input', applyFilters);
    }

    // === 5. ZERO RISK STEPS - CINEMATIC SCROLL OBSERVER ===
    // This tracks the new step cards to trigger the scale/glow active state
    const stepCards = document.querySelectorAll('.step-observable');
    if (stepCards.length > 0) {
        const stepObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('is-active');
                } else {
                    // Optional: remove class when it leaves viewport to allow re-triggering
                    entry.target.classList.remove('is-active');
                }
            });
        }, { 
            // Trigger when the element crosses the middle 40% of the screen
            rootMargin: '-30% 0px -30% 0px', 
            threshold: 0.1 
        });

        stepCards.forEach(card => stepObserver.observe(card));
    }

    // === 6.5 AMBIENT GLOW PAUSE (perf) ===
    // premium-aurora / fluid-gradient / social-aura run a 25s/8s CSS animation
    // forever by default -- pause each one whenever its section scrolls out of
    // view so the compositor isn't repainting glows nobody can see.
    const ambientGlows = document.querySelectorAll('.premium-aurora, .fluid-gradient, .social-aura');
    if (ambientGlows.length > 0) {
        const glowObserver = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                entry.target.style.animationPlayState = entry.isIntersecting ? 'running' : 'paused';
            });
        }, { rootMargin: '200px 0px 200px 0px', threshold: 0 });
        ambientGlows.forEach((el) => glowObserver.observe(el));
    }

    // === 6. NUMBER COUNTER ENGINE ===
    const runCounters = (parentSection) => {
        const counters = parentSection.querySelectorAll('.anim-counter');
        counters.forEach(counter => {
            const target = +counter.getAttribute('data-target');
            let current = 0;
            const increment = target / 60;

            const update = () => {
                current += increment;
                if (current < target) {
                    counter.innerText = Math.ceil(current).toLocaleString();
                    requestAnimationFrame(update);
                } else {
                    counter.innerText = target.toLocaleString();
                }
            };
            update();
        });
    };

});