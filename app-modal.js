/**
 * Generic Modal System
 * This file contains functions for handling the generic edit modal
 * that can be used for tasks, grocery items, and other content types.
 */

// Modal field templates for different item types
const modalTemplates = {
    task: {
        title: 'Edit Task',
        fields: `
            <div class="form-group">
                <label for="edit-field-title">Task Title</label>
                <input type="text" id="edit-field-title" required>
            </div>
            <div class="form-group">
                <label for="edit-field-category">Category</label>
                <select id="edit-field-category">
                    <option value="Personal">Personal</option>
                    <option value="Work">Work</option>
                    <option value="Shopping">Shopping</option>
                    <option value="Health">Health</option>
                    <option value="Finance">Finance</option>
                </select>
            </div>
            <div class="form-group">
                <label for="edit-field-due-date">Due Date</label>
                <input type="date" id="edit-field-due-date">
            </div>
            <div class="form-group">
                <label for="edit-field-due-time">Time</label>
                <input type="time" id="edit-field-due-time">
            </div>
            <div class="form-group">
                <label for="edit-field-repeat">Repeat</label>
                <select id="edit-field-repeat">
                    <option value="never">Never</option>
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                </select>
            </div>
            <div class="form-group">
                <label>
                    <input type="checkbox" id="edit-field-completed">
                    Mark as completed
                </label>
            </div>
        `
    },
    grocery: {
        title: 'Edit Grocery Item',
        fields: `
            <div class="form-group">
                <label for="edit-field-name">Item Name</label>
                <input type="text" id="edit-field-name" required>
            </div>
            <div class="form-group">
                <label for="edit-field-quantity">Quantity</label>
                <input type="text" id="edit-field-quantity">
            </div>
            <div class="form-group">
                <label for="edit-field-expiry">Expiry Date</label>
                <input type="date" id="edit-field-expiry">
            </div>
            <div class="form-group">
                <label for="edit-field-category">Category</label>
                <select id="edit-field-category">
                    <option value="Produce">Produce</option>
                    <option value="Dairy">Dairy</option>
                    <option value="Meat">Meat</option>
                    <option value="Pantry">Pantry</option>
                    <option value="Frozen">Frozen</option>
                    <option value="Snacks">Snacks</option>
                    <option value="Beverages">Beverages</option>
                    <option value="Other">Other</option>
                </select>
            </div>
            <div class="form-group">
                <label>
                    <input type="checkbox" id="edit-field-in-stock" checked>
                    In Stock
                </label>
            </div>
        `
    }
};

/**
 * Open the edit modal for a specific item type and ID
 * @param {string} itemType - The type of item (task, grocery, etc.)
 * @param {number|string} itemId - The ID of the item to edit
 */
function openEditModal(itemType, itemId) {
    // Set the modal title and item type
    document.getElementById('edit-modal-title').textContent = modalTemplates[itemType].title;
    document.getElementById('edit-item-type').value = itemType;
    document.getElementById('edit-item-id').value = itemId;
    
    // Set the form fields based on the item type
    document.getElementById('edit-form-fields').innerHTML = modalTemplates[itemType].fields;
    
    // Populate the form fields with the item data
    populateEditForm(itemType, itemId);
    
    // Open the modal
    openModal('edit-modal');
}

/**
 * Populate the edit form with data from the specified item
 * @param {string} itemType - The type of item (task, grocery, etc.)
 * @param {number|string} itemId - The ID of the item to edit
 */
function populateEditForm(itemType, itemId) {
    if (itemType === 'task') {
        const task = appData.tasks.find(t => t.id === parseInt(itemId));
        if (task) {
            document.getElementById('edit-field-title').value = task.title || '';
            document.getElementById('edit-field-category').value = task.category || 'Personal';
            
            if (task.dueDate) {
                const dueDate = new Date(task.dueDate);
                const dateStr = dueDate.toISOString().split('T')[0];
                const timeStr = dueDate.toTimeString().substring(0, 5);
                
                document.getElementById('edit-field-due-date').value = dateStr;
                document.getElementById('edit-field-due-time').value = timeStr;
            } else {
                document.getElementById('edit-field-due-date').value = '';
                document.getElementById('edit-field-due-time').value = '';
            }
            
            document.getElementById('edit-field-repeat').value = task.repeat || 'never';
            document.getElementById('edit-field-completed').checked = task.completed || false;
        }
    } else if (itemType === 'grocery') {
        const item = appData.groceries.find(g => g.id === parseInt(itemId));
        if (item) {
            document.getElementById('edit-field-name').value = item.name || '';
            document.getElementById('edit-field-quantity').value = item.quantity || '';
            document.getElementById('edit-field-category').value = item.category || 'Other';
            
            if (item.expiryDate) {
                document.getElementById('edit-field-expiry').value = item.expiryDate;
            } else {
                document.getElementById('edit-field-expiry').value = '';
            }
            
            document.getElementById('edit-field-in-stock').checked = item.inStock !== undefined ? item.inStock : true;
        }
    }
}

/**
 * Save the edited item data
 * @param {Event} event - The form submit event
 */
function saveEditedItem(event) {
    event.preventDefault();
    
    const itemType = document.getElementById('edit-item-type').value;
    const itemId = parseInt(document.getElementById('edit-item-id').value);
    
    console.log(`Saving ${itemType} with ID ${itemId}`);
    
    if (itemType === 'task') {
        saveEditedTask(itemId);
    } else if (itemType === 'grocery') {
        saveEditedGroceryItem(itemId);
    }
    
    // Close the modal
    closeModal('edit-modal');
}

/**
 * Save the edited task data
 * @param {number} taskId - The ID of the task to save
 */
function saveEditedTask(taskId) {
    const task = appData.tasks.find(t => t.id === taskId);
    if (task) {
        task.title = document.getElementById('edit-field-title').value;
        task.category = document.getElementById('edit-field-category').value;
        
        const dateStr = document.getElementById('edit-field-due-date').value;
        const timeStr = document.getElementById('edit-field-due-time').value;
        
        if (dateStr) {
            if (timeStr) {
                task.dueDate = new Date(`${dateStr}T${timeStr}`).toISOString();
            } else {
                task.dueDate = new Date(`${dateStr}T00:00:00`).toISOString();
            }
        } else {
            task.dueDate = null;
        }
        
        task.repeat = document.getElementById('edit-field-repeat').value;
        task.completed = document.getElementById('edit-field-completed').checked;
        
        saveData();
        renderTasks();
    }
}

/**
 * Save the edited grocery item data
 * @param {number} itemId - The ID of the grocery item to save
 */
function saveEditedGroceryItem(itemId) {
    console.log('Saving grocery item with ID:', itemId);
    console.log('appData.groceries:', appData.groceries);
    
    // Make sure we're using the correct ID format
    const id = parseInt(itemId);
    const item = appData.groceries.find(g => g.id === id);
    
    console.log('Found item:', item);
    
    if (item) {
        // Get form field values with error handling
        try {
            const nameField = document.getElementById('edit-field-name');
            const quantityField = document.getElementById('edit-field-quantity');
            const categoryField = document.getElementById('edit-field-category');
            const expiryField = document.getElementById('edit-field-expiry');
            const inStockField = document.getElementById('edit-field-in-stock');
            
            console.log('Form fields:', {
                name: nameField ? nameField.value : 'field not found',
                quantity: quantityField ? quantityField.value : 'field not found',
                category: categoryField ? categoryField.value : 'field not found',
                expiry: expiryField ? expiryField.value : 'field not found',
                inStock: inStockField ? inStockField.checked : 'field not found'
            });
            
            // Update the item with the form values
            if (nameField) item.name = nameField.value;
            if (quantityField) item.quantity = quantityField.value;
            if (categoryField) item.category = categoryField.value;
            if (expiryField) item.expiryDate = expiryField.value || null;
            if (inStockField) item.inStock = inStockField.checked;
            
            console.log('Updated item:', item);
            
            // Save and render
            saveData();
            renderGrocery();
            console.log('Grocery item saved successfully');
        } catch (error) {
            console.error('Error saving grocery item:', error);
        }
    } else {
        console.error('Grocery item not found with ID:', id);
    }
}

/**
 * Delete the current item being edited
 */
function deleteItem() {
    const itemType = document.getElementById('edit-item-type').value;
    const itemId = parseInt(document.getElementById('edit-item-id').value);
    
    if (itemType === 'task') {
        deleteTask(itemId);
    } else if (itemType === 'grocery') {
        deleteGroceryItem(itemId);
    }
    
    // Close the modal
    closeModal('edit-modal');
}

// Set up event listeners when the DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    console.log('Setting up modal event listeners');
    
    // Make sure the edit form uses the saveEditedItem function
    const editForm = document.getElementById('edit-form');
    if (editForm) {
        // Remove any existing listeners to avoid duplicates
        const newEditForm = editForm.cloneNode(true);
        editForm.parentNode.replaceChild(newEditForm, editForm);
        
        // Add the submit event listener
        newEditForm.addEventListener('submit', saveEditedItem);
        console.log('Edit form submit handler attached');
    }
});
