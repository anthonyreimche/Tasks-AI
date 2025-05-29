// Render AI insights
// Initialize charts when the tab is loaded
let chartsInitialized = false;
let taskCompletionChart = null;
let categoryDistributionChart = null;
let groceryWasteChart = null;

// Function to render insights tab content
function renderInsights() {
    // Calculate insights data
    const insightsData = calculateInsightsData();
    
    // Render AI recommendations
    renderInsightRecommendations();
    
    // Update productivity score
    updateProductivityScore(insightsData.productivityScore);
    
    // Initialize or update charts
    if (!chartsInitialized) {
        initializeCharts(insightsData);
        chartsInitialized = true;
    } else {
        updateCharts(insightsData);
    }
}

// Function to calculate insights data from app data
function calculateInsightsData() {
    // Default data if not enough tasks or groceries
    const defaultData = {
        taskCompletion: {
            labels: ['Completed', 'Pending'],
            data: [0, 0],
            colors: ['rgba(16, 185, 129, 0.7)', 'rgba(239, 68, 68, 0.7)']
        },
        categoryDistribution: {
            labels: ['Work', 'Personal', 'Shopping', 'Health', 'Other'],
            data: [0, 0, 0, 0, 0],
            colors: [
                'rgba(59, 130, 246, 0.7)',
                'rgba(16, 185, 129, 0.7)',
                'rgba(245, 158, 11, 0.7)',
                'rgba(239, 68, 68, 0.7)',
                'rgba(139, 92, 246, 0.7)'
            ]
        },
        groceryWaste: {
            labels: ['Used', 'Expired', 'Saved'],
            data: [0, 0, 0],
            colors: ['rgba(16, 185, 129, 0.7)', 'rgba(239, 68, 68, 0.7)', 'rgba(59, 130, 246, 0.7)']
        },
        productivityScore: 0,
        recommendations: []
    };
    
    // If no app data, return default
    if (!appData || !appData.tasks || !appData.groceries) {
        return defaultData;
    }
    
    // Calculate task completion data
    const completedTasks = appData.tasks.filter(task => task.completed).length;
    const pendingTasks = appData.tasks.filter(task => !task.completed).length;
    const totalTasks = completedTasks + pendingTasks;
    
    if (totalTasks > 0) {
        defaultData.taskCompletion.data = [completedTasks, pendingTasks];
    }
    
    // Calculate category distribution
    const categories = {};
    appData.tasks.forEach(task => {
        const category = task.category || 'Other';
        categories[category] = (categories[category] || 0) + 1;
    });
    
    if (Object.keys(categories).length > 0) {
        defaultData.categoryDistribution.labels = Object.keys(categories);
        defaultData.categoryDistribution.data = Object.values(categories);
        
        // Generate colors for each category
        defaultData.categoryDistribution.colors = defaultData.categoryDistribution.labels.map((_, index) => {
            const hue = (index * 137) % 360; // Golden ratio to distribute colors
            return `hsla(${hue}, 70%, 60%, 0.7)`;
        });
    }
    
    // Calculate grocery waste prevention
    const usedGroceries = appData.groceries.filter(g => !g.inStock && !g.expired).length;
    const expiredGroceries = appData.groceries.filter(g => g.expired).length;
    const savedFromExpiry = appData.groceries.filter(g => g.savedFromExpiry).length || 
                          Math.floor(Math.random() * 5); // Placeholder for demo
    
    defaultData.groceryWaste.data = [usedGroceries, expiredGroceries, savedFromExpiry];
    
    // Calculate productivity score (0-100)
    let productivityScore = 0;
    
    if (totalTasks > 0) {
        // Base score on task completion rate (0-50 points)
        productivityScore += Math.round((completedTasks / totalTasks) * 50);
        
        // Add points for task diversity (0-15 points)
        productivityScore += Math.min(Object.keys(categories).length * 3, 15);
        
        // Add points for grocery management (0-20 points)
        if (appData.groceries.length > 0) {
            const expiryRatio = expiredGroceries / appData.groceries.length;
            productivityScore += Math.round((1 - expiryRatio) * 20);
        }
        
        // Add points for consistent usage (0-15 points)
        const daysActive = Math.min(appData.daysActive || 1, 30);
        productivityScore += Math.round((daysActive / 30) * 15);
    }
    
    defaultData.productivityScore = Math.min(Math.max(productivityScore, 0), 100);
    
    return defaultData;
}

// Initialize charts
function initializeCharts(data) {
    // Task Completion Chart
    const taskCompletionCtx = document.getElementById('task-completion-chart').getContext('2d');
    taskCompletionChart = new Chart(taskCompletionCtx, {
        type: 'doughnut',
        data: {
            labels: data.taskCompletion.labels,
            datasets: [{
                data: data.taskCompletion.data,
                backgroundColor: data.taskCompletion.colors,
                borderWidth: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            cutout: '70%',
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        color: getComputedStyle(document.documentElement).getPropertyValue('--text-primary'),
                        font: {
                            size: 12
                        }
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const label = context.label || '';
                            const value = context.raw || 0;
                            const total = context.dataset.data.reduce((a, b) => a + b, 0);
                            const percentage = Math.round((value / total) * 100);
                            return `${label}: ${value} (${percentage}%)`;
                        }
                    }
                }
            }
        }
    });
    
    // Category Distribution Chart
    const categoryDistributionCtx = document.getElementById('category-distribution-chart').getContext('2d');
    categoryDistributionChart = new Chart(categoryDistributionCtx, {
        type: 'bar',
        data: {
            labels: data.categoryDistribution.labels,
            datasets: [{
                data: data.categoryDistribution.data,
                backgroundColor: data.categoryDistribution.colors,
                borderWidth: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const label = context.label || '';
                            const value = context.raw || 0;
                            return `${label}: ${value} tasks`;
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        color: getComputedStyle(document.documentElement).getPropertyValue('--text-secondary'),
                        font: {
                            size: 10
                        }
                    },
                    grid: {
                        color: getComputedStyle(document.documentElement).getPropertyValue('--border')
                    }
                },
                x: {
                    ticks: {
                        color: getComputedStyle(document.documentElement).getPropertyValue('--text-secondary'),
                        font: {
                            size: 10
                        }
                    },
                    grid: {
                        display: false
                    }
                }
            }
        }
    });
    
    // Grocery Waste Chart
    const groceryWasteCtx = document.getElementById('grocery-waste-chart').getContext('2d');
    groceryWasteChart = new Chart(groceryWasteCtx, {
        type: 'pie',
        data: {
            labels: data.groceryWaste.labels,
            datasets: [{
                data: data.groceryWaste.data,
                backgroundColor: data.groceryWaste.colors,
                borderWidth: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        color: getComputedStyle(document.documentElement).getPropertyValue('--text-primary'),
                        font: {
                            size: 12
                        }
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const label = context.label || '';
                            const value = context.raw || 0;
                            const total = context.dataset.data.reduce((a, b) => a + b, 0);
                            const percentage = Math.round((value / total) * 100);
                            return `${label}: ${value} items (${percentage}%)`;
                        }
                    }
                }
            }
        }
    });
}

// Update charts with new data
function updateCharts(data) {
    // Update Task Completion Chart
    taskCompletionChart.data.labels = data.taskCompletion.labels;
    taskCompletionChart.data.datasets[0].data = data.taskCompletion.data;
    taskCompletionChart.data.datasets[0].backgroundColor = data.taskCompletion.colors;
    taskCompletionChart.update();
    
    // Update Category Distribution Chart
    categoryDistributionChart.data.labels = data.categoryDistribution.labels;
    categoryDistributionChart.data.datasets[0].data = data.categoryDistribution.data;
    categoryDistributionChart.data.datasets[0].backgroundColor = data.categoryDistribution.colors;
    categoryDistributionChart.update();
    
    // Update Grocery Waste Chart
    groceryWasteChart.data.labels = data.groceryWaste.labels;
    groceryWasteChart.data.datasets[0].data = data.groceryWaste.data;
    groceryWasteChart.data.datasets[0].backgroundColor = data.groceryWaste.colors;
    groceryWasteChart.update();
}

// Update productivity score with animation
function updateProductivityScore(score) {
    const scoreElement = document.getElementById('productivity-score-value');
    const currentScore = parseInt(scoreElement.textContent) || 0;
    
    // Animate the score change
    const duration = 1500; // 1.5 seconds
    const frameRate = 60;
    const frames = duration / (1000 / frameRate);
    const increment = (score - currentScore) / frames;
    let currentFrame = 0;
    
    const animateScore = () => {
        currentFrame++;
        const newScore = Math.round(currentScore + (increment * currentFrame));
        scoreElement.textContent = newScore;
        
        if (currentFrame < frames) {
            requestAnimationFrame(animateScore);
        } else {
            scoreElement.textContent = score;
        }
    };
    
    requestAnimationFrame(animateScore);
}

// Render AI recommendations for insights tab
function renderInsightRecommendations() {
    const recommendationsContainer = document.getElementById('insights-ai-suggestions-container');
    const recommendations = getAIRecommendations();
    
    if (!recommendations || recommendations.length === 0) {
        recommendationsContainer.innerHTML = `
            <div class="empty-state">
                <p>Complete more tasks to get AI insights and recommendations.</p>
            </div>
        `;
        return;
    }
    
    // Build HTML for recommendations
    const recommendationsHTML = recommendations.map(recommendation => {
        // Create action buttons HTML if actions are present
        const actionsHTML = recommendation.actions ? recommendation.actions.map(action => {
            return `<button class="insight-action-button ${action.secondary ? 'secondary' : ''}" 
                           onclick="${action.onclick}">${action.label}</button>`;
        }).join('') : '';
        
        return `
        <div class="insight-recommendation">
            <div class="insight-recommendation-title">
                ${recommendation.icon} ${recommendation.title}
            </div>
            <div class="insight-recommendation-description">
                ${recommendation.description}
            </div>
            ${actionsHTML ? `<div class="insight-recommendation-actions">${actionsHTML}</div>` : ''}
        </div>
        `;
    }).join('');
    
    recommendationsContainer.innerHTML = recommendationsHTML;
}

// Get AI recommendations
function getAIRecommendations() {
    const recommendations = [];
    const now = new Date();
    
    // Productivity patterns
    if (appData.tasks.filter(t => t.completed).length >= 5) {
        // Find most productive day of week
        const completedTasks = appData.tasks.filter(t => t.completed && t.completedAt);
        const dayCount = [0, 0, 0, 0, 0, 0, 0]; // Sun, Mon, Tue, Wed, Thu, Fri, Sat
        
        completedTasks.forEach(task => {
            const completionDate = new Date(task.completedAt);
            dayCount[completionDate.getDay()]++;
        });
        
        const maxDay = dayCount.indexOf(Math.max(...dayCount));
        const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        
        if (Math.max(...dayCount) > 0) {
            recommendations.push({
                icon: '📊',
                title: 'Productivity Patterns',
                content: `You're most productive on ${days[maxDay]}. Consider scheduling important tasks for this day.`,
                timeline: [
                    { content: `${dayCount[1]} tasks completed on Mondays`, date: '' },
                    { content: `${dayCount[2]} tasks completed on Tuesdays`, date: '' },
                    { content: `${dayCount[3]} tasks completed on Wednesdays`, date: '' },
                    { content: `${dayCount[4]} tasks completed on Thursdays`, date: '' },
                    { content: `${dayCount[5]} tasks completed on Fridays`, date: '' }
                ]
            });
        }
    }
    
    // Check for overdue tasks
    const overdueTasks = appData.tasks.filter(task => {
        if (task.completed) return false;
        if (!task.dueDate) return false;
        
        const dueDate = new Date(task.dueDate);
        const today = new Date();
        
        return dueDate < today;
    });
    
    if (overdueTasks.length > 0) {
        recommendations.push({
            icon: '⚠️',
            title: 'Overdue Tasks',
            description: `You have ${overdueTasks.length} overdue task${overdueTasks.length > 1 ? 's' : ''}. Consider rescheduling or completing them soon.`,
            actions: [
                {
                    label: 'View Tasks',
                    onclick: "switchTab('tasks')"
                },
                {
                    label: 'Dismiss',
                    onclick: "dismissInsightRecommendation(this)",
                    secondary: true
                }
            ]
        });
    }
    
    // Check for task patterns
    const taskCategories = {};
    appData.tasks.forEach(task => {
        const category = task.category || 'Uncategorized';
        taskCategories[category] = (taskCategories[category] || 0) + 1;
    });
    
    const sortedCategories = Object.entries(taskCategories)
        .sort((a, b) => b[1] - a[1]);
    
    if (sortedCategories.length > 0) {
        const topCategory = sortedCategories[0];
        const leastUsedCategories = sortedCategories.slice(-2);
        
        if (leastUsedCategories.length > 0 && leastUsedCategories[0][1] < topCategory[1] / 3) {
            // Suggest balancing categories
            recommendations.push({
                icon: '📊',
                title: 'Balance Your Tasks',
                description: `Most of your tasks are in the "${topCategory[0]}" category. Consider adding more tasks to other categories like "${leastUsedCategories[0][0]}" for better work-life balance.`,
                actions: [
                    {
                        label: 'Add Task',
                        onclick: "openAddTaskModal()"
                    },
                    {
                        label: 'Dismiss',
                        onclick: "dismissInsightRecommendation(this)",
                        secondary: true
                    }
                ]
            });
        }
    }
    
    // Check for productivity patterns
    const completedTasks = appData.tasks.filter(task => task.completed);
    const pendingTasks = appData.tasks.filter(task => !task.completed);
    
    if (completedTasks.length > 0) {
        // Group by completion date
        const completionByDate = {};
        completedTasks.forEach(task => {
            if (!task.completedDate) return;
            
            const date = formatDate(task.completedDate);
            completionByDate[date] = (completionByDate[date] || 0) + 1;
        });
        
        const sortedDates = Object.entries(completionByDate)
            .sort((a, b) => b[1] - a[1]);
        
        if (sortedDates.length > 0) {
            const topDate = sortedDates[0];
            recommendations.push({
                icon: '🔥',
                title: 'Productivity Insight',
                description: `Your most productive day was ${topDate[0]} with ${topDate[1]} completed tasks. Try to identify what made that day successful and replicate those conditions.`,
                actions: [
                    {
                        label: 'Dismiss',
                        onclick: "dismissInsightRecommendation(this)",
                        secondary: true
                    }
                ]
            });
        }
    }
    
    // Check for tasks without due dates
    const tasksWithoutDueDates = pendingTasks.filter(task => !task.dueDate);
    if (tasksWithoutDueDates.length > 2) {
        recommendations.push({
            icon: '📅',
            title: 'Schedule Your Tasks',
            description: `You have ${tasksWithoutDueDates.length} tasks without due dates. Setting deadlines can help you stay organized and prioritize better.`,
            actions: [
                {
                    label: 'View Tasks',
                    onclick: "switchTab('tasks')"
                },
                {
                    label: 'Dismiss',
                    onclick: "dismissInsightRecommendation(this)",
                    secondary: true
                }
            ]
        });
    }
    
    // Check for grocery insights
    if (appData.groceries && appData.groceries.length > 0) {
        // Check for expiring items
        const expiringItems = appData.groceries.filter(item => {
            if (!item.expiryDate || !item.inStock) return false;
            
            const daysUntilExpiry = getDaysUntilExpiry(item.expiryDate);
            return daysUntilExpiry >= 0 && daysUntilExpiry <= 3;
        });
        
        if (expiringItems.length > 0) {
            recommendations.push({
                icon: '🥕',
                title: 'Grocery Waste Prevention',
                description: `You have ${expiringItems.length} grocery item${expiringItems.length > 1 ? 's' : ''} expiring soon. Check your inventory to reduce food waste.`,
                actions: [
                    {
                        label: 'View Groceries',
                        onclick: "switchTab('grocery')"
                    },
                    {
                        label: 'Dismiss',
                        onclick: "dismissInsightRecommendation(this)",
                        secondary: true
                    }
                ]
            });
        }
    }
    
    // Add a general productivity tip
    const productivityTips = [
        "Try the Pomodoro Technique: 25 minutes of focused work followed by a 5-minute break.",
        "Consider organizing tasks using the Eisenhower Matrix: urgent/important, not urgent/important, urgent/not important, not urgent/not important.",
        "Set SMART goals: Specific, Measurable, Achievable, Relevant, and Time-bound.",
        "Try time-blocking your day to allocate specific time slots for different types of tasks.",
        "Consider using the 2-minute rule: If a task takes less than 2 minutes, do it immediately."
    ];
    
    recommendations.push({
        icon: '💡',
        title: 'Productivity Tip',
        description: productivityTips[Math.floor(Math.random() * productivityTips.length)],
        actions: [
            {
                label: 'Dismiss',
                onclick: "dismissInsightRecommendation(this)",
                secondary: true
            }
        ]
    });
    
    return recommendations;
}

// Function to dismiss an insight recommendation
function dismissInsightRecommendation(element) {
    const recommendation = element.closest('.insight-recommendation');
    if (recommendation) {
        recommendation.style.opacity = '0';
        recommendation.style.height = recommendation.offsetHeight + 'px';
        recommendation.style.marginTop = '0';
        recommendation.style.marginBottom = '0';
        recommendation.style.paddingTop = '0';
        recommendation.style.paddingBottom = '0';
        recommendation.style.overflow = 'hidden';
        
        setTimeout(() => {
            recommendation.style.height = '0';
            setTimeout(() => {
                recommendation.remove();
            }, 300);
        }, 300);
    }
}

// ... (rest of the code remains the same)
