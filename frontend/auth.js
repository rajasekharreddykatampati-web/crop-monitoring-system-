// ===== CropDoctor Auth Module =====

const API_BASE = 'https://crop-monitoring-system-3.onrender.com';

// ===== Tab / Role Switching =====

function switchTab(tab) {
    document.getElementById('login-section').style.display = tab === 'login' ? 'block' : 'none';
    document.getElementById('signup-section').style.display = tab === 'signup' ? 'block' : 'none';
    document.getElementById('tab-login').classList.toggle('active', tab === 'login');
    document.getElementById('tab-signup').classList.toggle('active', tab === 'signup');
    // clear messages
    ['login-message', 'admin-message', 'signup-message'].forEach(id => {
        const el = document.getElementById(id);
        if (el) { el.style.display = 'none'; el.textContent = ''; }
    });
}

function switchRole(role) {
    document.getElementById('farmer-login').style.display = role === 'farmer' ? 'block' : 'none';
    document.getElementById('admin-login').style.display = role === 'admin' ? 'block' : 'none';
    document.getElementById('role-farmer').classList.toggle('active', role === 'farmer');
    document.getElementById('role-admin').classList.toggle('active', role === 'admin');
}

// ===== Farmer Login =====
async function handleFarmerLogin(event) {
    event.preventDefault();
    const btn = document.getElementById('login-btn');
    const msgEl = document.getElementById('login-message');
    const email = document.getElementById('login-email').value.trim();
    const password = document.getElementById('login-password').value;

    if (!email || !password) { showMsg(msgEl, 'Please fill in all fields.', 'error'); return; }

    btn.innerHTML = '<span class="spinner-inline"></span>Logging in...';
    btn.disabled = true;

    try {
        const res = await fetch(`${API_BASE}/api/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email_phone: email, password })
        });
        const data = await res.json();

        if (res.ok) {
            const user = {
                name: data.user.name,
                initials: data.user.initials || getInitials(data.user.name),
                email_phone: data.user.email_phone,
                address: data.user.address || '',
                age: data.user.age || '',
                role: data.user.role || 'farmer',
                loggedInAt: new Date().toISOString()
            };
            localStorage.setItem('cropdoctor_user', JSON.stringify(user));
            localStorage.setItem('cropdoctor_token', data.token || '');
            cacheUser({ ...user, password }); // for offline fallback
            showMsg(msgEl, '✅ Login successful! Redirecting...', 'success');
            btn.innerHTML = '✅ Success!';
            setTimeout(() => { window.location.href = 'dashboard.html'; }, 1000);
        } else {
            showMsg(msgEl, data.detail || 'Invalid credentials.', 'error');
            btn.innerHTML = 'Login as Farmer';
            btn.disabled = false;
        }
    } catch {
        // Offline fallback
        const users = JSON.parse(localStorage.getItem('cropdoctor_users') || '[]');
        const user = users.find(u => u.email_phone === email && u.password === password);
        if (user) {
            localStorage.setItem('cropdoctor_user', JSON.stringify({ ...user, loggedInAt: new Date().toISOString() }));
            showMsg(msgEl, '✅ Logged in (offline mode).', 'success');
            setTimeout(() => { window.location.href = 'dashboard.html'; }, 1000);
        } else {
            showMsg(msgEl, 'Cannot reach server. Check your credentials and try again.', 'error');
            btn.innerHTML = 'Login as Farmer';
            btn.disabled = false;
        }
    }
}

// ===== Admin Login (email + password via backend) =====
async function handleAdminLogin(event) {
    event.preventDefault();
    const btn = document.getElementById('admin-btn');
    const msgEl = document.getElementById('admin-message');
    const email = document.getElementById('admin-email').value.trim();
    const password = document.getElementById('admin-password').value;

    if (!email || !password) { showMsg(msgEl, 'Please fill in all fields.', 'error'); return; }

    btn.innerHTML = '<span class="spinner-inline"></span>Verifying...';
    btn.disabled = true;

    try {
        const res = await fetch(`${API_BASE}/api/auth/admin/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });
        const data = await res.json();

        if (res.ok) {
            const user = {
                name: data.user.name,
                initials: data.user.initials || getInitials(data.user.name),
                email_phone: data.user.email_phone,
                role: 'admin',
                loggedInAt: new Date().toISOString()
            };
            localStorage.setItem('cropdoctor_user', JSON.stringify(user));
            localStorage.setItem('cropdoctor_token', data.token || '');
            showMsg(msgEl, '✅ Admin login successful! Redirecting...', 'success');
            btn.innerHTML = '✅ Success!';
            setTimeout(() => { window.location.href = 'dashboard.html'; }, 1000);
        } else {
            showMsg(msgEl, data.detail || 'Invalid admin credentials.', 'error');
            btn.innerHTML = 'Login as Admin';
            btn.disabled = false;
        }
    } catch {
        showMsg(msgEl, 'Cannot reach server. Please check your connection.', 'error');
        btn.innerHTML = 'Login as Admin';
        btn.disabled = false;
    }
}

// ===== Admin Google Sign-In =====
async function handleGoogleLogin() {
    const msgEl = document.getElementById('admin-message');

    if (typeof firebase === 'undefined') {
        showMsg(msgEl, 'Firebase not loaded yet. Please wait or refresh.', 'error');
        return;
    }

    const firebaseConfig = {
        apiKey: "AIzaSyBWV3Da7U1wfBtnnGkIfCMo-aA1ej5seuw",
        authDomain: "crop-monitor-684d8.firebaseapp.com",
        projectId: "crop-monitor-684d8",
        storageBucket: "crop-monitor-684d8.firebasestorage.app",
        messagingSenderId: "1027449652032",
        appId: "1:1027449652032:web:1c35cabe9e96b4ef96f0a5"
    };

    if (!firebase.apps.length) firebase.initializeApp(firebaseConfig);

    try {
        const provider = new firebase.auth.GoogleAuthProvider();
        const result = await firebase.auth().signInWithPopup(provider);
        const fbUser = result.user;

        const user = {
            name: fbUser.displayName,
            email_phone: fbUser.email,
            photo: fbUser.photoURL,
            initials: getInitials(fbUser.displayName),
            role: 'admin',
            loggedInAt: new Date().toISOString()
        };

        localStorage.setItem('cropdoctor_user', JSON.stringify(user));
        localStorage.setItem('cropdoctor_token', fbUser.uid);

        showMsg(msgEl, `✅ Welcome ${fbUser.displayName}! Redirecting...`, 'success');
        setTimeout(() => { window.location.href = 'dashboard.html'; }, 1200);

    } catch (error) {
        showMsg(msgEl, 'Google Sign-In failed: ' + error.message, 'error');
    }
}

// ===== Farmer Signup =====
async function handleSignup(event) {
    event.preventDefault();
    const btn = document.getElementById('signup-btn');
    const msgEl = document.getElementById('signup-message');

    const name = document.getElementById('farmer-name').value.trim();
    const address = document.getElementById('farmer-address').value.trim();
    const age = document.getElementById('farmer-age').value;
    const contact = document.getElementById('farmer-contact').value.trim();
    const password = document.getElementById('farmer-password').value;
    const confirm = document.getElementById('farmer-confirm-password').value;

    if (!name || !address || !age || !contact || !password || !confirm) {
        showMsg(msgEl, 'Please fill in all required fields.', 'error'); return;
    }
    if (password !== confirm) { showMsg(msgEl, 'Passwords do not match.', 'error'); return; }
    if (password.length < 6) { showMsg(msgEl, 'Password must be at least 6 characters.', 'error'); return; }
    if (parseInt(age) < 18 || parseInt(age) > 100) {
        showMsg(msgEl, 'Age must be between 18 and 100.', 'error'); return;
    }

    btn.innerHTML = '<span class="spinner-inline"></span>Creating Account...';
    btn.disabled = true;

    const payload = { name, address, age: parseInt(age), email_phone: contact, password };

    try {
        const res = await fetch(`${API_BASE}/api/auth/signup`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        const data = await res.json();

        if (res.ok) {
            cacheUser({ ...payload, initials: getInitials(name), role: 'farmer' });
            showMsg(msgEl, '✅ Account created! Please login.', 'success');
            btn.innerHTML = '✅ Account Created!';
            setTimeout(() => {
                switchTab('login');
                document.getElementById('login-email').value = contact;
                showMsg(document.getElementById('login-message'), '🎉 Account ready — enter your password to login.', 'success');
                btn.innerHTML = 'Create Account';
                btn.disabled = false;
            }, 1500);
        } else {
            showMsg(msgEl, data.detail || 'Signup failed. Try again.', 'error');
            btn.innerHTML = 'Create Account';
            btn.disabled = false;
        }
    } catch {
        // Offline: store locally
        const users = JSON.parse(localStorage.getItem('cropdoctor_users') || '[]');
        if (users.some(u => u.email_phone === contact)) {
            showMsg(msgEl, 'An account with this email/phone already exists.', 'error');
            btn.innerHTML = 'Create Account';
            btn.disabled = false;
            return;
        }
        cacheUser({ ...payload, initials: getInitials(name), role: 'farmer' });
        showMsg(msgEl, '✅ Account created (offline mode). Please login.', 'success');
        btn.innerHTML = '✅ Done!';
        setTimeout(() => { switchTab('login'); btn.innerHTML = 'Create Account'; btn.disabled = false; }, 1500);
    }
}

// ===== Helpers =====
function cacheUser(userData) {
    const users = JSON.parse(localStorage.getItem('cropdoctor_users') || '[]');
    const idx = users.findIndex(u => u.email_phone === userData.email_phone);
    if (idx >= 0) users[idx] = userData; else users.push(userData);
    localStorage.setItem('cropdoctor_users', JSON.stringify(users));
}

function showMsg(el, text, type) {
    if (!el) return;
    el.className = 'msg-box ' + type;
    el.textContent = text;
    el.style.display = 'block';
    if (type === 'success') setTimeout(() => { el.style.display = 'none'; }, 8000);
}

function getInitials(name) {
    if (!name) return 'CD';
    const parts = name.trim().split(' ').filter(p => p.length > 0);
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return name.substring(0, 2).toUpperCase();
}

// ===== On Page Load =====
window.addEventListener('DOMContentLoaded', () => {
    const existing = localStorage.getItem('cropdoctor_user');
    if (existing) {
        try {
            const u = JSON.parse(existing);
            if (u && u.name) { window.location.href = 'dashboard.html'; return; }
        } catch { }
    }
    if (window.location.hash === '#signup') switchTab('signup');
    if (window.location.hash === '#admin') { switchTab('login'); switchRole('admin'); }
});
