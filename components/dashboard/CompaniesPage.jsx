'use client';

import { useState, useEffect } from 'react';
import { MdAdd, MdClose, MdBusiness, MdDelete } from 'react-icons/md';
import { db } from '@/lib/firebase';
import { collection, onSnapshot, addDoc, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { theme } from '@/lib/theme';
import toast from 'react-hot-toast';

const MAX_LOGO_SIZE_BYTES = 5 * 1024 * 1024;
const TARGET_LOGO_MAX_DIMENSION = 1200;
const TARGET_LOGO_QUALITY = 0.8;

const getInitialMember = () => ({
  memberName: '',
  memberId: '',
  fee: '',
});

const getInitialProject = () => ({
  projectType: '',
  members: [getInitialMember()],
});

const getInitialCompanyForm = () => ({
  name: '',
  logoFile: null,
  logoPreview: null,
});

export default function CompaniesPage() {
  const [companies, setCompanies] = useState([]);

  const [selectedCompany, setSelectedCompany] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [companyToDelete, setCompanyToDelete] = useState(null);
  const [newCompanyForm, setNewCompanyForm] = useState(getInitialCompanyForm());
  const [editCompanyForm, setEditCompanyForm] = useState({
    name: '',
    projects: [getInitialProject()],
  });
  const [isAddingCompany, setIsAddingCompany] = useState(false);
  const [isDeletingCompany, setIsDeletingCompany] = useState(false);
  const [isSavingCompanyDetails, setIsSavingCompanyDetails] = useState(false);
  const [activeProjectByCompany, setActiveProjectByCompany] = useState({});

  const normalizeProjectMembers = (members) => {
    const sourceMembers = Array.isArray(members)
      ? members
      : members && typeof members === 'object'
        ? Object.values(members)
        : [];

    return sourceMembers
      .map((member) => {
        if (typeof member === 'string') {
          const name = member.trim();
          if (!name) return null;
          return {
            memberName: name,
            memberId: '',
            fee: 0,
          };
        }

        if (!member || typeof member !== 'object') return null;

        const memberName = String(member.memberName || member.name || '').trim();
        const memberId = String(member.memberId || member.id || '').trim();
        const fee = Number(member.fee) || 0;

        if (!memberName && !memberId && fee <= 0) return null;

        return {
          memberName,
          memberId,
          fee,
        };
      })
      .filter(Boolean);
  };

  const getCompanyProjects = (company) => {
    if (Array.isArray(company.projects) && company.projects.length > 0) {
      return company.projects.map((project) => ({
        projectType: project.projectType || project.name || 'Untitled Project',
        members: normalizeProjectMembers(project.members),
      }));
    }

    if (company.projects && typeof company.projects === 'object') {
      return Object.values(company.projects).map((project) => ({
        projectType: project.projectType || project.name || 'Untitled Project',
        members: normalizeProjectMembers(project.members),
      }));
    }

    if (company.serviceType || (Array.isArray(company.assignedEmployees) && company.assignedEmployees.length > 0)) {
      return [{
        projectType: company.serviceType || 'General Services',
        members: Array.isArray(company.assignedEmployees)
          ? company.assignedEmployees
              .filter(Boolean)
              .map((memberName) => ({ memberName, memberId: '', fee: 0 }))
          : [],
      }];
    }

    return [];
  };

  const getCompanyMemberCount = (company) => {
    const projects = getCompanyProjects(company);
    const uniqueMembers = new Set();
    projects.forEach((project) => {
      project.members.forEach((member) => {
        const uniqueKey = member.memberId || member.memberName;
        if (uniqueKey) uniqueMembers.add(uniqueKey);
      });
    });
    return uniqueMembers.size;
  };

  const getMemberSummary = (company, limit = 2) => {
    const projects = getCompanyProjects(company);
    const rows = [];

    projects.forEach((project) => {
      project.members.forEach((member) => {
        if (rows.length < limit) {
          rows.push({
            projectType: project.projectType,
            memberName: member.memberName || 'Unknown',
            memberId: member.memberId || '-',
            fee: Number(member.fee) || 0,
          });
        }
      });
    });

    return rows;
  };

  const handleViewCompany = (company) => {
    const editableProjects = getCompanyProjects(company);

    setEditCompanyForm({
      name: company.name || '',
      projects: editableProjects.length > 0
        ? editableProjects.map((project) => ({
            projectType: project.projectType || '',
            members: (Array.isArray(project.members) ? project.members : []).map((member) => ({
              memberName: member.memberName || '',
              memberId: member.memberId || '',
              fee: member.fee || '',
            })),
          }))
        : [getInitialProject()],
    });

    setSelectedCompany(company);
    setShowDetailModal(true);
  };

  const handleAddCompany = () => {
    setShowAddModal(true);
  };

  const handleSelectProject = (companyId, projectIndex) => {
    setActiveProjectByCompany((prev) => ({
      ...prev,
      [companyId]: projectIndex,
    }));
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setNewCompanyForm(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleEditCompanyFormChange = (e) => {
    const { name, value } = e.target;
    setEditCompanyForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleProjectChange = (index, field, value) => {
    setEditCompanyForm((prev) => ({
      ...prev,
      projects: prev.projects.map((project, i) =>
        i === index ? { ...project, [field]: value } : project
      ),
    }));
  };

  const handleProjectMemberChange = (projectIndex, memberIndex, field, value) => {
    setEditCompanyForm((prev) => ({
      ...prev,
      projects: prev.projects.map((project, pIdx) => {
        if (pIdx !== projectIndex) return project;
        const currentMembers = Array.isArray(project.members) ? project.members : [];

        return {
          ...project,
          members: currentMembers.map((member, mIdx) =>
            mIdx === memberIndex ? { ...member, [field]: value } : member
          ),
        };
      }),
    }));
  };

  const addMemberToProject = (projectIndex) => {
    setEditCompanyForm((prev) => ({
      ...prev,
      projects: prev.projects.map((project, index) =>
        index === projectIndex
          ? { ...project, members: [...(Array.isArray(project.members) ? project.members : []), getInitialMember()] }
          : project
      ),
    }));
  };

  const removeMemberFromProject = (projectIndex, memberIndex) => {
    setEditCompanyForm((prev) => ({
      ...prev,
      projects: prev.projects.map((project, index) => {
        if (index !== projectIndex) return project;

        const currentMembers = Array.isArray(project.members) ? project.members : [];
        const filteredMembers = currentMembers.filter((_, mIndex) => mIndex !== memberIndex);
        return {
          ...project,
          members: filteredMembers.length > 0 ? filteredMembers : [getInitialMember()],
        };
      }),
    }));
  };

  const addProjectField = () => {
    setEditCompanyForm((prev) => ({
      ...prev,
      projects: [...prev.projects, getInitialProject()],
    }));
  };

  const removeProjectField = (index) => {
    setEditCompanyForm((prev) => ({
      ...prev,
      projects: prev.projects.filter((_, i) => i !== index),
    }));
  };

  const compressImageFile = (file) => new Promise((resolve, reject) => {
    const image = new Image();
    const fileReader = new FileReader();

    fileReader.onload = () => {
      image.src = fileReader.result;
    };

    fileReader.onerror = () => reject(new Error('Failed to read image'));

    image.onload = () => {
      const canvas = document.createElement('canvas');
      const ratio = Math.min(
        1,
        TARGET_LOGO_MAX_DIMENSION / image.width,
        TARGET_LOGO_MAX_DIMENSION / image.height
      );

      canvas.width = Math.max(1, Math.round(image.width * ratio));
      canvas.height = Math.max(1, Math.round(image.height * ratio));

      const context = canvas.getContext('2d');
      if (!context) {
        reject(new Error('Unable to initialize canvas context'));
        return;
      }

      context.drawImage(image, 0, 0, canvas.width, canvas.height);

      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error('Failed to compress image'));
            return;
          }

          const extension = file.type === 'image/png' ? 'png' : 'jpg';
          const compressedFile = new File(
            [blob],
            `${file.name.replace(/\.[^.]+$/, '')}_compressed.${extension}`,
            { type: blob.type || file.type }
          );

          resolve(compressedFile);
        },
        file.type === 'image/png' ? 'image/png' : 'image/jpeg',
        TARGET_LOGO_QUALITY
      );
    };

    image.onerror = () => reject(new Error('Failed to load image'));

    fileReader.readAsDataURL(file);
  });

  const handleLogoChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > MAX_LOGO_SIZE_BYTES) {
      toast.error('Logo file size must be 5 MB or less');
      e.target.value = '';
      return;
    }

    try {
      const optimizedFile = file.type.startsWith('image/')
        ? await compressImageFile(file)
        : file;

      const reader = new FileReader();
      reader.onloadend = () => {
        setNewCompanyForm((prev) => ({
          ...prev,
          logoFile: optimizedFile,
          logoPreview: reader.result,
        }));
      };
      reader.readAsDataURL(optimizedFile);
    } catch (error) {
      console.error(error);
      toast.error('Failed to process logo image');
      e.target.value = '';
    }
  };

  const uploadCompanyLogo = async (logoFile, companyName) => {
    if (!logoFile) {
      return { logoPath: '', logoUrl: '' };
    }

    const formData = new FormData();
    formData.append('file', logoFile);
    formData.append('fileName', logoFile.name || `${companyName.trim().replace(/\s+/g, '_').toLowerCase()}_logo`);
    formData.append('folder', 'Dashboard-Project/companies');

    const response = await fetch('/api/imagekit/upload', {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const errorPayload = await response.json().catch(() => ({}));
      throw new Error(errorPayload.error || 'Failed to upload company logo');
    }

    const result = await response.json();

    return {
      logoPath: result.filePath || '',
      logoUrl: result.url || '',
      logoFileId: result.fileId || '',
    };
  };

  const uploadAndAttachLogo = async (companyDocId, companyName, logoFile) => {
    try {
      const { logoPath, logoUrl, logoFileId } = await uploadCompanyLogo(logoFile, companyName);
      await updateDoc(doc(db, 'companies', companyDocId), {
        logoPath,
        logoUrl,
        logoFileId,
        logoUploadStatus: 'completed',
        updatedAt: Date.now(),
      });
      toast.success('Company logo uploaded');
    } catch (error) {
      console.error('Logo upload error:', error);
      await updateDoc(doc(db, 'companies', companyDocId), {
        logoUploadStatus: 'failed',
        updatedAt: Date.now(),
      }).catch(() => null);
      toast.error(error?.message || 'Company added, but logo upload failed');
    }
  };

  const handleSubmitCompany = async () => {
    if (isAddingCompany) return;

    if (!newCompanyForm.name.trim()) {
      toast.error('Company name is required');
      return;
    }

    try {
      setIsAddingCompany(true);

      const companyName = newCompanyForm.name.trim();
      const logoFile = newCompanyForm.logoFile;

      const newCompany = {
        name: companyName,
        logoPath: '',
        logoFileId: '',
        logoUrl: '',
        logoUploadStatus: logoFile ? 'uploading' : 'completed',
        projects: [],
        monthlyCharge: 0,
        assignedEmployees: [],
        paymentStatus: 'Pending',
        invoices: [],
        paymentHistory: [],
        createdAt: Date.now(),
      };

      const docRef = await addDoc(collection(db, 'companies'), newCompany);
      toast.success(logoFile ? 'Company added. Uploading logo...' : 'Company added successfully!');
      setShowAddModal(false);
      setNewCompanyForm(getInitialCompanyForm());

      if (logoFile) {
        uploadAndAttachLogo(docRef.id, companyName, logoFile);
      }
    } catch (err) {
      console.error(err);
      toast.error(err?.message || 'Failed to add company');
    } finally {
      setIsAddingCompany(false);
    }
  };

  const handleSaveCompanyDetails = async () => {
    if (!selectedCompany?.id || isSavingCompanyDetails) return;

    if (!editCompanyForm.name.trim()) {
      toast.error('Company name is required');
      return;
    }

    const cleanedProjects = editCompanyForm.projects
      .map((project) => ({
        projectType: project.projectType.trim(),
        members: (Array.isArray(project.members) ? project.members : [])
          .map((member) => ({
            memberName: String(member.memberName || '').trim(),
            memberId: String(member.memberId || '').trim(),
            fee: Number(member.fee) || 0,
          }))
          .filter((member) => member.memberName || member.memberId || member.fee > 0),
      }))
      .filter((project) => project.projectType);

    const hasInvalidMember = cleanedProjects.some((project) =>
      project.members.some((member) => !member.memberName || !member.memberId || member.fee <= 0)
    );

    if (hasInvalidMember) {
      toast.error('Each member must include name, ID, and fee');
      return;
    }

    const hasProjectWithoutMembers = cleanedProjects.some((project) => project.members.length === 0);
    if (hasProjectWithoutMembers) {
      toast.error('Each project must have at least one member');
      return;
    }

    const assignedEmployees = [
      ...new Set(cleanedProjects.flatMap((project) => project.members.map((member) => member.memberName))),
    ];

    try {
      setIsSavingCompanyDetails(true);
      await updateDoc(doc(db, 'companies', selectedCompany.id), {
        name: editCompanyForm.name.trim(),
        projects: cleanedProjects,
        assignedEmployees,
        updatedAt: Date.now(),
      });
      toast.success('Company details updated');
      setShowDetailModal(false);
    } catch (error) {
      console.error(error);
      toast.error('Failed to update company details');
    } finally {
      setIsSavingCompanyDetails(false);
    }
  };

  const companyGridRows = companies.map((company) => {
    const projects = getCompanyProjects(company);
    const membersCount = getCompanyMemberCount(company);
    const memberPreview = getMemberSummary(company);
    const monthlyCharge = Number(company.monthlyCharge) || 0;

    return {
      company,
      projects,
      membersCount,
      memberPreview,
      monthlyCharge,
      paymentStatus: company.paymentStatus || 'Pending',
    };
  });

  const totalRevenue = companyGridRows.reduce((sum, row) => sum + row.monthlyCharge, 0);
  const paidRevenue = companyGridRows
    .filter((row) => row.paymentStatus === 'Paid')
    .reduce((sum, row) => sum + row.monthlyCharge, 0);
  const pendingRevenue = companyGridRows
    .filter((row) => row.paymentStatus === 'Pending')
    .reduce((sum, row) => sum + row.monthlyCharge, 0);

  // Subscribe to companies collection
  useEffect(() => {
    const companiesRef = collection(db, 'companies');
    const unsub = onSnapshot(companiesRef, (snapshot) => {
      const list = snapshot.docs.map(docSnap => ({ id: docSnap.id, ...docSnap.data() }));
      setCompanies(list);
    }, (error) => {
      console.error('Error fetching companies:', error);
      toast.error('Failed to fetch companies');
    });

    return () => unsub();
  }, []);

  // Handle Escape key to close modals
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        if (showDetailModal) setShowDetailModal(false);
        if (showAddModal) setShowAddModal(false);
        if (showDeleteConfirm) setShowDeleteConfirm(false);
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [showDetailModal, showAddModal, showDeleteConfirm]);

  const requestDeleteCompany = (company) => {
    setCompanyToDelete(company);
    setShowDeleteConfirm(true);
  };

  const confirmDeleteCompany = async () => {
    if (isDeletingCompany || !companyToDelete) return;

    if (!companyToDelete) return;
    try {
      setIsDeletingCompany(true);
      await deleteDoc(doc(db, 'companies', companyToDelete.id));

      if (companyToDelete.logoFileId || companyToDelete.logoPath) {
        await fetch('/api/imagekit/delete', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            fileId: companyToDelete.logoFileId || '',
            filePath: companyToDelete.logoPath || '',
          }),
        }).catch(() => null);
      }

      toast.success('Company deleted');
    } catch (err) {
      console.error(err);
      toast.error('Failed to delete');
    } finally {
      setIsDeletingCompany(false);
    }
    setShowDeleteConfirm(false);
    setCompanyToDelete(null);
  };

  return (
    <div className="space-y-6 w-full max-w-full overflow-hidden">

      {/* Revenue Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3 w-full">
        <div className="bg-white rounded-xl shadow-md p-3 sm:p-4" style={{ backgroundColor: theme.colors.background }}>
          <p className="text-gray-600 text-xs font-medium mb-1">Total Monthly Revenue</p>
          <p className="text-lg sm:text-2xl font-bold text-gray-800">AED {totalRevenue.toLocaleString()}</p>
        </div>
        <div className="bg-white rounded-xl shadow-md p-3 sm:p-4" style={{ backgroundColor: theme.colors.background }}>
          <p className="text-gray-600 text-xs font-medium mb-1">Paid This Month</p>
          <p className="text-lg sm:text-2xl font-bold text-green-500">AED {paidRevenue.toLocaleString()}</p>
        </div>
        <div className="bg-white rounded-xl shadow-md p-3 sm:p-4" style={{ backgroundColor: theme.colors.background }}>
          <p className="text-gray-600 text-xs font-medium mb-1">Pending Payment</p>
          <p className="text-lg sm:text-2xl font-bold" style={{ color: '#EAB308' }}>AED {pendingRevenue.toLocaleString()}</p>
        </div>
      </div>

      {/* Companies Hierarchy Overview */}
      <div
        className="bg-white rounded-xl shadow-md p-4 sm:p-6 overflow-hidden"
        style={{ backgroundColor: theme.colors.background }}
      >
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-5">
          <h2 className="text-2xl font-bold text-slate-800 tracking-wide">Companies Overview</h2>
          <button
            onClick={handleAddCompany}
            className="flex items-center justify-center space-x-2 text-white px-6 py-2 rounded-lg hover:opacity-90 transition"
            style={{ backgroundColor: theme.colors.primary, borderRadius: theme.radius.button }}
          >
            <MdAdd className="w-5 h-5" />
            <span>Create Company</span>
          </button>
        </div>

        {companyGridRows.length > 0 ? (
          <div className="pb-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-4 sm:gap-5">
              {companyGridRows.map((row) => {
                const { company, projects } = row;
                const selectedProjectIndex =
                  typeof activeProjectByCompany[company.id] === 'number' && activeProjectByCompany[company.id] < projects.length
                    ? activeProjectByCompany[company.id]
                    : 0;
                const activeProject = projects[selectedProjectIndex] || null;
                const activeMembers = Array.isArray(activeProject?.members) ? activeProject.members : [];

                return (
                  <div
                    key={company.id}
                    className="rounded-2xl bg-white p-4 shadow-md flex flex-col min-h-130"
                  >
                    <div className="flex justify-center">
                      <div
                        className="h-32 w-32 rounded-full border-[6px] bg-white shadow-inner flex items-center justify-center overflow-hidden"
                        style={{
                          borderColor: `${theme.colors.primary}33`,
                          boxShadow: `inset 0 0 20px ${theme.colors.primary}22`,
                        }}
                      >
                        {company.logoUrl ? (
                          <img src={company.logoUrl} alt={company.name} className="w-18 h-18 rounded-full object-cover" />
                        ) : (
                          <MdBusiness className="w-9 h-9" style={{ color: theme.colors.primary }} />
                        )}
                      </div>
                    </div>

                    <p className="mt-3 text-center font-bold text-slate-800 uppercase text-sm tracking-wide truncate" title={company.name}>
                      {company.name}
                    </p>

                    <div className="grid grid-cols-2 gap-2 mt-3 text-[11px]">
                      <div className="rounded-md bg-slate-50 border border-slate-200 px-2 py-1 text-slate-700">
                        Projects: <span className="font-semibold">{projects.length}</span>
                      </div>
                      {/*
                      <div className="col-span-2 rounded-md bg-cyan-50 border border-cyan-100 px-2 py-1 text-slate-700">
                        Monthly: <span className="font-semibold">AED {monthlyCharge.toLocaleString()}</span>
                      </div>
                      */}
                    </div>

                    <div className="grid grid-cols-3 gap-3 mt-4">
                      <button
                        type="button"
                        onClick={() => handleViewCompany(company)}
                        className="col-span-2 text-xs font-semibold rounded-lg px-2 py-2 text-white hover:opacity-90 transition"
                        style={{ backgroundColor: theme.colors.primary }}
                      >
                        + Create Project
                      </button>
                      <button
                        type="button"
                        onClick={() => requestDeleteCompany(company)}
                        className="text-xs font-semibold rounded-lg px-2 py-2 text-white hover:opacity-90 transition"
                        style={{ backgroundColor: theme.colors.error }}
                        title="Delete Company"
                      >
                        <span className="flex items-center justify-center gap-1"><MdDelete className="w-3.5 h-3.5" />Delete</span>
                      </button>
                    </div>

                    <div className="mt-4">
                      <p className="text-xs font-semibold text-slate-700 mb-2">Projects</p>
                      {projects.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                          {projects.map((project, projectIdx) => {
                            const isActive = selectedProjectIndex === projectIdx;
                            return (
                              <button
                                key={`${company.id}-${projectIdx}`}
                                type="button"
                                onClick={() => handleSelectProject(company.id, projectIdx)}
                                className={`h-12 w-12 rounded-full text-xs font-bold border transition ${
                                  isActive
                                    ? 'text-white border-transparent'
                                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                                }`}
                                style={isActive ? { backgroundColor: theme.colors.primary } : undefined}
                                title={project.projectType || 'Untitled Project'}
                              >
                                {(project.projectType || 'P').trim().slice(0, 2).toUpperCase()}
                              </button>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="text-xs text-slate-500 rounded-md border border-dashed border-slate-200 px-3 py-2 bg-white/90">
                          Data pending. Create your first project.
                        </div>
                      )}
                    </div>

                    <div className="mt-4 mb-4 rounded-xl border border-slate-200 bg-white p-3">
                      <p className="text-xs font-semibold text-slate-700 mb-2">
                        {activeProject ? `Employees - ${activeProject.projectType}` : 'Employees'}
                      </p>

                      {activeMembers.length > 0 ? (
                        <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                          {activeMembers.map((member, memberIdx) => (
                            <div key={`${company.id}-${selectedProjectIndex}-${memberIdx}`} className="rounded-md border border-slate-100 bg-slate-50 px-2 py-1.5">
                              <p className="text-xs font-semibold text-slate-700 truncate">{member.memberName || 'Unknown Member'}</p>
                              <p className="text-[11px] text-slate-500 truncate">ID: {member.memberId || '-'}</p>
                              <p className="text-[11px] text-slate-600">Fee: AED {(Number(member.fee) || 0).toLocaleString()}</p>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-xs text-slate-500 rounded-md border border-dashed border-slate-200 px-3 py-2">
                          No employee data for this project.
                        </div>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => handleViewCompany(company)}
                      className="mt-auto w-full text-xs font-semibold rounded-lg px-3 py-2 border border-slate-200 text-slate-700 hover:bg-slate-50 transition"
                    >
                      Edit Company Details
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-slate-200 bg-white/70 px-6 py-12 text-center">
            <p className="text-slate-600 mb-4">No companies added yet</p>
            <button
              onClick={handleAddCompany}
              className="inline-flex items-center gap-2 text-white px-5 py-2 rounded-lg hover:opacity-90 transition"
              style={{ backgroundColor: theme.colors.primary }}
            >
              <MdAdd className="w-4 h-4" />
              Create Company
            </button>
          </div>
        )}
      </div>

      {/* Company Detail Modal */}
      {showDetailModal && selectedCompany && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-sm  "
          onClick={() => setShowDetailModal(false)}
        >
          <div 
            className="bg-white rounded-xl shadow-lg max-w-3xl w-full max-h-[90vh] overflow-hidden" 
            style={{ backgroundColor: theme.colors.background }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-6 border-b border-gray-200 sticky top-0 bg-white z-10" style={{ backgroundColor: theme.colors.background }}>
              <div className="flex items-center gap-3">
                {selectedCompany.logoUrl ? (
                  <img src={selectedCompany.logoUrl} alt={selectedCompany.name} className="w-12 h-12 rounded-lg object-cover border border-gray-200" />
                ) : (
                  <div className="w-12 h-12 rounded-lg flex items-center justify-center" style={{ backgroundColor: 'rgba(41, 157, 145, 0.1)' }}>
                    <MdBusiness className="w-7 h-7" style={{ color: theme.colors.primary }} />
                  </div>
                )}
                <h2 className="text-xl font-bold text-gray-800">{selectedCompany.name}</h2>
              </div>
              <button
                onClick={() => setShowDetailModal(false)}
                className="p-2 hover:bg-gray-200 rounded-lg transition text-gray-700"
                title="Close"
              >
                <MdClose className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 space-y-6 overflow-y-auto max-h-[calc(90vh-80px)]">
              {(() => {
                const projects = editCompanyForm.projects;
                const totalMembers = new Set(
                  projects.flatMap((project) =>
                    (Array.isArray(project.members) ? project.members : [])
                      .map((member) => member.memberId || member.memberName)
                      .filter(Boolean)
                  )
                ).size;
                // const invoices = selectedCompany.invoices || [];
                // const paymentHistory = selectedCompany.paymentHistory || [];

                return (
                  <>
              {/* Company Info */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-gray-800 mb-3">Company Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                  <div className="md:col-span-2">
                    <label className="block text-sm text-gray-600 mb-1">Company Name</label>
                    <input
                      type="text"
                      name="name"
                      value={editCompanyForm.name}
                      onChange={handleEditCompanyFormChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Total Projects</p>
                    <p className="font-semibold text-gray-900">{projects.length}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Team Members</p>
                    <p className="font-semibold text-gray-900">{totalMembers}</p>
                  </div>
                </div>
              </div>

              {/* Projects */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-lg font-semibold text-gray-800">Projects</h3>
                  <button
                    type="button"
                    onClick={addProjectField}
                    className="text-xs font-semibold px-3 py-1 rounded-lg text-white"
                    style={{ backgroundColor: theme.colors.primary }}
                  >
                    Add Project
                  </button>
                </div>
                <div className="space-y-3">
                  {projects.length > 0 ? (
                    projects.map((project, idx) => (
                      <div key={idx} className="bg-gray-50 rounded-lg p-4">
                        <label className="block text-sm text-gray-600 mb-1">Project Name</label>
                        <input
                          type="text"
                          value={project.projectType}
                          onChange={(e) => handleProjectChange(idx, 'projectType', e.target.value)}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                          placeholder="Name"
                        />

                        <div className="flex items-center justify-between mt-3 mb-2">
                          <p className="text-sm text-gray-600">Members</p>
                          <button
                            type="button"
                            onClick={() => addMemberToProject(idx)}
                            className="text-[11px] font-semibold px-2 py-1 rounded-md text-white"
                            style={{ backgroundColor: theme.colors.primary }}
                          >
                            Add Member
                          </button>
                        </div>

                        <div className="space-y-2">
                          {(Array.isArray(project.members) ? project.members : []).map((member, memberIdx) => (
                            <div key={`${idx}-${memberIdx}`} className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                              <input
                                type="text"
                                value={member.memberName}
                                onChange={(e) => handleProjectMemberChange(idx, memberIdx, 'memberName', e.target.value)}
                                placeholder="Name"
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                              />
                              <input
                                type="text"
                                value={member.memberId}
                                onChange={(e) => handleProjectMemberChange(idx, memberIdx, 'memberId', e.target.value)}
                                placeholder="ID"
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                              />
                              <div className="flex gap-2">
                                <input
                                  type="number"
                                  min="0"
                                  value={member.fee}
                                  onChange={(e) => handleProjectMemberChange(idx, memberIdx, 'fee', e.target.value)}
                                  placeholder="Fee"
                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                                />
                                {(Array.isArray(project.members) ? project.members.length : 0) > 1 && (
                                  <button
                                    type="button"
                                    onClick={() => removeMemberFromProject(idx, memberIdx)}
                                    className="h-10 w-10 flex items-center justify-center rounded-lg bg-red-600 text-white hover:bg-red-700 transition"
                                    title="Remove member"
                                    aria-label="Remove member"
                                  >
                                    <MdClose className="w-4 h-4" />
                                  </button>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>

                        {projects.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeProjectField(idx)}
                            className="mt-3 text-xs font-semibold px-3 py-1 rounded-lg text-white"
                            style={{ backgroundColor: theme.colors.error }}
                          >
                            Remove Project
                          </button>
                        )}
                      </div>
                    ))
                  ) : (
                    <div className="bg-gray-50 rounded-lg p-4">
                      <p className="text-gray-500">No projects added</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="button"
                  onClick={handleSaveCompanyDetails}
                  disabled={isSavingCompanyDetails}
                  className="text-white px-5 py-2 rounded-lg font-medium disabled:opacity-60 disabled:cursor-not-allowed"
                  style={{ backgroundColor: theme.colors.primary }}
                >
                  {isSavingCompanyDetails ? 'Saving...' : 'Save Changes'}
                </button>
              </div>

              {/*
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-3">Monthly Invoices</h3>
                <div className="bg-gray-50 rounded-lg overflow-hidden">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-gray-200">
                        <th className="px-4 py-2 text-left text-sm font-semibold text-gray-800">Month</th>
                        <th className="px-4 py-2 text-left text-sm font-semibold text-gray-800">Amount</th>
                        <th className="px-4 py-2 text-left text-sm font-semibold text-gray-800">Status</th>
                        <th className="px-4 py-2 text-left text-sm font-semibold text-gray-800">Paid Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {invoices.length > 0 ? (
                        invoices.map((invoice, idx) => (
                          <tr key={idx} className="border-t border-gray-200">
                            <td className="px-4 py-2 text-sm text-gray-700">{invoice.month}</td>
                            <td className="px-4 py-2 text-sm font-semibold" style={{ color: theme.colors.primary }}>
                              AED {invoice.amount.toLocaleString()}
                            </td>
                            <td className="px-4 py-2 text-sm">
                              <span
                                className={`px-2 py-1 rounded-full text-xs font-semibold ${
                                  invoice.status === 'Paid'
                                    ? 'bg-green-100 text-green-700'
                                    : 'bg-yellow-100 text-yellow-700'
                                }`}
                              >
                                {invoice.status}
                              </span>
                            </td>
                            <td className="px-4 py-2 text-sm text-gray-600">
                              {invoice.paidDate || 'N/A'}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="4" className="px-4 py-4 text-center text-gray-500">
                            No invoices yet
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-3">Payment History</h3>
                <div className="bg-gray-50 rounded-lg overflow-hidden">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-gray-200">
                        <th className="px-4 py-2 text-left text-sm font-semibold text-gray-800">Date</th>
                        <th className="px-4 py-2 text-left text-sm font-semibold text-gray-800">Amount</th>
                        <th className="px-4 py-2 text-left text-sm font-semibold text-gray-800">Payment Method</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paymentHistory.length > 0 ? (
                        paymentHistory.map((payment, idx) => (
                          <tr key={idx} className="border-t border-gray-200">
                            <td className="px-4 py-2 text-sm text-gray-700">{payment.date}</td>
                            <td className="px-4 py-2 text-sm font-semibold text-green-600">
                              AED {payment.amount.toLocaleString()}
                            </td>
                            <td className="px-4 py-2 text-sm text-gray-600">{payment.method}</td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="3" className="px-4 py-4 text-center text-gray-500">
                            No payment history yet
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
              */}
                  </>
                );
              })()}
            </div>
          </div>
        </div>
      )}
      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && companyToDelete && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-sm"
          onClick={() => setShowDeleteConfirm(false)}
        >
          <div 
            className="bg-white rounded-xl shadow-lg max-w-md w-full my-8 max-h-[90vh] overflow-y-auto" 
            style={{ backgroundColor: theme.colors.background }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-800">Delete Company</h2>
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="p-2 hover:bg-gray-200 rounded-lg transition"
              >
                <MdClose className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <p className="text-gray-700">Are you sure you want to delete <span className="font-semibold">{companyToDelete.name}</span>? This action cannot be undone.</p>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={confirmDeleteCompany}
                  disabled={isDeletingCompany}
                  className="flex-1 text-white px-6 py-2 rounded-lg hover:opacity-90 transition font-medium disabled:opacity-60 disabled:cursor-not-allowed"
                  style={{ backgroundColor: theme.colors.error }}
                >
                  {isDeletingCompany ? 'Deleting...' : 'Delete'}
                </button>
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="flex-1 text-gray-700 px-6 py-2 rounded-lg border border-gray-300 hover:bg-gray-100 transition font-medium"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Company Modal */}
      {showAddModal && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-sm "
          onClick={() => setShowAddModal(false)}
        >
          <div 
            className="bg-white rounded-xl shadow-lg max-w-md w-full my-8 max-h-[90vh] overflow-y-auto" 
            style={{ backgroundColor: theme.colors.background }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-800">Add New Company</h2>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-2 hover:bg-gray-200 rounded-lg transition"
              >
                <MdClose className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Company Name *</label>
                <input
                  type="text"
                  name="name"
                  value={newCompanyForm.name}
                  onChange={handleFormChange}
                  placeholder="Enter company name"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Company Logo</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleLogoChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                />
                {newCompanyForm.logoPreview && (
                  <img
                    src={newCompanyForm.logoPreview}
                    alt="Logo preview"
                    className="mt-3 w-16 h-16 rounded-lg object-cover border border-gray-300"
                  />
                )}
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={handleSubmitCompany}
                  disabled={isAddingCompany}
                  className="flex-1 text-white px-6 py-2 rounded-lg transition font-medium disabled:opacity-60 disabled:cursor-not-allowed"
                  style={{ backgroundColor: theme.colors.primary }}
                >
                  {isAddingCompany ? 'Adding...' : 'Add Company'}
                </button>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 text-gray-700 px-6 py-2 rounded-lg border border-gray-300 hover:bg-gray-100 transition font-medium"
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
