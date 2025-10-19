# Privacy Policy for MZR Summarizer

**Last Updated:** January 2025

## Introduction

MZR Summarizer ("we", "us", or "our") is committed to protecting your privacy. This Privacy Policy explains how our Chrome extension collects, uses, stores, and protects your information.

**Key Principle:** We believe in complete transparency and user privacy. All your data stays on your device - we don't collect, transmit, or store any personal information on external servers.

## Information We Collect

### 1. **API Keys**
- **What:** Your Google Gemini or OpenAI API keys
- **Storage:** Stored locally in Chrome's secure storage (chrome.storage.local)
- **Usage:** Only used to communicate with AI services on your behalf
- **Access:** Never transmitted to us or any third party

### 2. **Summary History**
- **What:** Summaries you generate and save, including:
  - Summary text
  - Source webpage URLs
  - Custom notes you add
  - Timestamps
- **Storage:** Stored locally in Chrome's secure storage (chrome.storage.local)
- **Usage:** To provide you with access to your saved summaries
- **Access:** Never transmitted to us or any third party

### 3. **User Preferences**
- **What:** Your settings and preferences, including:
  - Selected AI model (Gemini/OpenAI)
  - Summary length preference (Short/Medium/Detailed)
  - Theme preference (Light/Dark)
  - UI zoom level
- **Storage:** Stored locally in Chrome's secure storage (chrome.storage.local)
- **Usage:** To maintain your preferred settings
- **Access:** Never transmitted to us or any third party

### 4. **Webpage Content**
- **What:** Text content from webpages you choose to summarize
- **Usage:** Temporarily processed and sent directly to your chosen AI service (Google Gemini or OpenAI)
- **Storage:** Not stored by us; may be processed according to your AI provider's privacy policy
- **Access:** Only sent to the AI service you've selected

## Information We DO NOT Collect

We explicitly **DO NOT** collect, store, or transmit:

- ❌ Personal identifying information (name, email, phone number)
- ❌ Browsing history
- ❌ Analytics or tracking data
- ❌ IP addresses
- ❌ Location data
- ❌ Usage statistics
- ❌ Crash reports
- ❌ Device information
- ❌ Any data to external servers

## How We Use Your Information

All data processing happens **locally on your device**:

1. **API Keys:** Used only to authenticate with AI services (Google Gemini or OpenAI)
2. **Summary History:** Displayed in the extension for your reference
3. **User Preferences:** Applied to customize your experience
4. **Webpage Content:** Sent directly to your chosen AI service for summarization

## Data Sharing and Third Parties

### Direct Communication (Not Through Us)

When you use MZR Summarizer, your webpage content and API key are sent **directly** from your browser to:

- **Google Gemini API** (if you use Gemini)
  - Privacy Policy: https://policies.google.com/privacy
  - Terms: https://policies.google.com/terms
  
- **OpenAI API** (if you use OpenAI)
  - Privacy Policy: https://openai.com/privacy
  - Terms: https://openai.com/terms

**Important:** These communications happen directly between your browser and the AI service. We do not act as an intermediary and cannot access this data.

### No Third-Party Analytics

We do not use:
- Google Analytics
- Crash reporting services
- Error tracking services
- Marketing pixels
- Any third-party tracking tools

## Data Security

### Local Storage Security

- All data is stored using Chrome's secure `chrome.storage.local` API
- Data is encrypted by Chrome's built-in security mechanisms
- Data is isolated to the extension and not accessible by other websites or extensions

### API Key Security

- API keys are stored securely in Chrome's local storage
- Keys are never logged, displayed in plain text, or transmitted to us
- Keys are only used for API authentication with your chosen service

### Best Practices We Recommend

1. **Protect Your API Keys:** Never share your API keys publicly
2. **Use API Key Restrictions:** Set usage limits and restrictions in your AI provider's dashboard
3. **Review Permissions:** The extension only requests necessary permissions
4. **Keep Chrome Updated:** Ensure you're using the latest version of Chrome for security patches

## Data Retention

### Local Data Retention

- **Summary History:** Stored locally until you delete it manually
- **API Keys:** Stored locally until you remove them in settings
- **User Preferences:** Stored locally until you reset or uninstall the extension

### Data Deletion

You can delete your data at any time:

1. **Individual Summaries:** Click the delete button in the history section
2. **All History:** Clear all saved summaries in the settings
3. **API Keys:** Remove API keys in the options page
4. **Complete Removal:** Uninstalling the extension deletes all local data

## Your Rights

You have complete control over your data:

- ✅ **Right to Access:** View all your stored summaries and settings
- ✅ **Right to Delete:** Remove any or all of your data at any time
- ✅ **Right to Export:** Copy your summaries in Markdown or plain text format
- ✅ **Right to Portability:** Export your data for use elsewhere
- ✅ **Right to Transparency:** This policy explains all data practices

## Permissions Justification

MZR Summarizer requests the following Chrome permissions:

### 1. **`activeTab`**
- **Purpose:** Read content from the current webpage for summarization
- **Scope:** Only activates when you click the extension or use the keyboard shortcut
- **Data Access:** Temporary; content is sent to AI service and not stored by us

### 2. **`storage`**
- **Purpose:** Store your API keys, settings, and summary history locally
- **Scope:** Chrome's secure local storage only
- **Data Access:** Only the extension can access this data

### 3. **`scripting`**
- **Purpose:** Inject the summary panel into webpages
- **Scope:** Only when you activate the extension
- **Data Access:** No data collection; only UI display

### 4. **Host Permissions**
- **`https://generativelanguage.googleapis.com/*`** - For Google Gemini API
- **`https://api.openai.com/*`** - For OpenAI API
- **Purpose:** Send summarization requests to AI services
- **Data Access:** Direct communication between your browser and AI services

## Children's Privacy

MZR Summarizer is not directed to children under 13 years of age. We do not knowingly collect information from children. If you are a parent or guardian and believe your child has used the extension, please contact us.

## International Users

MZR Summarizer can be used worldwide. Since all data is stored locally on your device:

- No data crosses international borders through our services
- You are subject to the privacy policies of the AI service you choose (Google Gemini or OpenAI)
- AI providers may process data according to their own international data transfer policies

## Compliance

### GDPR Compliance (EU Users)

For users in the European Union:
- We do not collect personal data, so GDPR data processing requirements do not apply to us
- All data is stored locally on your device
- You have full control to delete your data at any time
- No consent is required as we don't process personal data on servers

### CCPA Compliance (California Users)

For users in California:
- We do not sell personal information
- We do not collect personal information for commercial purposes
- All data remains on your local device

## Changes to This Privacy Policy

We may update this Privacy Policy from time to time to reflect:
- Changes to our practices
- Legal or regulatory requirements
- New features or functionality

**How We Notify You:**
- Updated "Last Updated" date at the top of this policy
- Significant changes will be communicated through the Chrome Web Store listing
<<<<<<< HEAD
- You can always find the latest version at: https://github.com/zainriaz-dev/mzr-summarizer/blob/main/PRIVACY_POLICY.md or https://mzr-summarizer.zainriaz.dev/Privacy
=======
- You can always find the latest version at: https://github.com/zainriaz-dev/mzr-summarizer/PRIVACY_POLICY.md
>>>>>>> 059a79c00df9d2cee635cc74a7a70e0d0ceeef30

## Open Source Transparency

MZR Summarizer is open source. You can:
- Review the complete source code: https://github.com/zainriaz-dev/mzr-summarizer
- Verify our privacy claims by examining the code
- Contribute to the project
- Report security concerns

## Contact Us

If you have questions, concerns, or requests regarding this Privacy Policy or your data:

**Email:** zainriaz.dev@gmail.com  
**GitHub:** https://github.com/zainriaz-dev/mzr-summarizer/issues  
**Website:** https://mzr-summarizer.zainriaz.dev/contact.html

We will respond to privacy inquiries within 30 days.

## Developer Information

**Developer:** Zain Riaz  
**Location:** Gujranwala, Pakistan  
**Project:** Open Source (MIT License)  
**Website:** https://zainriaz.dev

## Summary

**In Plain English:**

- ✅ All your data stays on your computer
- ✅ We don't collect, track, or store anything on our servers
- ✅ Your API keys are secure and only used for AI requests
- ✅ You can delete everything anytime
- ✅ We have no ads, no tracking, no analytics
- ✅ The extension is open source - verify everything yourself
- ✅ You communicate directly with AI services (Google/OpenAI)
- ✅ Your privacy is 100% protected

**Questions?** Read the full policy above or contact us at zainriaz.dev@gmail.com

---

## Acknowledgment

By installing and using MZR Summarizer, you acknowledge that you have read and understood this Privacy Policy.

<<<<<<< HEAD
**Last Updated:** January 2025  
**Version:** 1.0  
**Effective Date:** January 2025
=======
**Last Updated:** October 2025  
**Version:** 1.0  
**Effective Date:** October 2025
>>>>>>> 059a79c00df9d2cee635cc74a7a70e0d0ceeef30

---

*This privacy policy is provided in good faith to ensure transparency and build trust with our users. MZR Summarizer is committed to protecting your privacy and maintaining the highest standards of data security.*
<<<<<<< HEAD

=======
>>>>>>> 059a79c00df9d2cee635cc74a7a70e0d0ceeef30
