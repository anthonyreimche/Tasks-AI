// Render grocery list
function renderGrocery(searchQuery = '') {
    // Fix any data inconsistencies before rendering
    fixGroceryData();
    
    const groceryContainer = document.getElementById('grocery-container');
    
    // Log all grocery items for debugging
    console.log('All grocery items:', appData.groceries);
    
    // Filter items by search query if provided
    let filteredGroceries = appData.groceries;
    if (searchQuery) {
        searchQuery = searchQuery.toLowerCase();
        // Create a list of common food types for semantic search
        const foodTypeMap = {
            'meat': ['chicken', 'beef', 'pork', 'turkey', 'lamb', 'steak', 'sausage'],
            'dairy': ['milk', 'cheese', 'yogurt', 'butter', 'cream', 'eggs'],
            'vegetable': ['carrot', 'broccoli', 'spinach', 'lettuce', 'tomato', 'potato', 'onion', 'garlic'],
            'fruit': ['apple', 'banana', 'orange', 'grape', 'strawberry', 'blueberry', 'pear', 'watermelon'],
            'grain': ['bread', 'rice', 'pasta', 'cereal', 'oats', 'flour', 'tortilla'],
            'seafood': ['fish', 'shrimp', 'salmon', 'tuna', 'crab', 'lobster'],
            'snack': ['chips', 'cookie', 'cracker', 'popcorn', 'pretzel', 'nuts'],
            'beverage': ['water', 'juice', 'soda', 'coffee', 'tea', 'milk', 'wine', 'beer'],
            'condiment': ['ketchup', 'mustard', 'mayonnaise', 'sauce', 'dressing', 'oil', 'vinegar'],
            'spice': ['salt', 'pepper', 'cinnamon', 'oregano', 'basil', 'paprika']
        };
        
        // Define category mappings for search
        const categoryMap = {
            'produce': 'Produce',
            'dairy': 'Dairy',
            'meat': 'Meat',
            'pantry': 'Pantry',
            'frozen': 'Frozen',
            'snacks': 'Snacks',
            'beverages': 'Beverages',
            'other': 'Other'
        };
        
        // Find matching food types for the search query
        let matchingFoodTypes = [];
        for (const [type, foods] of Object.entries(foodTypeMap)) {
            if (type.includes(searchQuery)) {
                matchingFoodTypes = [...matchingFoodTypes, ...foods];
            } else {
                // Check if any food in this category matches the search query
                const matchingFoods = foods.filter(food => food.includes(searchQuery));
                if (matchingFoods.length > 0) {
                    // If we found a match, add the type to our search terms
                    matchingFoodTypes.push(type);
                }
            }
        }
        
        // Find matching category
        let matchingCategory = null;
        for (const [searchTerm, categoryValue] of Object.entries(categoryMap)) {
            if (searchTerm.includes(searchQuery) || searchQuery.includes(searchTerm)) {
                matchingCategory = categoryValue;
                break;
            }
        }
        
        filteredGroceries = appData.groceries.filter(item => {
            const itemName = item.name.toLowerCase();
            
            // Check for category match
            if (matchingCategory && item.category === matchingCategory) {
                return true;
            }
            
            // Direct match in name
            if (itemName.includes(searchQuery)) {
                return true;
            }
            
            // Check for semantic matches (e.g., searching for 'meat' should return 'chicken')
            for (const foodType of matchingFoodTypes) {
                if (itemName.includes(foodType)) {
                    return true;
                }
            }
            
            // Check if any food type directly matches the item name
            for (const [type, foods] of Object.entries(foodTypeMap)) {
                if (searchQuery === type && foods.some(food => itemName.includes(food))) {
                    return true;
                }
            }
            
            return false;
        });
    }
    
    // Group items by status
    const expiredItems = filteredGroceries.filter(item => 
        item.inStock === true && 
        item.expiryDate && 
        getDaysUntilExpiry(item.expiryDate) < 0
    );
    
    const expiringItems = filteredGroceries.filter(item => 
        item.inStock === true && 
        item.expiryDate && 
        getDaysUntilExpiry(item.expiryDate) >= 0 &&
        getDaysUntilExpiry(item.expiryDate) <= 3
    );
    
    const shoppingList = filteredGroceries.filter(item => 
        item.inStock === false
    );
    
    const inStockItems = filteredGroceries.filter(item => 
        item.inStock === true && 
        (!item.expiryDate || getDaysUntilExpiry(item.expiryDate) > 3)
    );
    
    // Log categorized items for debugging
    console.log('Shopping list:', shoppingList);
    console.log('Expired items:', expiredItems);
    console.log('Expiring items:', expiringItems);
    console.log('In stock items:', inStockItems);
    
    // Clear the container
    groceryContainer.innerHTML = '';
    
    // Create shopping list section first
    if (shoppingList.length > 0) {
        const section = document.createElement('div');
        section.className = 'section';
        section.innerHTML = `
            <div class="section-header">
                <div class="section-title">Shopping List</div>
            </div>
        `;
        
        const sortableContainer = document.createElement('div');
        sortableContainer.className = 'sortable-container';
        sortableContainer.dataset.group = 'shopping';
        section.appendChild(sortableContainer);
        
        // Use the card factory to render the shopping list items
        cardFactory.renderCards('grocery', shoppingList, sortableContainer);
        
        groceryContainer.appendChild(section);
    }
    
    // Create sections for expired items
    if (expiredItems.length > 0) {
        const section = document.createElement('div');
        section.className = 'section';
        section.innerHTML = `
            <div class="section-header">
                <div class="section-title">Expired Items</div>
            </div>
        `;
        
        const sortableContainer = document.createElement('div');
        sortableContainer.className = 'sortable-container';
        sortableContainer.dataset.group = 'expired';
        section.appendChild(sortableContainer);
        
        // Use the card factory to render the expired items
        cardFactory.renderCards('grocery', expiredItems, sortableContainer);
        
        groceryContainer.appendChild(section);
    }
    
    // Create sections for expiring soon items
    if (expiringItems.length > 0) {
        const section = document.createElement('div');
        section.className = 'section';
        section.innerHTML = `
            <div class="section-header">
                <div class="section-title">Expiring Soon</div>
            </div>
        `;
        
        const sortableContainer = document.createElement('div');
        sortableContainer.className = 'sortable-container';
        sortableContainer.dataset.group = 'expiring';
        section.appendChild(sortableContainer);
        
        // Use the card factory to render the expiring items
        cardFactory.renderCards('grocery', expiringItems, sortableContainer);
        
        groceryContainer.appendChild(section);
    }
    
    // Create section for in-stock items
    if (inStockItems.length > 0) {
        const section = document.createElement('div');
        section.className = 'section';
        section.innerHTML = `
            <div class="section-header">
                <div class="section-title">In Stock</div>
            </div>
        `;
        
        const sortableContainer = document.createElement('div');
        sortableContainer.className = 'sortable-container';
        sortableContainer.dataset.group = 'instock';
        section.appendChild(sortableContainer);
        
        // Use the card factory to render the in-stock items
        cardFactory.renderCards('grocery', inStockItems, sortableContainer);
        
        groceryContainer.appendChild(section);
    }
}

// Render expiring items
function renderExpiringItems(items) {
    return items.map(item => `
        <div class="grocery-item" data-id="${item.id}">
            <div class="grocery-content">
                <div class="grocery-name">${item.name} ${item.quantity ? `(${item.quantity})` : ''}</div>
                <div class="grocery-meta expiring">
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <circle cx="12" cy="12" r="10"></circle>
                        <line x1="12" y1="8" x2="12" y2="12"></line>
                        <line x1="12" y1="16" x2="12.01" y2="16"></line>
                    </svg>
                    <span>Expires in ${getDaysUntilExpiry(item.expiryDate)} days</span>
                </div>
            </div>
            <div class="grocery-hint">Tap to edit • Swipe to delete • Hold to reorder</div>
        </div>
    `).join('');
}

// Render shopping list
function renderShoppingList(items) {
    return items.map(item => `
        <div class="grocery-item" data-id="${item.id}">
            <div class="grocery-content">
                <div class="grocery-name">${item.name} ${item.quantity ? `(${item.quantity})` : ''}</div>
                <div class="grocery-meta">
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path>
                        <line x1="3" y1="6" x2="21" y2="6"></line>
                        <path d="M16 10a4 4 0 0 1-8 0"></path>
                    </svg>
                    <span>Shopping List</span>
                </div>
            </div>
            <div class="grocery-hint">Tap to edit • Swipe to delete • Hold to reorder</div>
        </div>
    `).join('');
}

// Render in-stock items
function renderInStockItems(items) {
    return items.map(item => `
        <div class="grocery-item" data-id="${item.id}">
            <div class="grocery-content">
                <div class="grocery-name">${item.name} ${item.quantity ? `(${item.quantity})` : ''}</div>
                <div class="grocery-meta">
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M20 7h-7.5a2.5 2.5 0 0 0-5 0H1a1 1 0 0 0 0 2h6.5a2.5 2.5 0 0 0 5 0H20a1 1 0 0 0 0-2z"/>
                        <path d="M20 17h-7.5a2.5 2.5 0 0 0-5 0H1a1 1 0 0 0 0 2h6.5a2.5 2.5 0 0 0 5 0H20a1 1 0 0 0 0-2z"/>
                    </svg>
                    ${item.expiryDate ? `<span>Expires: ${formatDate(item.expiryDate)}</span>` : '<span>In stock</span>'}
                </div>
            </div>
            <div class="grocery-hint">Tap to edit • Swipe to delete • Hold to reorder</div>
        </div>
    `).join('');
}

// Grocery functions
function toggleGroceryItem(event, itemId) {
    // Stop event propagation to prevent card click
    if (event) {
        event.stopPropagation();
    }
    // Convert itemId to number if it's a string (to match how tasks work)
    if (typeof itemId === 'string') {
        itemId = parseInt(itemId);
    }
    
    // Find the item with the matching id
    const item = appData.groceries.find(g => g.id === itemId);
    if (item) {
        // If trying to mark as in stock but no expiry date, show the expiry date modal
        if (!item.inStock && (!item.expiryDate || item.expiryDate === '')) {
            // Show expiry date modal
            document.getElementById('expiry-grocery-id').value = itemId;
            
            // Set today as the default date
            const today = new Date();
            const formattedDate = today.toISOString().split('T')[0];
            document.getElementById('expiry-date').value = formattedDate;
            
            // Show the modal
            openModal('expiry-date-modal');
            return; // Exit early, don't toggle yet
        }
        
        // Toggle the in-stock status
        item.inStock = !item.inStock;
        
        // If item is now in stock (was purchased), track this for AI suggestions
        if (item.inStock) {
            // Record purchase date
            item.purchaseDate = new Date().toISOString();
            
            // Remove from shopping list if it was there
            item.addedToList = false;
            
            // Track purchase for AI pattern recognition
            if (!appData.groceryPurchasePatterns) {
                appData.groceryPurchasePatterns = {};
            }
            
            if (!appData.groceryPurchasePatterns[item.name]) {
                appData.groceryPurchasePatterns[item.name] = [];
            }
            
            // Add purchase date to patterns
            appData.groceryPurchasePatterns[item.name].push({
                date: new Date().toISOString(),
                quantity: item.quantity || '1'
            });
            
            // Keep only the last 10 purchases for patterns
            if (appData.groceryPurchasePatterns[item.name].length > 10) {
                appData.groceryPurchasePatterns[item.name] = 
                    appData.groceryPurchasePatterns[item.name].slice(-10);
            }
            
            console.log(`Tracked purchase of ${item.name} for AI suggestions`);
        }
        
        saveData();
        renderGrocery();
    }
}

function deleteGroceryItem(itemId, showUndo = false) {
    // Convert itemId to number if it's a string (to match how tasks work)
    if (typeof itemId === 'string') {
        itemId = parseInt(itemId);
    }
    
    // Remove the item from appData
    const deletedItem = appData.groceries.find(g => g.id === itemId);
    appData.groceries = appData.groceries.filter(g => g.id !== itemId);
    saveData();
    renderGrocery();
    
    if (showUndo) {
        showUndoNotification('Item deleted', () => {
            // Restore the deleted item
            if (deletedItem) {
                appData.groceries.push(deletedItem);
                saveData();
                renderGrocery();
            }
        });
    }
}

function addToShoppingList(itemId) {
    // Convert itemId to number if it's a string (to match how tasks work)
    if (typeof itemId === 'string') {
        itemId = parseInt(itemId);
    }
    
    // Find the item with the matching id
    const item = appData.groceries.find(g => g.id === itemId);
    if (item) {
        item.inStock = false;
        item.addedToList = true;
        item.addedToListDate = new Date().toISOString(); // Track when it was added to the list
        
        // Track this for AI suggestions
        if (!appData.groceryShoppingListHistory) {
            appData.groceryShoppingListHistory = {};
        }
        
        if (!appData.groceryShoppingListHistory[item.name]) {
            appData.groceryShoppingListHistory[item.name] = [];
        }
        
        // Add to shopping list history
        appData.groceryShoppingListHistory[item.name].push({
            date: new Date().toISOString(),
            expiryDate: item.expiryDate || null
        });
        
        // Keep only the last 10 entries
        if (appData.groceryShoppingListHistory[item.name].length > 10) {
            appData.groceryShoppingListHistory[item.name] = 
                appData.groceryShoppingListHistory[item.name].slice(-10);
        }
        
        console.log(`Tracked ${item.name} added to shopping list for AI suggestions`);
        saveData();
        renderGrocery();
    }
}

// Edit grocery item
function editGroceryItem(itemId) {
    console.log('Editing grocery item:', itemId);
    
    // Make sure we have a valid numeric ID
    if (typeof itemId === 'string') {
        itemId = parseInt(itemId);
    }
    
    if (isNaN(itemId)) {
        console.error('Invalid grocery item ID (NaN):', itemId);
        return;
    }
    
    // Ensure data is fixed before trying to find the item
    fixGroceryData();
    
    // Find the item with the matching id
    const item = appData.groceries.find(g => g.id === itemId);
    
    // Handle case where item is not found
    if (!item) {
        console.error('Grocery item not found:', itemId);
        
        // If we just added this item, it might not be in the array yet
        // Let's check if there are any items and use the first one as a fallback
        if (appData.groceries.length > 0) {
            console.log('Using first grocery item as fallback');
            return editGroceryItem(appData.groceries[0].id);
        }
        return;
    }
    
    // Populate the edit form
    document.getElementById('edit-grocery-id').value = item.id;
    document.getElementById('edit-grocery-name').value = item.name;
    document.getElementById('edit-grocery-quantity').value = item.quantity || '';
    document.getElementById('edit-grocery-category').value = item.category || 'Other';
    document.getElementById('edit-grocery-expiry').value = item.expiryDate || '';
    document.getElementById('edit-grocery-in-stock').checked = item.inStock !== undefined ? item.inStock : true;
    
    // Show the edit modal
    openModal('edit-grocery-modal');
}

// Save edited grocery item
function saveEditedGroceryItem(event) {
    event.preventDefault();
    
    const itemId = parseInt(document.getElementById('edit-grocery-id').value);
    const item = appData.groceries.find(g => g.id === itemId);
    
    if (item) {
        // Get the values from the form
        const name = document.getElementById('edit-grocery-name').value;
        const quantity = document.getElementById('edit-grocery-quantity').value;
        const category = document.getElementById('edit-grocery-category').value;
        const expiryDate = document.getElementById('edit-grocery-expiry').value || null;
        const inStock = document.getElementById('edit-grocery-in-stock').checked;
        
        // Log the values for debugging
        console.log('Saving grocery item:', {
            id: itemId,
            name,
            inStock,
            'checkbox value': document.getElementById('edit-grocery-in-stock').checked
        });
        
        // Update the item
        item.name = name;
        item.quantity = quantity;
        item.category = category;
        item.expiryDate = expiryDate;
        item.inStock = inStock;
        
        // If not in stock, make sure it's in the shopping list
        if (!inStock) {
            item.addedToList = true;
        }
        
        saveData();
        renderGrocery();
        closeModal('edit-grocery-modal');
    }
}

function markAsUsed(itemId) {
    // Convert itemId to number if it's a string (to match how tasks work)
    if (typeof itemId === 'string') {
        itemId = parseInt(itemId);
    }
    
    // Find the item with the matching id
    const item = appData.groceries.find(g => g.id === itemId);
    if (item) {
        // Explicitly set to boolean values
        item.inStock = false;
        item.addedToList = true; // Add to shopping list when marked as used
        item.addedToListDate = new Date().toISOString(); // Track when it was added to the list
        
        // Track purchase history for AI suggestions
        trackGroceryUsage(item.name);
        
        saveData();
        renderGrocery();
    }
}

// Track grocery usage for AI suggestions
function trackGroceryUsage(itemName) {
    // Initialize purchase history if it doesn't exist
    if (!appData.groceryPurchaseHistory) {
        appData.groceryPurchaseHistory = {};
    }
    
    // Initialize history for this item if it doesn't exist
    if (!appData.groceryPurchaseHistory[itemName]) {
        appData.groceryPurchaseHistory[itemName] = [];
    }
    
    // Add the current date to the purchase history
    appData.groceryPurchaseHistory[itemName].push(new Date().toISOString());
    
    // Keep only the last 10 purchases
    if (appData.groceryPurchaseHistory[itemName].length > 10) {
        appData.groceryPurchaseHistory[itemName] = 
            appData.groceryPurchaseHistory[itemName].slice(-10);
    }
    
    console.log(`Tracked usage of ${itemName} for purchase history`);
}

// Parse quantity and unit from a string (e.g., "2 bags" -> {quantity: 2, unit: "bags"})
function parseQuantityAndUnit(quantityString) {
    if (!quantityString) return { quantity: 1, unit: null };
    
    // Match a number at the beginning of the string
    const match = quantityString.trim().match(/^(\d+(?:\.\d+)?)(\s+(.+))?$/);
    
    if (match) {
        const quantity = parseFloat(match[1]);
        let unit = match[3] ? match[3].trim() : null;
        
        return {
            quantity: quantity,
            unit: unit
        };
    }
    
    // If no number found, return the original string as the unit with quantity 1
    return {
        quantity: 1,
        unit: quantityString.trim()
    };
}

function addGroceryItem(event) {
    // Prevent the default form submission
    event.preventDefault();
    
    // Get the form element
    const form = document.getElementById('add-grocery-form');
    
    // Validate that we have at least a name
    const nameInput = document.getElementById('grocery-name');
    if (!nameInput || !nameInput.value.trim()) {
        console.error('Grocery name is required');
        return; // Don't proceed if no name
    }
    
    // Parse quantity and unit
    const quantityInput = document.getElementById('grocery-quantity').value;
    const { quantity, unit } = parseQuantityAndUnit(quantityInput);
    
    // Create the new item with explicit boolean values
    const item = {
        id: Date.now(), // Use numeric ID like tasks do
        name: nameInput.value.trim(),
        category: document.getElementById('grocery-category').value || 'Other',
        expiryDate: document.getElementById('grocery-expiry').value || null,
        quantity: quantity,
        unit: unit,
        inStock: document.getElementById('grocery-in-stock').checked, // Use the actual checkbox value
        addedToList: false
    };
    
    console.log('Adding new grocery item:', item);
    
    // Add the item to the data
    appData.groceries.push(item);
    
    // Save data first
    saveData();
    
    // Close the modal and reset the form
    closeModal('add-grocery-modal');
    form.reset();
    
    // Render after a slight delay to ensure data is properly saved
    setTimeout(() => {
        console.log('Rendering grocery list after adding item');
        renderGrocery();
    }, 100);
}

// The duplicate editGroceryItem function has been removed

// Save edited grocery item
function saveEditedGroceryItem(event) {
    event.preventDefault();
    
    const itemId = parseInt(document.getElementById('edit-grocery-id').value);
    const item = appData.groceries.find(g => g.id === itemId);
    
    if (item) {
        // Get form values
        const name = document.getElementById('edit-grocery-name').value;
        const quantityInput = document.getElementById('edit-grocery-quantity').value;
        const category = document.getElementById('edit-grocery-category').value;
        const expiryDate = document.getElementById('edit-grocery-expiry').value || null;
        const inStock = document.getElementById('edit-grocery-in-stock').checked;
        
        // Parse quantity and unit
        const { quantity, unit } = parseQuantityAndUnit(quantityInput);
        
        console.log('Saving grocery item:', {
            id: itemId,
            name,
            quantity,
            unit,
            inStock,
            'checkbox value': document.getElementById('edit-grocery-in-stock').checked
        });
        
        // Update the item with explicit boolean values
        item.name = name;
        item.quantity = quantity;
        item.unit = unit;
        item.category = category;
        item.expiryDate = expiryDate;
        item.inStock = Boolean(inStock); // Ensure it's a boolean
        
        saveData();
        renderGrocery();
        closeModal('edit-grocery-modal');
    }
}

// Fix any inconsistent grocery data
function fixGroceryData() {
    let dataFixed = false;
    
    if (!appData.groceries) {
        appData.groceries = [];
        dataFixed = true;
    }
    
    // Make sure all grocery items have proper boolean values for inStock
    // and ensure all IDs are numeric
    appData.groceries.forEach((item, index) => {
        // Convert any non-boolean inStock values to proper booleans
        if (typeof item.inStock !== 'boolean') {
            item.inStock = Boolean(item.inStock);
            dataFixed = true;
        }
        
        // Ensure ID is a number
        if (item.id === undefined || item.id === null || isNaN(Number(item.id))) {
            // Generate a new numeric ID based on timestamp with index offset to ensure uniqueness
            item.id = Date.now() + index;
            dataFixed = true;
            console.log('Generated new numeric ID for item:', item.name, item.id);
        } else if (typeof item.id !== 'number') {
            // Convert string IDs to numbers if possible
            const numId = Number(item.id);
            if (!isNaN(numId)) {
                item.id = numId;
                dataFixed = true;
                console.log('Converted ID to number:', item.id);
            } else {
                // If conversion fails, generate a new numeric ID
                item.id = Date.now() + index;
                dataFixed = true;
                console.log('Replaced invalid ID with numeric ID:', item.id);
            }
        }
    });
    
    if (dataFixed) {
        console.log('Fixed inconsistent grocery data');
        saveData();
    }
}

// Initialize the app
document.addEventListener('DOMContentLoaded', () => {
    // Fix any inconsistent data
    fixGroceryData();
    
    // Render the grocery list
    renderGrocery();
    
    // Initialize the touch swipe functionality
    initializeGroceryTouchSwipe();
    
    // Initialize the sortable functionality
    initializeGrocerySortable();
    
    // Initialize grocery search functionality
    initializeGrocerySearch();
    
    // Initialize grocery tab
    initGroceryTab();
});

function initGroceryTab() {
    // Set up event listeners
    document.getElementById('add-grocery-form').addEventListener('submit', addGroceryItem);
    document.getElementById('edit-grocery-form').addEventListener('submit', saveEditedGroceryItem);
    document.getElementById('expiry-date-form').addEventListener('submit', submitExpiryDate);
    
    // Set up event delegation for quantity control buttons
    document.getElementById('grocery-container').addEventListener('click', function(event) {
        console.log('Click in grocery container detected', event.target);
        
        // Check if the clicked element is a minus button
        if (event.target.classList.contains('grocery-minus-btn')) {
            console.log('Minus button clicked', event.target.dataset);
            // Get the grocery ID from the data attribute
            const groceryId = event.target.dataset.groceryId;
            console.log('Grocery ID from dataset:', groceryId);
            
            if (groceryId) {
                decreaseGroceryQuantity(event, groceryId);
            } else {
                console.error('No grocery ID found on minus button');
            }
        }
        
        // Check if the clicked element is a plus button
        if (event.target.classList.contains('grocery-plus-btn')) {
            console.log('Plus button clicked', event.target.dataset);
            // Get the grocery ID from the data attribute
            const groceryId = event.target.dataset.groceryId;
            console.log('Grocery ID from dataset:', groceryId);
            
            if (groceryId) {
                increaseGroceryQuantity(event, groceryId);
            } else {
                console.error('No grocery ID found on plus button');
            }
        }
    });
    
    // Log all in-stock grocery items to debug
    console.log('Current grocery items:', appData.groceries.map(item => {
        return {
            id: item.id,
            name: item.name,
            inStock: item.inStock,
            quantity: item.quantity
        };
    }));
}

// Handle the expiry date form submission
function submitExpiryDate(event) {
    // Prevent default form submission
    event.preventDefault();
    
    // Get the grocery ID and expiry date
    const groceryId = parseInt(document.getElementById('expiry-grocery-id').value);
    const expiryDate = document.getElementById('expiry-date').value;
    
    // Find the grocery item
    const item = appData.groceries.find(g => g.id === groceryId);
    if (item && expiryDate) {
        // Update the expiry date
        item.expiryDate = expiryDate;
        
        // Mark as in stock
        item.inStock = true;
        
        // Record purchase date
        item.purchaseDate = new Date().toISOString();
        
        // Remove from shopping list if it was there
        item.addedToList = false;
        
        // Track purchase for AI pattern recognition
        if (!appData.groceryPurchasePatterns) {
            appData.groceryPurchasePatterns = {};
        }
        
        if (!appData.groceryPurchasePatterns[item.name]) {
            appData.groceryPurchasePatterns[item.name] = [];
        }
        
        // Add purchase date to patterns
        appData.groceryPurchasePatterns[item.name].push({
            date: new Date().toISOString(),
            quantity: item.quantity || '1'
        });
        
        // Keep only the last 10 purchases for patterns
        if (appData.groceryPurchasePatterns[item.name].length > 10) {
            appData.groceryPurchasePatterns[item.name] = 
                appData.groceryPurchasePatterns[item.name].slice(-10);
        }
        
        // Save data and re-render
        saveData();
        renderGrocery();
        
        // Close the modal
        closeModal('expiry-date-modal');
    }
}

// Decrease the quantity of a grocery item
function decreaseGroceryQuantity(event, itemId) {
    // Stop event propagation to prevent card click
    if (event) {
        event.stopPropagation();
        event.preventDefault();
        event.stopImmediatePropagation();
    }
    
    console.log('Decreasing quantity for item ID:', itemId);
    
    // Convert itemId to number if it's a string
    if (typeof itemId === 'string') {
        itemId = parseInt(itemId);
    }
    
    // Find the item with the matching id
    const item = appData.groceries.find(g => g.id === itemId);
    if (item) {
        console.log('Found item to decrease quantity:', item);
        
        // Ensure quantity is a number
        if (typeof item.quantity !== 'number') {
            item.quantity = parseFloat(item.quantity) || 1;
        }
        
        // Decrease quantity by 1
        item.quantity -= 1;
        console.log(`Decreased quantity to ${item.quantity}`);
        
        // If quantity reaches 0, archive the item
        if (item.quantity <= 0) {
            console.log('Quantity is 0 or less, archiving item');
            // Move item to archive
            archiveGroceryItem(itemId);
        } else {
            // Save data and re-render
            saveData();
            renderGrocery();
        }
    } else {
        console.error('Item not found with ID:', itemId);
    }
}

// Increase the quantity of a grocery item
function increaseGroceryQuantity(event, itemId) {
    // Stop event propagation to prevent card click
    if (event) {
        event.stopPropagation();
        event.preventDefault();
        event.stopImmediatePropagation();
    }
    
    console.log('Increasing quantity for item ID:', itemId);
    
    // Convert itemId to number if it's a string
    if (typeof itemId === 'string') {
        itemId = parseInt(itemId);
    }
    
    // Find the item with the matching id
    const item = appData.groceries.find(g => g.id === itemId);
    if (item) {
        console.log('Found item to increase quantity:', item);
        
        // Ensure quantity is a number
        if (typeof item.quantity !== 'number') {
            item.quantity = parseFloat(item.quantity) || 1;
        }
        
        // Increase quantity by 1
        item.quantity += 1;
        console.log(`Increased quantity to ${item.quantity}`);
        
        // Make sure the item is marked as in stock if it wasn't already
        if (!item.inStock) {
            item.inStock = true;
            item.purchaseDate = new Date().toISOString();
            
            // If no expiry date is set, show the expiry date modal
            if (!item.expiryDate || item.expiryDate === '') {
                document.getElementById('expiry-grocery-id').value = itemId;
                const today = new Date();
                const formattedDate = today.toISOString().split('T')[0];
                document.getElementById('expiry-date').value = formattedDate;
                openModal('expiry-date-modal');
                return;
            }
        }
        
        // Save data and re-render
        saveData();
        renderGrocery();
        
        // Show a notification that quantity was increased
        showNotification(`Increased ${item.name} quantity to ${item.quantity}`, 'success');
    } else {
        console.error('Item not found with ID:', itemId);
    }
}

// Archive a grocery item (move to archive and remove from active list)
function archiveGroceryItem(itemId) {
    // Convert itemId to number if it's a string
    if (typeof itemId === 'string') {
        itemId = parseInt(itemId);
    }
    
    // Find the item with the matching id
    const itemIndex = appData.groceries.findIndex(g => g.id === itemId);
    if (itemIndex !== -1) {
        const item = appData.groceries[itemIndex];
        
        // Add archive timestamp
        item.archivedDate = new Date().toISOString();
        
        // Move to archive
        appData.groceryArchive.push(item);
        
        // Remove from active groceries
        appData.groceries.splice(itemIndex, 1);
        
        // Save data and re-render
        saveData();
        renderGrocery();
        
        // Show notification
        showUndoNotification('Item archived', () => {
            // Restore the archived item
            const archivedIndex = appData.groceryArchive.findIndex(g => g.id === itemId);
            if (archivedIndex !== -1) {
                const archivedItem = appData.groceryArchive[archivedIndex];
                // Reset quantity to 1 and remove archived date
                archivedItem.quantity = 1;
                delete archivedItem.archivedDate;
                
                // Move back to active groceries
                appData.groceries.push(archivedItem);
                appData.groceryArchive.splice(archivedIndex, 1);
                
                saveData();
                renderGrocery();
            }
        });
    }
}

// Initialize grocery search functionality
function initializeGrocerySearch() {
    const searchInput = document.getElementById('grocery-search');
    const clearButton = document.getElementById('grocery-search-clear');
    
    if (!searchInput || !clearButton) return;
    
    // Add event listener for search input
    searchInput.addEventListener('input', function() {
        const query = this.value.trim();
        renderGrocery(query);
        
        // Show/hide clear button based on input
        if (query.length > 0) {
            clearButton.style.display = 'flex';
        } else {
            clearButton.style.display = 'none';
        }
    });
    
    // Add event listener for clear button
    clearButton.addEventListener('click', function() {
        searchInput.value = '';
        renderGrocery();
        this.style.display = 'none';
    });
    
    // Initially hide the clear button
    clearButton.style.display = 'none';
}

// Initialize touch swipe for grocery items
function initializeGroceryTouchSwipe() {
    const groceryItems = document.querySelectorAll('.grocery-item');
    
    groceryItems.forEach(item => {
        let startX, startY, moveX, moveY;
        let isMoving = false;
        let isTap = true;
        let startTime;
        const itemId = parseInt(item.dataset.id);
        
        // Touch start event
        item.addEventListener('touchstart', function(e) {
            startX = e.touches[0].clientX;
            startY = e.touches[0].clientY;
            moveX = startX;
            moveY = startY;
            isMoving = false;
            isTap = true;
            startTime = Date.now();
            
            // Add active class for visual feedback
            this.classList.add('grocery-item-active');
        });
        
        // Touch move event
        item.addEventListener('touchmove', function(e) {
            moveX = e.touches[0].clientX;
            moveY = e.touches[0].clientY;
            
            // Calculate distance moved
            const deltaX = moveX - startX;
            const deltaY = moveY - startY;
            
            // If moved more than 10px, it's not a tap
            if (Math.abs(deltaX) > 10 || Math.abs(deltaY) > 10) {
                isTap = false;
            }
            
            // If moved more than 30px horizontally, it's a swipe
            if (Math.abs(deltaX) > 30 && Math.abs(deltaY) < 30) {
                isMoving = true;
                this.style.transform = `translateX(${deltaX}px)`;
                e.preventDefault(); // Prevent scrolling when swiping
            }
        });
        
        // Touch end event
        item.addEventListener('touchend', function(e) {
            this.classList.remove('grocery-item-active');
            
            const deltaX = moveX - startX;
            const touchDuration = Date.now() - startTime;
            
            // If it was a tap (minimal movement and short duration)
            if (isTap && touchDuration < 300) {
                editGroceryItem(itemId);
            }
            // If it was a swipe left (delete)
            else if (isMoving && deltaX < -100) {
                this.style.transform = 'translateX(-100%)';
                this.style.opacity = '0';
                setTimeout(() => {
                    deleteGroceryItem(itemId, true); // true for showing undo option
                }, 300);
            }
            // Reset position if not a complete swipe
            else {
                this.style.transform = 'translateX(0)';
            }
        });
        
        // Mouse events for desktop
        item.addEventListener('click', function(e) {
            // Only trigger if it's not from a child element with its own click handler
            if (e.target === this || e.target.classList.contains('grocery-content') || 
                e.target.classList.contains('grocery-name') || e.target.classList.contains('grocery-meta')) {
                editGroceryItem(itemId);
            }
        });
    });
    
    // Initialize sortable for grocery items
    initializeGrocerySortable();
}

// Initialize sortable for grocery items
function initializeGrocerySortable() {
    const sortableLists = document.querySelectorAll('.sortable-grocery');
    
    sortableLists.forEach(list => {
        new Sortable(list, {
            animation: 150,
            ghostClass: 'grocery-dragging-ghost',
            chosenClass: 'grocery-dragging-chosen',
            dragClass: 'grocery-dragging-drag',
            handle: '.grocery-item',
            onEnd: function(evt) {
                // Update the order of grocery items in appData
                const group = evt.to.dataset.group;
                const items = Array.from(evt.to.querySelectorAll('.grocery-item'));
                
                // Reorder the items based on their new positions
                const newOrder = items.map(item => parseInt(item.dataset.id));
                
                // Update appData.groceries to match the new order
                const reorderedGroceries = [];
                
                // First add items in the new order
                newOrder.forEach(id => {
                    const item = appData.groceries.find(g => g.id === id);
                    if (item) reorderedGroceries.push(item);
                });
                
                // Then add any remaining items that weren't in this group
                appData.groceries.forEach(item => {
                    if (!newOrder.includes(item.id)) {
                        reorderedGroceries.push(item);
                    }
                });
                
                appData.groceries = reorderedGroceries;
                saveData();
            }
        });
    });
}

// Initialize touch swipe for grocery items
function initializeGroceryTouchSwipe() {
    const groceryItems = document.querySelectorAll('.grocery-item');
    
    groceryItems.forEach(item => {
        let startX, startY, moveX, moveY;
        let isMoving = false;
        let isTap = true;
        let startTime;
        const itemId = parseInt(item.dataset.id);
        
        // Touch start event
        item.addEventListener('touchstart', function(e) {
            startX = e.touches[0].clientX;
            startY = e.touches[0].clientY;
            moveX = startX;
            moveY = startY;
            isMoving = false;
            isTap = true;
            startTime = Date.now();
            
            // Add active class for visual feedback
            this.classList.add('grocery-item-active');
        });
        
        // Touch move event
        item.addEventListener('touchmove', function(e) {
            moveX = e.touches[0].clientX;
            moveY = e.touches[0].clientY;
            
            // Calculate distance moved
            const deltaX = moveX - startX;
            const deltaY = moveY - startY;
            
            // If moved more than 10px, it's not a tap
            if (Math.abs(deltaX) > 10 || Math.abs(deltaY) > 10) {
                isTap = false;
            }
            
            // If moved more than 30px horizontally, it's a swipe
            if (Math.abs(deltaX) > 30 && Math.abs(deltaY) < 30) {
                isMoving = true;
                this.style.transform = `translateX(${deltaX}px)`;
                e.preventDefault(); // Prevent scrolling when swiping
            }
        });
        
        // Touch end event
        item.addEventListener('touchend', function(e) {
            this.classList.remove('grocery-item-active');
            
            const deltaX = moveX - startX;
            const touchDuration = Date.now() - startTime;
            
            // If it was a tap (minimal movement and short duration)
            if (isTap && touchDuration < 300) {
                editGroceryItem(itemId);
            }
            // If it was a swipe left (delete)
            else if (isMoving && deltaX < -100) {
                this.style.transform = 'translateX(-100%)';
                this.style.opacity = '0';
                setTimeout(() => {
                    deleteGroceryItem(itemId, true); // true for showing undo option
                }, 300);
            }
            // Reset position if not a complete swipe
            else {
                this.style.transform = 'translateX(0)';
            }
        });
        
        // Mouse events for desktop
        item.addEventListener('click', function(e) {
            // Only trigger if it's not from a child element with its own click handler
            if (e.target === this || e.target.classList.contains('grocery-content') || 
                e.target.classList.contains('grocery-name') || e.target.classList.contains('grocery-meta')) {
                editGroceryItem(itemId);
            }
        });
    });
    
    // Initialize sortable for grocery items
    initializeGrocerySortable();
}

// Initialize sortable for grocery items
function initializeGrocerySortable() {
    const sortableLists = document.querySelectorAll('.sortable-grocery');
    
    sortableLists.forEach(list => {
        new Sortable(list, {
            animation: 150,
            ghostClass: 'grocery-dragging-ghost',
            chosenClass: 'grocery-dragging-chosen',
            dragClass: 'grocery-dragging-drag',
            handle: '.grocery-item',
            onEnd: function(evt) {
                // Update the order of grocery items in appData
                const group = evt.to.dataset.group;
                const items = Array.from(evt.to.querySelectorAll('.grocery-item'));
                
                // Reorder the items based on their new positions
                const newOrder = items.map(item => parseInt(item.dataset.id));
                
                // Update appData.groceries to match the new order
                const reorderedGroceries = [];
                
                // First add items in the new order
                newOrder.forEach(id => {
                    const item = appData.groceries.find(g => g.id === id);
                    if (item) reorderedGroceries.push(item);
                });
                
                // Then add any remaining items that weren't in this group
                appData.groceries.forEach(item => {
                    if (!newOrder.includes(item.id)) {
                        reorderedGroceries.push(item);
                    }
                });
                
                appData.groceries = reorderedGroceries;
                saveData();
            }
        });
    });
}
