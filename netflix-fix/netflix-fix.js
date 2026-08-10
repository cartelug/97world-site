// Get elements
const deviceChoiceSection = document.getElementById('device-choice');
const phoneInstructions = document.getElementById('phone-instructions');
const tvInstructions = document.getElementById('tv-instructions');
const btnPhone = document.getElementById('btn-phone');
const btnTv = document.getElementById('btn-tv');

// Function to show device choice and hide instructions
function showDeviceChoice() {
    deviceChoiceSection.classList.remove('hidden');
    phoneInstructions.classList.add('hidden');
    tvInstructions.classList.add('hidden');
}

// Event listener for Phone button
btnPhone.addEventListener('click', () => {
    deviceChoiceSection.classList.add('hidden');
    phoneInstructions.classList.remove('hidden');
    tvInstructions.classList.add('hidden');
    // Optional: Scroll to instructions smoothly
    phoneInstructions.scrollIntoView({ behavior: 'smooth', block: 'start' });
});

// Event listener for TV button
btnTv.addEventListener('click', () => {
    deviceChoiceSection.classList.add('hidden');
    tvInstructions.classList.remove('hidden');
    phoneInstructions.classList.add('hidden');
     // Optional: Scroll to instructions smoothly
    tvInstructions.scrollIntoView({ behavior: 'smooth', block: 'start' });
});

// Initialize: Ensure only device choice is visible on load
document.addEventListener('DOMContentLoaded', showDeviceChoice);