// AI Job Automator - Background Service Worker
// Handles extension events and storage sync

// Listen for installation
chrome.runtime.onInstalled.addListener((details) => {
    console.log('AI Job Automator installed!', details);

    // Set default profile
    chrome.storage.local.set({
        userProfile: {
            name: 'Demo User',
            email: 'demo@example.com',
            phone: '+91 9876543210',
            experience: [
                { company: 'Tech Corp', title: 'Software Engineer', years: '2' }
            ],
            skills: ['JavaScript', 'React', 'Node.js', 'Python'],
            education: 'B.Tech Computer Science',
            linkedin: 'https://linkedin.com/in/demo'
        },
        credits: 10,
        autoFillCount: 0
    });

    // Create context menu (only on install)
    try {
        chrome.contextMenus.create({
            id: 'fill-field',
            title: 'Auto-fill with AI Job Automator',
            contexts: ['editable']
        });
    } catch (e) {
        console.log('Context menu error:', e);
    }
});

// Listen for messages from content scripts
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'getProfile') {
        chrome.storage.local.get(['userProfile'], (result) => {
            sendResponse({ profile: result.userProfile });
        });
        return true;
    }

    if (request.action === 'saveProfile') {
        chrome.storage.local.set({ userProfile: request.profile }, () => {
            sendResponse({ success: true });
        });
        return true;
    }

    if (request.action === 'incrementAutoFill') {
        chrome.storage.local.get(['autoFillCount'], (result) => {
            const newCount = (result.autoFillCount || 0) + 1;
            chrome.storage.local.set({ autoFillCount: newCount }, () => {
                sendResponse({ count: newCount });
            });
        });
        return true;
    }

    if (request.action === 'useCredit') {
        chrome.storage.local.get(['credits'], (result) => {
            const currentCredits = result.credits || 0;
            if (currentCredits > 0) {
                chrome.storage.local.set({ credits: currentCredits - 1 }, () => {
                    sendResponse({ success: true, remaining: currentCredits - 1 });
                });
            } else {
                sendResponse({ success: false, error: 'No credits remaining' });
            }
        });
        return true;
    }
});

// Context menu click handler - wrapped in try-catch
try {
    chrome.contextMenus.onClicked.addListener((info, tab) => {
        if (info.menuItemId === 'fill-field') {
            chrome.tabs.sendMessage(tab.id, { action: 'fillCurrentField' });
        }
    });
} catch (e) {
    console.log('Context menu listener error:', e);
}
