import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, getDocs, query, orderBy, doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase/config'; // Make sure this path is correct

// --- SVG Icon Components ---
const TotalOrdersIcon = () => <svg className="w-8 h-8 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" /></svg>;
const RevenueIcon = () => <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v.01M12 6v-1m0-1V4m0 2v1m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M12 8V7m0 1v.01M12 6v-1m0-1V4m0 2v1m0 0v1m0-1c-3.314 0-6-2.686-6-6s2.686-6 6-6 6 2.686 6 6-2.686 6-6 6zm0 0a2.5 2.5 0 110-5 2.5 2.5 0 010 5z" /></svg>;
const PendingIcon = () => <svg className="w-8 h-8 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
const TodayIcon = () => <svg className="w-8 h-8 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>;
const PlusIcon = () => <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" /></svg>;

const StatCard = ({ title, value, icon, loading }) => (
    <div className="bg-white p-6 rounded-xl shadow-md flex items-center justify-between transition-transform transform hover:scale-105">
        <div>
            <p className="text-sm font-medium text-gray-500">{title}</p>
            {loading ? <div className="h-8 w-24 bg-gray-200 rounded-md animate-pulse mt-1"></div> : <p className="text-3xl font-bold text-gray-800">{value}</p>}
        </div>
        <div className="bg-gray-100 p-3 rounded-full">{icon}</div>
    </div>
);

const StatusSelector = ({ currentStatus, onStatusChange }) => {
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

const TabButton = ({ title, count, isActive, onClick }) => (
    <button onClick={onClick} className={`flex items-center gap-2 px-4 py-3 text-sm font-semibold whitespace-nowrap transition-colors duration-200 ${isActive ? 'border-b-2 border-orange-500 text-orange-600' : 'text-gray-500 hover:text-gray-800'}`}>
        <span>{title}</span>
        <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${isActive ? 'bg-orange-500 text-white' : 'bg-gray-200 text-gray-600'}`}>
            {count}
        </span>
    </button>
);

export default function Dashboard() {
    const [stats, setStats] = useState({ totalOrders: 0, totalRevenue: 0, pendingDeliveries: 0, todaysOrdersCount: 0 });
    const [allOrders, setAllOrders] = useState([]);
    const [filteredOrders, setFilteredOrders] = useState([]);
    const [activeTab, setActiveTab] = useState('todaysOrders');
    const [tabCounts, setTabCounts] = useState({
        todaysOrders: 0,
        todaysDeliveries: 0,
        thisWeekDeliveries: 0,
        thisMonthDeliveries: 0,
        upcoming: 0,
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const navigate = useNavigate();

    useEffect(() => {
        const fetchDashboardData = async () => {
            setLoading(true);
            try {
                const usersSnapshot = await getDocs(collection(db, 'users'));
                const usersMap = {};
                usersSnapshot.forEach(doc => {
                    usersMap[doc.id] = doc.data().name || 'Unknown User';
                });

                const ordersSnapshot = await getDocs(query(collection(db, 'orders'), orderBy('orderedAt', 'desc')));
                const ordersData = ordersSnapshot.docs.map(doc => {
                    const data = doc.data();
                    return { id: doc.id, ...data, userName: usersMap[data.userId] || 'Guest User' };
                });
                setAllOrders(ordersData);

                // --- Calculate All Stats and Counts Simultaneously ---
                const totalOrders = ordersData.length;
                const totalRevenue = ordersData.reduce((sum, order) => sum + (order.totalPrice || 0), 0);
                const pendingDeliveries = ordersData.filter(order => order.status?.toLowerCase() !== 'delivered').length;
                
                const now = new Date();
                const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
                const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
                
                const weekStart = new Date(todayStart);
                weekStart.setDate(todayStart.getDate() - todayStart.getDay());
                const weekEnd = new Date(weekStart);
                weekEnd.setDate(weekStart.getDate() + 6);
                weekEnd.setHours(23, 59, 59, 999);

                const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
                const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
                monthEnd.setHours(23, 59, 59, 999);

                const counts = {
                    todaysOrders: ordersData.filter(o => o.orderedAt?.toDate() >= todayStart).length,
                    todaysDeliveries: ordersData.filter(o => o.deliveryDate?.toDate() >= todayStart && o.deliveryDate?.toDate() <= todayEnd).length,
                    thisWeekDeliveries: ordersData.filter(o => o.deliveryDate?.toDate() >= weekStart && o.deliveryDate?.toDate() <= weekEnd).length,
                    thisMonthDeliveries: ordersData.filter(o => o.deliveryDate?.toDate() >= monthStart && o.deliveryDate?.toDate() <= monthEnd).length,
                    upcoming: ordersData.filter(o => o.deliveryDate?.toDate() > todayEnd).length,
                };
                
                setTabCounts(counts);
                setStats({ totalOrders, totalRevenue, pendingDeliveries, todaysOrdersCount: counts.todaysOrders });

            } catch (err) {
                console.error("Error fetching dashboard data:", err);
                setError("Could not load dashboard data.");
            } finally {
                setLoading(false);
            }
        };
        fetchDashboardData();
    }, []);

    useEffect(() => {
        const filterOrders = () => {
            const now = new Date();
            const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

            switch (activeTab) {
                case 'todaysOrders':
                    setFilteredOrders(allOrders.filter(o => o.orderedAt?.toDate() >= todayStart));
                    break;
                case 'todaysDeliveries':
                    setFilteredOrders(allOrders.filter(o => o.deliveryDate?.toDate() >= todayStart && o.deliveryDate?.toDate() <= todayEnd));
                    break;
                case 'thisWeekDeliveries':
                    { const weekStart = new Date(todayStart);
                    weekStart.setDate(todayStart.getDate() - todayStart.getDay());
                    const weekEnd = new Date(weekStart);
                    weekEnd.setDate(weekStart.getDate() + 6);
                    weekEnd.setHours(23, 59, 59, 999);
                    setFilteredOrders(allOrders.filter(o => o.deliveryDate?.toDate() >= weekStart && o.deliveryDate?.toDate() <= weekEnd));
                    break; }
                case 'thisMonthDeliveries':
                    { const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
                    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
                    monthEnd.setHours(23, 59, 59, 999);
                    setFilteredOrders(allOrders.filter(o => o.deliveryDate?.toDate() >= monthStart && o.deliveryDate?.toDate() <= monthEnd));
                    break; }
                case 'upcoming':
                    setFilteredOrders(allOrders.filter(o => o.deliveryDate?.toDate() > todayEnd));
                    break;
                default:
                    setFilteredOrders([]);
            }
        };
        if (!loading) filterOrders();
    }, [activeTab, allOrders, loading]);

    const handleStatusChange = async (orderId, newStatus) => {
        try {
            await updateDoc(doc(db, 'orders', orderId), { status: newStatus });
            setAllOrders(prevOrders =>
                prevOrders.map(order =>
                    order.id === orderId ? { ...order, status: newStatus } : order
                )
            );
        } catch (err) {
            console.error("Error updating status:", err);
            alert("Failed to update status.");
        }
    };

    if (error) return <div className="text-center text-red-500 bg-red-100 p-4 rounded-lg">{error}</div>;

    return (
        <div className="space-y-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-800">Dashboard</h1>
                    <p className="text-gray-500">Welcome back, here's a summary of your store.</p>
                </div>
                <div className="flex items-center gap-4">
                    <button onClick={() => navigate('/products/add')} className="bg-orange-500 text-white font-bold py-2 px-4 rounded-lg shadow-md hover:bg-orange-600 transition-transform transform hover:scale-105 flex items-center"><PlusIcon /> Add Product</button>
                    <button onClick={() => navigate('/orders/add')} className="bg-gray-700 text-white font-bold py-2 px-4 rounded-lg shadow-md hover:bg-gray-800 transition-transform transform hover:scale-105 flex items-center"><PlusIcon /> Add Order</button>
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard title="Total Orders" value={stats.totalOrders} icon={<TotalOrdersIcon />} loading={loading} />
                <StatCard title="Total Revenue" value={`₹${stats.totalRevenue.toLocaleString('en-IN')}`} icon={<RevenueIcon />} loading={loading} />
                <StatCard title="Pending Deliveries" value={stats.pendingDeliveries} icon={<PendingIcon />} loading={loading} />
                <StatCard title="Today's Orders" value={stats.todaysOrdersCount} icon={<TodayIcon />} loading={loading} />
            </div>

            <div className="bg-white p-6 rounded-xl shadow-md">
                <div className="flex border-b border-gray-200 overflow-x-auto">
                    <TabButton title="Today's Orders" count={tabCounts.todaysOrders} isActive={activeTab === 'todaysOrders'} onClick={() => setActiveTab('todaysOrders')} />
                    <TabButton title="Today's Deliveries" count={tabCounts.todaysDeliveries} isActive={activeTab === 'todaysDeliveries'} onClick={() => setActiveTab('todaysDeliveries')} />
                    <TabButton title="This Week's" count={tabCounts.thisWeekDeliveries} isActive={activeTab === 'thisWeekDeliveries'} onClick={() => setActiveTab('thisWeekDeliveries')} />
                    <TabButton title="This Month's" count={tabCounts.thisMonthDeliveries} isActive={activeTab === 'thisMonthDeliveries'} onClick={() => setActiveTab('thisMonthDeliveries')} />
                    <TabButton title="Upcoming" count={tabCounts.upcoming} isActive={activeTab === 'upcoming'} onClick={() => setActiveTab('upcoming')} />
                </div>
                <div className="mt-4">
                    {loading ? (
                        <div className="space-y-4">{[...Array(3)].map((_, i) => <div key={i} className="h-12 bg-gray-200 rounded-md animate-pulse"></div>)}</div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="border-b-2 border-gray-100">
                                    <tr>
                                        <th className="p-3 text-sm font-semibold text-gray-500">Customer Name</th>
                                        <th className="p-3 text-sm font-semibold text-gray-500 hidden md:table-cell">Product</th>
                                        <th className="p-3 text-sm font-semibold text-gray-500">Total</th>
                                        <th className="p-3 text-sm font-semibold text-gray-500 text-center">Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredOrders.map(order => (
                                        <tr key={order.id} className="border-b border-gray-100 hover:bg-gray-50">
                                            <td className="p-3 font-medium text-gray-800">{order.userName}</td>
                                            <td className="p-3 text-gray-600 hidden md:table-cell">{order.productName}</td>
                                            <td className="p-3 text-gray-700 font-semibold">₹{order.totalPrice?.toLocaleString('en-IN')}</td>
                                            <td className="p-3 text-center">
                                                <StatusSelector currentStatus={order.status} onStatusChange={(newStatus) => handleStatusChange(order.id, newStatus)} />
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                    {!loading && filteredOrders.length === 0 && (
                        <p className="text-center text-gray-500 py-8">No orders found in this category.</p>
                    )}
                </div>
            </div>
        </div>
    );
}
