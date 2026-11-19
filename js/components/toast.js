export function showToast(message, type = 'info', duration = 3500) {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.setAttribute('role', 'status');

  if (type === 'warning') {
    toast.style.backgroundColor = '#b45309';
  } else if (type === 'error') {
    toast.style.backgroundColor = '#b91c1c';
  } else if (type === 'success') {
    toast.style.backgroundColor = '#15803d';
  }

  toast.textContent = message;
  container.appendChild(toast);

  window.setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transition = 'opacity 0.2s ease';
    window.setTimeout(() => toast.remove(), 220);
  }, duration);
}