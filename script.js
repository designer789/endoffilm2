// Get progress bar element
const scrollProgress = document.querySelector('.scroll-progress-bar');

// Initialize Lenis smooth scroll
const lenis = new Lenis({
    duration: 1.2,
    easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)), // https://www.desmos.com/calculator/brs54l4xou
    direction: 'vertical',
    gestureDirection: 'vertical',
    smooth: true,
    mouseMultiplier: 1,
    smoothTouch: false,
    touchMultiplier: 2,
    infinite: false,
});

// Get scroll value
lenis.on('scroll', ({ scroll, limit, velocity, direction, progress }) => {
    updateScrollProgress(scroll, limit);
    updateHeaderOnScroll(scroll);
});

// Connect Lenis to RAF (request animation frame)
function raf(time) {
    lenis.raf(time);
    requestAnimationFrame(raf);
}

// Start animations
requestAnimationFrame(raf);

// Calculate scroll progress
function updateScrollProgress(scrollPosition, maxScroll) {
    const scrolled = (scrollPosition / maxScroll) * 100;
    document.querySelector('.scroll-progress-bar').style.transform = `translateX(${scrolled - 100}%)`;
}

// Handle header state on scroll
function updateHeaderOnScroll(scrollPosition) {
    const header = document.querySelector('header');
    if (scrollPosition > 50) {
        header.classList.add('scrolled');
    } else {
        header.classList.remove('scrolled');
    }
}

// Mobile menu
const mobileMenuBtn = document.querySelector('.mobile-menu-btn');
const navMenu = document.querySelector('.nav-menu');
const bodyElement = document.body;

// Check if hamburger menu should be displayed
function checkMenuDisplay() {
    if (window.innerWidth <= 1024) {
        mobileMenuBtn.style.display = 'block';
        bodyElement.classList.add('mobile-view');
        
        // If menu is already open, apply active class
        if (bodyElement.classList.contains('menu-open')) {
            navMenu.classList.add('active');
        } else {
            navMenu.classList.remove('active');
        }
    } else {
        mobileMenuBtn.style.display = 'none';
        bodyElement.classList.remove('mobile-view');
        navMenu.classList.remove('active');
    }
}

// Hamburger menu click event
mobileMenuBtn.addEventListener('click', () => {
    navMenu.classList.toggle('active');
    bodyElement.classList.toggle('menu-open');
    mobileMenuBtn.querySelector('i').classList.toggle('fa-bars');
    mobileMenuBtn.querySelector('i').classList.toggle('fa-times');
});

// Close menu when navigation links are clicked
document.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', () => {
        navMenu.classList.remove('active');
        bodyElement.classList.remove('menu-open');
        mobileMenuBtn.querySelector('i').classList.add('fa-bars');
        mobileMenuBtn.querySelector('i').classList.remove('fa-times');
    });
});

// Smooth scrolling
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            lenis.scrollTo(target, {
                offset: 0,
                duration: 1.2,
                easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t))
            });
        }
    });
});

// Initialize on page load
window.addEventListener('load', () => {
    checkMenuDisplay();
});

// Listen for window resize
window.addEventListener('resize', checkMenuDisplay); 