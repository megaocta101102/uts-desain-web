/**
 * ==============================================================================
 * MEO CAFE - USER MODEL (PLAIN TEXT PASSWORD & CASHIER MANAGEMENT)
 * ==============================================================================
 */

window.UserModel = {
  async getUsers() {
    return await window.AppDatabase.getUsers();
  },

  async authenticate(username, password) {
    const users = await this.getUsers();
    const user = users.find(u => 
      u.username.toLowerCase() === username.trim().toLowerCase() && 
      (u.password === password || u.password_hash === password)
    );

    if (!user) {
      throw new Error("Username atau password tidak valid.");
    }

    const sessionData = {
      id: user.id,
      username: user.username,
      fullName: user.full_name,
      role: user.role,
      password: user.password || user.password_hash || '',
      loggedInAt: new Date().toISOString()
    };

    localStorage.setItem('MEO_ACTIVE_SESSION', JSON.stringify(sessionData));
    return sessionData;
  },

  getCurrentSession() {
    const data = localStorage.getItem('MEO_ACTIVE_SESSION');
    if (!data) return null;
    try {
      return JSON.parse(data);
    } catch (e) {
      return null;
    }
  },

  logout() {
    localStorage.removeItem('MEO_ACTIVE_SESSION');
  },

  requireAuth(requiredRole = null) {
    const session = this.getCurrentSession();
    if (!session) {
      window.location.href = 'login.html';
      return null;
    }
    if (requiredRole && session.role !== requiredRole && session.role !== 'owner') {
      alert(`Akses ditolak. Halaman ini hanya untuk role: ${requiredRole}`);
      window.location.href = session.role === 'kasir' ? 'kasir.html' : 'owner-statistik.html';
      return null;
    }
    return session;
  },

  // CASHIER CRUD
  async getAllCashiers() {
    const users = await this.getUsers();
    return users.filter(u => u.role === 'kasir');
  },

  async createCashier({ username, password, full_name }) {
    if (!username || !password || !full_name) {
      throw new Error("Semua kolom (Nama, Username, Password) wajib diisi.");
    }
    
    const users = await this.getUsers();
    if (users.some(u => u.username.toLowerCase() === username.trim().toLowerCase())) {
      throw new Error("Username tersebut sudah digunakan.");
    }

    const newCashierData = {
      username: username.trim(),
      password: password.trim(),
      full_name: full_name.trim(),
      role: 'kasir'
    };

    const created = await window.AppDatabase.insertUser(newCashierData);
    return created;
  },

  async updateCashier(id, { username, password, full_name }) {
    if (!username || !password || !full_name) {
      throw new Error("Semua kolom wajib diisi.");
    }

    const users = await this.getUsers();
    const index = users.findIndex(u => u.id === id);
    if (index === -1) throw new Error("Kasir tidak ditemukan.");

    // Check username uniqueness if changed
    const duplicate = users.some(u => u.id !== id && u.username.toLowerCase() === username.trim().toLowerCase());
    if (duplicate) throw new Error("Username tersebut sudah digunakan oleh staf lain.");

    const updatedFields = {
      username: username.trim(),
      password: password.trim(),
      full_name: full_name.trim(),
      role: 'kasir'
    };

    await window.AppDatabase.updateUser(id, updatedFields);
    return { id, ...updatedFields };
  },

  async deleteCashier(id) {
    return await window.AppDatabase.deleteUser(id);
  },

  // OWNER PROFILE UPDATE
  async updateOwnerProfile({ username, password, full_name }) {
    const session = this.getCurrentSession();
    if (!session || session.role !== 'owner') throw new Error("Akses tidak sah.");

    const users = await this.getUsers();
    const currentOwner = users.find(u => u.role === 'owner' || u.id === session.id);
    const ownerId = currentOwner ? currentOwner.id : session.id;

    const updatedFields = {
      username: username.trim(),
      password: password.trim(),
      full_name: full_name.trim(),
      role: 'owner'
    };

    await window.AppDatabase.updateUser(ownerId, updatedFields);

    // Update active session
    const updatedSession = {
      ...session,
      username: username.trim(),
      fullName: full_name.trim(),
      password: password.trim()
    };
    localStorage.setItem('MEO_ACTIVE_SESSION', JSON.stringify(updatedSession));
    return updatedSession;
  }
};
