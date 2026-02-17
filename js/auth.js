// Authentication module — sign-in, register, sign-out, profile management

let currentUser = null;

// ── Test hook ──────────────────────────────────────────────────────
function initAuth() {
    if (window.__TEST_AUTH_USER) {
        // Test mode: skip all Firebase auth, just render cards with localStorage data
        currentUser = window.__TEST_AUTH_USER;
        showUserHeader(currentUser.displayName || 'Test');
        // Render all cards from localStorage (same as old sync code path)
        Object.keys(cardSets).forEach(setKey => renderCards(setKey));
        updateSetButtonProgress();
        Object.keys(customCardSets).forEach(setKey => renderCustomCards(setKey));
        updateCustomSetButtonProgress();
        return;
    }

    if (window.__TEST_FORCE_AUTH_MODAL) {
        // Test mode: show auth modal directly without Firebase
        showAuthModal();
        return;
    }

    // Ensure Firebase app is initialized before auth
    ensureFirebaseApp();

    const auth = firebase.auth();

    // Enable Google provider
    window._googleProvider = new firebase.auth.GoogleAuthProvider();

    auth.onAuthStateChanged(async (user) => {
        if (user) {
            currentUser = user;
            await handleAuthenticatedUser(user);
        } else {
            currentUser = null;
            showAuthModal();
        }
    });
}

// ── Authenticated user flow ────────────────────────────────────────
async function handleAuthenticatedUser(user) {
    const uid = user.uid;
    const displayName = user.displayName || user.email || 'Trainer';

    // Ensure profile exists
    await ensureUserProfile(user);

    // Update header UI
    showUserHeader(displayName);

    // Check for pending invites
    if (user.email) {
        checkPendingInvites(user);
    }

    // Load active collection
    const userRef = firebase.database().ref('users/' + uid);
    const snap = await userRef.once('value');
    const userData = snap.val();

    let activeCollectionId = userData && userData.activeCollectionId;

    if (!activeCollectionId) {
        // New user or missing — check migration first
        const migrated = await attemptMigration(user);
        if (migrated) {
            // Re-read after migration
            const refreshed = await userRef.once('value');
            activeCollectionId = refreshed.val().activeCollectionId;
        } else {
            // Create default solo collection
            activeCollectionId = await createCollection(uid, displayName + "'s Collection");
            await userRef.update({ activeCollectionId: activeCollectionId });
        }
    }

    // Initialize Firebase sync on the active collection
    initializeFirebase(activeCollectionId);
    hideAuthModal();
}

// ── Profile management ─────────────────────────────────────────────
async function ensureUserProfile(user) {
    const profileRef = firebase.database().ref('users/' + user.uid + '/profile');
    const snap = await profileRef.once('value');
    if (!snap.exists()) {
        await profileRef.set({
            email: user.email || null,
            displayName: user.displayName || user.email || 'Trainer',
            createdAt: firebase.database.ServerValue.TIMESTAMP
        });
    }
}

// ── Header UI ──────────────────────────────────────────────────────
function showUserHeader(displayName) {
    const bar = document.getElementById('userBar');
    if (!bar) return;
    bar.style.display = 'flex';
    document.getElementById('userDisplayName').textContent = displayName;
    document.getElementById('activeCollectionName').textContent = '';
}

function updateCollectionNameHeader(name) {
    const el = document.getElementById('activeCollectionName');
    if (el) el.textContent = name;
}

// ── Auth modal ─────────────────────────────────────────────────────
function showAuthModal() {
    let modal = document.getElementById('authModal');
    if (modal) { modal.style.display = 'flex'; return; }

    modal = document.createElement('div');
    modal.id = 'authModal';
    modal.className = 'auth-modal';
    modal.innerHTML = buildLoginView();
    document.body.appendChild(modal);

    attachAuthListeners();
}

function hideAuthModal() {
    const modal = document.getElementById('authModal');
    if (modal) modal.style.display = 'none';
}

function buildLoginView() {
    return `
    <div class="auth-modal-content">
        <div class="auth-modal-title">Sign In</div>
        <div class="auth-modal-text">Sign in to sync your collection across devices.</div>
        <form id="authForm" autocomplete="on">
            <input type="email" class="auth-input" id="authEmail" placeholder="Email" required autocomplete="email">
            <input type="password" class="auth-input" id="authPassword" placeholder="Password" required autocomplete="current-password">
            <div class="auth-error" id="authError"></div>
            <div class="auth-buttons">
                <button type="submit" class="auth-btn primary" id="authSubmitBtn">Sign In</button>
            </div>
        </form>
        <button class="auth-btn google" id="authGoogleBtn">
            <svg width="18" height="18" viewBox="0 0 48 48"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/><path fill="#FBBC05" d="M10.53 28.59A14.5 14.5 0 0 1 9.5 24c0-1.59.28-3.14.76-4.59l-7.98-6.19A23.998 23.998 0 0 0 0 24c0 3.77.9 7.35 2.56 10.53l7.97-5.94z"/><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 5.94C6.51 42.62 14.62 48 24 48z"/></svg>
            Sign in with Google
        </button>
        <div class="auth-links">
            <a href="#" id="authShowRegister">Create account</a>
            <a href="#" id="authShowForgot">Forgot password?</a>
        </div>
    </div>`;
}

function buildRegisterView() {
    return `
    <div class="auth-modal-content">
        <div class="auth-modal-title">Create Account</div>
        <form id="authForm" autocomplete="on">
            <input type="text" class="auth-input" id="authName" placeholder="Display name" required autocomplete="name">
            <input type="email" class="auth-input" id="authEmail" placeholder="Email" required autocomplete="email">
            <input type="password" class="auth-input" id="authPassword" placeholder="Password (6+ characters)" required minlength="6" autocomplete="new-password">
            <div class="auth-error" id="authError"></div>
            <div class="auth-buttons">
                <button type="submit" class="auth-btn primary" id="authSubmitBtn">Create Account</button>
            </div>
        </form>
        <div class="auth-links">
            <a href="#" id="authShowLogin">Already have an account? Sign in</a>
        </div>
    </div>`;
}

function buildForgotView() {
    return `
    <div class="auth-modal-content">
        <div class="auth-modal-title">Reset Password</div>
        <div class="auth-modal-text">Enter your email and we'll send a reset link.</div>
        <form id="authForm">
            <input type="email" class="auth-input" id="authEmail" placeholder="Email" required autocomplete="email">
            <div class="auth-error" id="authError"></div>
            <div class="auth-buttons">
                <button type="submit" class="auth-btn primary" id="authSubmitBtn">Send Reset Link</button>
            </div>
        </form>
        <div class="auth-links">
            <a href="#" id="authShowLogin">Back to sign in</a>
        </div>
    </div>`;
}

// ── View switching ─────────────────────────────────────────────────
let currentAuthView = 'login';

function switchAuthView(view) {
    currentAuthView = view;
    const modal = document.getElementById('authModal');
    if (!modal) return;
    if (view === 'register') {
        modal.innerHTML = buildRegisterView();
    } else if (view === 'forgot') {
        modal.innerHTML = buildForgotView();
    } else {
        modal.innerHTML = buildLoginView();
    }
    attachAuthListeners();
}

function attachAuthListeners() {
    const form = document.getElementById('authForm');
    if (form) {
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            handleAuthSubmit();
        });
    }

    const googleBtn = document.getElementById('authGoogleBtn');
    if (googleBtn) googleBtn.addEventListener('click', handleGoogleSignIn);

    const showRegister = document.getElementById('authShowRegister');
    if (showRegister) showRegister.addEventListener('click', (e) => { e.preventDefault(); switchAuthView('register'); });

    const showLogin = document.getElementById('authShowLogin');
    if (showLogin) showLogin.addEventListener('click', (e) => { e.preventDefault(); switchAuthView('login'); });

    const showForgot = document.getElementById('authShowForgot');
    if (showForgot) showForgot.addEventListener('click', (e) => { e.preventDefault(); switchAuthView('forgot'); });
}

// ── Auth actions ───────────────────────────────────────────────────
async function handleAuthSubmit() {
    const email = document.getElementById('authEmail').value.trim();
    const password = document.getElementById('authPassword') ? document.getElementById('authPassword').value : '';
    const errorEl = document.getElementById('authError');
    const submitBtn = document.getElementById('authSubmitBtn');
    errorEl.textContent = '';
    submitBtn.disabled = true;

    try {
        if (currentAuthView === 'login') {
            await firebase.auth().signInWithEmailAndPassword(email, password);
        } else if (currentAuthView === 'register') {
            const name = document.getElementById('authName').value.trim();
            if (!name) { errorEl.textContent = 'Please enter a display name.'; submitBtn.disabled = false; return; }
            const cred = await firebase.auth().createUserWithEmailAndPassword(email, password);
            await cred.user.updateProfile({ displayName: name });
        } else if (currentAuthView === 'forgot') {
            await firebase.auth().sendPasswordResetEmail(email);
            errorEl.style.color = '#00ff88';
            errorEl.textContent = 'Reset link sent! Check your email.';
            submitBtn.disabled = false;
            return;
        }
    } catch (err) {
        errorEl.style.color = '';
        errorEl.textContent = friendlyAuthError(err.code);
        submitBtn.disabled = false;
    }
}

async function handleGoogleSignIn() {
    const errorEl = document.getElementById('authError');
    try {
        await firebase.auth().signInWithPopup(window._googleProvider);
    } catch (err) {
        if (errorEl) {
            errorEl.style.color = '';
            errorEl.textContent = friendlyAuthError(err.code);
        }
    }
}

window.signOut = async function() {
    if (typeof detachFirebaseListener === 'function') {
        detachFirebaseListener();
    }
    const bar = document.getElementById('userBar');
    if (bar) bar.style.display = 'none';
    currentUser = null;
    await firebase.auth().signOut();
};

function friendlyAuthError(code) {
    const map = {
        'auth/invalid-email': 'Invalid email address.',
        'auth/user-disabled': 'This account has been disabled.',
        'auth/user-not-found': 'No account found with this email.',
        'auth/wrong-password': 'Incorrect password.',
        'auth/email-already-in-use': 'An account with this email already exists.',
        'auth/weak-password': 'Password must be at least 6 characters.',
        'auth/too-many-requests': 'Too many attempts. Please try again later.',
        'auth/popup-closed-by-user': 'Sign-in popup was closed.',
        'auth/invalid-credential': 'Invalid email or password.'
    };
    return map[code] || 'An error occurred. Please try again.';
}

// ── Migration ──────────────────────────────────────────────────────
async function attemptMigration(user) {
    // Check if Blair2024 legacy data exists and is unclaimed
    const claimedRef = firebase.database().ref('migrationClaimed/' + MIGRATION_SOURCE);
    const claimedSnap = await claimedRef.once('value');
    if (claimedSnap.exists()) return false;

    const legacyRef = firebase.database().ref('collections/' + MIGRATION_SOURCE);
    const legacySnap = await legacyRef.once('value');
    const legacyData = legacySnap.val();
    if (!legacyData) return false;

    // Show migration prompt
    const shouldImport = await showMigrationPrompt();
    if (!shouldImport) return false;

    // Create new collection with imported data
    const collectionId = await createCollection(user.uid, 'Family Collection');

    // Copy legacy data to new collection's data node
    const dataRef = firebase.database().ref('collections/' + collectionId + '/data');
    await dataRef.set(legacyData);

    // Mark migration as claimed
    await claimedRef.set({
        claimedBy: user.uid,
        claimedAt: firebase.database.ServerValue.TIMESTAMP
    });

    // Set as active
    await firebase.database().ref('users/' + user.uid).update({
        activeCollectionId: collectionId
    });

    // Record collection in user's list
    await firebase.database().ref('users/' + user.uid + '/collections/' + collectionId).set({
        role: 'owner',
        name: 'Family Collection',
        joinedAt: firebase.database.ServerValue.TIMESTAMP
    });

    return true;
}

function showMigrationPrompt() {
    return new Promise((resolve) => {
        const overlay = document.createElement('div');
        overlay.className = 'auth-modal';
        overlay.id = 'migrationPrompt';
        overlay.innerHTML = `
        <div class="auth-modal-content">
            <div class="auth-modal-title">Import Existing Data?</div>
            <div class="auth-modal-text">
                We found existing collection data from the old sync system. Would you like to import it into your new account?
            </div>
            <div class="auth-buttons" style="gap:10px;">
                <button class="auth-btn" id="migrationSkip">Start Fresh</button>
                <button class="auth-btn primary" id="migrationImport">Import Data</button>
            </div>
        </div>`;
        document.body.appendChild(overlay);

        document.getElementById('migrationImport').addEventListener('click', () => {
            overlay.remove();
            resolve(true);
        });
        document.getElementById('migrationSkip').addEventListener('click', () => {
            overlay.remove();
            resolve(false);
        });
    });
}

// ── Invite checking ────────────────────────────────────────────────
async function checkPendingInvites(user) {
    const emailEncoded = encodeEmail(user.email);
    const invitesRef = firebase.database().ref('invites/' + emailEncoded);
    const snap = await invitesRef.once('value');
    const invites = snap.val();
    if (!invites) return;

    for (const [inviteId, invite] of Object.entries(invites)) {
        showInviteBanner(user, inviteId, invite, emailEncoded);
    }
}

function showInviteBanner(user, inviteId, invite, emailEncoded) {
    const banner = document.createElement('div');
    banner.className = 'invite-banner';
    banner.innerHTML = `
        <span class="invite-banner-text">
            <strong>${invite.inviterName}</strong> invited you to join <strong>${invite.collectionName}</strong>
        </span>
        <div class="invite-banner-actions">
            <button class="invite-btn accept" data-invite-id="${inviteId}">Accept</button>
            <button class="invite-btn decline" data-invite-id="${inviteId}">Decline</button>
        </div>
    `;
    document.body.prepend(banner);
    requestAnimationFrame(() => banner.classList.add('visible'));

    banner.querySelector('.invite-btn.accept').addEventListener('click', async () => {
        await joinCollectionFromInvite(user, invite.collectionId, invite.collectionName);
        await firebase.database().ref('invites/' + emailEncoded + '/' + inviteId).remove();
        banner.classList.remove('visible');
        setTimeout(() => banner.remove(), 300);
    });

    banner.querySelector('.invite-btn.decline').addEventListener('click', async () => {
        await firebase.database().ref('invites/' + emailEncoded + '/' + inviteId).remove();
        banner.classList.remove('visible');
        setTimeout(() => banner.remove(), 300);
    });
}

async function joinCollectionFromInvite(user, collectionId, collectionName) {
    const uid = user.uid;
    const displayName = user.displayName || user.email || 'Trainer';

    // Add user as member
    await firebase.database().ref('collections/' + collectionId + '/members/' + uid).set({
        role: 'member',
        displayName: displayName,
        joinedAt: firebase.database.ServerValue.TIMESTAMP
    });

    // Add to user's collection list
    await firebase.database().ref('users/' + uid + '/collections/' + collectionId).set({
        role: 'member',
        name: collectionName,
        joinedAt: firebase.database.ServerValue.TIMESTAMP
    });
}

// ── Helpers ────────────────────────────────────────────────────────
function encodeEmail(email) {
    return email.replace(/\./g, ',');
}
