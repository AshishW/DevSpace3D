const checklistState = {
    'living-room': false,
    'library': false,
    'portfolio': false,
};

let checklistElement, checklistContainer, toggleButton;

export function initChecklist() {
    checklistElement = document.getElementById('checklist');
    checklistContainer = document.getElementById('checklistContainer');
    toggleButton = document.getElementById('checklistToggleBtn');

    if (!checklistElement || !checklistContainer || !toggleButton) {
        console.error("Checklist UI elements not found!");
        return;
    }

    toggleButton.addEventListener('click', () => {
        const isHidden = checklistContainer.classList.toggle('hidden');
        toggleButton.textContent = isHidden ? 'Show' : 'Hide';
    });

    renderChecklist();
}

function renderChecklist() {
    if (!checklistElement) return;
    for (const task in checklistState) {
        const li = checklistElement.querySelector(`[data-task="${task}"]`);
        if (li) {
            if (checklistState[task]) {
                li.classList.add('completed');
            } else {
                li.classList.remove('completed');
            }
        }
    }
}

export function completeTask(taskName) {
    if (checklistState.hasOwnProperty(taskName) && !checklistState[taskName]) {
        checklistState[taskName] = true;
        console.log(`Task completed: ${taskName}`);
        renderChecklist();
    }
}