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
    
    orderTableBody.innerHTML = data.map(order => `
        <tr class="hover:bg-gray-50 transition">
            <td class="p-4">${order.no_resep}</td>
            <td class="p-4">${order.nama_pasien}</td>
            <td class="p-4 truncate max-w-xs">${order.alamat}</td>
            <td class="p-4">
                <span class="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs">${order.status}</span>
            </td>
            <td class="p-4">
                <button onclick="showReceipt('${order.id}')" class="text-gray-500 hover:text-gray-900">
                    <i data-lucide="printer" class="w-4 h-4"></i>
                </button>
            </td>
        </tr>
    `).join('');
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
        <p><strong>No Resep:</strong> ${orderData.no_resep}</p>
        <p><strong>Pasien:</strong> ${orderData.nama_pasien}</p>
        <p><strong>Alamat:</strong> ${orderData.alamat}</p>
        <p><strong>Patokan:</strong> ${orderData.patokan}</p>
    `;

    document.getElementById('qrcode').innerHTML = ''; // Clear old QR
    const trackingUrl = `${window.location.origin}/tracking.html?id=${id}`;
    new QRCode(document.getElementById("qrcode"), {
        text: trackingUrl,
        width: 128,
        height: 128,
    });

    modalReceipt.classList.remove('hidden');
};
const settingsModal =
document.getElementById('settingsModal');

document
.getElementById('btnSettings')
.onclick = () => {

    settingsModal.classList.remove('hidden');
    settingsModal.classList.add('flex');

};

document
.getElementById('closeSettings')
.onclick = () => {

    settingsModal.classList.add('hidden');
    settingsModal.classList.remove('flex');

};
async function loadAnalytics() {

    const { data } =
    await supabase
    .from('pesanan')
    .select('*');

    const total = data.length;

    const waiting =
    data.filter(
        x => x.status === 'Menunggu Kurir'
    ).length;

    const delivery =
    data.filter(
        x => x.status === 'Sedang Diantar'
    ).length;

    const completed =
    data.filter(
        x => x.status === 'Selesai'
    ).length;

    document.getElementById(
        'totalOrders'
    ).innerText = total;

    document.getElementById(
        'waitingOrders'
    ).innerText = waiting;

    document.getElementById(
        'deliveryOrders'
    ).innerText = delivery;

    document.getElementById(
        'completedOrders'
    ).innerText = completed;
}
fetchOrders();
loadAnalytics();
fetchOrders();
