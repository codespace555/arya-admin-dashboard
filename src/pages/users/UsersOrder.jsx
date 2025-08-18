import React, { useState, useEffect } from 'react';
import { collection, getDocs, query, where, doc, getDoc } from 'firebase/firestore';
import { db } from '../../firebase/config.js';
import { FaBoxOpen, FaCalendarAlt, FaShoppingCart, FaSpinner, FaRupeeSign, FaSearch, FaFileCsv, FaTimesCircle } from 'react-icons/fa';
import { format } from 'date-fns';
import { useParams } from 'react-router-dom';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";

const UsersOrder = () => {
    const { userId } = useParams();
    const [orders, setOrders] = useState([]);
    const [userName, setUserName] = useState(''); // State to hold the user's name
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [startDate, setStartDate] = useState(null);
    const [endDate, setEndDate] = useState(null);

    useEffect(() => {
        const fetchUserDataAndOrders = async () => {
            if (!userId) {
                setLoading(false);
                setError("No user ID found in URL.");
                return;
            }

            try {
                // Fetch User's Name
                const userDocRef = doc(db, 'users', userId);
                const userDocSnap = await getDoc(userDocRef);
                if (userDocSnap.exists()) {
                    setUserName(userDocSnap.data().name);
                } else {
                    setUserName('Unknown User');
                }

                // Fetch User's Orders
                const ordersCollectionRef = collection(db, 'orders');
                const q = query(ordersCollectionRef, where("userId", "==", userId));
                const querySnapshot = await getDocs(q);
                
                const ordersData = querySnapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));
                setOrders(ordersData);

            } catch (err) {
                console.error("Error fetching data: ", err);
                setError("Failed to load user data or orders.");
            } finally {
                setLoading(false);
            }
        };

        fetchUserDataAndOrders();
    }, [userId]);

    const handleExportToCsv = () => {
        const headers = ["User Name", "Order ID", "Product Name", "Quantity", "Unit", "Total Price (₹)", "Payment Status", "Order Status", "Delivery Date"];
        const rows = filteredOrders.map(order => [
            userName, // Added user name to each row
            order.id,
            order.productName,
            order.quantity,
            order.unit,
            order.totalPrice.toFixed(2),
            order.payment,
            order.status,
            order.deliveryDate ? format(order.deliveryDate.toDate(), 'dd MMM yyyy') : 'N/A'
        ]);

        const csvContent = "data:text/csv;charset=utf-8," + headers.join(",") + "\n" + rows.map(e => e.join(",")).join("\n");
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `${userName.replace(/\s/g, '_')}_orders.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const filteredOrders = orders.filter(order => {
        const matchesSearch = order.productName.toLowerCase().includes(searchTerm.toLowerCase());
        
        const deliveryDate = order.deliveryDate?.toDate();
        const isAfterStartDate = !startDate || (deliveryDate && deliveryDate >= startDate);
        const isBeforeEndDate = !endDate || (deliveryDate && deliveryDate <= endDate);

        return matchesSearch && isAfterStartDate && isBeforeEndDate;
    });

    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-screen bg-gray-100">
                <FaSpinner className="text-4xl text-orange-500 animate-spin" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-8 text-center text-red-500 bg-gray-100 min-h-screen flex items-center justify-center">
                <p>{error}</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-100 p-8">
            <div className="flex justify-between items-center max-w-4xl mx-auto mb-8">
                <h1 className="text-3xl font-bold text-orange-600">
                    Orders for {userName || 'User'}
                </h1>
                <button
                    onClick={handleExportToCsv}
                    className="flex items-center gap-2 bg-green-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-green-700 transition-colors"
                >
                    <FaFileCsv />
                    Export to CSV
                </button>
            </div>

            {/* Search and Filter Section */}
            <div className="max-w-4xl mx-auto mb-6 bg-white p-6 rounded-lg shadow-md">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                    <div className="relative">
                        <label className="block text-gray-700 font-semibold mb-2">Search by Product</label>
                        <input
                            type="text"
                            placeholder="Search by product name..."
                            className="w-full p-3 pl-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                        <FaSearch className="absolute left-3 bottom-3.5 text-gray-400" />
                    </div>
                    <div>
                        <label className="block text-gray-700 font-semibold mb-2">Start Date</label>
                        <DatePicker
                            selected={startDate}
                            onChange={date => setStartDate(date)}
                            selectsStart
                            startDate={startDate}
                            endDate={endDate}
                            dateFormat="dd/MM/yyyy"
                            className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                            placeholderText="Select start date"
                        />
                    </div>
                    <div>
                        <label className="block text-gray-700 font-semibold mb-2">End Date</label>
                        <DatePicker
                            selected={endDate}
                            onChange={date => setEndDate(date)}
                            selectsEnd
                            startDate={startDate}
                            endDate={endDate}
                            minDate={startDate}
                            dateFormat="dd/MM/yyyy"
                            className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                            placeholderText="Select end date"
                        />
                    </div>
                </div>
                { (startDate || endDate) && (
                    <div className="mt-4 flex justify-end">
                         <button
                            onClick={() => {
                                setStartDate(null);
                                setEndDate(null);
                            }}
                            className="flex items-center gap-1 text-gray-500 hover:text-red-500 transition-colors"
                        >
                            <FaTimesCircle /> Clear Dates
                        </button>
                    </div>
                )}
            </div>

            {/* Orders List */}
            <div className="space-y-6 max-w-4xl mx-auto">
                {filteredOrders.length === 0 ? (
                    <div className="text-center text-gray-500 text-lg p-10">
                        No orders found.
                    </div>
                ) : (
                    filteredOrders.map(order => (
                        <div key={order.id} className="bg-white p-6 rounded-lg shadow-md">
                            <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2 mb-2">
                                <FaShoppingCart className="text-orange-500" />
                                Order ID: <span className="text-sm font-normal text-gray-500">{order.id}</span>
                            </h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <p className="flex items-center gap-2 text-gray-600">
                                        <FaBoxOpen className="text-gray-400" />
                                        <span className="font-semibold">Product:</span> {order.productName}
                                    </p>
                                    <p className="flex items-center gap-2 text-gray-600">
                                        <FaCalendarAlt className="text-gray-400" />
                                        <span className="font-semibold">Delivery Date:</span> {order.deliveryDate && format(order.deliveryDate.toDate(), 'dd MMM yyyy')}
                                    </p>
                                    <p className="flex items-center gap-2 text-gray-600">
                                        <span className="font-semibold">Status:</span> 
                                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${order.status === 'processing' ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'}`}>
                                            {order.status}
                                        </span>
                                    </p>
                                </div>
                                <div className="space-y-2">
                                    <p className="text-gray-600"><span className="font-semibold">Quantity:</span> {order.quantity} {order.unit}</p>
                                    <p className="text-gray-600"><span className="font-semibold">Payment:</span> {order.payment}</p>
                                    <p className="text-2xl font-bold text-orange-600 flex items-center">
                                        <FaRupeeSign className="text-xl" />
                                        {order.totalPrice.toFixed(2)}
                                    </p>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default UsersOrder;