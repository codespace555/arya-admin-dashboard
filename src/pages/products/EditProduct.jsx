import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../firebase/config'; // Make sure this path is correct

// --- SVG Icon Components ---
const ArrowLeftIcon = () => <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>;
const Spinner = () => <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>;

// --- Reusable Form Components ---
const InputField = ({ label, id, ...props }) => (
    <div>
        <label htmlFor={id} className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
        <input id={id} {...props} className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 transition" />
    </div>
);

const TextareaField = ({ label, id, ...props }) => (
    <div>
        <label htmlFor={id} className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
        <textarea id={id} {...props} rows="4" className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 transition"></textarea>
    </div>
);

const ToggleSwitch = ({ label, enabled, setEnabled }) => (
    <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-gray-700">{label}</span>
        <button
            type="button"
            onClick={() => setEnabled(!enabled)}
            className={`${enabled ? 'bg-orange-500' : 'bg-gray-200'} relative inline-flex items-center h-6 rounded-full w-11 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500`}
        >
            <span className={`${enabled ? 'translate-x-6' : 'translate-x-1'} inline-block w-4 h-4 transform bg-white rounded-full transition-transform`} />
        </button>
    </div>
);


export default function EditProduct() {
    const { productId } = useParams(); // Get the product ID from the URL
    const [product, setProduct] = useState(null);
    const [isEnabled, setIsEnabled] = useState(true);
    const [loading, setLoading] = useState(false);
    const [initialLoading, setInitialLoading] = useState(true);
    const [error, setError] = useState('');
    const navigate = useNavigate();

    useEffect(() => {
        const fetchProduct = async () => {
            try {
                const docRef = doc(db, 'products', productId);
                const docSnap = await getDoc(docRef);

                if (docSnap.exists()) {
                    const data = docSnap.data();
                    setProduct({ ...data });
                    setIsEnabled(data.enable);
                } else {
                    setError("Product not found.");
                }
            } catch (err) {
                console.error("Error fetching product:", err);
                setError("Failed to load product data.");
            } finally {
                setInitialLoading(false);
            }
        };

        fetchProduct();
    }, [productId]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setProduct(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        if (!product.name || !product.price) {
            setError('Product Name and Price are required.');
            setLoading(false);
            return;
        }

        try {
            const productRef = doc(db, 'products', productId);
            await updateDoc(productRef, {
                ...product,
                price: Number(product.price),
                enable: isEnabled,
                updatedAt: serverTimestamp(),
            });
            navigate('/products');
        } catch (err) {
            console.error("Error updating product: ", err);
            setError("Failed to update product. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    if (initialLoading) {
        return <div className="text-center p-8">Loading product details...</div>;
    }

    if (error && !product) {
        return <div className="text-center text-red-500 bg-red-100 p-4 rounded-lg">{error}</div>;
    }

    return (
        <div className="space-y-8">
            <div className="flex items-center">
                <button onClick={() => navigate(-1)} className="flex items-center text-gray-500 hover:text-gray-800">
                    <ArrowLeftIcon />
                    <span className="ml-1">Back</span>
                </button>
            </div>
            
            <div className="bg-white p-8 rounded-xl shadow-md max-w-2xl mx-auto">
                <h1 className="text-2xl font-bold text-gray-800 mb-2">Edit Product</h1>
                <p className="text-gray-500 mb-6">Update the details for this product.</p>

                {/* Image Preview */}
                <div className="mb-6">
                    <img
                        src={product.imageUrl || 'https://placehold.co/600x400/F97316/FFFFFF?text=No+Image'}
                        alt={product.name || "Product Image"}
                        className="w-full h-64 object-cover rounded-lg bg-gray-100"
                        onError={(e) => { e.target.onerror = null; e.target.src='https://placehold.co/600x400/F97316/FFFFFF?text=Image+Error'; }}
                    />
                </div>
                
                {error && <p className="bg-red-100 text-red-700 p-3 rounded-lg text-center mb-4">{error}</p>}

                <form onSubmit={handleSubmit} className="space-y-6">
                    <InputField label="Product Name" id="name" name="name" type="text" value={product.name} onChange={handleChange} required />
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <InputField label="Price" id="price" name="price" type="number" value={product.price} onChange={handleChange} required />
                        <InputField label="Unit" id="unit" name="unit" type="text" value={product.unit} onChange={handleChange} />
                    </div>

                    <TextareaField label="Description" id="description" name="description" value={product.description} onChange={handleChange} />
                    
                    <InputField label="Image URL" id="imageUrl" name="imageUrl" type="text" value={product.imageUrl} onChange={handleChange} />
                    
                    <ToggleSwitch label="Enable Product" enabled={isEnabled} setEnabled={setIsEnabled} />

                    <div className="pt-4">
                        <button 
                            type="submit" 
                            disabled={loading}
                            className="w-full bg-orange-500 text-white font-bold py-3 px-4 rounded-lg shadow-md hover:bg-orange-600 transition-transform transform hover:scale-105 flex items-center justify-center disabled:bg-orange-300 disabled:cursor-not-allowed"
                        >
                            {loading ? <Spinner /> : 'Update Product'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
