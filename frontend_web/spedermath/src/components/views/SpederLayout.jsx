import React, { useState } from "react";
import Sidebar from "../../components/reusable/Sidebar";

function SpederLayout({ children, onLogout }) {
  const [expanded, setExpanded] = useState(true);

  return (
    <div className="flex h-screen w-screen overflow-hidden">
      <Sidebar expanded={expanded} setExpanded={setExpanded} onLogout={onLogout} />
      <main className="flex-1 bg-gray-100 p-4">
        {children}
      </main>
    </div>
  );
}

export default SpederLayout;
