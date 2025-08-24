// Supabase Configuration
const SUPABASE_URL = "https://aenkpxtratzwftzuxzng.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFlbmtweHRyYXR6d2Z0enV4em5nIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYwMDAxODcsImV4cCI6MjA3MTU3NjE4N30.FTE0ydk3Blce8r_-6o6ptcIFf0-4rTLNjsngGUWxvuU";

// Initialize Supabase client
const supabase = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Global variables
let currentAdminId = null;
let currentOtp = null;
let otpExpiryTime = null;
let otpTimer = null;

// DOM Elements
const loadingScreen = document.getElementById('loadingScreen');
const loginPage = document.getElementById('loginPage');
const otpPage = document.getElementById('otpPage');
const dashboardPage = document.getElementById('dashboardPage');
const addMemberModal = document.getElementById('addMemberModal');
const notificationToast = document.getElementById('notificationToast');

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
    setupEventListeners();
    setupDatabase();
});

// Initialize database tables
async function setupDatabase() {
    try {
        // Create AdminUser table if not exists
        await supabase.rpc('create_table_if_not_exists', {
            table_name: 'AdminUser',
            table_sql: `
                CREATE TABLE IF NOT EXISTS "AdminUser" (
                    id SERIAL PRIMARY KEY,
                    username VARCHAR(255) UNIQUE NOT NULL,
                    password_hash VARCHAR(255) NOT NULL,
                    email VARCHAR(255),
                    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
                );
            `
        });

        // Create OTP table if not exists
        await supabase.rpc('create_table_if_not_exists', {
            table_name: 'OTP',
            table_sql: `
                CREATE TABLE IF NOT EXISTS "OTP" (
                    id SERIAL PRIMARY KEY,
                    admin_id INTEGER REFERENCES "AdminUser"(id),
                    otp_code VARCHAR(6) NOT NULL,
                    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
                    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
                );
            `
        });

        // Create Members table if not exists
        await supabase.rpc('create_table_if_not_exists', {
            table_name: 'Members',
            table_sql: `
                CREATE TABLE IF NOT EXISTS "Members" (
                    id SERIAL PRIMARY KEY,
                    name VARCHAR(255) NOT NULL,
                    weekly_amount INTEGER NOT NULL,
                    status VARCHAR(50) DEFAULT 'active',
                    total_paid DECIMAL(10,2) DEFAULT 0,
                    loan_amount DECIMAL(10,2) DEFAULT 0,
                    fine_amount DECIMAL(10,2) DEFAULT 0,
                    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
                );
            `
        });

        // Create LoanHistory table if not exists
        await supabase.rpc('create_table_if_not_exists', {
            table_name: 'LoanHistory',
            table_sql: `
                CREATE TABLE IF NOT EXISTS "LoanHistory" (
                    id SERIAL PRIMARY KEY,
                    member_id INTEGER REFERENCES "Members"(id),
                    loan_amount DECIMAL(10,2) NOT NULL,
                    paid_amount DECIMAL(10,2) DEFAULT 0,
                    week INTEGER NOT NULL,
                    interest DECIMAL(10,2) DEFAULT 0,
                    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
                );
            `
        });

        console.log('Database tables setup completed');
    } catch (error) {
        console.error('Error setting up database:', error);
    }
}

// Initialize the application
async function initializeApp() {
    try {
        // Check if user is already logged in
        const session = await supabase.auth.getSession();
        if (session.data.session) {
            showDashboard();
        } else {
            hideLoadingScreen();
        }
    } catch (error) {
        console.error('Error initializing app:', error);
        hideLoadingScreen();
    }
}

// Hide loading screen
function hideLoadingScreen() {
    setTimeout(() => {
        loadingScreen.style.opacity = '0';
        setTimeout(() => {
            loadingScreen.style.display = 'none';
        }, 500);
    }, 1000);
}

// Setup event listeners
function setupEventListeners() {
    // Login form
    document.getElementById('loginForm').addEventListener('submit', handleLogin);
    
    // OTP form
    document.getElementById('otpForm').addEventListener('submit', handleOtpVerification);
    
    // OTP input handling
    setupOtpInputs();
    
    // Buttons
    document.getElementById('regenerateOtpBtn').addEventListener('click', regenerateOtp);
    document.getElementById('backToLoginBtn').addEventListener('click', showLoginPage);
    document.getElementById('addMemberBtn').addEventListener('click', showAddMemberModal);
    document.getElementById('logoutBtn').addEventListener('click', handleLogout);
    
    // Modal close buttons
    document.getElementById('closeModalBtn').addEventListener('click', hideAddMemberModal);
    document.getElementById('cancelMemberBtn').addEventListener('click', hideAddMemberModal);
    
    // Forms
    document.getElementById('addMemberForm').addEventListener('submit', handleAddMember);
    
    // Toast close
    document.getElementById('closeToastBtn').addEventListener('click', hideNotification);
}

// Setup OTP input handling
function setupOtpInputs() {
    const otpInputs = document.querySelectorAll('.otp-input');
    
    otpInputs.forEach((input, index) => {
        input.addEventListener('input', function(e) {
            if (e.target.value.length === 1) {
                if (index < otpInputs.length - 1) {
                    otpInputs[index + 1].focus();
                }
            }
        });
        
        input.addEventListener('keydown', function(e) {
            if (e.key === 'Backspace' && e.target.value.length === 0) {
                if (index > 0) {
                    otpInputs[index - 1].focus();
                }
            }
        });
    });
}

// Handle login
async function handleLogin(e) {
    e.preventDefault();
    
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    
    // Check hardcoded credentials
    if (username === "Shreeramfund" && password === "Shreeram@2025") {
        try {
            // Generate OTP
            const otp = generateOTP();
            currentOtp = otp;
            
            // Save OTP to database
            await saveOtpToDatabase(otp);
            
            // Show OTP page
            showOtpPage();
            
            // Start OTP timer
            startOtpTimer();
            
        } catch (error) {
            showNotification('Error generating OTP. Please try again.', 'error');
        }
    } else {
        showNotification('Invalid username or password.', 'error');
    }
}

// Generate 6-digit OTP
function generateOTP() {
    return Math.floor(100000 + Math.random() * 900000).toString();
}

// Save OTP to database
async function saveOtpToDatabase(otp) {
    try {
        // First, get or create admin user
        let { data: adminUser, error: adminError } = await supabase
            .from('AdminUser')
            .select('id')
            .eq('username', 'Shreeramfund')
            .single();
        
        if (adminError && adminError.code !== 'PGRST116') {
            throw adminError;
        }
        
        if (!adminUser) {
            // Create admin user if doesn't exist
            const { data: newAdmin, error: createError } = await supabase
                .from('AdminUser')
                .insert([
                    {
                        username: 'Shreeramfund',
                        password_hash: 'hashed_password_here',
                        email: 'admin@shreeramfund.com'
                    }
                ])
                .select()
                .single();
            
            if (createError) throw createError;
            currentAdminId = newAdmin.id;
        } else {
            currentAdminId = adminUser.id;
        }
        
        // Calculate expiry time (10 minutes from now)
        const expiresAt = new Date();
        expiresAt.setMinutes(expiresAt.getMinutes() + 10);
        otpExpiryTime = expiresAt;
        
        // Save OTP
        const { error: otpError } = await supabase
            .from('OTP')
            .insert([
                {
                    admin_id: currentAdminId,
                    otp_code: otp,
                    expires_at: expiresAt.toISOString()
                }
            ]);
        
        if (otpError) throw otpError;
        
    } catch (error) {
        console.error('Error saving OTP:', error);
        throw error;
    }
}

// Start OTP timer
function startOtpTimer() {
    const timerDisplay = document.getElementById('otpTimer');
    const otpDisplay = document.getElementById('otpDisplay');
    
    // Display OTP
    otpDisplay.textContent = currentOtp;
    
    // Update timer every second
    otpTimer = setInterval(() => {
        const now = new Date();
        const timeLeft = Math.max(0, Math.floor((otpExpiryTime - now) / 1000));
        
        if (timeLeft <= 0) {
            clearInterval(otpTimer);
            timerDisplay.textContent = 'Expired';
            showNotification('OTP has expired. Please regenerate.', 'error');
        } else {
            const minutes = Math.floor(timeLeft / 60);
            const seconds = timeLeft % 60;
            timerDisplay.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
        }
    }, 1000);
}

// Handle OTP verification
async function handleOtpVerification(e) {
    e.preventDefault();
    
    const otpInputs = document.querySelectorAll('.otp-input');
    const enteredOtp = Array.from(otpInputs).map(input => input.value).join('');
    
    if (enteredOtp === currentOtp) {
        // Check if OTP is not expired
        if (new Date() < otpExpiryTime) {
            clearInterval(otpTimer);
            showNotification('Login successful!', 'success');
            setTimeout(() => {
                showDashboard();
            }, 1000);
        } else {
            showNotification('OTP has expired. Please regenerate.', 'error');
        }
    } else {
        showNotification('Invalid OTP. Please try again.', 'error');
        // Clear OTP inputs
        otpInputs.forEach(input => input.value = '');
        otpInputs[0].focus();
    }
}

// Regenerate OTP
async function regenerateOtp() {
    try {
        // Clear previous timer
        if (otpTimer) {
            clearInterval(otpTimer);
        }
        
        // Generate new OTP
        const otp = generateOTP();
        currentOtp = otp;
        
        // Save new OTP to database
        await saveOtpToDatabase(otp);
        
        // Clear OTP inputs
        const otpInputs = document.querySelectorAll('.otp-input');
        otpInputs.forEach(input => input.value = '');
        
        // Start new timer
        startOtpTimer();
        
        showNotification('New OTP generated successfully!', 'success');
        
    } catch (error) {
        showNotification('Error regenerating OTP. Please try again.', 'error');
    }
}

// Handle add member
async function handleAddMember(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const memberData = {
        name: formData.get('memberName'),
        weekly_amount: parseInt(formData.get('weeklyAmount')),
        status: formData.get('memberStatus'),
        loan_amount: parseFloat(formData.get('loanAmount')) || 0,
        fine_amount: parseFloat(formData.get('fineAmount')) || 0,
        total_paid: 0
    };
    
    try {
        const { data, error } = await supabase
            .from('Members')
            .insert([memberData])
            .select()
            .single();
        
        if (error) throw error;
        
        // If loan amount > 0, create loan history
        if (memberData.loan_amount > 0) {
            const currentWeek = parseInt(formData.get('currentWeek')) || 1;
            await supabase
                .from('LoanHistory')
                .insert([
                    {
                        member_id: data.id,
                        loan_amount: memberData.loan_amount,
                        paid_amount: 0,
                        week: currentWeek,
                        interest: 0,
                        created_at: new Date().toISOString()
                    }
                ]);
        }
        
        showNotification('Member added successfully!', 'success');
        hideAddMemberModal();
        e.target.reset();
        loadMembers(); // Refresh members list
        
    } catch (error) {
        console.error('Error adding member:', error);
        showNotification('Error adding member. Please try again.', 'error');
    }
}

// Load members from database
async function loadMembers() {
    try {
        const { data: members, error } = await supabase
            .from('Members')
            .select('*')
            .order('created_at', { ascending: false });
        
        if (error) throw error;
        
        displayMembers(members || []);
        updateStats(members || []);
        
    } catch (error) {
        console.error('Error loading members:', error);
        showNotification('Error loading members.', 'error');
    }
}

// Display members in the grid
function displayMembers(members) {
    const membersList = document.getElementById('membersList');
    membersList.innerHTML = '';
    
    if (members.length === 0) {
        membersList.innerHTML = '<p class="no-members">No members found. Add your first member!</p>';
        return;
    }
    
    members.forEach((member, index) => {
        const memberCard = createMemberCard(member, index);
        membersList.appendChild(memberCard);
    });
}

// Create member card
function createMemberCard(member, index) {
    const card = document.createElement('div');
    card.className = 'member-card';
    card.style.animationDelay = `${index * 0.1}s`;
    
    // Calculate loan details
    const loanInfo = calculateLoanInfo(member);
    
    card.innerHTML = `
        <div class="member-header">
            <div class="member-name">${member.name}</div>
            <div class="member-status ${member.status}">${member.status}</div>
        </div>
        <div class="member-details">
            <div class="detail-item">
                <div class="detail-label">Weekly Amount</div>
                <div class="detail-value">₹${member.weekly_amount}</div>
            </div>
            <div class="detail-item">
                <div class="detail-label">Total Paid</div>
                <div class="detail-value">₹${member.total_paid}</div>
            </div>
            <div class="detail-item">
                <div class="detail-label">Fine Amount</div>
                <div class="detail-value">₹${member.fine_amount}</div>
            </div>
            <div class="detail-item">
                <div class="detail-label">Status</div>
                <div class="detail-value">${member.status}</div>
            </div>
        </div>
        ${loanInfo ? `
        <div class="loan-info">
            <h4><i class="fas fa-hand-holding-usd"></i> Loan Information</h4>
            <div class="loan-details">
                <div>Original Loan: ₹${member.loan_amount}</div>
                <div>Remaining: ₹${loanInfo.remainingLoan}</div>
                <div>Interest: ₹${loanInfo.totalInterest}</div>
                <div>Week: ${loanInfo.currentWeek}</div>
            </div>
        </div>
        ` : ''}
    `;
    
    return card;
}

// Calculate loan information with 0.5% weekly interest
function calculateLoanInfo(member) {
    if (!member.loan_amount || member.loan_amount <= 0) {
        return null;
    }
    
    // Calculate current week since loan was taken
    const currentWeek = Math.floor((new Date() - new Date(member.created_at)) / (7 * 24 * 60 * 60 * 1000)) + 1;
    const weeklyInterestRate = 0.005; // 0.5%
    
    let remainingLoan = member.loan_amount;
    let totalInterest = 0;
    
    // Calculate interest for each week since loan was taken (starting from week 2)
    for (let week = 2; week <= currentWeek; week++) {
        if (remainingLoan > 0) {
            const weeklyInterest = remainingLoan * weeklyInterestRate;
            totalInterest += weeklyInterest;
            remainingLoan += weeklyInterest; // Interest is added to loan
        }
    }
    
    return {
        remainingLoan: Math.round(remainingLoan * 100) / 100,
        totalInterest: Math.round(totalInterest * 100) / 100,
        currentWeek: currentWeek
    };
}

// Update statistics
function updateStats(members) {
    const totalMembers = members.length;
    const totalWeekly = members.reduce((sum, member) => sum + member.weekly_amount, 0);
    const totalLoans = members.reduce((sum, member) => sum + (member.loan_amount || 0), 0);
    const totalFines = members.reduce((sum, member) => sum + (member.fine_amount || 0), 0);
    
    document.getElementById('totalMembers').textContent = totalMembers;
    document.getElementById('totalWeekly').textContent = `₹${totalWeekly}`;
    document.getElementById('totalLoans').textContent = `₹${totalLoans}`;
    document.getElementById('totalFines').textContent = `₹${totalFines}`;
}

// Handle logout
function handleLogout() {
    currentAdminId = null;
    currentOtp = null;
    if (otpTimer) {
        clearInterval(otpTimer);
    }
    showLoginPage();
    showNotification('Logged out successfully!', 'success');
}

// Page navigation functions
function showLoginPage() {
    hideAllPages();
    loginPage.classList.add('active');
    // Clear forms
    document.getElementById('loginForm').reset();
}

function showOtpPage() {
    hideAllPages();
    otpPage.classList.add('active');
    // Clear OTP inputs
    const otpInputs = document.querySelectorAll('.otp-input');
    otpInputs.forEach(input => input.value = '');
}

function showDashboard() {
    hideAllPages();
    dashboardPage.classList.add('active');
    loadMembers();
}

function hideAllPages() {
    loginPage.classList.remove('active');
    otpPage.classList.remove('active');
    dashboardPage.classList.remove('active');
}

// Modal functions
function showAddMemberModal() {
    addMemberModal.classList.add('active');
}

function hideAddMemberModal() {
    addMemberModal.classList.remove('active');
    document.getElementById('addMemberForm').reset();
}

// Notification functions
function showNotification(message, type = 'info') {
    const toast = document.getElementById('notificationToast');
    const messageEl = document.getElementById('toastMessage');
    const iconEl = document.getElementById('toastIcon');
    
    messageEl.textContent = message;
    
    // Set icon and class based on type
    iconEl.className = `fas ${getIconClass(type)}`;
    iconEl.classList.add(type);
    
    toast.classList.add('show');
    
    // Auto-hide after 5 seconds
    setTimeout(() => {
        hideNotification();
    }, 5000);
}

function hideNotification() {
    const toast = document.getElementById('notificationToast');
    toast.classList.remove('show');
}

function getIconClass(type) {
    switch (type) {
        case 'success': return 'fa-check-circle';
        case 'error': return 'fa-exclamation-circle';
        case 'info': return 'fa-info-circle';
        default: return 'fa-info-circle';
    }
}

// Real-time updates
function setupRealtimeUpdates() {
    // Subscribe to changes in Members table
    supabase
        .channel('members_changes')
        .on('postgres_changes', 
            { event: '*', schema: 'public', table: 'Members' },
            (payload) => {
                console.log('Members table changed:', payload);
                loadMembers(); // Refresh the display
            }
        )
        .subscribe();
}

// Initialize real-time updates when dashboard is shown
document.addEventListener('DOMContentLoaded', function() {
    // Setup real-time updates after a short delay
    setTimeout(() => {
        setupRealtimeUpdates();
    }, 2000);
});

// Error handling for network issues
window.addEventListener('online', function() {
    showNotification('Connection restored!', 'success');
});

window.addEventListener('offline', function() {
    showNotification('No internet connection. Some features may not work.', 'error');
});

// Export functions for debugging
window.appDebug = {
    showLoginPage,
    showOtpPage,
    showDashboard,
    loadMembers,
    generateOTP,
    showNotification
};
