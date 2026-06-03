// Patch for popup.js

function initSettingsAvatarPicker() {
  const container = document.getElementById('settings-avatar-picker-list');
  if (!container || !window.AVATARS) return;
  
  container.innerHTML = '';
  
  window.AVATARS.forEach((avatar, index) => {
    const el = document.createElement('div');
    el.className = 'avatar-item';
    el.dataset.id = avatar.id;
    el.title = avatar.display_name;
    el.style.backgroundColor = avatar.bg_color;
    
    const img = document.createElement('img');
    img.src = `../assets/avatars/${avatar.storage_path}`;
    img.alt = avatar.display_name;
    el.appendChild(img);
    
    el.addEventListener('click', () => {
      container.querySelectorAll('.avatar-item').forEach(a => a.classList.remove('selected'));
      el.classList.add('selected');
      window.settingsSelectedAvatarId = avatar.id;
    });
    
    container.appendChild(el);
  });
}

// Add these to setupEventListeners:
/*
  const settingsAvatar = $('settings-avatar');
  const changeAvatarModal = $('change-avatar-modal');
  const closeAvatarModalBtn = $('close-avatar-modal-btn');
  const saveAvatarBtn = $('save-avatar-btn');

  if (settingsAvatar && changeAvatarModal) {
    settingsAvatar.addEventListener('click', () => {
      changeAvatarModal.classList.remove('hidden');
      
      // Pre-select current avatar
      const acc = (state.saved_accounts || []).find(a => a.email === state.auth?.email);
      let currentAvatarId = acc?.avatar_id;
      
      const container = $('settings-avatar-picker-list');
      container.querySelectorAll('.avatar-item').forEach(el => {
        el.classList.remove('selected');
        if (el.dataset.id === currentAvatarId) {
          el.classList.add('selected');
          // scroll to selected
          el.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
        }
      });
      window.settingsSelectedAvatarId = currentAvatarId;
    });
  }

  if (closeAvatarModalBtn && changeAvatarModal) {
    closeAvatarModalBtn.addEventListener('click', () => {
      changeAvatarModal.classList.add('hidden');
    });
  }

  if (saveAvatarBtn) {
    saveAvatarBtn.addEventListener('click', async () => {
      if (window.settingsSelectedAvatarId && state.auth?.email) {
        let accounts = state.saved_accounts || [];
        const index = accounts.findIndex(a => a.email === state.auth.email);
        if (index !== -1) {
          accounts[index].avatar_id = window.settingsSelectedAvatarId;
          await chrome.storage.local.set({ saved_accounts: accounts });
          state.saved_accounts = accounts;
          showScreen('settings'); // Refresh UI
        }
      }
      changeAvatarModal.classList.add('hidden');
    });
  }
*/
