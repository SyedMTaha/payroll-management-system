'use client';

import { useState, useEffect } from 'react';
import { MdEdit, MdVisibility, MdClose, MdAdd, MdDelete } from 'react-icons/md';
import { theme } from '@/lib/theme';
import toast from 'react-hot-toast';
import { db } from '@/lib/firebase';
import { collection, addDoc, getDocs, deleteDoc, doc, updateDoc, query, orderBy } from 'firebase/firestore';
import { getStorage, ref, uploadString, deleteObject } from 'firebase/storage';

export default function EmployeePage() {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const [filterPaymentType, setFilterPaymentType] = useState('All');
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [addPaymentDropdownOpen, setAddPaymentDropdownOpen] = useState(false);
  const [newEmployeeForm, setNewEmployeeForm] = useState({
    name: '',
    role: '',
    vehicleType: '',
    paymentType: 'Monthly',
    salary: '',
    client: '',
    status: 'Active',
    image: null,
    imagePreview: null,
    emiratesId: '',
    passportNumber: '',
    drivingLicense: '',
    labourCard: '',
    insuranceDocuments: '',
    // Document images + previews
    emiratesIdImage: null,
    emiratesIdImagePreview: null,
    passportImage: null,
    passportImagePreview: null,
    drivingLicenseImage: null,
    drivingLicenseImagePreview: null,
    labourCardImage: null,
    labourCardImagePreview: null,
    insuranceDocumentsImage: null,
    insuranceDocumentsImagePreview: null,
  });

  const paymentTypes = ['All', 'Weekly', 'Monthly', 'Per Delivery'];

  // Filter by payment type and search term
  const filteredEmployees = employees
    .filter(emp => filterPaymentType === 'All' || emp.paymentType === filterPaymentType)
    .filter(emp => 
      emp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.role.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.client.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.emiratesId?.toLowerCase().includes(searchTerm.toLowerCase())
    );

  // Calculate pagination
  const totalPages = Math.ceil(filteredEmployees.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedEmployees = filteredEmployees.slice(startIndex, startIndex + itemsPerPage);

  // Reset to first page when search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterPaymentType]);

  // Load employees from Firestore on component mount
  useEffect(() => {
    const loadEmployees = async () => {
      try {
        setLoading(true);
        const q = query(collection(db, 'employees'), orderBy('createdAt', 'desc'));
        const querySnapshot = await getDocs(q);
        const loadedEmployees = querySnapshot.docs.map(doc => ({
          ...doc.data(),
          docId: doc.id,
        }));
        setEmployees(loadedEmployees);
      } catch (error) {
        console.error('Error loading employees:', error);
        toast.error('Failed to load employees');
      } finally {
        setLoading(false);
      }
    };

    loadEmployees();
  }, []);

  // Handle Escape key to close modals
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        if (showDetailModal) setShowDetailModal(false);
        if (showAddModal) setShowAddModal(false);
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [showDetailModal, showAddModal]);

  // Upload image to Firebase Storage
  const uploadImageToStorage = async (dataUrl, employeeId, fieldName) => {
    try {
      const storage = getStorage();
      const fileName = `employees/${employeeId}/${fieldName}_${Date.now()}.jpg`;
      const storageRef = ref(storage, fileName);
      await uploadString(storageRef, dataUrl, 'data_url');
      return fileName;
    } catch (error) {
      console.error('Error uploading image:', error);
      return null;
    }
  };

  const handleViewEmployee = (employee) => {
    setSelectedEmployee(employee);
    setShowDetailModal(true);
  };

  const handleAddEmployee = () => {
    setShowAddModal(true);
  };

  const handleFormChange = (e) => {
    const { name, value, type, files } = e.target;

    if (type === 'file') {
      const file = files && files[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onloadend = () => {
        // Determine preview key based on input name
        const previewKey = `${name}Preview`;
        setNewEmployeeForm((prev) => ({
          ...prev,
          [name]: file,
          [previewKey]: reader.result,
        }));
      };
      reader.readAsDataURL(file);
      return;
    }

    setNewEmployeeForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmitEmployee = () => {
    if (!newEmployeeForm.name.trim()) {
      toast.error('Employee name is required');
      return;
    }
    if (!newEmployeeForm.role.trim()) {
      toast.error('Employee role is required');
      return;
    }
    if (!newEmployeeForm.salary.trim()) {
      toast.error('Salary/Rate is required');
      return;
    }
    if (!newEmployeeForm.client.trim()) {
      toast.error('Client name is required');
      return;
    }

    saveEmployeeToFirestore();
  };

  const handleDeleteEmployee = async (employee) => {
    try {
      if (!window.confirm(`Are you sure you want to delete ${employee.name}?`)) {
        return;
      }

      toast.loading('Deleting employee...');
      const storage = getStorage();

      // Delete images from storage
      const imagePaths = [
        employee.image,
        employee.emiratesIdImage,
        employee.passportImage,
        employee.drivingLicenseImage,
        employee.labourCardImage,
        employee.insuranceDocumentsImage,
      ];

      for (const path of imagePaths) {
        if (path) {
          try {
            const fileRef = ref(storage, path);
            await deleteObject(fileRef);
          } catch (err) {
            console.log('Image already deleted or does not exist');
          }
        }
      }

      // Delete from Firestore
      await deleteDoc(doc(db, 'employees', employee.docId));

      // Update local state
      setEmployees(employees.filter(emp => emp.docId !== employee.docId));

      toast.dismiss();
      toast.success('Employee deleted successfully!');
    } catch (error) {
      console.error('Error deleting employee:', error);
      toast.dismiss();
      toast.error('Failed to delete employee');
    }
  };

  const getImageUrl = (imagePath) => {
    if (!imagePath) return null;
    // If it's already a URL (from old data or preview), return it
    if (imagePath.startsWith('http') || imagePath.startsWith('data:')) {
      return imagePath;
    }
    // Otherwise it's a Firebase Storage path, construct the URL
    return `https://firebasestorage.googleapis.com/v0/b/${process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET}/o/${encodeURIComponent(imagePath)}?alt=media`;
  };

  const saveEmployeeToFirestore = async () => {
    try {
      toast.loading('Saving employee...');
      const storage = getStorage();
      const timestamp = Date.now();
      const employeeId = `emp_${timestamp}`;

      // Upload images in parallel
      const imageUploads = [];
      
      if (newEmployeeForm.imagePreview) {
        imageUploads.push(
          uploadImageToStorage(newEmployeeForm.imagePreview, employeeId, 'profile')
        );
      } else {
        imageUploads.push(Promise.resolve(null));
      }

      if (newEmployeeForm.emiratesIdImagePreview) {
        imageUploads.push(
          uploadImageToStorage(newEmployeeForm.emiratesIdImagePreview, employeeId, 'emiratesId')
        );
      } else {
        imageUploads.push(Promise.resolve(null));
      }

      if (newEmployeeForm.passportImagePreview) {
        imageUploads.push(
          uploadImageToStorage(newEmployeeForm.passportImagePreview, employeeId, 'passport')
        );
      } else {
        imageUploads.push(Promise.resolve(null));
      }

      if (newEmployeeForm.drivingLicenseImagePreview) {
        imageUploads.push(
          uploadImageToStorage(newEmployeeForm.drivingLicenseImagePreview, employeeId, 'drivingLicense')
        );
      } else {
        imageUploads.push(Promise.resolve(null));
      }

      if (newEmployeeForm.labourCardImagePreview) {
        imageUploads.push(
          uploadImageToStorage(newEmployeeForm.labourCardImagePreview, employeeId, 'labourCard')
        );
      } else {
        imageUploads.push(Promise.resolve(null));
      }

      if (newEmployeeForm.insuranceDocumentsImagePreview) {
        imageUploads.push(
          uploadImageToStorage(newEmployeeForm.insuranceDocumentsImagePreview, employeeId, 'insurance')
        );
      } else {
        imageUploads.push(Promise.resolve(null));
      }

      const [
        profilePath,
        emiratesIdPath,
        passportPath,
        drivingLicensePath,
        labourCardPath,
        insurancePath,
      ] = await Promise.all(imageUploads);

      // Create employee object for Firestore
      const newEmployee = {
        name: newEmployeeForm.name,
        role: newEmployeeForm.role,
        vehicleType: newEmployeeForm.vehicleType,
        paymentType: newEmployeeForm.paymentType,
        salary: newEmployeeForm.salary,
        client: newEmployeeForm.client,
        status: newEmployeeForm.status,
        image: profilePath,
        emiratesId: newEmployeeForm.emiratesId,
        emiratesIdImage: emiratesIdPath,
        passportNumber: newEmployeeForm.passportNumber,
        passportImage: passportPath,
        drivingLicense: newEmployeeForm.drivingLicense,
        drivingLicenseImage: drivingLicensePath,
        labourCard: newEmployeeForm.labourCard,
        labourCardImage: labourCardPath,
        insuranceDocuments: newEmployeeForm.insuranceDocuments,
        insuranceDocumentsImage: insurancePath,
        salaryHistory: [],
        advances: [],
        assets: [],
        createdAt: new Date(),
      };

      // Add to Firestore
      const docRef = await addDoc(collection(db, 'employees'), newEmployee);

      // Update local state
      setEmployees([
        { ...newEmployee, docId: docRef.id },
        ...employees,
      ]);

      setShowAddModal(false);
      setNewEmployeeForm({
        name: '',
        role: '',
        vehicleType: '',
        paymentType: 'Monthly',
        salary: '',
        client: '',
        status: 'Active',
        image: null,
        imagePreview: null,
        emiratesId: '',
        emiratesIdImage: null,
        emiratesIdImagePreview: null,
        passportNumber: '',
        passportImage: null,
        passportImagePreview: null,
        drivingLicense: '',
        drivingLicenseImage: null,
        drivingLicenseImagePreview: null,
        labourCard: '',
        labourCardImage: null,
        labourCardImagePreview: null,
        insuranceDocuments: '',
        insuranceDocumentsImage: null,
        insuranceDocumentsImagePreview: null,
      });

      toast.dismiss();
      toast.success('Employee added successfully!');
    } catch (error) {
      console.error('Error saving employee:', error);
      toast.dismiss();
      toast.error('Failed to save employee');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header with Filters and Search */}
      <div className="flex flex-col gap-4">
        {/* Search Bar */}
        <div className="flex-1">
          <input
            type="text"
            placeholder="🔍 Search by name, role, client, or Emirates ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
          />
        </div>

        {/* Filters and Add Button */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex flex-wrap gap-2">
            {paymentTypes.map((type) => (
              <button
                key={type}
                onClick={() => setFilterPaymentType(type)}
                className={`px-4 py-2 rounded-lg transition ${
                  filterPaymentType === type
                    ? 'text-white'
                    : 'text-gray-700 border border-gray-300 hover:border-gray-400'
                }`}
                style={{
                  backgroundColor: filterPaymentType === type ? theme.colors.primary : 'transparent',
                }}
              >
                {type}
              </button>
            ))}
          </div>
          <button
            onClick={handleAddEmployee}
            className="flex items-center justify-center space-x-2 text-white px-6 py-2 rounded-lg hover:opacity-90 transition"
            style={{ backgroundColor: theme.colors.primary, borderRadius: theme.radius.button }}
          >
            <MdAdd className="w-5 h-5" />
            <span>Add Employee</span>
          </button>
        </div>

        {/* Results info */}
        <div className="text-sm text-gray-600">
          Showing {paginatedEmployees.length > 0 ? startIndex + 1 : 0} - {Math.min(startIndex + itemsPerPage, filteredEmployees.length)} of {filteredEmployees.length} employees
        </div>
      </div>

      {/* Employees Table */}
      <div className="bg-white rounded-xl shadow-md overflow-hidden" style={{ backgroundColor: theme.colors.background }}>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr style={{ backgroundColor: 'rgba(41, 157, 145, 0.1)' }}>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-800">Image</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-800">Name</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-800">Role</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-800">Payment Type</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-800">Salary / Rate</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-800">Client</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-800">Status</th>
                <th className="px-6 py-4 text-center text-sm font-semibold text-gray-800">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="8" className="px-6 py-12 text-center">
                    <p className="text-gray-500">Loading employees...</p>
                  </td>
                </tr>
              ) : paginatedEmployees.length > 0 ? (
                paginatedEmployees.map((employee, index) => (
                  <tr
                    key={employee.id}
                    className={`border-t border-gray-200 hover:bg-gray-50 transition ${
                      index % 2 === 0 ? 'bg-white' : 'bg-gray-50'
                    }`}
                  >
                    <td className="px-6 py-4 text-center">
                      {employee.image ? (
                        <img
                          src={getImageUrl(employee.image)}
                          alt={employee.name}
                          className="w-10 h-10 rounded-full object-cover border-2"
                          style={{ borderColor: theme.colors.primary }}
                        />
                      ) : (
                        <div
                          className="w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold"
                          style={{ backgroundColor: theme.colors.primary }}
                        >
                          {employee.name.charAt(0).toUpperCase()}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-gray-800">{employee.name}</td>
                    <td className="px-6 py-4 text-sm text-gray-700">{employee.role}</td>
                    <td className="px-6 py-4 text-sm text-gray-700">
                      <span
                        className="px-3 py-1 rounded-full text-xs font-semibold text-white whitespace-nowrap inline-block"
                        style={{
                          backgroundColor:
                            employee.paymentType === 'Weekly'
                              ? '#7FB3B0'
                              : employee.paymentType === 'Monthly'
                              ? '#5A9591'
                              : '#3D7971',
                        }}
                      >
                        {employee.paymentType}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm font-semibold text-gray-800">{employee.salary}</td>
                    <td className="px-6 py-4 text-sm text-gray-700">{employee.client}</td>
                    <td className="px-6 py-4 text-sm">
                      <span
                        className="px-3 py-1 rounded-full text-xs font-semibold"
                        style={{
                          backgroundColor: 'rgba(34, 197, 94, 0.1)',
                          color: '#22C55E',
                        }}
                      >
                        {employee.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex items-center justify-center space-x-2">
                        <button
                          onClick={() => handleViewEmployee(employee)}
                          className="p-2 rounded-lg transition hover:bg-gray-200"
                          title="View"
                        >
                          <MdVisibility className="w-5 h-5" style={{ color: theme.colors.primary }} />
                        </button>
                        <button
                          className="p-2 rounded-lg transition hover:bg-gray-200"
                          title="Edit"
                        >
                          <MdEdit className="w-5 h-5" style={{ color: '#666' }} />
                        </button>
                        <button
                          onClick={() => handleDeleteEmployee(employee)}
                          className="p-2 rounded-lg transition hover:bg-gray-200"
                          title="Delete"
                        >
                          <MdDelete className="w-5 h-5" style={{ color: '#EF4444' }} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="8" className="px-6 py-12 text-center">
                    <p className="text-gray-500">No employees found with this filter</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination Controls */}
      {filteredEmployees.length > itemsPerPage && (
        <div className="flex items-center justify-between bg-white p-4 rounded-lg shadow-md" style={{ backgroundColor: theme.colors.background }}>
          <div className="text-sm text-gray-600">
            Page {currentPage} of {totalPages}
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
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
                    className={`px-3 py-2 rounded-lg transition ${
                      currentPage === pageNum
                        ? 'text-white'
                        : 'border border-gray-300 hover:bg-gray-50'
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
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Employee Detail Modal */}
      {showDetailModal && selectedEmployee && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-sm"
          onClick={() => setShowDetailModal(false)}
        >
          <div 
            className="bg-white rounded-xl shadow-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto" 
            style={{ backgroundColor: theme.colors.background }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="sticky top-0 flex items-center justify-between p-6 border-b border-gray-200" style={{ backgroundColor: theme.colors.background }}>
              <div className="flex items-center gap-4">
                {selectedEmployee.image ? (
                  <img
                    src={getImageUrl(selectedEmployee.image)}
                    alt={selectedEmployee.name}
                    className="w-16 h-16 rounded-lg object-cover border-2"
                    style={{ borderColor: theme.colors.primary }}
                  />
                ) : (
                  <div
                    className="w-16 h-16 rounded-lg flex items-center justify-center text-white text-xl font-bold"
                    style={{ backgroundColor: theme.colors.primary }}
                  >
                    {selectedEmployee.name.charAt(0).toUpperCase()}
                  </div>
                )}
                <h2 className="text-2xl font-bold text-gray-800">{selectedEmployee.name}</h2>
              </div>
              <button
                onClick={() => setShowDetailModal(false)}
                className="p-2 hover:bg-gray-200 rounded-lg transition"
              >
                <MdClose className="w-6 h-6" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-6">
              {/* Basic Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1 uppercase">Role</label>
                  <p className="text-gray-900 font-medium">{selectedEmployee.role}</p>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1 uppercase">Payment Type</label>
                  <p className="text-gray-900 font-medium">{selectedEmployee.paymentType}</p>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1 uppercase">Salary/Rate</label>
                  <p className="text-gray-900 font-medium">{selectedEmployee.salary}</p>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1 uppercase">Client</label>
                  <p className="text-gray-900 font-medium">{selectedEmployee.client}</p>
                </div>
              </div>

              {/* Documents Section */}
              <div className="border-t border-gray-200 pt-6">
                <h3 className="text-lg font-bold text-gray-800 mb-4">Documents & Identification</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 rounded-lg" style={{ backgroundColor: 'rgba(41, 157, 145, 0.05)' }}>
                    <label className="block text-xs font-semibold text-gray-600 mb-1 uppercase">Emirates ID</label>
                    <p className="text-gray-900 font-medium">{selectedEmployee.emiratesId || 'Not provided'}</p>
                    {selectedEmployee.emiratesIdImage && (
                      <img
                        src={getImageUrl(selectedEmployee.emiratesIdImage)}
                        alt="Emirates ID"
                        className="mt-2 w-40 h-24 object-cover rounded-md border"
                      />
                    )}
                  </div>
                  <div className="p-4 rounded-lg" style={{ backgroundColor: 'rgba(41, 157, 145, 0.05)' }}>
                    <label className="block text-xs font-semibold text-gray-600 mb-1 uppercase">Passport Number</label>
                    <p className="text-gray-900 font-medium">{selectedEmployee.passportNumber || 'Not provided'}</p>
                    {selectedEmployee.passportImage && (
                      <img
                        src={getImageUrl(selectedEmployee.passportImage)}
                        alt="Passport"
                        className="mt-2 w-40 h-24 object-cover rounded-md border"
                      />
                    )}
                  </div>
                  <div className="p-4 rounded-lg" style={{ backgroundColor: 'rgba(41, 157, 145, 0.05)' }}>
                    <label className="block text-xs font-semibold text-gray-600 mb-1 uppercase">Driving License</label>
                    <p className="text-gray-900 font-medium">{selectedEmployee.drivingLicense || 'Not provided'}</p>
                    {selectedEmployee.drivingLicenseImage && (
                      <img
                        src={getImageUrl(selectedEmployee.drivingLicenseImage)}
                        alt="Driving License"
                        className="mt-2 w-40 h-24 object-cover rounded-md border"
                      />
                    )}
                  </div>
                  <div className="p-4 rounded-lg" style={{ backgroundColor: 'rgba(41, 157, 145, 0.05)' }}>
                    <label className="block text-xs font-semibold text-gray-600 mb-1 uppercase">Labour Card</label>
                    <p className="text-gray-900 font-medium">{selectedEmployee.labourCard || 'Not provided'}</p>
                    {selectedEmployee.labourCardImage && (
                      <img
                        src={getImageUrl(selectedEmployee.labourCardImage)}
                        alt="Labour Card"
                        className="mt-2 w-40 h-24 object-cover rounded-md border"
                      />
                    )}
                  </div>
                  <div className="p-4 rounded-lg col-span-2" style={{ backgroundColor: 'rgba(41, 157, 145, 0.05)' }}>
                    <label className="block text-xs font-semibold text-gray-600 mb-1 uppercase">Insurance Documents</label>
                    <p className="text-gray-900 font-medium">{selectedEmployee.insuranceDocuments || 'Not provided'}</p>
                    {selectedEmployee.insuranceDocumentsImage && (
                      <img
                        src={getImageUrl(selectedEmployee.insuranceDocumentsImage)}
                        alt="Insurance Document"
                        className="mt-2 w-40 h-24 object-cover rounded-md border"
                      />
                    )}
                  </div>
                </div>
              </div>

              {/* Salary History */}
              <div className="border-t border-gray-200 pt-6">
                <h3 className="text-lg font-bold text-gray-800 mb-4">Salary History</h3>
                <div className="space-y-3">
                  {selectedEmployee.salaryHistory.map((record, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-4 rounded-lg"
                      style={{ backgroundColor: 'rgba(41, 157, 145, 0.05)' }}
                    >
                      <div>
                        <p className="font-semibold text-gray-800">{record.month}</p>
                        <p className="text-sm text-gray-600">{record.deliveries}</p>
                      </div>
                      <p className="font-bold text-lg" style={{ color: theme.colors.primary }}>
                        {record.amount}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Advances */}
              <div className="border-t border-gray-200 pt-6">
                <h3 className="text-lg font-bold text-gray-800 mb-4">Advances Taken</h3>
                {selectedEmployee.advances.length > 0 ? (
                  <div className="space-y-3">
                    {selectedEmployee.advances.map((advance, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-4 rounded-lg border border-gray-200"
                      >
                        <div>
                          <p className="font-semibold text-gray-800">{advance.date}</p>
                          <p
                            className="text-xs font-medium px-2 py-1 rounded-full mt-1 w-fit"
                            style={{
                              backgroundColor:
                                advance.status === 'Paid'
                                  ? 'rgba(34, 197, 94, 0.1)'
                                  : 'rgba(234, 179, 8, 0.1)',
                              color:
                                advance.status === 'Paid'
                                  ? '#22C55E'
                                  : '#EAB308',
                            }}
                          >
                            {advance.status}
                          </p>
                        </div>
                        <p className="font-bold text-lg text-gray-800">{advance.amount}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-4">No advances taken</p>
                )}
              </div>

              {/* Assigned Assets */}
              <div className="border-t border-gray-200 pt-6">
                <h3 className="text-lg font-bold text-gray-800 mb-4">Assigned Assets</h3>
                {selectedEmployee.assets.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {selectedEmployee.assets.map((asset, index) => (
                      <div
                        key={index}
                        className="p-4 rounded-lg border-2"
                        style={{ borderColor: theme.colors.primary }}
                      >
                        <p className="font-semibold text-gray-800">{asset}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-4">No assets assigned</p>
                )}
              </div>

              {/* Modal Actions */}
              <div className="border-t border-gray-200 pt-6 flex gap-3">
                <button
                  className="flex-1 text-white px-6 py-2 rounded-lg hover:opacity-90 transition"
                  style={{ backgroundColor: theme.colors.primary, borderRadius: theme.radius.button }}
                >
                  Edit Employee
                </button>
                <button
                  onClick={() => setShowDetailModal(false)}
                  className="flex-1 text-gray-700 px-6 py-2 rounded-lg border border-gray-300 hover:bg-gray-100 transition"
                  style={{ borderRadius: theme.radius.button }}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Employee Modal */}
      {showAddModal && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-sm"
          onClick={() => setShowAddModal(false)}
        >
          <div 
            className="bg-white rounded-xl shadow-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto" 
            style={{ backgroundColor: theme.colors.background }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="sticky top-0 flex items-center justify-between p-6 border-b border-gray-200" style={{ backgroundColor: theme.colors.background }}>
              <h2 className="text-2xl font-bold text-gray-800">Add New Employee</h2>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-2 hover:bg-gray-200 rounded-lg transition"
              >
                <MdClose className="w-6 h-6" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-5">
              {/* Name */}
              <div>
                <label className="block text-sm font-semibold text-gray-800 mb-2">Employee Name *</label>
                <input
                  type="text"
                  name="name"
                  value={newEmployeeForm.name}
                  onChange={handleFormChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                  placeholder="Enter employee name"
                />
              </div>

              {/* Role */}
              <div>
                <label className="block text-sm font-semibold text-gray-800 mb-2">Role *</label>
                <input
                  type="text"
                  name="role"
                  value={newEmployeeForm.role}
                  onChange={handleFormChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                  placeholder="e.g., Delivery Driver, Accountant"
                />
              </div>

              {/* Vehicle Type */}
              <div>
                <label className="block text-sm font-semibold text-gray-800 mb-2">Vehicle Type</label>
                <select
                  name="vehicleType"
                  value={newEmployeeForm.vehicleType}
                  onChange={handleFormChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                >
                  <option value="">Select vehicle type</option>
                  <option value="Bike">Bike</option>
                  <option value="Car">Car</option>
                </select>
              </div>

              {/* Payment Type */}
              <div>
                <label className="block text-sm font-semibold text-gray-800 mb-2">Payment Type *</label>
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setAddPaymentDropdownOpen(!addPaymentDropdownOpen)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg text-left flex items-center justify-between hover:border-gray-400 transition text-gray-700"
                  >
                    <span>{newEmployeeForm.paymentType}</span>
                    <svg
                      className="w-5 h-5 text-gray-500 transition-transform duration-200"
                      style={{
                        transform: addPaymentDropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                      }}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                    </svg>
                  </button>
                  {addPaymentDropdownOpen && (
                    <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-300 rounded-lg shadow-lg z-10">
                      {['Weekly', 'Monthly', 'Per Delivery'].map((option) => (
                        <button
                          key={option}
                          type="button"
                          onClick={() => {
                            setNewEmployeeForm({ ...newEmployeeForm, paymentType: option });
                            setAddPaymentDropdownOpen(false);
                          }}
                          className="w-full px-4 py-3 text-left hover:bg-gray-50 transition first:rounded-t-lg last:rounded-b-lg text-gray-700"
                          style={{
                            backgroundColor: newEmployeeForm.paymentType === option ? theme.colors.background : 'transparent',
                          }}
                        >
                          {option}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Salary/Rate */}
              <div>
                <label className="block text-sm font-semibold text-gray-800 mb-2">Salary / Rate *</label>
                <input
                  type="text"
                  name="salary"
                  value={newEmployeeForm.salary}
                  onChange={handleFormChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                  placeholder="e.g., AED 5,500 or AED 50/delivery"
                />
              </div>

              {/* Client */}
              <div>
                <label className="block text-sm font-semibold text-gray-800 mb-2">Assigned Client *</label>
                <input
                  type="text"
                  name="client"
                  value={newEmployeeForm.client}
                  onChange={handleFormChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                  placeholder="e.g., Emirates Express"
                />
              </div>

              {/* Status */}
              <div>
                <label className="block text-sm font-semibold text-gray-800 mb-2">Status</label>
                <select
                  name="status"
                  value={newEmployeeForm.status}
                  onChange={handleFormChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                  <option value="On Leave">On Leave</option>
                </select>
              </div>

              {/* Employee Image */}
              <div>
                <label className="block text-sm font-semibold text-gray-800 mb-2">Employee Image</label>
                <div className="flex flex-col items-center gap-4">
                  {newEmployeeForm.imagePreview && (
                    <div className="relative w-32 h-32">
                      <img
                        src={newEmployeeForm.imagePreview}
                        alt="Employee preview"
                        className="w-full h-full object-cover rounded-lg border-2"
                        style={{ borderColor: theme.colors.primary }}
                      />
                      <button
                        type="button"
                        onClick={() => setNewEmployeeForm(prev => ({
                          ...prev,
                          image: null,
                          imagePreview: null,
                        }))}
                        className="absolute -top-2 -right-2 bg-red-500 text-white p-1 rounded-full hover:bg-red-600 transition"
                      >
                        <MdClose className="w-5 h-5" />
                      </button>
                    </div>
                  )}
                  <input
                    type="file"
                    name="image"
                    onChange={handleFormChange}
                    accept="image/*"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition cursor-pointer"
                  />
                  <p className="text-xs text-gray-500">Supported formats: JPG, PNG (Max 5MB)</p>
                </div>
              </div>

              {/* Documents Section */}
              <div className="border-t border-gray-200 pt-5">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Documents & Identification</h3>
                
                {/* Emirates ID */}
                <div className="mb-5">
                  <label className="block text-sm font-semibold text-gray-800 mb-2">Emirates ID</label>
                  <input
                    type="text"
                    name="emiratesId"
                    value={newEmployeeForm.emiratesId}
                    onChange={handleFormChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                    placeholder="e.g., 784-1234-5678901-2"
                  />
                  <div className="mt-3 flex flex-col items-start gap-3">
                    {newEmployeeForm.emiratesIdImagePreview && (
                      <div className="relative w-32 h-20">
                        <img
                          src={newEmployeeForm.emiratesIdImagePreview}
                          alt="Emirates ID preview"
                          className="w-full h-full object-cover rounded-md border"
                        />
                        <button
                          type="button"
                          onClick={() => setNewEmployeeForm(prev => ({
                            ...prev,
                            emiratesIdImage: null,
                            emiratesIdImagePreview: null,
                          }))}
                          className="absolute -top-2 -right-2 bg-red-500 text-white p-1 rounded-full hover:bg-red-600 transition"
                        >
                          <MdClose className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                    <input
                      type="file"
                      name="emiratesIdImage"
                      onChange={handleFormChange}
                      accept="image/*"
                      className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition cursor-pointer"
                    />
                  </div>
                </div>

                {/* Passport Number */}
                <div className="mb-5">
                  <label className="block text-sm font-semibold text-gray-800 mb-2">Passport Number</label>
                  <input
                    type="text"
                    name="passportNumber"
                    value={newEmployeeForm.passportNumber}
                    onChange={handleFormChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                    placeholder="e.g., G12345678"
                  />
                  <div className="mt-3 flex flex-col items-start gap-3">
                    {newEmployeeForm.passportImagePreview && (
                      <div className="relative w-32 h-20">
                        <img
                          src={newEmployeeForm.passportImagePreview}
                          alt="Passport preview"
                          className="w-full h-full object-cover rounded-md border"
                        />
                        <button
                          type="button"
                          onClick={() => setNewEmployeeForm(prev => ({
                            ...prev,
                            passportImage: null,
                            passportImagePreview: null,
                          }))}
                          className="absolute -top-2 -right-2 bg-red-500 text-white p-1 rounded-full hover:bg-red-600 transition"
                        >
                          <MdClose className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                    <input
                      type="file"
                      name="passportImage"
                      onChange={handleFormChange}
                      accept="image/*"
                      className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition cursor-pointer"
                    />
                  </div>
                </div>

                {/* Driving License */}
                <div className="mb-5">
                  <label className="block text-sm font-semibold text-gray-800 mb-2">Driving License</label>
                  <input
                    type="text"
                    name="drivingLicense"
                    value={newEmployeeForm.drivingLicense}
                    onChange={handleFormChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                    placeholder="e.g., 123456789"
                  />
                  <div className="mt-3 flex flex-col items-start gap-3">
                    {newEmployeeForm.drivingLicenseImagePreview && (
                      <div className="relative w-32 h-20">
                        <img
                          src={newEmployeeForm.drivingLicenseImagePreview}
                          alt="Driving license preview"
                          className="w-full h-full object-cover rounded-md border"
                        />
                        <button
                          type="button"
                          onClick={() => setNewEmployeeForm(prev => ({
                            ...prev,
                            drivingLicenseImage: null,
                            drivingLicenseImagePreview: null,
                          }))}
                          className="absolute -top-2 -right-2 bg-red-500 text-white p-1 rounded-full hover:bg-red-600 transition"
                        >
                          <MdClose className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                    <input
                      type="file"
                      name="drivingLicenseImage"
                      onChange={handleFormChange}
                      accept="image/*"
                      className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition cursor-pointer"
                    />
                  </div>
                </div>

                {/* Labour Card */}
                <div className="mb-5">
                  <label className="block text-sm font-semibold text-gray-800 mb-2">Labour Card</label>
                  <input
                    type="text"
                    name="labourCard"
                    value={newEmployeeForm.labourCard}
                    onChange={handleFormChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                    placeholder="e.g., LC-2024-123456"
                  />
                  <div className="mt-3 flex flex-col items-start gap-3">
                    {newEmployeeForm.labourCardImagePreview && (
                      <div className="relative w-32 h-20">
                        <img
                          src={newEmployeeForm.labourCardImagePreview}
                          alt="Labour card preview"
                          className="w-full h-full object-cover rounded-md border"
                        />
                        <button
                          type="button"
                          onClick={() => setNewEmployeeForm(prev => ({
                            ...prev,
                            labourCardImage: null,
                            labourCardImagePreview: null,
                          }))}
                          className="absolute -top-2 -right-2 bg-red-500 text-white p-1 rounded-full hover:bg-red-600 transition"
                        >
                          <MdClose className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                    <input
                      type="file"
                      name="labourCardImage"
                      onChange={handleFormChange}
                      accept="image/*"
                      className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition cursor-pointer"
                    />
                  </div>
                </div>

                {/* Insurance Documents */}
                <div>
                  <label className="block text-sm font-semibold text-gray-800 mb-2">Insurance Documents</label>
                  <input
                    type="text"
                    name="insuranceDocuments"
                    value={newEmployeeForm.insuranceDocuments}
                    onChange={handleFormChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                    placeholder="e.g., INS-2024-456789"
                  />
                  <div className="mt-3 flex flex-col items-start gap-3">
                    {newEmployeeForm.insuranceDocumentsImagePreview && (
                      <div className="relative w-32 h-20">
                        <img
                          src={newEmployeeForm.insuranceDocumentsImagePreview}
                          alt="Insurance document preview"
                          className="w-full h-full object-cover rounded-md border"
                        />
                        <button
                          type="button"
                          onClick={() => setNewEmployeeForm(prev => ({
                            ...prev,
                            insuranceDocumentsImage: null,
                            insuranceDocumentsImagePreview: null,
                          }))}
                          className="absolute -top-2 -right-2 bg-red-500 text-white p-1 rounded-full hover:bg-red-600 transition"
                        >
                          <MdClose className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                    <input
                      type="file"
                      name="insuranceDocumentsImage"
                      onChange={handleFormChange}
                      accept="image/*"
                      className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition cursor-pointer"
                    />
                  </div>
                </div>
              </div>

              {/* Modal Actions */}
              <div className="border-t border-gray-200 pt-6 flex gap-3">
                <button
                  onClick={handleSubmitEmployee}
                  className="flex-1 text-white px-6 py-2 rounded-lg hover:opacity-90 transition"
                  style={{ backgroundColor: theme.colors.primary, borderRadius: theme.radius.button }}
                >
                  Add Employee
                </button>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 text-gray-700 px-6 py-2 rounded-lg border border-gray-300 hover:bg-gray-100 transition"
                  style={{ borderRadius: theme.radius.button }}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
