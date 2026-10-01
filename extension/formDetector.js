/**
 * Form Detection Algorithm for Browser Extension
 * Detects and maps form fields on job application pages
 */
/**
 * Main form detection class
 */
export class FormDetector {
    /**
     * Detect all forms on the current page
     */
    static detectForms() {
        const forms = document.querySelectorAll('form');
        const detectedForms = [];
        forms.forEach((form, index) => {
            const detected = this.analyzeForm(form, index);
            if (detected && detected.confidence > 40) {
                // Only forms with >40% confidence
                detectedForms.push(detected);
            }
        });
        return detectedForms.sort((a, b) => b.confidence - a.confidence);
    }
    /**
     * Analyze a single form
     */
    static analyzeForm(form, index) {
        try {
            const fields = this.extractFormFields(form);
            if (fields.length === 0) {
                return null; // Not a real form
            }
            const submitButton = this.findSubmitButton(form);
            const platform = this.detectPlatform();
            const confidence = this.calculateConfidence(fields, platform);
            return {
                id: `form_${index}_${Date.now()}`,
                name: form.name || form.id || `Form ${index + 1}`,
                fields,
                submitButton,
                shouldSubmitAuto: confidence > 80,
                confidence,
                platform,
            };
        }
        catch (error) {
            console.error('Error analyzing form:', error);
            return null;
        }
    }
    /**
     * Extract all fields from a form
     */
    static extractFormFields(form) {
        const fields = [];
        // Get all inputs
        form.querySelectorAll('input, textarea, select').forEach((element) => {
            const field = this.parseFormElement(element);
            if (field) {
                fields.push(field);
            }
        });
        return fields;
    }
    /**
     * Parse individual form element
     */
    static parseFormElement(element) {
        const tag = element.tagName.toLowerCase();
        const type = element.type || tag;
        // Skip non-relevant fields
        if (this.shouldSkipField(element)) {
            return null;
        }
        const label = this.findLabel(element);
        return {
            id: element.id || element.name || `field_${Math.random()}`,
            name: element.name || element.id || '',
            type: this.mapFieldType(type),
            label,
            required: this.isFieldRequired(element),
            value: element.value || '',
            options: this.extractOptions(element),
            placeholder: element.placeholder || '',
            element: element,
        };
    }
    /**
     * Check if field should be skipped
     */
    static shouldSkipField(element) {
        const type = element.type?.toLowerCase() || '';
        const name = (element.name || '').toLowerCase();
        const id = (element.id || '').toLowerCase();
        // Skip hidden, submit, button, reset fields
        if (['hidden', 'submit', 'button', 'reset', 'captcha'].includes(type)) {
            return true;
        }
        // Skip CSRF tokens
        if (name.includes('csrf') || name.includes('token') || id.includes('csrf')) {
            return true;
        }
        // Skip tracking pixels
        if (name.includes('pixel') || type === 'image') {
            return true;
        }
        return false;
    }
    /**
     * Map HTML input type to our field types
     */
    static mapFieldType(htmlType) {
        const typeMap = {
            text: 'text',
            email: 'email',
            tel: 'tel',
            phone: 'tel',
            file: 'file',
            textarea: 'textarea',
            select: 'select',
            radio: 'radio',
            checkbox: 'checkbox',
            date: 'date',
            url: 'url',
            number: 'text',
            search: 'text',
        };
        return typeMap[htmlType] || 'text';
    }
    /**
     * Find associated label for field
     */
    static findLabel(element) {
        // Try to find explicit label
        const labelElement = document.querySelector(`label[for="${element.id}"]`);
        if (labelElement) {
            return labelElement.textContent || '';
        }
        // Try to find parent label
        let parent = element.parentElement;
        while (parent && parent.tagName !== 'FORM') {
            if (parent.tagName === 'LABEL') {
                return parent.textContent || '';
            }
            parent = parent.parentElement;
        }
        // Use placeholder or name
        return element.placeholder || element.name || '';
    }
    /**
     * Check if field is required
     */
    static isFieldRequired(element) {
        const required = element.hasAttribute('required') ||
            element.getAttribute('aria-required') === 'true';
        const hasRequiredClass = element.className && typeof element.className === 'string' && element.className.includes('required');
        return required || !!hasRequiredClass;
    }
    /**
     * Extract options from select/radio/checkbox
     */
    static extractOptions(element) {
        if (element.tagName === 'SELECT') {
            return Array.from(element.options)
                .map(opt => opt.value)
                .filter(v => v);
        }
        if (element.type === 'radio' || element.type === 'checkbox') {
            const name = element.name;
            if (name) {
                return Array.from(document.querySelectorAll(`[name="${name}"]`))
                    .map((el) => el.value)
                    .filter(v => v);
            }
        }
        return undefined;
    }
    /**
     * Find submit button
     */
    static findSubmitButton(form) {
        // Look for buttons with type="submit"
        const submitButton = form.querySelector('button[type="submit"], input[type="submit"]');
        if (submitButton) {
            return submitButton;
        }
        // Look for button with common submit text
        const buttons = Array.from(form.querySelectorAll('button'));
        const submitBtn = buttons.find(btn => btn.textContent &&
            /submit|apply|send|next|continue/i.test(btn.textContent));
        return submitBtn || null;
    }
    /**
     * Detect platform based on domain and form structure
     */
    static detectPlatform() {
        const hostname = window.location.hostname;
        for (const [platform, config] of Object.entries(this.PLATFORM_PATTERNS)) {
            if (config.domains.some(domain => hostname.includes(domain))) {
                return platform;
            }
        }
        return 'custom';
    }
    /**
     * Calculate confidence score for form detection
     */
    static calculateConfidence(fields, platform) {
        let score = 50; // Base score
        // More fields = higher confidence
        if (fields.length > 3)
            score += 20;
        if (fields.length > 5)
            score += 10;
        // Required fields increase confidence (real form)
        const requiredFields = fields.filter(f => f.required).length;
        score += Math.min(requiredFields * 5, 20);
        // Known platform = higher confidence
        if (platform !== 'custom') {
            score += 15;
        }
        // Email field always present = good sign
        if (fields.some(f => f.type === 'email')) {
            score += 10;
        }
        // File upload (resume) = very good
        if (fields.some(f => f.type === 'file')) {
            score += 20;
        }
        return Math.min(score, 100);
    }
    /**
     * Map resume data to form fields (AI matching)
     */
    static mapResumeToFields(fields, resumeData) {
        const mapping = new Map();
        fields.forEach(field => {
            const fieldName = field.name.toLowerCase();
            const fieldLabel = field.label.toLowerCase();
            // Name fields
            if (fieldName.includes('name') ||
                fieldName.includes('fname') ||
                fieldLabel.includes('name')) {
                if (resumeData.fullName) {
                    mapping.set(field, resumeData.fullName);
                }
            }
            // Email fields
            if (fieldName.includes('email') || fieldLabel.includes('email')) {
                if (resumeData.email) {
                    mapping.set(field, resumeData.email);
                }
            }
            // Phone fields
            if (fieldName.includes('phone') ||
                fieldName.includes('tel') ||
                fieldLabel.includes('phone')) {
                if (resumeData.phone) {
                    mapping.set(field, resumeData.phone);
                }
            }
            // Experience
            if (fieldName.includes('experience') ||
                fieldName.includes('employment') ||
                fieldLabel.includes('experience')) {
                if (resumeData.experience) {
                    mapping.set(field, resumeData.experience);
                }
            }
            // Education
            if (fieldName.includes('education') ||
                fieldName.includes('school') ||
                fieldLabel.includes('education')) {
                if (resumeData.education) {
                    mapping.set(field, resumeData.education);
                }
            }
            // Skills
            if (fieldName.includes('skill') ||
                fieldName.includes('competencies') ||
                fieldLabel.includes('skill')) {
                if (resumeData.skills) {
                    mapping.set(field, resumeData.skills);
                }
            }
            // Resume file
            if (fieldName.includes('resume') ||
                fieldName.includes('cv') ||
                fieldName.includes('attachment') ||
                field.type === 'file') {
                if (resumeData.resumeFile) {
                    mapping.set(field, resumeData.resumeFile);
                }
            }
        });
        return mapping;
    }
}
FormDetector.PLATFORM_PATTERNS = {
    linkedin: {
        domains: ['linkedin.com'],
        formSelectors: ['form[data-job-apply]', 'form.jobs-apply-form'],
    },
    indeed: {
        domains: ['indeed.com'],
        formSelectors: ['form[name="application"]', 'form.applycf-modal-form'],
    },
    lever: {
        domains: ['lever.co', 'jobs.lever.co'],
        formSelectors: ['form[id*="apply"]', 'form.application-form'],
    },
    greenhouse: {
        domains: ['greenhouse.io', 'boards.greenhouse.io'],
        formSelectors: ['form[id*="content"]', 'form.application-form-section'],
    },
    workable: {
        domains: ['workable.com'],
        formSelectors: ['form.apply-form', 'form[id*="application"]'],
    },
};
export default FormDetector;
