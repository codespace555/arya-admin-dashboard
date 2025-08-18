import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, getDocs, doc, deleteDoc, query, orderBy } from 'firebase/firestore';
import { db } from '../../firebase/config'; // Make sure this path is correct

// --- SVG Icon Components ---
const PlusIcon = () => <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" /></svg>;
const EditIcon = () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>;
const DeleteIcon = () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>;
const WarningIcon = () => <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>;

// --- Reusable Components ---
const ProductRowSkeleton = () => (
    <tr className="border-b border-gray-100">
        <td className="p-4"><div className="h-12 w-12 bg-gray-200 rounded-md animate-pulse"></div></td>
        <td className="p-4"><div className="h-4 w-40 bg-gray-200 rounded-md animate-pulse"></div></td>
        <td className="p-4 hidden md:table-cell"><div className="h-4 w-20 bg-gray-200 rounded-md animate-pulse"></div></td>
        <td className="p-4 hidden sm:table-cell"><div className="h-4 w-16 bg-gray-200 rounded-md animate-pulse"></div></td>
        <td className="p-4"><div className="flex gap-2"><div className="h-8 w-8 bg-gray-200 rounded-md animate-pulse"></div><div className="h-8 w-8 bg-gray-200 rounded-md animate-pulse"></div></div></td>
    </tr>
);

const ConfirmationModal = ({ isOpen, onClose, onConfirm, title, message }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4">
            <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
                <div className="flex items-start">
                    <div className="flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
                        <WarningIcon />
                    </div>
                    <div className="ml-4 text-left">
                        <h3 className="text-lg leading-6 font-bold text-gray-900">{title}</h3>
                        <div className="mt-2">
                            <p className="text-sm text-gray-500">{message}</p>
                        </div>
                    </div>
                </div>
                <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
                    <button
                        type="button"
                        className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:ml-3 sm:w-auto sm:text-sm transition"
                        onClick={onConfirm}
                    >
                        Delete
                    </button>
                    <button
                        type="button"
                        className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:w-auto sm:text-sm transition"
                        onClick={onClose}
                    >
                        Cancel
                    </button>
                </div>
            </div>
        </div>
    );
};


export default function ProductsList() {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [productToDelete, setProductToDelete] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchProducts = async () => {
            setLoading(true);
            try {
                const productsRef = collection(db, 'products');
                const q = query(productsRef, orderBy('name', 'asc'));
                const querySnapshot = await getDocs(q);
                const productsData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                setProducts(productsData);
            } catch (err) {
                console.error("Error fetching products:", err);
                setError("Could not load products. Please try again later.");
            } finally {
                setLoading(false);
            }
        };
        fetchProducts();
    }, []);

    const handleDeleteClick = (product) => {
        setProductToDelete(product);
        setIsModalOpen(true);
    };

    const handleConfirmDelete = async () => {
        if (!productToDelete) return;
        try {
            await deleteDoc(doc(db, 'products', productToDelete.id));
            setProducts(prevProducts => prevProducts.filter(p => p.id !== productToDelete.id));
        } catch (err) {
            console.error("Error deleting product:", err);
            alert("Failed to delete the product. Please try again.");
        } finally {
            setIsModalOpen(false);
            setProductToDelete(null);
        }
    };

    if (error) {
        return <div className="text-center text-red-500 bg-red-100 p-4 rounded-lg">{error}</div>;
    }

    return (
        <div className="space-y-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-800">Products</h1>
                    <p className="text-gray-500">Manage all products in your store.</p>
                </div>
                <button
                    onClick={() => navigate('/products/add')}
                    className="bg-orange-500 text-white font-bold py-2 px-4 rounded-lg shadow-md hover:bg-orange-600 transition-transform transform hover:scale-105 flex items-center justify-center"
                >
                    <PlusIcon /> Add New Product
                </button>
            </div>

            <div className="bg-white rounded-xl shadow-md overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 border-b-2 border-gray-100">
                            <tr>
                                <th className="p-4 text-sm font-semibold text-gray-500">Image</th>
                                <th className="p-4 text-sm font-semibold text-gray-500">Product Name</th>
                                <th className="p-4 text-sm font-semibold text-gray-500 hidden md:table-cell">Price</th>
                                <th className="p-4 text-sm font-semibold text-gray-500 hidden sm:table-cell">Unit</th>
                                <th className="p-4 text-sm font-semibold text-gray-500">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <>
                                    <ProductRowSkeleton />
                                    <ProductRowSkeleton />
                                    <ProductRowSkeleton />
                                </>
                            ) : (
                                products.map((product, index) => (
                                    <tr
                                        key={product.id}
                                        className={`border-b border-gray-100 transition-colors ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'} hover:bg-gray-100`}
                                    >
                                        <td className="p-4">
                                            <img
                                                src={product.imageUrl || 'https://placehold.co/100x100/F97316/FFFFFF?text=No+Image'}
                                                alt={product.name}
                                                className="w-12 h-12 object-cover rounded-md"
                                                onError={(e) => { e.target.onerror = null; e.target.src = 'https://placehold.co/100x100/F97316/FFFFFF?text=Error'; }}
                                            />
                                        </td>
                                        <td className="p-4 font-medium text-gray-800">{product.name}</td>
                                        <td className="p-4 text-gray-600 hidden md:table-cell">₹{product.price?.toLocaleString('en-IN')}</td>
                                        <td className="p-4 text-gray-600 hidden sm:table-cell">{product.unit}</td>
                                        <td className="p-4">
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => navigate(`/products/edit/${product.id}`)}
                                                    className="p-2 text-blue-600 bg-blue-100 rounded-md hover:bg-blue-200 transition"
                                                    aria-label={`Edit ${product.name}`}
                                                >
                                                    <EditIcon />
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteClick(product)}
                                                    className="p-2 text-red-600 bg-red-100 rounded-md hover:bg-red-200 transition"
                                                    aria-label={`Delete ${product.name}`}
                                                >
                                                    <DeleteIcon />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
                {!loading && products.length === 0 && (
                    <p className="text-center text-gray-500 py-12">No products found. Click "Add New Product" to get started.</p>
                )}
            </div>

            <ConfirmationModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onConfirm={handleConfirmDelete}
                title="Confirm Deletion"
                message={`Are you sure you want to delete "${productToDelete?.name}"? This action cannot be undone.`}
            />
        </div>
    );
}
