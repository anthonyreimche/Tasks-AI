// Render AI suggestions
function renderAISuggestions(container) {
    if (!appData.suggestions || appData.suggestions.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <p>No suggestions yet. Complete more tasks for better AI recommendations.</p>
            </div>
        `;
        return;
    }
    
    // Filter out only task-related suggestions (non-grocery)
    const taskSuggestions = appData.suggestions.filter(suggestion => 
        !suggestion.type || !suggestion.type.startsWith('grocery-')
    );
    
    if (taskSuggestions.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <p>No task suggestions yet. Complete more tasks for better AI recommendations.</p>
            </div>
        `;
        return;
    }
    
    const suggestionsList = taskSuggestions.map(suggestion => {
        // Format the meta information based on suggestion type
        let metaInfo = '';
        let icon = '📝';
        let actionButtons = '';
        
        if (suggestion.type === 'schedule' || suggestion.type === 'overlap') {
            icon = '⏱️';
            metaInfo = `<div class="suggestion-meta">Estimated duration: ${appData.taskDurations[suggestion.taskId] || 30} minutes</div>`;
        } else if (suggestion.type === 'recurring') {
            icon = '🔄';
            metaInfo = `<div class="suggestion-meta">Will repeat: Weekly</div>`;
        } else if (suggestion.type === 'pattern') {
            icon = '📊';
            metaInfo = `<div class="suggestion-meta">Based on your task patterns</div>`;
        } else if (suggestion.type === 'completion') {
            icon = '✅';
            metaInfo = `<div class="suggestion-meta">Similar task suggestion</div>`;
            
            // Add action buttons for completion suggestions
            if (suggestion.actions && suggestion.actions.length > 0) {
                actionButtons = `<div class="suggestion-actions">`;
                suggestion.actions.forEach(action => {
                    const actionData = {...suggestion.data, action: action.action};
                    const actionDataStr = JSON.stringify(actionData)
                        .replace(/&/g, '&amp;')
                        .replace(/"/g, '&quot;')
                        .replace(/'/g, '&apos;')
                        .replace(/</g, '&lt;')
                        .replace(/>/g, '&gt;');
                    
                    actionButtons += `
                        <button class="suggestion-action-btn" 
                                data-suggestion-id="${suggestion.id}" 
                                data-suggestion-type="${suggestion.type}" 
                                data-suggestion-data="${actionDataStr}"
                                onclick="handleSuggestionAction(event, this)">
                            ${action.label}
                        </button>
                    `;
                });
                actionButtons += `</div>`;
            }
        }
        
        // Create data attribute for the suggestion data
        // Properly escape the JSON string for HTML attribute
        const suggestionData = JSON.stringify(suggestion.data)
            .replace(/&/g, '&amp;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&apos;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;');
        
        return `
        <div class="suggestion-item task-suggestion" 
             id="suggestion-${suggestion.id}" 
             data-suggestion-id="${suggestion.id}" 
             data-suggestion-type="${suggestion.type}" 
             data-suggestion-data="${suggestionData}"
             onclick="handleSuggestionClick(event, this)">
            <div class="suggestion-content">
                <div class="suggestion-icon">${icon}</div>
                <div class="suggestion-info">
                    <div class="suggestion-title">${suggestion.title}</div>
                    <div class="suggestion-description">${suggestion.description}</div>
                    ${metaInfo}
                    ${actionButtons}
                </div>
            </div>
            <div class="swipe-hint">Swipe to dismiss</div>
        </div>
        `;
    }).join('');
    
    container.innerHTML = `
        <div class="suggestions-list task-suggestions-list">
            ${suggestionsList}
        </div>
    `;
    
    // Initialize touch swipe functionality after rendering
    initializeTouchSwipe();
}

// Generate suggestions based on task completion
function generateTaskCompletionSuggestions(completedTask) {
    // Don't generate suggestions if the task doesn't have a category
    if (!completedTask.category) return;
    
    // Check if there are similar tasks that could be completed
    const similarTasks = appData.tasks.filter(task => 
        !task.completed && 
        task.category === completedTask.category && 
        task.id !== completedTask.id
    );
    
    if (similarTasks.length > 0) {
        // Sort by due date (closest first)
        similarTasks.sort((a, b) => {
            if (!a.dueDate) return 1;
            if (!b.dueDate) return -1;
            return new Date(a.dueDate) - new Date(b.dueDate);
        });
        
        // Take the first similar task
        const nextTask = similarTasks[0];
        
        // Create a suggestion
        const suggestion = {
            id: generateUniqueId(),
            title: `Complete similar ${completedTask.category} task`,
            description: `You just completed "${completedTask.title}". Would you like to work on "${nextTask.title}" next?`,
            type: 'completion',
            taskId: nextTask.id,
            data: {
                taskId: nextTask.id,
                action: 'view'
            },
            actions: [
                {
                    label: 'View Task',
                    action: 'viewTask',
                    taskId: nextTask.id
                },
                {
                    label: 'Complete Now',
                    action: 'completeTask',
                    taskId: nextTask.id
                }
            ],
            createdAt: new Date().toISOString(),
            dismissed: false
        };
        
        // Add the suggestion
        if (!appData.suggestions) appData.suggestions = [];
        appData.suggestions.push(suggestion);
        
        // Save data
        saveData();
        
        // Refresh suggestions
        renderAISuggestions(document.getElementById('ai-suggestions-container'));
    }
}

// Analyze task patterns
function analyzeTaskPatterns() {
    const now = new Date();
    const suggestions = [];
    
    // Check for recurring tasks
    appData.tasks.forEach(task => {
        // Skip if this task already has dismissed suggestions of type 'recurring'
        if (appData.dismissedSuggestions[task.id] && 
            appData.dismissedSuggestions[task.id].includes('recurring')) {
            return;
        }
        
        if (task.repeat === 'never' && !task.completed) {
            // Check if this task title has been completed multiple times
            if (appData.taskPatterns[task.title] && appData.taskPatterns[task.title].length >= 3) {
                // Check if the completions follow a pattern (e.g., weekly)
                const completions = appData.taskPatterns[task.title].map(date => new Date(date));
                completions.sort((a, b) => a - b);
                
                // Check for weekly pattern
                let weeklyPattern = true;
                for (let i = 1; i < completions.length; i++) {
                    const daysDiff = Math.round((completions[i] - completions[i-1]) / (24 * 60 * 60 * 1000));
                    if (daysDiff < 6 || daysDiff > 8) { // Allow some flexibility
                        weeklyPattern = false;
                        break;
                    }
                }
                
                if (weeklyPattern) {
                    suggestions.push({
                        id: Date.now() + Math.random(),
                        type: 'recurring',
                        taskId: task.id,
                        title: 'Set Recurring Task',
                        description: `I noticed you complete "${task.title}" about weekly. Would you like to make it a recurring task?`,
                        data: {
                            taskId: task.id,
                            repeat: 'weekly'
                        }
                    });
                }
            }
        }
    });
    
    // Check for overdue tasks
    const overdueTasks = appData.tasks.filter(task => {
        // Skip tasks without due dates
        if (!task.completed && !task.dueDate) {
            return false;
        }
        
        // Get the task's due date
        const dueDate = new Date(task.dueDate);
        
        // If the task has no specific time (hasTime is false):
        if (!task.hasTime) {
            // For tasks due today, they're not overdue until end of day
            const today = new Date(now);
            today.setHours(0, 0, 0, 0);
            
            const taskDate = new Date(dueDate);
            taskDate.setHours(0, 0, 0, 0);
            
            // Only consider it overdue if the date is before today
            return !task.completed && taskDate < today;
        }
        
        // For tasks with specific times, use normal comparison
        return !task.completed && dueDate < now;
    });
    
    if (overdueTasks.length > 0) {
        suggestions.push({
            id: Date.now() + Math.random(),
            type: 'overdue',
            taskId: overdueTasks[0].id,
            title: 'Reschedule Overdue Task',
            description: `"${overdueTasks[0].title}" is overdue. Would you like to reschedule it for today?`,
            data: {
                taskId: overdueTasks[0].id,
                dueDate: new Date().toISOString(),
                hasTime: true
            }
        });
    }
    
    // Check for tasks that can be scheduled
    const unscheduledTasks = appData.tasks.filter(task => !task.dueDate && !task.completed);
    if (unscheduledTasks.length > 0) {
        suggestions.push({
            id: Date.now() + Math.random(),
            type: 'schedule',
            taskId: unscheduledTasks[0].id,
            title: `Schedule "${unscheduledTasks[0].title}"`,
            description: `This task has no due date. Would you like me to suggest a time?`,
            data: {
                taskId: unscheduledTasks[0].id
            }
        });
    }
    
    // Merge with existing suggestions, avoiding duplicates
    if (!appData.suggestions) {
        appData.suggestions = [];
    }
    
    suggestions.forEach(suggestion => {
        // Check if we already have a similar suggestion
        const exists = appData.suggestions.some(s => 
            s.type === suggestion.type && 
            s.taskId === suggestion.taskId
        );
        
        if (!exists) {
            appData.suggestions.push(suggestion);
        }
    });
    
    saveData();
}

// Accept AI suggestion
function acceptSuggestion(type, data) {
    try {
        console.log(`Accepting suggestion of type: ${type}`, data);
        
        // Ensure data is an object and make a copy to avoid reference issues
        data = data ? {...data} : {};
        
        if (type === 'task') {
            // Add suggested task
            const task = {
                id: Date.now(),
                title: data.title || 'New Task',
                dueDate: data.dueDate || null,
                hasTime: !!data.hasTime,
                category: data.category || 'personal',
                repeat: data.repeat || 'never',
                completed: false,
                createdAt: new Date().toISOString(),
                order: appData.tasks.length
            };
            
            appData.tasks.push(task);
            saveData();
            renderTasks();
            showSyncStatus('Task added!', true);
        } else if (type === 'schedule' || type === 'overlap') {
            // Handle scheduling suggestions
            const taskId = data.taskId;
            
            if (!taskId) {
                console.warn('No taskId provided in data:', data);
                showSyncStatus('Could not find the task to update', false);
                return;
            }
            
            const task = appData.tasks.find(t => t.id == taskId);
            if (task) {
                // If no due date is provided in the suggestion, generate one
                if (!data.dueDate) {
                    // Set due date to tomorrow at 9:00 AM by default
                    const tomorrow = new Date();
                    tomorrow.setDate(tomorrow.getDate() + 1);
                    tomorrow.setHours(9, 0, 0, 0);
                    data.dueDate = tomorrow.toISOString();
                    data.hasTime = true;
                }
                
                // Update the task's due date
                task.dueDate = data.dueDate;
                task.hasTime = !!data.hasTime;
                
                // Save data and force a complete re-render
                saveData();
                renderTasks();
                
                // If we're in the AI suggestions tab, also refresh that
                const aiSuggestionsContainer = document.getElementById('ai-suggestions-container');
                if (aiSuggestionsContainer) {
                    renderAISuggestions(aiSuggestionsContainer);
                }
                
                showSyncStatus(type === 'schedule' ? 'Task scheduled!' : 'Conflict resolved!', true);
                
                // Log the updated task for debugging
                console.log('Updated task:', task);
            } else {
                console.warn('Task not found for id:', taskId);
                showSyncStatus('Could not find the task to update', false);
            }
        } else if (type === 'recurring') {
            // Set task to recurring
            const taskId = data.taskId;
            if (!taskId) {
                console.warn('No taskId provided for recurring suggestion');
                return;
            }
            
            const task = appData.tasks.find(t => t.id == taskId);
            if (task) {
                task.repeat = data.repeat || 'weekly';
                saveData();
                renderTasks();
                showSyncStatus('Task set to recurring!', true);
            }
        } else if (type === 'overdue') {
            // Reschedule overdue task
            const taskId = data.taskId;
            if (!taskId) {
                console.warn('No taskId provided for overdue suggestion');
                return;
            }
            
            const task = appData.tasks.find(t => t.id == taskId);
            if (task) {
                task.dueDate = data.dueDate || null;
                task.hasTime = !!data.hasTime;
                saveData();
                renderTasks();
                showSyncStatus('Task rescheduled!', true);
            }
        } else if (type === 'completion') {
            // Handle completion suggestion actions
            const taskId = data.taskId;
            if (!taskId) {
                console.warn('No taskId provided for completion suggestion');
                return;
            }
            
            const task = appData.tasks.find(t => t.id == taskId);
            if (task) {
                if (data.action === 'view') {
                    // Open the task for editing
                    editTask(taskId);
                    showSyncStatus('Opening task...', true);
                } else if (data.action === 'completeTask') {
                    // Mark the task as completed
                    task.completed = true;
                    task.completedDate = new Date().toISOString();
                    saveData();
                    renderTasks();
                    showSyncStatus('Task completed!', true);
                }
            } else {
                console.warn('Task not found for id:', taskId);
                showSyncStatus('Could not find the task', false);
            }
        } else {
            console.warn('Unknown suggestion type:', type);
            showSyncStatus('Could not process suggestion', false);
        }
    } catch (error) {
        console.error('Error accepting suggestion:', error);
        showSyncStatus('Error processing suggestion', false);
    }
}

// Dismiss suggestion
function dismissSuggestion(suggestionId, animate = false, direction = 'right') {
    console.log('Dismissing suggestion:', suggestionId);
    
    // Prevent any click handlers from firing after dismissal
    const element = document.getElementById(`suggestion-${suggestionId}`);
    if (element) {
        // Remove the onclick attribute to prevent click handling
        element.removeAttribute('onclick');
        // Add a class to mark it as being dismissed
        element.classList.add('being-dismissed');
    }
    
    // Find the suggestion in the appData
    const suggestion = appData.suggestions.find(s => s.id.toString() === suggestionId.toString());
    
    // If suggestion not found in appData, we can still dismiss it visually
    if (!suggestion) {
        console.warn('Suggestion not found in appData for dismissal:', suggestionId);
        
        // Find the element in the DOM
        const elementToRemove = document.getElementById(`suggestion-${suggestionId}`);
        
        // If we have the element, we can still remove it from the DOM
        if (elementToRemove) {
            if (animate) {
                // Add dismissing animation class based on direction
                elementToRemove.classList.add(`dismissing-${direction}`);
                
                // Remove after animation
                setTimeout(() => {
                    if (elementToRemove.parentNode) {
                        elementToRemove.parentNode.removeChild(elementToRemove);
                    }
                }, 300);
            } else {
                // Remove immediately
                if (elementToRemove.parentNode) {
                    elementToRemove.parentNode.removeChild(elementToRemove);
                }
            }
        }
        return;
    }
    
    // Track dismissed suggestion by task ID if it exists
    if (suggestion.taskId) {
        if (!appData.dismissedSuggestions[suggestion.taskId]) {
            appData.dismissedSuggestions[suggestion.taskId] = [];
        }
        // Store the suggestion type to avoid showing similar suggestions for this task
        appData.dismissedSuggestions[suggestion.taskId].push(suggestion.type);
    }
    
    // Track dismissed grocery suggestions
    if (suggestion.type && suggestion.type.startsWith('grocery-')) {
        // Initialize if needed
        if (!appData.dismissedSuggestions) {
            appData.dismissedSuggestions = {};
        }
        
        // Create a key for this grocery suggestion type
        let key = suggestion.type;
        
        // For specific grocery items, include the item name in the key
        if (suggestion.groceryName) {
            key = `grocery-pattern-${suggestion.groceryName}`;
        } else if (suggestion.data && suggestion.data.groceryName) {
            key = `grocery-pattern-${suggestion.data.groceryName}`;
        } else if (suggestion.data && suggestion.data.groceryId) {
            const groceryItem = appData.groceries.find(g => g.id === suggestion.data.groceryId);
            if (groceryItem) {
                key = `grocery-pattern-${groceryItem.name}`;
            }
        }
        
        // Initialize array for this key if needed
        if (!appData.dismissedSuggestions[key]) {
            appData.dismissedSuggestions[key] = [];
        }
        
        // Store the suggestion subtype
        const subtype = suggestion.type.split('-')[1] || 'general';
        appData.dismissedSuggestions[key].push(subtype);
        
        // Track this for future AI suggestions
        if (!appData.groceryAiActions) {
            appData.groceryAiActions = [];
        }
        
        // Record that the user dismissed this suggestion
        appData.groceryAiActions.push({
            type: suggestion.type,
            itemName: suggestion.groceryName || (suggestion.data ? suggestion.data.groceryName : null),
            action: 'dismissed',
            date: new Date().toISOString()
        });
    }
    
    // Find the element in the DOM
    const suggestionElement = document.getElementById(`suggestion-${suggestionId}`);
    
    if (animate && suggestionElement) {
        // Add dismissing animation class based on direction
        suggestionElement.classList.add(`dismissing-${direction}`);
        
        // Wait for animation to complete before removing from data
        setTimeout(() => {
            // Remove from appData
            appData.suggestions = appData.suggestions.filter(s => s.id.toString() !== suggestionId.toString());
            saveData();
            renderCurrentTab();
        }, 400); // Match animation duration
    } else {
        // No animation, remove immediately
        appData.suggestions = appData.suggestions.filter(s => s.id.toString() !== suggestionId.toString());
        saveData();
        renderCurrentTab();
    }
}

// Handle suggestion action button click
function handleSuggestionAction(event, element) {
    // Stop event propagation to prevent the parent suggestion click handler from firing
    event.stopPropagation();
    
    try {
        console.log('Handling suggestion action click');
        
        // Get suggestion data from the element's data attributes
        const suggestionId = element.dataset.suggestionId;
        const suggestionType = element.dataset.suggestionType;
        
        console.log('Suggestion action data:', { id: suggestionId, type: suggestionType });
        
        // Parse the suggestion data from the element's data attribute
        let suggestionData = {};
        try {
            const suggestionDataAttr = element.dataset.suggestionData;
            if (suggestionDataAttr) {
                suggestionData = JSON.parse(suggestionDataAttr);
                console.log('Parsed suggestion action data:', suggestionData);
            }
        } catch (parseError) {
            console.warn('Could not parse suggestion action data from attribute:', parseError);
        }
        
        // Pass the data to acceptSuggestion
        acceptSuggestion(suggestionType, suggestionData);
        
        // Remove the suggestion from the list after accepting
        appData.suggestions = appData.suggestions.filter(s => s.id.toString() !== suggestionId.toString());
        saveData();
        
        // Add a visual indicator that the suggestion was accepted
        const suggestionElement = document.getElementById(`suggestion-${suggestionId}`);
        if (suggestionElement) {
            suggestionElement.classList.add('accepting');
        }
        
        // Force a complete UI refresh to ensure all changes are reflected
        // This includes both the suggestions and the task cards
        setTimeout(() => {
            // Refresh the suggestions container
            const aiSuggestionsContainer = document.getElementById('ai-suggestions-container');
            if (aiSuggestionsContainer) {
                renderAISuggestions(aiSuggestionsContainer);
            }
            
            // Refresh the tasks container
            renderTasks();
            
            // Refresh the current tab to ensure everything is up to date
            renderCurrentTab();
        }, 400);
    } catch (error) {
        console.error('Error handling suggestion action click:', error);
    }
}

// Handle suggestion click
function handleSuggestionClick(event, element) {
    // Don't handle click if we're in the middle of a swipe or being dismissed
    if (element.classList.contains('swiping') || element.classList.contains('being-dismissed') || 
        element.classList.contains('dismissing-left') || element.classList.contains('dismissing-right')) {
        console.log('Ignoring click on card that is being swiped or dismissed');
        return;
    }
    
    try {
        console.log('Handling suggestion click');
        
        // Get suggestion data from the element's data attributes
        const suggestionId = element.dataset.suggestionId;
        const suggestionType = element.dataset.suggestionType;
        
        console.log('Suggestion data:', { id: suggestionId, type: suggestionType });
        
        // Try to get the suggestion data from the element's data attribute first
        let suggestion;
        
        try {
            // Try to get the suggestion data from the element's data attribute
            const suggestionDataAttr = element.dataset.suggestionData;
            if (suggestionDataAttr) {
                // Parse the suggestion data
                const parsedData = JSON.parse(suggestionDataAttr);
                console.log('Using suggestion data from element attribute');
                
                // Create a proper suggestion object with the parsed data
                suggestion = {
                    id: suggestionId,
                    type: suggestionType,
                    // The parsed data IS the data property
                    data: parsedData
                };
                
                console.log('Parsed suggestion data:', parsedData);
            }
        } catch (parseError) {
            console.warn('Could not parse suggestion data from attribute:', parseError);
        }
        
        // If we couldn't get it from the attribute, try to find it in appData
        if (!suggestion) {
            suggestion = appData.suggestions.find(s => s.id.toString() === suggestionId.toString());
        }
        
        // If still not found, try to reconstruct a basic suggestion from the element data
        if (!suggestion) {
            console.warn('Suggestion not found in appData, reconstructing from element data');
            
            // Try to extract taskId from the element content if possible
            let taskId = null;
            const metaElement = element.querySelector('.suggestion-meta');
            if (metaElement) {
                // Look for task ID in the meta text (often contains "Task: [name]")
                const metaText = metaElement.textContent || '';
                const taskMatch = metaText.match(/Task: (.+?)($|\s|,)/i);
                if (taskMatch && taskMatch[1]) {
                    // Try to find the task by name
                    const taskName = taskMatch[1].trim();
                    const matchingTask = appData.tasks.find(t => 
                        t.title.toLowerCase() === taskName.toLowerCase());
                    
                    if (matchingTask) {
                        taskId = matchingTask.id;
                        console.log('Found task ID by name:', taskId);
                    }
                }
            }
            
            // Build a more complete suggestion object
            suggestion = {
                id: suggestionId,
                type: suggestionType,
                title: element.querySelector('.suggestion-title')?.textContent || 'Unknown suggestion',
                description: element.querySelector('.suggestion-description')?.textContent || '',
                data: {
                    taskId: taskId,
                    title: element.querySelector('.suggestion-title')?.textContent || 'Unknown suggestion',
                    description: element.querySelector('.suggestion-description')?.textContent || ''
                }
            };
        }
        
        console.log('Using suggestion:', suggestion);
        
        // Accept the suggestion using the data from appData
        // Make sure we have data, even if it's empty
        const suggestionData = suggestion.data || {};
        
        // Log the data we're about to pass to acceptSuggestion
        console.log('Passing data to acceptSuggestion:', suggestionData);
        
        // For schedule type suggestions, ensure the taskId is properly passed
        if (suggestionType === 'schedule' || suggestionType === 'overlap') {
            // Double check that taskId is present and is a number
            if (suggestionData.taskId) {
                // Convert to number if it's a string
                if (typeof suggestionData.taskId === 'string') {
                    suggestionData.taskId = parseInt(suggestionData.taskId, 10);
                }
            }
        }
        
        // Handle grocery-related suggestions
        if (suggestionType.startsWith('grocery-')) {
            handleGrocerySuggestionClick(suggestion);
        } else {
            // Pass the data to acceptSuggestion for task-related suggestions
            acceptSuggestion(suggestionType, suggestionData);
        }
        
        // Remove the suggestion from the list after accepting
        appData.suggestions = appData.suggestions.filter(s => s.id.toString() !== suggestionId.toString());
        saveData();
        
        // Add a visual indicator that the suggestion was accepted
        element.classList.add('accepting');
        
        // Refresh the UI after a short delay
        setTimeout(() => {
            renderCurrentTab();
        }, 400);
    } catch (error) {
        console.error('Error handling suggestion click:', error);
    }
}

function initializeSuggestionSwipe() {
    const suggestionItems = document.querySelectorAll('.suggestion-item');
    
    suggestionItems.forEach(item => {
        // Skip if already initialized
        if (item.dataset.swipeInitialized === 'true') return;
        item.dataset.swipeInitialized = 'true';
        
        // Create a manager object for this suggestion
        const mc = {
            element: item,
            startX: 0,
            startY: 0,
            deltaX: 0,
            deltaY: 0,
            threshold: 80,
            isSwiping: false,
            isClick: true,
            hasMoved: false,
            startTime: 0
        };
        
        // Touch start handler
        function handleStart(ev) {
            const point = ev.touches ? ev.touches[0] : ev;
            mc.startX = point.clientX;
            mc.startY = point.clientY;
            mc.startTime = Date.now();
            mc.isSwiping = true;
            mc.hasMoved = false;
            mc.element.classList.add('swiping');
            
            // Disable transitions during swipe
            mc.element.style.transition = 'none';
        }
        
        // Touch move handler
        function handleMove(ev) {
            if (!mc.isSwiping) return;
            
            const point = ev.touches ? ev.touches[0] : ev;
            mc.deltaX = point.clientX - mc.startX;
            mc.deltaY = point.clientY - mc.startY;
            
            // If more vertical than horizontal movement, allow scrolling
            if (Math.abs(mc.deltaY) > Math.abs(mc.deltaX) * 1.5) {
                return;
            }
            
            // Prevent scrolling
            if (ev.cancelable) {
                ev.preventDefault();
            }
            
            // Move the card
            mc.element.style.transform = `translateX(${mc.deltaX}px)`;
            
            // Fade out as it moves
            const opacity = Math.max(0.4, 1 - (Math.abs(mc.deltaX) / 300));
            mc.element.style.opacity = opacity;
            
            // Update hasMoved flag
            if (Math.abs(mc.deltaX) > 5) {
                mc.hasMoved = true;
            }
        }
        
        // Touch end handler
        function handleEnd() {
            if (!mc.isSwiping) return;
            
            // Re-enable transitions
            mc.element.style.transition = '';
            
            // Get the width of the element to calculate halfway point
            const elementWidth = mc.element.offsetWidth;
            const halfwayThreshold = elementWidth / 2;
            
            if (Math.abs(mc.deltaX) > halfwayThreshold) {
                // Swiped more than halfway - dismiss
                const direction = mc.deltaX > 0 ? 'right' : 'left';
                mc.element.classList.add(`dismissing-${direction}`);
                
                // Get suggestion ID and dismiss it
                const suggestionId = mc.element.dataset.suggestionId;
                setTimeout(() => {
                    dismissSuggestion(suggestionId, false, direction);
                }, 50);
            } else {
                // Not swiped far enough, animate back to original position
                mc.element.style.transform = '';
                mc.element.style.opacity = '';
                mc.element.classList.add('returning');
                
                // Remove the returning class after animation completes
                setTimeout(() => {
                    mc.element.classList.remove('returning');
                }, 300);
                
                // Only handle as click if:
                // 1. It was a very small movement (essentially a tap)
                // 2. The interaction was short (less than 300ms)
                // 3. No significant movement occurred
                const interactionTime = Date.now() - mc.startTime;
                if (!mc.hasMoved && interactionTime < 300 && Math.abs(mc.deltaX) < 5 && Math.abs(mc.deltaY) < 5) {
                    // Small delay to ensure it's not part of a swipe attempt
                    setTimeout(() => {
                        handleSuggestionClick(null, mc.element);
                    }, 50);
                }
            }
            
            // Reset swiping state
            mc.isSwiping = false;
            mc.element.classList.remove('swiping');
        }
        
        // Touch cancel handler
        function handleCancel() {
            if (!mc.isSwiping) return;
            
            // Reset position
            mc.element.style.transition = '';
            mc.element.style.transform = '';
            mc.element.style.opacity = '';
            mc.isSwiping = false;
            mc.element.classList.remove('swiping');
        }
        
        // Add event listeners
        mc.element.addEventListener('touchstart', handleStart, { passive: true });
        mc.element.addEventListener('touchmove', handleMove, { passive: false });
        mc.element.addEventListener('touchend', handleEnd);
        mc.element.addEventListener('touchcancel', handleCancel);
        
        // Mouse events for desktop testing
        mc.element.addEventListener('mousedown', function(ev) {
            handleStart(ev);
            ev.preventDefault(); // Prevent text selection
        });
        
        document.addEventListener('mousemove', function(ev) {
            if (mc.isSwiping) {
                handleMove(ev);
            }
        });
        
        document.addEventListener('mouseup', function() {
            if (mc.isSwiping) {
                handleEnd();
            }
        });
    });
}

// Initialize touch swipe functionality for suggestions
function initializeTouchSwipe() {
    // Use Hammer.js-like approach for reliable touch handling
    function setupSwipe(element) {
        let mc = {
            element: element,
            startX: 0,
            startY: 0,
            deltaX: 0,
            deltaY: 0,
            lastX: 0,
            lastY: 0,
            threshold: 80,
            isSwiping: false
        };
        
        // Touch start handler
        function handleStart(ev) {
            const point = ev.touches ? ev.touches[0] : ev;
            mc.startX = point.clientX;
            mc.startY = point.clientY;
            mc.lastX = point.clientX;
            mc.lastY = point.clientY;
            mc.deltaX = 0;
            mc.deltaY = 0;
            mc.isSwiping = true;
            mc.element.classList.add('swiping');
            
            // Disable transitions during swipe
            mc.element.style.transition = 'none';
        }
        
        // Touch move handler
        function handleMove(ev) {
            if (!mc.isSwiping) return;
            
            const point = ev.touches ? ev.touches[0] : ev;
            mc.deltaX = point.clientX - mc.startX;
            mc.deltaY = point.clientY - mc.startY;
            mc.lastX = point.clientX;
            mc.lastY = point.clientY;
            
            // If more vertical than horizontal movement, allow scrolling
            if (Math.abs(mc.deltaY) > Math.abs(mc.deltaX) * 1.5) {
                return;
            }
            
            // Prevent scrolling
            if (ev.cancelable) {
                ev.preventDefault();
            }
            
            // Move the card
            mc.element.style.transform = `translateX(${mc.deltaX}px)`;
            
            // Fade out as it moves
            const opacity = Math.max(0.4, 1 - (Math.abs(mc.deltaX) / 300));
            mc.element.style.opacity = opacity;
        }
        
        // Touch end handler
        function handleEnd() {
            if (!mc.isSwiping) return;
            
            // Re-enable transitions
            mc.element.style.transition = '';
            
            // Get the width of the element to calculate halfway point
            const elementWidth = mc.element.offsetWidth;
            const halfwayThreshold = elementWidth / 2;
            
            if (Math.abs(mc.deltaX) > halfwayThreshold) {
                // Swiped more than halfway - dismiss
                const direction = mc.deltaX > 0 ? 'right' : 'left';
                mc.element.classList.add(`dismissing-${direction}`);
                
                // Get suggestion ID and dismiss it
                const suggestionId = mc.element.dataset.suggestionId;
                setTimeout(() => {
                    dismissSuggestion(suggestionId, false, direction);
                }, 50);
            } else {
                // Not swiped far enough, animate back to original position
                mc.element.style.transform = '';
                mc.element.style.opacity = '';
                mc.element.classList.add('returning');
                
                // Remove the returning class after animation completes
                setTimeout(() => {
                    mc.element.classList.remove('returning');
                }, 300);
                
                // Only handle as click if it was a very small movement (essentially a tap)
                // This prevents cards from being accepted after a failed swipe
                if (Math.abs(mc.deltaX) < 5 && Math.abs(mc.deltaY) < 5) {
                    handleSuggestionClick(null, mc.element);
                }
            }
            
            // Reset swiping state
            mc.isSwiping = false;
            mc.element.classList.remove('swiping');
        }
        
        // Touch cancel handler
        function handleCancel() {
            if (!mc.isSwiping) return;
            
            // Reset position
            mc.element.style.transition = '';
            mc.element.style.transform = '';
            mc.element.style.opacity = '';
            mc.isSwiping = false;
            mc.element.classList.remove('swiping');
        }
        
        // Add event listeners
        mc.element.addEventListener('touchstart', handleStart, { passive: true });
        mc.element.addEventListener('touchmove', handleMove, { passive: false });
        mc.element.addEventListener('touchend', handleEnd);
        mc.element.addEventListener('touchcancel', handleCancel);
        
        // Mouse events for desktop testing
        mc.element.addEventListener('mousedown', function(ev) {
            handleStart(ev);
            ev.preventDefault(); // Prevent text selection
        });
        
        document.addEventListener('mousemove', function(ev) {
            if (mc.isSwiping) {
                handleMove(ev);
            }
        });
        
        document.addEventListener('mouseup', function() {
            if (mc.isSwiping) {
                handleEnd();
            }
        });
        
        // Click handler for accepting suggestions
        mc.element.addEventListener('click', function(ev) {
            if (!mc.isSwiping && 
                !mc.element.classList.contains('dismissing-left') && 
                !mc.element.classList.contains('dismissing-right')) {
                handleSuggestionClick(ev, mc.element);
            }
        });
    }
    
    // Set up swipe for each suggestion item
    document.querySelectorAll('.suggestion-item').forEach(setupSwipe);
}

// AI Analysis
function startAIAnalysis() {
    // Run AI analysis every 5 minutes
    setInterval(() => {
        // First analyze user preferences to adjust AI behavior
        analyzeGroceryUsagePatterns();
        
        // Task analysis
        analyzeTaskPatterns();
        estimateTaskDurations();
        suggestTaskScheduling();
        detectOverlappingTasks();
        
        // Grocery analysis
        analyzeExpiringGroceries();
        analyzeShoppingList();
        analyzeGroceryPatterns();
        
        renderCurrentTab();
    }, 5 * 60 * 1000); // 5 minutes
    
    // Also run immediately
    // First analyze user preferences to adjust AI behavior
    analyzeGroceryUsagePatterns();
    
    // Task analysis
    analyzeTaskPatterns();
    estimateTaskDurations();
    suggestTaskScheduling();
    detectOverlappingTasks();
    
    // Grocery analysis
    analyzeExpiringGroceries();
    analyzeShoppingList();
    analyzeGroceryPatterns();
}

// Function to render grocery-specific AI suggestions
function renderGroceryAISuggestions(container) {
    if (!appData.suggestions || appData.suggestions.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <p>No grocery suggestions yet. Add more items to your inventory for better AI recommendations.</p>
            </div>
        `;
        return;
    }
    
    // Filter out only grocery-related suggestions
    const grocerySuggestions = appData.suggestions.filter(suggestion => 
        suggestion.type && suggestion.type.startsWith('grocery-')
    );
    
    if (grocerySuggestions.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <p>No grocery suggestions yet. Add more items to your inventory for better AI recommendations.</p>
            </div>
        `;
        return;
    }
    
    const suggestionsList = grocerySuggestions.map(suggestion => {
        // Format the meta information based on suggestion type
        let metaInfo = '';
        let icon = '🛒';
        
        if (suggestion.type === 'grocery-expiring') {
            icon = '⚠️';
            metaInfo = `<div class="suggestion-meta">Expiring soon</div>`;
        } else if (suggestion.type === 'grocery-expired') {
            icon = '❌';
            metaInfo = `<div class="suggestion-meta">Expired item</div>`;
        } else if (suggestion.type === 'grocery-repurchase') {
            icon = '🔄';
            metaInfo = `<div class="suggestion-meta">Based on purchase history</div>`;
        } else if (suggestion.type === 'grocery-long-time') {
            icon = '⏱️';
            metaInfo = `<div class="suggestion-meta">Long time on shopping list</div>`;
        } else if (suggestion.type === 'grocery-shopping-pattern') {
            icon = '📊';
            metaInfo = `<div class="suggestion-meta">Based on shopping patterns</div>`;
        }
        
        // Create data attribute for the suggestion data
        // Properly escape the JSON string for HTML attribute
        const suggestionData = JSON.stringify(suggestion.data)
            .replace(/&/g, '&amp;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&apos;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;');
        
        return `
        <div class="suggestion-item grocery-suggestion" 
             id="suggestion-${suggestion.id}" 
             data-suggestion-id="${suggestion.id}" 
             data-suggestion-type="${suggestion.type}" 
             data-suggestion-data="${suggestionData}"
             onclick="handleSuggestionClick(event, this)">
            <div class="suggestion-content">
                <div class="suggestion-icon">${icon}</div>
                <div class="suggestion-info">
                    <div class="suggestion-title">${suggestion.title}</div>
                    <div class="suggestion-description">${suggestion.description}</div>
                    ${metaInfo}
                </div>
            </div>
            <div class="swipe-hint">Swipe to dismiss</div>
        </div>
        `;
    }).join('');
    
    container.innerHTML = `
        <div class="suggestions-list grocery-suggestions-list">
            ${suggestionsList}
        </div>
    `;
    
    // Initialize touch swipe functionality after rendering
    initializeTouchSwipe();
}

// =============== GROCERY AI FUNCTIONS ===============

// Analyze grocery usage patterns to provide intelligent suggestions
function analyzeGroceryUsagePatterns() {
    if (!appData.groceries || !Array.isArray(appData.groceries)) {
        return;
    }
    
    const suggestions = [];
    
    // Check if we have AI actions data to analyze
    if (appData.groceryAiActions && Array.isArray(appData.groceryAiActions) && appData.groceryAiActions.length > 0) {
        // Analyze which suggestions the user tends to accept vs dismiss
        const acceptedTypes = {};
        const dismissedTypes = {};
        
        appData.groceryAiActions.forEach(action => {
            if (action.action === 'accepted') {
                acceptedTypes[action.type] = (acceptedTypes[action.type] || 0) + 1;
            } else if (action.action === 'dismissed') {
                dismissedTypes[action.type] = (dismissedTypes[action.type] || 0) + 1;
            }
        });
        
        // Calculate acceptance rate for each suggestion type
        const acceptanceRates = {};
        const allTypes = new Set([...Object.keys(acceptedTypes), ...Object.keys(dismissedTypes)]);
        
        allTypes.forEach(type => {
            const accepted = acceptedTypes[type] || 0;
            const dismissed = dismissedTypes[type] || 0;
            const total = accepted + dismissed;
            
            if (total > 0) {
                acceptanceRates[type] = accepted / total;
            }
        });
        
        // Log the acceptance rates for debugging
        console.log('Grocery suggestion acceptance rates:', acceptanceRates);
        
        // Use this data to adjust suggestion thresholds
        // For example, if the user rarely accepts expiring suggestions, we might want to
        // only show them for items that are closer to expiry
        if (acceptanceRates['grocery-expiring'] < 0.3 && acceptanceRates['grocery-expiring'] !== undefined) {
            // User rarely accepts expiring suggestions, so we'll adjust the threshold
            // This is used in analyzeExpiringGroceries
            appData.groceryAiPreferences = appData.groceryAiPreferences || {};
            appData.groceryAiPreferences.expiryThresholdDays = 2; // Only show for items expiring within 2 days
            console.log('Adjusted expiry threshold based on user preferences');
        } else if (acceptanceRates['grocery-expiring'] > 0.7) {
            // User often accepts expiring suggestions, so we can be more proactive
            appData.groceryAiPreferences = appData.groceryAiPreferences || {};
            appData.groceryAiPreferences.expiryThresholdDays = 5; // Show for items expiring within 5 days
            console.log('Expanded expiry threshold based on user preferences');
        }
        
        // Similarly adjust other thresholds based on user behavior
        if (acceptanceRates['grocery-repurchase'] > 0.6) {
            // User likes repurchase suggestions, be more proactive
            appData.groceryAiPreferences = appData.groceryAiPreferences || {};
            appData.groceryAiPreferences.repurchaseThreshold = 0.7; // Suggest repurchase earlier
            console.log('Adjusted repurchase threshold based on user preferences');
        }
    }
    
    // Add the suggestions to the app data
    if (suggestions.length > 0) {
        if (!appData.suggestions) {
            appData.suggestions = [];
        }
        
        // Add new suggestions, avoiding duplicates
        suggestions.forEach(suggestion => {
            // Check if we already have a similar suggestion
            const existingSuggestion = appData.suggestions.find(s => 
                s.type === suggestion.type && 
                s.groceryName === suggestion.groceryName
            );
            
            if (!existingSuggestion) {
                appData.suggestions.push(suggestion);
            }
        });
        
        saveData();
    }
}

// Analyze groceries that are about to expire
function analyzeExpiringGroceries() {
    if (!appData.groceries || !Array.isArray(appData.groceries)) {
        return;
    }

    const now = new Date();
    const suggestions = [];
    
    // Get the user's expiry threshold preference or use default (3-5 days)
    const expiryThresholdDays = appData.groceryAiPreferences?.expiryThresholdDays || 5;
    
    // Find items that will expire soon based on user preferences
    const expiringItems = appData.groceries.filter(item => {
        if (!item.expiryDate || !item.inStock) return false;
        
        const daysUntilExpiry = getDaysUntilExpiry(item.expiryDate);
        
        // Use the user's preference for the upper threshold
        // Items with <= 3 days are already in the "expiring soon" category in the UI
        return daysUntilExpiry > 3 && daysUntilExpiry <= expiryThresholdDays;
    });
    
    // Create suggestions for items that will expire soon
    expiringItems.forEach(item => {
        // Skip if this suggestion was dismissed recently
        if (appData.dismissedSuggestions && 
            appData.dismissedSuggestions[`grocery-${item.id}`] && 
            appData.dismissedSuggestions[`grocery-${item.id}`].includes('expiring')) {
            return;
        }
        
        const daysUntilExpiry = getDaysUntilExpiry(item.expiryDate);
        
        suggestions.push({
            id: Date.now() + Math.random(),
            type: 'grocery-expiring',
            groceryId: item.id,
            title: 'Use Soon or Freeze',
            description: `${item.name} will expire in ${daysUntilExpiry} days. Consider using it soon or freezing it to avoid waste.`,
            data: {
                groceryId: item.id,
                action: 'use-soon'
            }
        });
    });
    
    // Find expired items that are still in stock
    const expiredItems = appData.groceries.filter(item => {
        if (!item.expiryDate || !item.inStock) return false;
        
        const daysUntilExpiry = getDaysUntilExpiry(item.expiryDate);
        return daysUntilExpiry < 0;
    });
    
    // Create suggestions to remove expired items
    expiredItems.forEach(item => {
        // Skip if this suggestion was dismissed recently
        if (appData.dismissedSuggestions && 
            appData.dismissedSuggestions[`grocery-${item.id}`] && 
            appData.dismissedSuggestions[`grocery-${item.id}`].includes('expired')) {
            return;
        }
        
        const daysExpired = Math.abs(getDaysUntilExpiry(item.expiryDate));
        
        suggestions.push({
            id: Date.now() + Math.random(),
            type: 'grocery-expired',
            groceryId: item.id,
            title: 'Remove Expired Item',
            description: `${item.name} expired ${daysExpired} day${daysExpired !== 1 ? 's' : ''} ago. Consider removing it from your inventory.`,
            data: {
                groceryId: item.id,
                action: 'remove'
            }
        });
    });
    
    // Add the suggestions to the app data
    if (suggestions.length > 0) {
        if (!appData.suggestions) {
            appData.suggestions = [];
        }
        
        // Add new suggestions, avoiding duplicates
        suggestions.forEach(suggestion => {
            // Check if we already have a similar suggestion
            const existingSuggestion = appData.suggestions.find(s => 
                s.type === suggestion.type && 
                s.groceryId === suggestion.groceryId
            );
            
            if (!existingSuggestion) {
                appData.suggestions.push(suggestion);
            }
        });
        
        saveData();
    }
}

// Analyze shopping list for potential optimizations
function analyzeShoppingList() {
    if (!appData.groceries || !Array.isArray(appData.groceries)) {
        return;
    }
    
    const suggestions = [];
    
    // Find items that have been on the shopping list for a long time
    const longTimeItems = appData.groceries.filter(item => {
        if (item.inStock || !item.addedToListDate) return false;
        
        const daysSinceAdded = Math.floor((Date.now() - new Date(item.addedToListDate).getTime()) / (24 * 60 * 60 * 1000));
        return daysSinceAdded > 14; // Items on list for more than 2 weeks
    });
    
    // Create suggestions for items that have been on the list for a long time
    longTimeItems.forEach(item => {
        // Skip if this suggestion was dismissed recently
        if (appData.dismissedSuggestions && 
            appData.dismissedSuggestions[`grocery-${item.id}`] && 
            appData.dismissedSuggestions[`grocery-${item.id}`].includes('long-time')) {
            return;
        }
        
        suggestions.push({
            id: Date.now() + Math.random(),
            type: 'grocery-long-time',
            groceryId: item.id,
            title: 'Shopping List Review',
            description: `${item.name} has been on your shopping list for a while. Do you still need it?`,
            data: {
                groceryId: item.id,
                action: 'remove-from-list'
            }
        });
    });
    
    // Add the suggestions to the app data
    if (suggestions.length > 0) {
        if (!appData.suggestions) {
            appData.suggestions = [];
        }
        
        // Add new suggestions, avoiding duplicates
        suggestions.forEach(suggestion => {
            // Check if we already have a similar suggestion
            const existingSuggestion = appData.suggestions.find(s => 
                s.type === suggestion.type && 
                s.groceryId === suggestion.groceryId
            );
            
            if (!existingSuggestion) {
                appData.suggestions.push(suggestion);
            }
        });
        
        saveData();
    }
}

// Analyze grocery purchase patterns
function analyzeGroceryPatterns() {
    if (!appData.groceries || !Array.isArray(appData.groceries)) {
        return;
    }
    
    const suggestions = [];
    
    // Find items that are frequently purchased using the enhanced purchase patterns data
    if (appData.groceryPurchasePatterns) {
        Object.entries(appData.groceryPurchasePatterns).forEach(([itemName, purchases]) => {
            // Skip if fewer than 3 purchases
            if (!Array.isArray(purchases) || purchases.length < 3) {
                return;
            }
            
            // Check if this item is already in the shopping list
            const alreadyInList = appData.groceries.some(item => 
                item.name.toLowerCase() === itemName.toLowerCase() && !item.inStock
            );
            
            // Check if this item is in stock
            const inStock = appData.groceries.some(item => 
                item.name.toLowerCase() === itemName.toLowerCase() && item.inStock
            );
            
            // Only suggest adding to shopping list if not already in list and not in stock
            if (!alreadyInList && !inStock) {
                // Calculate average time between purchases
                const dates = purchases.map(p => new Date(p.date).getTime()).sort();
                let totalDays = 0;
                for (let i = 1; i < dates.length; i++) {
                    totalDays += (dates[i] - dates[i-1]) / (24 * 60 * 60 * 1000);
                }
                const avgDays = Math.round(totalDays / (dates.length - 1));
                
                // Calculate days since last purchase
                const daysSinceLastPurchase = Math.floor((Date.now() - dates[dates.length - 1]) / (24 * 60 * 60 * 1000));
                
                // Get the most common quantity purchased
                const quantities = purchases.map(p => p.quantity);
                const quantityCounts = {};
                let mostCommonQuantity = '1';
                let maxCount = 0;
                
                quantities.forEach(q => {
                    quantityCounts[q] = (quantityCounts[q] || 0) + 1;
                    if (quantityCounts[q] > maxCount) {
                        maxCount = quantityCounts[q];
                        mostCommonQuantity = q;
                    }
                });
                
                // Get the user's repurchase threshold preference or use default (0.8)
                const repurchaseThreshold = appData.groceryAiPreferences?.repurchaseThreshold || 0.8;
                
                // If it's been close to the average time between purchases, suggest adding to list
                // Use the user's preference for the threshold
                if (daysSinceLastPurchase >= avgDays * repurchaseThreshold) {
                    // Skip if this suggestion was dismissed recently
                    if (appData.dismissedSuggestions && 
                        appData.dismissedSuggestions[`grocery-pattern-${itemName}`] && 
                        appData.dismissedSuggestions[`grocery-pattern-${itemName}`].includes('repurchase')) {
                        return;
                    }
                    
                    suggestions.push({
                        id: Date.now() + Math.random(),
                        type: 'grocery-repurchase',
                        groceryName: itemName,
                        title: 'Add to Shopping List',
                        description: `You usually buy ${itemName} (${mostCommonQuantity}) every ${avgDays} days. It's been ${daysSinceLastPurchase} days since your last purchase.`,
                        data: {
                            groceryName: itemName,
                            quantity: mostCommonQuantity,
                            action: 'add-to-list'
                        }
                    });
                }
            }
        });
    }
    
    // Also check the shopping list history for patterns
    if (appData.groceryShoppingListHistory) {
        Object.entries(appData.groceryShoppingListHistory).forEach(([itemName, history]) => {
            // Skip if fewer than 3 entries
            if (!Array.isArray(history) || history.length < 3) {
                return;
            }
            
            // Check if this item is already in the shopping list
            const alreadyInList = appData.groceries.some(item => 
                item.name.toLowerCase() === itemName.toLowerCase() && !item.inStock
            );
            
            // Only analyze if not already in shopping list
            if (!alreadyInList) {
                // Calculate average time between adding to shopping list
                const dates = history.map(h => new Date(h.date).getTime()).sort();
                let totalDays = 0;
                for (let i = 1; i < dates.length; i++) {
                    totalDays += (dates[i] - dates[i-1]) / (24 * 60 * 60 * 1000);
                }
                const avgDays = Math.round(totalDays / (dates.length - 1));
                
                // Calculate days since last added to shopping list
                const daysSinceLastAdded = Math.floor((Date.now() - dates[dates.length - 1]) / (24 * 60 * 60 * 1000));
                
                // If it's been longer than the average time, suggest adding to list
                if (daysSinceLastAdded >= avgDays * 1.2) {
                    // Skip if this suggestion was dismissed recently
                    if (appData.dismissedSuggestions && 
                        appData.dismissedSuggestions[`grocery-pattern-${itemName}`] && 
                        appData.dismissedSuggestions[`grocery-pattern-${itemName}`].includes('shopping-pattern')) {
                        return;
                    }
                    
                    suggestions.push({
                        id: Date.now() + Math.random(),
                        type: 'grocery-shopping-pattern',
                        groceryName: itemName,
                        title: 'Add to Shopping List',
                        description: `You typically add ${itemName} to your shopping list every ${avgDays} days. It's been ${daysSinceLastAdded} days since you last added it.`,
                        data: {
                            groceryName: itemName,
                            action: 'add-to-list'
                        }
                    });
                }
            }
        });
    }
    
    // Add the suggestions to the app data
    if (suggestions.length > 0) {
        if (!appData.suggestions) {
            appData.suggestions = [];
        }
        
        // Add new suggestions, avoiding duplicates
        suggestions.forEach(suggestion => {
            // Check if we already have a similar suggestion
            const existingSuggestion = appData.suggestions.find(s => 
                s.type === suggestion.type && 
                s.groceryName === suggestion.groceryName
            );
            
            if (!existingSuggestion) {
                appData.suggestions.push(suggestion);
            }
        });
        
        saveData();
    }
}

// Handle grocery suggestion clicks
function handleGrocerySuggestionClick(suggestion) {
    const { type, data } = suggestion;
    
    if (type === 'grocery-expiring') {
        const { groceryId, action } = data;
        const item = appData.groceries.find(g => g.id === groceryId);
        
        if (item) {
            if (action === 'use-soon') {
                // Create a task to use this item
                const task = {
                    id: Date.now(),
                    title: `Use ${item.name} before it expires`,
                    category: 'Personal',
                    dueDate: new Date(new Date().getTime() + 2 * 24 * 60 * 60 * 1000).toISOString(), // Due in 2 days
                    completed: false,
                    repeat: 'never'
                };
                
                appData.tasks.push(task);
                saveData();
                renderTasks();
                showSyncStatus('Task added to use item before expiry!', true);
            }
        }
    } else if (type === 'grocery-expired') {
        const { groceryId, action } = data;
        const item = appData.groceries.find(g => g.id === groceryId);
        
        if (item && action === 'remove') {
            // Remove the expired item
            const index = appData.groceries.findIndex(g => g.id === groceryId);
            if (index !== -1) {
                appData.groceries.splice(index, 1);
                saveData();
                renderGrocery();
                showSyncStatus('Expired item removed!', true);
            }
        }
    } else if (type === 'grocery-long-time') {
        const { groceryId, action } = data;
        const item = appData.groceries.find(g => g.id === groceryId);
        
        if (item && action === 'remove-from-list') {
            // Remove from shopping list
            const index = appData.groceries.findIndex(g => g.id === groceryId);
            if (index !== -1) {
                appData.groceries.splice(index, 1);
                saveData();
                renderGrocery();
                showSyncStatus('Item removed from shopping list!', true);
            }
        }
    } else if (type === 'grocery-repurchase' || type === 'grocery-shopping-pattern') {
        const { groceryName, action, quantity } = data;
        
        if (action === 'add-to-list') {
            // Add to shopping list with quantity if available
            const newItem = {
                id: Date.now(),
                name: groceryName,
                inStock: false,
                addedToList: true,
                addedToListDate: new Date().toISOString(),
                quantity: quantity || '1' // Use the quantity from purchase history if available
            };
            
            appData.groceries.push(newItem);
            saveData();
            renderGrocery();
            
            const message = type === 'grocery-repurchase' 
                ? 'Item added to shopping list based on purchase history!' 
                : 'Item added to shopping list based on shopping patterns!';
                
            showSyncStatus(message, true);
            
            // Track this for future AI suggestions
            if (!appData.groceryAiActions) {
                appData.groceryAiActions = [];
            }
            
            // Record that the user accepted this suggestion
            appData.groceryAiActions.push({
                type: type,
                itemName: groceryName,
                action: 'accepted',
                date: new Date().toISOString()
            });
            
            saveData();
        }
    }
    
    // Remove the suggestion
    removeSuggestion(suggestion.id);
}

// =============== TASK AI FUNCTIONS ===============

// Estimate how long tasks might take based on title and category
function estimateTaskDurations() {
    if (!appData.taskDurations) {
        appData.taskDurations = {};
    }
    
    // Default durations by category (in minutes)
    const defaultDurations = {
        'Personal': 30,
        'Work': 60,
        'Shopping': 45,
        'Health': 60,
        'Finance': 30
    };
    
    // Keywords that might indicate longer or shorter tasks
    const durationKeywords = {
        'quick': 0.5,  // multiplier for shorter tasks
        'brief': 0.7,
        'short': 0.7,
        'small': 0.7,
        'long': 1.5,   // multiplier for longer tasks
        'big': 1.5,
        'complex': 2,
        'detailed': 1.5,
        'meeting': 1.2,
        'call': 1.2,
        'review': 1.3,
        'report': 1.5,
        'presentation': 2,
        'project': 2
    };
    
    // Analyze each task
    appData.tasks.forEach(task => {
        // Skip if already completed
        if (task.completed) return;
        
        // If we already have completion data for similar tasks, use that
        if (appData.taskPatterns[task.title] && appData.taskPatterns[task.title].length >= 2) {
            // We have historical data for this task, use it
            const completionTimes = appData.taskPatterns[task.title];
            // Calculate average duration between creation and completion
            let totalDuration = 0;
            let count = 0;
            
            for (let i = 0; i < completionTimes.length; i++) {
                const completionTime = new Date(completionTimes[i]);
                // Find the corresponding task creation time
                const matchingTask = appData.tasks.find(t => 
                    t.title === task.title && 
                    t.completed && 
                    new Date(t.completedAt).getTime() === completionTime.getTime()
                );
                
                if (matchingTask) {
                    const creationTime = new Date(matchingTask.createdAt);
                    const durationMs = completionTime - creationTime;
                    const durationMinutes = durationMs / (1000 * 60);
                    
                    // Only count reasonable durations (between 5 minutes and 8 hours)
                    if (durationMinutes >= 5 && durationMinutes <= 480) {
                        totalDuration += durationMinutes;
                        count++;
                    }
                }
            }
            
            if (count > 0) {
                // We have valid duration data
                appData.taskDurations[task.id] = Math.round(totalDuration / count);
                return;
            }
        }
        
        // Otherwise estimate based on category and keywords
        let baseDuration = defaultDurations[task.category] || 30;
        let multiplier = 1.0;
        
        // Check title for keywords
        const titleLower = task.title.toLowerCase();
        for (const [keyword, factor] of Object.entries(durationKeywords)) {
            if (titleLower.includes(keyword)) {
                multiplier *= factor;
            }
        }
        
        // Store the estimated duration
        appData.taskDurations[task.id] = Math.round(baseDuration * multiplier);
    });
    
    // Save the data
    saveData();
}

// Suggest dates and times for tasks that don't have them
function suggestTaskScheduling() {
    if (!appData.suggestions) {
        appData.suggestions = [];
    }
    
    const now = new Date();
    const suggestions = [];
    
    // Find tasks without due dates
    const tasksWithoutDates = appData.tasks.filter(task => 
        !task.completed && 
        !task.dueDate && 
        // Skip tasks with dismissed schedule suggestions
        !(appData.dismissedSuggestions[task.id] && 
          appData.dismissedSuggestions[task.id].includes('schedule'))
    );
    
    if (tasksWithoutDates.length === 0) return;
    
    // Clear previous date suggestions
    appData.suggestions = appData.suggestions.filter(s => s.type !== 'schedule');
    
    // Get all existing task times to avoid overlaps
    const busyTimes = appData.tasks
        .filter(task => !task.completed && task.dueDate)
        .map(task => {
            const date = new Date(task.dueDate);
            const duration = appData.taskDurations[task.id] || 30; // default 30 min
            return {
                start: date,
                end: new Date(date.getTime() + duration * 60 * 1000)
            };
        });
    
    // Find available slots in the next 7 days
    const availableSlots = [];
    const workHoursStart = 9; // 9 AM
    const workHoursEnd = 18;  // 6 PM
    
    // Generate slots for the next 7 days
    for (let dayOffset = 0; dayOffset < 7; dayOffset++) {
        const day = new Date(now);
        day.setDate(day.getDate() + dayOffset);
        day.setHours(workHoursStart, 0, 0, 0);
        
        const dayEnd = new Date(day);
        dayEnd.setHours(workHoursEnd, 0, 0, 0);
        
        // Start from current time if it's today
        const startTime = dayOffset === 0 && now.getHours() >= workHoursStart 
            ? new Date(now) 
            : new Date(day);
        
        // Skip if we're already past work hours today
        if (dayOffset === 0 && now.getHours() >= workHoursEnd) continue;
        
        // Create 30-minute slots throughout the day
        let slotStart = new Date(startTime);
        while (slotStart < dayEnd) {
            const slotEnd = new Date(slotStart.getTime() + 30 * 60 * 1000);
            
            // Check if this slot overlaps with any busy times
            const isOverlapping = busyTimes.some(busy => 
                (slotStart >= busy.start && slotStart < busy.end) || 
                (slotEnd > busy.start && slotEnd <= busy.end) ||
                (slotStart <= busy.start && slotEnd >= busy.end)
            );
            
            if (!isOverlapping) {
                availableSlots.push({
                    start: new Date(slotStart),
                    end: new Date(slotEnd)
                });
            }
            
            // Move to next slot
            slotStart = new Date(slotEnd);
        }
    }
    
    // Assign slots to tasks without dates
    tasksWithoutDates.forEach(task => {
        if (availableSlots.length > 0) {
            // Get the estimated duration
            const duration = appData.taskDurations[task.id] || 30;
            
            // Find a slot that can fit this task
            let bestSlotIndex = 0;
            let bestSlot = availableSlots[0];
            
            // Prefer slots that closely match the task duration
            for (let i = 0; i < availableSlots.length; i++) {
                const slot = availableSlots[i];
                const slotDuration = (slot.end - slot.start) / (60 * 1000);
                
                if (slotDuration >= duration && slotDuration <= duration * 1.5) {
                    bestSlotIndex = i;
                    bestSlot = slot;
                    break;
                }
            }
            
            // Create a suggestion
            appData.suggestions.push({
                id: Date.now() + Math.random(),
                type: 'schedule',
                taskId: task.id,
                title: `Schedule "${task.title}"`,
                description: `I suggest scheduling this task for ${formatDateTime(bestSlot.start)}`,
                data: {
                    taskId: task.id,
                    dueDate: bestSlot.start.toISOString(),
                    hasTime: true
                }
            });
            
            // Remove the used slot
            availableSlots.splice(bestSlotIndex, 1);
        }
    });
    
    saveData();
}

// Detect overlapping tasks and suggest rescheduling
function detectOverlappingTasks() {
    if (!appData.suggestions) {
        appData.suggestions = [];
    }
    
    // Clear previous overlap suggestions
    appData.suggestions = appData.suggestions.filter(s => s.type !== 'overlap');
    
    // Get all tasks with due dates that aren't completed
    const scheduledTasks = appData.tasks
        .filter(task => 
            !task.completed && 
            task.dueDate && 
            task.hasTime && 
            // Skip tasks with dismissed overlap suggestions
            !(appData.dismissedSuggestions[task.id] && 
              appData.dismissedSuggestions[task.id].includes('overlap'))
        )
        .map(task => {
            const date = new Date(task.dueDate);
            const duration = appData.taskDurations[task.id] || 30; // default 30 min
            return {
                id: task.id,
                title: task.title,
                start: date,
                end: new Date(date.getTime() + duration * 60 * 1000)
            };
        });
    
    // Find overlapping tasks
    const overlaps = [];
    for (let i = 0; i < scheduledTasks.length; i++) {
        for (let j = i + 1; j < scheduledTasks.length; j++) {
            const task1 = scheduledTasks[i];
            const task2 = scheduledTasks[j];
            
            // Check if they overlap
            if ((task1.start <= task2.start && task1.end > task2.start) ||
                (task2.start <= task1.start && task2.end > task1.start)) {
                
                // They overlap, find which one to reschedule
                // Prefer to reschedule the shorter task
                const task1Duration = task1.end - task1.start;
                const task2Duration = task2.end - task2.start;
                
                const taskToReschedule = task1Duration <= task2Duration ? task1 : task2;
                const otherTask = taskToReschedule === task1 ? task2 : task1;
                
                // Find a new time after the other task ends
                const newStart = new Date(otherTask.end.getTime() + 15 * 60 * 1000); // 15 min buffer
                
                // Add a suggestion
                overlaps.push({
                    id: Date.now() + Math.random(),
                    type: 'overlap',
                    taskId: taskToReschedule.id,
                    title: `Scheduling Conflict`,
                    description: `"${taskToReschedule.title}" overlaps with "${otherTask.title}". Reschedule to ${formatDateTime(newStart)}?`,
                    data: {
                        taskId: taskToReschedule.id,
                        dueDate: newStart.toISOString(),
                        hasTime: true
                    }
                });
            }
        }
    }
    
    // Add unique overlap suggestions (avoid multiple suggestions for the same task)
    const taskIdsWithSuggestions = new Set();
    overlaps.forEach(overlap => {
        if (!taskIdsWithSuggestions.has(overlap.taskId)) {
            appData.suggestions.push(overlap);
            taskIdsWithSuggestions.add(overlap.taskId);
        }
    });
    
    saveData();
}
