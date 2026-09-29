/**
 * ==============================================================================
 * MEO CAFE - OWNER KASIR & PROFIL CONTROLLER (MVC: CONTROLLER LAYER)
 * ==============================================================================
 */

document.addEventListener('DOMContentLoaded', async () => {
  const session = window.UserModel.requireAuth('owner');
  if (!session) return;

  const state = {
    editingCashierId: null
  };

  // DOM Elements
  const ownerNameDisplay = document.getElementById('ownerNameDisplay');
  const logoutBtn = document.getElementById('logoutBtn');
  const cashierTableBody = document.getElementById('cashierTableBody');
  const addCashierBtn = document.getElementById('addCashierBtn');

  // Profile Form DOM
  const ownerProfileForm = document.getElementById('ownerProfileForm');
  const ownerFullNameInput = document.getElementById('ownerFullNameInput');
  const ownerUsernameInput = document.getElementById('ownerUsernameInput');
  const ownerPasswordInput = document.getElementById('ownerPasswordInput');
  const ownerCardName = document.getElementById('ownerCardName');
  const ownerAvatarLetter = document.getElementById('ownerAvatarLetter');

  // Cashier Modal DOM
  const cashierModal = document.getElementById('cashierModal');
  const cashierModalTitle = document.getElementById('cashierModalTitle');
  const closeCashierModal = document.getElementById('closeCashierModal');
  const cashierForm = document.getElementById('cashierForm');
  const cashierFullNameInput = document.getElementById('cashierFullNameInput');
  const cashierUsernameInput = document.getElementById('cashierUsernameInput');
  const cashierPasswordInput = document.getElementById('cashierPasswordInput');

  if (ownerNameDisplay) ownerNameDisplay.textContent = session.fullName;
  if (logoutBtn) logoutBtn.addEventListener('click', () => {
    window.UserModel.logout();
    window.location.href = 'login.html';
  });

  // Load Owner Profile Data
  async function loadOwnerProfile() {
    try {
      const users = await window.UserModel.getUsers();
      const currentOwner = users.find(u => u.role === 'owner') || session;

      if (ownerFullNameInput) ownerFullNameInput.value = currentOwner.full_name || session.fullName;
      if (ownerUsernameInput) ownerUsernameInput.value = currentOwner.username || session.username;
      if (ownerPasswordInput) ownerPasswordInput.value = currentOwner.password || 'owner123';
      if (ownerCardName) ownerCardName.textContent = currentOwner.full_name || session.fullName;
      
      const initials = (currentOwner.full_name || 'MO').split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
      if (ownerAvatarLetter) ownerAvatarLetter.textContent = initials || 'MO';
    } catch (e) {
      console.error(e);
    }
  }

  // Load Cashier List Table
  async function loadCashiers() {
    try {
      const cashiers = await window.UserModel.getAllCashiers();
      if (!cashierTableBody) return;

      if (cashiers.length === 0) {
        cashierTableBody.innerHTML = `
          <tr>
            <td colspan="5" style="text-align: center; color: var(--text-muted); padding: 24px;">
              Belum ada akun kasir terdaftar.
            </td>
          </tr>
        `;
        return;
      }

      cashierTableBody.innerHTML = cashiers.map(c => `
        <tr data-id="${c.id}">
          <td>
            <strong style="color: var(--navy-accent);">${c.full_name}</strong>
          </td>
          <td>${c.username}</td>
          <td>
            <span class="password-plain-tag">${c.password || c.password_hash || 'kasir123'}</span>
          </td>
          <td style="font-size: 0.8rem; color: var(--text-muted);">
            ${new Date(c.created_at || Date.now()).toLocaleDateString('id-ID', { dateStyle: 'medium' })}
          </td>
          <td>
            <div class="table-actions">
              <button class="action-icon-btn btn-edit-cashier" data-id="${c.id}" title="Edit Kasir">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
              </button>
              <button class="action-icon-btn delete btn-delete-cashier" data-id="${c.id}" title="Hapus Kasir">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
              </button>
            </div>
          </td>
        </tr>
      `).join('');

      // Event listeners on table buttons
      cashierTableBody.querySelectorAll('.btn-edit-cashier').forEach(btn => {
        btn.addEventListener('click', () => {
          const id = btn.getAttribute('data-id');
          const cashier = cashiers.find(c => c.id === id);
          if (cashier) openEditCashierModal(cashier);
        });
      });

      cashierTableBody.querySelectorAll('.btn-delete-cashier').forEach(btn => {
        btn.addEventListener('click', async () => {
          const id = btn.getAttribute('data-id');
          if (confirm("Hapus akun kasir ini? Kasir tersebut tidak dapat login lagi.")) {
            try {
              await window.UserModel.deleteCashier(id);
              await loadCashiers();
            } catch (err) {
              alert("Gagal menghapus: " + err.message);
            }
          }
        });
      });

    } catch (e) {
      console.error(e);
    }
  }

  // Modal Handlers
  function openAddCashierModal() {
    state.editingCashierId = null;
    cashierModalTitle.textContent = "Tambah Akun Kasir Baru";
    cashierForm.reset();
    cashierModal.classList.add('active');
  }

  function openEditCashierModal(cashier) {
    state.editingCashierId = cashier.id;
    cashierModalTitle.textContent = "Edit Akun Kasir";
    cashierFullNameInput.value = cashier.full_name;
    cashierUsernameInput.value = cashier.username;
    cashierPasswordInput.value = cashier.password || cashier.password_hash || 'kasir123';
    cashierModal.classList.add('active');
  }

  function closeCashierModalHandler() {
    cashierModal.classList.remove('active');
  }

  if (addCashierBtn) addCashierBtn.addEventListener('click', openAddCashierModal);
  if (closeCashierModal) closeCashierModal.addEventListener('click', closeCashierModalHandler);

  // Submit Cashier Form (Create / Edit)
  if (cashierForm) {
    cashierForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const payload = {
        full_name: cashierFullNameInput.value.trim(),
        username: cashierUsernameInput.value.trim(),
        password: cashierPasswordInput.value.trim()
      };

      try {
        if (state.editingCashierId) {
          await window.UserModel.updateCashier(state.editingCashierId, payload);
        } else {
          await window.UserModel.createCashier(payload);
        }
        closeCashierModalHandler();
        await loadCashiers();
        alert("Akun kasir berhasil disimpan.");
      } catch (err) {
        alert(err.message || "Gagal menyimpan akun kasir.");
      }
    });
  }

  // Submit Owner Profile Form
  if (ownerProfileForm) {
    ownerProfileForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const payload = {
        full_name: ownerFullNameInput.value.trim(),
        username: ownerUsernameInput.value.trim(),
        password: ownerPasswordInput.value.trim()
      };

      try {
        const updated = await window.UserModel.updateOwnerProfile(payload);
        ownerCardName.textContent = updated.fullName;
        ownerNameDisplay.textContent = updated.fullName;
        const initials = updated.fullName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
        ownerAvatarLetter.textContent = initials || 'MO';
        alert("Profil owner berhasil diperbarui!");
      } catch (err) {
        alert(err.message || "Gagal memperbarui profil.");
      }
    });
  }

  await loadOwnerProfile();
  await loadCashiers();
});
