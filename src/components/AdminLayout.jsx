import React, { useState, useEffect } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { getAuth, signOut, onAuthStateChanged } from 'firebase/auth';

// --- Updated SVG Icon Components (Modern, filled style) ---
const DashboardIcon = () => <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor"><path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8h5z" /></svg>;
const ProductsIcon = () => <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor"><path d="M20 4H4v2h16V4zm1 10v-2l-1-5H4l-1 5v2h1v6h10v-6h4v6h2v-6h1zm-9 4H6v-4h6v4z" /></svg>;
const OrdersIcon = () => <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor"><path d="M19 3h-4.18C14.4 1.84 13.3 1 12 1s-2.4.84-2.82 2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 0c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zm2 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z" /></svg>;
const UsersIcon = () => <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" /></svg>;
const LogoutIcon = () => <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor"><path d="M17 7l-1.41 1.41L18.17 11H8v2h10.17l-2.58 2.58L17 17l5-5-5-5zM4 5h8V3H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h8v-2H4V5z" /></svg>;
const MenuIcon = () => <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>;
const UserCircleIcon = () => <svg className="w-10 h-10 text-slate-500" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-6-3a2 2 0 11-4 0 2 2 0 014 0zm-2 4a5 5 0 00-4.546 2.916A5.986 5.986 0 0010 16a5.986 5.986 0 004.546-2.084A5 5 0 0012 11z" clipRule="evenodd"></path></svg>;

/**
 * The Sidebar component containing navigation links.
 */
const Sidebar = ({ isSidebarOpen, setSidebarOpen }) => {
    const navigate = useNavigate();
    const [user, setUser] = useState(null);

    useEffect(() => {
        const auth = getAuth();
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            setUser(currentUser);
        });
        return () => unsubscribe();
    }, []);

    const handleLogout = () => {
        const auth = getAuth();
        signOut(auth).then(() => {
            navigate('/login');
        }).catch((error) => {
            console.error("Logout Error:", error);
        });
    };
    
    const baseLinkClass = "flex items-center px-4 py-3 text-gray-300 rounded-lg hover:bg-slate-700 hover:text-white transition-all duration-200";
    const activeLinkClass = "bg-orange-500 text-white font-bold shadow-lg";

    return (
        <aside className={`fixed top-0 left-0 z-40 w-64 h-screen bg-slate-800 shadow-xl transition-transform duration-300 ease-in-out ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0`}>
            <div className="flex flex-col h-full">
                {/* Logo */}
                <div className="px-6 py-5 border-b border-slate-700">
                    <h1 style={{ fontFamily: "'Playfair Display', serif" }} className="text-3xl font-bold text-white">
                        Arya & Co.
                    </h1>
                    <p className="text-sm text-slate-400">Admin Panel</p>
                </div>

                {/* Navigation Links */}
                <nav className="flex-1 px-4 py-4 space-y-2">
                    <NavLink to="/" onClick={() => setSidebarOpen(false)} className={({ isActive }) => `${baseLinkClass} ${isActive ? activeLinkClass : ''}`}>
                        <DashboardIcon />
                        <span className="ml-4">Dashboard</span>
                    </NavLink>
                    <NavLink to="/products" onClick={() => setSidebarOpen(false)} className={({ isActive }) => `${baseLinkClass} ${isActive ? activeLinkClass : ''}`}>
                        <ProductsIcon />
                        <span className="ml-4">Products</span>
                    </NavLink>
                    <NavLink to="/orders" onClick={() => setSidebarOpen(false)} className={({ isActive }) => `${baseLinkClass} ${isActive ? activeLinkClass : ''}`}>
                        <OrdersIcon />
                        <span className="ml-4">Orders</span>
                    </NavLink>
                     <NavLink to="/users" onClick={() => setSidebarOpen(false)} className={({ isActive }) => `${baseLinkClass} ${isActive ? activeLinkClass : ''}`}>
                        <UsersIcon />
                        <span className="ml-4">Users</span>
                    </NavLink>
                </nav>

                {/* User Profile & Logout */}
                <div className="px-4 py-4 mt-auto border-t border-slate-700">
                    <div className="flex items-center p-2 rounded-lg bg-slate-700/50">
                        <UserCircleIcon />
                        <div className="ml-3">
                            <p className="text-sm font-semibold text-white">{user?.displayName || "Admin User"}</p>
                            <p className="text-xs text-slate-400">{user?.phoneNumber || "No phone"}</p>
                        </div>
                    </div>
                     <button onClick={handleLogout} className="flex items-center w-full px-4 py-3 mt-4 text-gray-300 rounded-lg hover:bg-red-800/50 hover:text-white transition-colors duration-200">
                        <LogoutIcon />
                        <span className="ml-4">Logout</span>
                    </button>
                </div>
            </div>
        </aside>
    );
};


/**
 * The main Layout component that includes the Sidebar and the main content area.
 */
export default function AdminLayout() {
    const [isSidebarOpen, setSidebarOpen] = useState(false);

    return (
        <div className="min-h-screen bg-slate-100 font-sans">
            <Sidebar isSidebarOpen={isSidebarOpen} setSidebarOpen={setSidebarOpen} />
            
            <div className="md:ml-64 transition-all duration-300 ease-in-out">
                {/* Top bar for mobile (hamburger menu) */}
                <header className="md:hidden bg-white shadow-sm p-4 flex justify-between items-center sticky top-0 z-20">
                    <h1 style={{ fontFamily: "'Playfair Display', serif" }} className="text-xl font-bold text-slate-800">
                        Arya & Co.
                    </h1>
                    <button onClick={() => setSidebarOpen(!isSidebarOpen)} className="text-slate-600 hover:text-orange-500">
                        <MenuIcon />
                    </button>
                </header>

                {/* Main Content Area */}
                <main className="p-4 md:p-8">
                    <Outlet />
                </main>
            </div>
            
            {/* Overlay for mobile when sidebar is open */}
            {isSidebarOpen && (
                <div 
                    className="md:hidden fixed inset-0 bg-black opacity-50 z-30" 
                    onClick={() => setSidebarOpen(false)}
                ></div>
            )}
        </div>
    );
}
