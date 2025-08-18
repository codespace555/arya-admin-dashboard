import React, { useState, useEffect } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../firebase/config';




const useAuthStatus = () => {

    const [loggedIn, setLoggedIn] = useState(false);
    const [checkingStatus, setCheckingStatus] = useState(true);

    useEffect(() => {

        const unsubscribe = onAuthStateChanged(auth, (user) => {
            if (user) {
                setLoggedIn(true);
            } else {
                setLoggedIn(false);
            }
            setCheckingStatus(false);
        });


        return unsubscribe;
    }, []);

    return { loggedIn, checkingStatus };
};



const ProtectedRoute = () => {
    const { loggedIn, checkingStatus } = useAuthStatus();
    if (checkingStatus) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-rose-50">
                <h3 className="text-2xl font-bold text-gray-600">Loading...</h3>
            </div>
        );
    }
    return loggedIn ? <Outlet /> : <Navigate to="/login" />;
};

export default ProtectedRoute;