'use client';

import { useState, useEffect } from 'react';
import { collection, getDocs, deleteDoc, doc, query, orderBy, addDoc, writeBatch } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import theme from '@/lib/theme';
import { MdEdit, MdDelete, MdAdd, MdClose, MdVisibility, MdDownload, MdUpload } from 'react-icons/md';
import toast from 'react-hot-toast';
import * as XLSX from 'xlsx';

export default function CaptainsPage() {
  const [captains, setCaptains] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedCaptain, setSelectedCaptain] = useState(null);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadFile, setUploadFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState(null);

  const [newCaptainForm, setNewCaptainForm] = useState({
    captainId: '',
    name: '',
    email: '',
    city: '',
    day: '',
    limo: '',
    totalOrder: 0,
    captainEarning: 0,
    availableHour: 0,
    acceptedOffer: 0,
    totalOffer: 0,
    acceptanceRate: '0%',
    qualificationStatus: 'Active',
    amountAED: 0,
    fine: 0,
    advance: 0,
    total: 0,
  });

  // Load captains from Firestore
  useEffect(() => {
    loadCaptains();
  }, []);

  const loadCaptains = async () => {
    try {
      setLoading(true);
      const q = query(collection(db, 'captains'), orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(q);
      const captainsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));
      console.log('✅ Loaded captains:', captainsData.length);
      console.log('Sample captain:', captainsData[0]);
      setCaptains(captainsData);
    } catch (error) {
      console.error('❌ Error loading captains:', error);
      toast.error(`Failed to load captains: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    
    // Parse numeric fields
    if (['totalOrder', 'captainEarning', 'availableHour', 'acceptedOffer', 'totalOffer', 'amountAED', 'fine', 'advance', 'total'].includes(name)) {
      setNewCaptainForm(prev => ({
        ...prev,
        [name]: value === '' ? 0 : parseFloat(value) || 0,
      }));
    } else {
      setNewCaptainForm(prev => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  const downloadToExcel = () => {
    try {
      // Prepare data for Excel
      const excelData = captains.map(captain => ({
        'Captain ID': captain.captainId || '',
        'Name': captain.name,
        'City': captain.city,
        'Day': captain.day || '',
        'Limo': captain.limo || '',
        'Total Order': captain.totalOrder,
        'Captain Earning': captain.captainEarning,
        'Available Hour': captain.availableHour,
        'Accepted Offer': captain.acceptedOffer,
        'Total Offer': captain.totalOffer,
        'Acceptance Rate': captain.acceptanceRate || '',
        'Qualification Status': captain.qualificationStatus,
        'Amount AED': captain.amountAED,
        'Total': captain.total,
      }));

      // Create workbook and worksheet
      const ws = XLSX.utils.json_to_sheet(excelData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Captains');

      // Generate filename with timestamp
      const timestamp = new Date().toISOString().split('T')[0];
      const filename = `captains_${timestamp}.xlsx`;

      // Download file
      XLSX.writeFile(wb, filename);
      toast.success(`Downloaded ${captains.length} captains to ${filename}`);
    } catch (error) {
      console.error('Error downloading Excel:', error);
      toast.error('Failed to download Excel file');
    }
  };

  const handleUploadExcel = async () => {
    if (!uploadFile) {
      toast.error('Please select a file');
      return;
    }

    setUploading(true);
    try {
      // Read the file
      const data = await uploadFile.arrayBuffer();
      const workbook = XLSX.read(data);
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

      if (jsonData.length === 0) {
        toast.error('No data found in Excel file');
        setUploading(false);
        return;
      }

      // Normalize and validate data
      const batch = writeBatch(db);
      let successCount = 0;
      let errorCount = 0;

      for (const row of jsonData) {
        // Normalize headers
        const normalizedRow = {};
        for (const [key, value] of Object.entries(row)) {
          const lowerKey = key.toLowerCase().trim().replace(/\s+/g, '_');
          normalizedRow[lowerKey] = value;
        }

        // Extract fields with multiple possible column names
        const name = normalizedRow.name || normalizedRow.captain_name || '';
        const city = normalizedRow.city || '';

        if (!name || !city) {
          errorCount++;
          continue;
        }

        const captainData = {
          captainId: normalizedRow.captain_id || '',
          name: name,
          email: normalizedRow.email || '',
          city: city,
          day: normalizedRow.day || '',
          limo: normalizedRow.limo || '',
          totalOrder: parseFloat(normalizedRow.total_order) || 0,
          captainEarning: parseFloat(normalizedRow.captain_earning) || 0,
          availableHour: parseFloat(normalizedRow.available_hour) || 0,
          acceptedOffer: parseFloat(normalizedRow.accepted_offer) || 0,
          totalOffer: parseFloat(normalizedRow.total_offer) || 0,
          acceptanceRate: normalizedRow.acceptance_rate || '0%',
          qualificationStatus: normalizedRow.qualification_status || 'Active',
          amountAED: parseFloat(normalizedRow.amount_aed) || 0,
          fine: parseFloat(normalizedRow.fine) || 0,
          advance: parseFloat(normalizedRow.advance) || 0,
          total: parseFloat(normalizedRow.total) || 0,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        const docRef = doc(collection(db, 'captains'));
        batch.set(docRef, captainData);
        successCount++;
      }

      // Commit batch
      await batch.commit();

      toast.success(`Successfully uploaded ${successCount} captains${errorCount > 0 ? ` (${errorCount} errors)` : ''}`);
      setShowUploadModal(false);
      setUploadFile(null);
      loadCaptains();
    } catch (error) {
      console.error('Error uploading Excel:', error);
      toast.error('Failed to upload Excel file');
    } finally {
      setUploading(false);
    }
  };

  const saveCaptainToFirestore = async (e) => {
    e.preventDefault();

    if (!newCaptainForm.name || !newCaptainForm.city) {
      toast.error('Name and City are required');
      return;
    }

    try {
      const captainData = {
        ...newCaptainForm,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await addDoc(collection(db, 'captains'), captainData);
      toast.success('Captain added successfully!');
      setShowAddModal(false);
      setNewCaptainForm({
        captainId: '',
        name: '',
        email: '',
        city: '',
        day: '',
        limo: '',
        totalOrder: 0,
        captainEarning: 0,
        availableHour: 0,
        acceptedOffer: 0,
        totalOffer: 0,
        acceptanceRate: '0%',
        qualificationStatus: 'Active',
        amountAED: 0,
        fine: 0,
        advance: 0,
        total: 0,
      });
      loadCaptains();
    } catch (error) {
      console.error('Error saving captain:', error);
      toast.error('Failed to save captain');
    }
  };

  const handleDeleteCaptain = (id) => {
    setDeleteTargetId(id);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    try {
      await deleteDoc(doc(db, 'captains', deleteTargetId));
      toast.success('Captain deleted successfully');
      setShowDeleteModal(false);
      setDeleteTargetId(null);
      loadCaptains();
    } catch (error) {
      console.error('Error deleting captain:', error);
      toast.error('Failed to delete captain');
    }
  };

  const handleViewCaptain = (captain) => {
    setSelectedCaptain(captain);
    setShowDetailModal(true);
  };

  // Filter captains
  const filteredCaptains = captains.filter(captain =>
    captain.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    captain.city.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (captain.captainId ? captain.captainId.toString().toLowerCase().includes(searchTerm.toLowerCase()) : false)
  );

  // Pagination
  const totalPages = Math.ceil(filteredCaptains.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedCaptains = filteredCaptains.slice(startIndex, startIndex + itemsPerPage);

  // Reset page on search/filter
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  // Handle Escape key and outside click for modals
  useEffect(() => {
    if (!showDetailModal) return;
    const handleEsc = (event) => {
      if (event.key === 'Escape') {
        setShowDetailModal(false);
      }
    };
    document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, [showDetailModal]);

  return (
    <div className="max-w-7xl mx-auto px-4 pr-8 space-y-6">
      {/* Header with Search and Actions */}
      <div className="flex flex-col gap-4">
        {/* Search Bar */}
        <div className="flex-1">
          <input
            type="text"
            placeholder="🔍 Search by name, city, or captain ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
          />
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex flex-wrap gap-2">
            <button
              onClick={downloadToExcel}
              className="flex items-center justify-center space-x-2 text-white px-6 py-2 rounded-lg hover:opacity-90 transition"
              style={{ backgroundColor: '#10b981', borderRadius: theme.radius.button }}
              title="Download to Excel"
            >
              <MdDownload className="w-5 h-5" />
              <span>Download</span>
            </button>
            <button
              onClick={() => setShowUploadModal(true)}
              className="flex items-center justify-center space-x-2 text-white px-6 py-2 rounded-lg hover:opacity-90 transition"
              style={{ backgroundColor: '#3b82f6', borderRadius: theme.radius.button }}
              title="Upload from Excel/CSV"
            >
              <MdUpload className="w-5 h-5" />
              <span>Upload</span>
            </button>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center justify-center space-x-2 text-white px-6 py-2 rounded-lg hover:opacity-90 transition"
            style={{ backgroundColor: theme.colors.primary, borderRadius: theme.radius.button }}
          >
            <MdAdd className="w-5 h-5" />
            <span>Add Captain</span>
          </button>
        </div>

        {/* Results Info */}
        <div className="text-sm text-gray-600">
          Showing {paginatedCaptains.length > 0 ? startIndex + 1 : 0} - {Math.min(startIndex + itemsPerPage, filteredCaptains.length)} of {filteredCaptains.length} captains
        </div>
      </div>

      {/* Captains Table */}
      <div className="bg-white rounded-xl shadow-md overflow-hidden" style={{ backgroundColor: theme.colors.background }}>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1200px]">
            <thead>
              <tr style={{ backgroundColor: 'rgba(41, 157, 145, 0.1)' }}>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-800">Captain ID</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-800">Name</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-800">Email</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-800">City</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-800">Day</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-800">Limo</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-800">Total Orders</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-800">Captain Earning (AED)</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-800">Available Hours</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-800">Accepted Offers</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-800">Total Offers</th>
                <th className="px-6 py-4 text-center text-sm font-semibold text-gray-800">Acceptance Rate</th>
                <th className="px-6 py-4 text-center text-sm font-semibold text-gray-800">Status</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-800">Amount AED</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-800">Fine (AED)</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-800">Advance (AED)</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-800">Total</th>
                <th className="px-6 py-4 text-center text-sm font-semibold text-gray-800">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="18" className="px-6 py-12 text-center">
                    <p className="text-gray-500">Loading captains...</p>
                  </td>
                </tr>
              ) : paginatedCaptains.length === 0 ? (
                <tr>
                  <td colSpan="18" className="px-6 py-12 text-center text-gray-500">
                    No captains found
                  </td>
                </tr>
              ) : (
                paginatedCaptains.map((captain, index) => (
                  <tr
                    key={captain.id}
                    className={`border-t border-gray-200 hover:bg-gray-50 transition ${
                      index % 2 === 0 ? 'bg-white' : 'bg-gray-50'
                    }`}
                  >
                    <td className="px-4 py-3 text-gray-800">{captain.captainId || '-'}</td>
                    <td className="px-4 py-3 font-medium text-gray-900">{captain.name}</td>
                    <td className="px-4 py-3 text-gray-800">{captain.email || '-'}</td>
                    <td className="px-4 py-3 text-gray-800">{captain.city}</td>
                    <td className="px-4 py-3 text-gray-800">{captain.day || '-'}</td>
                    <td className="px-4 py-3 text-gray-800">{captain.limo || '-'}</td>
                    <td className="px-4 py-3 text-right text-gray-800">{captain.totalOrder}</td>
                    <td className="px-4 py-3 text-right font-semibold text-gray-900">{captain.captainEarning?.toFixed(2)}</td>
                    <td className="px-4 py-3 text-right text-gray-800">{captain.availableHour}</td>
                    <td className="px-4 py-3 text-right text-gray-800">{captain.acceptedOffer}</td>
                    <td className="px-4 py-3 text-right text-gray-800">{captain.totalOffer}</td>
                    <td className="px-4 py-3 text-center text-gray-800">{captain.acceptanceRate || '-'}</td>
                    <td className="px-4 py-3 text-center">
                      <span
                        className="px-2 py-1 rounded text-xs font-semibold text-white inline-block"
                        style={{ 
                          backgroundColor: captain.qualificationStatus === 'Active' ? '#10b981' : captain.qualificationStatus === 'Inactive' ? '#ef4444' : '#f59e0b'
                        }}
                      >
                        {captain.qualificationStatus}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right font-semibold text-gray-900">{captain.amountAED?.toFixed(2)}</td>
                    <td className="px-4 py-3 text-right font-semibold text-red-600">{captain.fine?.toFixed(2) || '0.00'}</td>
                    <td className="px-4 py-3 text-right font-semibold text-orange-600">{captain.advance?.toFixed(2) || '0.00'}</td>
                    <td className="px-4 py-3 text-right font-semibold text-gray-900">{captain.total?.toFixed(2)}</td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex gap-2 justify-center">
                        <button
                          onClick={() => handleViewCaptain(captain)}
                          className="p-1.5 hover:bg-blue-100 rounded transition"
                          title="View Details"
                        >
                          <MdVisibility size={16} color="#3b82f6" />
                        </button>
                        <button
                          onClick={() => handleDeleteCaptain(captain.id)}
                          className="p-1.5 hover:bg-red-100 rounded transition"
                          title="Delete"
                        >
                          <MdDelete size={16} color="#ef4444" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination Controls */}
      {filteredCaptains.length > itemsPerPage && (
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

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-white/30 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setShowDeleteModal(false)}>
          <div className="bg-white rounded-lg shadow-lg max-w-md w-full" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-800">Delete Captain</h2>
              <button
                onClick={() => setShowDeleteModal(false)}
                className="text-black hover:text-gray-700"
              >
                <MdClose className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <p className="text-gray-700">Are you sure you want to delete this captain? This action cannot be undone.</p>
              
              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="flex-1 text-gray-700 px-6 py-2 rounded-lg border border-gray-300 hover:bg-gray-100 transition font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDelete}
                  className="flex-1 text-white px-6 py-2 rounded-lg hover:opacity-90 transition font-medium"
                  style={{ backgroundColor: '#ef4444' }}
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Captain Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-white/30 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setShowAddModal(false)}>
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center p-6 border-b" style={{ borderColor: theme.colors.primary }}>
              <h2 className="text-2xl font-bold" style={{ color: theme.colors.primary }}>
                Add New Captain
              </h2>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-black hover:text-gray-700"
              >
                <MdClose size={24} />
              </button>
            </div>

            <form onSubmit={saveCaptainToFirestore} className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">Captain ID</label>
                  <input
                    type="text"
                    name="captainId"
                    value={newCaptainForm.captainId}
                    onChange={handleFormChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2"
                    placeholder="Enter captain ID"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">
                    Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={newCaptainForm.name}
                    onChange={handleFormChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2"
                    placeholder="Captain name"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">Email</label>
                  <input
                    type="email"
                    name="email"
                    value={newCaptainForm.email}
                    onChange={handleFormChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2"
                    placeholder="captain@example.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">
                    City <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="city"
                    value={newCaptainForm.city}
                    onChange={handleFormChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2"
                    placeholder="City"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">Day</label>
                  <input
                    type="text"
                    name="day"
                    value={newCaptainForm.day}
                    onChange={handleFormChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2"
                    placeholder="Day"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">Limo</label>
                  <input
                    type="text"
                    name="limo"
                    value={newCaptainForm.limo}
                    onChange={handleFormChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2"
                    placeholder="Limo/Vehicle"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">Total Orders</label>
                  <input
                    type="number"
                    name="totalOrder"
                    value={newCaptainForm.totalOrder}
                    onChange={handleFormChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2"
                    placeholder="0"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">Captain Earning (AED)</label>
                  <input
                    type="number"
                    step="0.01"
                    name="captainEarning"
                    value={newCaptainForm.captainEarning}
                    onChange={handleFormChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2"
                    placeholder="0.00"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">Available Hours</label>
                  <input
                    type="number"
                    name="availableHour"
                    value={newCaptainForm.availableHour}
                    onChange={handleFormChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2"
                    placeholder="0"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">Accepted Offers</label>
                  <input
                    type="number"
                    name="acceptedOffer"
                    value={newCaptainForm.acceptedOffer}
                    onChange={handleFormChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2"
                    placeholder="0"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">Total Offers</label>
                  <input
                    type="number"
                    name="totalOffer"
                    value={newCaptainForm.totalOffer}
                    onChange={handleFormChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2"
                    placeholder="0"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">Acceptance Rate</label>
                  <input
                    type="text"
                    name="acceptanceRate"
                    value={newCaptainForm.acceptanceRate}
                    onChange={handleFormChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2"
                    placeholder="0%"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">Qualification Status</label>
                  <select
                    name="qualificationStatus"
                    value={newCaptainForm.qualificationStatus}
                    onChange={handleFormChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2"
                  >
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                    <option value="Pending">Pending</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">Amount AED</label>
                  <input
                    type="number"
                    step="0.01"
                    name="amountAED"
                    value={newCaptainForm.amountAED}
                    onChange={handleFormChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2"
                    placeholder="0.00"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">Fine (AED)</label>
                  <input
                    type="number"
                    step="0.01"
                    name="fine"
                    value={newCaptainForm.fine}
                    onChange={handleFormChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2"
                    placeholder="0.00"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">Advance (AED)</label>
                  <input
                    type="number"
                    step="0.01"
                    name="advance"
                    value={newCaptainForm.advance}
                    onChange={handleFormChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2"
                    placeholder="0.00"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">Total</label>
                  <input
                    type="number"
                    step="0.01"
                    name="total"
                    value={newCaptainForm.total}
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
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition text-black"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg text-white hover:shadow-lg transition"
                  style={{ backgroundColor: theme.colors.primary }}
                >
                  Save Captain
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {showDetailModal && selectedCaptain && (
        <div className="fixed inset-0 bg-white/30 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setShowDetailModal(false)}>
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center p-6 border-b" style={{ borderColor: theme.colors.primary }}>
              <h2 className="text-2xl font-bold" style={{ color: theme.colors.primary }}>
                Captain Details
              </h2>
              <button
                onClick={() => setShowDetailModal(false)}
                className="text-black hover:text-gray-700"
              >
                <MdClose size={24} />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Basic Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-700 font-medium">Captain ID</p>
                  <p className="text-lg font-semibold text-gray-900">{selectedCaptain.captainId || '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-700 font-medium">Name</p>
                  <p className="text-lg font-semibold text-gray-900">{selectedCaptain.name}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-700 font-medium">Email</p>
                  <p className="text-lg font-semibold text-gray-900">{selectedCaptain.email || '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-700 font-medium">City</p>
                  <p className="text-lg font-semibold text-gray-900">{selectedCaptain.city}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-700 font-medium">Status</p>
                  <span
                    className="inline-block px-3 py-1 rounded-full text-xs font-semibold text-white"
                    style={{ 
                      backgroundColor: selectedCaptain.qualificationStatus === 'Active' ? '#10b981' : '#ef4444'
                    }}
                  >
                    {selectedCaptain.qualificationStatus}
                  </span>
                </div>
              </div>

              {/* Financial Info */}
              <div>
                <h3 className="text-lg font-semibold mb-4" style={{ color: theme.colors.primary }}>
                  Financial Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-700 font-medium">Captain Earning</p>
                    <p className="text-2xl font-bold" style={{ color: theme.colors.primary }}>
                      {selectedCaptain.captainEarning.toFixed(2)} AED
                    </p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-700 font-medium">Amount AED</p>
                    <p className="text-2xl font-bold" style={{ color: theme.colors.primary }}>
                      {selectedCaptain.amountAED.toFixed(2)} AED
                    </p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-700 font-medium">Total</p>
                    <p className="text-2xl font-bold" style={{ color: theme.colors.primary }}>
                      {selectedCaptain.total.toFixed(2)} AED
                    </p>
                  </div>
                </div>
              </div>

              {/* Performance Info */}
              <div>
                <h3 className="text-lg font-semibold mb-4" style={{ color: theme.colors.primary }}>
                  Performance Metrics
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-700 font-medium">Total Orders</p>
                    <p className="text-2xl font-bold text-blue-600">{selectedCaptain.totalOrder}</p>
                  </div>
                  <div className="bg-green-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-700 font-medium">Accepted Offers</p>
                    <p className="text-2xl font-bold text-green-600">{selectedCaptain.acceptedOffer}</p>
                  </div>
                  <div className="bg-purple-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-700 font-medium">Total Offers</p>
                    <p className="text-2xl font-bold text-purple-600">{selectedCaptain.totalOffer}</p>
                  </div>
                  <div className="bg-orange-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-700 font-medium">Acceptance Rate</p>
                    <p className="text-2xl font-bold text-orange-600">{selectedCaptain.acceptanceRate}</p>
                  </div>
                </div>
              </div>

              {/* Other Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-700 font-medium">Day</p>
                  <p className="text-lg font-semibold text-gray-900">{selectedCaptain.day || '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-700 font-medium">Limo/Vehicle</p>
                  <p className="text-lg font-semibold text-gray-900">{selectedCaptain.limo || '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-700 font-medium">Available Hours</p>
                  <p className="text-lg font-semibold text-gray-900">{selectedCaptain.availableHour}</p>
                </div>
              </div>

              <div className="flex gap-2 justify-end pt-4">
                <button
                  onClick={() => setShowDetailModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition text-black"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Upload Excel Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-white/30 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => { setShowUploadModal(false); setUploadFile(null); }}>
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center p-6 border-b" style={{ borderColor: theme.colors.primary }}>
              <h2 className="text-2xl font-bold" style={{ color: theme.colors.primary }}>
                Upload Captains from Excel/CSV
              </h2>
              <button
                onClick={() => {
                  setShowUploadModal(false);
                  setUploadFile(null);
                }}
                className="text-black hover:text-gray-700"
              >
                <MdClose size={24} />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-800">
                <p className="font-semibold mb-2">File Format Requirements (Excel/CSV):</p>
                <ul className="list-disc list-inside space-y-1 text-xs">
                  <li>Captain ID, Name*, City*, Day, Limo</li>
                  <li>Total Order, Captain Earning, Available Hour</li>
                  <li>Accepted Offer, Total Offer, Acceptance Rate</li>
                  <li>Qualification Status, Amount AED, Total</li>
                  <li className="font-semibold">Required fields</li>
                </ul>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">
                  Select Excel or CSV File
                </label>
                <input
                  type="file"
                  accept=".xlsx,.xls,.csv"
                  onChange={(e) => setUploadFile(e.target.files[0])}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2"
                />
                {uploadFile && (
                  <p className="text-sm text-gray-600 mt-2">
                    Selected: {uploadFile.name}
                  </p>
                )}
              </div>

              <div className="flex gap-2 justify-end pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowUploadModal(false);
                    setUploadFile(null);
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
                  disabled={uploading}
                >
                  Cancel
                </button>
                <button
                  onClick={handleUploadExcel}
                  disabled={!uploadFile || uploading}
                  className="px-4 py-2 rounded-lg text-white hover:shadow-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{ backgroundColor: theme.colors.primary }}
                >
                  {uploading ? 'Uploading...' : 'Upload'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
