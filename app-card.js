/**
 * Card Component System
 * A reusable card component system for creating consistent interactive cards across the application.
 */

// Card Factory - Creates and manages card instances
class CardFactory {
    constructor() {
        this.cardTypes = {};
        console.log('Card Factory initialized');
    }

    // Register a new card type
    registerCardType(type, config) {
        this.cardTypes[type] = config;
        console.log(`Registered card type: ${type}`);
    }

    // Create a new card instance
    createCard(type, data, container) {
        if (!this.cardTypes[type]) {
            console.error(`Card type "${type}" not registered`);
            return null;
        }

        const config = this.cardTypes[type];
        const card = new Card(type, data, config);
        
        if (container) {
            container.appendChild(card.render());
        }
        
        return card;
    }

    // Render multiple cards
    renderCards(type, dataArray, container) {
        if (!container) {
            console.error('Container is null or undefined');
            return;
        }
        
        console.log(`Rendering ${dataArray.length} ${type} cards`);
        
        // Clear the container
        container.innerHTML = '';
        
        // Create a document fragment for better performance
        const fragment = document.createDocumentFragment();
        
        // Create and append each card
        dataArray.forEach(data => {
            const card = new Card(type, data, this.cardTypes[type]);
            if (card) {
                fragment.appendChild(card.render());
            }
        });
        
        // Append all cards at once
        container.appendChild(fragment);
        
        // Initialize interactions
        this.initializeCardInteractions(container);
    }
    
    // Initialize interactions for all cards in a container
    initializeCardInteractions(container) {
        const cards = container.querySelectorAll('.card-item');
        
        cards.forEach(cardElement => {
            const type = cardElement.dataset.cardType;
            const config = this.cardTypes[type];
            
            if (!config) return;
            
            // Initialize touch swipe
            this.initializeTouchSwipe(cardElement, config);
            
            // Initialize sortable if container has sortable class
            if (cardElement.parentElement.classList.contains('sortable-container')) {
                this.initializeSortable(cardElement.parentElement, config);
            }
        });
    }
    
    // Initialize card interactions
    initializeTouchSwipe(cardElement, config) {
        // Get the item ID and ensure it's properly formatted based on card type
        let itemId = cardElement.dataset.id;
        const cardType = cardElement.dataset.cardType;
        
        // For grocery items, make sure we have a valid ID
        if (cardType === 'grocery' && (itemId === undefined || itemId === null || itemId === '')) {
            console.error('Invalid grocery item ID, assigning a temporary ID');
            itemId = 'temp-' + Date.now();
            cardElement.dataset.id = itemId;
        }
        
        // Log the card type and ID for debugging
        console.log(`Initializing card: ${cardType} with ID: ${itemId}`);
        
        // Add a dedicated click handler that takes precedence over drag
        const clickHandler = function(e) {
            // Skip if the click was on the task checkbox or its wrapper
            if (e.target.classList.contains('task-checkbox') || 
                e.target.classList.contains('task-checkbox-wrapper') ||
                e.target.closest('.task-checkbox-wrapper')) {
                return true; // Allow the event to bubble up to the checkbox's own handler
            }
            
            // Only trigger if it's not from a child element with its own click handler
            if (e.target === this || 
                e.target.classList.contains('card-content') || 
                e.target.classList.contains('card-title') || 
                e.target.classList.contains('card-meta') ||
                e.target.tagName === 'SPAN' || 
                e.target.tagName === 'DIV') {
                
                // Prevent default to avoid conflicts with Sortable
                e.preventDefault();
                e.stopPropagation();
                
                // Call the tap handler with the item ID, but first ensure it's not NaN
                if (config.onTap) {
                    // For grocery items, make sure we never pass NaN
                    if (cardType === 'grocery') {
                        // If itemId is not a valid string, use a fallback approach
                        if (itemId === undefined || itemId === null || itemId === '' || itemId === 'NaN' || itemId === 'undefined') {
                            console.error('Invalid ID detected in click handler, using fallback');
                            // Try to find a valid grocery item from appData
                            if (window.appData && window.appData.groceries && window.appData.groceries.length > 0) {
                                const firstItem = window.appData.groceries[0];
                                console.log('Using first grocery item as fallback:', firstItem.id);
                                config.onTap(firstItem.id);
                            } else {
                                console.error('No grocery items available for fallback');
                            }
                            return;
                        }
                    }
                    
                    // If we got here, the ID should be valid
                    config.onTap(itemId);
                }
                
                return false;
            }
        };
        
        // Add click handler with capture phase to ensure it runs first
        cardElement.addEventListener('click', clickHandler, true);
        
        // Visual feedback for active state
        cardElement.addEventListener('mousedown', function() {
            this.classList.add('card-item-active');
        });
        
        cardElement.addEventListener('mouseup', function() {
            this.classList.remove('card-item-active');
        });
        
        cardElement.addEventListener('mouseleave', function() {
            this.classList.remove('card-item-active');
        });
        
        // Touch feedback
        cardElement.addEventListener('touchstart', function() {
            this.classList.add('card-item-active');
        });
        
        cardElement.addEventListener('touchend', function() {
            this.classList.remove('card-item-active');
        });
        
        cardElement.addEventListener('touchcancel', function() {
            this.classList.remove('card-item-active');
        });
    }
    
    // Initialize sortable for a container
    initializeSortable(container, config) {
        if (!window.Sortable) {
            console.error('Sortable.js is required for drag functionality');
            return;
        }
        
        console.log('Initializing Sortable for container:', container.id || container.className);
        
        // Create a new Sortable instance with a simpler configuration
        const sortable = new Sortable(container, {
            animation: 150,
            handle: '.card-drag-handle',
            ghostClass: 'sortable-ghost',
            chosenClass: 'sortable-chosen',
            dragClass: 'sortable-drag',
            // Use simpler configuration with fewer options
            delay: 0,
            delayOnTouchOnly: false,
            
            // Use a smaller distance threshold for more precise dragging
            distance: 5,
            
            // Set the drag handle offset to match mouse position better
            setData: function(dataTransfer, dragEl) {
                dataTransfer.setDragImage(dragEl, 10, 10); // Adjust the offset
            },
            
            // Add visual feedback during dragging
            onStart: function(evt) {
                const item = evt.item;
                item.classList.add('card-dragging');
                document.body.classList.add('dragging-active'); // Add class to body to prevent other interactions
            },
            
            // Remove visual feedback after dragging
            onEnd: function(evt) {
                const item = evt.item;
                item.classList.remove('card-dragging');
                document.body.classList.remove('dragging-active');
                
                // Only process reordering if the item was actually moved
                if (evt.oldIndex !== evt.newIndex || evt.from !== evt.to) {
                    // Add a small delay before saving the new order to ensure UI is updated first
                    setTimeout(() => {
                        if (config.onReorder) {
                            // Get unique IDs to prevent duplicates
                            const items = Array.from(evt.to.querySelectorAll('.card-item'));
                            const uniqueIds = [];
                            
                            // Only add IDs that haven't been seen before
                            items.forEach(item => {
                                const id = item.dataset.id;
                                if (!uniqueIds.includes(id)) {
                                    uniqueIds.push(id);
                                }
                            });
                            
                            // Call the onReorder callback with the unique IDs
                            config.onReorder(uniqueIds, evt.to.dataset.group);
                        }
                    }, 50);
                }
            }
        });
    }
}

// Card class - Represents a single card instance
class Card {
    constructor(type, data, config) {
        this.type = type;
        this.data = data;
        this.config = config || {};
        this.element = null;
    }
    
    // Render the card
    render() {
        // Check if config is available
        if (!this.config) {
            console.error(`Config for card type "${this.type}" is not available`);
            // Create a basic card as fallback
            const basicCard = document.createElement('div');
            basicCard.className = 'card-item';
            basicCard.dataset.id = this.data.id;
            basicCard.dataset.cardType = this.type;
            basicCard.textContent = this.data.title || this.data.name || 'Card';
            return basicCard;
        }
        
        // Create card element
        const card = document.createElement('div');
        card.className = `card-item ${this.config.className || ''}`;
        
        // Ensure card has proper positioning for drag handle
        card.style.position = 'relative'; // Important for absolute positioning of drag handle
        
        // Ensure ID is properly set as a string for grocery items or number for tasks
        if (this.type === 'grocery') {
            // For grocery items, ensure ID is a string
            card.dataset.id = String(this.data.id);
            console.log('Setting grocery card ID:', card.dataset.id);
        } else {
            // For other card types (like tasks), use the ID as is
            card.dataset.id = this.data.id;
        }
        
        card.dataset.cardType = this.type;
        
        // Add a dedicated drag handle with improved interactivity
        const dragHandle = document.createElement('div');
        dragHandle.className = 'card-drag-handle';
        dragHandle.innerHTML = `
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <line x1="8" y1="6" x2="16" y2="6"></line>
                <line x1="8" y1="12" x2="16" y2="12"></line>
                <line x1="8" y1="18" x2="16" y2="18"></line>
            </svg>
        `;
        
        // Prevent click events from bubbling up from the drag handle
        dragHandle.addEventListener('mousedown', function(e) {
            e.stopPropagation();
        });
        
        dragHandle.addEventListener('touchstart', function(e) {
            e.stopPropagation();
        });
        card.appendChild(dragHandle);
        
        // For task cards, create a special structure with checkbox
        if (this.type === 'task') {
            // Create a relative positioned container for proper positioning
            const cardContainer = document.createElement('div');
            cardContainer.className = 'task-card-container';
            card.appendChild(cardContainer);
            
            // Add checkbox wrapper inside the container
            const checkboxWrapper = document.createElement('div');
            checkboxWrapper.className = 'task-checkbox-wrapper';
            cardContainer.appendChild(checkboxWrapper);
            
            // Add checkbox
            const checkbox = document.createElement('div');
            checkbox.className = `task-checkbox ${this.data.completed ? 'completed' : ''}`;
            checkbox.dataset.taskId = this.data.id;
            checkbox.onclick = (event) => toggleTaskCompletion(event, this.data.id);
            checkboxWrapper.appendChild(checkbox);
            
            // Create content container
            const content = document.createElement('div');
            content.className = 'card-content task-content';
            cardContainer.appendChild(content);
            
            // Add title
            if (this.config.renderTitle) {
                const title = document.createElement('div');
                title.className = 'card-title task-title';
                title.classList.toggle('completed', this.data.completed);
                title.innerHTML = this.config.renderTitle(this.data);
                content.appendChild(title);
            } else {
                // Fallback title
                const title = document.createElement('div');
                title.className = 'card-title task-title';
                title.textContent = this.data.title || this.data.name || 'Card';
                content.appendChild(title);
            }
            
            // Add metadata
            if (this.config.renderMeta) {
                const meta = document.createElement('div');
                meta.className = 'card-meta';
                meta.innerHTML = this.config.renderMeta(this.data);
                content.appendChild(meta);
            }
        } else {
            // Standard card layout for non-task cards
            // Create content container
            const content = document.createElement('div');
            content.className = 'card-content';
            card.appendChild(content);
            
            // Add title
            if (this.config.renderTitle) {
                const title = document.createElement('div');
                title.className = 'card-title';
                title.innerHTML = this.config.renderTitle(this.data);
                content.appendChild(title);
            } else {
                // Fallback title
                const title = document.createElement('div');
                title.className = 'card-title';
                title.textContent = this.data.title || this.data.name || 'Card';
                content.appendChild(title);
            }
            
            // Add metadata
            if (this.config.renderMeta) {
                const meta = document.createElement('div');
                meta.className = 'card-meta';
                meta.innerHTML = this.config.renderMeta(this.data);
                content.appendChild(meta);
            }
        }
        
        // Add hint text
        const hint = document.createElement('div');
        hint.className = 'card-hint';
        hint.textContent = this.config.hintText || 'Tap to edit • Swipe to delete • Drag to reorder';
        card.appendChild(hint);
        
        // Add custom widgets if defined
        if (this.config.renderWidgets) {
            const widgets = this.config.renderWidgets(this.data);
            if (widgets) {
                card.appendChild(widgets);
            }
        }
        
        this.element = card;
        return card;
    }
    
    // Update the card data and re-render
    update(newData) {
        this.data = {...this.data, ...newData};
        if (this.element && this.element.parentNode) {
            const newElement = this.render();
            this.element.parentNode.replaceChild(newElement, this.element);
        }
    }
}

// Create global card factory instance
const cardFactory = new CardFactory();

// Register task card type immediately
cardFactory.registerCardType('task', {
    className: 'task-card',
    hintText: 'Tap to edit • Drag to reorder',
    
    renderTitle: (data) => {
        // Just return the title text, the structure is handled in the Card class
        return `<div class="${data.completed ? 'completed' : ''}">${data.title}</div>`;
    },
    
    renderMeta: (data) => {
        let meta = '';
        
        if (data.dueDate) {
            meta += `<span class="card-datetime">
                <span class="card-date">📅 ${formatDateTime(data.dueDate).split(' at ')[0]}</span>
                <span class="card-time">⏰ ${formatDateTime(data.dueDate).split(' at ')[1]}</span>
            </span>`;
        }
        
        if (data.category) {
            meta += `<span class="card-tag">${data.category}</span>`;
        }
        
        if (data.repeat && data.repeat !== 'never') {
            meta += `<span class="card-repeat">🔄 ${data.repeat}</span>`;
        }
        
        return meta;
    },
    
    onTap: (id) => {
        editTask(parseInt(id));
    },
    
    onSwipeLeft: (id, showUndo) => {
        deleteTask(parseInt(id), showUndo);
    },
    
    onReorder: (newOrder, group) => {
        // Convert string IDs to integers
        const intIds = newOrder.map(id => parseInt(id));
        reorderTasks(intIds);
    }
});

// Register grocery card type immediately
cardFactory.registerCardType('grocery', {
    className: 'grocery-card',
    hintText: 'Tap to edit • Drag to reorder',
    
    renderTitle: (data) => {
        // Don't add 'out-of-stock' class to shopping list items
        return `<div>${data.name} ${data.quantity ? `<span class="quantity">(${data.quantity})</span>` : ''}</div>`;
    },
    
    renderMeta: (data) => {
        let meta = '';
        
        // Add expiry date with improved styling
        if (data.expiryDate && data.inStock) {
            const daysUntil = getDaysUntilExpiry(data.expiryDate);
            
            // Different messages based on days until expiry
            let expiryMessage = '';
            let expiryClass = 'card-expiry';
            
            if (daysUntil < 0) {
                expiryMessage = `⚠️ Expired!`;
                expiryClass = 'card-expiry-expired';
            } else if (daysUntil === 0) {
                expiryMessage = `⚠️ Expiring today`;
                expiryClass = 'card-expiry-soon';
            } else if (daysUntil === 1) {
                expiryMessage = `🔔 Expiring tomorrow`;
                expiryClass = 'card-expiry-soon';
            } else if (daysUntil <= 3) {
                expiryMessage = `🔔 Expires in ${daysUntil} days`;
                expiryClass = 'card-expiry-soon';
            } else {
                expiryMessage = `📅 Expires: ${formatDate(data.expiryDate)}`;
            }
            
            meta += `<span class="card-expiry ${expiryClass}">
                ${expiryMessage}
            </span>`;
        }
        
        // Add stock status with improved styling
        if (!data.inStock) {
            meta += `<span class="card-shopping-list">
                🛒 Shopping List
            </span>`;
        } else {
            meta += `<span class="card-in-stock">
                ✅ In Stock
            </span>`;
        }
        
        // Add category if available
        if (data.category) {
            meta += `<span class="card-tag">${data.category}</span>`;
        }
        
        return meta;
    },
    
    onTap: (id) => {
        // Convert to number to match how tasks work
        const numId = parseInt(id);
        editGroceryItem(numId);
    },
    
    onSwipeLeft: (id, showUndo) => {
        // Convert to number to match how tasks work
        const numId = parseInt(id);
        deleteGroceryItem(numId, showUndo);
    },
    
    onReorder: (newOrder, group) => {
        console.log('Grocery card onReorder called with:', newOrder, 'group:', group);
        
        // Validate the newOrder array
        if (!Array.isArray(newOrder) || newOrder.length === 0) {
            console.error('Invalid newOrder array in onReorder handler');
            return;
        }
        
        // Convert string IDs to numbers and filter out any invalid IDs
        const numericIds = newOrder
            .map(id => {
                const numId = parseInt(id);
                if (isNaN(numId)) {
                    console.error('Invalid ID in onReorder:', id);
                    return null;
                }
                return numId;
            })
            .filter(id => id !== null);
        
        if (numericIds.length === 0) {
            console.error('No valid IDs found in onReorder');
            return;
        }
        
        // Call the reorder function with the validated numeric IDs
        reorderGroceryItems(numericIds, group);
    }
});

// Add a DOMContentLoaded event listener for any additional initialization
document.addEventListener('DOMContentLoaded', () => {
    console.log('Card types registered successfully');
});

// Helper function to reorder tasks
function reorderTasks(newOrder) {
    // Reorder the tasks based on their new positions
    const reorderedTasks = [];
    
    // First add tasks in the new order
    newOrder.forEach(id => {
        const task = appData.tasks.find(t => t.id === parseInt(id));
        if (task) reorderedTasks.push(task);
    });
    
    // Then add any remaining tasks that weren't in this group
    appData.tasks.forEach(task => {
        if (!newOrder.includes(task.id.toString())) {
            reorderedTasks.push(task);
        }
    });
    
    appData.tasks = reorderedTasks;
    saveData();
}

// Helper function to reorder grocery items
function reorderGroceryItems(newOrder, group) {
    console.log('Reordering grocery items:', newOrder, 'group:', group);
    
    // Ensure we have valid data
    if (!Array.isArray(appData.groceries)) {
        console.error('appData.groceries is not an array');
        return;
    }
    
    if (!Array.isArray(newOrder) || newOrder.length === 0) {
        console.error('Invalid newOrder array:', newOrder);
        return;
    }
    
    // Create a new array to hold the reordered items
    const reorderedGroceries = [];
    
    // Convert all IDs to numbers and log them for debugging
    const numericIds = newOrder.map(id => {
        const numId = parseInt(id);
        console.log(`Converting ID ${id} to number: ${numId}`);
        return numId;
    });
    
    // First add items in the new order
    numericIds.forEach(numId => {
        if (isNaN(numId)) {
            console.error('Invalid numeric ID:', numId);
            return;
        }
        
        const item = appData.groceries.find(g => g.id === numId);
        if (item) {
            console.log(`Found item with ID ${numId}:`, item.name);
            reorderedGroceries.push(item);
        } else {
            console.error(`Item with ID ${numId} not found`);
        }
    });
    
    // Then add any remaining items that weren't in this group
    appData.groceries.forEach(item => {
        if (!numericIds.includes(item.id)) {
            console.log(`Adding remaining item with ID ${item.id}:`, item.name);
            reorderedGroceries.push(item);
        }
    });
    
    console.log('Reordered groceries:', reorderedGroceries.map(g => g.name));
    
    // Update the groceries array
    appData.groceries = reorderedGroceries;
    saveData();
}
