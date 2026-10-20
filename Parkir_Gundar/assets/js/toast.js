/**
 * Toast Notification System for Gunadarma Park
 */
const Toast = {
  container: null,

  init() {
    if (this.container) return;
    this.container = document.createElement('div');
    this.container.id = 'toast-container';
    this.container.className = 'fixed bottom-5 right-5 z-[9999] flex flex-col gap-2 pointer-events-none max-w-sm w-full px-4 sm:px-0';
    document.body.appendChild(this.container);
  },

  show(message, type = 'info', title = '') {
    this.init();

    const toast = document.createElement('div');
    toast.className = `pointer-events-auto transform transition-all duration-300 translate-y-4 opacity-0 p-4 rounded-xl shadow-lg border flex items-start gap-3 bg-white text-slate-800 ${
      type === 'success' ? 'border-emerald-200' :
      type === 'error' ? 'border-rose-200' :
      type === 'warning' ? 'border-amber-200' :
      'border-purple-200'
    }`;

    const iconMap = {
      success: { icon: 'check_circle', color: 'text-emerald-500 bg-emerald-50' },
      error: { icon: 'error', color: 'text-rose-500 bg-rose-50' },
      warning: { icon: 'warning', color: 'text-amber-500 bg-amber-50' },
      info: { icon: 'info', color: 'text-purple-600 bg-purple-50' }
    };

    const cfg = iconMap[type] || iconMap.info;

    toast.innerHTML = `
      <div class="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${cfg.color}">
        <span class="material-symbols-outlined text-[20px]">${cfg.icon}</span>
      </div>
      <div class="flex-1 min-w-0">
        ${title ? `<h4 class="text-xs font-bold text-slate-900">${title}</h4>` : ''}
        <p class="text-xs text-slate-600 mt-0.5 leading-relaxed">${message}</p>
      </div>
      <button onclick="this.parentElement.remove()" class="text-slate-400 hover:text-slate-600 p-1 -mr-1">
        <span class="material-symbols-outlined text-[16px]">close</span>
      </button>
    `;

    this.container.appendChild(toast);

    // Trigger animation
    requestAnimationFrame(() => {
      toast.classList.remove('translate-y-4', 'opacity-0');
      toast.classList.add('translate-y-0', 'opacity-100');
    });

    // Auto remove after 4.5s
    setTimeout(() => {
      toast.classList.remove('translate-y-0', 'opacity-100');
      toast.classList.add('translate-y-2', 'opacity-0');
      setTimeout(() => toast.remove(), 300);
    }, 4500);
  },

  success(msg, title = 'Berhasil') { this.show(msg, 'success', title); },
  error(msg, title = 'Perhatian') { this.show(msg, 'error', title); },
  warning(msg, title = 'Peringatan') { this.show(msg, 'warning', title); },
  info(msg, title = 'Informasi') { this.show(msg, 'info', title); }
};

window.Toast = Toast;
