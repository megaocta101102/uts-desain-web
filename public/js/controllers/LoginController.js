/**
 * ==============================================================================
 * L'AZUR ARTISAN CAFE - LOGIN CONTROLLER (MVC: CONTROLLER LAYER)
 * ==============================================================================
 * Mengatur proses autentikasi kasir & owner dengan kemudahan switch role test
 */

document.addEventListener('DOMContentLoaded', () => {
  const loginForm = document.getElementById('loginForm');
  const usernameInput = document.getElementById('usernameInput');
  const passwordInput = document.getElementById('passwordInput');
  const roleTabs = document.querySelectorAll('.role-tab-btn');
  const errorAlert = document.getElementById('loginError');
  const fillKasirBtn = document.getElementById('fillKasirCreds');
  const fillOwnerBtn = document.getElementById('fillOwnerCreds');

  let selectedRole = 'kasir';

  // Quick fill helper
  if (fillKasirBtn) {
    fillKasirBtn.addEventListener('click', () => {
      usernameInput.value = 'kasir';
      passwordInput.value = 'kasir123';
      selectedRole = 'kasir';
      updateRoleTabs('kasir');
    });
  }

  if (fillOwnerBtn) {
    fillOwnerBtn.addEventListener('click', () => {
      usernameInput.value = 'owner';
      passwordInput.value = 'owner123';
      selectedRole = 'owner';
      updateRoleTabs('owner');
    });
  }

  function updateRoleTabs(role) {
    roleTabs.forEach(tab => {
      if (tab.getAttribute('data-role') === role) {
        tab.classList.add('active');
      } else {
        tab.classList.remove('active');
      }
    });
  }

  roleTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      selectedRole = tab.getAttribute('data-role');
      updateRoleTabs(selectedRole);
      if (selectedRole === 'kasir') {
        usernameInput.value = 'kasir';
        passwordInput.value = 'kasir123';
      } else {
        usernameInput.value = 'owner';
        passwordInput.value = 'owner123';
      }
    });
  });

  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      errorAlert.style.display = 'none';

      const username = usernameInput.value;
      const password = passwordInput.value;

      try {
        const session = await window.UserModel.authenticate(username, password);
        // Redirect sesuai role
        if (session.role === 'kasir') {
          window.location.href = 'kasir.html';
        } else if (session.role === 'owner') {
          window.location.href = 'owner-statistik.html';
        } else {
          window.location.href = 'index.html';
        }
      } catch (err) {
        errorAlert.textContent = err.message || "Gagal masuk. Periksa kembali akun Anda.";
        errorAlert.style.display = 'block';
      }
    });
  }
});
