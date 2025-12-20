/**
 * DUODRIVEN GSAP Animations
 * Scroll-triggered animations and interactions
 */

// Wait for GSAP to load
function initAnimations() {
    if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') {
        console.warn('GSAP or ScrollTrigger not loaded');
        return;
    }
    
    // Register ScrollTrigger
    gsap.registerPlugin(ScrollTrigger);
    
    // Check for reduced motion preference
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    
    if (prefersReducedMotion) {
        // Show all elements without animation
        document.querySelectorAll('.reveal, .reveal-left, .reveal-right, .reveal-scale').forEach(el => {
            el.classList.add('revealed');
        });
        return;
    }
    
    // ============================================
    // REVEAL ANIMATIONS
    // ============================================
    
    // Basic reveal (fade up)
    gsap.utils.toArray('.reveal').forEach((elem) => {
        gsap.fromTo(elem, 
            {
                opacity: 0,
                y: 30
            },
            {
                opacity: 1,
                y: 0,
                duration: 0.8,
                ease: 'power3.out',
                scrollTrigger: {
                    trigger: elem,
                    start: 'top 85%',
                    toggleActions: 'play none none none'
                }
            }
        );
    });
    
    // Reveal from left
    gsap.utils.toArray('.reveal-left').forEach((elem) => {
        gsap.fromTo(elem,
            {
                opacity: 0,
                x: -50
            },
            {
                opacity: 1,
                x: 0,
                duration: 0.8,
                ease: 'power3.out',
                scrollTrigger: {
                    trigger: elem,
                    start: 'top 85%',
                    toggleActions: 'play none none none'
                }
            }
        );
    });
    
    // Reveal from right
    gsap.utils.toArray('.reveal-right').forEach((elem) => {
        gsap.fromTo(elem,
            {
                opacity: 0,
                x: 50
            },
            {
                opacity: 1,
                x: 0,
                duration: 0.8,
                ease: 'power3.out',
                scrollTrigger: {
                    trigger: elem,
                    start: 'top 85%',
                    toggleActions: 'play none none none'
                }
            }
        );
    });
    
    // Scale reveal
    gsap.utils.toArray('.reveal-scale').forEach((elem) => {
        gsap.fromTo(elem,
            {
                opacity: 0,
                scale: 0.95
            },
            {
                opacity: 1,
                scale: 1,
                duration: 0.8,
                ease: 'power3.out',
                scrollTrigger: {
                    trigger: elem,
                    start: 'top 85%',
                    toggleActions: 'play none none none'
                }
            }
        );
    });
    
    // ============================================
    // SERVICE CARDS STAGGER
    // ============================================
    
    const serviceCards = document.querySelectorAll('.service-card');
    if (serviceCards.length > 0) {
        gsap.fromTo(serviceCards,
            {
                opacity: 0,
                y: 50
            },
            {
                opacity: 1,
                y: 0,
                duration: 0.8,
                stagger: 0.2,
                ease: 'power3.out',
                scrollTrigger: {
                    trigger: '#services',
                    start: 'top 70%',
                    toggleActions: 'play none none none'
                }
            }
        );
    }
    
    // ============================================
    // COUNTER ANIMATIONS
    // ============================================
    
    const counters = document.querySelectorAll('.counter');
    counters.forEach((counter) => {
        const target = parseInt(counter.dataset.target) || 0;
        
        ScrollTrigger.create({
            trigger: counter,
            start: 'top 80%',
            onEnter: () => {
                gsap.to(counter, {
                    textContent: target,
                    duration: 2,
                    ease: 'power2.out',
                    snap: { textContent: 1 },
                    onUpdate: function() {
                        counter.textContent = Math.round(this.targets()[0].textContent);
                    }
                });
            },
            once: true
        });
    });
    
    // ============================================
    // HERO ANIMATIONS
    // ============================================
    
    const heroTimeline = gsap.timeline({ delay: 0.3 });
    
    heroTimeline
        .fromTo('.hero .badge',
            { opacity: 0, y: 20 },
            { opacity: 1, y: 0, duration: 0.6, ease: 'power3.out' }
        )
        .fromTo('.hero h1',
            { opacity: 0, y: 30 },
            { opacity: 1, y: 0, duration: 0.8, ease: 'power3.out' },
            '-=0.3'
        )
        .fromTo('.hero p',
            { opacity: 0, y: 20 },
            { opacity: 1, y: 0, duration: 0.6, ease: 'power3.out' },
            '-=0.4'
        )
        .fromTo('.hero .btn',
            { opacity: 0, y: 20 },
            { opacity: 1, y: 0, duration: 0.6, stagger: 0.15, ease: 'power3.out' },
            '-=0.3'
        );
    
    // ============================================
    // COMPARISON CARDS
    // ============================================
    
    const comparisonCards = document.querySelectorAll('.comparison-card');
    if (comparisonCards.length > 0) {
        gsap.fromTo('.comparison-card.old',
            { opacity: 0, x: -50 },
            {
                opacity: 1,
                x: 0,
                duration: 0.8,
                ease: 'power3.out',
                scrollTrigger: {
                    trigger: '#problem-solution',
                    start: 'top 70%',
                    toggleActions: 'play none none none'
                }
            }
        );
        
        gsap.fromTo('.comparison-card.new',
            { opacity: 0, x: 50 },
            {
                opacity: 1,
                x: 0,
                duration: 0.8,
                ease: 'power3.out',
                scrollTrigger: {
                    trigger: '#problem-solution',
                    start: 'top 70%',
                    toggleActions: 'play none none none'
                }
            }
        );
    }
    
    // ============================================
    // NAV SCROLL EFFECT
    // ============================================
    
    const nav = document.getElementById('mainNav');
    if (nav) {
        ScrollTrigger.create({
            start: 'top -50',
            onUpdate: (self) => {
                if (self.scroll() > 50) {
                    nav.classList.add('scrolled');
                } else {
                    nav.classList.remove('scrolled');
                }
            }
        });
    }
    
    // ============================================
    // PARALLAX EFFECTS
    // ============================================
    
    const heroSection = document.querySelector('.hero');
    if (heroSection) {
        gsap.to('.hero .container', {
            yPercent: 30,
            ease: 'none',
            scrollTrigger: {
                trigger: '.hero',
                start: 'top top',
                end: 'bottom top',
                scrub: true
            }
        });
    }
    
    // ============================================
    // GRADIENT TEXT ANIMATION
    // ============================================
    
    const gradientTexts = document.querySelectorAll('.gradient-text-animated');
    gradientTexts.forEach((text) => {
        gsap.to(text, {
            backgroundPosition: '200% center',
            duration: 3,
            ease: 'none',
            repeat: -1
        });
    });
}

// ============================================
// HOVER ANIMATIONS
// ============================================

function initHoverAnimations() {
    if (typeof gsap === 'undefined') return;
    
    // Card hover effects
    const cards = document.querySelectorAll('.card, .service-card');
    cards.forEach((card) => {
        card.addEventListener('mouseenter', () => {
            gsap.to(card, {
                y: -5,
                duration: 0.3,
                ease: 'power2.out'
            });
        });
        
        card.addEventListener('mouseleave', () => {
            gsap.to(card, {
                y: 0,
                duration: 0.3,
                ease: 'power2.out'
            });
        });
    });
    
    // Button magnetic effect (subtle)
    const buttons = document.querySelectorAll('.btn-primary');
    buttons.forEach((btn) => {
        btn.addEventListener('mousemove', (e) => {
            const rect = btn.getBoundingClientRect();
            const x = e.clientX - rect.left - rect.width / 2;
            const y = e.clientY - rect.top - rect.height / 2;
            
            gsap.to(btn, {
                x: x * 0.1,
                y: y * 0.1,
                duration: 0.3,
                ease: 'power2.out'
            });
        });
        
        btn.addEventListener('mouseleave', () => {
            gsap.to(btn, {
                x: 0,
                y: 0,
                duration: 0.3,
                ease: 'power2.out'
            });
        });
    });
}

// ============================================
// TAB SWITCHING ANIMATION
// ============================================

function switchTab(tabId) {
    if (typeof gsap === 'undefined') {
        // Fallback without GSAP
        document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
        document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
        document.querySelector(`[data-tab="${tabId}"]`)?.classList.add('active');
        document.getElementById(`panel-${tabId}`)?.classList.add('active');
        return;
    }
    
    // Update tab buttons
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    document.querySelector(`[data-tab="${tabId}"]`)?.classList.add('active');
    
    // Animate panel transition
    const currentPanel = document.querySelector('.tab-panel.active');
    const newPanel = document.getElementById(`panel-${tabId}`);
    
    if (currentPanel && newPanel && currentPanel !== newPanel) {
        gsap.to(currentPanel, {
            opacity: 0,
            y: 10,
            duration: 0.2,
            ease: 'power2.in',
            onComplete: () => {
                currentPanel.classList.remove('active');
                newPanel.classList.add('active');
                gsap.fromTo(newPanel,
                    { opacity: 0, y: 10 },
                    { opacity: 1, y: 0, duration: 0.3, ease: 'power2.out' }
                );
            }
        });
    } else if (newPanel) {
        document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
        newPanel.classList.add('active');
    }
}

// ============================================
// SERVICE CARD EXPAND
// ============================================

function toggleServiceCard(card) {
    const isExpanded = card.classList.contains('expanded');
    
    // Close all other cards
    document.querySelectorAll('.service-card.expanded').forEach(c => {
        if (c !== card) {
            c.classList.remove('expanded');
        }
    });
    
    // Toggle current card
    card.classList.toggle('expanded');
    
    // Animate with GSAP if available
    if (typeof gsap !== 'undefined') {
        const details = card.querySelector('.details');
        if (details) {
            if (!isExpanded) {
                gsap.fromTo(details,
                    { height: 0, opacity: 0 },
                    { height: 'auto', opacity: 1, duration: 0.4, ease: 'power2.out' }
                );
            }
        }
    }
}

// ============================================
// INITIALIZATION
// ============================================

document.addEventListener('DOMContentLoaded', () => {
    initAnimations();
    initHoverAnimations();
});

// Re-init on page visibility change (for SPA-like behavior)
document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
        ScrollTrigger?.refresh();
    }
});

// Export functions
window.switchTab = switchTab;
window.toggleServiceCard = toggleServiceCard;
