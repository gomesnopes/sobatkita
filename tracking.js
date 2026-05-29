import { supabase } from './supabase-config.js';

const urlParams = new URLSearchParams(window.location.search);
const orderId = urlParams.get('id');
const trackingContent = document.getElementById('trackingContent');

async function loadTracking() {
    if (!orderId) {
        trackingContent.innerHTML = `<p class="text-red-500">QR Code tidak valid.</p>`;
        return;
    }

    // Join table pesanan dengan kurir untuk mendapatkan no_hp
    const { data: order, error } = await supabase
        .from('pesanan')
        .select(`*, kurir ( nama, no_hp )`)
        .eq('id', orderId)
        .single();

    if (error || !order) {
        trackingContent.innerHTML = `<p class="text-gray-500">Pesanan tidak ditemukan.</p>`;
        return;
    }

    let statusIcon = 'package';
    let statusColor = 'text-gray-500';
    if(order.status === 'Sedang Diantar') { statusIcon = 'bike'; statusColor = 'text-yellow-500'; }
    if(order.status === 'Selesai') { statusIcon = 'check-circle'; statusColor = 'text-green-500'; }

    let kurirAction = '';
    if(order.status === 'Sedang Diantar' && order.kurir) {
        const waLink = `https://wa.me/${order.kurir.no_hp.replace(/[^0-9]/g, '')}`;
        kurirAction = `
            <a href="${waLink}" target="_blank" class="mt-6 flex items-center justify-center w-full gap-2 bg-green-500 text-white py-2 rounded-md hover:bg-green-600 transition">
                <i data-lucide="message-circle" class="w-4 h-4"></i> Chat Kurir (${order.kurir.nama})
            </a>
            <button onclick="finishByCustomer('${order.id}')" class="mt-3 flex items-center justify-center w-full gap-2 border border-gray-900 text-gray-900 py-2 rounded-md hover:bg-gray-50 transition">
                Pesanan Telah Diterima
            </button>
        `;
    }

    trackingContent.innerHTML = `
        <div class="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-gray-100">
            <i data-lucide="${statusIcon}" class="w-8 h-8 ${statusColor}"></i>
        </div>
        <h2 class="text-xl font-bold text-gray-800 mb-1">Status Pesanan</h2>
        <p class="text-sm font-semibold ${statusColor} mb-6 uppercase tracking-wider">${order.status}</p>
        
        <div class="text-left text-sm text-gray-600 space-y-3 bg-gray-50 p-4 rounded-lg border border-gray-100">
            <p><span class="block text-xs text-gray-400">No Resep</span> ${order.no_resep}</p>
            <p><span class="block text-xs text-gray-400">Pasien</span> ${order.nama_pasien}</p>
        </div>
        
        ${kurirAction}
    `;
    lucide.createIcons();
}

window.finishByCustomer = async (id) => {
    if(confirm("Konfirmasi pesanan telah Anda terima?")) {
        await supabase.from('pesanan').update({ status: 'Selesai' }).eq('id', id);
        loadTracking();
    }
}

loadTracking();