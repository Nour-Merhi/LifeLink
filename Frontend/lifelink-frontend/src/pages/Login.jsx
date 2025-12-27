import React from "react";
import { Link } from "react-router-dom";
import loginImg from "../assets/illustrations/login.svg";

const Login = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white rounded-2xl shadow-lg flex flex-col md:flex-row w-full max-w-4xl p-6">
        
        {/* Left Side - Form */}
        <div className="w-full md:w-1/2 flex flex-col justify-center px-8">
          <h2 className="text-2xl font-bold text-red-700 mb-6 text-center">
            Welcome Back!
          </h2>

          <form className="space-y-5">
            <div>
              <input
                type="email"
                placeholder="Email"
                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-600"
                required
              />
            </div>

            <div>
              <input
                type="password"
                placeholder="Password"
                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-600"
                required
              />
            </div>

            <div className="flex justify-between items-center text-sm">
              <label className="flex items-center space-x-2">
                <input type="checkbox" />
                <span>Remember me</span>
              </label>
              <a href="#" className="text-red-600 hover:underline">
                Forgot Password?
              </a>
            </div>

            <button
              type="submit"
              className="w-full bg-gradient-to-r from-red-900 to-red-700 text-white py-3 rounded-lg hover:bg-red-700 transition"
            >
              Login
            </button>
          </form>

          <p className="text-center text-sm mt-4">
            Don’t have an account?{" "}
            <Link to="/register" className="text-red-600 hover:underline">
              Register Here
            </Link>
          </p>
        </div>

        {/* Right Side - Illustration */}
        <div className="hidden md:flex w-1/2 items-center justify-center">
          <img
            src={loginImg}
            alt="Login illustration"
            className="w-3/4 object-contain"
          />
        </div>
      </div>
    </div>
  );
};

export default Login;
