/**
 * GUNADARMA PARK - Main Web Application Controller
 */

let selectedSlotId = 'A-03';
let currentLoginRole = 'Mahasiswa/Dosen';
let calcVehicle = 'motor';
let areaFilterCampus = 'all';
let areaFilterVehicle = 'all';

// Initialize on DOM load
window.addEventListener('DOMContentLoaded', () => {
  window.Auth.init();
  initApp();
});

function initApp() {
  const isLogged = window.Auth.isLoggedIn();
  const user = window.Auth.getCurrentUser();
  document.body.setAttribute('data-role', isLogged && user ? user.role : 'guest');

  if (isLogged && user) {
    const hash = window.location.hash.replace('#', '');
    if (hash && hash !== 'login') {
      switchAppView(hash);
    } else if (user.role === 'admin') {
      switchAppView('admin-dashboard');
    } else {
      switchAppView('beranda');
    }
  } else {
    switchAppView('login');
  }

  // Listen to hashchange
  window.addEventListener('hashchange', () => {
    const hash = window.location.hash.replace('#', '');
    if (hash) {
      switchAppView(hash);
    }
  });

  // Initial renders
  renderParkingAreas();
  renderSlots();
  selectSlot('A-03');
  updateCalculator();
  renderHistory();
  renderNotifications();
  renderProfile();
  renderAdminSensorGrid();
  renderAdminLogs();
  updateActiveTicketUI();

  // Listen to state changes
  window.addEventListener('gundar:slots-changed', () => {
    renderSlots();
    renderParkingAreas();
    renderAdminSensorGrid();
  });

  window.addEventListener('gundar:ticket-created', () => {
    updateActiveTicketUI();
    renderHistory();
  });

  window.addEventListener('gundar:ticket-cleared', () => {
    updateActiveTicketUI();
    renderSlots();
  });

  window.addEventListener('gundar:notif-updated', () => {
    renderNotifications();
  });

  window.addEventListener('gundar:gate-changed', (e) => {
    updateGateUI(e.detail);
  });
}

// ---------------- ROUTER & VIEW SWITCHER (STRICT ROLE-BASED) ----------------
function switchAppView(viewName) {
  const isLogged = window.Auth.isLoggedIn();
  const user = window.Auth.getCurrentUser();

  // Guard 1: If not logged in, force login view
  if (!isLogged && viewName !== 'login') {
    viewName = 'login';
  }

  // Guard 2: STRICT SEPARATION - User CANNOT access Admin pages
  if (user && user.role === 'user' && viewName.startsWith('admin')) {
    window.Toast.error('Akses Dibatasi: Anda masuk sebagai Akun Mahasiswa. Halaman admin tidak dapat diakses.', 'Akses Ditolak');
    viewName = 'beranda';
  }

  // Guard 3: STRICT SEPARATION - Admin CANNOT access Student booking pages
  if (user && user.role === 'admin' && ['beranda', 'cari-parkir', 'denah-parkir', 'biaya'].includes(viewName)) {
    viewName = 'admin-dashboard';
  }

  // Hide all views
  document.querySelectorAll('.app-view').forEach(view => {
    view.classList.add('hidden');
  });

  // Target view mapping for admin sub-tabs
  let actualViewId = `view-${viewName}`;
  let scrollTargetId = null;

  if (viewName === 'admin-telemetry') {
    actualViewId = 'view-admin-dashboard';
    scrollTargetId = 'admin-sensor-grid';
  } else if (viewName === 'admin-logs') {
    actualViewId = 'view-admin-dashboard';
    scrollTargetId = 'admin-log-tbody';
  }

  // Show target view
  const target = document.getElementById(actualViewId);
  if (target) {
    target.classList.remove('hidden');
    if (history.replaceState) {
      history.replaceState(null, null, `#${viewName}`);
    }
  }

  // Header and Navigation visibility handling
  const mainHeader = document.getElementById('main-header');
  const navUser = document.getElementById('nav-user-links');
  const navAdmin = document.getElementById('nav-admin-links');
  const mobNav = document.getElementById('mobile-nav');
  const mainContainer = document.querySelector('main');

  if (viewName === 'login') {
    // ON LOGIN: HIDE EVERYTHING EXCEPT THE LOGIN SCREEN
    document.body.setAttribute('data-role', 'guest');
    if (mainHeader) { mainHeader.classList.add('hidden'); mainHeader.style.display = 'none'; }
    if (mobNav) { mobNav.classList.add('hidden'); mobNav.style.display = 'none'; }
    if (mainContainer) mainContainer.className = "flex-1 p-0";
  } else {
    // ON APP VIEWS: SHOW HEADER AND RELEVANT NAVIGATION ONLY
    document.body.setAttribute('data-role', user ? user.role : 'guest');
    if (mainHeader) { mainHeader.classList.remove('hidden'); mainHeader.style.display = 'block'; }
    if (mobNav) { mobNav.classList.remove('hidden'); mobNav.style.display = 'flex'; }
    if (mainContainer) mainContainer.className = "flex-1 pt-16 pb-20 md:pb-8";

    if (user && user.role === 'admin') {
      if (navUser) { navUser.classList.add('hidden'); navUser.style.display = 'none'; }
      if (navAdmin) { navAdmin.classList.remove('hidden'); navAdmin.style.display = 'flex'; }
      renderMobileNav('admin');
    } else {
      if (navAdmin) { navAdmin.classList.add('hidden'); navAdmin.style.display = 'none'; }
      if (navUser) { navUser.classList.remove('hidden'); navUser.style.display = 'flex'; }
      renderMobileNav('user');
    }
  }

  // Update desktop nav highlights
  document.querySelectorAll('.nav-btn').forEach(btn => {
    if (btn.getAttribute('data-view') === viewName) {
      btn.className = "nav-btn px-3.5 py-1.5 rounded-full transition-all bg-primary text-white font-bold shadow-sm";
    } else {
      btn.className = "nav-btn px-3.5 py-1.5 rounded-full transition-all text-on-surface-variant hover:text-on-surface";
    }
  });

  // Update mobile bottom nav highlights
  document.querySelectorAll('.mob-btn').forEach(btn => {
    if (btn.getAttribute('data-view') === viewName) {
      btn.classList.remove('text-slate-500');
      btn.classList.add('text-primary');
    } else {
      btn.classList.remove('text-primary');
      btn.classList.add('text-slate-500');
    }
  });

  if (scrollTargetId) {
    const el = document.getElementById(scrollTargetId);
    if (el) {
      setTimeout(() => el.scrollIntoView({ behavior: 'smooth', block: 'center' }), 100);
    }
  } else {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
}

// Render mobile bottom navigation tailored specifically to user role
function renderMobileNav(role) {
  const mobNav = document.getElementById('mobile-nav');
  if (!mobNav) return;

  if (role === 'admin') {
    mobNav.innerHTML = `
      <button onclick="switchAppView('admin-dashboard')" class="mob-btn p-1.5 flex flex-col items-center gap-0.5 text-primary" data-view="admin-dashboard">
        <span class="material-symbols-outlined text-[20px]">dashboard</span>
        <span class="text-[10px] font-bold">Kendali</span>
      </button>
      <button onclick="switchAppView('admin-telemetry')" class="mob-btn p-1.5 flex flex-col items-center gap-0.5 text-slate-500" data-view="admin-telemetry">
        <span class="material-symbols-outlined text-[20px]">sensors</span>
        <span class="text-[10px] font-bold">IoT</span>
      </button>
      <button onclick="switchAppView('admin-logs')" class="mob-btn p-1.5 flex flex-col items-center gap-0.5 text-slate-500" data-view="admin-logs">
        <span class="material-symbols-outlined text-[20px]">history</span>
        <span class="text-[10px] font-bold">Log</span>
      </button>
      <button onclick="switchAppView('profil')" class="mob-btn p-1.5 flex flex-col items-center gap-0.5 text-slate-500" data-view="profil">
        <span class="material-symbols-outlined text-[20px]">person</span>
        <span class="text-[10px] font-bold">Profil</span>
      </button>
    `;
  } else {
    mobNav.innerHTML = `
      <button onclick="switchAppView('beranda')" class="mob-btn p-1.5 flex flex-col items-center gap-0.5 text-primary" data-view="beranda">
        <span class="material-symbols-outlined text-[20px]">home</span>
        <span class="text-[10px] font-bold">Beranda</span>
      </button>
      <button onclick="switchAppView('cari-parkir')" class="mob-btn p-1.5 flex flex-col items-center gap-0.5 text-slate-500" data-view="cari-parkir">
        <span class="material-symbols-outlined text-[20px]">search</span>
        <span class="text-[10px] font-bold">Cari</span>
      </button>
      <button onclick="switchAppView('denah-parkir')" class="mob-btn p-1.5 flex flex-col items-center gap-0.5 text-slate-500" data-view="denah-parkir">
        <span class="material-symbols-outlined text-[20px]">map</span>
        <span class="text-[10px] font-bold">Denah</span>
      </button>
      <button onclick="switchAppView('biaya')" class="mob-btn p-1.5 flex flex-col items-center gap-0.5 text-slate-500" data-view="biaya">
        <span class="material-symbols-outlined text-[20px]">payments</span>
        <span class="text-[10px] font-bold">Tarif</span>
      </button>
      <button onclick="switchAppView('profil')" class="mob-btn p-1.5 flex flex-col items-center gap-0.5 text-slate-500" data-view="profil">
        <span class="material-symbols-outlined text-[20px]">person</span>
        <span class="text-[10px] font-bold">Profil</span>
      </button>
    `;
  }
}

// Brand logo click behavior based on role
function handleLogoClick() {
  const user = window.Auth.getCurrentUser();
  if (user && user.role === 'admin') {
    switchAppView('admin-dashboard');
  } else if (user) {
    switchAppView('beranda');
  } else {
    switchAppView('login');
  }
}

// ---------------- LOGIN HANDLING ----------------
function setLoginRole(role) {
  currentLoginRole = role;
  const cardUser = document.getElementById('login-role-user');
  const cardAdmin = document.getElementById('login-role-admin');
  const badgeUser = document.getElementById('badge-check-user');
  const badgeAdmin = document.getElementById('badge-check-admin');
  const title = document.getElementById('login-form-title');
  const lblId = document.getElementById('lbl-login-id');
  const inpId = document.getElementById('login-identity');
  const btnLabel = document.getElementById('btn-login-label');

  if (role === 'admin') {
    cardUser.className = "cursor-pointer p-4 rounded-2xl border-2 transition-all flex items-start gap-3.5 bg-white border-slate-200 hover:border-slate-300";
    badgeUser.classList.add('hidden');

    cardAdmin.className = "cursor-pointer p-4 rounded-2xl border-2 transition-all flex items-start gap-3.5 bg-amber-50/70 border-amber-500 shadow-sm";
    badgeAdmin.classList.remove('hidden');

    title.innerText = "Kredensial Petugas / Admin";
    lblId.innerText = "Email Kampus atau NIP Admin";
    inpId.placeholder = "admin.parkir.kampusd@gunadarma.ac.id";
    inpId.value = "admin.parkir.kampusd@gunadarma.ac.id";
    btnLabel.innerText = "Masuk sebagai Admin Fasilitas";
  } else {
    cardAdmin.className = "cursor-pointer p-4 rounded-2xl border-2 transition-all flex items-start gap-3.5 bg-white border-slate-200 hover:border-slate-300";
    badgeAdmin.classList.add('hidden');

    cardUser.className = "cursor-pointer p-4 rounded-2xl border-2 transition-all flex items-start gap-3.5 bg-purple-50/70 border-primary shadow-sm";
    badgeUser.classList.remove('hidden');

    title.innerText = "Kredensial Akun Mahasiswa";
    lblId.innerText = "Email Kampus atau NPM";
    inpId.placeholder = "dimas@student.gunadarma.ac.id atau 50421899";
    inpId.value = "dimas.arya@student.gunadarma.ac.id";
    btnLabel.innerText = "Masuk sebagai Pengguna Civitas";
  }
}

function quickLogin(role) {
  setLoginRole(role);
  window.Auth.login(role);
  window.Auth.renderUserBadge();
  renderProfile();
  if (role === 'admin') {
    switchAppView('admin-dashboard');
  } else {
    switchAppView('beranda');
  }
}

function handleFormLogin(e) {
  e.preventDefault();
  const btn = document.getElementById('btn-submit-login');
  const original = btn.innerHTML;
  btn.disabled = true;
  btn.innerHTML = `<span class="material-symbols-outlined animate-spin text-[18px]">progress_activity</span><span>Memverifikasi SSO Gunadarma...</span>`;

  setTimeout(() => {
    btn.disabled = false;
    btn.innerHTML = original;
    window.Auth.login(currentLoginRole);
    window.Auth.renderUserBadge();
    renderProfile();
    if (currentLoginRole === 'admin') {
      switchAppView('admin-dashboard');
    } else {
      switchAppView('beranda');
    }
  }, 600);
}

function togglePasswordView() {
  const inp = document.getElementById('login-password');
  const icon = document.getElementById('pass-eye-icon');
  if (inp.type === 'password') {
    inp.type = 'text';
    icon.textContent = 'visibility_off';
  } else {
    inp.type = 'password';
    icon.textContent = 'visibility';
  }
}

// ---------------- PARKING AREAS ----------------
function renderParkingAreas() {
  const areas = window.GunadarmaDB.getAreas();
  const search = (document.getElementById('area-search-input')?.value || '').toLowerCase();
  
  const filtered = areas.filter(a => {
    const matchCampus = areaFilterCampus === 'all' || a.campusCode === areaFilterCampus;
    const matchVehicle = areaFilterVehicle === 'all' || a.vehicleCategory === 'both' || a.vehicleCategory === areaFilterVehicle;
    const matchSearch = !search || a.name.toLowerCase().includes(search) || a.campus.toLowerCase().includes(search);
    return matchCampus && matchVehicle && matchSearch;
  });

  // Render on View 3 (Cari Parkir)
  const grid = document.getElementById('parking-areas-grid');
  if (grid) {
    if (filtered.length === 0) {
      grid.innerHTML = `
        <div class="col-span-full py-12 text-center text-slate-400">
          <span class="material-symbols-outlined text-4xl mb-2 text-slate-300">location_off</span>
          <p class="text-sm font-semibold">Tidak ada area parkir yang sesuai filter.</p>
        </div>
      `;
    } else {
      grid.innerHTML = filtered.map(a => {
        const percent = Math.round(((a.totalSlots - a.availableSlots) / a.totalSlots) * 100);
        return `
          <div class="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm hover:shadow-md transition-all flex flex-col justify-between group">
            <div>
              <div class="flex items-start justify-between gap-2 mb-2">
                <span class="text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full ${
                  a.status.includes('Tersedia') ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-amber-50 text-amber-700 border border-amber-200'
                }">
                  ${a.status}
                </span>
                <span class="text-xs text-slate-400 font-semibold">${a.campus}</span>
              </div>

              <h3 class="font-display font-bold text-base text-slate-900 group-hover:text-primary transition-colors">${a.name}</h3>
              <p class="text-xs text-slate-500 mt-0.5">${a.distance} &bull; ${a.type}</p>

              <!-- Available count -->
              <div class="my-4 p-3.5 rounded-2xl bg-surface-container-low flex items-baseline justify-between">
                <div>
                  <span class="font-display font-black text-2xl text-emerald-600">${a.availableSlots}</span>
                  <span class="text-xs font-bold text-slate-800 ml-1">Slot Kosong</span>
                </div>
                <span class="text-xs text-slate-500">Kapasitas: ${a.totalSlots}</span>
              </div>

              <!-- Meter bar -->
              <div class="space-y-1">
                <div class="flex justify-between text-[11px] text-slate-500">
                  <span>Okupansi</span>
                  <span class="font-bold text-slate-700">${percent}%</span>
                </div>
                <div class="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                  <div class="h-full rounded-full transition-all duration-500 ${percent > 85 ? 'bg-rose-500' : percent > 60 ? 'bg-amber-500' : 'bg-emerald-500'}" style="width: ${percent}%;"></div>
                </div>
              </div>

              <!-- Features list -->
              <div class="flex flex-wrap gap-1.5 mt-3 pt-3 border-t border-slate-100">
                ${a.features.map(f => `<span class="text-[10px] font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md">${f}</span>`).join('')}
              </div>
            </div>

            <!-- Action CTA -->
            <div class="mt-5 pt-2">
              <button onclick="goToDenahFromArea('${a.id}')" class="w-full py-2.5 rounded-xl bg-primary hover:bg-primary-hover text-white font-bold text-xs shadow-sm transition-all flex items-center justify-center gap-1.5">
                <span class="material-symbols-outlined text-[16px]">map</span>
                <span>Lihat Denah &amp; Pilih Slot</span>
              </button>
            </div>
          </div>
        `;
      }).join('');
    }
  }

  // Render top 3 on Beranda
  const homeGrid = document.getElementById('home-area-cards');
  if (homeGrid) {
    homeGrid.innerHTML = areas.slice(0, 3).map(a => `
      <div class="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
        <div>
          <div class="flex items-center justify-between mb-2">
            <span class="text-[10px] font-bold px-2 py-0.5 rounded-full ${a.status.includes('Tersedia') ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}">${a.status}</span>
            <span class="text-xs text-slate-400 font-mono">${a.campusCode}</span>
          </div>
          <h4 class="font-bold text-sm text-slate-900">${a.name}</h4>
          <p class="text-xs text-slate-500 mt-0.5">${a.distance}</p>

          <div class="my-3 flex items-baseline gap-2">
            <span class="font-display font-black text-2xl text-emerald-600">${a.availableSlots}</span>
            <span class="text-xs text-slate-600 font-bold">Slot Kosong</span>
          </div>
        </div>

        <button onclick="goToDenahFromArea('${a.id}')" class="w-full py-2 rounded-xl bg-surface-container-low hover:bg-purple-50 text-primary font-bold text-xs transition-colors flex items-center justify-center gap-1">
          <span>Pilih Slot</span>
          <span class="material-symbols-outlined text-[16px]">chevron_right</span>
        </button>
      </div>
    `).join('');
  }
}

function filterParkingAreas() {
  areaFilterCampus = document.getElementById('filter-campus-select')?.value || 'all';
  renderParkingAreas();
}

function setVehicleFilter(type) {
  areaFilterVehicle = type;
  document.querySelectorAll('.vf-btn').forEach(b => {
    if (b.getAttribute('data-vf') === type) {
      b.className = "vf-btn active px-3 py-1.5 rounded-lg bg-white text-primary shadow-sm";
    } else {
      b.className = "vf-btn px-3 py-1.5 rounded-lg text-slate-600 hover:text-slate-900";
    }
  });
  renderParkingAreas();
}

function goToDenahFromArea(areaId) {
  switchAppView('denah-parkir');
  window.Toast.info('Memuat visual denah Gedung 2 Lantai 1...', 'Denah Interaktif');
}

// ---------------- INTERACTIVE SLOTS (DENAH PARKIR) ----------------
function renderSlots() {
  const slots = window.GunadarmaDB.getSlots();
  const rowA = slots.filter(s => s.row === 'A');
  const rowB = slots.filter(s => s.row === 'B');

  const containerA = document.getElementById('slots-row-a');
  const containerB = document.getElementById('slots-row-b');

  if (containerA) {
    containerA.innerHTML = rowA.map(s => renderSlotCard(s)).join('');
  }
  if (containerB) {
    containerB.innerHTML = rowB.map(s => renderSlotCard(s)).join('');
  }
}

function renderSlotCard(s) {
  const isSelected = s.id === selectedSlotId;
  const isAvailable = s.status === 'available';
  const isOccupied = s.status === 'occupied';
  const isMaint = s.status === 'maintenance';

  let bgClass = "bg-emerald-50 border-emerald-300 text-emerald-800 hover:bg-emerald-100";
  let statusText = "KOSONG";
  let icon = s.vehicle === 'mobil' ? 'directions_car' : 'two_wheeler';

  if (isOccupied) {
    bgClass = "bg-rose-50 border-rose-300 text-rose-800 cursor-not-allowed opacity-90";
    statusText = "TERISI";
  } else if (isMaint) {
    bgClass = "bg-amber-50 border-amber-300 text-amber-800 cursor-not-allowed opacity-80";
    statusText = "MAINT";
  }

  const selectedRing = isSelected ? "ring-4 ring-primary shadow-lg scale-105" : "hover:scale-[1.02]";

  return `
    <button onclick="selectSlot('${s.id}')" class="p-3 rounded-2xl border-2 transition-all flex flex-col items-center justify-between min-h-[96px] text-center ${bgClass} ${selectedRing}">
      <div class="flex items-center justify-between w-full text-[10px] font-bold">
        <span>${s.id}</span>
        <span class="material-symbols-outlined text-[14px]">${icon}</span>
      </div>

      <div class="my-1">
        ${isOccupied ? `<span class="font-mono text-[9px] font-bold block truncate max-w-[54px]">${s.plate || 'B 1234'}</span>` : ''}
        <span class="text-[10px] font-extrabold uppercase tracking-wider">${statusText}</span>
      </div>

      <span class="text-[9px] font-medium text-slate-500">${s.distance.split(' ')[0]}m lift</span>
    </button>
  `;
}

function selectSlot(slotId) {
  selectedSlotId = slotId;
  renderSlots();

  const slots = window.GunadarmaDB.getSlots();
  const slot = slots.find(s => s.id === slotId);
  if (!slot) return;

  const detId = document.getElementById('det-slot-id');
  const detSub = document.getElementById('det-slot-subtitle');
  const detStatus = document.getElementById('det-status-container');
  const detVeh = document.getElementById('det-vehicle-type');
  const detDist = document.getElementById('det-distance');
  const detOutlet = document.getElementById('det-outlet');
  const detRate = document.getElementById('det-rate');
  const detAction = document.getElementById('det-action-container');

  if (detId) detId.innerText = slot.id;
  if (detSub) detSub.innerText = `Gedung 2 \u2022 Lantai 1 \u2022 Area ${slot.vehicle === 'mobil' ? 'Mobil' : 'Motor'}`;
  if (detVeh) detVeh.innerText = slot.vehicle === 'mobil' ? 'Mobil (Roda Empat)' : 'Motor (Roda Dua)';
  if (detDist) detDist.innerText = slot.distance;
  if (detOutlet) detOutlet.innerText = slot.powerOutlet ? 'Tersedia Colokan' : 'Tidak Ada';
  if (detRate) detRate.innerText = slot.vehicle === 'mobil' ? 'Rp 5.000 / Jam' : 'Rp 2.000 / Jam';

  if (detStatus) {
    if (slot.status === 'available') {
      detStatus.innerHTML = `
        <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
          <span class="w-2 h-2 rounded-full bg-emerald-500"></span> Siap Dipesan (Kosong)
        </span>
      `;
    } else if (slot.status === 'occupied') {
      detStatus.innerHTML = `
        <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-800">
          <span class="w-2 h-2 rounded-full bg-rose-500"></span> Terisi oleh ${slot.plate || 'Kendaraan'}
        </span>
      `;
    } else {
      detStatus.innerHTML = `
        <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800">
          <span class="w-2 h-2 rounded-full bg-amber-500"></span> Dalam Perawatan Sensor
        </span>
      `;
    }
  }

  if (detAction) {
    if (slot.status === 'available') {
      detAction.innerHTML = `
        <button onclick="handleBookSelectedSlot()" class="w-full py-3.5 px-4 rounded-xl bg-primary hover:bg-primary-hover text-white font-display font-bold text-xs shadow-md shadow-primary/20 transition-all flex items-center justify-center gap-2">
          <span class="material-symbols-outlined text-[18px]">bookmark_add</span>
          <span>Pesan Slot Ini Sekarang</span>
        </button>
        <p class="text-[11px] text-slate-400 text-center mt-2">Reservasi tersimpan otomatis pada e-tiket Anda.</p>
      `;
    } else if (slot.status === 'occupied') {
      detAction.innerHTML = `
        <button disabled class="w-full py-3.5 px-4 rounded-xl bg-slate-200 text-slate-400 font-display font-bold text-xs cursor-not-allowed flex items-center justify-center gap-2">
          <span class="material-symbols-outlined text-[18px]">block</span>
          <span>Slot Sedang Terisi</span>
        </button>
        <p class="text-[11px] text-slate-400 text-center mt-2">Pilih slot lain yang bertanda hijau untuk memesan.</p>
      `;
    } else {
      detAction.innerHTML = `
        <button disabled class="w-full py-3.5 px-4 rounded-xl bg-slate-200 text-slate-400 font-display font-bold text-xs cursor-not-allowed flex items-center justify-center gap-2">
          <span class="material-symbols-outlined text-[18px]">build</span>
          <span>Sedang Dalam Perbaikan</span>
        </button>
      `;
    }
  }
}

function handleBookSelectedSlot() {
  const slots = window.GunadarmaDB.getSlots();
  const slot = slots.find(s => s.id === selectedSlotId);
  if (!slot) return;

  const user = window.Auth.getCurrentUser();
  const plate = user.vehicles?.[0]?.plate || 'B 4821 KFA';

  const res = window.GunadarmaDB.bookSlot(slot.id, slot.vehicle, plate);
  if (res.success) {
    window.Toast.success(`Slot ${slot.id} berhasil dipesan untuk plat ${res.ticket.plate}`, 'Reservasi Berhasil');
    renderSlots();
    selectSlot(slot.id);
    updateActiveTicketUI();
    openTicketModal();
  } else {
    window.Toast.error(res.message, 'Gagal Memesan');
  }
}

function updateActiveTicketUI() {
  const ticket = window.GunadarmaDB.getActiveTicket();
  const banner = document.getElementById('active-ticket-banner');
  if (!banner) return;

  if (ticket) {
    banner.classList.remove('hidden');
    document.getElementById('active-ticket-id').innerText = ticket.ticketId;
    document.getElementById('active-ticket-slot').innerText = ticket.slotId;
    document.getElementById('active-ticket-area').innerText = ticket.area;
    document.getElementById('active-ticket-plate').innerText = ticket.plate;

    // Fill modal ticket
    const mSlot = document.getElementById('m-ticket-slot');
    const mId = document.getElementById('m-ticket-id');
    const mArea = document.getElementById('m-ticket-area');
    const mPlate = document.getElementById('m-ticket-plate');
    if (mSlot) mSlot.innerText = `Slot ${ticket.slotId}`;
    if (mId) mId.innerText = `ID: ${ticket.ticketId}`;
    if (mArea) mArea.innerText = ticket.area;
    if (mPlate) mPlate.innerText = ticket.plate;
  } else {
    banner.classList.add('hidden');
  }
}

function releaseCurrentSlot() {
  const ticket = window.GunadarmaDB.getActiveTicket();
  if (ticket) {
    window.GunadarmaDB.releaseSlot(ticket.slotId);
    window.Toast.success(`Sesi parkir ${ticket.ticketId} selesai. Palang keluar terbuka. Terima kasih!`, 'Sesi Selesai');
  }
}

// ---------------- CALCULATOR ----------------
function calcSetVehicle(type) {
  calcVehicle = type;
  const btnMotor = document.getElementById('calc-btn-motor');
  const btnMobil = document.getElementById('calc-btn-mobil');

  if (type === 'motor') {
    btnMotor.className = "p-4 rounded-2xl border-2 border-primary bg-purple-50/70 text-left transition-all flex items-center gap-3";
    btnMobil.className = "p-4 rounded-2xl border-2 border-slate-200 bg-white hover:border-slate-300 text-left transition-all flex items-center gap-3";
  } else {
    btnMobil.className = "p-4 rounded-2xl border-2 border-primary bg-purple-50/70 text-left transition-all flex items-center gap-3";
    btnMotor.className = "p-4 rounded-2xl border-2 border-slate-200 bg-white hover:border-slate-300 text-left transition-all flex items-center gap-3";
  }

  updateCalculator();
}

function updateCalculator() {
  const slider = document.getElementById('calc-slider');
  const hours = parseInt(slider?.value || 3, 10);

  const durLabel = document.getElementById('calc-duration-label');
  const firstHourEl = document.getElementById('calc-first-hour');
  const extraLabel = document.getElementById('calc-extra-label');
  const extraCostEl = document.getElementById('calc-extra-cost');
  const totalCostEl = document.getElementById('calc-total-cost');

  if (durLabel) durLabel.innerText = `${hours} Jam`;

  const isMotor = calcVehicle === 'motor';
  const firstRate = isMotor ? 2000 : 5000;
  const nextRate = isMotor ? 1000 : 2000;
  const maxPlafon = isMotor ? 10000 : 25000;

  const extraHours = Math.max(0, hours - 1);
  const extraCost = extraHours * nextRate;
  const total = Math.min(firstRate + extraCost, maxPlafon);

  if (firstHourEl) firstHourEl.innerText = `Rp ${firstRate.toLocaleString('id-ID')}`;
  if (extraLabel) extraLabel.innerText = `${extraHours} Jam Berikutnya (@ Rp ${nextRate.toLocaleString('id-ID')}):`;
  if (extraCostEl) extraCostEl.innerText = `Rp ${extraCost.toLocaleString('id-ID')}`;
  if (totalCostEl) totalCostEl.innerText = `Rp ${total.toLocaleString('id-ID')}`;
}

// ---------------- HISTORY ----------------
function renderHistory() {
  const container = document.getElementById('history-records-container');
  if (!container) return;

  const history = window.GunadarmaDB.getHistory();
  if (history.length === 0) {
    container.innerHTML = `
      <div class="p-12 text-center text-slate-400">
        <span class="material-symbols-outlined text-4xl mb-2 text-slate-300">receipt_long</span>
        <p class="text-sm">Belum ada riwayat parkir.</p>
      </div>
    `;
    return;
  }

  container.innerHTML = history.map(h => `
    <div class="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-slate-300 transition-all">
      <div class="flex items-start gap-3.5">
        <div class="w-10 h-10 rounded-xl bg-purple-50 text-primary flex items-center justify-center flex-shrink-0">
          <span class="material-symbols-outlined text-[20px]">local_parking</span>
        </div>
        <div>
          <div class="flex items-center gap-2">
            <span class="text-xs font-bold text-slate-800">${h.area} &bull; Slot ${h.slot}</span>
            <span class="text-[10px] font-bold px-2 py-0.2 rounded-full ${h.status === 'Selesai' ? 'bg-emerald-50 text-emerald-700' : 'bg-purple-50 text-primary'}">${h.status}</span>
          </div>
          <p class="text-xs text-slate-500 mt-0.5">${h.vehicle} &bull; ${h.campus}</p>
          <span class="text-[11px] text-slate-400 font-mono mt-1 block">${h.date} (${h.duration})</span>
        </div>
      </div>

      <div class="flex items-center justify-between sm:justify-end gap-4 border-t sm:border-t-0 pt-3 sm:pt-0 border-slate-100">
        <div class="text-right">
          <span class="text-[10px] text-slate-400 block">${h.paymentMethod}</span>
          <span class="font-display font-black text-sm text-slate-800">${h.fee}</span>
        </div>
        <button onclick="Toast.info('E-Kwitansi tiket ${h.id} berhasil diverifikasi.', 'Bukti Parkir Valid')" class="p-2 rounded-xl hover:bg-slate-100 text-slate-500 hover:text-slate-800 transition-colors" title="Lihat Bukti">
          <span class="material-symbols-outlined text-[20px]">receipt</span>
        </button>
      </div>
    </div>
  `).join('');
}

// ---------------- NOTIFICATIONS ----------------
function renderNotifications() {
  const container = document.getElementById('notif-list-container');
  const badge = document.getElementById('notif-badge');
  const list = window.GunadarmaDB.getNotifications();

  const unreadCount = list.filter(n => !n.isRead).length;
  if (badge) {
    if (unreadCount > 0) {
      badge.classList.remove('hidden');
    } else {
      badge.classList.add('hidden');
    }
  }

  if (!container) return;

  if (list.length === 0) {
    container.innerHTML = `
      <div class="p-12 text-center text-slate-400">
        <span class="material-symbols-outlined text-4xl mb-2 text-slate-300">notifications_off</span>
        <p class="text-sm">Tidak ada notifikasi aktif.</p>
      </div>
    `;
    return;
  }

  container.innerHTML = list.map(n => `
    <div class="p-4 rounded-2xl border transition-all flex items-start gap-3.5 ${n.isRead ? 'bg-white border-slate-200' : 'bg-purple-50/50 border-purple-200 shadow-sm'}">
      <div class="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${
        n.type === 'success' ? 'bg-emerald-100 text-emerald-700' :
        n.type === 'warning' ? 'bg-amber-100 text-amber-700' :
        'bg-purple-100 text-primary'
      }">
        <span class="material-symbols-outlined text-[18px]">${n.icon || 'notifications'}</span>
      </div>
      <div class="flex-1 min-w-0">
        <div class="flex items-center justify-between gap-2">
          <h4 class="text-xs font-bold text-slate-900">${n.title}</h4>
          <span class="text-[10px] text-slate-400 whitespace-nowrap">${n.time}</span>
        </div>
        <p class="text-xs text-slate-600 mt-1 leading-relaxed">${n.desc}</p>
      </div>
    </div>
  `).join('');
}

function markAllNotificationsRead() {
  window.GunadarmaDB.markAllNotificationsRead();
  window.Toast.success('Seluruh pemberitahuan telah ditandai dibaca.', 'Notifikasi Bersih');
}

// ---------------- PROFILE ----------------
function renderProfile() {
  const user = window.Auth.getCurrentUser();
  const nameEl = document.getElementById('prof-name');
  const npmEl = document.getElementById('prof-npm');
  const emailEl = document.getElementById('prof-email');
  const badgeEl = document.getElementById('prof-role-badge');
  const heroName = document.getElementById('hero-user-name');

  if (nameEl) nameEl.innerText = user.name;
  if (heroName) heroName.innerText = user.name.split(' ')[0];
  if (npmEl) npmEl.innerText = user.npm ? `NPM: ${user.npm} \u2022 ${user.faculty}` : `NIP: ${user.nip} \u2022 ${user.department}`;
  if (emailEl) emailEl.innerText = user.email;
  if (badgeEl) badgeEl.innerText = user.roleLabel;

  const vehicleList = document.getElementById('profile-vehicle-list');
  if (vehicleList && user.vehicles) {
    vehicleList.innerHTML = user.vehicles.map(v => `
      <div class="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between">
        <div class="flex items-center gap-3">
          <div class="w-9 h-9 rounded-xl bg-purple-100 text-primary flex items-center justify-center">
            <span class="material-symbols-outlined text-[20px]">${v.type === 'mobil' ? 'directions_car' : 'two_wheeler'}</span>
          </div>
          <div>
            <div class="flex items-center gap-1.5">
              <span class="font-mono text-xs font-bold text-slate-900">${v.plate}</span>
              ${v.isDefault ? '<span class="text-[9px] font-bold px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800">Utama</span>' : ''}
            </div>
            <p class="text-[11px] text-slate-500">${v.name} (${v.color})</p>
          </div>
        </div>
      </div>
    `).join('');
  }
}

function openAddVehicleModal() {
  const plate = prompt('Masukkan Nomor Plat Kendaraan Baru (cth: B 9921 ZZZ):');
  if (plate) {
    const user = window.Auth.getCurrentUser();
    if (!user.vehicles) user.vehicles = [];
    user.vehicles.push({
      plate: plate.toUpperCase(),
      type: 'motor',
      name: 'Kendaraan Terdaftar',
      isDefault: false,
      color: 'Standar'
    });
    window.GunadarmaDB.setUser(user);
    renderProfile();
    window.Toast.success(`Nomor plat ${plate.toUpperCase()} berhasil ditambahkan ke profil!`, 'Kendaraan Terdaftar');
  }
}

// ---------------- ADMIN COMMAND CENTER ----------------
function renderAdminSensorGrid() {
  const container = document.getElementById('admin-sensor-grid');
  if (!container) return;

  const slots = window.GunadarmaDB.getSlots();
  container.innerHTML = slots.map(s => {
    const isOcc = s.status === 'occupied';
    return `
      <button onclick="toggleSlotSensor('${s.id}')" title="Klik untuk simulasi sensor masuk/keluar" class="p-3 rounded-2xl border-2 transition-all flex flex-col items-center justify-between text-center ${
        isOcc ? 'bg-rose-50 border-rose-300 text-rose-800' : 'bg-emerald-50 border-emerald-300 text-emerald-800'
      }">
        <span class="font-bold text-xs">${s.id}</span>
        <span class="w-3 h-3 rounded-full my-1 ${isOcc ? 'bg-rose-500' : 'bg-emerald-500 animate-pulse'}"></span>
        <span class="text-[9px] font-mono font-bold">${isOcc ? (s.plate || 'TERISI') : 'KOSONG'}</span>
      </button>
    `;
  }).join('');
}

function toggleSlotSensor(slotId) {
  const slots = window.GunadarmaDB.getSlots();
  const slot = slots.find(s => s.id === slotId);
  if (!slot) return;

  if (slot.status === 'available') {
    slot.status = 'occupied';
    slot.plate = 'B ' + Math.floor(1000 + Math.random() * 9000) + ' UG';
    window.Toast.info(`Sensor ${slotId} mendeteksi kedatangan kendaraan ${slot.plate}.`, 'Sensor Aktif');
  } else {
    slot.status = 'available';
    slot.plate = null;
    window.Toast.info(`Sensor ${slotId} mendeteksi kendaraan telah keluar. Slot kosong.`, 'Sensor Bebas');
  }

  window.GunadarmaDB.saveSlots(slots);
  renderSlots();
  renderAdminSensorGrid();
}

function renderAdminLogs() {
  const tbody = document.getElementById('admin-log-tbody');
  if (!tbody) return;

  const sampleLogs = [
    { time: '10:42 WIB', plate: 'B 4821 KFA', type: 'Motor (Vario)', gate: 'Gerbang A (Masuk)', user: 'Dimas Arya (Mhs)', status: 'Berhasil Masuk' },
    { time: '10:38 WIB', plate: 'B 1928 EZA', type: 'Mobil (Raize)', gate: 'Gerbang C (Keluar)', user: 'Dr. Hendra, M.Sc (Dosen)', status: 'Checkout Rp 10.000' },
    { time: '10:25 WIB', plate: 'B 3321 UGH', type: 'Motor (Beat)', gate: 'Gerbang B (Masuk)', user: 'Siti Sarah (Mhs)', status: 'Berhasil Masuk' },
    { time: '10:11 WIB', plate: 'B 7712 PLK', type: 'Mobil (Innova)', gate: 'Gerbang A (Masuk)', user: 'Tamu Rektorat', status: 'Tiket Tamu Manual' }
  ];

  tbody.innerHTML = sampleLogs.map(l => `
    <tr class="hover:bg-slate-50 transition-colors">
      <td class="py-3 px-4 font-mono text-slate-500">${l.time}</td>
      <td class="py-3 px-4 font-mono font-bold text-slate-900">${l.plate}</td>
      <td class="py-3 px-4 text-slate-600">${l.type}</td>
      <td class="py-3 px-4 text-slate-600">${l.gate}</td>
      <td class="py-3 px-4 text-slate-800 font-medium">${l.user}</td>
      <td class="py-3 px-4">
        <span class="px-2 py-0.5 rounded-full text-[10px] font-bold ${l.status.includes('Masuk') ? 'bg-emerald-50 text-emerald-700' : 'bg-purple-50 text-primary'}">
          ${l.status}
        </span>
      </td>
    </tr>
  `).join('');
}

function toggleEmergencyBarrier() {
  const current = window.GunadarmaDB.getGateStatus();
  const willOpen = !current.emergencyOpen;
  window.GunadarmaDB.setEmergencyGate(willOpen);

  if (willOpen) {
    window.Toast.warning('MODE DARURAT AKTIF: Seluruh palang gerbang Kampus dibuka otomatis!', 'Palang Pintu Terbuka');
  } else {
    window.Toast.success('Mode normal dipulihkan. Seluruh palang gerbang kembali pada mode sensor RFID.', 'Normal Kembali');
  }
}

function updateGateUI(status) {
  const g1 = document.getElementById('gate1-status');
  const g2 = document.getElementById('gate2-status');
  const g3 = document.getElementById('gate3-status');
  const btn = document.getElementById('btn-emergency-barrier');
  const btnText = document.getElementById('btn-emergency-text');
  const modeText = document.getElementById('barrier-mode-text');

  if (status.emergencyOpen) {
    if (g1) g1.className = "px-2.5 py-1 rounded-full bg-rose-100 text-rose-800 font-bold text-[10px]";
    if (g1) g1.innerText = "BUKA DARURAT";
    if (g2) g2.className = "px-2.5 py-1 rounded-full bg-rose-100 text-rose-800 font-bold text-[10px]";
    if (g2) g2.innerText = "BUKA DARURAT";
    if (g3) g3.className = "px-2.5 py-1 rounded-full bg-rose-100 text-rose-800 font-bold text-[10px]";
    if (g3) g3.innerText = "BUKA DARURAT";

    if (btn) btn.className = "px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs flex items-center gap-1.5 transition-all shadow-sm";
    if (btnText) btnText.innerText = "Tutup & Pulihkan Normal";
    if (modeText) modeText.innerText = "Status: DARURAT (TERBUKA SEMUA)";
  } else {
    if (g1) g1.className = "px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[10px]";
    if (g1) g1.innerText = "Tutup (Siap RFID)";
    if (g2) g2.className = "px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[10px]";
    if (g2) g2.innerText = "Tutup (Siap RFID)";
    if (g3) g3.className = "px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[10px]";
    if (g3) g3.innerText = "Tutup (Siap Tap)";

    if (btn) btn.className = "px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs flex items-center gap-1.5 transition-all shadow-sm";
    if (btnText) btnText.innerText = "Buka Palang Darurat";
    if (modeText) modeText.innerText = "Status: Otomatis RFID";
  }
}

function syncAdminData() {
  window.Toast.info('Menghubungkan ke gateway IoT Kampus D (Margonda)...', 'Sinkronisasi Telemetri');
  setTimeout(() => {
    window.Toast.success('Data 240 sensor slot dan 3 gate barrier telah tersinkronisasi 100%.', 'Sinkron Sukses');
  }, 700);
}

function printAdminReport() {
  window.Toast.success('Mempersiapkan dokumen Laporan Okupansi & Retribusi Harian (PDF)...', 'Cetak Laporan');
  setTimeout(() => {
    window.print();
  }, 500);
}

// ---------------- MODAL HELPERS ----------------
function openKTMModal() {
  const m = document.getElementById('modal-ktm');
  if (m) {
    m.classList.remove('hidden');
    m.classList.add('flex');
  }
}
function closeKTMModal() {
  const m = document.getElementById('modal-ktm');
  if (m) {
    m.classList.add('hidden');
    m.classList.remove('flex');
  }
}

function openTicketModal() {
  const m = document.getElementById('modal-ticket');
  if (m) {
    m.classList.remove('hidden');
    m.classList.add('flex');
  }
}
function closeTicketModal() {
  const m = document.getElementById('modal-ticket');
  if (m) {
    m.classList.add('hidden');
    m.classList.remove('flex');
  }
}

// Global Exports
window.switchAppView = switchAppView;
window.setLoginRole = setLoginRole;
window.quickLogin = quickLogin;
window.handleFormLogin = handleFormLogin;
window.togglePasswordView = togglePasswordView;
window.handleLogoClick = handleLogoClick;
window.selectSlot = selectSlot;
window.handleBookSelectedSlot = handleBookSelectedSlot;
window.releaseCurrentSlot = releaseCurrentSlot;
window.calcSetVehicle = calcSetVehicle;
window.updateCalculator = updateCalculator;
window.markAllNotificationsRead = markAllNotificationsRead;
window.openAddVehicleModal = openAddVehicleModal;
window.openKTMModal = openKTMModal;
window.closeKTMModal = closeKTMModal;
window.openTicketModal = openTicketModal;
window.closeTicketModal = closeTicketModal;
window.toggleSlotSensor = toggleSlotSensor;
window.toggleEmergencyBarrier = toggleEmergencyBarrier;
window.syncAdminData = syncAdminData;
window.printAdminReport = printAdminReport;
window.filterParkingAreas = filterParkingAreas;
window.setVehicleFilter = setVehicleFilter;
window.goToDenahFromArea = goToDenahFromArea;
