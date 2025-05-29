// Test script for grocery AI suggestions (button removed)
// This function is kept for reference and debugging purposes
function testGroceryAI() {
    console.log('Running grocery AI test');
    
    // Create a test expiring item
    const now = new Date();
    const testItem = {
        id: 999,
        name: 'Test Expiring Item',
        expiryDate: new Date(now.getTime() + 4 * 24 * 60 * 60 * 1000).toISOString(), // 4 days from now
        quantity: '1 package',
        inStock: true,
        addedToList: false
    };
    
    // Add the test item to the groceries array
    appData.groceries.push(testItem);
    console.log('Added test item to groceries:', testItem);
    
    // Force run the AI analysis
    console.log('Running AI analysis...');
    analyzeExpiringGroceries();
    analyzeShoppingList();
    analyzeGroceryPatterns();
    
    // Switch to grocery tab and render
    console.log('Switching to grocery tab...');
    switchTab('grocery');
    
    // Log the current suggestions
    console.log('Current suggestions:', appData.suggestions);
    
    // Force render the grocery AI suggestions
    const container = document.getElementById('grocery-ai-suggestions-container');
    console.log('Grocery AI container:', container);
    if (container) {
        renderGroceryAISuggestions(container);
        console.log('Rendered grocery AI suggestions');
    } else {
        console.error('Could not find grocery-ai-suggestions-container');
    }
}

// No longer automatically adding the test button
// The function is kept for reference and can be called manually from the console if needed
