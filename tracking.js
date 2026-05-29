import { supabase } from './supabase-config.js';

const urlParams = new URLSearchParams(window.location.search);
const orderId = urlParams.get('id');
const trackingContent = document.getElementById('trackingContent');

async function loadTracking() {
    if (!orderId) {
        showError("QR Code tidak valid atau link rusak.");
        return;
    }

    // Ambil data pesanan beserta data kurirnya (jika ada)
    const { data: order, error } = await supabase
        .from('pesanan')
        .select(`
            *,
            kurir ( nama, no_hp )
        `)
        .eq('id', orderId)
        .single();

    if (error || !order) {
        showError("Pesanan tidak ditemukan di sistem.");
        return;
    }

    renderStatus(order);
}

function showError(message) {
    trackingContent.innerHTML = `
        <div class="py-6">
            <i data-lucide="alert-circle" class="w-12 h-12 text-red-400 mx-auto mb-3"></i>
            <p class="text-slate-600 font-medium">${message}</p>
        </div>
    `;
    lucide.createIcons();
}

function renderStatus(order) {
    let statusIcon, statusColor, statusBg;
    
    if(order.status === 'Menunggu Kurir') { 
        statusIcon = 'clock'; 
        statusColor = 'text-amber-600'; 
        statusBg = 'bg-amber-100'; 
    } else if(order.status === 'Sedang Diantar') { 
        statusIcon = 'bike'; 
        statusColor = 'text-blue-600'; 
        statusBg = 'bg-blue-100'; 
    } else { 
        statusIcon = 'check-circle'; 
        statusColor = 'text-emerald-600'; 
        statusBg = 'bg-emerald-100'; 
    }

    let actionButton = '';
    if (order.status === 'Sedang Diantar' && order.kurir) {
        // Format nomor HP
        let waNumber = order.kurir.no_hp.replace(/[^0-9]/g, '');
        if (waNumber.startsWith('0')) {
            waNumber = '62' + waNumber.substring(1);
        }
        
        // Tambahkan teks otomatis
        const pesanWA = encodeURIComponent(`Halo, saya pasien dengan No Resep: ${order.no_resep}. Saya ingin menanyakan status pengantaran obat saya.`);
        
        // Gunakan api.whatsapp.com dan rel="noopener noreferrer" untuk keamanan browser
        actionButton = `
            <a href="https://api.whatsapp.com/send?phone=${waNumber}&text=${pesanWA}" target="_blank" rel="noopener noreferrer" class="mt-6 flex items-center justify-center w-full gap-2 bg-green-500 text-white py-3 rounded-xl font-medium hover:bg-green-600 transition shadow-sm">
                <i data-lucide="message-circle" class="w-5 h-5"></i> Hubungi Kurir (${order.kurir.nama})
            </a>
        `;
    }

    trackingContent.innerHTML = `
        <div class="w-20 h-20 ${statusBg} rounded-full flex items-center justify-center mx-auto mb-5 border-4 border-white shadow-sm -mt-12 relative z-10">
            <i data-lucide="${statusIcon}" class="w-10 h-10 ${statusColor}"></i>
        </div>
        
        <h2 class="text-2xl font-bold text-slate-800 mb-1">Status Pesanan</h2>
        <p class="text-sm font-bold ${statusColor} mb-6 uppercase tracking-widest">${order.status}</p>
        
        <div class="text-left text-sm text-slate-600 space-y-4 bg-slate-50 p-5 rounded-xl border border-slate-100">
            <div>
                <span class="block text-xs text-slate-400 font-medium uppercase tracking-wider mb-1">No Resep</span>
                <span class="font-semibold text-slate-800 text-base">${order.no_resep}</span>
            </div>
            <div class="pt-3 border-t border-slate-200">
                <span class="block text-xs text-slate-400 font-medium uppercase tracking-wider mb-1">Pasien</span>
                <span class="font-medium text-slate-800">${order.nama_pasien}</span>
            </div>
            <div class="pt-3 border-t border-slate-200">
                <span class="block text-xs text-slate-400 font-medium uppercase tracking-wider mb-1">Alamat Pengiriman</span>
                <span class="text-slate-800">${order.alamat}</span>
            </div>
        </div>
        
        ${actionButton}
    `;
    lucide.createIcons();
}

loadTracking();
