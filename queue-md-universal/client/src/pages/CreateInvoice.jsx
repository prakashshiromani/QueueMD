import React, { useState } from 'react';
import Layout from '../components/Layout';

const CreateInvoice = () => {
  const [invoiceData, setInvoiceData] = useState({
    invoiceNumber: `INV-${Math.floor(1000 + Math.random() * 9000)}`,
    date: new Date().toISOString().split('T')[0],
    patientName: '',
    patientId: '',
    status: 'Pending',
    items: [{ id: 1, description: '', quantity: 1, price: 0 }],
    discount: 0,
    taxRate: 18,
    paymentMethod: 'Cash'
  });

  const addItem = () => {
    const newItem = {
      id: Date.now(),
      description: '',
      quantity: 1,
      price: 0
    };
    setInvoiceData({ ...invoiceData, items: [...invoiceData.items, newItem] });
  };

  const removeItem = (id) => {
    if (invoiceData.items.length > 1) {
      setInvoiceData({
        ...invoiceData,
        items: invoiceData.items.filter(item => item.id !== id)
      });
    }
  };

  const updateItem = (id, field, value) => {
    const updatedItems = invoiceData.items.map(item => {
      if (item.id === id) {
        return { ...item, [field]: value };
      }
      return item;
    });
    setInvoiceData({ ...invoiceData, items: updatedItems });
  };

  const subtotal = invoiceData.items.reduce((acc, item) => acc + (item.quantity * item.price), 0);
  const taxAmount = (subtotal * invoiceData.taxRate) / 100;
  const total = subtotal + taxAmount - invoiceData.discount;

  return (
    <Layout>
      <div className="w-full space-y-6 pb-20">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => window.history.back()}
              className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-text-secondary hover:text-text-primary hover:bg-white/10 transition-all"
            >
              <span className="material-symbols-outlined">arrow_back</span>
            </button>
            <div>
              <h1 className="text-[32px] font-black text-text-primary tracking-tight">Create Invoice</h1>
              <p className="text-[14px] text-text-secondary mt-1">Generate a new billing statement for a patient</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button className="px-6 h-[46px] rounded-xl bg-white/5 border border-white/10 text-text-primary font-bold text-[14px] hover:bg-white/10 transition-all flex items-center gap-2">
              <span className="material-symbols-outlined text-[20px]">print</span>
              Preview
            </button>
            <button className="px-8 h-[46px] rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-[14px] shadow-lg shadow-blue-600/20 transition-all active:scale-[0.98] flex items-center gap-2">
              <span className="material-symbols-outlined text-[20px]">save</span>
              Save Invoice
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Invoice Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Patient & Basic Info */}
            <div className="bg-bg-secondary/50 backdrop-blur-md border border-white/10 rounded-2xl p-6 shadow-xl space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-black text-text-secondary uppercase tracking-widest block ml-1">Patient Name</label>
                  <div className="relative">
                    <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-text-secondary text-[20px]">person</span>
                    <input
                      type="text"
                      placeholder="Search patient..."
                      className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-11 pr-4 text-[14px] text-text-primary focus:ring-2 focus:ring-blue-500/50 outline-none transition-all shadow-inner"
                      value={invoiceData.patientName}
                      onChange={(e) => setInvoiceData({ ...invoiceData, patientName: e.target.value })}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-black text-text-secondary uppercase tracking-widest block ml-1">Invoice #</label>
                    <input
                      type="text"
                      className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-[14px] text-text-primary focus:ring-2 focus:ring-blue-500/50 outline-none transition-all shadow-inner font-mono"
                      value={invoiceData.invoiceNumber}
                      readOnly
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-black text-text-secondary uppercase tracking-widest block ml-1">Date</label>
                    <input
                      type="date"
                      className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-[14px] text-text-primary focus:ring-2 focus:ring-blue-500/50 outline-none transition-all shadow-inner"
                      value={invoiceData.date}
                      onChange={(e) => setInvoiceData({ ...invoiceData, date: e.target.value })}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Items Table */}
            <div className="bg-bg-secondary/50 backdrop-blur-md border border-white/10 rounded-2xl shadow-xl overflow-hidden">
              <div className="p-4 border-b border-white/10 bg-white/5 flex justify-between items-center">
                <h3 className="text-[14px] font-bold text-text-primary uppercase tracking-wider">Line Items</h3>
                <button
                  onClick={addItem}
                  className="flex items-center gap-2 px-4 py-1.5 rounded-lg bg-blue-600/10 text-blue-400 border border-blue-500/20 hover:bg-blue-600/20 transition-all text-[12px] font-bold"
                >
                  <span className="material-symbols-outlined text-[18px]">add</span>
                  Add Item
                </button>
              </div>
              <div className="p-0 overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-white/5 text-[11px] font-black text-text-secondary uppercase tracking-widest">
                      <th className="px-6 py-4">Description</th>
                      <th className="px-6 py-4 w-24">Qty</th>
                      <th className="px-6 py-4 w-32">Price ($)</th>
                      <th className="px-6 py-4 w-32">Total ($)</th>
                      <th className="px-6 py-4 w-16 text-center"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {invoiceData.items.map((item) => (
                      <tr key={item.id} className="group hover:bg-white/[0.02] transition-colors">
                        <td className="px-6 py-4">
                          <input
                            type="text"
                            placeholder="Consultation, Lab Test, etc."
                            className="w-full bg-transparent border-none p-0 text-[14px] text-text-primary placeholder:text-text-secondary/30 focus:ring-0 outline-none"
                            value={item.description}
                            onChange={(e) => updateItem(item.id, 'description', e.target.value)}
                          />
                        </td>
                        <td className="px-6 py-4">
                          <input
                            type="number"
                            className="w-full bg-transparent border-none p-0 text-[14px] text-text-primary focus:ring-0 outline-none"
                            value={item.quantity}
                            onChange={(e) => updateItem(item.id, 'quantity', parseInt(e.target.value) || 0)}
                          />
                        </td>
                        <td className="px-6 py-4">
                          <input
                            type="number"
                            className="w-full bg-transparent border-none p-0 text-[14px] text-text-primary focus:ring-0 outline-none"
                            value={item.price}
                            onChange={(e) => updateItem(item.id, 'price', parseFloat(e.target.value) || 0)}
                          />
                        </td>
                        <td className="px-6 py-4 font-bold text-text-primary text-[14px]">
                          ${(item.quantity * item.price).toFixed(2)}
                        </td>
                        <td className="px-6 py-4 text-center">
                          <button
                            onClick={() => removeItem(item.id)}
                            className="text-text-secondary hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all"
                          >
                            <span className="material-symbols-outlined text-[20px]">delete</span>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Summary & Settings */}
          <div className="space-y-6">
            {/* Totals Section */}
            <div className="bg-blue-600 rounded-2xl p-6 text-white shadow-xl shadow-blue-600/20 space-y-4">
              <h3 className="text-[14px] font-black uppercase tracking-widest opacity-80">Invoice Summary</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center text-[14px]">
                  <span className="opacity-70">Subtotal</span>
                  <span className="font-bold">${subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center text-[14px]">
                  <span className="opacity-70">Tax ({invoiceData.taxRate}%)</span>
                  <span className="font-bold">${taxAmount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center text-[14px]">
                  <span className="opacity-70">Discount</span>
                  <input
                    type="number"
                    className="w-20 bg-white/10 border-none rounded py-0.5 px-2 text-[14px] text-white text-right outline-none focus:ring-1 focus:ring-white/30"
                    value={invoiceData.discount}
                    onChange={(e) => setInvoiceData({ ...invoiceData, discount: parseFloat(e.target.value) || 0 })}
                  />
                </div>
                <div className="h-[1px] bg-white/20 my-2"></div>
                <div className="flex justify-between items-center">
                  <span className="text-[16px] font-black uppercase tracking-widest">Grand Total</span>
                  <span className="text-[24px] font-black">${total.toFixed(2)}</span>
                </div>
              </div>
            </div>

            {/* Payment Settings */}
            <div className="bg-bg-secondary/50 backdrop-blur-md border border-white/10 rounded-2xl p-6 shadow-xl space-y-6">
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-black text-text-secondary uppercase tracking-widest block ml-1">Payment Status</label>
                  <div className="flex gap-2">
                    {['Paid', 'Pending', 'Partial'].map(status => (
                      <button
                        key={status}
                        onClick={() => setInvoiceData({ ...invoiceData, status: status })}
                        className={`flex-1 py-2.5 rounded-xl text-[12px] font-bold border transition-all ${invoiceData.status === status
                            ? 'bg-blue-500 text-white border-blue-400 shadow-lg shadow-blue-500/20'
                            : 'bg-white/5 border-white/10 text-text-secondary hover:text-text-primary'
                          }`}
                      >
                        {status}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-black text-text-secondary uppercase tracking-widest block ml-1">Payment Method</label>
                  <div className="relative">
                    <select
                      className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-[14px] text-text-primary appearance-none focus:ring-2 focus:ring-blue-500/50 outline-none transition-all shadow-inner backdrop-blur-md cursor-pointer"
                      value={invoiceData.paymentMethod}
                      onChange={(e) => setInvoiceData({ ...invoiceData, paymentMethod: e.target.value })}
                    >
                      <option value="Cash" className="bg-bg-secondary">Cash Payment</option>
                      <option value="Card" className="bg-bg-secondary">Credit / Debit Card</option>
                      <option value="Online" className="bg-bg-secondary">Online Transfer / UPI</option>
                      <option value="Insurance" className="bg-bg-secondary">Insurance Claim</option>
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-text-secondary/50">
                      <span className="material-symbols-outlined text-[18px]">expand_more</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default CreateInvoice;
