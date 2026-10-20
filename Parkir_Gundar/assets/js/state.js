/**
 * GUNADARMA PARK - Central State & Data Management
 * Handles localStorage persistence, mock data, and cross-view updates.
 */

const STORAGE_KEYS = {
  USER: 'gundar_user',
  SLOTS: 'gundar_slots',
  ACTIVE_TICKET: 'gundar_active_ticket',
  HISTORY: 'gundar_history',
  NOTIFICATIONS: 'gundar_notifications',
  AREAS: 'gundar_areas',
  GATE_STATUS: 'gundar_gate_status'
};

// Initial default user profiles
const DEFAULT_USERS = {
  user: {
    id: 'user-01',
    name: 'Dimas Arya Pratama',
    email: 'dimas.arya@student.gunadarma.ac.id',
    npm: '50421899',
    role: 'user',
    roleLabel: 'Mahasiswa Reguler',
    faculty: 'Teknik Informatika / FTI',
    campus: 'Kampus D - Margonda Depok',
    phone: '+62 812-9842-8819',
    balance: 58000,
    avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80',
    vehicles: [
      { plate: 'B 4821 KFA', type: 'motor', name: 'Honda Vario 160 CC', isDefault: true, color: 'Hitam Doff' },
      { plate: 'B 1928 EZA', type: 'mobil', name: 'Toyota Raize 1.0T', isDefault: false, color: 'Putih Pearl' }
    ]
  },
  admin: {
    id: 'admin-01',
    name: 'Admin',
    email: 'admin.parkir.kampusd@gunadarma.ac.id',
    nip: '197804122005011002',
    role: 'admin',
    roleLabel: 'Super Admin Fasilitas & Gate',
    department: 'Biro Fasilitas & Keamanan Kampus (BAPSI)',
    campus: 'Semua Kampus (D, E, G, H, J)',
    phone: '+62 811-2345-6789',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=150&q=80'
  }
};

// Default Parking Areas
const DEFAULT_AREAS = [
  {
    id: 'g2-d',
    name: 'Gedung 2 - Parkir Utama',
    campus: 'Kampus D - Margonda',
    campusCode: 'D',
    type: 'Motor & Mobil',
    vehicleCategory: 'both',
    totalSlots: 80,
    availableSlots: 32,
    rateMotor: 2000,
    rateMobil: 5000,
    distance: '30m dari Gerbang Utama',
    status: 'Tersedia',
    features: ['Atap Kanopi', 'CCTV 24 Jam', 'Dekat Lift', 'Sensor IoT']
  },
  {
    id: 'b4-d',
    name: 'Basement Gedung 4',
    campus: 'Kampus D - Margonda',
    campusCode: 'D',
    type: 'Mobil & Dosen',
    vehicleCategory: 'mobil',
    totalSlots: 50,
    availableSlots: 8,
    rateMotor: 2000,
    rateMobil: 5000,
    distance: '60m dari Akses Gerbang D',
    status: 'Hampir Penuh',
    features: ['Indoor Ber-AC', 'CCTV 24 Jam', 'Akses Langsung Aula', 'Sensor IoT']
  },
  {
    id: 'fti-d',
    name: 'Pelataran Terbuka FTI',
    campus: 'Kampus D - Margonda',
    campusCode: 'D',
    type: 'Khusus Motor Mahasiswa',
    vehicleCategory: 'motor',
    totalSlots: 120,
    availableSlots: 46,
    rateMotor: 2000,
    rateMobil: 5000,
    distance: '15m dari Gedung FTI',
    status: 'Tersedia Luas',
    features: ['Akses Cepat', 'Fast-Pass RFID', 'Pos Keamanan']
  },
  {
    id: 'j1-j',
    name: 'Gedung Parkir Baru J1',
    campus: 'Kampus J - Kalimalang',
    campusCode: 'J',
    type: 'Multi-Lantai Motor & Mobil',
    vehicleCategory: 'both',
    totalSlots: 250,
    availableSlots: 96,
    rateMotor: 2000,
    rateMobil: 5000,
    distance: '10m dari Gerbang Kalimalang',
    status: 'Tersedia Luas',
    features: ['Gedung 3 Lantai', 'Sensor Tiap Petak', 'Kamera LPR Plat Nomor']
  },
  {
    id: 'e1-e',
    name: 'Area Parkir Utama Kampus E',
    campus: 'Kampus E - Kelapa Dua',
    campusCode: 'E',
    type: 'Motor & Mobil',
    vehicleCategory: 'both',
    totalSlots: 90,
    availableSlots: 40,
    rateMotor: 2000,
    rateMobil: 5000,
    distance: 'Dekat Perpustakaan Kampus E',
    status: 'Tersedia',
    features: ['Atap Peneduh', 'CCTV', 'Akses Gerbang Otomatis']
  }
];

// Default Interactive Slots (Gedung 2 - Lantai 1)
const DEFAULT_SLOTS = [
  { id: 'A-01', row: 'A', status: 'occupied', plate: 'B 3321 UGH', vehicle: 'motor', distance: '12m dari lift', powerOutlet: false },
  { id: 'A-02', row: 'A', status: 'available', plate: null, vehicle: 'motor', distance: '15m dari lift', powerOutlet: true },
  { id: 'A-03', row: 'A', status: 'available', plate: null, vehicle: 'motor', distance: '18m dari lift', powerOutlet: false },
  { id: 'A-04', row: 'A', status: 'occupied', plate: 'B 1234 ABC', vehicle: 'motor', distance: '21m dari lift', powerOutlet: false },
  { id: 'A-05', row: 'A', status: 'maintenance', plate: null, vehicle: 'motor', distance: '24m dari lift', powerOutlet: false, note: 'Perbaikan sensor lantai' },
  { id: 'A-06', row: 'A', status: 'available', plate: null, vehicle: 'motor', distance: '27m dari lift', powerOutlet: true },

  { id: 'B-01', row: 'B', status: 'available', plate: null, vehicle: 'mobil', distance: '10m dari lift', powerOutlet: true },
  { id: 'B-02', row: 'B', status: 'occupied', plate: 'B 8872 KLA', vehicle: 'mobil', distance: '14m dari lift', powerOutlet: false },
  { id: 'B-03', row: 'B', status: 'available', plate: null, vehicle: 'mobil', distance: '18m dari lift', powerOutlet: false },
  { id: 'B-04', row: 'B', status: 'available', plate: null, vehicle: 'mobil', distance: '22m dari lift', powerOutlet: true },
  { id: 'B-05', row: 'B', status: 'occupied', plate: 'B 5543 ZZA', vehicle: 'mobil', distance: '26m dari lift', powerOutlet: false },
  { id: 'B-06', row: 'B', status: 'available', plate: null, vehicle: 'mobil', distance: '30m dari lift', powerOutlet: false }
];

// Default Past Parking History
const DEFAULT_HISTORY = [
  {
    id: 'HIST-891',
    date: 'Hari ini, 08:30 WIB',
    area: 'Gedung 2 - Lantai 1',
    slot: 'A-03',
    campus: 'Kampus D Margonda',
    vehicle: 'Honda Vario 160 (B 4821 KFA)',
    duration: '2 Jam 15 Menit',
    fee: 'Rp 4.000',
    status: 'Selesai',
    paymentMethod: 'UG-Pay Saldo Digital'
  },
  {
    id: 'HIST-890',
    date: 'Kemarin, 13:10 WIB',
    area: 'Pelataran Terbuka FTI',
    slot: 'FTI-14',
    campus: 'Kampus D Margonda',
    vehicle: 'Honda Vario 160 (B 4821 KFA)',
    duration: '3 Jam 40 Menit',
    fee: 'Rp 5.000',
    status: 'Selesai',
    paymentMethod: 'UG-Pay Saldo Digital'
  },
  {
    id: 'HIST-889',
    date: '15 Okt 2026, 09:00 WIB',
    area: 'Gedung Parkir Baru J1',
    slot: 'J1-B12',
    campus: 'Kampus J Kalimalang',
    vehicle: 'Toyota Raize (B 1928 EZA)',
    duration: '4 Jam 00 Menit',
    fee: 'Rp 11.000',
    status: 'Selesai',
    paymentMethod: 'QRIS Bank DKI / Mandiri'
  },
  {
    id: 'HIST-888',
    date: '12 Okt 2026, 10:15 WIB',
    area: 'Basement Gedung 4',
    slot: 'B4-02',
    campus: 'Kampus D Margonda',
    vehicle: 'Toyota Raize (B 1928 EZA)',
    duration: '1 Jam 30 Menit',
    fee: 'Rp 7.000',
    status: 'Selesai',
    paymentMethod: 'UG-Pay Saldo Digital'
  }
];

// Default Notifications
const DEFAULT_NOTIFICATIONS = [
  {
    id: 'notif-1',
    title: 'Sesi Parkir Baru Dikonfirmasi',
    desc: 'Reservasi slot A-03 Gedung 2 Kampus D telah siap. Tunjukkan KTM Digital di gerbang masuk.',
    time: 'Baru saja',
    isRead: false,
    type: 'success',
    icon: 'check_circle'
  },
  {
    id: 'notif-2',
    title: 'Pengingat Durasi Parkir (3 Jam)',
    desc: 'Kendaraan Anda B 4821 KFA telah terparkir selama 3 jam di Pelataran FTI. Estimasi tarif bertambah Rp 1.000.',
    time: '2 jam yang lalu',
    isRead: false,
    type: 'warning',
    icon: 'schedule'
  },
  {
    id: 'notif-3',
    title: 'Pemeliharaan Sensor Gerbang C',
    desc: 'Gerbang C Kampus D ditutup sementara untuk kalibrasi sensor IoT. Silakan gunakan Gerbang Utama A.',
    time: 'Kemarin',
    isRead: true,
    type: 'info',
    icon: 'build'
  }
];

// Central Database API
const DB = {
  // User Management
  getUser() {
    const raw = localStorage.getItem(STORAGE_KEYS.USER);
    if (!raw) {
      return null;
    }
    try {
      return JSON.parse(raw);
    } catch (e) {
      return null;
    }
  },

  setUser(userData) {
    localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(userData));
    window.dispatchEvent(new CustomEvent('gundar:user-changed', { detail: userData }));
  },

  switchRole(role) {
    if (role === 'admin') {
      this.setUser(DEFAULT_USERS.admin);
    } else {
      this.setUser(DEFAULT_USERS.user);
    }
  },

  logout() {
    localStorage.removeItem(STORAGE_KEYS.USER);
    localStorage.removeItem(STORAGE_KEYS.ACTIVE_TICKET);
    window.dispatchEvent(new CustomEvent('gundar:user-changed', { detail: null }));
  },

  // Slots
  getSlots() {
    const raw = localStorage.getItem(STORAGE_KEYS.SLOTS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.SLOTS, JSON.stringify(DEFAULT_SLOTS));
      return DEFAULT_SLOTS;
    }
    return JSON.parse(raw);
  },

  saveSlots(slots) {
    localStorage.setItem(STORAGE_KEYS.SLOTS, JSON.stringify(slots));
    window.dispatchEvent(new CustomEvent('gundar:slots-changed', { detail: slots }));
  },

  bookSlot(slotId, vehicleType, plate) {
    const slots = this.getSlots();
    const target = slots.find(s => s.id === slotId);
    if (!target) return { success: false, message: 'Slot tidak ditemukan' };
    if (target.status !== 'available') return { success: false, message: 'Slot sudah terisi atau tidak tersedia' };

    target.status = 'occupied';
    target.plate = plate || (vehicleType === 'mobil' ? 'B 1928 EZA' : 'B 4821 KFA');
    this.saveSlots(slots);

    // Create Active Ticket
    const ticket = {
      ticketId: `UG-${Math.floor(10000 + Math.random() * 90000)}`,
      slotId: slotId,
      area: 'Gedung 2 - Lantai 1',
      campus: 'Kampus D Margonda',
      plate: target.plate,
      vehicleType: vehicleType,
      startTime: new Date().toISOString(),
      qrCode: `UG-PARK-${slotId}-${Date.now()}`
    };

    localStorage.setItem(STORAGE_KEYS.ACTIVE_TICKET, JSON.stringify(ticket));

    // Add to history
    this.addHistory({
      id: ticket.ticketId,
      date: 'Hari ini, ' + new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' WIB',
      area: 'Gedung 2 - Lantai 1',
      slot: slotId,
      campus: 'Kampus D Margonda',
      vehicle: `${vehicleType === 'mobil' ? 'Toyota Raize' : 'Honda Vario 160'} (${target.plate})`,
      duration: 'Sesi Berjalan',
      fee: vehicleType === 'mobil' ? 'Rp 5.000 (Awal)' : 'Rp 2.000 (Awal)',
      status: 'Sedang Parkir',
      paymentMethod: 'UG-Pay Otomatis'
    });

    // Add Notification
    this.addNotification({
      title: `Slot ${slotId} Berhasil Dipesan!`,
      desc: `Tiket aktif ${ticket.ticketId} telah terbit. Silakan masuk via Gerbang A Kampus D.`,
      type: 'success',
      icon: 'local_parking'
    });

    window.dispatchEvent(new CustomEvent('gundar:ticket-created', { detail: ticket }));
    return { success: true, ticket };
  },

  releaseSlot(slotId) {
    const slots = this.getSlots();
    const target = slots.find(s => s.id === slotId);
    if (target) {
      target.status = 'available';
      target.plate = null;
      this.saveSlots(slots);
    }
    localStorage.removeItem(STORAGE_KEYS.ACTIVE_TICKET);
    window.dispatchEvent(new CustomEvent('gundar:ticket-cleared'));
  },

  getActiveTicket() {
    const raw = localStorage.getItem(STORAGE_KEYS.ACTIVE_TICKET);
    return raw ? JSON.parse(raw) : null;
  },

  // History
  getHistory() {
    const raw = localStorage.getItem(STORAGE_KEYS.HISTORY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify(DEFAULT_HISTORY));
      return DEFAULT_HISTORY;
    }
    return JSON.parse(raw);
  },

  addHistory(item) {
    const history = this.getHistory();
    history.unshift(item);
    localStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify(history));
    window.dispatchEvent(new CustomEvent('gundar:history-updated', { detail: history }));
  },

  // Notifications
  getNotifications() {
    const raw = localStorage.getItem(STORAGE_KEYS.NOTIFICATIONS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(DEFAULT_NOTIFICATIONS));
      return DEFAULT_NOTIFICATIONS;
    }
    return JSON.parse(raw);
  },

  addNotification(notif) {
    const list = this.getNotifications();
    list.unshift({
      id: `notif-${Date.now()}`,
      time: 'Baru saja',
      isRead: false,
      ...notif
    });
    localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(list));
    window.dispatchEvent(new CustomEvent('gundar:notif-updated', { detail: list }));
  },

  markAllNotificationsRead() {
    const list = this.getNotifications();
    list.forEach(n => n.isRead = true);
    localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(list));
    window.dispatchEvent(new CustomEvent('gundar:notif-updated', { detail: list }));
  },

  // Areas
  getAreas() {
    const raw = localStorage.getItem(STORAGE_KEYS.AREAS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.AREAS, JSON.stringify(DEFAULT_AREAS));
      return DEFAULT_AREAS;
    }
    return JSON.parse(raw);
  },

  // Admin Barrier Gate Toggle
  getGateStatus() {
    const raw = localStorage.getItem(STORAGE_KEYS.GATE_STATUS);
    if (!raw) {
      const initial = { gate1: 'Tutup', gate2: 'Tutup', gate3: 'Tutup', emergencyOpen: false };
      localStorage.setItem(STORAGE_KEYS.GATE_STATUS, JSON.stringify(initial));
      return initial;
    }
    return JSON.parse(raw);
  },

  setEmergencyGate(isOpen) {
    const current = this.getGateStatus();
    current.emergencyOpen = isOpen;
    current.gate1 = isOpen ? 'Buka Darurat' : 'Tutup';
    current.gate2 = isOpen ? 'Buka Darurat' : 'Tutup';
    current.gate3 = isOpen ? 'Buka Darurat' : 'Tutup';
    localStorage.setItem(STORAGE_KEYS.GATE_STATUS, JSON.stringify(current));
    window.dispatchEvent(new CustomEvent('gundar:gate-changed', { detail: current }));
    return current;
  }
};

window.GunadarmaDB = DB;
