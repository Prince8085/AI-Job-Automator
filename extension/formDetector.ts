/**
 * Form Detection Algorithm for Browser Extension
 * Detects and maps form fields on job application pages
 */

export interface FormField {
  id: string;
  name: string;
  type: 'text' | 'email' | 'tel' | 'file' | 'textarea' | 'select' | 'radio' | 'checkbox' | 'date' | 'url';
  label: string;
  required: boolean;
  value?: string;
  options?: string[];
  placeholder?: string;
  element: HTMLElement;
}

export interface DetectedForm {
  id: string;
  name: string;
  fields: FormField[];
  submitButton: HTMLElement | null;
  shouldSubmitAuto: boolean;
  confidence: number; // 0-100
  platform: string; // 'linkedin', 'indeed', 'lever', 'greenhouse', 'custom'
}

/**
 * Main form detection class
 */
export class FormDetector {
  private static PLATFORM_PATTERNS = {
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

  /**
   * Detect all forms on the current page
   */
  static detectForms(): DetectedForm[] {
    const forms = document.querySelectorAll('form');
    const detectedForms: DetectedForm[] = [];

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
  private static analyzeForm(form: HTMLFormElement, index: number): DetectedForm | null {
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
    } catch (error) {
      console.error('Error analyzing form:', error);
      return null;
    }
  }

  /**
   * Extract all fields from a form
   */
  private static extractFormFields(form: HTMLFormElement): FormField[] {
    const fields: FormField[] = [];

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
  private static parseFormElement(element: Element): FormField | null {
    const tag = element.tagName.toLowerCase();
    const type = (element as any).type || tag;

    // Skip non-relevant fields
    if (this.shouldSkipField(element as any)) {
      return null;
    }

    const label = this.findLabel(element as HTMLElement);

    return {
      id: (element as any).id || (element as any).name || `field_${Math.random()}`,
      name: (element as any).name || (element as any).id || '',
      type: this.mapFieldType(type),
      label,
      required: this.isFieldRequired(element as HTMLElement),
      value: (element as any).value || '',
      options: this.extractOptions(element),
      placeholder: (element as any).placeholder || '',
      element: element as HTMLElement,
    };
  }

  /**
   * Check if field should be skipped
   */
  private static shouldSkipField(element: HTMLInputElement | HTMLTextAreaElement): boolean {
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
  private static mapFieldType(
    htmlType: string
  ): FormField['type'] {
    const typeMap: Record<string, FormField['type']> = {
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
  private static findLabel(element: HTMLElement): string {
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
    return (element as any).placeholder || (element as any).name || '';
  }

  /**
   * Check if field is required
   */
  private static isFieldRequired(element: HTMLElement): boolean {
    const required = element.hasAttribute('required') ||
      element.getAttribute('aria-required') === 'true';
    const hasRequiredClass = element.className && typeof element.className === 'string' && element.className.includes('required');
    return required || !!hasRequiredClass;
  }

  /**
   * Extract options from select/radio/checkbox
   */
  private static extractOptions(element: Element): string[] | undefined {
    if (element.tagName === 'SELECT') {
      return Array.from((element as HTMLSelectElement).options)
        .map(opt => opt.value)
        .filter(v => v);
    }

    if ((element as any).type === 'radio' || (element as any).type === 'checkbox') {
      const name = (element as any).name;
      if (name) {
        return Array.from(
          document.querySelectorAll(`[name="${name}"]`)
        )
          .map((el: any) => el.value)
          .filter(v => v);
      }
    }

    return undefined;
  }

  /**
   * Find submit button
   */
  private static findSubmitButton(form: HTMLFormElement): HTMLElement | null {
    // Look for buttons with type="submit"
    const submitButton = form.querySelector('button[type="submit"], input[type="submit"]');
    if (submitButton) {
      return submitButton as HTMLElement;
    }

    // Look for button with common submit text
    const buttons = Array.from(form.querySelectorAll('button'));
    const submitBtn = buttons.find(
      btn =>
        btn.textContent &&
        /submit|apply|send|next|continue/i.test(btn.textContent)
    );

    return submitBtn || null;
  }

  /**
   * Detect platform based on domain and form structure
   */
  private static detectPlatform(): string {
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
  private static calculateConfidence(fields: FormField[], platform: string): number {
    let score = 50; // Base score

    // More fields = higher confidence
    if (fields.length > 3) score += 20;
    if (fields.length > 5) score += 10;

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
  static mapResumeToFields(
    fields: FormField[],
    resumeData: {
      fullName?: string;
      email?: string;
      phone?: string;
      experience?: string;
      education?: string;
      skills?: string;
      resumeFile?: File;
    }
  ): Map<FormField, string | File> {
    const mapping = new Map<FormField, string | File>();

    fields.forEach(field => {
      const fieldName = field.name.toLowerCase();
      const fieldLabel = field.label.toLowerCase();

      // Name fields
      if (
        fieldName.includes('name') ||
        fieldName.includes('fname') ||
        fieldLabel.includes('name')
      ) {
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
      if (
        fieldName.includes('phone') ||
        fieldName.includes('tel') ||
        fieldLabel.includes('phone')
      ) {
        if (resumeData.phone) {
          mapping.set(field, resumeData.phone);
        }
      }

      // Experience
      if (
        fieldName.includes('experience') ||
        fieldName.includes('employment') ||
        fieldLabel.includes('experience')
      ) {
        if (resumeData.experience) {
          mapping.set(field, resumeData.experience);
        }
      }

      // Education
      if (
        fieldName.includes('education') ||
        fieldName.includes('school') ||
        fieldLabel.includes('education')
      ) {
        if (resumeData.education) {
          mapping.set(field, resumeData.education);
        }
      }

      // Skills
      if (
        fieldName.includes('skill') ||
        fieldName.includes('competencies') ||
        fieldLabel.includes('skill')
      ) {
        if (resumeData.skills) {
          mapping.set(field, resumeData.skills);
        }
      }

      // Resume file
      if (
        fieldName.includes('resume') ||
        fieldName.includes('cv') ||
        fieldName.includes('attachment') ||
        field.type === 'file'
      ) {
        if (resumeData.resumeFile) {
          mapping.set(field, resumeData.resumeFile);
        }
      }
    });

    return mapping;
  }
}

export default FormDetector;
