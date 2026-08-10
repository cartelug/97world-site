document.addEventListener('DOMContentLoaded', () => {
    // --- CONFIGURATION ---
    const CORRECT_ACCESS_CODE = "2022"; // Change this to update the access code
    const NETFLIX_EMAIL = "carteluganda0@gmail.com";
    const NETFLIX_PASSWORD = "thecartelug";
    const WHATSAPP_NUMBER = "256762193386"; // Your WhatsApp number
    // --- END CONFIGURATION ---

    const accessGate = document.getElementById('accessGate');
    const gateForm = document.getElementById('gateForm');
    const userNameInput = document.getElementById('userName');
    const accessCodeInput = document.getElementById('accessCode');
    const gateError = document.getElementById('gateError');
    const netflixInstructionsContainer = document.getElementById('netflixInstructions');
    const pageBody = document.body;

    let currentStepId = null;
    let userName = "";

    // --- ACCESS GATE LOGIC ---
    if (gateForm) {
        gateForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const enteredCode = accessCodeInput.value;
            userName = userNameInput.value.trim();

            if (enteredCode === CORRECT_ACCESS_CODE) {
                accessGate.classList.remove('active');
                accessGate.style.display = 'none'; // Hide after transition
                
                pageBody.classList.add('netflix-setup-active');
                netflixInstructionsContainer.style.display = 'block';
                setTimeout(() => netflixInstructionsContainer.classList.add('active'), 50); // For transition
                
                renderStep('initialDeviceChoice');
            } else {
                gateError.textContent = "Incorrect Accessug Code. Please try again.";
                accessCodeInput.focus();
            }
        });
    }

    // --- INSTRUCTION RENDERING & NAVIGATION ---
    function renderStep(stepId) {
        currentStepId = stepId;
        let html = '';

        switch (stepId) {
            case 'initialDeviceChoice':
                html = `
                    <div class="instruction-step active">
                        <h2>Hi ${userName || 'there'}! Which device are you putting the Netflix on?</h2>
                        <div class="device-options">
                            <button class="device-option-button" data-next="phonePcStep1"><i class="fas fa-mobile-alt"></i> Phone / PC</button>
                            <button class="device-option-button" data-next="tvTypeChoice"><i class="fas fa-tv"></i> TV</button>
                        </div>
                    </div>`;
                break;

            // Phone/PC Path
            case 'phonePcStep1':
                html = `
                    <div class="instruction-step active">
                        <h2>Open Netflix & Press SIGN IN</h2>
                        <p>On your Phone or PC, open the Netflix app or go to netflix.com.</p>
                        <p>Then, tap or click <strong>'Sign In'</strong>.</p>
                        <button class="netflix-button" data-next="phonePcStep2">Next <i class="fas fa-arrow-right"></i></button>
                        <button class="netflix-button secondary" data-back="initialDeviceChoice"><i class="fas fa-arrow-left"></i> Back</button>
                    </div>`;
                break;
            case 'phonePcStep2':
                html = `
                    <div class="instruction-step active">
                        <h2>Enter these details:</h2>
                        <div class="netflix-input-group">
                            <input type="text" id="phoneEmail" class="input-field has-value" value="${NETFLIX_EMAIL}" readonly>
                            <label for="phoneEmail" class="input-label">Email</label>
                        </div>
                        <div class="credential-actions">
                           <button class="copy-button-netflix" data-clipboard-text="${NETFLIX_EMAIL}"><i class="far fa-copy"></i> Copy Email</button>
                        </div>

                        <div class="netflix-input-group">
                            <input type="password" id="phonePassword" class="input-field has-value" value="${NETFLIX_PASSWORD}" readonly>
                            <label for="phonePassword" class="input-label">Password</label>
                        </div>
                        <div class="credential-actions">
                            <button class="toggle-password-netflix" data-target="phonePassword"><i class="fas fa-eye"></i> Show</button>
                            <button class="copy-button-netflix" data-clipboard-text="${NETFLIX_PASSWORD}"><i class="far fa-copy"></i> Copy Password</button>
                        </div>
                        <button class="netflix-button" data-next="phonePcStep3">Next <i class="fas fa-arrow-right"></i></button>
                        <button class="netflix-button secondary" data-back="phonePcStep1"><i class="fas fa-arrow-left"></i> Back</button>
                    </div>`;
                break;
            case 'phonePcStep3':
                const phonePinMessage = `Hi Cartelug, it's ${userName}. I'm at the 'Who’s Watching?' screen on my Phone/PC (Email: ${NETFLIX_EMAIL}). Please send my PIN.`;
                html = `
                    <div class="instruction-step active">
                        <h2>You should now see "Who’s Watching?"</h2>
                        <p>Great! Now, please message us on WhatsApp to get your personal PIN for your profile.</p>
                        <a href="https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(phonePinMessage)}" target="_blank" class="whatsapp-link-netflix">
                            <i class="fab fa-whatsapp"></i> Message Us for PIN
                        </a>
                        <button class="netflix-button secondary" data-back="phonePcStep2"><i class="fas fa-arrow-left"></i> Back</button>
                    </div>`;
                break;

            // TV Path
            case 'tvTypeChoice':
                html = `
                    <div class="instruction-step active">
                        <h2>What type of TV setup?</h2>
                        <div class="tv-type-info-netflix">
                            <h4>How to tell the difference:</h4>
                            <ul>
                                <li><strong>Smart TV:</strong> Netflix app is directly on the TV. Has its own app store. Connects directly to internet (Wi-Fi/Cable).</li>
                                <li><strong>Normal TV:</strong> Netflix app is on a device connected to your TV (e.g., Fire Stick, Mi Stick, Apple TV, PS5, Xbox, Decoder). You use that device's remote for Netflix.</li>
                            </ul>
                        </div>
                        <div class="device-options">
                            <button class="device-option-button" data-next="smartTvStep1"><i class="fas fa-brain"></i> Smart TV</button>
                            <button class="device-option-button" data-next="normalTvStep1"><i class="fas fa-plug"></i> Normal TV (with connected device)</button>
                        </div>
                        <button class="netflix-button secondary" data-back="initialDeviceChoice"><i class="fas fa-arrow-left"></i> Back to Device Choice</button>
                    </div>`;
                break;

            // Normal TV Path
            case 'normalTvStep1':
                 html = `
                    <div class="instruction-step active">
                        <h2>Normal TV: Sign In Steps</h2>
                        <p>1. Open the Netflix app on your connected device (Fire Stick, Console, etc.).</p>
                        <p>2. Select <strong>'Sign In'</strong>.</p>
                        <p>3. Enter Email: <strong class="important-text">${NETFLIX_EMAIL}</strong></p>
                        <p>4. Enter Password: <strong class="important-text">${NETFLIX_PASSWORD}</strong></p>
                        <p>5. When you reach the <strong>"Who’s Watching?"</strong> screen, STOP and message us on WhatsApp for your PIN.</p>
                        <a href="https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(`Hi Cartelug, it's ${userName}. I'm at 'Who’s Watching?' on my Normal TV (Email: ${NETFLIX_EMAIL}). PIN please.`)}" target="_blank" class="whatsapp-link-netflix">
                            <i class="fab fa-whatsapp"></i> Message for PIN
                        </a>
                        <button class="netflix-button secondary" data-back="tvTypeChoice"><i class="fas fa-arrow-left"></i> Back to TV Type</button>
                    </div>`;
                break;

            // Smart TV Path
            case 'smartTvStep1':
                const smartTvCodeMessage = `Hi Cartelug, it's ${userName}. I'm signing into Netflix on my Smart TV and have a code on screen. I'll send a picture.`;
                html = `
                    <div class="instruction-step active">
                        <h2>Smart TV: Sign In with Code</h2>
                        <p>1. On your Smart TV, open Netflix & select <strong>'Sign In'</strong>.</p>
                        <p>2. Look for an option like <strong>"Use Phone"</strong>. This will display a <strong>CODE</strong> on your TV screen.</p>
                        <p class="important-text"><strong>No code option?</strong> If your TV only shows fields for email/password, please go back and select "Normal TV" setup.</p>
                        <p>3. If a <strong>CODE</strong> is displayed, take a clear picture of it.</p>
                        <p>4. Send the picture of the numbers to us on WhatsApp. We'll help you complete the sign-in.</p>
                        <a href="https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(smartTvCodeMessage)}" target="_blank" class="whatsapp-link-netflix">
                            <i class="fab fa-whatsapp"></i> Send TV Code via WhatsApp
                        </a>
                        <button class="netflix-button secondary" data-back="tvTypeChoice"><i class="fas fa-arrow-left"></i> Back to TV Type</button>
                    </div>`;
                break;

            default:
                html = `<p>Error: Step not found.</p><button class="netflix-button secondary" data-back="initialDeviceChoice">Start Over</button>`;
        }
        netflixInstructionsContainer.innerHTML = html;
        initializeStepInteractions(); // Re-initialize for new buttons
    }

    function initializeStepInteractions() {
        // Navigation buttons
        netflixInstructionsContainer.querySelectorAll('[data-next]').forEach(button => {
            button.addEventListener('click', () => renderStep(button.dataset.next));
        });
        netflixInstructionsContainer.querySelectorAll('[data-back]').forEach(button => {
            button.addEventListener('click', () => renderStep(button.dataset.back));
        });

        // Toggle Password
        netflixInstructionsContainer.querySelectorAll('.toggle-password-netflix').forEach(button => {
            button.addEventListener('click', () => {
                const targetInput = document.getElementById(button.dataset.target);
                if (targetInput) {
                    const isPassword = targetInput.type === 'password';
                    targetInput.type = isPassword ? 'text' : 'password';
                    button.innerHTML = isPassword ? '<i class="fas fa-eye-slash"></i> Hide' : '<i class="fas fa-eye"></i> Show';
                }
            });
        });

        // ClipboardJS for copy buttons within steps
        if (typeof ClipboardJS !== 'undefined') {
            const clipboardButtons = new ClipboardJS('.copy-button-netflix');
            clipboardButtons.on('success', function(e) {
                const originalText = e.trigger.innerHTML;
                e.trigger.innerHTML = '<i class="fas fa-check"></i> Copied!';
                setTimeout(() => {
                    e.trigger.innerHTML = originalText;
                }, 1500);
                e.clearSelection();
            });
            clipboardButtons.on('error', function(e) {
                alert('Failed to copy. Please copy manually.');
            });
        }
    }
    
    // Handle floating labels for pre-filled inputs (if any in future steps)
    // This is a simple check, more robust might be needed if dynamic
    document.querySelectorAll('.input-field.has-value').forEach(input => {
        const label = input.nextElementSibling;
        if (label && label.classList.contains('input-label')) {
            label.style.fontSize = '0.75rem';
            label.style.top = '10px';
            label.style.transform = 'translateY(0)';
        }
    });


    // Initial preloader and global script.js from base will handle their parts.
    // This script is specific to netflix-setup page logic.
});
