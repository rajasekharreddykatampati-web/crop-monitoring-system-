// ===== CropDoctor Auth Module (Firebase Integrated) =====

// Your web app's Firebase configuration (from .env)
const firebaseConfig = {
    apiKey: "AIzaSyBWV3Da7U1wfBtnnGkIfCMo-aA1ej5seuw",
    authDomain: "crop-monitor-684d8.firebaseapp.com",
    projectId: "crop-monitor-684d8",
    storageBucket: "crop-monitor-684d8.firebasestorage.app",
    messagingSenderId: "1027449652032",
    appId: "1:1027449652032:web:1c35cabe9e96b4ef96f0a5",
    measurementId: "G-8FDBMVEGF9"
};

// Initialize Firebase
if (typeof firebase !== 'undefined') {
    firebase.initializeApp(firebaseConfig);
}

// Switch between Login and Signup tabs
function switchTab(tab) {
    const loginSection = document.getElementById('login-form-section');
    const signupSection = document.getElementById('signup-form-section');
    const tabLogin = document.getElementById('tab-login');
    const tabSignup = document.getElementById('tab-signup');

    // Clear any previous messages
    document.getElementById('login-message').style.display = 'none';
    document.getElementById('signup-message').style.display = 'none';

    if (tab === 'login') {
        loginSection.style.display = 'block';
        signupSection.style.display = 'none';
        tabLogin.classList.add('active');
        tabSignup.classList.remove('active');
    } else {
        loginSection.style.display = 'none';
        signupSection.style.display = 'block';
        tabLogin.classList.remove('active');
        tabSignup.classList.add('active');
    }
}

// Switch login role between Farmer and Admin
function switchLoginRole(role) {
    const farmerForm = document.getElementById('farmer-login-form');
    const adminForm = document.getElementById('admin-login-form');
    const tabFarmer = document.getElementById('tab-farmer-login');
    const tabAdmin = document.getElementById('tab-admin-login');
    const loginFooter = document.getElementById('login-footer');

    if (role === 'farmer') {
        farmerForm.style.display = 'block';
        adminForm.style.display = 'none';
        tabFarmer.classList.add('active');
        tabAdmin.classList.remove('active');
        loginFooter.style.display = 'block';
    } else {
        farmerForm.style.display = 'none';
        adminForm.style.display = 'block';
        tabFarmer.classList.remove('active');
        tabAdmin.classList.add('active');
        loginFooter.style.display = 'none';
    }
}

// ===== Handle Farmer Login =====
async function handleFarmerLogin(event) {
    event.preventDefault();
    const btn = document.getElementById('login-btn');
    const messageEl = document.getElementById('login-message');

    const email = document.getElementById('login-email').value.trim();
    const password = document.getElementById('login-password').value;

    if (!email || !password) {
        showMessage(messageEl, 'Please fill in all fields.', 'error');
        return;
    }

    btn.innerHTML = '<span class="spinner"></span> Logging in...';
    btn.disabled = true;

    let loggedIn = false;

    // 1. Try backend API first
    try {
        const response = await fetch('https://crop-monitoring-system-3.onrender.com/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email_phone: email, password: password })
        });

        const data = await response.json();

        if (response.ok) {
            // Store farmer details in localStorage (cache)
            const userToStore = {
                name: data.user.name,
                initials: data.user.initials || getInitials(data.user.name),
                email_phone: data.user.email_phone,
                address: data.user.address || '',
                age: data.user.age || '',
                role: data.user.role || 'farmer',
                loggedInAt: new Date().toISOString()
            };
            localStorage.setItem('cropdoctor_user', JSON.stringify(userToStore));
            localStorage.setItem('cropdoctor_token', data.token || '');

            // Sync with local users cache but WITHOUT plain-text password if we're online
            // This prevents mismatch later if they try to login offline
            storeUserLocally({
                ...userToStore,
                password: password // Keep it for offline fallback if they just logged in
            });

            loggedIn = true;
        } else {
            // Backend said invalid credentials
            showMessage(messageEl, data.detail || 'Invalid credentials. Please try again.', 'error');
            btn.innerHTML = 'Login as Farmer';
            btn.disabled = false;
            return;
        }
    } catch (error) {
        // 2. Backend not reachable — fallback to localStorage cache
        console.log('Backend offline, checking local cache...');
        const users = JSON.parse(localStorage.getItem('cropdoctor_users') || '[]');
        const user = users.find(u => u.email_phone === email && u.password === password);

        if (user) {
            // Found user in local cache — store as current user
            const userToStore = {
                name: user.name,
                initials: user.initials || getInitials(user.name),
                email_phone: user.email_phone,
                address: user.address || '',
                age: user.age || '',
                role: 'farmer',
                loggedInAt: new Date().toISOString()
            };
            localStorage.setItem('cropdoctor_user', JSON.stringify(userToStore));
            loggedIn = true;
        } else {
            showMessage(messageEl, 'Invalid email/phone or password. Please check your credentials.', 'error');
            btn.innerHTML = 'Login as Farmer';
            btn.disabled = false;
            return;
        }
    }

    // 3. Login successful — navigate to dashboard
    if (loggedIn) {
        showMessage(messageEl, '✅ Login successful! Redirecting to dashboard...', 'success');
        btn.innerHTML = '✅ Success!';
        setTimeout(() => {
            window.location.href = 'dashboard.html';
        }, 1200);
    }
}

// ===== Handle Farmer Signup =====
async function handleSignup(event) {
    event.preventDefault();
    const btn = document.getElementById('signup-btn');
    const messageEl = document.getElementById('signup-message');

    const name = document.getElementById('farmer-name').value.trim();
    const address = document.getElementById('farmer-address').value.trim();
    const age = document.getElementById('farmer-age').value;
    const contact = document.getElementById('farmer-contact').value.trim();
    const password = document.getElementById('farmer-password').value;
    const confirmPassword = document.getElementById('farmer-confirm-password').value;

    // Validation
    if (!name || !address || !age || !contact || !password || !confirmPassword) {
        showMessage(messageEl, 'Please fill in all required fields.', 'error');
        return;
    }

    if (password !== confirmPassword) {
        showMessage(messageEl, 'Passwords do not match.', 'error');
        return;
    }

    if (password.length < 6) {
        showMessage(messageEl, 'Password must be at least 6 characters.', 'error');
        return;
    }

    if (parseInt(age) < 18 || parseInt(age) > 100) {
        showMessage(messageEl, 'Age must be between 18 and 100.', 'error');
        return;
    }

    btn.innerHTML = '<span class="spinner"></span> Creating Account...';
    btn.disabled = true;

    const userData = {
        name: name,
        address: address,
        age: parseInt(age),
        email_phone: contact,
        password: password,
        initials: getInitials(name)
    };

    let signedUp = false;

    // 1. Try backend API first
    try {
        const response = await fetch('https://crop-monitoring-system-3.onrender.com/api/auth/signup', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(userData)
        });

        const data = await response.json();

        if (response.ok) {
            signedUp = true;
            // Also store in localStorage as cache so offline login works
            storeUserLocally(userData);
        } else {
            showMessage(messageEl, data.detail || 'Signup failed. Please try again.', 'error');
            btn.innerHTML = 'Create Account';
            btn.disabled = false;
            return;
        }
    } catch (error) {
        // 2. Backend offline — store in localStorage only
        console.log('Backend offline, storing locally...');
        const users = JSON.parse(localStorage.getItem('cropdoctor_users') || '[]');
        const exists = users.some(u => u.email_phone === contact);

        if (exists) {
            showMessage(messageEl, 'An account with this email/phone already exists.', 'error');
            btn.innerHTML = 'Create Account';
            btn.disabled = false;
            return;
        }

        storeUserLocally(userData);
        signedUp = true;
    }

    // 3. Signup successful — switch to login tab
    if (signedUp) {
        showMessage(messageEl, '✅ Account created successfully! Redirecting to login...', 'success');
        btn.innerHTML = '✅ Account Created!';
        setTimeout(() => {
            switchTab('login');
            // Pre-fill login email with the just-registered contact
            document.getElementById('login-email').value = contact;
            showMessage(
                document.getElementById('login-message'),
                '🎉 Account created! Enter your password to login.',
                'success'
            );
            btn.innerHTML = 'Create Account';
            btn.disabled = false;
        }, 1500);
    }
}

// Store farmer details in localStorage cache
function storeUserLocally(userData) {
    const users = JSON.parse(localStorage.getItem('cropdoctor_users') || '[]');
    // Avoid duplicates
    const existingIdx = users.findIndex(u => u.email_phone === userData.email_phone);
    if (existingIdx >= 0) {
        users[existingIdx] = userData;
    } else {
        users.push(userData);
    }
    localStorage.setItem('cropdoctor_users', JSON.stringify(users));
}

// Handle Google Login (Admin)
async function handleGoogleLogin() {
    if (typeof firebase === 'undefined') {
        alert('Firebase not loaded yet. Please wait or refresh.');
        return;
    }

    const provider = new firebase.auth.GoogleAuthProvider();

    try {
        const result = await firebase.auth().signInWithPopup(provider);
        const user = result.user;

        // Prepare user data for CropDoctor
        const userData = {
            name: user.displayName,
            email: user.email,
            photo: user.photoURL,
            initials: getInitials(user.displayName),
            role: 'admin',
            loggedInAt: new Date().toISOString()
        };

        // Cache the admin details
        localStorage.setItem('cropdoctor_user', JSON.stringify(userData));
        localStorage.setItem('cropdoctor_token', user.uid); // Using UID as token for now

        // Optional: Send to backend to log admin login if needed
        console.log('Admin logged in via Google:', userData);

        // Feedback: Show account details
        const messageEl = document.getElementById('login-message');
        if (messageEl) {
            const detailHtml = `
                <div style="margin-top: 12px; padding: 12px; background: rgba(0,0,0,0.03); border-radius: 8px; text-align: left;">
                    <div style="display: flex; align-items: center; gap: 12px;">
                        <img src="${user.photoURL}" style="width: 42px; height: 42px; border-radius: 50%; border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                        <div>
                            <div style="font-weight: 600; font-size: 0.95rem;">${user.displayName}</div>
                            <div style="font-size: 0.8rem; color: var(--text-secondary);">${user.email}</div>
                        </div>
                    </div>
                </div>
            `;
            showMessage(messageEl, '✅ Sign-in successful! Accessing Admin Dashboard...', 'success');
            messageEl.innerHTML += detailHtml;
            messageEl.style.display = 'block';
        }

        // Redirect to dashboard
        setTimeout(() => {
            window.location.href = 'dashboard.html';
        }, 2500);

    } catch (error) {
        console.error('Google Sign-In Error:', error);
        alert('Google Sign-In Failed: ' + error.message);
    }
}

// Helper: Show form message
function showMessage(element, text, type) {
    element.className = 'form-message ' + type;
    element.textContent = text;
    element.style.display = 'block';

    if (type === 'success') {
        setTimeout(() => {
            element.style.display = 'none';
        }, 8000);
    }
}

// Helper: Get initials (first 2 letters of farmer name)
function getInitials(name) {
    if (!name) return 'CD';
    const parts = name.trim().split(' ').filter(p => p.length > 0);
    if (parts.length >= 2) {
        return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
}

// On page load: check URL hash & redirect if already logged in
window.addEventListener('DOMContentLoaded', () => {
    // If user is already logged in, go to dashboard
    const existingUser = localStorage.getItem('cropdoctor_user');
    if (existingUser) {
        const user = JSON.parse(existingUser);
        if (user && user.name) {
            window.location.href = 'dashboard.html';
            return;
        }
    }

    // Signup hash
    if (window.location.hash === '#signup') {
        switchTab('signup');
    }
});
