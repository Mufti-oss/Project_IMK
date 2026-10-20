/**
 * GUNADARMA PARK - Authentication & Role Manager
 */
const Auth = {
  init() {
    this.renderUserBadge();
    window.addEventListener('gundar:user-changed', () => this.renderUserBadge());
  },

  getCurrentUser() {
    return window.GunadarmaDB.getUser();
  },

  isLoggedIn() {
    return !!localStorage.getItem('gundar_user');
  },

  login(role, username, password) {
    if (role === 'admin') {
      window.GunadarmaDB.setUser(DEFAULT_USERS.admin);
      window.Toast.success('Selamat datang, Admin Masuk sebagai Super Admin.', 'Login Admin Berhasil');
      return { success: true, role: 'admin', user: DEFAULT_USERS.admin };
    } else {
      window.GunadarmaDB.setUser(DEFAULT_USERS.user);
      window.Toast.success('Selamat datang, Dimas Arya Pratama. Masuk sebagai Mahasiswa / Dosen.', 'Login Berhasil');
      return { success: true, role: 'user', user: DEFAULT_USERS.user };
    }
  },

  logout() {
    window.GunadarmaDB.logout();
    this.renderUserBadge();
    document.body.setAttribute('data-role', 'guest');
    window.Toast.info('Anda telah keluar dari akun.', 'Sampai Jumpa');
    if (typeof window.switchAppView === 'function') {
      window.switchAppView('login');
    } else {
      window.location.href = 'index.html#login';
    }
  },

  switchRole(targetRole) {
    window.GunadarmaDB.switchRole(targetRole);
    const u = this.getCurrentUser();
    if (u) {
      window.Toast.info(`Beralih ke mode ${u.role === 'admin' ? 'Admin Petugas' : 'Mahasiswa / Dosen'}`, 'Peran Diganti');
      if (typeof window.onRoleChanged === 'function') {
        window.onRoleChanged(u.role);
      }
    }
  },

  renderUserBadge() {
    const user = this.getCurrentUser();
    const badges = document.querySelectorAll('.auth-user-badge');
    if (!user) {
      badges.forEach(badge => { badge.innerHTML = ''; });
      return;
    }
    badges.forEach(badge => {
      const isAdmin = user.role === 'admin';
      badge.innerHTML = `
        <div class="relative group">
          <button class="flex items-center gap-2 p-1.5 sm:px-3 sm:py-1.5 rounded-xl bg-surface-container-low hover:bg-surface-container transition-all text-left">
            <div class="w-8 h-8 rounded-full ${isAdmin ? 'bg-amber-600' : 'bg-primary'} text-white flex items-center justify-center font-bold text-xs shadow-sm">
              <span class="material-symbols-outlined text-[18px]">${isAdmin ? 'admin_panel_settings' : 'person'}</span>
            </div>
            <div class="hidden md:flex flex-col">
              <div class="flex items-center gap-1.5">
                <span class="font-bold text-xs text-on-surface truncate max-w-[120px]">${user.name.split(' ')[0]}</span>
                <span class="px-1.5 py-0.2 rounded text-[10px] font-bold ${isAdmin ? 'bg-amber-100 text-amber-800' : 'bg-primary-fixed text-on-primary-fixed'}">
                  ${isAdmin ? 'ADMIN' : 'MHS/DSN'}
                </span>
              </div>
              <span class="text-[10px] text-on-surface-variant truncate">${isAdmin ? 'Super Admin' : user.npm}</span>
            </div>
            <span class="material-symbols-outlined text-slate-400 text-[18px]">expand_more</span>
          </button>

          <!-- Dropdown Menu -->
          <div class="absolute right-0 top-full mt-1.5 w-60 bg-white rounded-2xl shadow-xl border border-slate-100 p-2 hidden group-hover:block hover:block z-50">
            <div class="p-2.5 border-b border-slate-100">
              <p class="font-bold text-xs text-slate-800">${user.name}</p>
              <p class="text-[11px] text-slate-500 font-mono mt-0.5">${user.email}</p>
              <div class="mt-2 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${isAdmin ? 'bg-amber-50 text-amber-700 border border-amber-200' : 'bg-purple-50 text-purple-700 border border-purple-200'}">
                <span class="w-1.5 h-1.5 rounded-full ${isAdmin ? 'bg-amber-500' : 'bg-purple-600'}"></span>
                <span>${user.roleLabel}</span>
              </div>
            </div>

            <div class="py-1">
              ${isAdmin ? `
                <button onclick="switchAppView('admin-dashboard')" class="w-full text-left px-3 py-2 rounded-xl text-xs font-semibold hover:bg-slate-50 text-slate-700 flex items-center gap-2 transition-colors">
                  <span class="material-symbols-outlined text-[18px] text-amber-600">dashboard</span>
                  <span>Pusat Kendali Admin</span>
                </button>
              ` : `
                <button onclick="switchAppView('profil')" class="w-full text-left px-3 py-2 rounded-xl text-xs font-semibold hover:bg-slate-50 text-slate-700 flex items-center gap-2 transition-colors">
                  <span class="material-symbols-outlined text-[18px] text-purple-600">manage_accounts</span>
                  <span>Profil &amp; Kendaraan Saya</span>
                </button>
                <button onclick="switchAppView('riwayat')" class="w-full text-left px-3 py-2 rounded-xl text-xs font-semibold hover:bg-slate-50 text-slate-700 flex items-center gap-2 transition-colors">
                  <span class="material-symbols-outlined text-[18px] text-slate-500">receipt_long</span>
                  <span>Riwayat Parkir Saya</span>
                </button>
              `}
            </div>

            <div class="pt-1 border-t border-slate-100">
              <button onclick="Auth.logout()" class="w-full text-left px-3 py-2 rounded-xl text-xs font-bold text-rose-600 hover:bg-rose-50 flex items-center gap-2 transition-colors">
                <span class="material-symbols-outlined text-[18px]">logout</span>
                <span>Keluar Akun (Logout)</span>
              </button>
            </div>
          </div>
        </div>
      `;
    });
  }
};

window.Auth = Auth;
