'use client';

import { useState, useEffect } from 'react';
import { collection, getDocs, deleteDoc, doc, query, orderBy, addDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import theme from '@/lib/theme';
import { MdDelete, MdAdd, MdClose, MdVisibility } from 'react-icons/md';
import toast from 'react-hot-toast';

export default function FleetPage() {
  const [fleet, setFleet] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedFleet, setSelectedFleet] = useState(null);

  const [newFleetForm, setNewFleetForm] = useState({
    limoCompany: '',
    limoCompanyId: '',
    captainName: '',
    captainId: '',
    paymentDate: '',
    paymentId: '',
    paymentMethod: '',
    totalDriverBaseCost: 0,
    totalDriverOtherCost: 0,
    totalDriverPayment: 0,
    tips: 0,
  });

  // Load fleet from Firestore
  useEffect(() => {
    loadFleet();
  }, []);

  const loadFleet = async () => {
    try {
      setLoading(true);
      const q = query(collection(db, 'fleet'), orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(q);
      const fleetData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));
      console.log('✅ Loaded fleet records:', fleetData.length);
      console.log('Sample fleet:', fleetData[0]);
      setFleet(fleetData);
    } catch (error) {
      console.error('❌ Error loading fleet:', error);
      toast.error(`Failed to load fleet: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    
    // Parse numeric fields
    if (['totalDriverBaseCost', 'totalDriverOtherCost', 'totalDriverPayment', 'tips'].includes(name)) {
      setNewFleetForm(prev => ({
        ...prev,
        [name]: value === '' ? 0 : parseFloat(value) || 0,
      }));
    } else {
      setNewFleetForm(prev => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  const saveFleetToFirestore = async (e) => {
    e.preventDefault();

    if (!newFleetForm.captainName && !newFleetForm.limoCompany) {
      toast.error('Captain Name or Limo Company is required');
      return;
    }

    try {
      const fleetData = {
        ...newFleetForm,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await addDoc(collection(db, 'fleet'), fleetData);
      toast.success('Fleet record added successfully!');
      setShowAddModal(false);
      setNewFleetForm({
        limoCompany: '',
        limoCompanyId: '',
        captainName: '',
        captainId: '',
        paymentDate: '',
        paymentId: '',
        paymentMethod: '',
        totalDriverBaseCost: 0,
        totalDriverOtherCost: 0,
        totalDriverPayment: 0,
        tips: 0,
      });
      loadFleet();
    } catch (error) {
      console.error('Error saving fleet:', error);
      toast.error('Failed to save fleet record');
    }
  };

  const handleDeleteFleet = async (id) => {
    if (window.confirm('Are you sure you want to delete this fleet record?')) {
      try {
        await deleteDoc(doc(db, 'fleet', id));
        toast.success('Fleet record deleted successfully');
        loadFleet();
      } catch (error) {
        console.error('Error deleting fleet:', error);
        toast.error('Failed to delete fleet record');
      }
    }
  };

  const handleViewFleet = (fleetRecord) => {
    setSelectedFleet(fleetRecord);
    setShowDetailModal(true);
  };

  // Filter fleet
  const filteredFleet = fleet.filter(f =>
    f.captainName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    f.limoCompany.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (f.paymentId ? f.paymentId.toString().toLowerCase().includes(searchTerm.toLowerCase()) : false) ||
    (f.captainId ? f.captainId.toString().toLowerCase().includes(searchTerm.toLowerCase()) : false)
  );

  // Pagination
  const totalPages = Math.ceil(filteredFleet.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedFleet = filteredFleet.slice(startIndex, startIndex + itemsPerPage);

  // Reset page on search/filter
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  return (
    <div className="p-6 bg-gray-50 min-h-screen" style={{ backgroundColor: theme.colors.background }}>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold" style={{ color: theme.colors.primary }}>
            Fleet Payment Management
          </h1>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-white hover:shadow-lg transition"
            style={{ backgroundColor: theme.colors.primary }}
          >
            <MdAdd size={20} /> Add Payment
          </button>
        </div>

        {/* Search Bar */}
        <div className="mb-6">
          <input
            type="text"
            placeholder="Search by captain name, company, payment ID, or captain ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2"
            style={{ focusRingColor: theme.colors.primary }}
          />
        </div>

        {/* Results Info */}
        <div className="mb-4 text-sm text-gray-900 font-medium">
          Showing {paginatedFleet.length > 0 ? startIndex + 1 : 0}-{Math.min(startIndex + itemsPerPage, filteredFleet.length)} of {filteredFleet.length} records
        </div>

        {/* Table */}
        <div className="bg-white rounded-lg shadow-md overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr style={{ backgroundColor: theme.colors.primary }}>
                <th className="px-4 py-3 text-left text-white font-semibold text-xs">Limo Company</th>
                <th className="px-4 py-3 text-left text-white font-semibold text-xs">Company ID</th>
                <th className="px-4 py-3 text-left text-white font-semibold text-xs">Captain Name</th>
                <th className="px-4 py-3 text-left text-white font-semibold text-xs">Captain ID</th>
                <th className="px-4 py-3 text-left text-white font-semibold text-xs">Payment Date</th>
                <th className="px-4 py-3 text-left text-white font-semibold text-xs">Payment ID</th>
                <th className="px-4 py-3 text-left text-white font-semibold text-xs">Method</th>
                <th className="px-4 py-3 text-right text-white font-semibold text-xs">Base Cost (AED)</th>
                <th className="px-4 py-3 text-right text-white font-semibold text-xs">Other Cost (AED)</th>
                <th className="px-4 py-3 text-right text-white font-semibold text-xs">Total Payment (AED)</th>
                <th className="px-4 py-3 text-right text-white font-semibold text-xs">Tips (AED)</th>
                <th className="px-4 py-3 text-center text-white font-semibold text-xs">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="12" className="px-6 py-8 text-center text-gray-500">
                    <div className="flex justify-center items-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-2" style={{ borderColor: theme.colors.primary, borderTopColor: 'transparent' }}></div>
                    </div>
                  </td>
                </tr>
              ) : paginatedFleet.length === 0 ? (
                <tr>
                  <td colSpan="12" className="px-6 py-8 text-center text-gray-500">
                    No fleet records found
                  </td>
                </tr>
              ) : (
                paginatedFleet.map(fleetRecord => (
                  <tr key={fleetRecord.id} className="border-t hover:bg-gray-50 transition text-xs text-gray-900">
                    <td className="px-4 py-3 text-gray-800">{fleetRecord.limoCompany || '-'}</td>
                    <td className="px-4 py-3 text-gray-800">{fleetRecord.limoCompanyId || '-'}</td>
                    <td className="px-4 py-3 font-medium text-gray-900">{fleetRecord.captainName || '-'}</td>
                    <td className="px-4 py-3 text-gray-800">{fleetRecord.captainId || '-'}</td>
                    <td className="px-4 py-3 text-gray-800">{fleetRecord.paymentDate || '-'}</td>
                    <td className="px-4 py-3 text-gray-800">{fleetRecord.paymentId || '-'}</td>
                    <td className="px-4 py-3 text-gray-800">{fleetRecord.paymentMethod || '-'}</td>
                    <td className="px-4 py-3 text-right text-gray-800">{fleetRecord.totalDriverBaseCost?.toFixed(2)}</td>
                    <td className="px-4 py-3 text-right text-gray-800">{fleetRecord.totalDriverOtherCost?.toFixed(2)}</td>
                    <td className="px-4 py-3 text-right font-semibold text-gray-900">{fleetRecord.totalDriverPayment?.toFixed(2)}</td>
                    <td className="px-4 py-3 text-right text-gray-800">{fleetRecord.tips?.toFixed(2)}</td>
                    <td className="px-4 py-3 text-center flex gap-2 justify-center">
                      <button
                        onClick={() => handleViewFleet(fleetRecord)}
                        className="p-1.5 hover:bg-blue-100 rounded transition"
                        title="View Details"
                      >
                        <MdVisibility size={16} color="#3b82f6" />
                      </button>
                      <button
                        onClick={() => handleDeleteFleet(fleetRecord.id)}
                        className="p-1.5 hover:bg-red-100 rounded transition"
                        title="Delete"
                      >
                        <MdDelete size={16} color="#ef4444" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        {filteredFleet.length > itemsPerPage && (
          <div className="flex items-center justify-between bg-white p-4 rounded-lg shadow-md mt-4">
            <div className="text-sm text-gray-900 font-medium">
              Page {currentPage} of {totalPages}
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition text-gray-900 font-medium"
              >
                Previous
              </button>

              {/* Page numbers */}
              <div className="flex gap-1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum;
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (currentPage <= 3) {
                    pageNum = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = currentPage - 2 + i;
                  }
                  return (
                    <button
                      key={pageNum}
                      onClick={() => setCurrentPage(pageNum)}
                      className={`px-3 py-2 rounded-lg transition font-medium ${
                        currentPage === pageNum
                          ? 'text-white'
                          : 'border border-gray-300 hover:bg-gray-50 text-gray-900'
                      }`}
                      style={{
                        backgroundColor: currentPage === pageNum ? theme.colors.primary : 'transparent',
                      }}
                    >
                      {pageNum}
                    </button>
                  );
                })}
              </div>

              <button
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition text-gray-900 font-medium"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Add Fleet Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-white/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center p-6 border-b" style={{ borderColor: theme.colors.primary }}>
              <h2 className="text-2xl font-bold" style={{ color: theme.colors.primary }}>
                Add New Fleet Payment
              </h2>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <MdClose size={24} />
              </button>
            </div>

            <form onSubmit={saveFleetToFirestore} className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">Limo Company</label>
                  <input
                    type="text"
                    name="limoCompany"
                    value={newFleetForm.limoCompany}
                    onChange={handleFormChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2"
                    placeholder="Limo company name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">Limo Company ID</label>
                  <input
                    type="text"
                    name="limoCompanyId"
                    value={newFleetForm.limoCompanyId}
                    onChange={handleFormChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2"
                    placeholder="Company ID"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">Captain Name</label>
                  <input
                    type="text"
                    name="captainName"
                    value={newFleetForm.captainName}
                    onChange={handleFormChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2"
                    placeholder="Captain name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">Captain ID</label>
                  <input
                    type="text"
                    name="captainId"
                    value={newFleetForm.captainId}
                    onChange={handleFormChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2"
                    placeholder="Captain ID"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">Payment Date</label>
                  <input
                    type="text"
                    name="paymentDate"
                    value={newFleetForm.paymentDate}
                    onChange={handleFormChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2"
                    placeholder="MM/DD/YYYY"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">Payment ID</label>
                  <input
                    type="text"
                    name="paymentId"
                    value={newFleetForm.paymentId}
                    onChange={handleFormChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2"
                    placeholder="Payment ID"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">Payment Method</label>
                  <input
                    type="text"
                    name="paymentMethod"
                    value={newFleetForm.paymentMethod}
                    onChange={handleFormChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2"
                    placeholder="Cash/Card/Transfer"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">Total Driver Base Cost (AED)</label>
                  <input
                    type="number"
                    step="0.01"
                    name="totalDriverBaseCost"
                    value={newFleetForm.totalDriverBaseCost}
                    onChange={handleFormChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2"
                    placeholder="0.00"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">Total Driver Other Cost (AED)</label>
                  <input
                    type="number"
                    step="0.01"
                    name="totalDriverOtherCost"
                    value={newFleetForm.totalDriverOtherCost}
                    onChange={handleFormChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2"
                    placeholder="0.00"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">Total Driver Payment (AED)</label>
                  <input
                    type="number"
                    step="0.01"
                    name="totalDriverPayment"
                    value={newFleetForm.totalDriverPayment}
                    onChange={handleFormChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2"
                    placeholder="0.00"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">Tips (AED)</label>
                  <input
                    type="number"
                    step="0.01"
                    name="tips"
                    value={newFleetForm.tips}
                    onChange={handleFormChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2"
                    placeholder="0.00"
                  />
                </div>
              </div>

              <div className="flex gap-2 justify-end pt-4">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg text-white hover:shadow-lg transition"
                  style={{ backgroundColor: theme.colors.primary }}
                >
                  Save Payment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {showDetailModal && selectedFleet && (
        <div className="fixed inset-0 bg-white/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center p-6 border-b" style={{ borderColor: theme.colors.primary }}>
              <h2 className="text-2xl font-bold" style={{ color: theme.colors.primary }}>
                Fleet Payment Details
              </h2>
              <button
                onClick={() => setShowDetailModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <MdClose size={24} />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Basic Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-700 font-medium">Limo Company</p>
                  <p className="text-lg font-semibold text-gray-900">{selectedFleet.limoCompany || '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-700 font-medium">Company ID</p>
                  <p className="text-lg font-semibold text-gray-900">{selectedFleet.limoCompanyId || '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-700 font-medium">Captain Name</p>
                  <p className="text-lg font-semibold text-gray-900">{selectedFleet.captainName || '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-700 font-medium">Captain ID</p>
                  <p className="text-lg font-semibold text-gray-900">{selectedFleet.captainId || '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-700 font-medium">Payment Date</p>
                  <p className="text-lg font-semibold text-gray-900">{selectedFleet.paymentDate || '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-700 font-medium">Payment ID</p>
                  <p className="text-lg font-semibold text-gray-900">{selectedFleet.paymentId || '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-700 font-medium">Payment Method</p>
                  <p className="text-lg font-semibold text-gray-900">{selectedFleet.paymentMethod || '-'}</p>
                </div>
              </div>

              {/* Financial Info */}
              <div>
                <h3 className="text-lg font-semibold mb-4" style={{ color: theme.colors.primary }}>
                  Payment Breakdown
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-700 font-medium">Base Cost</p>
                    <p className="text-2xl font-bold text-blue-600">
                      {selectedFleet.totalDriverBaseCost?.toFixed(2)} AED
                    </p>
                  </div>
                  <div className="bg-purple-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-700 font-medium">Other Cost</p>
                    <p className="text-2xl font-bold text-purple-600">
                      {selectedFleet.totalDriverOtherCost?.toFixed(2)} AED
                    </p>
                  </div>
                  <div className="bg-green-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-700 font-medium">Total Payment</p>
                    <p className="text-2xl font-bold text-green-600">
                      {selectedFleet.totalDriverPayment?.toFixed(2)} AED
                    </p>
                  </div>
                  <div className="bg-orange-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-700 font-medium">Tips</p>
                    <p className="text-2xl font-bold text-orange-600">
                      {selectedFleet.tips?.toFixed(2)} AED
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex gap-2 justify-end pt-4">
                <button
                  onClick={() => setShowDetailModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
