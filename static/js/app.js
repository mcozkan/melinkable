// --- SUPABASE CONFIGURATION ---
// IMPORTANT: Replace these with your actual Supabase Project URL and Anon Key before deploying!
const SUPABASE_URL = 'https://kmfjtqyislinfcatnhjn.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImttZmp0cXlpc2xpbmZjYXRuaGpuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY5NjgwODMsImV4cCI6MjA5MjU0NDA4M30.GNLtdJ4Dspwe_aoTDZMmnQrHEfOS0vCURhzVdWv4h_8';

// Initialize Supabase Client (CDN loaded in index.html)
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

document.addEventListener('DOMContentLoaded', () => {
    // --- AUTHENTICATION & MULTI-USER LOGIC ---
    let currentUser = null;
    
    // Auth Elements
    const loginScreen = document.getElementById('login-screen');
    const mainApp = document.getElementById('main-app');
    const loginForm = document.getElementById('login-form');
    const emailInput = document.getElementById('email');
    const passInput = document.getElementById('password');
    const authError = document.getElementById('auth-error');
    const btnLogin = document.getElementById('btn-login');
    const btnRegister = document.getElementById('btn-register');
    const displayUsername = document.getElementById('display-username');
    const logoutBtn = document.getElementById('logout-btn');

    // Subscribe to Auth State Changes
    supabase.auth.onAuthStateChange((event, session) => {
        if (session && session.user) {
            currentUser = session.user.email;
            loginScreen.classList.remove('active');
            mainApp.style.display = 'flex';
            displayUsername.innerText = currentUser.split('@')[0]; // Show name part
            initializeApp();
        } else {
            currentUser = null;
            loginScreen.classList.add('active');
            mainApp.style.display = 'none';
        }
    });

    const showError = (msg) => {
        authError.style.display = 'block';
        authError.innerText = msg;
    };

    // Form Submit (Login/Register)
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        let email = emailInput.value.trim();
        let password = passInput.value.trim();

        if (!email || !password) return showError("Please enter email and password.");

        btnLogin.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Checking...';
        btnLogin.disabled = true;
        authError.style.display = 'none';

        const { data, error } = await supabase.auth.signInWithPassword({
            email, password
        });

        if (error) {
            showError(error.message);
        }
        
        btnLogin.innerHTML = '<i class="fa-solid fa-arrow-right-to-bracket"></i> Login';
        btnLogin.disabled = false;
    });

    // Register Button Click
    btnRegister.addEventListener('click', async () => {
        let email = emailInput.value.trim();
        let password = passInput.value.trim();

        if (!email || password.length < 6) return showError("Valid email and min 6 char password required.");

        btnRegister.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i>';
        btnRegister.disabled = true;
        authError.style.display = 'none';

        const { data, error } = await supabase.auth.signUp({
            email, password
        });

        if (error) {
            showError(error.message);
        } else {
            if (data.user && data.user.identities && data.user.identities.length === 0) {
                showError("User already exists. Try logging in.");
            } else {
                showError("Registration successful! Check your email to confirm, or login if auto-confirm is enabled.");
            }
        }
        
        btnRegister.innerHTML = '<i class="fa-solid fa-user-plus"></i> Register';
        btnRegister.disabled = false;
    });

    logoutBtn.addEventListener('click', async () => {
        await supabase.auth.signOut();
        window.location.reload();
    });

    // --- THEME MANAGEMENT ---
    const themeToggleBtn = document.getElementById('theme-toggle-btn');
    const currentTheme = localStorage.getItem('linkable_theme') || 'light';

    document.documentElement.setAttribute('data-theme', currentTheme);
    updateThemeIcon(currentTheme);

    function updateThemeIcon(theme) {
        if (theme === 'dark') {
            themeToggleBtn.innerHTML = '<i class="fa-solid fa-sun"></i>';
        } else {
            themeToggleBtn.innerHTML = '<i class="fa-solid fa-moon"></i>';
        }
    }

    themeToggleBtn.addEventListener('click', () => {
        const current = document.documentElement.getAttribute('data-theme');
        const newTheme = current === 'dark' ? 'light' : 'dark';
        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('linkable_theme', newTheme);
        updateThemeIcon(newTheme);
    });

    // --- APP LOGIC (CLOUD DB) ---
    let categories = [];
    let links = [];
    let currentCategoryId = null;
    let currentLinkIdInModal = null;

    // UI Elements
    const categoriesList = document.getElementById('categories-list');
    const categorySelect = document.getElementById('link-category');
    const linksGrid = document.getElementById('links-grid');
    const addLinkForm = document.getElementById('add-link-form');
    const urlInput = document.getElementById('link-url');
    const addCategoryBtn = document.getElementById('add-category-btn');
    const newCategoryForm = document.getElementById('new-category-form');
    const newCategoryInput = document.getElementById('new-category-input');
    const saveCategoryBtn = document.getElementById('save-category-btn');
    const currentCategoryTitle = document.getElementById('current-category-title');

    // Modal Elements
    const modal = document.getElementById('notes-modal');
    const closeModalBtn = document.getElementById('close-modal-btn');
    const saveNotesBtn = document.getElementById('save-notes-btn');
    const modalTitle = document.getElementById('modal-link-title');
    const modalUrl = document.getElementById('modal-link-url');
    const modalTextarea = document.getElementById('modal-notes-textarea');

    // Async Fetch Data from Supabase
    async function initializeApp() {
        if (SUPABASE_URL.includes('YOUR_PROJECT_ID')) {
            alert("SUPABASE API ANAHTARLARINIZI GİRMEDİNİZ!\nLütfen app.js dosyasındaki kilitleri kendi Supabase bilerinizle değiştirin. Yoksa uygulama veritabanına bağlanamaz.");
            return;
        }

        try {
            // Fetch categories for this user
            const { data: catData, error: catError } = await window.supabase
                .from('categories')
                .select('*')
                .eq('username', currentUser);

            if (catError) throw catError;

            // If they have no categories, create 'General' automatically
            if (!catData || catData.length === 0) {
                const { data: newCat, error: insError } = await window.supabase
                    .from('categories')
                    .insert([{ username: currentUser, name: 'General' }])
                    .select();

                if (insError) throw insError;
                categories = newCat || [];
            } else {
                categories = catData;
            }

            // Fetch links for this user
            const { data: linkData, error: linkError } = await window.supabase
                .from('links')
                .select('*')
                .eq('username', currentUser)
                .order('created_at', { ascending: false });

            if (linkError) throw linkError;
            links = linkData || [];

            renderCategories();
            renderLinks();

        } catch (error) {
            console.error("Database initialization error:", error);
            alert("Could not load workspace. Check your Supabase keys/tables.");
        }
    }

    // Add New Link
    addLinkForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        let url = urlInput.value.trim();
        if (!url) return;
        if (!url.startsWith('http://') && !url.startsWith('https://')) {
            url = 'https://' + url;
        }

        const categoryId = categorySelect.value; // It is a UUID string or integer now
        const submitBtn = addLinkForm.querySelector('button');

        submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Saving...';
        submitBtn.disabled = true;

        let meta = { title: url, description: '', image_url: '' };

        try {
            // Scrape via Microlink API
            const res = await fetch(`https://api.microlink.io?url=${encodeURIComponent(url)}`);
            const data = await res.json();

            if (data.status === 'success') {
                meta.title = data.data.title || url;
                meta.description = data.data.description || '';
                meta.image_url = data.data.image ? data.data.image.url : '';
            }
        } catch (error) {
            console.error('Error fetching metadata (Preview):', error);
        }

        try {
            // Save to Supabase Cloud
            const { data: insertedData, error } = await window.supabase
                .from('links')
                .insert([{
                    username: currentUser,
                    url: url,
                    title: meta.title,
                    description: meta.description,
                    image_url: meta.image_url,
                    notes: '',
                    category_id: categoryId
                }])
                .select();

            if (error) throw error;

            if (insertedData && insertedData.length > 0) {
                links.unshift(insertedData[0]); // Add newest to front
            }

            if (currentCategoryId === null || currentCategoryId == categoryId) {
                renderLinks();
            }
            urlInput.value = '';

        } catch (error) {
            console.error('Error saving link to database:', error);
            alert("Failed to save to Cloud.");
        } finally {
            submitBtn.innerHTML = '<i class="fa-solid fa-cloud-arrow-up"></i> Save Link';
            submitBtn.disabled = false;
        }
    });

    // Add New Category
    addCategoryBtn.addEventListener('click', () => {
        newCategoryForm.style.display = newCategoryForm.style.display === 'none' ? 'flex' : 'none';
        if (newCategoryForm.style.display === 'flex') newCategoryInput.focus();
    });

    saveCategoryBtn.addEventListener('click', async () => {
        const name = newCategoryInput.value.trim();
        if (!name) return;

        saveCategoryBtn.innerText = '...';
        try {
            const { data: newCatData, error } = await window.supabase
                .from('categories')
                .insert([{ username: currentUser, name: name }])
                .select();

            if (error) throw error;

            if (newCatData && newCatData.length > 0) {
                categories.push(newCatData[0]);
                renderCategories();
            }
            newCategoryInput.value = '';
            newCategoryForm.style.display = 'none';

        } catch (error) {
            console.error('Error creating category:', error);
            alert('Could not save category to Cloud.');
        } finally {
            saveCategoryBtn.innerText = 'Save';
        }
    });

    // Modal / Notes Actions
    closeModalBtn.addEventListener('click', () => {
        modal.classList.remove('active');
    });

    saveNotesBtn.addEventListener('click', async () => {
        const notes = modalTextarea.value;
        const originalText = saveNotesBtn.innerText;
        saveNotesBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i>';
        saveNotesBtn.disabled = true;

        try {
            // Update the record in Supabase
            const { error } = await window.supabase
                .from('links')
                .update({ notes: notes })
                .eq('id', currentLinkIdInModal);

            if (error) throw error;

            // Update local memory
            const index = links.findIndex(l => l.id == currentLinkIdInModal);
            if (index !== -1) {
                links[index].notes = notes;
                renderLinks();
            }
            modal.classList.remove('active');

        } catch (error) {
            console.error("Error updating notes:", error);
            alert("Could not update notes in Cloud.");
        } finally {
            saveNotesBtn.innerText = originalText;
            saveNotesBtn.disabled = false;
        }
    });

    modal.addEventListener('click', (e) => {
        if (e.target === modal) modal.classList.remove('active');
    });

    // Fetch and Render logic
    function fetchLinks(categoryId = null) {
        currentCategoryId = categoryId;
        if (currentCategoryId) {
            const cat = categories.find(c => c.id == currentCategoryId);
            currentCategoryTitle.innerText = cat ? cat.name : 'Links';
        } else {
            currentCategoryTitle.innerText = 'All Links';
        }
        renderLinks();
    }

    function renderCategories() {
        if (!categoriesList) return;
        categoriesList.innerHTML = `<li class="category-item ${currentCategoryId === null ? 'active' : ''}" data-id="all">All Links</li>`;
        categorySelect.innerHTML = '';

        categories.forEach(cat => {
            const li = document.createElement('li');
            // use loose equality string comparison just in case uuid mismatch type
            li.className = `category-item ${currentCategoryId == cat.id ? 'active' : ''}`;
            li.dataset.id = cat.id;
            li.innerText = cat.name;
            categoriesList.appendChild(li);

            const opt = document.createElement('option');
            opt.value = cat.id;
            opt.innerText = cat.name;
            categorySelect.appendChild(opt);
        });

        document.querySelectorAll('.category-item').forEach(el => {
            el.addEventListener('click', (e) => {
                const id = e.target.dataset.id;
                document.querySelectorAll('.category-item').forEach(i => i.classList.remove('active'));
                e.target.classList.add('active');
                fetchLinks(id === 'all' ? null : id);
            });
        });
    }

    function renderLinks() {
        if (!linksGrid) return;
        linksGrid.innerHTML = '';

        let filteredLinks = links;
        if (currentCategoryId !== null && currentCategoryId !== 'all') {
            filteredLinks = links.filter(l => l.category_id == currentCategoryId);
        }

        if (filteredLinks.length === 0) {
            linksGrid.innerHTML = `
                <div style="grid-column: 1/-1; text-align: center; color: var(--text-secondary); padding: 40px;">
                    <i class="fa-solid fa-link-slash" style="font-size: 3rem; margin-bottom: 16px; opacity: 0.5;"></i>
                    <p>No links found in this category.</p>
                </div>
            `;
            return;
        }

        filteredLinks.forEach(link => {
            const card = document.createElement('div');
            card.className = 'link-card';

            const hasNotes = link.notes && link.notes.trim().length > 0;
            let linkId = link.id;

            let bgImage = link.image_url ? `url('${link.image_url.replace(/'/g, "\\'")}')` : '';
            let imageElement = bgImage ? `<div class="card-image" style="background-image: ${bgImage}"></div>` : `<div class="card-image"><div class="card-image-placeholder"><i class="fa-regular fa-image"></i></div></div>`;

            card.innerHTML = `
                ${imageElement}
                <div class="card-content">
                    <a href="${link.url}" target="_blank" class="card-title" title="${link.title}">${link.title || link.url}</a>
                    <p class="card-desc">${link.description || 'No description available.'}</p>
                    <div class="card-footer">
                        <span class="card-url">${new URL(link.url).hostname || link.url}</span>
                        <div class="card-actions">
                            <button class="action-btn notes-btn ${hasNotes ? 'has-notes' : ''}" data-id="${linkId}" title="${hasNotes ? 'Edit Notes' : 'Add Note'}">
                                <i class="fa-${hasNotes ? 'solid' : 'regular'} fa-comment-dots"></i>
                            </button>
                            <button class="action-btn delete-btn" data-id="${linkId}" title="Delete Link">
                                <i class="fa-solid fa-trash-can"></i>
                            </button>
                        </div>
                    </div>
                </div>
            `;
            linksGrid.appendChild(card);
        });

        document.querySelectorAll('.notes-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = e.currentTarget.dataset.id;
                openModal(id);
            });
        });

        document.querySelectorAll('.delete-btn').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const id = e.currentTarget.dataset.id;
                if (confirm("Are you sure you want to delete this link?")) {

                    try {
                        const { error } = await window.supabase
                            .from('links')
                            .delete()
                            .eq('id', id);

                        if (error) throw error;

                        links = links.filter(l => l.id != id);
                        renderLinks();
                    } catch (error) {
                        console.error("Delete error:", error);
                        alert("Could not delete from Cloud.");
                    }
                }
            });
        });
    }

    function openModal(linkId) {
        currentLinkIdInModal = linkId;
        const link = links.find(l => l.id == linkId);
        if (!link) return;

        modalTitle.innerText = link.title || link.url;
        modalUrl.innerText = link.url;
        modalUrl.href = link.url;
        modalTextarea.value = link.notes || '';

        modal.classList.add('active');
        modalTextarea.focus();
    }
});
