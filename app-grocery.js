// Render grocery list
function renderGrocery() {
    const groceryContainer = document.getElementById('grocery-container');
    
    // Log all grocery items for debugging
    console.log('All grocery items:', appData.groceries);
    
    // Group items by status
    const expiredItems = appData.groceries.filter(item => 
        item.inStock === true && 
        item.expiryDate && 
        getDaysUntilExpiry(item.expiryDate) < 0
    );
    
    const expiringItems = appData.groceries.filter(item => 
        item.inStock === true && 
        item.expiryDate && 
        getDaysUntilExpiry(item.expiryDate) >= 0 &&
        getDaysUntilExpiry(item.expiryDate) <= 3
    );
    
    const shoppingList = appData.groceries.filter(item => 
        item.inStock === false
    );
    
    const inStockItems = appData.groceries.filter(item => 
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
function toggleGroceryItem(itemId) {
    const item = appData.groceries.find(g => g.id === itemId);
    if (item) {
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
    const item = appData.groceries.find(g => g.id === parseInt(itemId));
    if (!item) return;
    
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

function addGroceryItem(event) {
    event.preventDefault();
    
    // Create the new item with explicit boolean values
    const item = {
        id: Date.now(),
        name: document.getElementById('grocery-name').value,
        category: document.getElementById('grocery-category').value || 'Other',
        expiryDate: document.getElementById('grocery-expiry').value || null,
        quantity: document.getElementById('grocery-quantity').value || null,
        inStock: true, // New items are in stock by default
        addedToList: false
    };
    
    console.log('Adding new grocery item:', item);
    
    appData.groceries.push(item);
    saveData();
    renderGrocery();
    closeModal('grocery-modal');
    document.getElementById('add-grocery-form').reset();
}

// Edit grocery item
function editGroceryItem(itemId) {
    const item = appData.groceries.find(g => g.id === itemId);
    if (!item) return;
    
    // Populate the edit form
    document.getElementById('edit-grocery-id').value = item.id;
    document.getElementById('edit-grocery-name').value = item.name;
    document.getElementById('edit-grocery-expiry').value = item.expiryDate || '';
    document.getElementById('edit-grocery-quantity').value = item.quantity || '';
    
    // Show the edit modal
    openModal('edit-grocery-modal');
}

// Save edited grocery item
function saveEditedGroceryItem(event) {
    event.preventDefault();
    
    const itemId = parseInt(document.getElementById('edit-grocery-id').value);
    const item = appData.groceries.find(g => g.id === itemId);
    
    if (item) {
        // Get form values
        const name = document.getElementById('edit-grocery-name').value;
        const quantity = document.getElementById('edit-grocery-quantity').value;
        const category = document.getElementById('edit-grocery-category').value;
        const expiryDate = document.getElementById('edit-grocery-expiry').value || null;
        const inStock = document.getElementById('edit-grocery-in-stock').checked;
        
        console.log('Saving grocery item:', {
            id: itemId,
            name,
            inStock,
            'checkbox value': document.getElementById('edit-grocery-in-stock').checked
        });
        
        // Update the item with explicit boolean values
        item.name = name;
        item.quantity = quantity;
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
        return;
    }
    
    // Make sure all grocery items have proper boolean values for inStock
    appData.groceries.forEach(item => {
        // Convert any non-boolean inStock values to proper booleans
        if (typeof item.inStock !== 'boolean') {
            item.inStock = Boolean(item.inStock);
            dataFixed = true;
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
    
    // Register event listeners
    document.getElementById('add-grocery-form').addEventListener('submit', addGroceryItem);
    document.getElementById('edit-grocery-form').addEventListener('submit', saveEditedGroceryItem);
    
    // Initial render
    renderGrocery();
});

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
