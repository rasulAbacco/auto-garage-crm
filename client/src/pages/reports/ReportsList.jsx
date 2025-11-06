// client/src/pages/reports/ReportsList.jsx
import React, { useState } from "react";

export default function ReportsList({ invoices, clients, isDark }) {
    const [selectedInvoice, setSelectedInvoice] = useState(null);
    const [invoiceDetails, setInvoiceDetails] = useState(null);

    const base = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

    const openInvoice = async (inv) => {
        setSelectedInvoice(inv);
        const token = localStorage.getItem("token");
        const res = await fetch(`${base}/api/reports/invoice/${inv.id}`, {
            headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        setInvoiceDetails(data);
    };

    return (
        <div className="space-y-6">
            {/* Recent Invoices Card */}
            <div
                className={`rounded-3xl border shadow-lg ${isDark ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"
                    }`}
            >
                <div
                    className={`p-5 border-b ${isDark
                            ? "border-gray-700 bg-gradient-to-r from-gray-800 to-gray-700"
                            : "border-gray-200 bg-gradient-to-r from-green-600 to-teal-600"
                        } text-white`}
                >
                    <h3 className="text-2xl font-bold">Recent Invoices</h3>
                    <p className="text-sm text-white/80">Click any invoice for details</p>
                </div>

                <div className="p-6">
                    {invoices.length === 0 ? (
                        <div className="text-gray-500">No invoices found.</div>
                    ) : (
                        invoices.slice(0, 10).map((inv) => (
                            <div
                                key={inv.id}
                                onClick={() => openInvoice(inv)}
                                className="py-3 flex justify-between cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 px-3 rounded-lg transition"
                            >
                                <div>
                                    <div className="font-semibold">Invoice #{inv.id}</div>
                                    <div className="text-xs text-gray-400">
                                        {inv.client?.fullName || `Client #${inv.clientId}`}
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="font-bold">
                                        ${Number(inv.grandTotal || 0).toFixed(2)}
                                    </div>
                                    <div
                                        className={`text-xs mt-1 ${inv.status === "Paid"
                                                ? "text-green-500"
                                                : inv.status === "Pending"
                                                    ? "text-yellow-500"
                                                    : "text-red-500"
                                            }`}
                                    >
                                        {inv.status}
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Invoice Detail Modal */}
            {invoiceDetails && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                    <div
                        className={`max-w-3xl w-full rounded-2xl overflow-hidden ${isDark
                                ? "bg-gray-900 text-white border border-gray-700"
                                : "bg-white text-gray-900 border border-gray-200"
                            } shadow-2xl`}
                    >
                        {/* Modal Header */}
                        <div
                            className={`p-4 flex items-center justify-between border-b ${isDark ? "border-gray-800 bg-gray-800" : "border-gray-100 bg-gray-50"
                                }`}
                        >
                            <h3 className="text-xl font-bold">
                                Invoice #{invoiceDetails.id}
                            </h3>
                            <button
                                onClick={() => setInvoiceDetails(null)}
                                className={`px-4 py-2 rounded-lg ${isDark
                                        ? "bg-gray-800 hover:bg-gray-700"
                                        : "bg-gray-100 hover:bg-gray-200"
                                    }`}
                            >
                                Close
                            </button>
                        </div>

                        {/* Modal Body */}
                        <div className="p-6 space-y-6 overflow-y-auto max-h-[75vh]">
                            {/* Invoice Header */}
                            <div className="border-b pb-4">
                                <p className="text-sm text-gray-400">
                                    Issued:{" "}
                                    {invoiceDetails.issuedAt
                                        ? new Date(invoiceDetails.issuedAt).toLocaleDateString()
                                        : "N/A"}{" "}
                                    | Due:{" "}
                                    {invoiceDetails.dueDate
                                        ? new Date(invoiceDetails.dueDate).toLocaleDateString()
                                        : "N/A"}
                                </p>
                                <p
                                    className={`font-semibold mt-1 ${invoiceDetails.status === "Paid"
                                            ? "text-green-500"
                                            : invoiceDetails.status === "Pending"
                                                ? "text-yellow-500"
                                                : "text-red-500"
                                        }`}
                                >
                                    Status: {invoiceDetails.status}
                                </p>
                            </div>

                            {/* Client Info */}
                            {invoiceDetails.client && (
                                <div>
                                    <h3 className="font-semibold text-lg mb-2">
                                        Client Information
                                    </h3>
                                    <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
                                        <div>
                                            <b>Name:</b> {invoiceDetails.client.fullName}
                                        </div>
                                        <div>
                                            <b>Phone:</b> {invoiceDetails.client.phone}
                                        </div>
                                        <div>
                                            <b>Email:</b> {invoiceDetails.client.email}
                                        </div>
                                        <div>
                                            <b>Address:</b> {invoiceDetails.client.address}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Vehicle Info */}
                            <div>
                                <h3 className="font-semibold text-lg mb-2">
                                    Vehicle Information
                                </h3>
                                <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
                                    <div>
                                        <b>Make:</b> {invoiceDetails.client?.vehicleMake}
                                    </div>
                                    <div>
                                        <b>Model:</b> {invoiceDetails.client?.vehicleModel}
                                    </div>
                                    <div>
                                        <b>Year:</b> {invoiceDetails.client?.vehicleYear}
                                    </div>
                                    <div>
                                        <b>Reg No:</b> {invoiceDetails.client?.regNumber}
                                    </div>
                                    <div>
                                        <b>VIN:</b> {invoiceDetails.client?.vin}
                                    </div>
                                </div>
                            </div>

                            {/* Service Details */}
                            <div>
                                <h3 className="font-semibold text-lg mb-3">Service Details</h3>
                                {invoiceDetails.services?.length === 0 ? (
                                    <p className="text-sm text-gray-500">
                                        No services linked to this invoice.
                                    </p>
                                ) : (
                                    invoiceDetails.services.map((srv) => (
                                        <div
                                            key={srv.id}
                                            className={`p-4 rounded-lg border mb-2 ${isDark
                                                    ? "border-gray-700 bg-gray-800"
                                                    : "border-gray-200 bg-gray-50"
                                                }`}
                                        >
                                            <div className="flex justify-between items-center">
                                                <div className="font-semibold">{srv.type}</div>
                                                <div className="font-bold text-green-500">
                                                    ${Number(srv.cost || 0).toFixed(2)}
                                                </div>
                                            </div>
                                            <p className="text-sm text-gray-400 mt-1">
                                                {srv.description || "No description"}
                                            </p>
                                            <p className="text-xs text-gray-500 mt-2">
                                                Date:{" "}
                                                {srv.date
                                                    ? new Date(srv.date).toLocaleDateString()
                                                    : "N/A"}{" "}
                                                | Status:{" "}
                                                <span
                                                    className={
                                                        srv.status === "Completed"
                                                            ? "text-green-400"
                                                            : srv.status === "Pending"
                                                                ? "text-yellow-400"
                                                                : "text-gray-400"
                                                    }
                                                >
                                                    {srv.status}
                                                </span>
                                            </p>
                                        </div>
                                    ))
                                )}
                            </div>

                            {/* Totals */}
                            <div className="border-t pt-4 text-right">
                                <div className="text-sm text-gray-400">
                                    Subtotal: ${Number(invoiceDetails.totalAmount || 0).toFixed(2)}{" "}
                                    <br />
                                    Tax: ${Number(invoiceDetails.tax || 0).toFixed(2)} | Discount: $
                                    {Number(invoiceDetails.discount || 0).toFixed(2)}
                                </div>
                                <h3 className="text-xl font-bold mt-2">
                                    Grand Total: ${Number(invoiceDetails.grandTotal || 0).toFixed(2)}
                                </h3>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
