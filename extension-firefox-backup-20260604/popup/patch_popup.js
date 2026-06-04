function initAvatarPicker() {
  const container = document.getElementById('avatar-picker-list');
  if (!container || !window.AVATARS) return;
  
  container.innerHTML = '';
  
  window.AVATARS.forEach((avatar, index) => {
    const el = document.createElement('div');
    el.className = 'avatar-item';
    el.dataset.id = avatar.id;
    el.title = avatar.display_name;
    el.style.backgroundColor = avatar.bg_color;
    
    // Select the first one by default
    if (index === 0) {
      el.classList.add('selected');
      window.selectedAvatarId = avatar.id;
    }
    
    const img = document.createElement('img');
    img.src = `../assets/avatars/${avatar.storage_path}`;
    img.alt = avatar.display_name;
    
    el.appendChild(img);
    
    el.addEventListener('click', () => {
      document.querySelectorAll('.avatar-item').forEach(a => a.classList.remove('selected'));
      el.classList.add('selected');
      window.selectedAvatarId = avatar.id;
    });
    
    container.appendChild(el);
  });
}
