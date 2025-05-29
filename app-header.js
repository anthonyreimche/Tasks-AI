/**
 * Collapsible Header
 * Handles the header visibility based on scroll direction
 * Similar to Gmail mobile behavior
 */

// Variables to track scroll position
let lastScrollTop = 0;
let scrollThreshold = 10; // Minimum scroll amount before toggling header
let headerVisible = true;
let scrollTimer = null;

// Get the header element
const header = document.querySelector('.app-header');

// Function to handle scroll events
function handleScroll() {
    // Don't process scroll events if a modal is open
    if (document.querySelector('.modal.active')) {
        return;
    }
    
    const currentScrollTop = window.pageYOffset || document.documentElement.scrollTop;
    
    // Check if we've scrolled enough to trigger a change
    if (Math.abs(currentScrollTop - lastScrollTop) < scrollThreshold) {
        return;
    }
    
    // Scrolling down and header is visible
    if (currentScrollTop > lastScrollTop && headerVisible && currentScrollTop > 60) {
        header.classList.add('header-hidden');
        headerVisible = false;
    } 
    // Scrolling up and header is hidden
    else if (currentScrollTop < lastScrollTop && !headerVisible) {
        header.classList.remove('header-hidden');
        headerVisible = true;
    }
    
    // Update last scroll position
    lastScrollTop = currentScrollTop;
    
    // Clear any existing timer
    if (scrollTimer) {
        clearTimeout(scrollTimer);
    }
    
    // Set a timer to show the header after scrolling stops
    scrollTimer = setTimeout(() => {
        if (!headerVisible) {
            header.classList.remove('header-hidden');
            headerVisible = true;
        }
    }, 3000); // Show header after 3 seconds of inactivity
}

// Add scroll event listener
window.addEventListener('scroll', handleScroll, { passive: true });

// Show header when user taps near the top of the screen
document.addEventListener('touchstart', (e) => {
    // If touch is in the top 40px of the screen
    if (e.touches[0].clientY < 40 && !headerVisible) {
        header.classList.remove('header-hidden');
        headerVisible = true;
    }
});

// Initialize header state
document.addEventListener('DOMContentLoaded', () => {
    // Ensure header is visible on page load
    header.classList.remove('header-hidden');
    headerVisible = true;
    
    // Set initial scroll position
    lastScrollTop = window.pageYOffset || document.documentElement.scrollTop;
});
