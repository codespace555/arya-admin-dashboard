import React, { useState, useEffect } from 'react';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import { collection, addDoc, getDocs, serverTimestamp } from "firebase/firestore";
import { db } from '../../firebase/config.js';
import { FaPlusCircle } from 'react-icons/fa';

const AddOrders = () => {
  // State for User & Product Selection
  const [selectedUser, setSelectedUser] = useState(null);
  const [users, setUsers] = useState([]);

  const [selectedProduct, setSelectedProduct] = useState(null);
  const [products, setProducts] = useState([]);

  // State for Order Details
  const [quantity, setQuantity] = useState(1);
  const [deliveryDate, setDeliveryDate] = useState(new Date());
  const [totalPrice, setTotalPrice] = useState(0);
  const [paymentStatus, setPaymentStatus] = useState('unpaid');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const primaryColor = 'bg-orange-500 hover:bg-orange-600';
  const inputStyle = 'p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 w-full text-gray-800';

  // Fetch all users once
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "users"));
        setUsers(querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      } catch (error) {
        console.error("Error fetching users: ", error);
      }
    };
    fetchUsers();
  }, []);

  // Fetch all enabled products once
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "products"));
        const allProducts = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setProducts(allProducts.filter(p => p.enable === true));
      } catch (error) {
        console.error("Error fetching products: ", error);
      }
    };
    fetchProducts();
  }, []);

  // Calculate total price when quantity or selected product changes
  useEffect(() => {
    if (selectedProduct && quantity > 0) {
      setTotalPrice(selectedProduct.price * quantity);
    } else {
      setTotalPrice(0);
    }
  }, [quantity, selectedProduct]);

  const handleAddOrder = async (e) => {
    e.preventDefault();

    if (!selectedUser || !selectedProduct || quantity <= 0 || !deliveryDate) {
      alert("Please ensure all required fields are correctly filled.");
      return;
    }

    setIsSubmitting(true);
    const newOrder = {
      userId: selectedUser.uid, // safer for reference
      orderedAt: serverTimestamp(),
      deliveryDate: deliveryDate,
      payment: paymentStatus,
      productId: selectedProduct.id,
      productName: selectedProduct.name,
      price: selectedProduct.price,
      quantity: Number(quantity),
      status: "processing",
      totalPrice: Number(totalPrice),
      unit: selectedProduct.unit || "N/A"
    };

    try {
      await addDoc(collection(db, "orders"), newOrder);
      alert("Order created successfully!");
      // Reset form
      setSelectedUser(null);
      setSelectedProduct(null);
      setQuantity(1);
      setTotalPrice(0);
      setDeliveryDate(new Date());
    } catch (error) {
      console.error("Error adding document: ", error);
      alert("Failed to create order. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8 flex items-center justify-center">
      <form onSubmit={handleAddOrder} className="bg-white p-8 rounded-lg shadow-lg w-full max-w-2xl">
        <h1 className="text-3xl font-bold text-center text-orange-600 mb-6">Create New Order</h1>

        {/* User Selection */}
        <div className="mb-6">
          <label className="block text-gray-700 font-semibold mb-2">Select Customer</label>
          <select
            className={inputStyle}
            value={selectedUser?.id || ""}
            onChange={(e) => {
              const user = users.find(u => u.id === e.target.value);
              setSelectedUser(user || null);
            }}
          >
            <option value="">-- Select a Customer --</option>
            {users.map(user => (
              <option key={user.id} value={user.id}>
                {user.name} ({user.phone})
              </option>
            ))}
          </select>
        </div>

        {/* Product Selection */}
        <div className="mb-6">
          <label className="block text-gray-700 font-semibold mb-2">Select Product</label>
          <select
            className={inputStyle}
            value={selectedProduct?.id || ""}
            onChange={(e) => {
              const product = products.find(p => p.id === e.target.value);
              setSelectedProduct(product || null);
            }}
          >
            <option value="">-- Select a Product --</option>
            {products.map(product => (
              <option key={product.id} value={product.id}>
                {product.name} (₹{product.price}/{product.unit})
              </option>
            ))}
          </select>
        </div>

        {/* Quantity & Delivery Date */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div>
            <label className="block text-gray-700 font-semibold mb-2">Quantity ({selectedProduct?.unit || 'N/A'})</label>
            <input
              type="number"
              className={inputStyle}
              value={quantity}
              onChange={(e) => setQuantity(Number(e.target.value))}
              min="1"
              required
            />
          </div>
          <div>
            <label className="block text-gray-700 font-semibold mb-2">Delivery Date</label>
            <DatePicker
              selected={deliveryDate}
              onChange={(date) => setDeliveryDate(date)}
              dateFormat="MMMM d, yyyy"
              className={inputStyle}
            />
          </div>
        </div>

        {/* Payment Status */}
        <div className="mb-6">
          <label className="block text-gray-700 font-semibold mb-2">Payment Status</label>
          <div className="flex bg-gray-200 rounded-lg overflow-hidden">
            <button
              type="button"
              onClick={() => setPaymentStatus('unpaid')}
              className={`flex-1 py-3 text-center font-bold transition-all ${paymentStatus === 'unpaid' ? 'bg-orange-500 text-white' : 'text-gray-700'}`}
            >
              Unpaid
            </button>
            <button
              type="button"
              onClick={() => setPaymentStatus('paid')}
              className={`flex-1 py-3 text-center font-bold transition-all ${paymentStatus === 'paid' ? 'bg-orange-500 text-white' : 'text-gray-700'}`}
            >
              Paid
            </button>
          </div>
        </div>

        {/* Total Price */}
        <div className="flex justify-between items-center py-4 border-t border-gray-200 mt-4">
          <span className="text-xl font-semibold text-gray-700">Total Price:</span>
          <span className="text-3xl font-bold text-orange-600">₹{totalPrice.toFixed(2)}</span>
        </div>

        {/* Submit */}
        <button
          type="submit"
          className={`w-full py-4 mt-6 text-white font-bold rounded-lg transition-colors flex items-center justify-center gap-2 ${primaryColor} ${isSubmitting ? 'opacity-70 cursor-not-allowed' : ''}`}
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
          ) : (
            <>
              <FaPlusCircle />
              Create Order
            </>
          )}
        </button>
      </form>
    </div>
  );
};

export default AddOrders;
