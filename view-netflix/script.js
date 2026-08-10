document.addEventListener('DOMContentLoaded', () => {
    const emailOptionButtons = document.querySelectorAll('.email-option-button');
    const instructionDetailsContainer = document.getElementById('instructionDetails');
    const emailOptionSelectionContainer = document.getElementById('emailOptionSelection');
    const instructionTitle = document.getElementById('instructionTitle');
    const gmailAppInstructionsList = document.getElementById('gmailAppInstructions');
    const backToOptionsButton = document.getElementById('backToOptionsButton');
    const whatsappHelpLink = document.getElementById('whatsappHelpLink');
    const householdErrorNoteDiv = document.getElementById('householdErrorNote'); // Get the new note div

    // Log if elements are found
    console.log("emailOptionButtons:", emailOptionButtons.length > 0 ? emailOptionButtons : "NOT FOUND");
    console.log("instructionDetailsContainer:", instructionDetailsContainer || "NOT FOUND");
    console.log("emailOptionSelectionContainer:", emailOptionSelectionContainer || "NOT FOUND");
    console.log("instructionTitle:", instructionTitle || "NOT FOUND");
    console.log("gmailAppInstructionsList:", gmailAppInstructionsList || "NOT FOUND");
    console.log("backToOptionsButton:", backToOptionsButton || "NOT FOUND");
    console.log("whatsappHelpLink:", whatsappHelpLink || "NOT FOUND");
    console.log("householdErrorNoteDiv:", householdErrorNoteDiv || "NOT FOUND");


    const YOUR_WHATSAPP_NUMBER = "256762193386"; 
    if (whatsappHelpLink) {
        whatsappHelpLink.href = `https://wa.me/${YOUR_WHATSAPP_NUMBER}?text=I%20need%20help%20with%20the%20Netflix%20email%20viewer%20setup.`;
        console.log("WhatsApp link updated.");
    } else {
        console.error("WhatsApp help link element not found!");
    }

    const instructionsData = {
        gmailApp: [
            "Open your Gmail App. <a href='googlegmail:///' class='app-link' target='_blank' rel='noopener noreferrer'>(Tap here to try opening Gmail App)</a> If it doesn't open, please find and open it manually on your phone.",
            "In Gmail, tap your <strong>Profile Picture</strong> (usually top right).",
            "Tap '<strong>Add another account</strong>'.",
            "Select '<strong>Google</strong>' from the list.",
            "Enter Email: <strong class='highlight-email'>{EMAIL}</strong> then tap <strong>Next</strong>.",
            "Enter the Password: <strong class='highlight-password'>thecartelug</strong> then tap <strong>Next</strong>.", // Password hardcoded here.
            "Follow any on-screen prompts to complete adding the account.",
            "Once successfully added, open the <strong>{EMAIL}</strong> inbox by selecting it from your list of accounts in Gmail.",
            "Look for the latest email from Netflix with a subject like '<strong>Your temporary access code</strong>'.",
            "Open that email and click the '<strong>Get Code</strong>' button found inside it. This will show you the Netflix code."
        ]
    };

    function populateInstructions(emailAddress) {
        if (!gmailAppInstructionsList) {
            console.error("CRITICAL: gmailAppInstructionsList element not found in populateInstructions!");
            return;
        }
        console.log(`Populating instructions for: ${emailAddress}`);
        gmailAppInstructionsList.innerHTML = '';
        instructionsData.gmailApp.forEach(step => {
            const li = document.createElement('li');
            li.innerHTML = step.replace(/{EMAIL}/g, emailAddress);
            gmailAppInstructionsList.appendChild(li);
        });
        console.log("Instructions populated.");
    }

    if (emailOptionButtons.length > 0) {
        emailOptionButtons.forEach((button, index) => {
            console.log(`Attaching listener to 'Email Source' button ${index + 1}`);
            button.addEventListener('click', () => {
                console.log(`'Email Source' button ${button.dataset.option} clicked. Email: ${button.dataset.email}`);

                if (!instructionDetailsContainer || !emailOptionSelectionContainer || !instructionTitle) {
                    console.error("CRITICAL: Essential container elements missing in button click handler.");
                    alert("Page error: UI elements missing. Please contact support.");
                    return;
                }
                console.log("Containers verified in click handler.");

                emailOptionButtons.forEach(btn => btn.classList.remove('active-option'));
                button.classList.add('active-option');

                const selectedEmail = button.dataset.email;
                const selectedOption = button.dataset.option;

                instructionTitle.textContent = `Setup for: ${selectedEmail}`;
                populateInstructions(selectedEmail);

                console.log("Attempting to show instructionDetailsContainer and hide emailOptionSelectionContainer.");
                emailOptionSelectionContainer.style.display = 'none';
                instructionDetailsContainer.style.display = 'block';
                
                emailOptionSelectionContainer.classList.remove('fade-in-slide-up');
                emailOptionSelectionContainer.classList.add('fade-out-rýchlo');
                instructionDetailsContainer.classList.remove('fade-out-rýchlo');
                instructionDetailsContainer.classList.add('fade-in-slide-up');
                
                console.log(`emailOptionSelectionContainer display: ${getComputedStyle(emailOptionSelectionContainer).display}`);
                console.log(`instructionDetailsContainer display: ${getComputedStyle(instructionDetailsContainer).display}`);
                
                if (instructionDetailsContainer.style.display === 'block') {
                    console.log("Scrolling instructionDetailsContainer into view.");
                    instructionDetailsContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
                } else {
                     console.warn("instructionDetailsContainer not 'block' after trying to set it; scroll might not work as expected.");
                }
            });
        });
    } else {
        console.error("No 'email-option-button' elements found to attach listeners.");
    }

    if (backToOptionsButton) {
        console.log("Attaching listener to backToOptionsButton.");
        backToOptionsButton.addEventListener('click', () => {
            console.log("'Back To Options' button clicked.");
            if (!instructionDetailsContainer || !emailOptionSelectionContainer) {
                console.error("CRITICAL: Essential container elements missing for 'back' button handler.");
                alert("Page error: UI elements missing for back navigation. Please contact support.");
                return;
            }
            console.log("Containers verified for back button.");

            instructionDetailsContainer.style.display = 'none';
            emailOptionSelectionContainer.style.display = 'grid'; 
            
            instructionDetailsContainer.classList.remove('fade-in-slide-up');
            instructionDetailsContainer.classList.add('fade-out-rýchlo');
            emailOptionSelectionContainer.classList.remove('fade-out-rýchlo');
            emailOptionSelectionContainer.classList.add('fade-in-slide-up');

            console.log(`instructionDetailsContainer display (after back): ${getComputedStyle(instructionDetailsContainer).display}`);
            console.log(`emailOptionSelectionContainer display (after back): ${getComputedStyle(emailOptionSelectionContainer).display}`);

            emailOptionButtons.forEach(btn => btn.classList.remove('active-option'));
            if (emailOptionSelectionContainer.style.display === 'grid' || emailOptionSelectionContainer.style.display === 'block') {
                console.log("Scrolling emailOptionSelectionContainer into view.");
                emailOptionSelectionContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
            } else {
                console.warn("emailOptionSelectionContainer not visible after trying to set it; scroll might not work.");
            }
        });
    } else {
        console.error("Element with ID 'backToOptionsButton' not found. Back functionality will be unavailable.");
    }
});
