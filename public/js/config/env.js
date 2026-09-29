/**
 * ==============================================================================
 * MEO CAFE - DYNAMIC ENVIRONMENT CONFIG LOADER
 * ==============================================================================
 * Mengambil konfigurasi dari server (/api/config) yang membaca file .env,
 * sehingga kredensial dan API keys tidak di-hardcode di file JavaScript client.
 */

window.ENV = (function() {
  const state = {
    SUPABASE_URL: "",
    SUPABASE_ANON_KEY: "",
    CAFE_NAME: "Meo Cafe",
    CAFE_TAGLINE: "Minimalist & Aesthetic Cafe",
    CAFE_ADDRESS: "Jl. Pelabuhan Tanjuk Priok No.10, Bakalan Krajan, Sukun, Malang",
    CAFE_MAPS_URL: "https://maps.app.goo.gl/834Rms4rBLfc3tZu7",
    OWNER_NAME: "Mega Octa",
    CAFE_CURRENCY: "Rp",
    CAFE_TAX_PERCENT: 10,
    CAFE_SERVICE_PERCENT: 0,
    PAGE_SIZE: 8,
    isLoaded: false,
    _loadPromise: null,

    async init() {
      if (this._loadPromise) return this._loadPromise;
      
      this._loadPromise = (async () => {
        try {
          const res = await fetch('/api/config');
          if (res.ok) {
            const data = await res.json();
            if (data.SUPABASE_URL) this.SUPABASE_URL = data.SUPABASE_URL;
            if (data.SUPABASE_ANON_KEY) this.SUPABASE_ANON_KEY = data.SUPABASE_ANON_KEY;
            if (data.CAFE_NAME) this.CAFE_NAME = data.CAFE_NAME;
            if (data.CAFE_ADDRESS) this.CAFE_ADDRESS = data.CAFE_ADDRESS;
            if (data.OWNER_NAME) this.OWNER_NAME = data.OWNER_NAME;
          }
        } catch (err) {
          console.warn('[ENV] Server config unavailable, checking localStorage fallback.');
        }

        // LocalStorage override if provided
        const customUrl = localStorage.getItem('MEO_SUPABASE_URL');
        const customKey = localStorage.getItem('MEO_SUPABASE_ANON_KEY');
        if (customUrl) this.SUPABASE_URL = customUrl.trim();
        if (customKey) this.SUPABASE_ANON_KEY = customKey.trim();

        this.isLoaded = true;
        return this;
      })();

      return this._loadPromise;
    },

    saveCustomCredentials(url, key) {
      if (url) localStorage.setItem('MEO_SUPABASE_URL', url.trim());
      if (key) localStorage.setItem('MEO_SUPABASE_ANON_KEY', key.trim());
      if (url) this.SUPABASE_URL = url.trim();
      if (key) this.SUPABASE_ANON_KEY = key.trim();
    }
  };

  // Trigger init immediately
  state.init();

  return state;
})();
