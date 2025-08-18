import React, { useState, useEffect } from "react";
import { collection, getDocs, query } from "firebase/firestore";
import { db } from "../../firebase/config.js";
import {
  FaUserCircle,
  FaEnvelope,
  FaPhone,
  FaSearch,
  FaSpinner,
} from "react-icons/fa";
import { Link } from "react-router-dom";

const UsersList = () => {
  const [users, setUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const usersCollectionRef = collection(db, "users");
        const q = query(usersCollectionRef);
        const querySnapshot = await getDocs(q);

        const usersData = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setUsers(usersData);
      } catch (err) {
        console.error("Error fetching users: ", err);
        setError("Failed to load user data.");
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  const filteredUsers = users.filter((user) =>
    user.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
      <h1 className="text-3xl font-bold text-center text-orange-600 mb-8">
        User List
      </h1>

      <div className="max-w-xl mx-auto mb-6 relative">
        <input
          type="text"
          placeholder="Search users by name..."
          className="w-full p-3 pl-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
        {filteredUsers.length === 0 ? (
          <div className="col-span-full text-center text-gray-500 text-lg">
            No users found matching your search.
          </div>
        ) : (
          filteredUsers.map((user) => (
            <div
              key={user.id}
              className="bg-white p-6 rounded-lg shadow-md flex flex-col justify-between"
            >
              <div>
                <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2 mb-2">
                  <FaUserCircle className="text-orange-500" />
                  {user.name}
                </h2>
                <div className="space-y-2 text-gray-600 mb-4">
                  <p className="flex items-center gap-2">
                    <FaEnvelope className="text-gray-400" />
                    {user.email}
                  </p>
                  <p className="flex items-center gap-2">
                    <FaPhone className="text-gray-400" />
                    {user.phone}
                  </p>
                </div>
              </div>
              <Link
                to={`/users/user-orders/${user.id}`}
                className="mt-4 inline-block text-center bg-orange-500 text-white font-bold py-2 px-4 rounded-lg hover:bg-orange-600 transition-colors"
              >
                View Orders
              </Link>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default UsersList;
