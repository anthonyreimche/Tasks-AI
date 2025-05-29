// Render projects
function renderProjects() {
    const projectsContainer = document.getElementById('projects-container');
    
    if (appData.projects.length === 0) {
        projectsContainer.innerHTML = `
            <div class="empty-state">
                <p>No projects yet. Add your first project!</p>
            </div>
        `;
        return;
    }
    
    const projectsList = appData.projects.map(project => {
        const daysUntilDeadline = project.deadline ? 
            Math.ceil((new Date(project.deadline) - new Date()) / (1000 * 60 * 60 * 24)) : 
            null;
        
        return `
            <div class="project-item">
                <div class="project-header">
                    <div class="project-title">${project.title}</div>
                    ${project.deadline ? 
                        `<div class="project-deadline ${daysUntilDeadline < 7 ? 'expiring' : ''}">
                            ${daysUntilDeadline > 0 ? 
                                `${daysUntilDeadline} days left` : 
                                'Deadline passed'}
                        </div>` : 
                        ''}
                </div>
                <div class="project-meta">
                    ${project.deadline ? `Deadline: ${formatDate(project.deadline)}` : ''}
                </div>
                <div class="project-progress">
                    <div class="project-progress-bar" style="width: ${project.progress}%"></div>
                </div>
                ${project.milestones && project.milestones.length > 0 ? 
                    `<div class="project-milestones">
                        ${renderProjectMilestones(project.milestones)}
                    </div>` : 
                    ''}
            </div>
        `;
    }).join('');
    
    projectsContainer.innerHTML = projectsList;
}

// Render project milestones
function renderProjectMilestones(milestones) {
    return milestones.map(milestone => `
        <div class="milestone-item">
            <div class="milestone-checkbox ${milestone.completed ? 'checked' : ''}"></div>
            <div class="milestone-content">
                <div class="milestone-title">${milestone.title}</div>
                <div class="milestone-date">${formatDate(milestone.date)}</div>
            </div>
        </div>
    `).join('');
}
