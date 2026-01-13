// AI Job Automator - Popup Script

// Default profile data
const DEFAULT_PROFILE = {
    name: 'Demo User',
    email: 'demo@example.com',
    phone: '+91 9876543210',
    experience: [
        { company: 'Tech Corp', title: 'Software Engineer', years: '2' }
    ],
    skills: ['JavaScript', 'React', 'Node.js', 'Python'],
    education: 'B.Tech Computer Science'
};

// Elements
const profileName = document.getElementById('profile-name');
const profileEmail = document.getElementById('profile-email');
const fieldsCount = document.getElementById('fields-count');
const filledCount = document.getElementById('filled-count');
const scanBtn = document.getElementById('scan-btn');
const fillBtn = document.getElementById('fill-btn');
const resetBtn = document.getElementById('reset-btn');
const progressSection = document.getElementById('progress-section');
const progressFill = document.getElementById('progress-fill');
const fieldsSection = document.getElementById('fields-section');
const logSection = document.getElementById('log-section');
const statusBadge = document.getElementById('status-badge');

let detectedFields = [];
let userProfile = DEFAULT_PROFILE;

// Initialize
document.addEventListener('DOMContentLoaded', async () => {
    await loadProfile();
    updateUI();
});

// Load profile from storage
async function loadProfile() {
    try {
        const result = await chrome.storage.local.get(['userProfile']);
        if (result.userProfile) {
            userProfile = result.userProfile;
        }
        profileName.textContent = userProfile.name || 'Set up profile';
        profileEmail.textContent = userProfile.email || 'Click to configure';
    } catch (error) {
        console.error('Error loading profile:', error);
        profileName.textContent = DEFAULT_PROFILE.name;
        profileEmail.textContent = DEFAULT_PROFILE.email;
    }
}

// Update UI state
function updateUI() {
    fieldsCount.textContent = detectedFields.length;
    filledCount.textContent = detectedFields.filter(f => f.filled).length;
}

// Add log entry
function addLog(message) {
    logSection.classList.remove('hidden');
    const entry = document.createElement('div');
    entry.className = 'log-entry';
    entry.textContent = `[${new Date().toLocaleTimeString()}] ${message}`;
    logSection.appendChild(entry);
    logSection.scrollTop = logSection.scrollHeight;
}

// Scan page for forms
scanBtn.addEventListener('click', async () => {
    addLog('🔍 Scanning page for form fields...');
    statusBadge.textContent = '● Scanning...';
    statusBadge.className = 'status-badge status-no-profile';

    try {
        // Get current tab
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

        // Execute content script to scan forms
        const result = await chrome.scripting.executeScript({
            target: { tabId: tab.id },
            func: scanFormFields
        });

        if (result && result[0] && result[0].result) {
            detectedFields = result[0].result.map(field => ({
                ...field,
                value: getValueForField(field),
                filled: false
            }));

            addLog(`✅ Found ${detectedFields.length} form fields`);
            displayFields();

            if (detectedFields.length > 0) {
                fillBtn.classList.remove('hidden');
                statusBadge.textContent = '● Fields Detected';
                statusBadge.className = 'status-badge status-ready';
            } else {
                addLog('⚠️ No form fields found on this page');
            }
        }
    } catch (error) {
        addLog(`❌ Error: ${error.message}`);
        console.error(error);
    }

    updateUI();
});

// Get value for a field based on its type/name
function getValueForField(field) {
    const nameLower = field.name.toLowerCase();
    const placeholder = (field.placeholder || '').toLowerCase();

    // Name fields
    if (nameLower.includes('name') || placeholder.includes('name')) {
        if (nameLower.includes('first')) return userProfile.name.split(' ')[0];
        if (nameLower.includes('last')) return userProfile.name.split(' ').slice(1).join(' ');
        return userProfile.name;
    }

    // Email
    if (nameLower.includes('email') || placeholder.includes('email')) {
        return userProfile.email;
    }

    // Phone
    if (nameLower.includes('phone') || nameLower.includes('mobile') || placeholder.includes('phone')) {
        return userProfile.phone;
    }

    // LinkedIn
    if (nameLower.includes('linkedin')) {
        return 'https://linkedin.com/in/demo-user';
    }

    // Experience
    if (nameLower.includes('experience') || nameLower.includes('years')) {
        return userProfile.experience?.[0]?.years || '2';
    }

    // Company
    if (nameLower.includes('company') || nameLower.includes('employer')) {
        return userProfile.experience?.[0]?.company || '';
    }

    // Title
    if (nameLower.includes('title') || nameLower.includes('position') || nameLower.includes('role')) {
        return userProfile.experience?.[0]?.title || '';
    }

    // Skills
    if (nameLower.includes('skills')) {
        return userProfile.skills?.join(', ') || '';
    }

    // Education
    if (nameLower.includes('education') || nameLower.includes('degree')) {
        return userProfile.education || '';
    }

    return '';
}

// Display detected fields
function displayFields() {
    fieldsSection.classList.remove('hidden');
    fieldsSection.innerHTML = '';

    detectedFields.forEach((field, index) => {
        const item = document.createElement('div');
        item.className = 'field-item';
        item.innerHTML = `
      <span class="field-name">${field.label || field.name || `Field ${index + 1}`}</span>
      <span class="field-value" title="${field.value}">${field.value || '(empty)'}</span>
    `;
        fieldsSection.appendChild(item);
    });
}

// Fill all fields
fillBtn.addEventListener('click', async () => {
    addLog('⚡ Starting auto-fill...');
    progressSection.classList.remove('hidden');
    fillBtn.disabled = true;

    try {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

        for (let i = 0; i < detectedFields.length; i++) {
            const field = detectedFields[i];
            const progress = ((i + 1) / detectedFields.length) * 100;
            progressFill.style.width = `${progress}%`;

            addLog(`✏️ Filling: ${field.label || field.name}`);

            // Execute fill script
            await chrome.scripting.executeScript({
                target: { tabId: tab.id },
                func: fillSingleField,
                args: [field.selector, field.value]
            });

            detectedFields[i].filled = true;
            updateUI();

            // Small delay between fields
            await new Promise(resolve => setTimeout(resolve, 300));
        }

        addLog('🎉 All fields filled successfully!');
        statusBadge.textContent = '● Complete!';
        statusBadge.className = 'status-badge status-ready';
        resetBtn.classList.remove('hidden');
        fillBtn.classList.add('hidden');

    } catch (error) {
        addLog(`❌ Error: ${error.message}`);
    }

    fillBtn.disabled = false;
});

// Reset
resetBtn.addEventListener('click', () => {
    detectedFields = [];
    fieldsSection.innerHTML = '';
    fieldsSection.classList.add('hidden');
    logSection.innerHTML = '';
    logSection.classList.add('hidden');
    progressSection.classList.add('hidden');
    progressFill.style.width = '0%';
    fillBtn.classList.add('hidden');
    resetBtn.classList.add('hidden');
    statusBadge.textContent = '● Ready to Auto-Fill';
    updateUI();
});

// ========================================
// Content Script Functions (injected)
// ========================================

// Scan form fields on the page
function scanFormFields() {
    const fields = [];
    const inputs = document.querySelectorAll('input, textarea, select');

    inputs.forEach((el, index) => {
        // Skip hidden and certain types
        if (el.type === 'hidden' || el.type === 'submit' || el.type === 'button') return;
        if (el.offsetWidth === 0 && el.offsetHeight === 0) return;

        // Get label
        let label = '';
        const labelEl = document.querySelector(`label[for="${el.id}"]`);
        if (labelEl) {
            label = labelEl.textContent.trim();
        } else if (el.closest('label')) {
            label = el.closest('label').textContent.trim();
        }

        // Create unique selector
        let selector = '';
        if (el.id) {
            selector = `#${el.id}`;
        } else if (el.name) {
            selector = `[name="${el.name}"]`;
        } else {
            selector = `input:nth-of-type(${index + 1})`;
        }

        fields.push({
            type: el.type || el.tagName.toLowerCase(),
            name: el.name || el.id || `field_${index}`,
            label: label,
            placeholder: el.placeholder || '',
            selector: selector,
            required: el.required
        });
    });

    return fields;
}

// Fill a single field
function fillSingleField(selector, value) {
    try {
        const el = document.querySelector(selector);
        if (!el || !value) return false;

        // Focus the element
        el.focus();

        // Set value
        el.value = value;

        // Trigger events
        el.dispatchEvent(new Event('input', { bubbles: true }));
        el.dispatchEvent(new Event('change', { bubbles: true }));
        el.dispatchEvent(new Event('blur', { bubbles: true }));

        // Add visual feedback
        el.style.backgroundColor = '#d4edda';
        setTimeout(() => {
            el.style.backgroundColor = '';
        }, 1000);

        return true;
    } catch (error) {
        console.error('Fill error:', error);
        return false;
    }
}
