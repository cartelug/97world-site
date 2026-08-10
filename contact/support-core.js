/* === ACCESSUG NEURAL CORE v3.0 (FLUID EDITION) === */

const chatFeed = document.getElementById('chat-feed');
const userInput = document.getElementById('user-input');
const sendBtn = document.getElementById('send-btn');
const inputDock = document.getElementById('input-dock');

// CONFIG
const SUPPORT_NUM = "256762193386"; // For Fixes
const AGENT_NUM = "256790202710";   // For General Inquiries
let resolveUserInput = null; 

// --- 1. CHAT ENGINE ---
const delay = ms => new Promise(res => setTimeout(res, ms));

async function addMessage(text, type = 'bot', element = null) {
    const msgDiv = document.createElement('div');
    msgDiv.classList.add('msg', type === 'bot' ? 'bot-msg' : 'user-msg');
    
    chatFeed.appendChild(msgDiv);
    
    if (type === 'bot') {
        // Typing indicator
        msgDiv.innerHTML = '<span style="opacity:0.6">typing...</span>';
        await delay(500 + Math.random() * 300);
        msgDiv.innerHTML = text;
        if (element) msgDiv.appendChild(element);
    } else {
        msgDiv.textContent = text;
    }

    // Auto Scroll
    chatFeed.scrollTop = chatFeed.scrollHeight;
}

function createChoices(options) {
    const container = document.createElement('div');
    container.className = 'choice-container';
    
    return new Promise((resolve) => {
        options.forEach(opt => {
            const btn = document.createElement('button');
            btn.className = 'msg-choice-btn';
            btn.textContent = opt.label;
            btn.onclick = () => {
                // Disable all
                Array.from(container.children).forEach(b => {
                    b.disabled = true; b.style.opacity = 0.5;
                });
                btn.style.opacity = 1; btn.style.background = "#fff"; btn.style.color = "#000";
                resolve(opt.value);
            };
            container.appendChild(btn);
        });
        chatFeed.lastElementChild.appendChild(container);
        chatFeed.scrollTop = chatFeed.scrollHeight;
    });
}

function waitForInput(placeholderText) {
    return new Promise((resolve) => {
        userInput.placeholder = placeholderText;
        userInput.disabled = false;
        sendBtn.disabled = false;
        userInput.focus();
        inputDock.classList.add('active');

        resolveUserInput = (text) => {
            addMessage(text, 'user');
            userInput.value = '';
            userInput.disabled = true;
            sendBtn.disabled = true;
            userInput.placeholder = "Processing...";
            inputDock.classList.remove('active');
            resolve(text);
        };
    });
}

// Input Handlers
const handleSend = () => {
    const text = userInput.value.trim();
    if (text && resolveUserInput) resolveUserInput(text);
};
sendBtn.onclick = handleSend;
userInput.onkeypress = (e) => { if(e.key === 'Enter') handleSend(); };


// --- 2. LOGIC FLOWS ---

async function startFlow(issue) {
    // Reset fluid color based on issue
    if(issue === 'household') shiftColor('red');
    if(issue === 'prime') shiftColor('blue');
    if(issue === 'spotify') shiftColor('green');
    if(issue === 'agent') shiftColor('purple');

    if (issue === 'household') await householdFlow();
    if (issue === 'netflix_limit') await netflixLimitFlow();
    if (issue === 'prime') await primeFlow();
    if (issue === 'spotify') await spotifyFlow();
    if (issue === 'agent') await agentFlow();
}

/* 🔴 NETFLIX HOUSEHOLD */
async function householdFlow() {
    addMessage("Initializing <b>Household Fix</b> protocol.");
    await delay(600);
    addMessage("Which device are you trying to watch on?");
    const device = await createChoices([
        { label: "📺 TV", value: "TV" },
        { label: "📱 Phone / Tablet", value: "Phone" }
    ]);

    if (device === "TV") {
        addMessage("<b>TV Instructions:</b><br>1. Select 'Update Netflix Household'<br>2. Tap 'Send Email'");
    } else {
        addMessage("<b>Mobile Instructions:</b><br>1. Select 'Watch Temporarily'<br>2. Tap 'Send Email'");
    }

    await delay(1500);
    addMessage("Did you receive the email from Netflix?");
    const received = await createChoices([
        { label: "Yes, Received ✅", value: "yes" },
        { label: "No, Not Received ❌", value: "no" }
    ]);

    if (received === "yes") {
        addMessage("Great! Follow the link in the email to unlock your screen.");
    } else {
        addMessage("Understood. Let's fix this manually. Please enter your details.");
        
        const name = await waitForInput("Enter your FULL NAME...");
        const email = await waitForInput("Enter your EMAIL ADDRESS...");

        addMessage("Generating Support Ticket...");
        
        // TEMPLATE: Netflix Household
        const msg = `ISSUE: Netflix Household. STATUS: No Email. NAME: ${name}. EMAIL: ${email}.`;
        const link = `https://wa.me/${SUPPORT_NUM}?text=${encodeURIComponent(msg)}`;

        const btn = document.createElement('a');
        btn.href = link;
        btn.className = "whatsapp-btn-chat";
        btn.innerHTML = `<i class="fab fa-whatsapp"></i> Open WhatsApp`;
        addMessage("Click below to send to support:", 'bot', btn);
    }
}

/* 🔵 PRIME VIDEO */
async function primeFlow() {
    addMessage("Scanning Prime Video status...");
    await delay(800);
    addMessage("What is the specific error?");
    
    const err = await createChoices([
        { label: "Device Limit Reached", value: "limit" },
        { label: "Can't Watch / Playback", value: "cant" }
    ]);

    if (err === "limit") {
        addMessage("This usually clears automatically in 10-15 mins. If it persists, escalate below.");
        const action = await createChoices([
            { label: "Wait 15 Mins", value: "wait" },
            { label: "Escalate Issue", value: "now" }
        ]);

        if (action === "wait") {
            addMessage("Okay. Try again shortly!");
        } else {
            const name = await waitForInput("Enter your NAME...");
            // TEMPLATE: Prime Limit
            const msg = `ISSUE: Prime Device Limit. ACTION: Escalate. NAME: ${name}.`;
            const link = `https://wa.me/${SUPPORT_NUM}?text=${encodeURIComponent(msg)}`;
            
            const btn = document.createElement('a');
            btn.href = link;
            btn.className = "whatsapp-btn-chat";
            btn.innerHTML = `<i class="fab fa-whatsapp"></i> Escalate`;
            addMessage("Send escalation request:", 'bot', btn);
        }
    } else {
        addMessage("Please try a different movie. Do ALL titles refuse to play?");
        const allRefuse = await createChoices([
            { label: "Yes, None Work", value: "yes" },
            { label: "Some Work", value: "no" }
        ]);

        if (allRefuse === "yes") {
            addMessage("We need to issue a replacement.");
            const name = await waitForInput("Enter your NAME...");
            // TEMPLATE: Prime Replacement
            const msg = `ISSUE: Prime Replacement. STATUS: Titles Not Playing. NAME: ${name}.`;
            const link = `https://wa.me/${SUPPORT_NUM}?text=${encodeURIComponent(msg)}`;
            
            const btn = document.createElement('a');
            btn.href = link;
            btn.className = "whatsapp-btn-chat";
            btn.innerHTML = `<i class="fab fa-whatsapp"></i> Get Replacement`;
            addMessage("Click to proceed:", 'bot', btn);
        } else {
            addMessage("If some work, it's likely a specific title issue. Try again later.");
        }
    }
}

/* 🔴 NETFLIX DEVICE LIMIT */
async function netflixLimitFlow() {
    addMessage("Please try downloading the title on your <b>Phone</b>. Does that work?");
    const works = await createChoices([
        { label: "It Works", value: "yes" },
        { label: "Still Not Working", value: "no" }
    ]);

    if (works === "no") {
        const name = await waitForInput("Enter your NAME...");
        const dev = await waitForInput("Enter DEVICE Name (e.g. iPhone 11)...");
        
        // TEMPLATE: Netflix Limit
        const msg = `ISSUE: Netflix Device Limit. NAME: ${name}. DEVICE: ${dev}.`;
        const link = `https://wa.me/${SUPPORT_NUM}?text=${encodeURIComponent(msg)}`;
        
        const btn = document.createElement('a');
        btn.href = link;
        btn.className = "whatsapp-btn-chat";
        btn.innerHTML = `<i class="fab fa-whatsapp"></i> Request Fix`;
        addMessage("Send to agent:", 'bot', btn);
    } else {
        addMessage("Great! Enjoy offline viewing.");
    }
}

/* 🟢 SPOTIFY */
async function spotifyFlow() {
    addMessage("Checking Spotify servers...");
    await delay(1000);
    addMessage("We are experiencing a service delay. Please check back within <b>72 hours</b>.");
}

/* 👤 HUMAN AGENT */
async function agentFlow() {
    addMessage("Connecting to Human Support Line...");
    const name = await waitForInput("Enter your NAME...");
    
    // TEMPLATE: General Inquiry
    const msg = `INQUIRY: General Question. NAME: ${name}. CONNECT ME.`;
    const link = `https://wa.me/${AGENT_NUM}?text=${encodeURIComponent(msg)}`; // New Number
    
    const btn = document.createElement('a');
    btn.href = link;
    btn.className = "whatsapp-btn-chat";
    btn.innerHTML = `<i class="fab fa-whatsapp"></i> Chat with Agent`;
    addMessage("Agent is ready. Click to chat:", 'bot', btn);
}


// --- 3. FLUID BACKGROUND ENGINE (Canvas) ---
const canvas = document.getElementById('fluid-bg');
const ctx = canvas.getContext('2d');
let w, h;

// Configuration for "Ethereal Fluid"
const blobs = [
    { x: 0, y: 0, vx: 1, vy: 1, r: 0, color: 'rgba(125, 42, 232, 0.4)' }, // Purple
    { x: 0, y: 0, vx: -1, vy: 0.5, r: 0, color: 'rgba(0, 168, 225, 0.4)' }, // Blue
    { x: 0, y: 0, vx: 0.5, vy: -1, r: 0, color: 'rgba(229, 9, 20, 0.3)' }   // Red
];

// Target color overlay (changes on click)
let targetHue = 0; // 0=Mix, 1=Red, 2=Blue, 3=Green
let currentOverlayAlpha = 0;

function resize() {
    w = window.innerWidth;
    h = window.innerHeight;
    canvas.width = w;
    canvas.height = h;
    
    // Init blobs
    blobs.forEach(b => {
        b.x = Math.random() * w;
        b.y = Math.random() * h;
        b.r = Math.min(w, h) * 0.4; // Big blobs
    });
}
window.onresize = resize;

function shiftColor(color) {
    // We visualize this by drawing a massive colored rect over everything with low alpha
    if (color === 'red') targetHue = '229, 9, 20';
    if (color === 'blue') targetHue = '0, 168, 225';
    if (color === 'green') targetHue = '29, 185, 84';
    if (color === 'purple') targetHue = '125, 42, 232';
    currentOverlayAlpha = 0.2;
}
function resetColor() {
    currentOverlayAlpha = 0;
}

function animate() {
    ctx.fillStyle = '#020202';
    ctx.fillRect(0, 0, w, h);

    // Draw Blobs
    ctx.globalCompositeOperation = 'screen';
    blobs.forEach(b => {
        b.x += b.vx;
        b.y += b.vy;
        if(b.x < -b.r || b.x > w+b.r) b.vx *= -1;
        if(b.y < -b.r || b.y > h+b.r) b.vy *= -1;

        const g = ctx.createRadialGradient(b.x, b.y, 0, b.x, b.y, b.r);
        g.addColorStop(0, b.color);
        g.addColorStop(1, 'rgba(0,0,0,0)');
        
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(b.x, b.y, b.r, 0, Math.PI*2);
        ctx.fill();
    });

    // Draw Color Shift Overlay
    if (targetHue && currentOverlayAlpha > 0.01) {
        ctx.globalCompositeOperation = 'source-over';
        ctx.fillStyle = `rgba(${targetHue}, ${currentOverlayAlpha})`;
        ctx.fillRect(0, 0, w, h);
    }
    
    // Apply blur via canvas filter (or CSS) - CSS is faster
    // We use CSS for the blur, here we just draw sharp gradients
    
    requestAnimationFrame(animate);
}

// Add CSS Blur to canvas
canvas.style.filter = 'blur(60px)';
canvas.style.transform = 'scale(1.2)'; // Scale up to hide blur edges

// START
resize();
animate();

window.onload = () => {
    addMessage("AccessUG Neural Core initialized.");
    setTimeout(() => addMessage("Please select a service protocol from the right."), 800);
};

// Make functions global for HTML
window.startFlow = startFlow;
window.shiftColor = shiftColor;
window.resetColor = resetColor;