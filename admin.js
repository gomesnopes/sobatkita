import { supabase } from './supabase-config.js';

// DOM Elements
const modalOrder = document.getElementById('modalOrder');
const modalReceipt = document.getElementById('modalReceipt');
const btnNewOrder = document.getElementById('btnNewOrder');
const closeOrderModal = document.getElementById('closeOrderModal');
const closeReceiptModal = document.getElementById('closeReceiptModal');
const formOrder = document.getElementById('formOrder');
const orderTableBody = document.getElementById('orderTableBody');

// Toggles
btnNewOrder.onclick = () => modalOrder.classList.remove('hidden');
closeOrderModal.onclick = () => modalOrder.classList.add('hidden');
closeReceiptModal.onclick = () => modalReceipt.classList.add('hidden');

// Load Data
async function fetchOrders() {
    const { data, error } = await supabase.from('pesanan').select('*').order('created_at', { ascending: false });
    if (error) return console.error(error);
    
    // Update Analytics (Sederhana)
    document.getElementById('totalOrders').innerText = data.length;
    document.getElementById('waitingOrders').innerText = data.filter(o => o.status === 'Menunggu Kurir').length;
    document.getElementById('completedOrders').innerText = data.filter(o => o.status === 'Selesai').length;

    orderTableBody.innerHTML = data.map(order => {
        // Logika pewarnaan status
        let statusBadge = '';
        if (order.status === 'Menunggu Kurir') {
            statusBadge = `<span class="px-2.5 py-1 bg-amber-100 text-amber-700 border border-amber-200 rounded-md text-xs font-medium">${order.status}</span>`;
        } else if (order.status === 'Sedang Diantar') {
            statusBadge = `<span class="px-2.5 py-1 bg-blue-100 text-blue-700 border border-blue-200 rounded-md text-xs font-medium">${order.status}</span>`;
        } else {
            statusBadge = `<span class="px-2.5 py-1 bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-md text-xs font-medium">${order.status}</span>`;
        }

        return `
            <tr class="hover:bg-slate-50 transition group">
                <td class="p-4 text-slate-800 font-medium">${order.no_resep}</td>
                <td class="p-4 text-slate-600">${order.nama_pasien}</td>
                <td class="p-4 text-slate-600 truncate max-w-xs">${order.alamat}</td>
                <td class="p-4">${statusBadge}</td>
                <td class="p-4 text-center">
                    <button onclick="showReceipt('${order.id}')" class="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded transition" title="Cetak QR">
                        <i data-lucide="printer" class="w-4 h-4"></i>
                    </button>
                </td>
            </tr>
        `;
    }).join('');
    lucide.createIcons();
}

// Submit Order
formOrder.onsubmit = async (e) => {
    e.preventDefault();
    const pesanan = {
        no_resep: document.getElementById('no_resep').value,
        nama_pasien: document.getElementById('nama_pasien').value,
        alamat: document.getElementById('alamat').value,
        patokan: document.getElementById('patokan').value
    };

    const { data, error } = await supabase.from('pesanan').insert([pesanan]).select().single();
    if (!error) {
        modalOrder.classList.add('hidden');
        formOrder.reset();
        fetchOrders();
        showReceipt(data.id, data);
    }
};

// Show Receipt & QR
window.showReceipt = async (id, orderData = null) => {
    if (!orderData) {
        const { data } = await supabase.from('pesanan').select('*').eq('id', id).single();
        orderData = data;
    }
    
    document.getElementById('receiptDetails').innerHTML = `
        <p class="flex justify-between border-b border-slate-200 pb-1 mb-1"><span class="text-slate-500">Resep</span> <strong class="text-slate-800">${orderData.no_resep}</strong></p>
        <p class="flex justify-between border-b border-slate-200 pb-1 mb-1"><span class="text-slate-500">Pasien</span> <strong class="text-slate-800">${orderData.nama_pasien}</strong></p>
        <p class="mt-2"><span class="block text-slate-500 text-xs mb-1">Alamat Pengiriman</span> <span class="text-slate-800 block leading-tight">${orderData.alamat}</span></p>
        <p class="mt-2"><span class="block text-slate-500 text-xs mb-1">Patokan</span> <span class="text-slate-800">${orderData.patokan || '-'}</span></p>
    `;

    document.getElementById('qrcode').innerHTML = ''; // Hapus QR lama
    const trackingUrl = `${window.location.origin}/tracking.html?id=${id}`;
    new QRCode(document.getElementById("qrcode"), {
        text: trackingUrl,
        width: 140,
        height: 140,
        colorDark : "#0f172a", // Warna QR code (slate-900)
        colorLight : "#ffffff",
    });

    modalReceipt.classList.remove('hidden');
};

fetchOrders();
