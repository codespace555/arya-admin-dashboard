import "./App.css";
import AdminLayout from "./components/AdminLayout";
import ProtectedRoute from "./components/ProtectedRoute";
import Dashboard from "./pages/Dashboard";
import Login from "./pages/Login";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import ProductsList from "./pages/products/ProductsList";
import AddProduct from "./pages/products/AddProduct";
import EditProduct from "./pages/products/EditProduct";
import UsersList from "./pages/users/UsersList";
import AddOrders from "./pages/orders/AddOrders";
import OrdersList from "./pages/orders/OrdersList";
import UsersOrder from "./pages/users/UsersOrder";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />

        // Wrap your protected routes with the AdminLayout component
        <Route element={<ProtectedRoute />}>
          <Route element={<AdminLayout />}>
            // All pages inside here will have the sidebar
            <Route path="/" element={<Dashboard />} />
            <Route path="/products" element={<ProductsList />} />
            <Route path="/products/add" element={<AddProduct />} />
            <Route path="/products/edit/:productId" element={<EditProduct />} />
            <Route path="/orders" element={<OrdersList />} />
            <Route path="/orders/add" element={<AddOrders />} />
            <Route path="/users/user-orders/:userId" element={<UsersOrder />} />
            <Route path="/users" element={<UsersList />} />

          </Route>
        </Route>

      </Routes>
    </Router>
  );
}

export default App;
