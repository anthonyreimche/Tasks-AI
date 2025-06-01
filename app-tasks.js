// Task management functions
// This file handles all task-related functionality

// Render tasks
function renderTasks() {
    const tasksContainer = document.getElementById('tasks-container');
    
    // Group tasks by date
    let overdueTasks = [];
    let todayTasks = [];
    let tomorrowTasks = [];
    let futureTasks = [];
    let noDateTasks = [];
    let completedTasks = [];
    
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    appData.tasks.forEach(task => {
        if (task.completed) {
            completedTasks.push(task);
            return;
        }
        
        if (!task.dueDate) {
            noDateTasks.push(task);
            return;
        }
        
        const dueDate = new Date(task.dueDate);
        dueDate.setHours(0, 0, 0, 0);
        
        if (dueDate < now) {
            overdueTasks.push(task);
        } else if (dueDate.getTime() === now.getTime()) {
            todayTasks.push(task);
        } else if (dueDate.getTime() === tomorrow.getTime()) {
            tomorrowTasks.push(task);
        } else {
            futureTasks.push(task);
        }
    });
    
    // Sort tasks by order property
    const sortTasks = tasks => tasks.sort((a, b) => a.order - b.order);
    
    overdueTasks = sortTasks(overdueTasks);
    todayTasks = sortTasks(todayTasks);
    tomorrowTasks = sortTasks(tomorrowTasks);
    futureTasks = sortTasks(futureTasks);
    noDateTasks = sortTasks(noDateTasks);
    completedTasks = sortTasks(completedTasks);
    
    // Clear the container
    tasksContainer.innerHTML = '';
    
    // Create sections for each task group
    if (overdueTasks.length > 0) {
        createTaskSection(tasksContainer, 'Overdue', overdueTasks, 'overdue');
    }
    
    if (todayTasks.length > 0) {
        createTaskSection(tasksContainer, 'Today', todayTasks, 'today');
    }
    
    if (tomorrowTasks.length > 0) {
        createTaskSection(tasksContainer, 'Tomorrow', tomorrowTasks, 'tomorrow');
    }
    
    if (futureTasks.length > 0) {
        createTaskSection(tasksContainer, 'Upcoming', futureTasks, 'future');
    }
    
    if (noDateTasks.length > 0) {
        createTaskSection(tasksContainer, 'No Date', noDateTasks, 'nodate');
    }
    
    if (completedTasks.length > 0) {
        createTaskSection(tasksContainer, 'Completed', completedTasks, 'completed');
    }
    
    // Show empty state if no tasks
    if (appData.tasks.length === 0) {
        tasksContainer.innerHTML = `
            <div class="empty-tasks">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="48" height="48">
                    <path d="M3 4h18v2H3V4zm0 7h18v2H3v-2zm0 7h18v2H3v-2z"/>
                </svg>
                <h3>No tasks yet</h3>
                <p>Add your first task by clicking the + button below.</p>
            </div>
        `;
    }
    
    // Render AI suggestions
    renderAISuggestions(document.getElementById('ai-suggestions-container'));
}

// Helper function to create a task section
function createTaskSection(container, title, tasks, groupId) {
    const section = document.createElement('div');
    section.className = 'section';
    section.innerHTML = `
        <div class="section-header">
            <div class="section-title">${title}</div>
        </div>
    `;
    
    const sortableContainer = document.createElement('div');
    sortableContainer.className = 'sortable-container';
    sortableContainer.dataset.group = groupId;
    section.appendChild(sortableContainer);
    
    // Use the card factory to render the tasks
    cardFactory.renderCards('task', tasks, sortableContainer);
    
    container.appendChild(section);
}

// Toggle task completion
function toggleTask(event, taskId) {
    event.stopPropagation();
    
    const task = appData.tasks.find(t => t.id === taskId);
    if (task) {
        task.completed = !task.completed;
        saveData();
        renderTasks();
    }
}

// Edit task
function editTask(taskId) {
    const task = appData.tasks.find(t => t.id === taskId);
    if (!task) return;
    
    // Populate the edit form
    document.getElementById('edit-task-id').value = task.id;
    document.getElementById('edit-task-title').value = task.title;
    document.getElementById('edit-task-category').value = task.category || 'Personal';
    
    if (task.dueDate) {
        const dueDate = new Date(task.dueDate);
        const dateStr = dueDate.toISOString().split('T')[0];
        const timeStr = dueDate.toTimeString().substring(0, 5);
        
        document.getElementById('edit-task-due-date').value = dateStr;
        document.getElementById('edit-task-due-time').value = timeStr;
    } else {
        document.getElementById('edit-task-due-date').value = '';
        document.getElementById('edit-task-due-time').value = '';
    }
    
    document.getElementById('edit-task-repeat').value = task.repeat || 'never';
    document.getElementById('edit-task-completed').checked = task.completed;
    
    // Show the edit modal
    openModal('edit-task-modal');
}

// Save edited task
function saveEditedTask(event) {
    event.preventDefault();
    
    const taskId = parseInt(document.getElementById('edit-task-id').value);
    const task = appData.tasks.find(t => t.id === taskId);
    
    if (task) {
        task.title = document.getElementById('edit-task-title').value;
        task.category = document.getElementById('edit-task-category').value;
        task.repeat = document.getElementById('edit-task-repeat').value;
        task.completed = document.getElementById('edit-task-completed').checked;
        
        const dueDate = document.getElementById('edit-task-due-date').value;
        const dueTime = document.getElementById('edit-task-due-time').value;
        
        if (dueDate) {
            if (dueTime) {
                task.dueDate = new Date(`${dueDate}T${dueTime}`).toISOString();
            } else {
                task.dueDate = new Date(`${dueDate}T00:00:00`).toISOString();
            }
        } else {
            task.dueDate = null;
        }
        
        saveData();
        renderTasks();
        closeModal('edit-task-modal');
    }
}

// Delete task
function deleteTask(taskId, showUndo = false) {
    // Remove the task from appData
    const deletedTask = appData.tasks.find(t => t.id === taskId);
    appData.tasks = appData.tasks.filter(t => t.id !== taskId);
    
    // Dismiss related suggestions
    dismissRelatedSuggestions(taskId);
    
    saveData();
    renderTasks();
    
    if (showUndo) {
        showUndoNotification('Task deleted', () => {
            // Restore the deleted task
            if (deletedTask) {
                appData.tasks.push(deletedTask);
                saveData();
                renderTasks();
            }
        });
    }
}

// Dismiss all AI suggestions related to a specific task
function dismissRelatedSuggestions(taskId) {
    const relatedSuggestions = appData.suggestions.filter(s => 
        s.taskId === taskId || 
        (s.data && s.data.taskId === taskId)
    );
    
    relatedSuggestions.forEach(suggestion => {
        const suggestionElement = document.querySelector(`[data-suggestion-id="${suggestion.id}"]`);
        if (suggestionElement) {
            // Animate out
            suggestionElement.style.transform = 'translateX(-100%)';
            suggestionElement.style.opacity = '0';
            
            // Remove from DOM after animation
            setTimeout(() => {
                if (suggestionElement.parentNode) {
                    suggestionElement.parentNode.removeChild(suggestionElement);
                }
            }, 300);
        }
    });
    
    // Remove from data
    appData.suggestions = appData.suggestions.filter(s => 
        s.taskId !== taskId && 
        (!s.data || s.data.taskId !== taskId)
    );
    
    saveData();
}

// Show undo notification
function showUndoNotification(message, undoCallback) {
    const notification = document.createElement('div');
    notification.className = 'undo-notification';
    notification.innerHTML = `
        <div class="undo-message">${message}</div>
        <button class="undo-button">Undo</button>
    `;
    
    document.body.appendChild(notification);
    
    // Animate in
    setTimeout(() => {
        notification.style.transform = 'translateY(0)';
    }, 10);
    
    // Set timeout to hide notification
    const timeout = setTimeout(() => {
        hideUndoNotification();
    }, 5000);
    
    // Add event listener to undo button
    const undoButton = notification.querySelector('.undo-button');
    undoButton.addEventListener('click', () => {
        clearTimeout(timeout);
        undoCallback();
        hideUndoNotification();
    });
}

// Hide undo notification
function hideUndoNotification() {
    const notification = document.querySelector('.undo-notification');
    if (notification) {
        notification.style.transform = 'translateY(100%)';
        
        // Remove from DOM after animation
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }
}

// Toggle task completion status when checkbox is clicked
function toggleTaskCompletion(event, taskId) {
    // Stop event propagation to prevent card click
    event.stopPropagation();
    
    // Find the task
    const taskIndex = appData.tasks.findIndex(task => task.id === taskId);
    if (taskIndex === -1) return;
    
    // Toggle completion status
    appData.tasks[taskIndex].completed = !appData.tasks[taskIndex].completed;
    
    // If task is now completed, set completion date
    if (appData.tasks[taskIndex].completed) {
        appData.tasks[taskIndex].completedDate = new Date().toISOString();
        
        // Set scheduled archive time (5 minutes from now)
        const archiveTime = new Date();
        archiveTime.setMinutes(archiveTime.getMinutes() + 5);
        appData.tasks[taskIndex].scheduledArchiveTime = archiveTime.toISOString();
        
        console.log(`Task "${appData.tasks[taskIndex].title}" completed and scheduled for archiving at ${archiveTime.toLocaleTimeString()}`);
        
        // Show notification about the scheduled archiving
        showNotification(`Task "${appData.tasks[taskIndex].title}" will be archived in 5 minutes`, 'info');
        
        // Track task duration if it had a due date
        if (appData.tasks[taskIndex].dueDate) {
            if (!appData.taskDurations) appData.taskDurations = {};
            
            const dueDate = new Date(appData.tasks[taskIndex].dueDate);
            const completedDate = new Date(appData.tasks[taskIndex].completedDate);
            const durationDays = Math.round((completedDate - dueDate) / (1000 * 60 * 60 * 24));
            
            // Store duration data
            const category = appData.tasks[taskIndex].category || 'Uncategorized';
            if (!appData.taskDurations[category]) appData.taskDurations[category] = [];
            
            appData.taskDurations[category].push({
                taskId: taskId,
                title: appData.tasks[taskIndex].title,
                dueDate: appData.tasks[taskIndex].dueDate,
                completedDate: appData.tasks[taskIndex].completedDate,
                durationDays: durationDays
            });
        }
    } else {
        // If task is uncompleted, remove completion date and scheduled archive time
        appData.tasks[taskIndex].completedDate = null;
        appData.tasks[taskIndex].scheduledArchiveTime = null;
    }
    
    // Save data
    saveData();
    
    // Instead of trying to update the DOM directly, just re-render all tasks
    // This is more reliable and avoids DOM traversal errors
    renderTasks();
    
    // Generate AI suggestions based on task completion
    if (appData.tasks[taskIndex].completed) {
        generateTaskCompletionSuggestions(appData.tasks[taskIndex]);
    }
}

// Add task
function addTask(event) {
    event.preventDefault();
    
    const title = document.getElementById('task-title').value;
    const category = document.getElementById('task-category').value;
    const dueDate = document.getElementById('task-due-date').value;
    const dueTime = document.getElementById('task-due-time').value;
    const repeat = document.getElementById('task-repeat').value;
    
    let dueDateISO = null;
    if (dueDate) {
        if (dueTime) {
            dueDateISO = new Date(`${dueDate}T${dueTime}`).toISOString();
        } else {
            dueDateISO = new Date(`${dueDate}T00:00:00`).toISOString();
        }
    }
    
    const task = {
        id: Date.now(),
        title,
        category,
        dueDate: dueDateISO,
        repeat,
        completed: false,
        order: appData.tasks.length
    };
    
    appData.tasks.push(task);
    saveData();
    renderTasks();
    
    closeModal('add-task-modal');
    document.getElementById('add-task-form').reset();
}

// Reorder tasks based on new order
function reorderTasks(newOrder) {
    // Create a new array to hold the reordered tasks
    const reorderedTasks = [];
    
    // First add tasks in the new order
    newOrder.forEach(id => {
        const task = appData.tasks.find(t => t.id === id);
        if (task && !reorderedTasks.some(t => t.id === id)) {
            reorderedTasks.push(task);
        }
    });
    
    // Then add any remaining tasks that weren't in the newOrder array
    appData.tasks.forEach(task => {
        if (!newOrder.includes(task.id) && !reorderedTasks.some(t => t.id === task.id)) {
            reorderedTasks.push(task);
        }
    });
    
    // Replace the tasks array with the reordered one
    appData.tasks = reorderedTasks;
    
    // Update order properties for all tasks
    appData.tasks.forEach((task, index) => {
        task.order = index;
    });
    
    // Save and render
    saveData();
    renderTasks();
}

// Check for tasks that need to be archived (completed tasks after 5 minutes)
function archiveCompletedTasks() {
    const now = new Date();
    const tasksToArchive = [];
    
    // Find tasks that have passed their scheduled archive time
    appData.tasks.forEach(task => {
        if (task.completed && task.scheduledArchiveTime) {
            const archiveTime = new Date(task.scheduledArchiveTime);
            if (now >= archiveTime) {
                tasksToArchive.push(task.id);
            }
        }
    });
    
    // Archive the tasks
    if (tasksToArchive.length > 0) {
        console.log(`Archiving ${tasksToArchive.length} completed tasks`);
        
        tasksToArchive.forEach(taskId => {
            const taskIndex = appData.tasks.findIndex(task => task.id === taskId);
            if (taskIndex !== -1) {
                // Copy task to archive
                const task = appData.tasks[taskIndex];
                appData.taskArchive.push({
                    ...task,
                    archivedDate: new Date().toISOString()
                });
                
                // Remove from active tasks
                appData.tasks.splice(taskIndex, 1);
                
                // Log for AI learning
                console.log(`Task archived for AI learning: ${task.title}`);
            }
        });
        
        // Save data and re-render
        saveData();
        renderTasks();
    }
}

// Run archive check every minute
setInterval(archiveCompletedTasks, 60 * 1000);

// Initialize the app
document.addEventListener('DOMContentLoaded', () => {
    // Register event listeners
    document.getElementById('add-task-form').addEventListener('submit', addTask);
    document.getElementById('edit-task-form').addEventListener('submit', saveEditedTask);
    
    // Initial render
    renderTasks();
});
