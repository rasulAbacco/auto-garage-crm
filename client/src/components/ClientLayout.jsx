import React from "react";
import { Outlet } from "react-router-dom";

export default function ClientsLayout() {
    return (
        <div className="min-h-screen">
            <Outlet /> {/* ✅ Child route (list, detail, or form) renders here */}
        </div>
    );
}
