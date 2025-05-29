// Render passwords
function renderPasswords() {
    const passwordsContainer = document.getElementById('passwords-container');
    
    if (appData.passwords.length === 0) {
        passwordsContainer.innerHTML = `
            <div class="empty-state">
                <p>No passwords saved yet. Add your first password!</p>
            </div>
        `;
        return;
    }
    
    const passwordsList = appData.passwords.map(password => `
        <div class="password-item">
            <div class="password-service">${password.service}</div>
            <div class="password-username">${password.username}</div>
            ${password.notes ? `<div class="password-notes">${password.notes}</div>` : ''}
            <div class="password-meta">Added: ${formatDate(password.createdAt)}</div>
            <div class="password-actions">
                <div class="password-action" onclick="showPassword(${password.id})">👁️ Show</div>
                <div class="password-action" onclick="deletePassword(${password.id})">🗑️ Delete</div>
            </div>
        </div>
    `).join('');
    
    passwordsContainer.innerHTML = passwordsList;
}

// Password functions
function showPassword(passwordId) {
    const password = appData.passwords.find(p => p.id === passwordId);
    if (password) {
        // Simple obfuscation - in real app, use proper encryption
        const decrypted = atob(password.value);
        alert(`Password for ${password.service}: ${decrypted}\n\nNote: In a real app, this would require authentication.`);
    }
}

function deletePassword(passwordId) {
    if (confirm('Delete this password?')) {
        appData.passwords = appData.passwords.filter(p => p.id !== passwordId);
        saveData();
        renderPasswords();
    }
}

function addPassword(event) {
    event.preventDefault();
    
    const password = {
        id: Date.now(),
        service: document.getElementById('password-service').value,
        username: document.getElementById('password-username').value,
        value: btoa(document.getElementById('password-value').value), // Simple obfuscation
        notes: document.getElementById('password-notes').value || null,
        createdAt: new Date().toISOString()
    };
    
    appData.passwords.push(password);
    saveData();
    renderPasswords();
    closeModal('password-modal');
    document.getElementById('add-password-form').reset();
}
