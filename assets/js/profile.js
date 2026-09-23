/* A small, browser-only identity for exported portfolio cards. */
window.PORSI_PROFILE = (function () {
  'use strict';

  const KEY = 'porsi.profile.v1';
  const avatars = [
    { id: 'fox', label: 'Rubah', src: 'assets/avatars/fox.png' },
    { id: 'cat', label: 'Kucing', src: 'assets/avatars/cat.png' },
    { id: 'bear', label: 'Beruang', src: 'assets/avatars/bear.png' },
    { id: 'owl', label: 'Burung hantu', src: 'assets/avatars/owl.png' },
  ];
  const acceptedTypes = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);

  function read() {
    try {
      const value = JSON.parse(localStorage.getItem(KEY) || '{}');
      return value && typeof value === 'object' ? value : {};
    } catch { return {}; }
  }

  function get() {
    const saved = read();
    const avatar = avatars.find(item => item.id === saved.avatarId);
    const photo = typeof saved.photo === 'string' && /^data:image\/jpeg;base64,/.test(saved.photo) ? saved.photo : '';
    return {
      name: typeof saved.name === 'string' ? saved.name.slice(0, 40) : '',
      avatarId: photo ? 'photo' : avatar ? avatar.id : '',
      avatarSrc: photo || (avatar ? avatar.src : ''),
    };
  }

  function write(next) {
    localStorage.setItem(KEY, JSON.stringify(next));
    window.dispatchEvent(new CustomEvent('porsi:profile', { detail: get() }));
  }

  function setName(name) {
    const saved = read();
    write({ ...saved, name: String(name).slice(0, 40) });
  }

  function setAvatar(id) {
    const current = get();
    if (id && !avatars.some(item => item.id === id)) return;
    write({ name: current.name, avatarId: id || '' });
  }

  async function setPhoto(file) {
    if (!file || !acceptedTypes.has(file.type)) throw new Error('Pilih foto JPG, PNG, WebP, atau GIF.');
    if (file.size > 8 * 1024 * 1024) throw new Error('Ukuran foto maksimal 8 MB.');
    const url = URL.createObjectURL(file);
    try {
      const image = new Image();
      image.src = url;
      await image.decode();
      const canvas = document.createElement('canvas');
      canvas.width = canvas.height = 320;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Foto tidak dapat diproses.');
      const size = Math.min(image.naturalWidth, image.naturalHeight);
      ctx.drawImage(image, (image.naturalWidth - size) / 2, (image.naturalHeight - size) / 2, size, size, 0, 0, 320, 320);
      const photo = canvas.toDataURL('image/jpeg', 0.82);
      write({ name: get().name, avatarId: 'photo', photo });
    } finally {
      URL.revokeObjectURL(url);
    }
  }

  return { avatars, get, setName, setAvatar, setPhoto };
})();
