  /* =========================================
       LOGIC CORE
       ========================================= */
    
    // Initial mock data with a predefined host email for testing
    const MOCK_DATA = [
        { id: 'c1', title: 'Midnight Velocity', desc: '5K night run through the neon district.', date: '2025-10-15', time: '23:00', loc: 'Sector 7, NY', price: 'Free', attendees: 42, image: 'https://images.unsplash.com/photo-1542204165-65bf26472b9b?q=80&w=1974', host: 'system@fida.net', attendeesList: [{name:'System Admin', email:'admin@fida.net'}] },
        { id: 'c2', title: 'Brutalist Frame', desc: 'Architecture photography walk.', date: '2025-10-18', time: '18:30', loc: 'London, UK', price: '$25', attendees: 8, image: 'https://images.unsplash.com/photo-1486718448742-163732cd1544?q=80&w=1974', host: 'guest@fida.net', attendeesList: [{name:'Alice', email:'alice@test.com'}, {name:'Bob', email:'bob@test.com'}] },
        { id: 'c3', title: 'Cyber Zen', desc: 'Rooftop yoga with synthwave ambience.', date: '2025-10-20', time: '19:00', loc: 'Shibuya, JP', price: '$15', attendees: 15, image: 'https://images.unsplash.com/photo-1599447421405-0e5a106d8803?q=80&w=1935', host: 'system@fida.net', attendeesList: [] }
    ];

    let clubs = JSON.parse(localStorage.getItem('fida_clubs')) || MOCK_DATA;
    // Normalize data structure
    clubs = clubs.map(c => ({
        ...c, 
        host: c.host || 'system@fida.net',
        attendeesList: c.attendeesList || []
    }));

    let user = JSON.parse(localStorage.getItem('fida_user'));
    let joined = JSON.parse(localStorage.getItem('fida_joined')) || [];
    let activeId = null;
    let isRegister = true; 
    let currentSearch = '';
    let html5QrcodeScanner = null;

    // Init
    window.addEventListener('load', () => {
        setTimeout(() => document.getElementById('splashScreen').style.opacity = '0', 1200);
        setTimeout(() => document.getElementById('splashScreen').style.visibility = 'hidden', 1800);
        
        checkAuth();
        renderFeed();
        
        document.querySelectorAll('.overlay').forEach(o => {
            o.addEventListener('click', e => { if(e.target === o) o.classList.remove('visible'); });
        });

        // Initialize Create Handle Logic
        initCreateHandle();
    });
    
    function initCreateHandle() {
        const cHandle = document.getElementById('createHandle');
        const cSheet = document.querySelector('#createModal .sheet');
        
        if(cHandle && cSheet) {
            cHandle.addEventListener('click', () => {
                if (cSheet.classList.contains('maximized')) {
                    // From Full -> Small
                    cSheet.classList.remove('maximized');
                    cSheet.classList.remove('expanded');
                } else if (cSheet.classList.contains('expanded')) {
                    // From 75% -> Full
                    cSheet.classList.add('maximized');
                } else {
                    // From Small -> 75%
                    cSheet.classList.add('expanded');
                }
            });
            
            let startY;
            cHandle.addEventListener('touchstart', e => startY = e.touches[0].clientY, {passive:true});
            cHandle.addEventListener('touchend', e => {
                const diff = startY - e.changedTouches[0].clientY;
                if(diff > 50) { // Swipe Up
                    if(!cSheet.classList.contains('expanded')) {
                        cSheet.classList.add('expanded');
                    } else {
                        cSheet.classList.add('maximized');
                    }
                } 
                else if(diff < -50) { // Swipe Down
                    if(cSheet.classList.contains('maximized')) {
                         cSheet.classList.remove('maximized');
                    } else if(cSheet.classList.contains('expanded')) {
                         cSheet.classList.remove('expanded');
                    } else {
                         closeCreateModal();
                    }
                }
            }, {passive:true});
        }
    }

    // Auth
    function checkAuth() {
        if(!user) document.getElementById('authScreen').classList.remove('hide');
        else {
            document.getElementById('authScreen').classList.add('hide');
            updateUserUI();
            renderFeed();
        }
    }
    
    function toggleAuthMode() {
        isRegister = !isRegister;
        const nameField = document.getElementById('nameContainer');
        const btn = document.getElementById('authBtn');
        const title = document.getElementById('authSubtitle');
        const toggleText = document.getElementById('authToggleText');
        const toggleBtn = document.querySelector('.auth-toggle button');
        
        if (isRegister) {
            nameField.style.display = 'block';
            document.getElementById('authName').setAttribute('required', 'true');
            btn.innerText = 'JOIN NOW';
            title.innerText = 'Enter the grid.';
            toggleText.innerText = 'Already in the system?';
            toggleBtn.innerText = 'Login';
        } else {
            nameField.style.display = 'none';
            document.getElementById('authName').removeAttribute('required');
            btn.innerText = 'ACCESS SYSTEM';
            title.innerText = 'Welcome back.';
            toggleText.innerText = 'New user?';
            toggleBtn.innerText = 'Create ID';
        }
    }

    function handleAuth(e) {
        e.preventDefault();
        const email = document.getElementById('authEmail').value;
        const pass = document.getElementById('authPass').value;
        let name = "Agent " + Math.floor(Math.random()*1000);

        if (isRegister) {
            name = document.getElementById('authName').value;
            user = { name, email, avatar: null };
            localStorage.setItem('fida_user', JSON.stringify(user));
            toast('Welcome, ' + name);
        } else {
            const existing = JSON.parse(localStorage.getItem('fida_user'));
            if(existing && existing.email === email) {
                user = existing;
                toast('Welcome back, ' + user.name);
            } else {
                user = { name: email.split('@')[0], email, avatar: null };
                localStorage.setItem('fida_user', JSON.stringify(user));
                toast('Access Granted');
            }
        }
        checkAuth();
    }

    function logout() {
        user = null; localStorage.removeItem('fida_user');
        // Reset View
        document.querySelectorAll('.view-section').forEach(v => v.classList.remove('active'));
        document.getElementById('viewHome').classList.add('active');
        checkAuth();
    }
    
    function updateUserUI() {
        if(!user) return;
        document.getElementById('headerName').innerText = user.name.split(' ')[0].toUpperCase();
        document.getElementById('headerAvatar').innerHTML = user.avatar ? `<img src="${user.avatar}">` : user.name.charAt(0);
        
        // Settings Page UI Updates
        document.getElementById('settingsName').innerText = user.name;
        document.getElementById('settingsEmail').innerText = user.email;
        document.getElementById('settingsAvatar').innerHTML = user.avatar ? `<img src="${user.avatar}" style="width:100%;height:100%;object-fit:cover;">` : user.name.charAt(0);
    }
    
    function updateAvatar(input) {
        if(input.files[0]) {
            const r = new FileReader();
            r.onload = e => {
                user.avatar = e.target.result;
                localStorage.setItem('fida_user', JSON.stringify(user));
                updateUserUI();
            };
            r.readAsDataURL(input.files[0]);
        }
    }

    // SEARCH
    function handleSearch(val) {
        currentSearch = val.toLowerCase();
        renderFeed();
    }

    // Navigation Switcher
    function switchView(viewName, el) {
        // Update dock icons
        document.querySelectorAll('.dock-item').forEach(i => i.classList.remove('active'));
        if(el) el.classList.add('active');
        
        // Hide all views
        document.querySelectorAll('.view-section').forEach(v => v.classList.remove('active'));
        
        // Show selected view
        if(viewName === 'home') {
            document.getElementById('viewHome').classList.add('active');
            renderFeed();
        } else if (viewName === 'passes') {
            document.getElementById('viewPasses').classList.add('active');
            renderPasses();
        } else if (viewName === 'host') {
            document.getElementById('viewHost').classList.add('active');
            renderHostDashboard();
        } else if (viewName === 'settings') {
            document.getElementById('viewSettings').classList.add('active');
            updateUserUI(); // Ensure data is fresh
        }
        
        window.scrollTo({top:0, behavior:'smooth'});
    }

    // --- HOME FEED RENDER ---
    function renderFeed() {
        const c = document.getElementById('clubsContainer'); c.innerHTML = '';
        
        // Filter by search
        let data = clubs.filter(item => 
            item.title.toLowerCase().includes(currentSearch) || 
            (item.loc && item.loc.toLowerCase().includes(currentSearch))
        );

        if(data.length === 0) {
            c.innerHTML = `<div class="empty-state">NO SIGNALS FOUND</div>`;
            return;
        }

        data.forEach(item => {
            const isJoined = joined.includes(item.id);
            const html = `
            <div class="ticket ${isJoined ? 'joined' : ''}" onclick="openDetail('${item.id}')">
                <div class="ticket-inner">
                    <div class="ticket-status-bar"></div>
                    <div class="ticket-content">
                        <div class="ticket-bg-num">${item.id.substring(1)}</div>
                        <div class="t-header">
                            <h3 class="t-title">${item.title}</h3>
                            <div class="t-loc">
                                <svg class="icon icon-sm" viewBox="0 0 24 24"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg> 
                                ${item.loc || 'Unknown Loc'}
                            </div>
                        </div>
                        <p class="t-desc">${item.desc}</p>
                        <div class="t-info-grid">
                            <div class="t-cell"><label>DATE</label><div>${new Date(item.date).toLocaleDateString('en-US',{month:'short', day:'numeric'})}</div></div>
                            <div class="t-cell"><label>TIME</label><div>${item.time}</div></div>
                            <div class="t-cell t-price">${item.price}</div>
                        </div>
                    </div>
                    <div class="ticket-rip"><div class="rip-line"></div></div>
                    <div class="ticket-stub">
                        <div class="ticket-stub-inner" style="display:flex; justify-content:space-between; align-items:center; width:100%;">
                            <div class="stub-code">*${item.id.toUpperCase()}*</div>
                            <button class="btn-action" onclick="event.stopPropagation(); ${isJoined ? `openDetail('${item.id}')` : `joinClub('${item.id}')`}">${isJoined ? 'View Pass' : 'Join Drop'}</button>
                        </div>
                    </div>
                </div>
            </div>`;
            c.insertAdjacentHTML('beforeend', html);
        });
    }

    // --- MY PASSES RENDER ---
    function renderPasses() {
        const c = document.getElementById('passesContainer'); c.innerHTML = '';
        // Only get joined events
        const data = clubs.filter(x => joined.includes(x.id));
        
        if(data.length === 0) {
            c.innerHTML = `<div class="empty-state">NO PASSES ACQUIRED<br>Join events to populate this grid.</div>`;
            return;
        }

        data.forEach(item => {
            // Reusing ticket design but emphasizing it's a pass
            const html = `
            <div class="ticket joined" onclick="openDetail('${item.id}')">
                <div class="ticket-inner">
                    <div class="ticket-status-bar"></div>
                    <div class="ticket-content">
                        <div class="ticket-bg-num">${item.id.substring(1)}</div>
                        <h3 class="t-title">${item.title}</h3>
                        <div class="t-loc">${item.loc || 'Unknown Loc'}</div>
                        <div style="margin-top:20px; text-align:center; padding:10px; background:var(--bg-card-sub); border-radius:12px; border:1px dashed var(--border-strong);">
                             <div style="font-family:var(--font-barcode); font-size:1.5rem; opacity:0.5;">${item.id.toUpperCase()}</div>
                             <div style="font-size:0.8rem; font-weight:700; color:var(--accent);">ACCESS GRANTED</div>
                        </div>
                    </div>
                </div>
            </div>`;
            c.insertAdjacentHTML('beforeend', html);
        });
    }

    // --- HOST DASHBOARD RENDER ---
    function renderHostDashboard() {
        const c = document.getElementById('hostContainer'); c.innerHTML = '';
        // Filter by events hosted by current user email
        const hostedEvents = clubs.filter(x => x.host === user.email);

        if(hostedEvents.length === 0) {
            c.innerHTML = `<div class="empty-state">NO HOSTED EVENTS<br>Create a drop to track attendees here.</div>`;
            return;
        }

        hostedEvents.forEach(item => {
            const html = `
            <div class="ticket" onclick="openHostDetail('${item.id}')">
                <div class="ticket-inner">
                    <div class="ticket-content">
                        <h3 class="t-title">${item.title}</h3>
                        <div style="display:flex; justify-content:space-between; align-items:flex-end; margin-top:10px;">
                            <div>
                                <div style="font-size:0.8rem; color:var(--text-muted); font-weight:700;">DATE</div>
                                <div style="font-family:var(--font-mono); font-weight:600;">${item.date}</div>
                            </div>
                            <div style="text-align:right;">
                                <div style="font-size:2.5rem; font-weight:700; color:var(--text-main); line-height:1;">${item.attendeesList ? item.attendeesList.length : 0}</div>
                                <div style="font-size:0.8rem; color:var(--accent); font-weight:700;">MEMBERS JOINED</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>`;
            c.insertAdjacentHTML('beforeend', html);
        });
    }

    function openHostDetail(id) {
        const item = clubs.find(x => x.id === id);
        const list = item.attendeesList || [];
        
        let listHtml = '';
        if(list.length === 0) {
            listHtml = '<div style="text-align:center; padding:20px; color:var(--text-muted);">No attendees yet.</div>';
        } else {
            list.forEach(att => {
                const isVerified = att.verified;
                listHtml += `
                <div class="attendee-row ${isVerified ? 'verified' : ''}" id="att-${att.email.replace(/[^a-zA-Z0-9]/g, '')}">
                    <div class="at-avatar">${att.name.charAt(0)}</div>
                    <div>
                        <div style="font-weight:700; font-size:0.95rem;">${att.name}</div>
                        <div style="font-size:0.8rem; color:var(--text-sec); font-family:var(--font-mono);">${att.email}</div>
                    </div>
                    <button class="btn-checkin" onclick="event.stopPropagation(); checkInUser('${id}', '${att.email}')">${isVerified ? 'VERIFIED' : 'CHECK IN'}</button>
                </div>`;
            });
        }

        document.getElementById('hostDetailContent').innerHTML = `
            <h2 style="font-size:1.5rem; font-weight:800; margin-bottom:4px;">${item.title}</h2>
            <div style="color:var(--text-sec); margin-bottom:24px;">Guest List</div>
            <div style="max-height:400px; overflow-y:auto;">
                ${listHtml}
            </div>
        `;
        document.getElementById('hostDetailModal').classList.add('visible');
    }

    function checkInUser(eventId, userEmail) {
        const item = clubs.find(x => x.id === eventId);
        const attendee = item.attendeesList.find(x => x.email === userEmail);
        
        if (attendee) {
            attendee.verified = true;
            localStorage.setItem('fida_clubs', JSON.stringify(clubs));
            
            // UI Update
            toast(`Verified: ${attendee.name}`);
            
            // Refresh view if open
            if(document.getElementById('hostDetailModal').classList.contains('visible')) {
                openHostDetail(eventId);
            }
        }
    }

    // --- EVENT DETAILS MODAL ---
    function openDetail(id) {
        activeId = id;
        const item = clubs.find(x => x.id === id);
        const isJoined = joined.includes(id);
        // Only generate QR URL if joined
        const qrUrl = isJoined ? `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${id}-${user?.email}` : '';
        
        document.getElementById('detailsContent').innerHTML = `
            ${item.image ? `<img src="${item.image}" class="detail-cover">` : ''}
            <h1 style="font-size:2.2rem; font-weight:800; line-height:1; margin-bottom:16px; letter-spacing: -0.04em;">${item.title}</h1>
            <p style="color:var(--text-sec); line-height:1.6; margin-bottom:32px; font-size:1.05rem;">${item.desc}</p>
            
            <div style="background:var(--bg-card-sub); padding:20px; border-radius:20px; border:1px solid var(--border-strong); margin-bottom:32px;">
                <div style="display:flex; justify-content:space-between; margin-bottom:12px;">
                    <span style="color:var(--text-muted); font-weight:600; font-size:0.9rem;">LOCATION</span>
                    <span style="font-weight:600; font-family:var(--font-mono);">${item.loc || 'TBA'}</span>
                </div>
                <div style="display:flex; justify-content:space-between;">
                    <span style="color:var(--text-muted); font-weight:600; font-size:0.9rem;">START TIME</span>
                    <span style="font-weight:600; font-family:var(--font-mono);">${item.time}</span>
                </div>
            </div>

            ${isJoined ? `
                <div style="text-align:center; padding:24px; border:1px dashed var(--accent); background:rgba(255, 42, 42, 0.04); border-radius:24px; margin-bottom:32px;">
                    <div style="background:white; padding:10px; border-radius:12px; display:inline-block; margin-bottom:12px;">
                        <img src="${qrUrl}" style="width:140px; height:140px; display:block;">
                    </div>
                    <div style="font-family:var(--font-barcode); font-size:2rem; opacity:0.8; letter-spacing:0.05em;">${id.toUpperCase()}</div>
                    <div style="font-size:0.8rem; color:var(--text-sec); margin-top:8px; font-weight:600;">SHOW TO HOST</div>
                </div>
                <button class="btn-main" style="background:var(--bg-card); color:var(--text-muted); border:1px solid var(--border-strong); box-shadow:none;" onclick="leaveClub('${id}')">UNJOIN EVENT</button>
            ` : `
                <div style="text-align:center; padding:20px; color:var(--text-sec); font-size:0.9rem; margin-bottom:20px;">Join to reveal entry code.</div>
                <button class="btn-main" onclick="joinClub('${id}')">JOIN DROP • ${item.price}</button>
            `}
        `;
        document.getElementById('detailsModal').classList.add('visible');
    }

    function joinClub(id) {
        if(!joined.includes(id)) {
            // Add ID to joined list
            joined.push(id);
            localStorage.setItem('fida_joined', JSON.stringify(joined));
            
            // Add User to Event's Attendee List
            const c = clubs.find(x => x.id === id);
            c.attendees++;
            if(!c.attendeesList) c.attendeesList = [];
            c.attendeesList.push({
                name: user.name,
                email: user.email,
                joinedAt: new Date().toISOString(),
                verified: false
            });
            
            localStorage.setItem('fida_clubs', JSON.stringify(clubs));
            toast('Pass Generated');
            
            // Refresh view
            if(document.getElementById('detailsModal').classList.contains('visible')) openDetail(id);
            else renderFeed();
        }
    }

    function leaveClub(id) {
        // Remove ID from joined list
        joined = joined.filter(x => x !== id);
        localStorage.setItem('fida_joined', JSON.stringify(joined));
        
        // Remove User from Event's Attendee List
        const c = clubs.find(x => x.id === id);
        c.attendees--;
        if(c.attendeesList) {
            c.attendeesList = c.attendeesList.filter(u => u.email !== user.email);
        }
        
        localStorage.setItem('fida_clubs', JSON.stringify(clubs));
        toast('Pass Revoked');
        document.getElementById('detailsModal').classList.remove('visible');
        renderFeed();
        
        // Refresh passes view if active
        if(document.getElementById('viewPasses').classList.contains('active')) renderPasses();
    }

    // Creating Event
    function openCreateModal() { document.getElementById('createModal').classList.add('visible'); }
    function closeCreateModal() {
        const m = document.getElementById('createModal');
        m.classList.remove('visible');
        // Reset height after transition
        setTimeout(() => {
            const s = m.querySelector('.sheet');
            s.classList.remove('expanded');
            s.classList.remove('maximized');
        }, 500);
    }
    
    function previewImage(inpt) {
        if(inpt.files[0]) {
            const r = new FileReader();
            r.onload = e => {
                document.getElementById('cImagePreview').src = e.target.result;
                document.getElementById('cImagePreview').style.display = 'block';
            };
            r.readAsDataURL(inpt.files[0]);
        }
    }
    
    function handleCreate(e) {
        e.preventDefault();
        const newItem = {
            id: 'c' + Date.now(),
            title: document.getElementById('cName').value,
            desc: document.getElementById('cDesc').value,
            date: document.getElementById('cDate').value,
            time: document.getElementById('cTime').value,
            loc: document.getElementById('cLoc').value,
            price: document.getElementById('cPrice').value ? '$'+document.getElementById('cPrice').value : 'Free',
            image: document.getElementById('cImagePreview').src || null,
            attendees: 1, // Start with 1 (the creator)
            host: user.email, // Set Host
            attendeesList: [{ // Add host to list
                name: user.name,
                email: user.email,
                joinedAt: new Date().toISOString(),
                verified: true // Host is always verified
            }]
        };
        
        clubs.unshift(newItem);
        joined.push(newItem.id); // Auto join creator
        
        localStorage.setItem('fida_clubs', JSON.stringify(clubs));
        localStorage.setItem('fida_joined', JSON.stringify(joined));
        
        closeCreateModal(); // Use updated close function
        e.target.reset();
        document.getElementById('cImagePreview').style.display='none';
        
        renderFeed();
        toast('Drop Published');
        
        // Switch to host view to see it
        switchView('host', document.querySelectorAll('.dock-item')[2]);
    }

    // --- SCANNER LOGIC ---
    function startScanner() {
        document.getElementById('scannerModal').classList.add('visible');
        
        if(!html5QrcodeScanner) {
            html5QrcodeScanner = new Html5Qrcode("reader");
        }
        
        // Check if already running or paused
        try {
            if(html5QrcodeScanner.getState() === 3) { // PAUSED
                html5QrcodeScanner.resume();
                return;
            } else if(html5QrcodeScanner.getState() === 2) { // SCANNING
                return;
            }
        } catch(e) {
            // ignore error
        }

        html5QrcodeScanner.start(
            { facingMode: "environment" }, 
            { fps: 10, qrbox: { width: 250, height: 250 } },
            onScanSuccess,
            onScanFailure
        ).catch(err => {
            console.error(err);
            toast("Camera error: " + err);
        });
    }

    function stopScanner() {
        if(html5QrcodeScanner) {
            html5QrcodeScanner.stop().then(() => {
                document.getElementById('scannerModal').classList.remove('visible');
            }).catch(err => {
                console.log(err);
                document.getElementById('scannerModal').classList.remove('visible');
            });
        } else {
            document.getElementById('scannerModal').classList.remove('visible');
        }
    }
    
    function closeResultAndScan() {
        document.getElementById('scanResultModal').classList.remove('visible');
        startScanner();
    }

    function showScanResult(status, name) {
        // Stop scanning temporarily
        if(html5QrcodeScanner) {
            try {
                html5QrcodeScanner.pause();
            } catch(e) { console.log("Pause failed", e); }
        }
        
        const m = document.getElementById('scanResultModal');
        const icon = document.getElementById('scanIcon');
        const txt = document.getElementById('scanStatus');
        const sub = document.getElementById('scanName');
        
        m.classList.add('visible');
        sub.innerText = name;
        
        if(status === 'success') {
            icon.style.backgroundColor = 'rgba(16, 185, 129, 0.2)';
            icon.style.color = 'var(--success)';
            icon.innerHTML = `<svg class="icon" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"></polyline></svg>`;
            txt.innerText = 'ACCESS GRANTED';
            txt.style.color = 'var(--success)';
        } else if (status === 'warning') {
            icon.style.backgroundColor = 'rgba(245, 158, 11, 0.2)';
            icon.style.color = 'var(--warning)';
            icon.innerHTML = `<svg class="icon" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>`;
            txt.innerText = 'ALREADY ENTERED';
            txt.style.color = 'var(--warning)';
        } else {
            icon.style.backgroundColor = 'rgba(230, 25, 25, 0.2)';
            icon.style.color = 'var(--accent)';
            icon.innerHTML = `<svg class="icon" viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>`;
            txt.innerText = 'ACCESS DENIED';
            txt.style.color = 'var(--accent)';
        }
    }

    function onScanSuccess(decodedText, decodedResult) {
        const splitIndex = decodedText.indexOf('-');
        if(splitIndex === -1) {
            showScanResult('error', 'Invalid Ticket');
            return;
        }
        
        const eventId = decodedText.substring(0, splitIndex);
        const email = decodedText.substring(splitIndex + 1);
        
        const event = clubs.find(c => c.id === eventId);
        
        if (!event) {
            showScanResult('error', 'Event Not Found');
            return;
        }
        
        if (event.host !== user.email) {
            showScanResult('error', 'Wrong Event Host');
            return;
        }
        
        const attendee = event.attendeesList.find(a => a.email === email);
        
        if (attendee) {
            if (attendee.verified) {
                showScanResult('warning', attendee.name);
            } else {
                checkInUser(eventId, email);
                showScanResult('success', attendee.name);
            }
        } else {
            showScanResult('error', 'Not on Guest List');
        }
    }

    function onScanFailure(error) {
        // console.warn(`Code scan error = ${error}`);
    }

    // Utils
    function toast(msg) {
        const t = document.getElementById('toast');
        document.getElementById('toastMsg').innerText = msg;
        t.classList.add('show');
        setTimeout(() => t.classList.remove('show'), 3000);
    }