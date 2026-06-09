import { useState, useEffect, useRef, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { FileText, User, Stethoscope, IdCard, Calendar, ChevronDown, Plus } from "lucide-react";

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

interface LastDoctor {
  doctor_name: string;
  doctor_license: string;
}

const STORAGE_KEYS = {
  DOCTORS: 'prescription_doctors',
  PATIENTS: 'prescription_patients',
  LAST: 'prescription_last'
};

export default function PrescriptionModal({
  isOpen,
  productName,
  productSchedule,
  onClose,
  onConfirm,
}: PrescriptionModalProps) {
  const [prescriptionNumber, setPrescriptionNumber] = useState('');
  const [doctorName, setDoctorName] = useState('');
  const [doctorLicense, setDoctorLicense] = useState('');
  const [patientName, setPatientName] = useState('');
  const [patientAge, setPatientAge] = useState('');
  const [patientGender, setPatientGender] = useState('');

  const [savedDoctors, setSavedDoctors] = useState<Doctor[]>([]);
  const [savedPatients, setSavedPatients] = useState<Patient[]>([]);

  const [showDoctorDropdown, setShowDoctorDropdown] = useState(false);
  const [showPatientDropdown, setShowPatientDropdown] = useState(false);
  const [showGenderDropdown, setShowGenderDropdown] = useState(false);
  const [doctorFilter, setDoctorFilter] = useState('');
  const [patientFilter, setPatientFilter] = useState('');

  const doctorInputRef = useRef<HTMLInputElement>(null);
  const patientInputRef = useRef<HTMLInputElement>(null);
  const doctorDropdownRef = useRef<HTMLDivElement>(null);
  const patientDropdownRef = useRef<HTMLDivElement>(null);
  const genderDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const storedDoctors = localStorage.getItem(STORAGE_KEYS.DOCTORS);
    if (storedDoctors) setSavedDoctors(JSON.parse(storedDoctors));
    const storedPatients = localStorage.getItem(STORAGE_KEYS.PATIENTS);
    if (storedPatients) setSavedPatients(JSON.parse(storedPatients));

    const storedLast = localStorage.getItem(STORAGE_KEYS.LAST);
    if (storedLast) {
      const last: LastDoctor = JSON.parse(storedLast);
      setDoctorName(last.doctor_name || '');
      setDoctorLicense(last.doctor_license || '');
    }
  }, []);

  const saveDoctors = useCallback((doctors: Doctor[]) => {
    localStorage.setItem(STORAGE_KEYS.DOCTORS, JSON.stringify(doctors));
    setSavedDoctors(doctors);
  }, []);

  const savePatients = useCallback((patients: Patient[]) => {
    localStorage.setItem(STORAGE_KEYS.PATIENTS, JSON.stringify(patients));
    setSavedPatients(patients);
  }, []);

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

  const generatePrescriptionNumber = () => {
    const today = new Date();
    const rx = `RX-${today.getFullYear()}${(today.getMonth() + 1).toString().padStart(2, '0')}${today.getDate().toString().padStart(2, '0')}-${Math.floor(Math.random() * 10000)}`;
    setPrescriptionNumber(rx);
  };

  useEffect(() => {
    if (isOpen && !prescriptionNumber) generatePrescriptionNumber();
  }, [isOpen]);

  const handleSelectDoctor = (doctor: Doctor) => {
    setDoctorName(doctor.name);
    setDoctorLicense(doctor.license || '');
    setDoctorFilter('');
    setShowDoctorDropdown(false);
    const updated = savedDoctors.map(d =>
      d.name === doctor.name ? { ...d, lastUsed: Date.now() } : d
    );
    saveDoctors(updated);
  };

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

    saveDoctor(doctorName.trim(), doctorLicense.trim());
    savePatient(patientName.trim(), patientAge, patientGender);

    const lastDoctor: LastDoctor = {
      doctor_name: doctorName.trim(),
      doctor_license: doctorLicense.trim(),
    };
    localStorage.setItem(STORAGE_KEYS.LAST, JSON.stringify(lastDoctor));

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

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) handleClose(); }}>
      <DialogContent className="bg-white border border-gray-200 sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2 mb-1">
            <FileText className="h-5 w-5 text-green-600" />
            <DialogTitle className="text-gray-900 text-lg">Prescription Required</DialogTitle>
          </div>
          <p className="text-sm text-gray-500">{productName}</p>
          <div className="mt-1">
            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800 border border-yellow-300">
              Schedule {productSchedule}
            </span>
          </div>
        </DialogHeader>

        <div className="space-y-4">
          {/* Prescription Number */}
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1.5">
              Prescription Number <span className="text-red-500">*</span>
            </label>
            <div className="flex gap-2">
              <Input
                value={prescriptionNumber}
                onChange={(e) => setPrescriptionNumber(e.target.value)}
                className="flex-1 bg-white border-gray-300 text-gray-900"
                placeholder="RX-XXXXXXXXXX"
              />
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={generatePrescriptionNumber}
                className="border-gray-300 text-gray-500 shrink-0"
                title="Generate new number"
              >
                <FileText className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Doctor's Name */}
          <div className="relative" ref={doctorDropdownRef}>
            <label className="block text-sm font-medium text-gray-600 mb-1.5">
              <Stethoscope className="inline h-3.5 w-3.5 mr-1 text-green-600" />
              Doctor's Name <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Input
                ref={doctorInputRef}
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
                className="w-full bg-white border-gray-300 text-gray-900 pr-10"
                placeholder="Type or select doctor"
                autoComplete="off"
              />
              <button
                type="button"
                onClick={() => setShowDoctorDropdown(!showDoctorDropdown)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <ChevronDown className="h-4 w-4" />
              </button>
            </div>
            {showDoctorDropdown && (filteredDoctors.length > 0 || doctorName.trim()) && (
              <div className="absolute z-20 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                {filteredDoctors.map((doc) => (
                  <div
                    key={doc.name}
                    className="px-3 py-2 hover:bg-gray-100 cursor-pointer text-sm text-gray-900"
                    onClick={() => handleSelectDoctor(doc)}
                  >
                    <div className="font-medium">{doc.name}</div>
                    {doc.license && <div className="text-xs text-gray-500">License: {doc.license}</div>}
                  </div>
                ))}
                {doctorName.trim() && !filteredDoctors.some(d => d.name.toLowerCase() === doctorName.toLowerCase()) && (
                  <div
                    className="px-3 py-2 border-t border-gray-200 text-sm text-green-600 hover:bg-gray-100 cursor-pointer flex items-center gap-2"
                    onClick={addNewDoctor}
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Add "{doctorName.trim()}"
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Doctor License */}
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1.5">
              <IdCard className="inline h-3.5 w-3.5 mr-1 text-green-600" />
              Doctor's License Number
            </label>
            <Input
              value={doctorLicense}
              onChange={(e) => setDoctorLicense(e.target.value)}
              className="w-full bg-white border-gray-300 text-gray-900"
              placeholder="Medical Council Registration (Optional)"
            />
          </div>

          {/* Patient Name */}
          <div className="relative" ref={patientDropdownRef}>
            <label className="block text-sm font-medium text-gray-600 mb-1.5">
              <User className="inline h-3.5 w-3.5 mr-1 text-green-600" />
              Patient Name <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Input
                ref={patientInputRef}
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
                className="w-full bg-white border-gray-300 text-gray-900 pr-10"
                placeholder="Type or select patient"
                autoComplete="off"
              />
              <button
                type="button"
                onClick={() => setShowPatientDropdown(!showPatientDropdown)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <ChevronDown className="h-4 w-4" />
              </button>
            </div>
            {showPatientDropdown && (filteredPatients.length > 0 || patientName.trim()) && (
              <div className="absolute z-20 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                {filteredPatients.map((pat) => (
                  <div
                    key={pat.name}
                    className="px-3 py-2 hover:bg-gray-100 cursor-pointer text-sm text-gray-900"
                    onClick={() => handleSelectPatient(pat)}
                  >
                    <div className="font-medium">{pat.name}</div>
                    <div className="text-xs text-gray-500">Age: {pat.age || '?'} | Gender: {pat.gender || '?'}</div>
                  </div>
                ))}
                {patientName.trim() && !filteredPatients.some(p => p.name.toLowerCase() === patientName.toLowerCase()) && (
                  <div
                    className="px-3 py-2 border-t border-gray-200 text-sm text-green-600 hover:bg-gray-100 cursor-pointer flex items-center gap-2"
                    onClick={addNewPatient}
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Add "{patientName.trim()}"
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Age & Gender */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1.5">
                <Calendar className="inline h-3.5 w-3.5 mr-1 text-green-600" />
                Patient Age
              </label>
              <Input
                type="number"
                value={patientAge}
                onChange={(e) => setPatientAge(e.target.value)}
                className="w-full bg-white border-gray-300 text-gray-900"
                placeholder="Years"
                min="0"
                max="150"
              />
            </div>
            <div ref={genderDropdownRef} className="relative">
              <label className="block text-sm font-medium text-gray-600 mb-1.5">
                Gender
              </label>
              <Popover open={showGenderDropdown} onOpenChange={setShowGenderDropdown}>
                <PopoverTrigger asChild>
                  <div className="relative cursor-pointer">
                    <Input
                      value={patientGender === 'M' ? 'Male' : patientGender === 'F' ? 'Female' : patientGender === 'O' ? 'Other' : ''}
                      onChange={() => {}}
                      className="w-full bg-white border-gray-300 text-gray-900 pr-10 cursor-pointer"
                      placeholder="Select"
                      readOnly
                    />
                    <button
                      type="button"
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      <ChevronDown className="h-4 w-4" />
                    </button>
                  </div>
                </PopoverTrigger>
                <PopoverContent className="w-full min-w-[180px] p-0 bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden" align="start">
                  {['Male', 'Female', 'Other'].map((g) => (
                    <div
                      key={g}
                      className="px-3 py-2 hover:bg-gray-100 cursor-pointer text-sm text-gray-900"
                      onClick={() => {
                        setPatientGender(g === 'Male' ? 'M' : g === 'Female' ? 'F' : 'O');
                        setShowGenderDropdown(false);
                      }}
                    >
                      {g}
                    </div>
                  ))}
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {/* Buttons */}
          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              className="flex-1 border-gray-300 text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleSubmit}
              className="flex-1 bg-green-600 hover:bg-green-700 text-white"
            >
              Confirm & Continue
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}