import { supabase } from './supabase-config.js';

// ================= SISTEM LOGIN ADMIN =================
const loginView = document.getElementById('loginView');
const appView = document.getElementById('appView');
const formLoginAdmin = document.getElementById('formLoginAdmin');

// Cek Sesi Admin
if (localStorage.getItem('sobatkita_admin_logged_in') === 'true') {
    showAppView();
}

formLoginAdmin.onsubmit = async (e) => {
    e.preventDefault();
    const btn = document.getElementById('btnLoginAdmin');
    btn.innerHTML = `<i data-lucide="loader-2" class="w-5 h-5 animate-spin mr-2"></i> Memeriksa...`;
    lucide.createIcons();
    document.getElementById('loginError').classList.add('hidden');

    const username = document.getElementById('adminUsername').value;
    const password = document.getElementById('adminPassword').value;

    // Cek kecocokan di database
    const { data, error } = await supabase
        .from('admin_akun')
        .select('*')
        .eq('username', username)
        .eq('password', password)
        .single();

    if (data) {
        localStorage.setItem('sobatkita_admin_logged_in', 'true');
        showAppView();
    } else {
        document.getElementById('loginError').classList.remove('hidden');
    }
    btn.innerHTML = `Masuk ke Dashboard`;
};

document.getElementById('btnLogoutAdmin').onclick = () => {
    localStorage.removeItem('sobatkita_admin_logged_in');
    appView.classList.add('hidden');
    loginView.classList.remove('hidden');
    formLoginAdmin.reset();
};

function showAppView() {
    loginView.classList.add('hidden');
    appView.classList.remove('hidden');
    // Mulai tarik data saat login berhasil
    fetchOrders(); 
}

// ================= ROUTING TAB (KODE LAMA TETAP SAMA) =================
// [PASTE KODE ROUTING TAB, DASHBOARD PESANAN, DAN CRUD PENGATURAN ANDA DI SINI]

// PENTING: Hapus pemanggilan `fetchOrders();` di baris paling bawah kode Anda,
// Karena data pesanan sekarang hanya akan dipanggil (di fetch) di dalam fungsi showAppView()
// setelah admin berhasil login.
// ================= ROUTING TAB =================
const navDashboard = document.getElementById('navDashboard');
const navSettings = document.getElementById('navSettings');
const viewDashboard = document.getElementById('viewDashboard');
const viewSettings = document.getElementById('viewSettings');

function switchTab(tab) {
    if(tab === 'dashboard') {
        viewDashboard.classList.remove('hidden');
        viewSettings.classList.add('hidden');
        
        navDashboard.classList.add('text-indigo-600', 'border-indigo-600');
        navDashboard.classList.remove('text-slate-500', 'border-transparent');
        
        navSettings.classList.add('text-slate-500', 'border-transparent');
        navSettings.classList.remove('text-indigo-600', 'border-indigo-600');
        
        fetchOrders();
    } else {
        viewDashboard.classList.add('hidden');
        viewSettings.classList.remove('hidden');
        
        navSettings.classList.add('text-indigo-600', 'border-indigo-600');
        navSettings.classList.remove('text-slate-500', 'border-transparent');
        
        navDashboard.classList.add('text-slate-500', 'border-transparent');
        navDashboard.classList.remove('text-indigo-600', 'border-indigo-600');
        
        fetchOngkir();
        fetchKurir();
    }
}

navDashboard.addEventListener('click', (e) => { e.preventDefault(); switchTab('dashboard'); });
navSettings.addEventListener('click', (e) => { e.preventDefault(); switchTab('settings'); });

// ================= DASHBOARD PESANAN =================
const modalOrder = document.getElementById('modalOrder');
const formOrder = document.getElementById('formOrder');
const orderTableBody = document.getElementById('orderTableBody');
const selectWilayah = document.getElementById('wilayah_ongkir');

document.getElementById('btnNewOrder').onclick = async () => {
    // Muat data wilayah untuk dropdown saat buka modal pesanan
    const { data } = await supabase.from('pengaturan_ongkir').select('*');
    selectWilayah.innerHTML = data.map(w => `<option value="${w.wilayah}">[Rp ${w.tarif.toLocaleString('id-ID')}] - ${w.wilayah}</option>`).join('');
    modalOrder.classList.remove('hidden');
};
document.getElementById('closeOrderModal').onclick = () => { modalOrder.classList.add('hidden'); formOrder.reset(); };
document.getElementById('closeReceiptModal').onclick = () => document.getElementById('modalReceipt').classList.add('hidden');

async function fetchOrders() {
    const { data, error } = await supabase.from('pesanan').select('*').order('created_at', { ascending: false });
    if (error) return;
    
    document.getElementById('totalOrders').innerText = data.length;
    document.getElementById('waitingOrders').innerText = data.filter(o => o.status === 'Menunggu Kurir').length;
    document.getElementById('completedOrders').innerText = data.filter(o => o.status === 'Selesai').length;

    orderTableBody.innerHTML = data.map(order => {
        let badge = order.status === 'Menunggu Kurir' ? 'bg-amber-100 text-amber-700 border-amber-200' :
                    order.status === 'Sedang Diantar' ? 'bg-blue-100 text-blue-700 border-blue-200' : 'bg-emerald-100 text-emerald-700 border-emerald-200';
        return `
            <tr class="hover:bg-slate-50 transition group">
                <td class="p-4 text-slate-800 font-medium">${order.no_resep}</td>
                <td class="p-4 text-slate-600">${order.nama_pasien}</td>
                <td class="p-4 text-slate-600 truncate max-w-xs">${order.alamat}</td>
                <td class="p-4"><span class="px-2.5 py-1 ${badge} border rounded-md text-xs font-medium">${order.status}</span></td>
                <td class="p-4 text-center">
                    <button onclick="showReceipt('${order.id}')" class="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded transition">
                        <i data-lucide="printer" class="w-4 h-4"></i>
                    </button>
                </td>
            </tr>
        `;
    }).join('');
    lucide.createIcons();
}

formOrder.onsubmit = async (e) => {
    e.preventDefault();
    const patokanAlamat = document.getElementById('alamat').value;
    const wilayahText = selectWilayah.value;
    
    const pesanan = {
        no_resep: document.getElementById('no_resep').value,
        nama_pasien: document.getElementById('nama_pasien').value,
        alamat: `${wilayahText} - ${patokanAlamat}` // Gabung wilayah dan detail jalan
    };

    const { data, error } = await supabase.from('pesanan').insert([pesanan]).select().single();
    if (!error) {
        modalOrder.classList.add('hidden');
        formOrder.reset();
        fetchOrders();
        showReceipt(data.id, data);
    }
};

window.showReceipt = async (id, orderData = null) => {
    if (!orderData) {
        const { data } = await supabase.from('pesanan').select('*').eq('id', id).single();
        orderData = data;
    }
    
    document.getElementById('receiptDetails').innerHTML = `
        <p class="flex justify-between border-b border-slate-200 pb-1 mb-1"><span class="text-slate-500">Resep</span> <strong class="text-slate-800">${orderData.no_resep}</strong></p>
        <p class="flex justify-between border-b border-slate-200 pb-1 mb-1"><span class="text-slate-500">Pasien</span> <strong class="text-slate-800">${orderData.nama_pasien}</strong></p>
        <p class="mt-2"><span class="block text-slate-500 text-xs mb-1">Alamat Tujuan</span> <span class="text-slate-800 block leading-tight">${orderData.alamat}</span></p>
    `;

    document.getElementById('qrcode').innerHTML = '';
    new QRCode(document.getElementById("qrcode"), { text: `${window.location.origin}/tracking.html?id=${id}`, width: 140, height: 140, colorDark : "#0f172a", colorLight : "#ffffff" });
    document.getElementById('modalReceipt').classList.remove('hidden');
};

// ================= CRUD ONGKIR =================
const modalOngkir = document.getElementById('modalOngkir');
const formOngkir = document.getElementById('formOngkir');
const ongkirTableBody = document.getElementById('ongkirTableBody');

document.getElementById('btnNewOngkir').onclick = () => { document.getElementById('ongkir_id').value = ''; document.getElementById('titleOngkir').innerText = 'Tambah Wilayah'; modalOngkir.classList.remove('hidden'); formOngkir.reset(); };
document.getElementById('closeOngkirModal').onclick = () => modalOngkir.classList.add('hidden');

async function fetchOngkir() {
    const { data } = await supabase.from('pengaturan_ongkir').select('*').order('wilayah', { ascending: true });
    ongkirTableBody.innerHTML = data.map(o => `
        <tr class="hover:bg-slate-50">
            <td class="p-4 text-slate-700">${o.wilayah}</td>
            <td class="p-4 text-slate-700 font-medium">Rp ${o.tarif.toLocaleString('id-ID')}</td>
            <td class="p-4 text-center">
                <button onclick="editOngkir('${o.id}', '${o.wilayah}', ${o.tarif})" class="text-blue-500 hover:text-blue-700 mx-1"><i data-lucide="edit" class="w-4 h-4"></i></button>
                <button onclick="deleteOngkir('${o.id}')" class="text-red-500 hover:text-red-700 mx-1"><i data-lucide="trash-2" class="w-4 h-4"></i></button>
            </td>
        </tr>
    `).join('');
    lucide.createIcons();
}

window.editOngkir = (id, wilayah, tarif) => {
    document.getElementById('titleOngkir').innerText = 'Edit Wilayah';
    document.getElementById('ongkir_id').value = id;
    document.getElementById('ongkir_wilayah').value = wilayah;
    document.getElementById('ongkir_tarif').value = tarif;
    modalOngkir.classList.remove('hidden');
};

window.deleteOngkir = async (id) => {
    if(confirm('Hapus wilayah ini?')) { await supabase.from('pengaturan_ongkir').delete().eq('id', id); fetchOngkir(); }
};

formOngkir.onsubmit = async (e) => {
    e.preventDefault();
    const id = document.getElementById('ongkir_id').value;
    const payload = { wilayah: document.getElementById('ongkir_wilayah').value, tarif: document.getElementById('ongkir_tarif').value };
    
    if(id) await supabase.from('pengaturan_ongkir').update(payload).eq('id', id);
    else await supabase.from('pengaturan_ongkir').insert([payload]);
    
    modalOngkir.classList.add('hidden');
    fetchOngkir();
};

// ================= CRUD KURIR =================
const modalKurir = document.getElementById('modalKurir');
const formKurir = document.getElementById('formKurir');
const kurirTableBody = document.getElementById('kurirTableBody');

document.getElementById('btnNewKurir').onclick = () => { document.getElementById('kurir_id').value = ''; document.getElementById('titleKurir').innerText = 'Tambah Kurir'; modalKurir.classList.remove('hidden'); formKurir.reset(); };
document.getElementById('closeKurirModal').onclick = () => modalKurir.classList.add('hidden');

async function fetchKurir() {
    const { data } = await supabase.from('kurir').select('*').order('created_at', { ascending: false });
    kurirTableBody.innerHTML = data.map(k => `
        <tr class="hover:bg-slate-50">
            <td class="p-4 text-slate-700">${k.nama}</td>
            <td class="p-4 text-slate-500">@${k.username}</td>
            <td class="p-4 text-slate-700">${k.no_hp}</td>
            <td class="p-4 text-center">
                <button onclick="editKurir('${k.id}', '${k.nama}', '${k.username}', '${k.no_hp}')" class="text-blue-500 hover:text-blue-700 mx-1"><i data-lucide="edit" class="w-4 h-4"></i></button>
                <button onclick="deleteKurir('${k.id}')" class="text-red-500 hover:text-red-700 mx-1"><i data-lucide="trash-2" class="w-4 h-4"></i></button>
            </td>
        </tr>
    `).join('');
    lucide.createIcons();
}

window.editKurir = (id, nama, username, no_hp) => {
    document.getElementById('titleKurir').innerText = 'Edit Kurir';
    document.getElementById('kurir_id').value = id;
    document.getElementById('kurir_nama').value = nama;
    document.getElementById('kurir_username').value = username;
    document.getElementById('kurir_nohp').value = no_hp;
    modalKurir.classList.remove('hidden');
};

window.deleteKurir = async (id) => {
    if(confirm('Hapus kurir ini?')) { await supabase.from('kurir').delete().eq('id', id); fetchKurir(); }
};

formKurir.onsubmit = async (e) => {
    e.preventDefault();
    const id = document.getElementById('kurir_id').value;
    const payload = { 
        nama: document.getElementById('kurir_nama').value, 
        username: document.getElementById('kurir_username').value,
        no_hp: document.getElementById('kurir_nohp').value
    };
    
    if(id) await supabase.from('kurir').update(payload).eq('id', id);
    else await supabase.from('kurir').insert([payload]);
    
    modalKurir.classList.add('hidden');
    fetchKurir();
};

// Init Data Pertama Kali
fetchOrders();
