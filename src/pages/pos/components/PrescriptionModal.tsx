// src/pages/pos/components/PrescriptionModal.tsx
import { useState, useEffect, useRef, useCallback } from 'react';
import { IonIcon } from '@ionic/react';
import {
  closeOutline,
  documentTextOutline,
  personOutline,
  medicalOutline,
  idCardOutline,
  calendarOutline,
  transgenderOutline,
  refreshOutline,
  warningOutline,
  shieldCheckmarkOutline,
  addCircleOutline,
  trashOutline,
  chevronDownOutline
} from 'ionicons/icons';

interface Doctor {
  name: string;
  license: string;
  lastUsed: number;
}

interface Patient {
  name: string;
  age: string;
  gender: string;
  lastUsed: number;
}

interface PrescriptionModalProps {
  isOpen: boolean;
  productName: string;
  productSchedule: string;
  onClose: () => void;
  onConfirm: (prescriptionData: {
    prescription_number: string;
    doctor_name: string;
    doctor_license?: string;
    patient_name: string;
    patient_age?: number;
    patient_gender?: string;
  }) => void;
}

const STORAGE_KEYS = {
  DOCTORS: 'prescription_doctors',
  PATIENTS: 'prescription_patients'
};

export default function PrescriptionModal({
  isOpen,
  productName,
  productSchedule,
  onClose,
  onConfirm,
}: PrescriptionModalProps) {
  // Form fields
  const [prescriptionNumber, setPrescriptionNumber] = useState('');
  const [doctorName, setDoctorName] = useState('');
  const [doctorLicense, setDoctorLicense] = useState('');
  const [patientName, setPatientName] = useState('');
  const [patientAge, setPatientAge] = useState('');
  const [patientGender, setPatientGender] = useState('');

  // Saved data
  const [savedDoctors, setSavedDoctors] = useState<Doctor[]>([]);
  const [savedPatients, setSavedPatients] = useState<Patient[]>([]);

  // Dropdown visibility & filtered lists
  const [showDoctorDropdown, setShowDoctorDropdown] = useState(false);
  const [showPatientDropdown, setShowPatientDropdown] = useState(false);
  const [doctorFilter, setDoctorFilter] = useState('');
  const [patientFilter, setPatientFilter] = useState('');

  // Refs for dropdowns and input fields
  const doctorInputRef = useRef<HTMLInputElement>(null);
  const patientInputRef = useRef<HTMLInputElement>(null);
  const doctorDropdownRef = useRef<HTMLDivElement>(null);
  const patientDropdownRef = useRef<HTMLDivElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  // Load saved data from localStorage
  useEffect(() => {
    const storedDoctors = localStorage.getItem(STORAGE_KEYS.DOCTORS);
    if (storedDoctors) setSavedDoctors(JSON.parse(storedDoctors));
    const storedPatients = localStorage.getItem(STORAGE_KEYS.PATIENTS);
    if (storedPatients) setSavedPatients(JSON.parse(storedPatients));
  }, []);

  // Save helpers
  const saveDoctors = useCallback((doctors: Doctor[]) => {
    localStorage.setItem(STORAGE_KEYS.DOCTORS, JSON.stringify(doctors));
    setSavedDoctors(doctors);
  }, []);

  const savePatients = useCallback((patients: Patient[]) => {
    localStorage.setItem(STORAGE_KEYS.PATIENTS, JSON.stringify(patients));
    setSavedPatients(patients);
  }, []);

  // Filter doctors based on current input
  const getFilteredDoctors = () => {
    const searchTerm = doctorFilter.toLowerCase();
    if (!searchTerm) return savedDoctors.sort((a, b) => b.lastUsed - a.lastUsed).slice(0, 6);
    return savedDoctors
      .filter(d => d.name.toLowerCase().includes(searchTerm))
      .sort((a, b) => b.lastUsed - a.lastUsed)
      .slice(0, 6);
  };

  const getFilteredPatients = () => {
    const searchTerm = patientFilter.toLowerCase();
    if (!searchTerm) return savedPatients.sort((a, b) => b.lastUsed - a.lastUsed).slice(0, 6);
    return savedPatients
      .filter(p => p.name.toLowerCase().includes(searchTerm))
      .sort((a, b) => b.lastUsed - a.lastUsed)
      .slice(0, 6);
  };

  const filteredDoctors = getFilteredDoctors();
  const filteredPatients = getFilteredPatients();

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (doctorDropdownRef.current && !doctorDropdownRef.current.contains(event.target as Node) && doctorInputRef.current !== event.target) {
        setShowDoctorDropdown(false);
      }
      if (patientDropdownRef.current && !patientDropdownRef.current.contains(event.target as Node) && patientInputRef.current !== event.target) {
        setShowPatientDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Generate prescription number
  const generatePrescriptionNumber = () => {
    const today = new Date();
    const rx = `RX-${today.getFullYear()}${(today.getMonth() + 1).toString().padStart(2, '0')}${today.getDate().toString().padStart(2, '0')}-${Math.floor(Math.random() * 10000)}`;
    setPrescriptionNumber(rx);
  };

  useEffect(() => {
    if (isOpen && !prescriptionNumber) generatePrescriptionNumber();
  }, [isOpen]);

  // Handle selecting a doctor from dropdown
  const handleSelectDoctor = (doctor: Doctor) => {
    setDoctorName(doctor.name);
    setDoctorLicense(doctor.license || '');
    setDoctorFilter('');
    setShowDoctorDropdown(false);
    // Update last used
    const updated = savedDoctors.map(d =>
      d.name === doctor.name ? { ...d, lastUsed: Date.now() } : d
    );
    saveDoctors(updated);
  };

  // Handle selecting a patient from dropdown
  const handleSelectPatient = (patient: Patient) => {
    setPatientName(patient.name);
    setPatientAge(patient.age);
    setPatientGender(patient.gender);
    setPatientFilter('');
    setShowPatientDropdown(false);
    const updated = savedPatients.map(p =>
      p.name === patient.name ? { ...p, lastUsed: Date.now() } : p
    );
    savePatients(updated);
  };

  // Add new doctor (from input value)
  const addNewDoctor = () => {
    const name = doctorName.trim();
    if (!name) return;
    const newDoctor: Doctor = { name, license: doctorLicense.trim(), lastUsed: Date.now() };
    const existingIndex = savedDoctors.findIndex(d => d.name.toLowerCase() === name.toLowerCase());
    let newList;
    if (existingIndex !== -1) {
      newList = [...savedDoctors];
      newList[existingIndex] = { ...newList[existingIndex], license: doctorLicense.trim(), lastUsed: Date.now() };
    } else {
      newList = [newDoctor, ...savedDoctors].slice(0, 50);
    }
    saveDoctors(newList);
    setShowDoctorDropdown(false);
    setDoctorFilter('');
  };

  // Add new patient
  const addNewPatient = () => {
    const name = patientName.trim();
    if (!name) return;
    const newPatient: Patient = { name, age: patientAge, gender: patientGender, lastUsed: Date.now() };
    const existingIndex = savedPatients.findIndex(p => p.name.toLowerCase() === name.toLowerCase());
    let newList;
    if (existingIndex !== -1) {
      newList = [...savedPatients];
      newList[existingIndex] = { ...newList[existingIndex], age: patientAge, gender: patientGender, lastUsed: Date.now() };
    } else {
      newList = [newPatient, ...savedPatients].slice(0, 50);
    }
    savePatients(newList);
    setShowPatientDropdown(false);
    setPatientFilter('');
  };

  const clearSavedData = () => {
    if (confirm('Clear all saved doctors and patients? This cannot be undone.')) {
      localStorage.removeItem(STORAGE_KEYS.DOCTORS);
      localStorage.removeItem(STORAGE_KEYS.PATIENTS);
      setSavedDoctors([]);
      setSavedPatients([]);
    }
  };

  const resetForm = () => {
    setPrescriptionNumber('');
    setDoctorName('');
    setDoctorLicense('');
    setPatientName('');
    setPatientAge('');
    setPatientGender('');
    setDoctorFilter('');
    setPatientFilter('');
    setShowDoctorDropdown(false);
    setShowPatientDropdown(false);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleSubmit = () => {
    if (!prescriptionNumber) return alert('Please enter a prescription number');
    if (!doctorName.trim()) return alert('Please enter doctor name');
    if (!patientName.trim()) return alert('Please enter patient name');

    // Save if new or update lastUsed
    saveDoctor(doctorName.trim(), doctorLicense.trim());
    savePatient(patientName.trim(), patientAge, patientGender);

    onConfirm({
      prescription_number: prescriptionNumber,
      doctor_name: doctorName.trim(),
      doctor_license: doctorLicense.trim() || undefined,
      patient_name: patientName.trim(),
      patient_age: patientAge ? parseInt(patientAge) : undefined,
      patient_gender: patientGender || undefined,
    });
  };

  const saveDoctor = (name: string, license: string) => {
    if (!name) return;
    const existing = savedDoctors.find(d => d.name.toLowerCase() === name.toLowerCase());
    let newList;
    if (existing) {
      newList = savedDoctors.map(d =>
        d.name === existing.name ? { ...d, license, lastUsed: Date.now() } : d
      );
    } else {
      newList = [{ name, license, lastUsed: Date.now() }, ...savedDoctors].slice(0, 50);
    }
    saveDoctors(newList);
  };

  const savePatient = (name: string, age: string, gender: string) => {
    if (!name) return;
    const existing = savedPatients.find(p => p.name.toLowerCase() === name.toLowerCase());
    let newList;
    if (existing) {
      newList = savedPatients.map(p =>
        p.name === existing.name ? { ...p, age, gender, lastUsed: Date.now() } : p
      );
    } else {
      newList = [{ name, age, gender, lastUsed: Date.now() }, ...savedPatients].slice(0, 50);
    }
    savePatients(newList);
  };

  const getScheduleBadgeStyle = (schedule: string) => {
    const s = schedule.toLowerCase();
    if (s.includes('h') || s === 'h') return 'bg-red-100 text-red-800 border-red-200';
    if (s.includes('x')) return 'bg-orange-100 text-orange-800 border-orange-200';
    return 'bg-yellow-100 text-yellow-800 border-yellow-200';
  };

  if (!isOpen) return null;

  return (
    <>
      <style>{`
        @keyframes modalSlideIn { from { opacity: 0; transform: scale(0.95) translateY(-10px); } to { opacity: 1; transform: scale(1) translateY(0); } }
        @keyframes backdropFadeIn { from { opacity: 0; } to { opacity: 1; } }
        .animate-modal-in { animation: modalSlideIn 0.25s ease-out forwards; }
        .animate-backdrop-in { animation: backdropFadeIn 0.2s ease-out forwards; }
        .dropdown-item { transition: background 0.1s ease; }
      `}</style>

      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-backdrop-in" onClick={handleClose}>
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto animate-modal-in" onClick={(e) => e.stopPropagation()} ref={modalRef}>
          {/* Header */}
          <div className="bg-gradient-to-r from-orange-600 to-red-600 p-5 text-white rounded-t-2xl sticky top-0 z-10">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <div className="bg-white/20 p-1.5 rounded-full">
                    <IonIcon icon={shieldCheckmarkOutline} className="text-xl w-5 h-5" />
                  </div>
                  <h2 className="text-xl font-bold">Prescription Required</h2>
                </div>
                <p className="text-sm text-orange-100 line-clamp-1">{productName}</p>
                <div className="mt-2">
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${getScheduleBadgeStyle(productSchedule)}`}>
                    <IonIcon icon={warningOutline} className="text-xs w-3 h-3" />
                    Schedule {productSchedule}
                  </span>
                </div>
              </div>
              <div className="flex gap-1">
                <button onClick={clearSavedData} className="p-1.5 hover:bg-white/20 rounded-full transition hover:scale-110" title="Clear saved doctors/patients">
                  <IonIcon icon={trashOutline} className="text-lg w-5 h-5" />
                </button>
                <button onClick={handleClose} className="p-1.5 hover:bg-white/20 rounded-full transition hover:scale-110">
                  <IonIcon icon={closeOutline} className="text-2xl w-6 h-6" />
                </button>
              </div>
            </div>
          </div>

          <div className="p-6 space-y-5">
            {/* Warning Banner */}
            <div className="bg-amber-50 border-l-4 border-amber-500 rounded-lg p-3 flex gap-2">
              <IonIcon icon={warningOutline} className="text-amber-600 text-lg w-5 h-5 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-amber-800">
                This medicine requires a valid prescription. Doctors and patients are saved for future use.
              </p>
            </div>

            {/* Prescription Number */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                <IonIcon icon={documentTextOutline} className="inline-block w-4 h-4 mr-1.5 text-orange-500 align-middle" />
                Prescription Number <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <IonIcon icon={documentTextOutline} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" />
                <input
                  type="text"
                  className="w-full border border-gray-200 rounded-xl p-2.5 pl-10 pr-12 focus:outline-none focus:ring-2 focus:ring-orange-500"
                  value={prescriptionNumber}
                  onChange={(e) => setPrescriptionNumber(e.target.value)}
                />
                <button onClick={generatePrescriptionNumber} className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-orange-600">
                  <IonIcon icon={refreshOutline} className="text-lg w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Doctor's Name with dropdown combobox */}
            <div className="relative" ref={doctorDropdownRef}>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                <IonIcon icon={medicalOutline} className="inline-block w-4 h-4 mr-1.5 text-orange-500 align-middle" />
                Doctor's Name <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <IonIcon icon={personOutline} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" />
                <input
                  ref={doctorInputRef}
                  type="text"
                  className="w-full border border-gray-200 rounded-xl p-2.5 pl-10 pr-10 focus:outline-none focus:ring-2 focus:ring-orange-500"
                  placeholder="Type or select doctor"
                  value={doctorName}
                  onChange={(e) => {
                    setDoctorName(e.target.value);
                    setDoctorFilter(e.target.value);
                    setShowDoctorDropdown(true);
                  }}
                  onFocus={() => {
                    setDoctorFilter(doctorName);
                    setShowDoctorDropdown(true);
                  }}
                  autoComplete="off"
                />
                <button
                  type="button"
                  onClick={() => setShowDoctorDropdown(!showDoctorDropdown)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <IonIcon icon={chevronDownOutline} className="text-lg w-5 h-5" />
                </button>
              </div>

              {showDoctorDropdown && (filteredDoctors.length > 0 || doctorName.trim()) && (
                <div className="absolute z-20 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg max-h-60 overflow-y-auto">
                  {filteredDoctors.map((doc) => (
                    <div
                      key={doc.name}
                      className="px-3 py-2 hover:bg-orange-50 cursor-pointer text-sm dropdown-item"
                      onClick={() => handleSelectDoctor(doc)}
                    >
                      <div className="font-medium">{doc.name}</div>
                      {doc.license && <div className="text-xs text-gray-500">License: {doc.license}</div>}
                    </div>
                  ))}
                  {doctorName.trim() && !filteredDoctors.some(d => d.name.toLowerCase() === doctorName.toLowerCase()) && (
                    <div
                      className="px-3 py-2 border-t border-gray-100 text-sm text-orange-600 hover:bg-orange-50 cursor-pointer flex items-center gap-2"
                      onClick={addNewDoctor}
                    >
                      <IonIcon icon={addCircleOutline} className="text-base" />
                      Add "{doctorName.trim()}"
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Doctor License */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                <IonIcon icon={idCardOutline} className="inline-block w-4 h-4 mr-1.5 text-orange-500 align-middle" />
                Doctor's License Number
              </label>
              <div className="relative">
                <IonIcon icon={idCardOutline} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" />
                <input
                  type="text"
                  className="w-full border border-gray-200 rounded-xl p-2.5 pl-10 focus:outline-none focus:ring-2 focus:ring-orange-500"
                  placeholder="Medical Council Registration (Optional)"
                  value={doctorLicense}
                  onChange={(e) => setDoctorLicense(e.target.value)}
                />
              </div>
            </div>

            {/* Patient Name with dropdown combobox */}
            <div className="relative" ref={patientDropdownRef}>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                <IonIcon icon={personOutline} className="inline-block w-4 h-4 mr-1.5 text-orange-500 align-middle" />
                Patient Name <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <IonIcon icon={personOutline} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" />
                <input
                  ref={patientInputRef}
                  type="text"
                  className="w-full border border-gray-200 rounded-xl p-2.5 pl-10 pr-10 focus:outline-none focus:ring-2 focus:ring-orange-500"
                  placeholder="Type or select patient"
                  value={patientName}
                  onChange={(e) => {
                    setPatientName(e.target.value);
                    setPatientFilter(e.target.value);
                    setShowPatientDropdown(true);
                  }}
                  onFocus={() => {
                    setPatientFilter(patientName);
                    setShowPatientDropdown(true);
                  }}
                  autoComplete="off"
                />
                <button
                  type="button"
                  onClick={() => setShowPatientDropdown(!showPatientDropdown)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <IonIcon icon={chevronDownOutline} className="text-lg w-5 h-5" />
                </button>
              </div>

              {showPatientDropdown && (filteredPatients.length > 0 || patientName.trim()) && (
                <div className="absolute z-20 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg max-h-60 overflow-y-auto">
                  {filteredPatients.map((pat) => (
                    <div
                      key={pat.name}
                      className="px-3 py-2 hover:bg-orange-50 cursor-pointer text-sm dropdown-item"
                      onClick={() => handleSelectPatient(pat)}
                    >
                      <div className="font-medium">{pat.name}</div>
                      <div className="text-xs text-gray-500">Age: {pat.age || '?'} | Gender: {pat.gender || '?'}</div>
                    </div>
                  ))}
                  {patientName.trim() && !filteredPatients.some(p => p.name.toLowerCase() === patientName.toLowerCase()) && (
                    <div
                      className="px-3 py-2 border-t border-gray-100 text-sm text-orange-600 hover:bg-orange-50 cursor-pointer flex items-center gap-2"
                      onClick={addNewPatient}
                    >
                      <IonIcon icon={addCircleOutline} className="text-base" />
                      Add "{patientName.trim()}"
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Age & Gender */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  <IonIcon icon={calendarOutline} className="inline-block w-4 h-4 mr-1.5 text-orange-500 align-middle" />
                  Patient Age
                </label>
                <div className="relative">
                  <IonIcon icon={calendarOutline} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" />
                  <input
                    type="number"
                    className="w-full border border-gray-200 rounded-xl p-2.5 pl-10 focus:outline-none focus:ring-2 focus:ring-orange-500"
                    placeholder="Years"
                    value={patientAge}
                    onChange={(e) => setPatientAge(e.target.value)}
                    min="0"
                    max="150"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  <IonIcon icon={transgenderOutline} className="inline-block w-4 h-4 mr-1.5 text-orange-500 align-middle" />
                  Patient Gender
                </label>
                <div className="relative">
                  <IonIcon icon={transgenderOutline} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" />
                  <select
                    className="w-full border border-gray-200 rounded-xl p-2.5 pl-10 appearance-none bg-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                    value={patientGender}
                    onChange={(e) => setPatientGender(e.target.value)}
                  >
                    <option value="">Select gender</option>
                    <option value="M">Male</option>
                    <option value="F">Female</option>
                    <option value="O">Other</option>
                  </select>
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>

            {/* Buttons */}
            <div className="flex gap-3 pt-4">
              <button onClick={handleClose} className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-gray-700 font-medium hover:bg-gray-50 transition">
                Cancel
              </button>
              <button onClick={handleSubmit} className="flex-1 bg-gradient-to-r from-orange-600 to-red-600 text-white px-4 py-2.5 rounded-xl font-medium shadow-md hover:shadow-lg transition hover:scale-[1.02] active:scale-[0.98]">
                Confirm & Continue
              </button>
            </div>

            <p className="text-center text-xs text-gray-400">
              Doctors and patients are saved locally for faster future entries.
            </p>
          </div>
        </div>
      </div>
    </>
  );
}