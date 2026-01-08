import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../api/axios";
import { AiOutlineEye, AiOutlineEyeInvisible } from "react-icons/ai";
import loginImg from "../assets/illustrations/login.svg";

const Login = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError(""); // Clear error on input change
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      // First, get the CSRF cookie from Sanctum
      await api.get("/sanctum/csrf-cookie");

      // Then, make the login request
      const response = await api.post("/api/login", {
        email: formData.email,
        password: formData.password,
      });

      // Login successful - trigger window event to refresh navbar
      window.dispatchEvent(new Event('auth-change'));
      
      // Redirect based on user role
      const userRole = response.data?.user?.role?.toLowerCase();
      if (userRole === 'admin') {
        navigate("/admin/dashboard");
      } else if (userRole === 'phlebotomist') {
        navigate("/nurse/home");
      } else if (userRole === 'donor') {
        navigate("/home");
      } else {
        navigate("/home");
      }
    } catch (err) {
      console.error('Login error:', err);
      console.error('Error response:', err.response);
      
      if (err.response?.data?.errors) {
        const errors = err.response.data.errors;
        const firstError = Object.values(errors)[0][0];
        setError(firstError);
      } else if (err.response?.data?.message) {
        setError(err.response.data.message);
      } else if (err.response?.data?.error) {
        setError(err.response.data.error);
      } else if (err.request) {
        setError("Unable to connect to server. Please check your connection.");
      } else {
        setError("Login failed. Please check your credentials.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white rounded-2xl shadow-lg flex flex-col md:flex-row w-full max-w-4xl pt-20 pb-20 pl-5">
        
        {/* Left Side - Form */}
        <div className="w-full md:w-1/2 flex flex-col justify-center px-8">
          <h2 className="text-3xl font-bold text-red-700 mb-6 text-center">
            Welcome Back!
          </h2>

          {error && (
            <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg text-sm">
              {error}
            </div>
          )}

          <form className="space-y-5" onSubmit={handleSubmit}>
            <div>
              <input
                type="email"
                name="email"
                placeholder="Email"
                value={formData.email}
                onChange={handleChange}
                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-600"
                required
              />
            </div>

            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                placeholder="Password"
                value={formData.password}
                onChange={handleChange}
                className="w-full p-3 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-600"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none"
                tabIndex={-1}
              >
                {showPassword ? (
                  <AiOutlineEyeInvisible size={20} />
                ) : (
                  <AiOutlineEye size={20} />
                )}
              </button>
            </div>

            <div className="flex justify-between items-center text-sm">
              <label className="flex items-center space-x-2 !m-0">
                <input type="checkbox" />
                <span>Remember me</span>
              </label>
              <a href="#" className="text-red-600 hover:underline">
                Forgot Password?
              </a>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-red-900 to-red-700 text-white py-3 rounded-lg hover:bg-red-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Logging in..." : "Login"}
            </button>
          </form>

          <p className="text-center text-sm mt-4 !text-[14px]">
            Don’t have an account?{" "}
            <Link to="/register" className="text-red-600 hover:underline">
              Register Here
            </Link>
          </p>
        </div>

        {/* Right Side - Illustration */}
        <div className="hidden md:flex w-100 items-center justify-center">
          <img
            src={loginImg}
            alt="Login illustration"
            className="w-full object-contain"
          />
        </div>
      </div>
    </div>
  );
};

export default Login;
