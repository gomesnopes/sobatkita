import { supabase } from './supabase-config.js';

// DOM Elements
const loginView = document.getElementById('loginView');
const mainView = document.getElementById('mainView');
const scannerView = document.getElementById('scannerView');
const formLogin = document.getElementById('formLogin');
const courierOrders = document.getElementById('courierOrders');
let html5QrCode; // Instance untuk scanner

// Cek Sesi Login saat aplikasi dibuka
let currentKurirId = localStorage.getItem('sobatkita_kurir_id');
let currentKurirName = localStorage.getItem('sobatkita_kurir_name');

if (currentKurirId) {
    showMainView();
} else {
    loginView.classList.remove('hidden');
}

// ================= SISTEM LOGIN =================
formLogin.onsubmit = async (e) => {
    e.preventDefault();
    const btn = document.getElementById('btnLogin');
    btn.innerHTML = `<i data-lucide="loader-2" class="w-5 h-5 animate-spin mr-2"></i> Memeriksa...`;
    lucide.createIcons();
    document.getElementById('loginError').classList.add('hidden');

    const username = document.getElementById('loginUsername').value;
    const nohp = document.getElementById('loginNohp').value;

    const { data, error } = await supabase
        .from('kurir')
        .select('id, nama')
        .eq('username', username)
        .eq('no_hp', nohp)
        .single();

    if (data) {
        localStorage.setItem('sobatkita_kurir_id', data.id);
        localStorage.setItem('sobatkita_kurir_name', data.nama);
        currentKurirId = data.id;
        currentKurirName = data.nama;
        showMainView();
    } else {
        document.getElementById('loginError').classList.remove('hidden');
    }
    btn.innerHTML = `Masuk`;
};

document.getElementById('btnLogout').onclick = () => {
    localStorage.removeItem('sobatkita_kurir_id');
    localStorage.removeItem('sobatkita_kurir_name');
    mainView.classList.add('hidden');
    loginView.classList.remove('hidden');
    formLogin.reset();
};

function showMainView() {
    loginView.classList.add('hidden');
    mainView.classList.remove('hidden');
    document.getElementById('kurirNameDisplay').innerText = currentKurirName;
    loadMyOrders();
}

// ================= FETCH PESANAN =================
async function loadMyOrders() {
    const { data, error } = await supabase.from('pesanan')
        .select('*')
        .eq('kurir_id', currentKurirId)
        .eq('status', 'Sedang Diantar')
        .order('created_at', { ascending: false });
        
    if (data && data.length > 0) {
        courierOrders.innerHTML = data.map(order => `
            <div class="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
                <div class="flex justify-between items-start mb-3">
                    <span class="px-2.5 py-1 bg-blue-50 text-blue-700 border border-blue-100 rounded-md text-xs font-semibold">Sedang Diantar</span>
                    <span class="text-xs text-slate-400 font-medium uppercase">${order.no_resep}</span>
                </div>
                <h3 class="font-bold text-lg text-slate-800 mb-1">${order.nama_pasien}</h3>
                <div class="flex items-start text-sm text-slate-600 mb-4 bg-slate-50 p-3 rounded-lg border border-slate-100">
                    <i data-lucide="map-pin" class="w-4 h-4 mr-2 mt-0.5 text-slate-400 flex-shrink-0"></i>
                    <span>${order.alamat}</span>
                </div>
                <button onclick="finishOrder('${order.id}')" class="w-full bg-slate-900 text-white py-2.5 rounded-lg text-sm font-medium hover:bg-slate-800 transition">
                    Pesanan Selesai / Sampai
                </button>
            </div>
        `).join('');
    } else {
        courierOrders.innerHTML = `
            <div class="text-center py-10 bg-white rounded-xl border border-dashed border-slate-300">
                <i data-lucide="package-open" class="w-10 h-10 mx-auto text-slate-300 mb-2"></i>
                <p class="text-slate-500 text-sm">Belum ada pesanan yang diantar.</p>
            </div>
        `;
    }
    lucide.createIcons();
}

window.finishOrder = async (id) => {
    if(confirm("Apakah obat sudah sampai di tangan pasien?")) {
        await supabase.from('pesanan').update({ status: 'Selesai' }).eq('id', id);
        loadMyOrders();
    }
};

// ================= FITUR SCAN QR =================
document.getElementById('btnOpenScanner').onclick = () => {
    scannerView.classList.remove('hidden');
    mainView.classList.add('hidden');
    
    // Inisialisasi library HTML5QRCode pada elemen div 'reader'
    html5QrCode = new Html5Qrcode("reader");
    const config = { fps: 10, qrbox: { width: 250, height: 250 } };

    html5QrCode.start({ facingMode: "environment" }, config, onScanSuccess)
        .catch(err => {
            alert("Kamera tidak dapat diakses. Pastikan Anda memberi izin kamera.");
            closeScanner();
        });
};

document.getElementById('btnCloseScanner').onclick = closeScanner;

function closeScanner() {
    if (html5QrCode) {
        html5QrCode.stop().then(() => {
            html5QrCode.clear();
        }).catch(err => console.error("Gagal menghentikan kamera", err));
    }
    scannerView.classList.add('hidden');
    mainView.classList.remove('hidden');
}

async function onScanSuccess(decodedText) {
    // 1. Matikan kamera segera setelah berhasil scan agar tidak dobel scan
    closeScanner();
    
    try {
        // Asumsi format QR yang dihasilkan admin: https://domain.com/tracking.html?id=ORDER_ID
        const url = new URL(decodedText);
        const orderId = url.searchParams.get('id');

        if (!orderId) throw new Error("Format QR tidak valid.");

        // Cek dulu apakah pesanan ini masih 'Menunggu Kurir'
        const { data: orderData } = await supabase.from('pesanan').select('status').eq('id', orderId).single();
        
        if (orderData && orderData.status === 'Menunggu Kurir') {
            // Update pesanan menjadi milik kurir ini
            await supabase.from('pesanan').update({ 
                status: 'Sedang Diantar',
                kurir_id: currentKurirId 
            }).eq('id', orderId);
            
            alert("Pesanan berhasil diambil!");
            loadMyOrders();
        } else {
            alert("Gagal. Pesanan ini mungkin sudah diambil kurir lain atau sudah selesai.");
        }
    } catch (error) {
        alert("QR Code tidak valid. Pastikan Anda men-scan struk dari Admin SOBAT KITA.");
        console.error(error);
    }
}
