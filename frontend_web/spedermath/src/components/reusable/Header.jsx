import React from "react";

function Header() {
  return (
    <header className="flex justify-between items-center bg-white p-4 shadow-md rounded-md">
      <div className="flex items-center space-x-3">
        <div className="w-10 h-10 bg-gray-300 rounded-full"></div>
        <div>
          <h3 className="font-semibold">Teacher Leilah Garcia</h3>
          <p className="text-sm text-gray-500">Hello! Welcome back!</p>
        </div>
      </div>
      <p className="text-sm text-gray-500">Premium Plan</p>
    </header>
  );
}

export default Header;
