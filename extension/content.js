// AI Job Automator - Content Script
// Runs on every page to detect forms and enable auto-fill

(function () {
    'use strict';

    // Create floating button
    const createFloatingButton = () => {
        // Check if already exists
        if (document.getElementById('ai-job-automator-btn')) return;

        const btn = document.createElement('div');
        btn.id = 'ai-job-automator-btn';
        btn.innerHTML = '✨';
        btn.title = 'AI Job Automator - Click to auto-fill';

        btn.style.cssText = `
      position: fixed;
      bottom: 20px;
      right: 20px;
      width: 50px;
      height: 50px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 24px;
      cursor: pointer;
      z-index: 999999;
      box-shadow: 0 4px 20px rgba(102, 126, 234, 0.4);
      transition: all 0.3s;
    `;

        btn.addEventListener('mouseenter', () => {
            btn.style.transform = 'scale(1.1)';
            btn.style.boxShadow = '0 6px 30px rgba(102, 126, 234, 0.6)';
        });

        btn.addEventListener('mouseleave', () => {
            btn.style.transform = 'scale(1)';
            btn.style.boxShadow = '0 4px 20px rgba(102, 126, 234, 0.4)';
        });

        btn.addEventListener('click', () => {
            showAutoFillPanel();
        });

        document.body.appendChild(btn);
    };

    // Show auto-fill panel
    const showAutoFillPanel = () => {
        // Remove existing panel
        const existing = document.getElementById('ai-job-automator-panel');
        if (existing) {
            existing.remove();
            return;
        }

        const panel = document.createElement('div');
        panel.id = 'ai-job-automator-panel';
        panel.innerHTML = `
      <div class="aija-header">
        <span class="aija-logo">✨</span>
        <span class="aija-title">AI Job Automator</span>
        <button class="aija-close">×</button>
      </div>
      <div class="aija-content">
        <div class="aija-status" id="aija-status">
          Ready to scan form fields
        </div>
        <div class="aija-fields" id="aija-fields"></div>
        <div class="aija-progress" id="aija-progress" style="display:none;">
          <div class="aija-progress-bar">
            <div class="aija-progress-fill" id="aija-progress-fill"></div>
          </div>
        </div>
      </div>
      <div class="aija-actions">
        <button class="aija-btn aija-btn-scan" id="aija-scan">🔍 Scan Form</button>
        <button class="aija-btn aija-btn-fill" id="aija-fill" disabled>⚡ Auto-Fill</button>
      </div>
    `;

        panel.style.cssText = `
      position: fixed;
      bottom: 80px;
      right: 20px;
      width: 320px;
      background: white;
      border-radius: 16px;
      box-shadow: 0 10px 50px rgba(0,0,0,0.2);
      z-index: 999999;
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      overflow: hidden;
    `;

        document.body.appendChild(panel);

        // Event listeners
        panel.querySelector('.aija-close').addEventListener('click', () => panel.remove());
        panel.querySelector('#aija-scan').addEventListener('click', scanAndDisplayFields);
        panel.querySelector('#aija-fill').addEventListener('click', fillAllFields);
    };

    // Scan and display fields
    const scanAndDisplayFields = () => {
        const statusEl = document.getElementById('aija-status');
        const fieldsEl = document.getElementById('aija-fields');
        const fillBtn = document.getElementById('aija-fill');

        statusEl.textContent = '🔍 Scanning...';
        fieldsEl.innerHTML = '';

        const fields = detectFormFields();

        if (fields.length === 0) {
            statusEl.textContent = '⚠️ No form fields found';
            return;
        }

        statusEl.textContent = `✅ Found ${fields.length} fields`;
        fillBtn.disabled = false;

        fields.forEach(field => {
            const div = document.createElement('div');
            div.className = 'aija-field-item';
            div.style.cssText = `
        display: flex;
        justify-content: space-between;
        padding: 8px 12px;
        background: #f8f9fa;
        border-radius: 8px;
        margin-bottom: 6px;
        font-size: 12px;
      `;
            div.innerHTML = `
        <span style="color:#333;font-weight:500;">${field.label || field.name}</span>
        <span style="color:#667eea;max-width:120px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">
          ${field.value || '(auto)'}
        </span>
      `;
            fieldsEl.appendChild(div);
        });

        // Store fields for filling
        window.__aijaFields = fields;
    };

    // Fill all fields
    const fillAllFields = async () => {
        const fields = window.__aijaFields || [];
        const progressDiv = document.getElementById('aija-progress');
        const progressFill = document.getElementById('aija-progress-fill');
        const statusEl = document.getElementById('aija-status');

        if (fields.length === 0) return;

        progressDiv.style.display = 'block';

        for (let i = 0; i < fields.length; i++) {
            const field = fields[i];
            const progress = ((i + 1) / fields.length) * 100;
            progressFill.style.width = `${progress}%`;
            statusEl.textContent = `✏️ Filling: ${field.label || field.name}...`;

            fillField(field);
            await new Promise(r => setTimeout(r, 400));
        }

        statusEl.textContent = '🎉 All fields filled!';

        // Highlight submit button
        const submitBtn = document.querySelector('button[type="submit"], input[type="submit"]');
        if (submitBtn) {
            submitBtn.style.outline = '3px solid #4ade80';
            submitBtn.style.outlineOffset = '2px';
        }
    };

    // Detect form fields
    const detectFormFields = () => {
        const fields = [];
        const inputs = document.querySelectorAll('input, textarea, select');

        // Get profile from storage or use defaults
        const profile = {
            name: 'Demo User',
            email: 'demo@example.com',
            phone: '+91 9876543210',
            company: 'Tech Corp',
            title: 'Software Engineer',
            experience: '2',
            linkedin: 'https://linkedin.com/in/demo',
            skills: 'JavaScript, React, Node.js, Python',
            education: 'B.Tech Computer Science'
        };

        inputs.forEach((el, index) => {
            if (el.type === 'hidden' || el.type === 'submit' || el.type === 'button' || el.type === 'file') return;
            if (el.offsetWidth === 0 && el.offsetHeight === 0) return;

            let label = '';
            const labelEl = document.querySelector(`label[for="${el.id}"]`);
            if (labelEl) label = labelEl.textContent.trim();
            else if (el.closest('label')) label = el.closest('label').textContent.trim();

            const name = (el.name || el.id || '').toLowerCase();
            const placeholder = (el.placeholder || '').toLowerCase();

            let value = '';

            // Map field to profile data
            if (name.includes('name') || placeholder.includes('name')) {
                value = name.includes('first') ? profile.name.split(' ')[0] :
                    name.includes('last') ? profile.name.split(' ').slice(1).join(' ') :
                        profile.name;
            } else if (name.includes('email') || placeholder.includes('email')) {
                value = profile.email;
            } else if (name.includes('phone') || placeholder.includes('phone') || name.includes('mobile')) {
                value = profile.phone;
            } else if (name.includes('linkedin')) {
                value = profile.linkedin;
            } else if (name.includes('company') || name.includes('employer')) {
                value = profile.company;
            } else if (name.includes('title') || name.includes('position') || name.includes('role')) {
                value = profile.title;
            } else if (name.includes('experience') || name.includes('years')) {
                value = profile.experience;
            } else if (name.includes('skill')) {
                value = profile.skills;
            } else if (name.includes('education') || name.includes('degree')) {
                value = profile.education;
            }

            fields.push({
                element: el,
                name: el.name || el.id || `field_${index}`,
                label: label,
                type: el.type,
                value: value,
                placeholder: el.placeholder
            });
        });

        return fields;
    };

    // Fill a single field
    const fillField = (field) => {
        const el = field.element;
        if (!el || !field.value) return;

        el.focus();
        el.value = field.value;
        el.dispatchEvent(new Event('input', { bubbles: true }));
        el.dispatchEvent(new Event('change', { bubbles: true }));
        el.dispatchEvent(new Event('blur', { bubbles: true }));

        // Visual feedback
        el.style.backgroundColor = '#d4edda';
        el.style.transition = 'background-color 0.5s';
        setTimeout(() => {
            el.style.backgroundColor = '';
        }, 1500);
    };

    // Check if page has forms
    const hasFormFields = () => {
        return document.querySelectorAll('input:not([type="hidden"]), textarea').length > 0;
    };

    // Initialize
    const init = () => {
        // Wait for page load
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                if (hasFormFields()) createFloatingButton();
            });
        } else {
            if (hasFormFields()) createFloatingButton();
        }
    };

    init();
})();
