// App data structure
let appData = {
    tasks: [],
    groceries: [],
    projects: [],
    passwords: [],
    taskPatterns: {},
    taskDurations: {},
    suggestions: [],
    dismissedSuggestions: {}, // Track dismissed suggestions by task ID
    theme: 'light'
};

// Load data from storage
function loadData() {
    const savedData = localStorage.getItem('appData');
    if (savedData) {
        appData = JSON.parse(savedData);
        
        // Ensure all required properties exist
        if (!appData.taskPatterns) appData.taskPatterns = {};
        if (!appData.taskDurations) appData.taskDurations = {};
        if (!appData.suggestions) appData.suggestions = [];
        if (!appData.dismissedSuggestions) appData.dismissedSuggestions = {};
        if (!appData.theme) appData.theme = 'light';
    } else {
        initializeSampleData();
    }
    
    applyTheme();
}

// Save data to storage
function saveData() {
    localStorage.setItem('appData', JSON.stringify(appData));
    showSyncStatus('Saved', true);
}

// Initialize sample data
function initializeSampleData() {
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    appData = {
        tasks: [
            {
                id: 1,
                title: 'Complete project proposal',
                dueDate: tomorrow.toISOString(),
                hasTime: true,
                category: 'Work',
                repeat: 'never',
                completed: false,
                createdAt: now.toISOString(),
                order: 0
            },
            {
                id: 2,
                title: 'Buy groceries',
                dueDate: now.toISOString(),
                hasTime: false,
                category: 'Shopping',
                repeat: 'weekly',
                completed: false,
                createdAt: now.toISOString(),
                order: 1
            },
            {
                id: 3,
                title: 'Call doctor',
                dueDate: tomorrow.toISOString(),
                hasTime: true,
                category: 'Health',
                repeat: 'never',
                completed: false,
                createdAt: now.toISOString(),
                order: 2
            }
        ],
        groceries: [
            {
                id: 1,
                name: 'Milk',
                expiryDate: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString(),
                quantity: '1 gallon',
                inStock: true,
                addedToList: false
            },
            {
                id: 2,
                name: 'Eggs',
                expiryDate: new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000).toISOString(),
                quantity: '12',
                inStock: true,
                addedToList: false
            },
            {
                id: 3,
                name: 'Bread',
                expiryDate: new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000).toISOString(),
                quantity: '1 loaf',
                inStock: false,
                addedToList: true
            }
        ],
        projects: [
            {
                id: 1,
                title: 'Website Redesign',
                deadline: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString(),
                progress: 30,
                milestones: [
                    { id: 1, title: 'Wireframes', completed: true, date: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000).toISOString() },
                    { id: 2, title: 'Design mockups', completed: false, date: new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000).toISOString() },
                    { id: 3, title: 'Development', completed: false, date: new Date(now.getTime() + 20 * 24 * 60 * 60 * 1000).toISOString() }
                ]
            }
        ],
        passwords: [
            {
                id: 1,
                service: 'Email',
                username: 'user@example.com',
                value: btoa('password123'), // Simple obfuscation
                notes: 'Personal email account',
                createdAt: now.toISOString()
            }
        ],
        taskPatterns: {},
        taskDurations: {},
        suggestions: [],
        dismissedSuggestions: {},
        theme: 'light'
    };
    
    saveData();
}

// Tab switching
function switchTab(tabName) {
    // Hide all tabs
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.classList.remove('active');
    });
    
    // Show selected tab
    document.getElementById(tabName + '-content').classList.add('active');
    
    // Update active tab indicator
    document.querySelectorAll('.tab').forEach(tab => {
        tab.classList.remove('active');
    });
    document.querySelector(`.tab[data-tab="${tabName}"]`).classList.add('active');
    
    // Save the active tab to localStorage
    localStorage.setItem('activeTab', tabName);
    
    // Update FAB based on current tab
    updateFAB(tabName);
    
    // Render current tab
    renderCurrentTab();
}

// Update FAB based on current tab
function updateFAB(tabName) {
    // Find the FAB in the current tab content
    const tabContent = document.getElementById(tabName + '-content');
    if (!tabContent) return;
    
    const fab = tabContent.querySelector('.fab');
    if (!fab) return;
    
    // FAB is already configured in HTML with the correct onclick handlers
    fab.style.display = 'flex';
}

// Render current tab
function renderCurrentTab() {
    const activeTab = document.querySelector('.tab.active').dataset.tab;
    
    // Render AI suggestions for the appropriate tab
    if (activeTab === 'tasks') {
        // Render task suggestions
        const suggestionsContainer = document.getElementById('ai-suggestions-container');
        renderAISuggestions(suggestionsContainer);
    } else if (activeTab === 'grocery') {
        // Render grocery suggestions
        const grocerySuggestionsContainer = document.getElementById('grocery-ai-suggestions-container');
        renderGroceryAISuggestions(grocerySuggestionsContainer);
    }
    
    // Render the main content for each tab
    switch (activeTab) {
        case 'tasks':
            renderTasks();
            break;
        case 'grocery':
            renderGrocery();
            break;
        case 'projects':
            renderProjects();
            break;
        case 'passwords':
            renderPasswords();
            break;
        case 'insights':
            renderInsights();
            break;
    }
}

// Utility functions
// Generate a unique ID for new items
function generateUniqueId() {
    return Date.now().toString(36) + Math.random().toString(36).substring(2, 9);
}

function formatDate(dateString) {
    if (!dateString) return 'No date';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function formatDateTime(dateString) {
    const date = new Date(dateString);
    const today = new Date();
    const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000);
    
    let dateStr = '';
    if (date.toDateString() === today.toDateString()) {
        dateStr = 'Today';
    } else if (date.toDateString() === tomorrow.toDateString()) {
        dateStr = 'Tomorrow';
    } else {
        dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
    
    // Always show time for tasks
    const timeStr = date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
    return `${dateStr} at ${timeStr}`;
}

function getDaysUntilExpiry(expiryDate) {
    const now = new Date();
    const expiry = new Date(expiryDate);
    const diffTime = expiry - now;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
}

function expiringItemsCount() {
    return appData.groceries.filter(item => 
        item.inStock && 
        item.expiryDate && 
        getDaysUntilExpiry(item.expiryDate) <= 3
    ).length;
}

function showSyncStatus(message = 'Saving...', success = false) {
    const statusEl = document.getElementById('sync-status');
    statusEl.textContent = message;
    statusEl.classList.add('active');
    
    if (success) {
        statusEl.classList.add('success');
    } else {
        statusEl.classList.remove('success');
    }
    
    setTimeout(() => {
        statusEl.classList.remove('active');
    }, 2000);
}

// Theme functions
function openThemeModal() {
    document.getElementById('theme-modal').classList.add('active');
    updateThemeSelection();
}

function setTheme(theme) {
    // Store the previous theme to remove it
    const previousTheme = appData.theme;
    
    // Update the theme in appData
    appData.theme = theme;
    saveData();
    
    // Apply the new theme
    applyTheme();
    
    // Close the theme modal
    closeModal('theme-modal');
    
    console.log(`Theme changed from ${previousTheme} to ${theme}`);
}

function applyTheme() {
    // Remove all theme classes
    document.body.classList.remove('dark-theme', 'purple-theme', 'ocean-theme');
    
    // Apply the selected theme if it's not light
    if (appData.theme !== 'light') {
        document.body.classList.add(`${appData.theme}-theme`);
    }
    
    // Save the theme preference to localStorage for persistence
    localStorage.setItem('appTheme', appData.theme);
    
    // Update the theme selection in the theme modal
    updateThemeSelection();
    
    console.log('Applied theme:', appData.theme);
}

function updateThemeSelection() {
    const themeOptions = document.querySelectorAll('.theme-option');
    themeOptions.forEach((option, index) => {
        option.classList.remove('selected');
        if (index === getThemeIndex(appData.theme)) {
            option.classList.add('selected');
        }
    });
}

function getThemeIndex(theme) {
    const themes = ['light', 'dark', 'purple', 'ocean'];
    return themes.indexOf(theme);
}

// Modal functions
function openModal(modalId) {
    console.log(`Opening modal: ${modalId}`);
    const modal = document.getElementById(modalId);
    if (modal) {
        // Create backdrop if it doesn't exist
        let backdrop = document.querySelector('.modal-backdrop');
        if (!backdrop) {
            backdrop = document.createElement('div');
            backdrop.className = 'modal-backdrop';
            document.body.appendChild(backdrop);
        }
        
        // Reset any previous transitions and ensure display is set before adding active class
        modal.style.display = 'flex';
        
        // Force a reflow to ensure the browser processes the display change
        void modal.offsetWidth;
        
        // Now add the active class to trigger the transition
        modal.classList.add('active');
        
        // Focus on first input if present
        setTimeout(() => {
            const firstInput = modal.querySelector('input, textarea, select');
            if (firstInput) {
                firstInput.focus();
            }
        }, 100);
    } else {
        console.error(`Modal with ID '${modalId}' not found`);
    }
}

function openAddTaskModal() {
    document.getElementById('add-task-form').reset();
    openModal('add-task-modal');
}

function openAddGroceryModal() {
    document.getElementById('add-grocery-form').reset();
    openModal('add-grocery-modal');
}

function openAddProjectModal() {
    document.getElementById('add-project-form').reset();
    openModal('add-project-modal');
}

function openAddPasswordModal() {
    document.getElementById('add-password-form').reset();
    openModal('add-password-modal');
}

function closeModal(modalId) {
    console.log(`Closing modal: ${modalId}`);
    const modal = document.getElementById(modalId);
    if (modal) {
        // First remove the active class to trigger transition
        modal.classList.remove('active');
        
        // Then hide the modal after transition completes
        setTimeout(() => {
            if (!modal.classList.contains('active')) {
                modal.style.display = 'none';
            }
        }, 300); // Match this to your CSS transition time
    }
    
    // Remove backdrop
    const backdrop = document.querySelector('.modal-backdrop');
    if (backdrop) {
        backdrop.remove();
    }
    
    // Ensure any modal-specific cleanup is performed
    if (modalId === 'theme-modal') {
        // Reset any theme-specific state if needed
    }
}

// Helper function to handle grocery item clicks
function handleGroceryItemClick(event) {
    // Find the closest grocery-item parent
    const groceryItem = event.target.closest('.grocery-item');
    if (!groceryItem) return;
    
    // Get the item ID from the data attribute - use the raw string value
    const itemId = groceryItem.dataset.id;
    if (!itemId) return;
    
    // Only handle clicks on the main content, not on buttons or other interactive elements
    if (event.target.tagName === 'BUTTON' || 
        event.target.closest('button') || 
        event.target.classList.contains('grocery-actions')) {
        return;
    }
    
    // Call the edit function with the string ID
    console.log('Clicked on grocery item:', itemId);
    editGroceryItem(itemId);
}

// Initialize app
document.addEventListener('DOMContentLoaded', function() {
    loadData();
    
    // Add a global click handler for grocery items
    document.addEventListener('click', handleGroceryItemClick);
    
    // Add event listeners for theme modal buttons
    const themeToggleButton = document.getElementById('theme-toggle');
    const settingsLink = document.getElementById('settings-link');
    const themeModal = document.getElementById('theme-modal');
    
    if (themeToggleButton) {
        themeToggleButton.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            showThemeModal();
        });
    }
    
    if (settingsLink) {
        settingsLink.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            showThemeModal();
        });
    }
    
    // Function to directly show the theme modal
    function showThemeModal() {
        if (themeModal) {
            // Reset modal state
            themeModal.style.display = 'flex';
            // Force a reflow
            void themeModal.offsetWidth;
            // Show the modal
            themeModal.classList.add('active');
            // Update theme selection
            updateThemeSelection();
        }
    }
    
    // Restore the saved theme from localStorage
    const savedTheme = localStorage.getItem('appTheme');
    if (savedTheme) {
        appData.theme = savedTheme;
        applyTheme();
    }
    
    // Restore the active tab from localStorage or default to 'tasks'
    const savedTab = localStorage.getItem('activeTab') || 'tasks';
    switchTab(savedTab);
    
    renderCurrentTab();
    startAIAnalysis();
    
    // Set minimum date for date inputs to today
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('task-due-date').min = today;
    
    // Close modals on outside click
    document.querySelectorAll('.modal').forEach(modal => {
        modal.addEventListener('click', function(e) {
            if (e.target === this) {
                this.classList.remove('active');
            }
        });
    });
});
