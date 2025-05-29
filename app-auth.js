/**
 * Google Authentication and Data Sync
 * Handles Google Sign-In, account switching, and data synchronization
 */

// Google API configuration
const AUTH_CONFIG = {
    apiKey: '', // For this implementation, we can leave this empty as we're using OAuth flow
    clientId: '507047157366-6ej2hkja6bm6bj4mb11f53j32knuf0so.apps.googleusercontent.com', // Your OAuth Client ID
    scopes: [
        'https://www.googleapis.com/auth/userinfo.profile',
        'https://www.googleapis.com/auth/userinfo.email',
        'https://www.googleapis.com/auth/drive.appdata'
    ],
    discoveryDocs: [
        'https://www.googleapis.com/discovery/v1/apis/drive/v3/rest'
    ]
};

// Google Identity configuration
let tokenClient;

// Auth state
let googleUser = null;
let isAuthorized = false;
let currentUserEmail = '';
let authInstance = null;

// DOM elements
const accountButton = document.getElementById('account-button');
const accountAvatar = document.querySelector('.account-avatar');
const accountDropdown = document.getElementById('account-dropdown-content');
const googleSignInButton = document.getElementById('google-signin-button');

// Initialize Google Auth
function initGoogleAuth() {
    // Load the auth2 library and initialize client
    gapi.load('client', initClient);
}

// Initialize the Google API client
function initClient() {
    gapi.client.init({
        apiKey: AUTH_CONFIG.apiKey,
        discoveryDocs: AUTH_CONFIG.discoveryDocs
    }).then(() => {
        // Initialize token client
        if (google && google.accounts && google.accounts.oauth2) {
            tokenClient = google.accounts.oauth2.initTokenClient({
                client_id: AUTH_CONFIG.clientId,
                scope: AUTH_CONFIG.scopes.join(' '),
                callback: (tokenResponse) => {
                    if (tokenResponse && tokenResponse.access_token) {
                        // Store ID token if available
                        if (tokenResponse.id_token) {
                            localStorage.setItem('gis_id_token', tokenResponse.id_token);
                        }
                        
                        // Get user info with the token
                        fetchUserInfo(tokenResponse.access_token);
                    }
                },
                error_callback: (error) => {
                    console.error('Error getting token', error);
                    showAuthError('Failed to authenticate. Please try again.');
                    handleSignedOutUser();
                }
            });
            
            // Check if user is already signed in
            checkSignInStatus();
        } else {
            console.error('Google Identity Services not loaded');
            // Fallback to older method if needed
            if (gapi.auth2) {
                initLegacyAuth();
            } else {
                // Neither method is available, just set up UI
                handleSignedOutUser();
            }
        }
        
        // Set up click handlers for auth-related elements
        if (googleSignInButton) {
            googleSignInButton.onclick = handleAuthClick;
        }
        
        if (accountButton) {
            accountButton.onclick = function(e) {
                e.stopPropagation();
                if (accountDropdown) {
                    accountDropdown.classList.toggle('show');
                }
            };
        }
        
        // Set up account dropdown
        setupAccountDropdown();
    }).catch(error => {
        console.error('Error initializing Google API client', error);
        showAuthError('Failed to initialize Google authentication. Please try again later.');
        handleSignedOutUser();
    });
}

// Initialize legacy auth method if needed
function initLegacyAuth() {
    gapi.auth2.init({
        client_id: AUTH_CONFIG.clientId,
        scope: AUTH_CONFIG.scopes.join(' ')
    }).then((auth2) => {
        authInstance = auth2;
        
        // Set the initial sign-in state
        updateSignInStatus(authInstance.isSignedIn.get());
        
        // Listen for sign-in state changes
        authInstance.isSignedIn.listen(updateSignInStatus);
        
        // Handle the initial sign-in state
        if (authInstance.isSignedIn.get()) {
            googleUser = authInstance.currentUser.get();
            handleSignedInUser(googleUser);
        } else {
            handleSignedOutUser();
        }
    }).catch(error => {
        console.error('Error initializing legacy auth', error);
    });
}

// Check if the user is signed in using tokens
function checkSignInStatus() {
    const token = localStorage.getItem('gis_access_token');
    if (token) {
        // Validate token and get user info
        fetchUserInfo(token);
    } else {
        handleSignedOutUser();
    }
}

// Fetch user info with access token
function fetchUserInfo(accessToken) {
    fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
        headers: {
            'Authorization': `Bearer ${accessToken}`
        }
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Token invalid or expired');
        }
        return response.json();
    })
    .then(data => {
        isAuthorized = true;
        currentUserEmail = data.email;
        googleUser = { // Create a simplified user object for compatibility
            getBasicProfile: () => ({
                getName: () => data.name,
                getEmail: () => data.email,
                getImageUrl: () => data.picture
            }),
            getAuthResponse: () => ({
                access_token: accessToken,
                id_token: localStorage.getItem('gis_id_token') || ''
            })
        };
        
        // Create user data object
        const userData = {
            name: data.name,
            email: data.email,
            picture: data.picture
        };
        
        // Store token
        localStorage.setItem('gis_access_token', accessToken);
        
        // Update UI
        updateUserInterface(true, userData);
        
        // Set the auth token for all future API requests
        gapi.client.setToken({
            access_token: accessToken
        });
        
        // Load Drive API before trying to access user data
        gapi.client.load('drive', 'v3')
            .then(() => {
                // Load user data after Drive API is loaded
                loadUserData();
            })
            .catch(err => {
                console.error('Error loading Drive API:', err);
                // Still show the user as signed in, just can't sync data
                showAuthError('Google Drive sync is unavailable. Your data will be stored locally only.');
            });
    })
    .catch(error => {
        console.error('Error fetching user info', error);
        localStorage.removeItem('gis_access_token');
        handleSignedOutUser();
    });
}

// Update sign-in status based on current state
function updateSignInStatus(isSignedIn) {
    isAuthorized = isSignedIn;
    
    if (isSignedIn) {
        handleSignedInUser(authInstance.currentUser.get());
    } else {
        handleSignedOutUser();
    }
}

// Handle signed-in user
function handleSignedInUser(user) {
    googleUser = user;
    const profile = user.getBasicProfile();
    
    // Get user info
    const userId = profile.getId();
    const fullName = profile.getName();
    const givenName = profile.getGivenName();
    const familyName = profile.getFamilyName();
    currentUserEmail = profile.getEmail();
    const imageUrl = profile.getImageUrl();
    
    console.log(`User signed in: ${currentUserEmail}`);
    
    // Update UI
    updateUserInterface(true, {
        email: currentUserEmail,
        name: givenName || fullName,
        imageUrl: imageUrl
    });
    
    // Load user data from Google Drive
    loadUserData();
}

// Handle signed-out user
function handleSignedOutUser() {
    googleUser = null;
    currentUserEmail = '';
    isAuthorized = false;
    
    console.log('User signed out');
    
    // Update UI
    updateUserInterface(false);
    
    // Use local data
    loadLocalData();
}

// Update the user interface based on sign-in state
function updateUserInterface(isSignedIn, userData = null) {
    if (isSignedIn && userData) {
        // Update account button with user info
        if (accountAvatar) {
            if (userData.imageUrl) {
                accountAvatar.innerHTML = `<img src="${userData.imageUrl}" alt="${userData.name}" />`;
                accountAvatar.classList.add('has-image');
            } else {
                accountAvatar.textContent = userData.name.charAt(0).toUpperCase();
                accountAvatar.classList.remove('has-image');
            }
        }
        
        // Update account dropdown
        if (accountDropdown) {
            // Add user email to dropdown
            let emailElement = accountDropdown.querySelector('.account-email');
            if (!emailElement) {
                emailElement = document.createElement('div');
                emailElement.className = 'account-email';
                accountDropdown.insertBefore(emailElement, accountDropdown.firstChild);
            }
            emailElement.textContent = userData.email;
            
            // Update dropdown options
            updateAccountDropdownOptions(true);
        }
        
        // Hide sign-in button if it exists
        if (googleSignInButton) {
            googleSignInButton.style.display = 'none';
        }
        
        // Show account button
        if (accountButton) {
            accountButton.style.display = 'flex';
        }
        
    } else {
        // Reset account avatar
        if (accountAvatar) {
            accountAvatar.textContent = 'U';
            accountAvatar.classList.remove('has-image');
        }
        
        // Update dropdown options
        if (accountDropdown) {
            // Remove email element if it exists
            const emailElement = accountDropdown.querySelector('.account-email');
            if (emailElement) {
                emailElement.remove();
            }
            
            updateAccountDropdownOptions(false);
        }
        
        // Show sign-in button if it exists
        if (googleSignInButton) {
            googleSignInButton.style.display = 'flex';
        }
        
        // Hide account button if sign-in button exists
        if (accountButton && googleSignInButton) {
            accountButton.style.display = 'none';
        }
    }
}

// Update account dropdown options based on sign-in state
function updateAccountDropdownOptions(isSignedIn) {
    if (!accountDropdown) return;
    
    // Clear existing options (except email)
    const emailElement = accountDropdown.querySelector('.account-email');
    accountDropdown.innerHTML = '';
    
    if (emailElement) {
        accountDropdown.appendChild(emailElement);
    }
    
    if (isSignedIn) {
        // Add signed-in options
        const options = [
            { text: 'Switch Account', action: 'switchAccount' },
            { text: 'Add Account', action: 'addAccount' },
            { text: 'Sign Out', action: 'signOut' },
            { text: 'Settings', action: 'openSettings' }
        ];
        
        options.forEach(option => {
            const link = document.createElement('a');
            link.href = '#';
            link.textContent = option.text;
            link.dataset.action = option.action;
            link.addEventListener('click', handleAccountAction);
            accountDropdown.appendChild(link);
        });
    } else {
        // Add signed-out options
        const options = [
            { text: 'Settings', action: 'openSettings' },
            { text: 'Reset App', action: 'resetApp' }
        ];
        
        options.forEach(option => {
            const link = document.createElement('a');
            link.href = '#';
            link.textContent = option.text;
            link.dataset.action = option.action;
            link.addEventListener('click', handleAccountAction);
            accountDropdown.appendChild(link);
        });
    }
}

// Handle account dropdown actions
function handleAccountAction(e) {
    e.preventDefault();
    
    const action = e.target.dataset.action;
    
    switch (action) {
        case 'switchAccount':
            switchAccount();
            break;
        case 'addAccount':
            addAccount();
            break;
        case 'signOut':
            signOut();
            break;
        case 'openSettings':
            openThemeModal();
            break;
        case 'resetApp':
            clearAllData();
            break;
        default:
            console.error('Unknown account action:', action);
    }
}

// Setup account dropdown menu
function setupAccountDropdown() {
    // Add click event to account button
    if (accountButton) {
        // Show/hide dropdown on click
        accountButton.addEventListener('click', function(e) {
            e.stopPropagation();
            accountDropdown.classList.toggle('show');
        });
        
        // Hide dropdown when clicking outside
        document.addEventListener('click', function() {
            if (accountDropdown.classList.contains('show')) {
                accountDropdown.classList.remove('show');
            }
        });
    }
}

// Handle auth click (sign in)
function handleAuthClick() {
    if (isAuthorized) {
        // Already signed in, show account dropdown
        if (accountDropdown) {
            accountDropdown.classList.toggle('show');
        }
    } else {
        // Sign in with the appropriate method
        if (tokenClient) {
            // Use Google Identity Services
            tokenClient.requestAccessToken();
        } else if (authInstance) {
            // Fallback to legacy method
            authInstance.signIn().catch(error => {
                console.error('Error signing in', error);
                if (error.error === 'popup_blocked_by_browser') {
                    showAuthError('Pop-up blocked by browser. Please allow pop-ups for this site.');
                } else {
                    showAuthError('Failed to sign in. Please try again.');
                }
            });
        } else {
            console.error('No auth method available');
            showAuthError('Authentication not initialized. Please refresh the page and try again.');
        }
    }
}

// Switch Google account
function switchAccount() {
    // Clear current token
    localStorage.removeItem('gis_access_token');
    
    if (tokenClient) {
        // Use Google Identity Services with prompt
        tokenClient.requestAccessToken({prompt: 'select_account'});
    } else if (authInstance) {
        // Fallback to legacy method
        authInstance.signOut().then(() => {
            authInstance.signIn();
        }).catch(error => {
            console.error('Error switching accounts', error);
            showAuthError('Failed to switch accounts. Please try again.');
        });
    } else {
        console.error('No auth method available');
        showAuthError('Authentication not initialized. Please refresh the page and try again.');
    }
}

// Add another Google account
function addAccount() {
    // Same as switch account for Google Identity Services
    switchAccount();
}

// Sign out
function signOut() {
    // Clear token
    localStorage.removeItem('gis_access_token');
    
    // Revoke access if possible
    if (google && google.accounts) {
        google.accounts.id.disableAutoSelect();
    }
    
    // Also use legacy method if available
    if (authInstance) {
        authInstance.signOut().catch(error => {
            console.error('Error signing out', error);
        });
    }
    
    // Update UI
    handleSignedOutUser();
}

// Load user data from Google Drive
function loadUserData() {
    if (!isAuthorized) {
        console.log('User not authorized, loading local data');
        loadLocalData();
        return;
    }
    
    // Show syncing status
    showSyncStatus('Syncing with Google Drive...', true);
    
    // Check if Drive API is loaded
    if (!gapi.client.drive) {
        console.error('Drive API not loaded');
        // Try to load it
        gapi.client.load('drive', 'v3')
            .catch(err => {
                console.error('Failed to load Drive API:', err);
                showAuthError('Could not access Google Drive. Your data will be stored locally only.');
            });
        return;
    }
    
    // Ensure we have a valid token set
    const accessToken = localStorage.getItem('gis_access_token');
    if (accessToken) {
        gapi.client.setToken({
            access_token: accessToken
        });
    } else if (googleUser && googleUser.getAuthResponse) {
        const authResponse = googleUser.getAuthResponse();
        if (authResponse && authResponse.access_token) {
            gapi.client.setToken({
                access_token: authResponse.access_token
            });
        } else {
            console.error('No access token available');
            showAuthError('Authentication token missing. Please sign in again.');
            return;
        }
    } else {
        console.error('No authentication data available');
        showAuthError('Authentication data missing. Please sign in again.');
        return;
    }
    
    // Look for app data file
    gapi.client.drive.files.list({
        spaces: 'appDataFolder',
        fields: 'files(id, name)',
        pageSize: 10
    }).then(response => {
        const files = response.result.files;
        
        if (files && files.length > 0) {
            // Find our data file
            const dataFile = files.find(file => file.name === 'tasks_app_data.json');
            
            if (dataFile) {
                // Load the file content
                return gapi.client.drive.files.get({
                    fileId: dataFile.id,
                    alt: 'media'
                });
            } else {
                // No data file found, use local data
                console.log('No data file found in Google Drive');
                return null;
            }
        } else {
            // No files found, use local data
            console.log('No files found in Google Drive');
            return null;
        }
    }).then(response => {
        if (response && response.result) {
            // Parse the data
            try {
                let cloudData;
                
                // Check if response.result is already an object or a string
                if (typeof response.result === 'object') {
                    cloudData = response.result;
                } else if (typeof response.result === 'string') {
                    // Remove any BOM or non-printable characters that might be causing issues
                    const cleanedData = response.result.trim().replace(/^\ufeff/, '');
                    
                    // Log the data for debugging
                    console.log('Data from Drive (first 100 chars):', cleanedData.substring(0, 100));
                    
                    // Parse the JSON string
                    cloudData = JSON.parse(cleanedData);
                } else {
                    throw new Error('Unexpected response format');
                }
                
                // Merge with local data or replace
                mergeOrReplaceData(cloudData);
                
                // Show sync success message
                showSyncStatus('Data synced from Google Drive', true);
            } catch (error) {
                console.error('Error parsing data from Google Drive', error);
                // Load local data as fallback
                loadLocalData();
                showSyncStatus('Error syncing data, using local data', false);
            }
        } else {
            // No data from Drive, save current data to Drive
            saveUserData();
        }
    }).catch(error => {
        console.error('Error loading data from Google Drive', error);
        showSyncStatus('Error syncing data', false);
    });
}

// Save user data to Google Drive
function saveUserData() {
    if (!isAuthorized) {
        console.log('User not authorized, saving locally only');
        return;
    }
    
    // Ensure we have a valid token set
    const accessToken = localStorage.getItem('gis_access_token');
    if (accessToken) {
        gapi.client.setToken({
            access_token: accessToken
        });
    } else if (googleUser && googleUser.getAuthResponse) {
        const authResponse = googleUser.getAuthResponse();
        if (authResponse && authResponse.access_token) {
            gapi.client.setToken({
                access_token: authResponse.access_token
            });
        } else {
            console.error('No access token available for saving');
            showAuthError('Authentication token missing. Please sign in again.');
            return;
        }
    } else {
        console.error('No authentication data available for saving');
        showAuthError('Authentication data missing. Please sign in again.');
        return;
    }
    
    // Check if Drive API is loaded
    if (!gapi.client.drive) {
        console.error('Drive API not loaded');
        saveData(); // Save to localStorage as fallback
        return;
    }
    
    // Prepare data for saving
    let file;
    try {
        // Get the current app data
        const appData = loadLocalData() || {};
        
        // Ensure the data is valid
        if (!appData || typeof appData !== 'object') {
            console.error('Invalid app data format');
            showSyncStatus('Error: Invalid data format', false);
            return;
        }
        
        // Stringify with proper formatting
        const dataToSave = JSON.stringify(appData, null, 2);
        console.log('Saving data to Drive (first 100 chars):', dataToSave.substring(0, 100));
        
        // Create a blob with the correct MIME type
        file = new Blob([dataToSave], {type: 'application/json'});
    } catch (error) {
        console.error('Error preparing data for saving:', error);
        showSyncStatus('Error preparing data for saving', false);
        return;
    }
    
    // Show syncing status
    showSyncStatus('Saving to Google Drive...', true);
    
    // Look for existing file first
    gapi.client.drive.files.list({
        spaces: 'appDataFolder',
        fields: 'files(id, name)',
        pageSize: 10
    }).then(response => {
        const files = response.result.files;
        
        if (files && files.length > 0) {
            // Find our data file
            const dataFile = files.find(file => file.name === 'tasks_app_data.json');
            
            if (dataFile) {
                // Update existing file
                const metadata = {
                    'mimeType': 'application/json'
                };
                
                const form = new FormData();
                form.append('metadata', new Blob([JSON.stringify(metadata)], {type: 'application/json'}));
                form.append('file', file);
                
                return fetch(`https://www.googleapis.com/upload/drive/v3/files/${dataFile.id}?uploadType=multipart`, {
                    method: 'PATCH',
                    headers: new Headers({'Authorization': 'Bearer ' + googleUser.getAuthResponse().access_token}),
                    body: form
                });
            } else {
                // Create new file
                return createNewFile(file);
            }
        } else {
            // No files found, create new file
            return createNewFile(file);
        }
    }).then(response => {
        if (response && response.ok) {
            console.log('Data saved to Google Drive');
            showSyncStatus('Data synced to Google Drive', true);
        } else {
            console.error('Error saving data to Google Drive', response);
            showSyncStatus('Error syncing data', false);
        }
    }).catch(error => {
        console.error('Error saving data to Google Drive', error);
        showSyncStatus('Error syncing data', false);
        
        // Save locally as fallback
        saveData();
    });
}

// Create a new file in Google Drive
function createNewFile(fileBlob) {
    const metadata = {
        'name': 'tasks_app_data.json',
        'mimeType': 'application/json',
        'parents': ['appDataFolder']
    };
    
    const form = new FormData();
    form.append('metadata', new Blob([JSON.stringify(metadata)], {type: 'application/json'}));
    form.append('file', fileBlob);
    
    return fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
        method: 'POST',
        headers: new Headers({'Authorization': 'Bearer ' + googleUser.getAuthResponse().access_token}),
        body: form
    });
}

// Merge cloud data with local data or replace
function mergeOrReplaceData(cloudData) {
    // Validate cloud data structure
    if (!cloudData || typeof cloudData !== 'object') {
        console.error('Invalid cloud data format');
        showSyncStatus('Error: Invalid cloud data format', false);
        return;
    }
    
    // Get current local data as a backup and for merging
    const localData = JSON.parse(localStorage.getItem('appData')) || {
        tasks: [],
        groceries: [],
        projects: [],
        passwords: [],
        taskPatterns: {},
        taskDurations: {},
        suggestions: [],
        dismissedSuggestions: {},
        theme: 'light'
    };
    
    // Ensure all required properties exist in cloud data
    if (!Array.isArray(cloudData.tasks)) cloudData.tasks = localData.tasks || [];
    if (!Array.isArray(cloudData.groceries)) cloudData.groceries = localData.groceries || [];
    if (!Array.isArray(cloudData.projects)) cloudData.projects = localData.projects || [];
    if (!Array.isArray(cloudData.passwords)) cloudData.passwords = localData.passwords || [];
    if (!cloudData.taskPatterns || typeof cloudData.taskPatterns !== 'object') cloudData.taskPatterns = localData.taskPatterns || {};
    if (!cloudData.taskDurations || typeof cloudData.taskDurations !== 'object') cloudData.taskDurations = localData.taskDurations || {};
    if (!Array.isArray(cloudData.suggestions)) cloudData.suggestions = localData.suggestions || [];
    if (!cloudData.dismissedSuggestions || typeof cloudData.dismissedSuggestions !== 'object') cloudData.dismissedSuggestions = localData.dismissedSuggestions || {};
    if (!cloudData.theme) cloudData.theme = localData.theme || 'light';
    
    console.log('Merged data structure:', Object.keys(cloudData));
    
    // Normalize data to ensure consistency
    normalizeAppData(cloudData);
    
    // Update app data - ensure we're updating the global variable correctly
    appData = cloudData;
    
    // Also set it on window for cross-file consistency
    window.appData = appData;
    
    // Save to localStorage as a backup
    localStorage.setItem('appData', JSON.stringify(appData));
    
    // Refresh UI
    renderCurrentTab();
    applyTheme();
    
    showSyncStatus('Data synced successfully', true);
}

// Normalize app data to ensure consistency across different data sources
function normalizeAppData(data) {
    if (!data) return;
    
    // Normalize grocery items
    if (Array.isArray(data.groceries)) {
        data.groceries.forEach(item => {
            // Ensure ID is a string
            if (item.id !== undefined) {
                item.id = String(item.id);
            } else {
                // Generate a new ID if missing
                item.id = generateUniqueId();
            }
            
            // Ensure inStock is a boolean
            if (typeof item.inStock !== 'boolean') {
                item.inStock = Boolean(item.inStock);
            }
        });
        console.log('Normalized grocery items:', data.groceries.length);
    }
    
    // Normalize tasks (similar approach)
    if (Array.isArray(data.tasks)) {
        data.tasks.forEach(task => {
            // Ensure ID is a number for tasks (they use numeric IDs)
            if (task.id !== undefined && typeof task.id !== 'number') {
                const numId = parseInt(task.id);
                if (!isNaN(numId)) {
                    task.id = numId;
                }
            }
            
            // Ensure completed is a boolean
            if (typeof task.completed !== 'boolean') {
                task.completed = Boolean(task.completed);
            }
        });
        console.log('Normalized tasks:', data.tasks.length);
    }
    
    return data;
}

// Load data from localStorage
function loadLocalData() {
    // Get data from localStorage
    const savedData = localStorage.getItem('appData');
    if (savedData) {
        try {
            // Parse the saved data
            const data = JSON.parse(savedData);
            
            // Ensure all required properties exist
            if (!data.tasks) data.tasks = [];
            if (!data.groceries) data.groceries = [];
            if (!data.projects) data.projects = [];
            if (!data.passwords) data.passwords = [];
            if (!data.taskPatterns) data.taskPatterns = {};
            if (!data.taskDurations) data.taskDurations = {};
            if (!data.suggestions) data.suggestions = [];
            if (!data.dismissedSuggestions) data.dismissedSuggestions = {};
            if (!data.theme) data.theme = 'light';
            
            return data;
        } catch (error) {
            console.error('Error parsing local data:', error);
            return {
                tasks: [],
                groceries: [],
                projects: [],
                passwords: [],
                taskPatterns: {},
                taskDurations: {},
                suggestions: [],
                dismissedSuggestions: {},
                theme: 'light'
            };
        }
    } else {
        // Return default data structure if nothing is saved
        return {
            tasks: [],
            groceries: [],
            projects: [],
            passwords: [],
            taskPatterns: {},
            taskDurations: {},
            suggestions: [],
            dismissedSuggestions: {},
            theme: 'light'
        };
    }
}

// Show authentication error
function showAuthError(message) {
    // You could implement a toast notification or alert here
    console.error('Auth Error:', message);
    
    // Simple implementation: show in sync status
    showSyncStatus(message, false);
}

// Override the existing saveData function to also save to Google Drive
const originalSaveData = saveData;
saveData = function() {
    // Call the original function to save to localStorage
    originalSaveData();
    
    // Also save to Google Drive if signed in
    if (isAuthorized && googleUser) {
        saveUserData();
    }
};

// Initialize Google Auth when the API is loaded
function onGoogleApiLoad() {
    // Wait for both APIs to be loaded
    if (typeof gapi !== 'undefined' && typeof google !== 'undefined' && google.accounts) {
        initGoogleAuth();
    } else if (typeof gapi !== 'undefined') {
        // Fallback to just gapi if google.accounts is not available
        initGoogleAuth();
    } else {
        console.error('Google API not loaded properly');
    }
}

// Add Google API script to the page
function loadGoogleApi() {
    const script = document.createElement('script');
    script.src = 'https://apis.google.com/js/api.js';
    script.onload = function() {
        gapi.load('client:auth2', initGoogleAuth);
    };
    document.body.appendChild(script);
}

// Initialize when the document is ready
document.addEventListener('DOMContentLoaded', function() {
    // Check if Google API is already loaded
    if (typeof gapi !== 'undefined') {
        initGoogleAuth();
    } else {
        loadGoogleApi();
    }
});
