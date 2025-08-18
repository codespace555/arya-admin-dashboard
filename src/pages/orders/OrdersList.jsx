import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, getDocs, doc, updateDoc, query, orderBy } from 'firebase/firestore';
import { db } from '../../firebase/config'; // Make sure this path is correct

// --- SVG Icon Components ---
const PlusIcon = () => <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" /></svg>;
const ExportIcon = () => <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>;
const SearchIcon = () => <svg className="w-5 h-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" /></svg>;
const WarningIcon = () => <svg className="h-6 w-6 text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>;

// --- Reusable Components ---
const ConfirmationModal = ({ isOpen, onClose, onConfirm, title, message }) => {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4">
            <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
                <div className="flex items-start">
                    <div className="flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-yellow-100 sm:mx-0 sm:h-10 sm:w-10">
                        <WarningIcon />
                    </div>
                    <div className="ml-4 text-left">
                        <h3 className="text-lg leading-6 font-bold text-gray-900">{title}</h3>
                        <div className="mt-2"><p className="text-sm text-gray-500">{message}</p></div>
                    </div>
                </div>
                <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
                    <button type="button" onClick={onConfirm} className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-orange-500 text-base font-medium text-white hover:bg-orange-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 sm:ml-3 sm:w-auto sm:text-sm transition">Confirm</button>
                    <button type="button" onClick={onClose} className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:w-auto sm:text-sm transition">Cancel</button>
                </div>
            </div>
        </div>
    );
};

const PaymentStatusBadge = ({ status, onClick }) => {
    const isPaid = status?.toLowerCase() === 'paid';
    return (
        <button onClick={onClick} className={`px-3 py-1 text-xs font-semibold rounded-full capitalize transition ${isPaid ? 'bg-green-100 text-green-800 hover:bg-green-200' : 'bg-red-100 text-red-800 hover:bg-red-200'}`}>
            {status}
        </button>
    );
};

const OrderStatusSelector = ({ currentStatus, onStatusChange }) => {
    const getRingColor = (status) => {
        switch (status?.toLowerCase()) {
            case 'processing': return "ring-yellow-500";
            case 'delivered': return "ring-green-500";
            case 'cancelled': return "ring-red-500";
            default: return "ring-gray-400";
        }
    };
    return (
        <select value={currentStatus} onChange={(e) => onStatusChange(e.target.value)} className={`capitalize text-sm font-semibold border-0 rounded-lg py-2 pl-3 pr-8 focus:outline-none focus:ring-2 ${getRingColor(currentStatus)}`}>
            <option value="processing">Processing</option>
            <option value="delivered">Delivered</option>
            <option value="cancelled">Cancelled</option>
        </select>
    );
};


export default function OrdersList() {
    const [allOrders, setAllOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [dateRange, setDateRange] = useState({ start: '', end: '' });
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [orderToUpdate, setOrderToUpdate] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchOrdersAndUsers = async () => {
            setLoading(true);
            try {
                const usersSnapshot = await getDocs(collection(db, 'users'));
                const usersMap = {};
                const usersAddress = {};
                usersSnapshot.forEach(doc => { usersMap[doc.id] = doc.data().name || 'Unknown User'; });
                 usersSnapshot.forEach(doc => { usersAddress[doc.id] = doc.data().address || 'Address'; });

                const ordersSnapshot = await getDocs(query(collection(db, 'orders'), orderBy('orderedAt', 'desc')));
                const ordersData = ordersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data(), userName: usersMap[doc.data().userId] || 'Guest User',userAddress: usersAddress[doc.data().userId] || 'Address' }));
                setAllOrders(ordersData);
            } catch (err) {
                console.error("Error fetching data:", err);
                setError("Could not load orders. Please try again.");
            } finally {
                setLoading(false);
            }
        };
        fetchOrdersAndUsers();
    }, []);

    const filteredOrders = useMemo(() => {
        return allOrders.filter(order => {
            const userNameMatch = order.userName.toLowerCase().includes(searchTerm.toLowerCase());
            
            const orderDate = order.orderedAt?.toDate();
            if (!orderDate) return false;

            const startDate = dateRange.start ? new Date(dateRange.start) : null;
            const endDate = dateRange.end ? new Date(dateRange.end) : null;

            if (startDate) startDate.setHours(0, 0, 0, 0);
            if (endDate) endDate.setHours(23, 59, 59, 999);

            const dateMatch = (!startDate || orderDate >= startDate) && (!endDate || orderDate <= endDate);
            
            return userNameMatch && dateMatch;
        });
    }, [allOrders, searchTerm, dateRange]);

    const handleStatusChange = async (orderId, newStatus) => {
        try {
            await updateDoc(doc(db, 'orders', orderId), { status: newStatus });
            setAllOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
        } catch (err) { console.error("Error updating status:", err); }
    };

    const handlePaymentUpdateClick = (order) => {
        setOrderToUpdate(order);
        setIsModalOpen(true);
    };

    const handleConfirmPaymentUpdate = async () => {
        if (!orderToUpdate) return;
        const newPaymentStatus = orderToUpdate.payment === 'Paid' ? 'Unpaid' : 'Paid';
        try {
            await updateDoc(doc(db, 'orders', orderToUpdate.id), { payment: newPaymentStatus });
            setAllOrders(prev => prev.map(o => o.id === orderToUpdate.id ? { ...o, payment: newPaymentStatus } : o));
        } catch (err) { console.error("Error updating payment status:", err); }
        finally {
            setIsModalOpen(false);
            setOrderToUpdate(null);
        }
    };
    
    const exportToExcel = () => {
        const headers = ["Order ID", "Customer Name", "Product", "Order Date", "Delivery Date", "Total Price", "Payment Status", "Order Status", "Address"];
        const rows = filteredOrders.map(order => [
            order.id,
            order.userName,
            order.productName,
            order.orderedAt?.toDate().toLocaleString('en-IN') || 'N/A',
            order.deliveryDate?.toDate().toLocaleString('en-IN') || 'N/A',
            order.totalPrice,
            order.payment,
            order.status,
            order.userAddress
        ]);

        let csvContent = "data:text/csv;charset=utf-8," + headers.join(",") + "\n" + rows.map(e => e.join(",")).join("\n");
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", "orders.csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    if (error) return <div className="text-center text-red-500 bg-red-100 p-4 rounded-lg">{error}</div>;

    return (
        <div className="space-y-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-800">Orders</h1>
                    <p className="text-gray-500">Search, filter, and manage all customer orders.</p>
                </div>
                <div className="flex items-center gap-4">
                    <button onClick={exportToExcel} className="bg-green-600 text-white font-bold py-2 px-4 rounded-lg shadow-md hover:bg-green-700 transition flex items-center"><ExportIcon /> Export</button>
                    <button onClick={() => navigate('/orders/add')} className="bg-orange-500 text-white font-bold py-2 px-4 rounded-lg shadow-md hover:bg-orange-600 transition flex items-center"><PlusIcon /> Add Order</button>
                </div>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-md space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="relative md:col-span-1">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><SearchIcon /></div>
                        <input type="text" placeholder="Search by customer name..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500" />
                    </div>
                    <div className="flex items-center gap-2 md:col-span-2">
                        <input type="date" value={dateRange.start} onChange={e => setDateRange(prev => ({...prev, start: e.target.value}))} className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500" />
                        <span className="text-gray-500">to</span>
                        <input type="date" value={dateRange.end} onChange={e => setDateRange(prev => ({...prev, end: e.target.value}))} className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500" />
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-md overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 border-b-2 border-gray-100">
                            <tr>
                                <th className="p-4 text-sm font-semibold text-gray-500">Customer</th>
                                <th className="p-4 text-sm font-semibold text-gray-500 hidden md:table-cell">Product</th>
                                <th className="p-4 text-sm font-semibold text-gray-500 hidden sm:table-cell">Order Date</th>
                                <th className="p-4 text-sm font-semibold text-gray-500 hidden lg:table-cell">Delivery Date</th>
                                <th className="p-4 text-sm font-semibold text-gray-500">Total</th>
                                <th className="p-4 text-sm font-semibold text-gray-500 text-center">Payment</th>
                                <th className="p-4 text-sm font-semibold text-gray-500 text-center">Status</th>
                                <th className="p-4 text-sm font-semibold text-gray-500">Address</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? [...Array(5)].map((_, i) => <tr key={i}><td colSpan="7" className="p-4"><div className="h-8 bg-gray-200 rounded-md animate-pulse"></div></td></tr>)
                            : filteredOrders.map((order, index) => (
                                <tr key={order.id} className={`border-b border-gray-100 transition-colors ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'} hover:bg-gray-100`}>
                                    <td className="p-4 font-medium text-gray-800">{order.userName}</td>
                                    <td className="p-4 text-gray-600 hidden md:table-cell">{order.productName}</td>
                                    <td className="p-4 text-gray-600 hidden sm:table-cell">{order.orderedAt?.toDate().toLocaleDateString('en-IN')}</td>
                                    <td className="p-4 text-gray-600 hidden lg:table-cell">{order.deliveryDate?.toDate().toLocaleDateString('en-IN') || 'N/A'}</td>
                                    <td className="p-4 font-semibold text-gray-700">₹{order.totalPrice?.toLocaleString('en-IN')}</td>
                                    <td className="p-4 text-center"><PaymentStatusBadge status={order.payment} onClick={() => handlePaymentUpdateClick(order)} /></td>
                                    <td className="p-4 text-center"><OrderStatusSelector currentStatus={order.status} onStatusChange={(newStatus) => handleStatusChange(order.id, newStatus)} /></td>
                                     <td className="p-4 font-semibold text-gray-700">{order.userAddress}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                {!loading && filteredOrders.length === 0 && (
                    <p className="text-center text-gray-500 py-12">No orders found. Try adjusting your filters.</p>
                )}
            </div>
            <ConfirmationModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onConfirm={handleConfirmPaymentUpdate} title="Confirm Payment Status Change" message={`Are you sure you want to change the payment status for this order to "${orderToUpdate?.payment === 'Paid' ? 'Unpaid' : 'Paid'}"?`} />
        </div>
    );
}
