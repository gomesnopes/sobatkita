import { supabase } from './supabase-config.js';

// Dummy Auth state untuk contoh. Idealnya gunakan Supabase Auth/Session.
const currentKurirId = "ID_KURIR_SETELAH_LOGIN"; 

const scannerContainer = document.getElementById('scannerContainer');
const courierOrders = document.getElementById('courierOrders');
let html5QrcodeScanner;

// Initialize Scanner
document.getElementById('btnScan').onclick = () => {
    scannerContainer.classList.remove('hidden');
    html5QrcodeScanner = new Html5QrcodeScanner("reader", { fps: 10, qrbox: {width: 250, height: 250} }, false);
    html5QrcodeScanner.render(onScanSuccess, onScanFailure);
};

document.getElementById('closeScanner').onclick = () => {
    if(html5QrcodeScanner) html5QrcodeScanner.clear();
    scannerContainer.classList.add('hidden');
};

async function onScanSuccess(decodedText, decodedResult) {
    html5QrcodeScanner.clear();
    scannerContainer.classList.add('hidden');
    
    // Asumsi decodedText adalah URL yang mengandung ?id=ORDER_ID
    const urlParams = new URLSearchParams(new URL(decodedText).search);
    const orderId = urlParams.get('id');

    if(orderId) {
        // Update status pesanan di admin
        await supabase.from('pesanan').update({ 
            status: 'Sedang Diantar',
            kurir_id: currentKurirId 
        }).eq('id', orderId);
        
        alert("Pesanan berhasil diambil!");
        loadMyOrders();
    }
}

function onScanFailure(error) { /* handle scan silent error */ }

async function loadMyOrders() {
    const { data, error } = await supabase.from('pesanan')
        .select('*').eq('kurir_id', currentKurirId).eq('status', 'Sedang Diantar');
        
    if (data) {
        courierOrders.innerHTML = data.map(order => `
            <div class="border border-gray-200 rounded-lg p-4 shadow-sm">
                <div class="flex justify-between items-start mb-2">
                    <span class="text-xs font-semibold px-2 py-1 bg-yellow-100 text-yellow-800 rounded">Sedang Diantar</span>
                    <span class="text-xs text-gray-500">${order.no_resep}</span>
                </div>
                <h3 class="font-bold text-lg">${order.nama_pasien}</h3>
                <p class="text-sm text-gray-600 mt-1"><i data-lucide="map-pin" class="w-4 h-4 inline mr-1"></i> ${order.alamat}</p>
                <button onclick="finishOrder('${order.id}')" class="w-full mt-4 bg-gray-900 text-white py-2 rounded-md text-sm font-medium hover:bg-gray-800">
                    Akhiri Pesanan
                </button>
            </div>
        `).join('');
        lucide.createIcons();
    }
}

window.finishOrder = async (id) => {
    if(confirm("Apakah pesanan sudah sampai?")) {
        await supabase.from('pesanan').update({ status: 'Selesai' }).eq('id', id);
        loadMyOrders();
    }
}

loadMyOrders();