// ===================================
// WATERETTE - JAVASCRIPT
// ===================================

// State Management
let clubs = [];
let currentUser = null;
let filterMode = 'all';

// Initialize App
document.addEventListener('DOMContentLoaded', () => {
  checkAuthentication();
  loadClubsFromStorage();
  renderClubs();
  initializeEventListeners();
  initializeBottomNav();
  initializeAuthListeners();
  setMinDate();
});

// ===================================
// AUTHENTICATION
// ===================================

function checkAuthentication() {
  const user = localStorage.getItem('waterette_user');
  if (user) {
    currentUser = JSON.parse(user);
    updateUIForLoggedInUser();
  } else {
    showAuthModal();
  }
}

function showAuthModal() {
  document.getElementById('authModal').classList.add('active');
  document.body.style.overflow = 'hidden';
}

function closeAuthModal() {
  document.getElementById('authModal').classList.remove('active');
  document.body.style.overflow = '';
}

function updateUIForLoggedInUser() {
  const userNameEl = document.getElementById('userName');
  if (userNameEl && currentUser) {
    userNameEl.textContent = currentUser.name;
  }
}

function initializeAuthListeners() {
  const showSignupBtn = document.getElementById('showSignup');
  const showLoginBtn = document.getElementById('showLogin');
  const loginForm = document.getElementById('loginForm');
  const signupForm = document.getElementById('signupForm');

  if (showSignupBtn) {
    showSignupBtn.addEventListener('click', () => {
      loginForm.classList.add('hidden');
      signupForm.classList.remove('hidden');
    });
  }

  if (showLoginBtn) {
    showLoginBtn.addEventListener('click', () => {
      signupForm.classList.add('hidden');
      loginForm.classList.remove('hidden');
    });
  }

  const loginFormElement = document.getElementById('loginFormElement');
  if (loginFormElement) {
    loginFormElement.addEventListener('submit', (e) => {
      e.preventDefault();
      const email = document.getElementById('loginEmail').value;
      const password = document.getElementById('loginPassword').value;

      const storedUsers = JSON.parse(localStorage.getItem('waterette_users') || '[]');
      const user = storedUsers.find(u => u.email === email && u.password === password);

      if (user) {
        currentUser = { id: user.id, name: user.name, email: user.email };
        localStorage.setItem('waterette_user', JSON.stringify(currentUser));
        updateUIForLoggedInUser();
        closeAuthModal();
        showNotification(`Welcome back, ${user.name}! 👋`);
        renderClubs();
      } else {
        showNotification('Invalid email or password ❌');
      }
    });
  }

  const signupFormElement = document.getElementById('signupFormElement');
  if (signupFormElement) {
    signupFormElement.addEventListener('submit', (e) => {
      e.preventDefault();
      const name = document.getElementById('signupName').value;
      const email = document.getElementById('signupEmail').value;
      const password = document.getElementById('signupPassword').value;

      const storedUsers = JSON.parse(localStorage.getItem('waterette_users') || '[]');
      if (storedUsers.find(u => u.email === email)) {
        showNotification('Email already registered ❌');
        return;
      }

      const newUser = {
        id: 'user_' + Date.now(),
        name,
        email,
        password
      };

      storedUsers.push(newUser);
      localStorage.setItem('waterette_users', JSON.stringify(storedUsers));

      currentUser = { id: newUser.id, name: newUser.name, email: newUser.email };
      localStorage.setItem('waterette_user', JSON.stringify(currentUser));
      updateUIForLoggedInUser();
      closeAuthModal();
      showNotification(`Welcome to WATERETTE, ${name}! 🎉`);
      renderClubs();
    });
  }
}

// ===================================
// BOTTOM NAVIGATION
// ===================================

function initializeBottomNav() {
  const navItems = document.querySelectorAll('.nav-item');

  navItems.forEach(item => {
    item.addEventListener('click', () => {
      navItems.forEach(i => i.classList.remove('active'));
      item.classList.add('active');

      const navId = item.id;

      if (navId === 'navHome') {
        filterMode = 'all';
        document.getElementById('searchInput').value = '';
        document.querySelector('.hero').classList.remove('hidden');
        document.querySelector('.filter-bar').classList.remove('hidden');
        document.querySelector('.container').classList.remove('hidden');
        renderClubs();
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else if (navId === 'navExplore') {
        filterMode = 'available';
        document.querySelector('.hero').classList.remove('hidden');
        document.querySelector('.filter-bar').classList.remove('hidden');
        document.querySelector('.container').classList.remove('hidden');
        renderClubs();
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else if (navId === 'navMyClubs') {
        showMyClubsPage();
      } else if (navId === 'navProfile') {
        showProfileInfo();
      }
    });
  });
}

function showMyClubsPage() {
  if (!currentUser) {
    showNotification('Please log in to view your clubs ❌');
    return;
  }

  document.querySelector('.hero').classList.add('hidden');
  document.querySelector('.filter-bar').classList.add('hidden');

  const myClubs = clubs.filter(c => c.participants.includes(currentUser.id));
  const container = document.querySelector('.container');
  container.classList.remove('hidden');

  const grid = document.getElementById('clubsGrid');
  const emptyState = document.getElementById('emptyState');

  if (myClubs.length === 0) {
    grid.innerHTML = '';
    emptyState.classList.remove('hidden');
    emptyState.innerHTML = `
      <div class="empty-state-icon">�</div>
      <h3>No clubs joined yet</h3>
      <p>Explore and join clubs to see them here!</p>
      <button class="btn btn-primary mt-2" onclick="document.getElementById('navExplore').click()">Explore Clubs</button>
    `;
  } else {
    emptyState.classList.add('hidden');
    grid.innerHTML = `
      <div style="margin-bottom: var(--space-lg);">
        <h2 style="font-size: 1.75rem; font-weight: 700; margin-bottom: 0.5rem;">My Clubs</h2>
        <p style="color: var(--text-gray); font-size: 1rem;">You're a member of ${myClubs.length} club${myClubs.length !== 1 ? 's' : ''}</p>
      </div>
      ${myClubs.map(club => createMyClubCard(club)).join('')}
    `;
  }

  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function createMyClubCard(club) {
  const isFull = club.participants.length >= club.capacity;
  const progressPercent = (club.participants.length / club.capacity) * 100;
  const isCreator = club.createdBy === currentUser.id;

  return `
    <div class="club-card" style="margin-bottom: var(--space-md);">
      <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: var(--space-sm);">
        <div>
          <h3 class="club-title" style="margin-bottom: 0.5rem;">${escapeHtml(club.title)}</h3>
          ${isCreator ? '<span style="background: var(--gradient-purple); color: white; padding: 0.25rem 0.75rem; border-radius: var(--radius-full); font-size: 0.75rem; font-weight: 600;">Creator</span>' : ''}
        </div>
      </div>
      
      ${club.description ? `<p style="color: var(--text-gray); margin-bottom: var(--space-sm); font-size: 0.95rem;">${escapeHtml(club.description)}</p>` : ''}
      
      <div class="club-detail" style="margin-bottom: 0.5rem;">
        <span class="club-detail-icon">📅</span>
        <span>${formatDate(club.date)}</span>
      </div>
      
      <div class="club-detail" style="margin-bottom: 0.5rem;">
        <span class="club-detail-icon">🕐</span>
        <span>${formatTime(club.time)}</span>
      </div>
      
      <div class="club-detail" style="margin-bottom: var(--space-sm);">
        <span class="club-detail-icon">📍</span>
        <span>${escapeHtml(club.location)}</span>
      </div>
      
      <div class="participants-section">
        <div class="participants-info">
          <span class="participants-count">${club.participants.length} / ${club.capacity}</span>
          <span class="participants-label">
            ${isFull ? 'Full' : `${club.capacity - club.participants.length} spots left`}
          </span>
        </div>
        <div class="progress-bar">
          <div class="progress-fill ${isFull ? 'full' : ''}" style="width: ${progressPercent}%"></div>
        </div>
      </div>
      
      <div style="margin-top: var(--space-md); display: flex; gap: var(--space-sm);">
        <button class="btn btn-secondary" onclick="openDetailsModal('${club.id}')" style="flex: 1;">View Details</button>
        <button class="btn btn-leave" onclick="leaveClubFromMyPage('${club.id}')" style="flex: 1;">Leave Club</button>
      </div>
    </div>
  `;
}

function leaveClubFromMyPage(clubId) {
  leaveClub(clubId);
  setTimeout(() => {
    showMyClubsPage();
  }, 100);
}

function showProfileInfo() {
  if (!currentUser) return;

  const myClubs = clubs.filter(c => c.participants.includes(currentUser.id));
  const createdClubs = clubs.filter(c => c.createdBy === currentUser.id);

  const content = document.getElementById('clubDetailsContent');
  content.innerHTML = `
    <div style="text-align: center; padding: 1rem 0;">
      <div style="font-size: 4rem; margin-bottom: 1rem;">👤</div>
      <h3 style="font-size: 1.5rem; margin-bottom: 0.5rem;">${currentUser.name}</h3>
      <p style="color: var(--text-gray); margin-bottom: 2rem;">${currentUser.email}</p>
      
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 2rem;">
        <div style="background: linear-gradient(135deg, #f3f4f6, #e5e7eb); padding: 1.5rem; border-radius: var(--radius-md);">
          <div style="font-size: 2rem; font-weight: 800; color: var(--primary);">${myClubs.length}</div>
          <div style="color: var(--text-gray); font-size: 0.9rem;">Clubs Joined</div>
        </div>
        <div style="background: linear-gradient(135deg, #f3f4f6, #e5e7eb); padding: 1.5rem; border-radius: var(--radius-md);">
          <div style="font-size: 2rem; font-weight: 800; color: var(--primary);">${createdClubs.length}</div>
          <div style="color: var(--text-gray); font-size: 0.9rem;">Clubs Created</div>
        </div>
      </div>
      
      <button class="btn btn-secondary" onclick="logout()" style="width: 100%;">Logout</button>
    </div>
  `;

  document.getElementById('detailsClubTitle').textContent = 'My Profile';
  document.getElementById('clubDetailsModal').classList.add('active');
  document.body.style.overflow = 'hidden';
}

function logout() {
  localStorage.removeItem('waterette_user');
  currentUser = null;
  closeDetailsModal();
  showAuthModal();
  showNotification('Logged out successfully! 👋');
}

// ===================================
// LOCAL STORAGE
// ===================================

function loadClubsFromStorage() {
  const stored = localStorage.getItem('waterette_clubs');
  if (stored) {
    clubs = JSON.parse(stored);
  }
}

function saveClubsToStorage() {
  localStorage.setItem('waterette_clubs', JSON.stringify(clubs));
}

// ===================================
// EVENT LISTENERS
// ===================================

function initializeEventListeners() {
  document.getElementById('createClubBtn').addEventListener('click', openCreateModal);
  document.getElementById('closeCreateModal').addEventListener('click', closeCreateModal);
  document.getElementById('closeDetailsModal').addEventListener('click', closeDetailsModal);

  document.getElementById('createClubModal').addEventListener('click', (e) => {
    if (e.target.id === 'createClubModal') closeCreateModal();
  });
  document.getElementById('clubDetailsModal').addEventListener('click', (e) => {
    if (e.target.id === 'clubDetailsModal') closeDetailsModal();
  });

  document.getElementById('createClubForm').addEventListener('submit', handleCreateClub);

  document.getElementById('searchInput').addEventListener('input', handleSearch);
  document.getElementById('filterAvailableBtn').addEventListener('click', () => {
    filterMode = 'available';
    renderClubs();
  });
  document.getElementById('showAllBtn').addEventListener('click', () => {
    filterMode = 'all';
    renderClubs();
  });

  document.getElementById('viewMyClubsBtn').addEventListener('click', () => {
    showMyClubsPage();
  });
}

// ===================================
// MODAL MANAGEMENT
// ===================================

function openCreateModal() {
  document.getElementById('createClubModal').classList.add('active');
  document.body.style.overflow = 'hidden';
}

function closeCreateModal() {
  document.getElementById('createClubModal').classList.remove('active');
  document.getElementById('createClubForm').reset();
  document.body.style.overflow = '';
}

function openDetailsModal(clubId) {
  const club = clubs.find(c => c.id === clubId);
  if (!club) return;

  const content = document.getElementById('clubDetailsContent');
  const isParticipant = currentUser && club.participants.includes(currentUser.id);
  const isFull = club.participants.length >= club.capacity;

  content.innerHTML = `
    <div class="club-detail" style="margin-bottom: 1rem;">
      <span class="club-detail-icon">📝</span>
      <span>${club.description || 'No description provided'}</span>
    </div>
    
    <div class="club-detail">
      <span class="club-detail-icon">📅</span>
      <span>${formatDate(club.date)}</span>
    </div>
    
    <div class="club-detail">
      <span class="club-detail-icon">🕐</span>
      <span>${formatTime(club.time)}</span>
    </div>
    
    <div class="club-detail">
      <span class="club-detail-icon">📍</span>
      <span>${club.location}</span>
    </div>
    
    <div class="participants-section" style="margin-top: 1.5rem;">
      <div class="participants-info">
        <span class="participants-count">${club.participants.length} / ${club.capacity}</span>
        <span class="participants-label">Participants</span>
      </div>
      <div class="progress-bar">
        <div class="progress-fill ${isFull ? 'full' : ''}" style="width: ${(club.participants.length / club.capacity) * 100}%"></div>
      </div>
    </div>
    
    <div class="club-actions" style="margin-top: 1.5rem;">
      ${isParticipant
      ? `<button class="btn btn-leave" onclick="leaveClub('${clubId}')">Leave Club</button>`
      : `<button class="btn btn-join" ${isFull ? 'disabled' : ''} onclick="joinClub('${clubId}')">${isFull ? 'Club Full' : 'Join Club'}</button>`
    }
    </div>
  `;

  document.getElementById('detailsClubTitle').textContent = club.title;
  document.getElementById('clubDetailsModal').classList.add('active');
  document.body.style.overflow = 'hidden';
}

function closeDetailsModal() {
  document.getElementById('clubDetailsModal').classList.remove('active');
  document.body.style.overflow = '';
}

// ===================================
// CLUB MANAGEMENT
// ===================================

function handleCreateClub(e) {
  e.preventDefault();

  if (!currentUser) {
    showNotification('Please log in to create a club ❌');
    return;
  }

  const newClub = {
    id: 'club_' + Date.now(),
    title: document.getElementById('clubTitle').value.trim(),
    description: document.getElementById('clubDescription').value.trim(),
    date: document.getElementById('clubDate').value,
    time: document.getElementById('clubTime').value,
    location: document.getElementById('clubLocation').value.trim(),
    capacity: parseInt(document.getElementById('clubCapacity').value),
    participants: [currentUser.id],
    createdBy: currentUser.id,
    createdAt: new Date().toISOString()
  };

  clubs.unshift(newClub);
  saveClubsToStorage();
  renderClubs();
  closeCreateModal();
  showNotification('Club created successfully! 🎉');
}

function joinClub(clubId) {
  const club = clubs.find(c => c.id === clubId);
  if (!club) return;

  if (!currentUser) {
    showNotification('Please log in to join clubs ❌');
    return;
  }

  if (club.participants.length >= club.capacity) {
    showNotification('This club is full! ❌');
    return;
  }

  if (club.participants.includes(currentUser.id)) {
    showNotification('You are already in this club! ✓');
    return;
  }

  club.participants.push(currentUser.id);
  saveClubsToStorage();
  renderClubs();
  closeDetailsModal();
  showNotification('Successfully joined the club! 🎉');
}

function leaveClub(clubId) {
  const club = clubs.find(c => c.id === clubId);
  if (!club) return;

  club.participants = club.participants.filter(p => p !== currentUser.id);

  if (club.createdBy === currentUser.id && club.participants.length === 0) {
    clubs = clubs.filter(c => c.id !== clubId);
    showNotification('Club deleted! 🗑️');
  } else {
    showNotification('You left the club! 👋');
  }

  saveClubsToStorage();
  renderClubs();
  closeDetailsModal();
}

// ===================================
// RENDERING
// ===================================

function renderClubs() {
  const grid = document.getElementById('clubsGrid');
  const emptyState = document.getElementById('emptyState');
  const searchQuery = document.getElementById('searchInput').value.toLowerCase();

  let filteredClubs = clubs;

  if (filterMode === 'available') {
    filteredClubs = clubs.filter(c => c.participants.length < c.capacity);
  } else if (filterMode === 'myClubs') {
    filteredClubs = currentUser ? clubs.filter(c => c.participants.includes(currentUser.id)) : [];
  }

  if (searchQuery) {
    filteredClubs = filteredClubs.filter(c =>
      c.title.toLowerCase().includes(searchQuery) ||
      c.location.toLowerCase().includes(searchQuery) ||
      (c.description && c.description.toLowerCase().includes(searchQuery))
    );
  }

  if (filteredClubs.length === 0) {
    grid.innerHTML = '';
    emptyState.classList.remove('hidden');

    if (searchQuery || filterMode !== 'all') {
      emptyState.innerHTML = `
        <div class="empty-state-icon">🔍</div>
        <h3>No clubs found</h3>
        <p>Try adjusting your search or filters</p>
        <button class="btn btn-secondary mt-2" onclick="resetFilters()">Reset Filters</button>
      `;
    } else {
      emptyState.innerHTML = `
        <div class="empty-state-icon">🎪</div>
        <h3>No clubs yet</h3>
        <p>Be the first to create a club!</p>
        <button class="btn btn-primary mt-2" onclick="document.getElementById('createClubBtn').click()">Create First Club</button>
      `;
    }
    return;
  }

  emptyState.classList.add('hidden');
  grid.innerHTML = filteredClubs.map(club => createClubCard(club)).join('');
}

function createClubCard(club) {
  const isParticipant = currentUser && club.participants.includes(currentUser.id);
  const isFull = club.participants.length >= club.capacity;
  const progressPercent = (club.participants.length / club.capacity) * 100;

  return `
    <div class="club-card" onclick="openDetailsModal('${club.id}')">
      <div class="club-header">
        <h3 class="club-title">${escapeHtml(club.title)}</h3>
      </div>
      
      <div class="club-detail">
        <span class="club-detail-icon">📅</span>
        <span>${formatDate(club.date)}</span>
      </div>
      
      <div class="club-detail">
        <span class="club-detail-icon">🕐</span>
        <span>${formatTime(club.time)}</span>
      </div>
      
      <div class="club-detail">
        <span class="club-detail-icon">📍</span>
        <span>${escapeHtml(club.location)}</span>
      </div>
      
      <div class="participants-section">
        <div class="participants-info">
          <span class="participants-count">${club.participants.length} / ${club.capacity}</span>
          <span class="participants-label">
            ${isFull ? 'Full' : `${club.capacity - club.participants.length} spots left`}
          </span>
        </div>
        <div class="progress-bar">
          <div class="progress-fill ${isFull ? 'full' : ''}" style="width: ${progressPercent}%"></div>
        </div>
      </div>
      
      <div class="club-actions" onclick="event.stopPropagation()">
        ${isParticipant
      ? `<button class="btn btn-leave" onclick="leaveClub('${club.id}')">Leave</button>`
      : `<button class="btn btn-join" ${isFull ? 'disabled' : ''} onclick="joinClub('${club.id}')">${isFull ? 'Full' : 'Join'}</button>`
    }
      </div>
    </div>
  `;
}

// ===================================
// SEARCH & FILTER
// ===================================

function handleSearch() {
  renderClubs();
}

function resetFilters() {
  document.getElementById('searchInput').value = '';
  filterMode = 'all';
  renderClubs();
}

// ===================================
// UTILITY FUNCTIONS
// ===================================

function formatDate(dateString) {
  const date = new Date(dateString);
  const options = { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' };
  return date.toLocaleDateString('en-US', options);
}

function formatTime(timeString) {
  const [hours, minutes] = timeString.split(':');
  const hour = parseInt(hours);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour % 12 || 12;
  return `${displayHour}:${minutes} ${ampm}`;
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function setMinDate() {
  const today = new Date().toISOString().split('T')[0];
  document.getElementById('clubDate').setAttribute('min', today);
}

function showNotification(message) {
  const notification = document.createElement('div');
  notification.textContent = message;
  notification.style.cssText = `
    position: fixed;
    top: 100px;
    right: 20px;
    background: var(--gradient-purple);
    color: white;
    padding: 1rem 1.5rem;
    border-radius: var(--radius-md);
    box-shadow: var(--shadow-lg);
    z-index: 10000;
    animation: slideInRight 0.3s ease, slideOutRight 0.3s ease 2.7s;
    font-weight: 600;
  `;

  document.body.appendChild(notification);

  setTimeout(() => {
    notification.remove();
  }, 3000);
}

const style = document.createElement('style');
style.textContent = `
  @keyframes slideInRight {
    from {
      transform: translateX(400px);
      opacity: 0;
    }
    to {
      transform: translateX(0);
      opacity: 1;
    }
  }
  
  @keyframes slideOutRight {
    from {
      transform: translateX(0);
      opacity: 1;
    }
    to {
      transform: translateX(400px);
      opacity: 0;
    }
  }
`;
document.head.appendChild(style);
