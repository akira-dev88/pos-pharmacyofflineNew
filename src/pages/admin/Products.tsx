import { useEffect, useState, useRef, useCallback, useMemo } from "react";
import { useTranslation } from "react-i18next";
import {
  getProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  getProductUnits,
  createProductUnit,
  deleteProductUnit,
  getProductBatches,
} from "../../renderer/services/productApi";
import { IonIcon } from "@ionic/react";
import {
  addOutline,
  createOutline,
  trashOutline,
  searchOutline,
  closeOutline,
  cubeOutline,
  checkmarkCircleOutline,
  warningOutline,
  pricetagOutline,
  addCircleOutline,
  chevronDownOutline,
  chevronForwardOutline,
  medkitOutline,
  flaskOutline,
  businessOutline,
  locationOutline,
  shieldCheckmarkOutline,
  layersOutline,
  tabletPortraitOutline,
  beakerOutline,
  syncOutline,
  cartOutline,
  pulseOutline,
  leafOutline,
} from "ionicons/icons";
import PrintLabelsModal from "../../components/PrintLabelsModal";
import { createPortal } from "react-dom";
import {
  getCategories,
  getCategoryAttributes,
  createCategory,
} from "../../renderer/services/categoryApi";

// ─── Types ────────────────────────────────────────────────────────────────
interface Product {
  product_uuid: string;
  name: string;
  price: number;
  stock: number;
  unit: string;
  sku?: string;
  barcode?: string;
  gst_percent?: number;
  hsn_code?: string;
  manufacturer?: string;
  composition?: string;
  schedule_type?: string;
  prescription_required?: number;
  medicine_type?: string;
  rack_location?: string;
  category_uuid?: string;
  image?: string;
}

interface PackageLevel {
  name: string;
  contains: number;
  unit: string;
  price?: number;
  purchase_price?: number;
  barcode?: string;
}

interface WizardData {
  productType: string;
  name: string;
  composition: string;
  manufacturer: string;
  barcode: string;
  hsnCode: string;
  gst: number;
  rackLocation: string;
  strength: string;
  dosageForm: string;
  prescriptionRequired: boolean;
  storageCondition: string;
  flavor: string;
  bottleSize: string;
  sugarFree: boolean;
  baseUnit: string;
  packages: PackageLevel[];
  category_uuid: string;
  schedule_type: string;
  medicine_type: string;
}

interface ProductType {
  id: string;
  label: string;
  icon: string;
  description: string;
  medicineDetails: string[];
  defaultPackaging: {
    baseUnit: string;
    templates: { name: string; contains: number; unit: string }[];
  };
  defaults: {
    gst: number;
    storage?: string;
    prescriptionRequired?: boolean;
  };
}

// ─── Constants ────────────────────────────────────────────────────────────
const PHARMACY_UNITS = [
  "Strip", "Tablet", "Capsule", "Box", "Bottle",
  "Vial", "Sachet", "Tube", "Injection", "Syrup",
  "Cream", "Ointment", "Drops", "Inhaler", "Patch",
  "piece", "pack", "kg", "g", "litre", "ml",
];

const GST_OPTIONS = [
  { value: "0", label: "0% (Tax Exempt)" },
  { value: "5", label: "5% (Low Rate)" },
  { value: "12", label: "12% (Standard)" },
  { value: "18", label: "18% (Standard)" },
  { value: "28", label: "28% (High Rate)" },
];

const SCHEDULE_TYPES = [
  { value: "NONE", label: "None (OTC)" },
  { value: "H", label: "Schedule H" },
  { value: "H1", label: "Schedule H1" },
  { value: "X", label: "Schedule X" },
  { value: "G", label: "Schedule G" },
];

const MEDICINE_TYPES = [
  "Tablet", "Capsule", "Syrup", "Injection", "Drops",
  "Cream", "Ointment", "Gel", "Inhaler", "Patch",
  "Powder", "Granules", "Suppository", "Lozenge",
];

const EMPTY_FORM = {
  name: "",
  price: "",
  purchase_price: "",
  sku: "",
  barcode: "",
  gst_percent: "0",
  hsn_code: "",
  unit: "Strip",
  image: "",
  category_uuid: "",
  manufacturer: "",
  composition: "",
  schedule_type: "NONE",
  prescription_required: false,
  medicine_type: "Tablet",
  rack_location: "",
  product_type: "medicine",
};

const PRODUCT_TYPES: ProductType[] = [
  {
    id: "tablet",
    label: "Tablet",
    icon: "tablet-portrait",
    description: "Solid oral medicine",
    medicineDetails: ["strength", "dosage_form", "prescription_required", "storage_condition"],
    defaultPackaging: {
      baseUnit: "Tablet",
      templates: [
        { name: "Strip", contains: 15, unit: "Tablet" },
        { name: "Box", contains: 20, unit: "Strip" },
      ],
    },
    defaults: { gst: 12, storage: "Room Temperature", prescriptionRequired: false },
  },
  {
    id: "syrup",
    label: "Syrup",
    icon: "beaker",
    description: "Liquid oral medicine",
    medicineDetails: ["flavor", "bottle_size", "storage_condition", "sugar_free"],
    defaultPackaging: { baseUnit: "Bottle", templates: [] },
    defaults: { gst: 12, storage: "Room Temperature" },
  },
  {
    id: "injection",
    label: "Injection",
    icon: "sync",
    description: "Injectable medicine",
    medicineDetails: ["strength", "storage_condition", "prescription_required"],
    defaultPackaging: { baseUnit: "Vial", templates: [{ name: "Ampoule", contains: 1, unit: "Vial" }] },
    defaults: { gst: 12, prescriptionRequired: true },
  },
  {
    id: "fmcg",
    label: "FMCG",
    icon: "cart",
    description: "Fast-moving consumer goods",
    medicineDetails: [],
    defaultPackaging: { baseUnit: "Piece", templates: [] },
    defaults: { gst: 18 },
  },
  {
    id: "device",
    label: "Device",
    icon: "pulse",
    description: "Medical device",
    medicineDetails: [],
    defaultPackaging: { baseUnit: "Unit", templates: [] },
    defaults: { gst: 12 },
  },
  {
    id: "ayurvedic",
    label: "Ayurvedic",
    icon: "leaf",
    description: "Herbal/Ayurvedic",
    medicineDetails: ["dosage_form", "storage_condition"],
    defaultPackaging: { baseUnit: "Bottle", templates: [] },
    defaults: { gst: 12 },
  },
];

const defaultWizardData: WizardData = {
  productType: "tablet",
  name: "",
  composition: "",
  manufacturer: "",
  barcode: "",
  hsnCode: "",
  gst: 12,
  rackLocation: "",
  strength: "",
  dosageForm: "Tablet",
  prescriptionRequired: false,
  storageCondition: "Room Temperature",
  flavor: "",
  bottleSize: "",
  sugarFree: false,
  baseUnit: "",
  packages: [],
  category_uuid: "",
  schedule_type: "NONE",
  medicine_type: "Tablet",
};

// ─── Helper Functions ─────────────────────────────────────────────────────
function buildTree(categories: any[]): any[] {
  const map: Record<string, any> = {};
  const roots: any[] = [];
  for (const cat of categories) {
    map[cat.category_uuid] = { ...cat, children: [] };
  }
  for (const cat of categories) {
    if (cat.parent_uuid && map[cat.parent_uuid]) {
      map[cat.parent_uuid].children.push(map[cat.category_uuid]);
    } else {
      roots.push(map[cat.category_uuid]);
    }
  }
  return roots;
}

const getIconForType = (iconName: string): string => {
  const icons: Record<string, string> = {
    "tablet-portrait": tabletPortraitOutline,
    beaker: beakerOutline,
    sync: syncOutline,
    cart: cartOutline,
    pulse: pulseOutline,
    leaf: leafOutline,
  };
  return icons[iconName] || cubeOutline;
};

// ─── Reusable UI Components (from reference, styled consistently) ─────────
const Badge = ({ variant = "default", children, className = "" }: any) => {
  const variants: Record<string, string> = {
    default: "bg-slate-100 text-slate-600",
    success: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200",
    warning: "bg-amber-50 text-amber-700 ring-1 ring-amber-200",
    danger: "bg-red-50 text-red-700 ring-1 ring-red-200",
    info: "bg-blue-50 text-blue-700 ring-1 ring-blue-200",
    schedule: "bg-rose-50 text-rose-700 ring-1 ring-rose-200",
    otc: "bg-slate-100 text-slate-500",
  };
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium tracking-wide ${variants[variant]} ${className}`}>
      {children}
    </span>
  );
};

const Spinner = ({ size = "sm" }: { size?: "sm" | "lg" }) => (
  <div className={`animate-spin rounded-full border-2 border-slate-200 border-t-blue-500 ${size === "sm" ? "w-4 h-4" : "w-8 h-8"}`} />
);

const Tooltip = ({ children, label }: { children: React.ReactNode; label: string }) => {
  const [show, setShow] = useState(false);
  return (
    <div className="relative inline-flex" onMouseEnter={() => setShow(true)} onMouseLeave={() => setShow(false)}>
      {children}
      {show && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 px-2 py-1 bg-slate-800 text-white text-[11px] rounded-md whitespace-nowrap z-50 pointer-events-none">
          {label}
          <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-800" />
        </div>
      )}
    </div>
  );
};

const Select = ({ value, onChange, options, placeholder }: any) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const selected = options.find((o: any) => o.value === value);
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);
  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between gap-2 px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-sm text-slate-700 hover:border-slate-300 transition-all focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
      >
        <span className={selected ? "text-slate-800" : "text-slate-400"}>{selected?.label || placeholder}</span>
        <svg className={`w-4 h-4 text-slate-400 transition-transform ${open ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {open && (
        <ul className="absolute z-50 w-full mt-1 bg-white border border-slate-200 rounded-xl shadow-lg overflow-hidden max-h-52 overflow-y-auto">
          {options.map((opt: any) => (
            <li
              key={opt.value}
              onClick={() => { onChange(opt.value); setOpen(false); }}
              className={`px-3 py-2.5 text-sm cursor-pointer transition-colors ${opt.value === value ? "bg-blue-50 text-blue-700 font-medium" : "text-slate-700 hover:bg-slate-50"}`}
            >
              {opt.label}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

const Input = ({ label, required, prefix, ...props }: any) => (
  <div>
    {label && (
      <label className="block text-xs font-medium text-slate-500 mb-1.5 uppercase tracking-wide">
        {label}{required && <span className="text-red-400 ml-0.5">*</span>}
      </label>
    )}
    <div className="relative">
      {prefix && <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm font-medium">{prefix}</span>}
      <input
        {...props}
        className={`w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-800 bg-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all hover:border-slate-300 ${prefix ? "pl-7" : ""} ${props.className || ""}`}
      />
    </div>
  </div>
);

const Toggle = ({ checked, onChange, label }: any) => (
  <div className="flex items-center gap-3">
    {label && <span className="text-sm text-slate-600">{label}</span>}
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none ${checked ? "bg-blue-500" : "bg-slate-200"}`}
    >
      <span
        className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform ${checked ? "translate-x-4.5" : "translate-x-0.5"}`}
        style={{ transform: checked ? "translateX(18px)" : "translateX(2px)" }}
      />
    </button>
  </div>
);

const StatCard = ({ label, value, delta, gradient, icon }: any) => (
  <div className={`relative overflow-hidden rounded-2xl p-5 ${gradient} group cursor-default`}>
    <div className="flex items-start justify-between">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider opacity-70 mb-1">{label}</p>
        <p className="text-3xl font-bold mt-0.5">{value}</p>
        {delta && <p className="text-xs mt-1.5 opacity-80">{delta}</p>}
      </div>
      <div className="p-2.5 rounded-xl bg-white/15 backdrop-blur-sm">{icon}</div>
    </div>
    <div className="absolute -bottom-4 -right-4 w-24 h-24 rounded-full bg-white/5 group-hover:bg-white/10 transition-colors" />
  </div>
);

const WizardSteps = ({ current, steps }: { current: number; steps: string[] }) => (
  <div className="flex items-center gap-0 mb-8">
    {steps.map((s, i) => (
      <div key={i} className="flex items-center flex-1 last:flex-none">
        <div className="flex flex-col items-center gap-1">
          <div
            className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${i < current
                ? "bg-blue-500 text-white"
                : i === current
                  ? "bg-blue-600 text-white ring-4 ring-blue-100"
                  : "bg-slate-100 text-slate-400"
              }`}
          >
            {i < current ? (
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            ) : i + 1}
          </div>
          <span className={`text-[10px] font-medium whitespace-nowrap ${i === current ? "text-blue-600" : "text-slate-400"}`}>{s}</span>
        </div>
        {i < steps.length - 1 && (
          <div className={`flex-1 h-px mx-2 mb-5 transition-colors ${i < current ? "bg-blue-400" : "bg-slate-200"}`} />
        )}
      </div>
    ))}
  </div>
);

// ─── Enhanced Category Tree Picker (restyled with better search) ──────────
const CategoryTreePicker = ({ value, onChange, categories, onCreateNew, placeholder }: any) => {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedName, setSelectedName] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);
  const tree = buildTree(categories);
  const filteredFlat = search.trim()
    ? categories.filter((c: any) => c.name.toLowerCase().includes(search.toLowerCase()))
    : null;

  useEffect(() => {
    const found = categories.find((c: any) => c.category_uuid === value);
    setSelectedName(found?.name || "");
  }, [value, categories]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
        setSearch("");
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (uuid: string, name: string) => {
    onChange(uuid);
    setSelectedName(name);
    setOpen(false);
    setSearch("");
  };

  const handleCreateNew = async () => {
    const name = search.trim();
    if (!name) return;
    const created = await onCreateNew(name);
    onChange(created.category_uuid);
    setSelectedName(created.name);
    setOpen(false);
    setSearch("");
  };

  const showCreateOption = search.trim() && !categories.some((c: any) => c.name.toLowerCase() === search.trim().toLowerCase());

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between gap-2 px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-sm text-slate-700 hover:border-slate-300 transition-all focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
      >
        <span className={selectedName ? "text-slate-800" : "text-slate-400"}>{selectedName || placeholder}</span>
        <svg className={`w-4 h-4 text-slate-400 transition-transform ${open ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {open && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-slate-200 rounded-xl shadow-lg overflow-hidden max-h-64 flex flex-col">
          <div className="p-2 border-b border-slate-100">
            <input
              autoFocus
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search categories…"
              className="w-full px-3 py-1.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-blue-400"
            />
          </div>
          <div className="overflow-y-auto flex-1">
            {filteredFlat ? (
              filteredFlat.length > 0 ? (
                filteredFlat.map((cat: any) => (
                  <div
                    key={cat.category_uuid}
                    onClick={() => handleSelect(cat.category_uuid, cat.name)}
                    className={`px-3 py-2 text-sm cursor-pointer transition-colors ${cat.category_uuid === value ? "bg-blue-50 text-blue-700 font-medium" : "text-slate-700 hover:bg-slate-50"
                      }`}
                  >
                    {cat.name}
                    {cat.parent_uuid && (
                      <span className="text-xs text-slate-400 ml-2">
                        ({categories.find((c: any) => c.category_uuid === cat.parent_uuid)?.name})
                      </span>
                    )}
                  </div>
                ))
              ) : (
                <p className="px-3 py-3 text-xs text-slate-400 text-center">No categories found</p>
              )
            ) : tree.length > 0 ? (
              tree.map((node: any) => (
                <CategoryTreeNode
                  key={node.category_uuid}
                  node={node}
                  depth={0}
                  selectedUuid={value}
                  onSelect={handleSelect}
                />
              ))
            ) : (
              <p className="px-3 py-3 text-xs text-slate-400 text-center">No categories yet</p>
            )}
          </div>
          {showCreateOption && (
            <button
              type="button"
              onClick={handleCreateNew}
              className="flex items-center gap-2 px-3 py-2 text-sm text-blue-600 hover:bg-blue-50 border-t border-slate-100 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
              Create "{search.trim()}"
            </button>
          )}
        </div>
      )}
    </div>
  );
};

const CategoryTreeNode = ({ node, depth, selectedUuid, onSelect }: any) => {
  const [expanded, setExpanded] = useState(false);
  const hasChildren = node.children?.length > 0;
  const isSelected = node.category_uuid === selectedUuid;
  return (
    <div>
      <div
        className={`flex items-center gap-1 px-3 py-2 text-sm cursor-pointer transition-colors ${isSelected ? "bg-blue-50 text-blue-700 font-medium" : "text-slate-700 hover:bg-slate-50"
          }`}
        style={{ paddingLeft: `${12 + depth * 16}px` }}
        onClick={() => onSelect(node.category_uuid, node.name)}
      >
        {hasChildren ? (
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); setExpanded(!expanded); }}
            className="text-slate-400 hover:text-slate-600"
          >
            <svg className={`w-3 h-3 transition-transform ${expanded ? "rotate-90" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </button>
        ) : (
          <span className="w-3 inline-block" />
        )}
        <span>{node.name}</span>
      </div>
      {expanded && hasChildren && (
        <div>
          {node.children.map((child: any) => (
            <CategoryTreeNode key={child.category_uuid} node={child} depth={depth + 1} selectedUuid={selectedUuid} onSelect={onSelect} />
          ))}
        </div>
      )}
    </div>
  );
};

// ─── Packaging Manager (restyled) ──────────────────────────────────────────
const PackagingManager = ({ baseUnit, packages, onAddPackage, onUpdatePackage, onRemovePackage, onBaseUnitChange }: any) => (
  <div className="space-y-4">
    <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
      <label className="block text-xs font-semibold text-blue-700 uppercase tracking-wide mb-2">Base Unit</label>
      <input
        type="text"
        className="w-full border border-blue-200 rounded-xl px-3 py-2.5 text-sm bg-white focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-500/20"
        value={baseUnit}
        onChange={(e) => onBaseUnitChange(e.target.value)}
        placeholder="e.g. Tablet, Capsule, ml"
      />
      <p className="text-xs text-blue-600/70 mt-1.5">Smallest sellable unit — all stock is tracked in this unit</p>
    </div>
    <div>
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-medium text-slate-700">Pack Sizes</span>
        <button
          type="button"
          onClick={onAddPackage}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded-lg transition-colors"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Add Pack
        </button>
      </div>
      {packages.length === 0 ? (
        <div className="border-2 border-dashed border-slate-200 rounded-xl p-8 text-center">
          <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center mx-auto mb-3">
            <svg className="w-5 h-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
          </div>
          <p className="text-sm text-slate-500 font-medium">No pack sizes defined</p>
          <p className="text-xs text-slate-400 mt-0.5">Add packaging like Strip, Box, or Bottle</p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {packages.map((pkg: PackageLevel, idx: number) => (
            <div key={idx} className="bg-slate-50 border border-slate-200 rounded-xl p-3.5">
              <div className="grid grid-cols-2 gap-3 mb-3">
                <Input label="Pack Name" value={pkg.name} onChange={(e: any) => onUpdatePackage(idx, "name", e.target.value)} placeholder="e.g. Strip, Box" />
                <Input label={`Contains (${baseUnit}s)`} type="number" min={1} value={pkg.contains} onChange={(e: any) => onUpdatePackage(idx, "contains", Number(e.target.value))} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Input label="MRP (₹)" type="number" prefix="₹" value={pkg.price || ""} onChange={(e: any) => onUpdatePackage(idx, "price", Number(e.target.value))} placeholder="0.00" />
                <Input label="PTR (₹)" type="number" prefix="₹" value={pkg.purchase_price || ""} onChange={(e: any) => onUpdatePackage(idx, "purchase_price", Number(e.target.value))} placeholder="0.00" />
              </div>
              <div className="flex justify-between items-center mt-3 pt-3 border-t border-slate-200">
                <span className="text-xs text-slate-400">1 {pkg.name || "pack"} = {pkg.contains} {baseUnit}{pkg.contains !== 1 ? "s" : ""}</span>
                <button type="button" onClick={() => onRemovePackage(idx)} className="text-xs text-red-500 hover:text-red-700 flex items-center gap-1 transition-colors">
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  Remove
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
    <div className="flex gap-2.5 bg-amber-50 border border-amber-100 rounded-xl p-3.5">
      <svg className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      <p className="text-xs text-amber-700">Stock is always tracked in base units. Pack sizes define how items are purchased or sold in bulk.</p>
    </div>
  </div>
);

// ─── Main Products Component ────────────────────────────────────────────────
export default function Products() {
  const { t } = useTranslation();
  const [products, setProducts] = useState<Product[]>([]);
  const [editing, setEditing] = useState<any | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [showPrintLabels, setShowPrintLabels] = useState(false);
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [showWizard, setShowWizard] = useState(false);
  const [wizardStep, setWizardStep] = useState(0);
  const [wizardData, setWizardData] = useState<WizardData>({ ...defaultWizardData });
  const [categories, setCategories] = useState<any[]>([]);
  const [categoryAttributes, setCategoryAttributes] = useState<any[]>([]);
  const [attributeValues, setAttributeValues] = useState<Record<string, string>>({});
  const [units, setUnits] = useState<any[]>([]);
  const [unitForm, setUnitForm] = useState({
    unit_name: "",
    conversion_factor: "1",
    barcode: "",
    price: "",
    purchase_price: "",
    is_base_unit: false,
  });
  const [showUnitForm, setShowUnitForm] = useState(false);
  const [unitsMasterList, setUnitsMasterList] = useState<string[]>(PHARMACY_UNITS);
  const [batchInfo, setBatchInfo] = useState<Record<string, any>>({});
  const [loadingBatchInfo, setLoadingBatchInfo] = useState<Record<string, boolean>>({});
  // New state from reference
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
  const [sortField, setSortField] = useState<string>("name");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [showStats, setShowStats] = useState(true);

  const wizardSteps = ["Type", "Basic Info", "Details", "Packaging", "Review"];
  const selectedProductType = PRODUCT_TYPES.find((t) => t.id === wizardData.productType);

  // Memoized & sorted products
  const filteredProducts = useMemo(() => {
    let list = products.filter(
      (p) =>
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (p.composition || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        (p.manufacturer || "").toLowerCase().includes(searchTerm.toLowerCase())
    );
    list = [...list].sort((a, b) => {
      let va: any = a[sortField as keyof Product] ?? "";
      let vb: any = b[sortField as keyof Product] ?? "";
      if (typeof va === "number") return sortDir === "asc" ? va - vb : vb - va;
      return sortDir === "asc" ? String(va).localeCompare(String(vb)) : String(vb).localeCompare(String(va));
    });
    return list;
  }, [products, searchTerm, sortField, sortDir]);

  const totalProducts = products.length;
  const lowStockProducts = products.filter((p) => p.stock <= 10 && p.stock > 0).length;
  const outOfStockProducts = products.filter((p) => p.stock === 0).length;
  const totalInventoryValue = products.reduce((sum, p) => sum + (p.price || 0) * (p.stock || 0), 0);

  // ─── Data Fetching (unchanged from original) ─────────────────────────────
  const loadProducts = async (silent = false) => {
    if (!silent) setLoading(true);
    setError(null);
    try {
      const data = await getProducts();
      setProducts(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Load products error:", err);
      setError(t("products.loadError"));
      setProducts([]);
    } finally {
      if (!silent) setLoading(false);
    }
  };

  const loadUnits = async (product_uuid: string) => {
    const data = await getProductUnits(product_uuid);
    setUnits(data);
  };

  const loadCategories = async () => {
    const data = await getCategories();
    setCategories(data);
  };

  const loadCustomUnits = () => {
    const stored = localStorage.getItem("custom_units");
    if (stored) {
      try {
        const custom = JSON.parse(stored);
        setUnitsMasterList((prev) => [...new Set([...prev, ...custom])]);
      } catch (e) { }
    }
  };

  const loadBatchInfo = async (product_uuid: string) => {
    if (batchInfo[product_uuid] || loadingBatchInfo[product_uuid]) return;
    setLoadingBatchInfo((prev) => ({ ...prev, [product_uuid]: true }));
    try {
      const batches = await getProductBatches(product_uuid);
      const activeBatches = batches.filter((b: any) => {
        const available = (b.quantity || 0) - (b.sold_quantity || 0);
        return available > 0 && new Date(b.expiry_date) > new Date();
      });
      const totalAvailable = activeBatches.reduce((sum: number, b: any) => sum + ((b.quantity || 0) - (b.sold_quantity || 0)), 0);
      const nearestExpiry = activeBatches.length > 0
        ? activeBatches.sort((a: any, b: any) => new Date(a.expiry_date).getTime() - new Date(b.expiry_date).getTime())[0]
        : null;
      const expiredBatches = batches.filter((b: any) => {
        return new Date(b.expiry_date) <= new Date() && (b.quantity || 0) - (b.sold_quantity || 0) > 0;
      });
      setBatchInfo((prev) => ({
        ...prev,
        [product_uuid]: {
          hasBatches: activeBatches.length > 0,
          batchCount: activeBatches.length,
          totalAvailable,
          nearestExpiry: nearestExpiry?.expiry_date,
          nearestExpiryDays: nearestExpiry
            ? Math.ceil((new Date(nearestExpiry.expiry_date).getTime() - new Date().getTime()) / (1000 * 3600 * 24))
            : null,
          hasExpiredStock: expiredBatches.length > 0,
          expiredCount: expiredBatches.length,
        },
      }));
    } catch (err) {
      console.error("Failed to load batch info:", err);
    } finally {
      setLoadingBatchInfo((prev) => ({ ...prev, [product_uuid]: false }));
    }
  };

  useEffect(() => {
    loadProducts();
    loadCategories();
    loadCustomUnits();
  }, []);

  useEffect(() => {
    if (products.length > 0) {
      const productsToCheck = products.filter((p) => p.stock <= 20 || p.stock === 0);
      for (const product of productsToCheck.slice(0, 15)) {
        loadBatchInfo(product.product_uuid);
      }
    }
  }, [products]);

  useEffect(() => {
    if (!form.category_uuid) {
      setCategoryAttributes([]);
      setAttributeValues({});
      return;
    }
    getCategoryAttributes(form.category_uuid).then((attrs) => {
      setCategoryAttributes(attrs);
      if (editing?.attributes?.length) {
        const prefilled: Record<string, string> = {};
        for (const a of editing.attributes) {
          prefilled[a.attribute_uuid] = a.value;
        }
        setAttributeValues(prefilled);
      } else {
        setAttributeValues({});
      }
    });
  }, [form.category_uuid, editing]);

  useEffect(() => {
    if (editing?.product_uuid) {
      loadUnits(editing.product_uuid);
    } else {
      setUnits([]);
    }
  }, [editing]);

  useEffect(() => {
    const type = PRODUCT_TYPES.find((t) => t.id === wizardData.productType);
    if (type) {
      setWizardData((prev) => ({
        ...prev,
        gst: type.defaults.gst,
        storageCondition: type.defaults.storage || "Room Temperature",
        prescriptionRequired: type.defaults.prescriptionRequired || false,
        baseUnit: type.defaultPackaging.baseUnit,
        packages: type.defaultPackaging.templates.map((p) => ({ ...p, price: undefined, purchase_price: undefined })),
        strength: "",
        dosageForm: "Tablet",
        flavor: "",
        bottleSize: "",
        sugarFree: false,
      }));
    }
  }, [wizardData.productType]);

  // ─── CRUD & Wizard Handlers (unchanged logic from original) ──────────────
  const handleSort = (field: string) => {
    if (sortField === field) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSortField(field);
      setSortDir("asc");
    }
  };

  const SortIcon = ({ field }: { field: string }) => (
    <svg
      className={`w-3 h-3 ml-1 transition-colors ${sortField === field ? "text-blue-500" : "text-slate-300"}`}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2.5}
    >
      {sortField === field && sortDir === "asc" ? (
        <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
      ) : (
        <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
      )}
    </svg>
  );

  const toggleRow = (uuid: string) => {
    setSelectedRows((prev) => {
      const next = new Set(prev);
      if (next.has(uuid)) next.delete(uuid);
      else next.add(uuid);
      return next;
    });
  };

  const toggleAll = () => {
    if (selectedRows.size === filteredProducts.length) setSelectedRows(new Set());
    else setSelectedRows(new Set(filteredProducts.map((p) => p.product_uuid)));
  };

  const handleEdit = (p: any) => {
    setEditing(p);
    setForm({
      name: p.name || "",
      price: String(p.price ?? ""),
      purchase_price: String(p.purchase_price || ""),
      sku: p.sku || "",
      barcode: p.barcode || "",
      gst_percent: String(p.gst_percent ?? "0"),
      hsn_code: p.hsn_code || "",
      unit: p.unit || "Strip",
      image: p.image || "",
      category_uuid: p.category_uuid || "",
      manufacturer: p.manufacturer || "",
      composition: p.composition || "",
      schedule_type: p.schedule_type || "NONE",
      prescription_required: Boolean(p.prescription_required),
      medicine_type: p.medicine_type || "Tablet",
      rack_location: p.rack_location || "",
      product_type: p.product_type || "medicine",
    });
    setShowForm(true);
  };

  const handleDelete = async (uuid: string) => {
    if (!confirm(t("products.deleteConfirm"))) return;
    setDeleting(uuid);
    try {
      await deleteProduct(uuid);
      await loadProducts(true);
      setSuccess("Product deleted successfully!");
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      console.error("Delete error:", err);
      setError(t("products.deleteError"));
    } finally {
      setDeleting(null);
    }
  };

  const resetForm = () => {
    setForm({ ...EMPTY_FORM });
    setEditing(null);
    setShowForm(false);
    setShowUnitForm(false);
    setCategoryAttributes([]);
    setAttributeValues({});
  };

  const resetWizard = () => {
    setShowWizard(false);
    setWizardStep(0);
    setWizardData({ ...defaultWizardData });
    setError(null);
    setSuccess(null);
  };

  const handleSubmit = async () => {
    if (!form.name) {
      setError("Product name is required.");
      return;
    }
    if (form.price === "" || form.price === undefined) {
      setError("Selling price is required. Enter 0 if not yet known.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const payload: any = {
        name: form.name,
        price: Number(form.price),
        sku: form.sku || undefined,
        barcode: form.barcode || undefined,
        gst_percent: Number(form.gst_percent) || 0,
        hsn_code: form.hsn_code || undefined,
        unit: form.unit || "Strip",
        image: form.image || undefined,
        category_uuid: form.category_uuid || undefined,
        manufacturer: form.manufacturer || undefined,
        composition: form.composition || undefined,
        schedule_type: form.schedule_type || "NONE",
        prescription_required: form.prescription_required ? 1 : 0,
        medicine_type: form.medicine_type || undefined,
        rack_location: form.rack_location || undefined,
        product_type: "medicine",
      };
      if (form.purchase_price) payload.purchase_price = Number(form.purchase_price);
      const filledAttributes = Object.entries(attributeValues)
        .filter(([, v]) => v !== "")
        .map(([attribute_uuid, value]) => ({ attribute_uuid, value }));
      if (filledAttributes.length) payload.attributes = filledAttributes;
      if (editing) {
        await updateProduct(editing.product_uuid, payload);
      } else {
        await createProduct(payload);
      }
      resetForm();
      await loadProducts();
      setSuccess(editing ? "Product updated successfully!" : "Product created successfully!");
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      console.error("Submit error:", err);
      setError(editing ? t("products.updateError") : t("products.createError"));
    } finally {
      setLoading(false);
    }
  };

  const addPackage = () => {
    setWizardData((prev) => ({
      ...prev,
      packages: [
        ...prev.packages,
        { name: "", contains: 1, unit: prev.baseUnit, price: undefined, purchase_price: undefined, barcode: undefined },
      ],
    }));
  };

  const updatePackage = (idx: number, field: keyof PackageLevel, value: string | number) => {
    setWizardData((prev) => {
      const newPackages = [...prev.packages];
      newPackages[idx] = { ...newPackages[idx], [field]: value };
      return { ...prev, packages: newPackages };
    });
  };

  const removePackage = (idx: number) => {
    setWizardData((prev) => ({
      ...prev,
      packages: prev.packages.filter((_, i) => i !== idx),
    }));
  };

  const handleWizardSubmit = async () => {
    if (!wizardData.name.trim()) {
      setError("Product name is required");
      return;
    }
    if (!wizardData.manufacturer.trim()) {
      setError("Manufacturer is required");
      return;
    }
    if (!wizardData.baseUnit.trim()) {
      setError("Base unit is required");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const payload: any = {
        name: wizardData.name,
        price: 0,
        purchase_price: 0,
        sku: undefined,
        barcode: wizardData.barcode || undefined,
        gst_percent: wizardData.gst,
        hsn_code: wizardData.hsnCode || undefined,
        unit: wizardData.baseUnit || "Piece",
        image: undefined,
        category_uuid: wizardData.category_uuid || undefined,
        manufacturer: wizardData.manufacturer || undefined,
        composition: wizardData.composition || undefined,
        schedule_type: wizardData.schedule_type || "NONE",
        prescription_required: wizardData.prescriptionRequired ? 1 : 0,
        medicine_type: wizardData.medicine_type || selectedProductType?.label || "Tablet",
        rack_location: wizardData.rackLocation || undefined,
        product_type: "medicine",
        attributes: [],
      };
      const created = await createProduct(payload);
      const productUuid = created.product_uuid;
      await createProductUnit({
        product_uuid: productUuid,
        unit_name: wizardData.baseUnit,
        conversion_factor: 1,
        is_base_unit: true,
      });
      for (const pkg of wizardData.packages) {
        if (pkg.name.trim() && pkg.contains > 0) {
          await createProductUnit({
            product_uuid: productUuid,
            unit_name: pkg.name,
            conversion_factor: pkg.contains,
            barcode: pkg.barcode,
            price: pkg.price,
            purchase_price: pkg.purchase_price,
            is_base_unit: false,
          });
        }
      }
      resetWizard();
      await loadProducts();
      setSuccess("Product created successfully!");
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      console.error("Create product error:", err);
      setError("Failed to create product. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const saveNewUnit = (newUnit: string) => {
    const trimmed = newUnit.trim();
    if (!trimmed || unitsMasterList.includes(trimmed)) return;
    const updatedList = [...unitsMasterList, trimmed];
    setUnitsMasterList(updatedList);
    const builtIn = new Set(PHARMACY_UNITS);
    const customOnly = updatedList.filter((u) => !builtIn.has(u));
    localStorage.setItem("custom_units", JSON.stringify(customOnly));
  };

  const handleAddUnit = async () => {
    if (!editing?.product_uuid) return;
    if (!unitForm.unit_name || !unitForm.conversion_factor) return;
    try {
      await createProductUnit({
        product_uuid: editing.product_uuid,
        unit_name: unitForm.unit_name,
        conversion_factor: Number(unitForm.conversion_factor),
        barcode: unitForm.barcode || undefined,
        price: unitForm.price ? Number(unitForm.price) : undefined,
        purchase_price: unitForm.purchase_price ? Number(unitForm.purchase_price) : undefined,
        is_base_unit: unitForm.is_base_unit,
      });
      setUnitForm({
        unit_name: "",
        conversion_factor: "1",
        barcode: "",
        price: "",
        purchase_price: "",
        is_base_unit: false,
      });
      setShowUnitForm(false);
      await loadUnits(editing.product_uuid);
      setSuccess("Pack size added successfully!");
      setTimeout(() => setSuccess(null), 2000);
    } catch (err) {
      console.error("Add unit error:", err);
      setError("Failed to add pack size");
    }
  };

  const handleDeleteUnit = async (unit_uuid: string) => {
    if (!editing?.product_uuid) return;
    await deleteProductUnit(unit_uuid);
    await loadUnits(editing.product_uuid);
  };

  // ─── Wizard Step Rendering (same as original but using new components) ───
  const renderWizardStep = () => {
    const type = selectedProductType;
    switch (wizardStep) {
      case 0:
        return (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {PRODUCT_TYPES.map((productType) => (
              <button
                key={productType.id}
                type="button"
                onClick={() => setWizardData((p) => ({ ...p, productType: productType.id }))}
                className={`border-2 rounded-2xl p-4 text-center transition-all cursor-pointer ${wizardData.productType === productType.id
                    ? "border-blue-500 bg-blue-50 shadow-lg shadow-blue-100"
                    : "border-slate-200 hover:border-slate-300 hover:shadow-md bg-white"
                  }`}
              >
                <IonIcon icon={getIconForType(productType.icon)} className={`text-3xl mb-2 ${wizardData.productType === productType.id ? "text-blue-600" : "text-slate-500"}`} />
                <p className={`font-semibold text-sm ${wizardData.productType === productType.id ? "text-blue-700" : "text-slate-700"}`}>{productType.label}</p>
                <p className="text-xs text-slate-400 mt-0.5">{productType.description}</p>
              </button>
            ))}
          </div>
        );
      case 1:
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <Input label="Product Name" required value={wizardData.name} onChange={(e: any) => setWizardData((p) => ({ ...p, name: e.target.value }))} placeholder="e.g. Dolo 650" />
            </div>
            <Input label="Composition" value={wizardData.composition} onChange={(e: any) => setWizardData((p) => ({ ...p, composition: e.target.value }))} placeholder="e.g. Paracetamol 650mg" />
            <Input label="Manufacturer" required value={wizardData.manufacturer} onChange={(e: any) => setWizardData((p) => ({ ...p, manufacturer: e.target.value }))} placeholder="e.g. Micro Labs" />
            <Input label="Barcode" value={wizardData.barcode} onChange={(e: any) => setWizardData((p) => ({ ...p, barcode: e.target.value }))} placeholder="Scan or enter barcode" />
            <Input label="HSN Code" value={wizardData.hsnCode} onChange={(e: any) => setWizardData((p) => ({ ...p, hsnCode: e.target.value }))} placeholder="e.g. 3004" />
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1.5 uppercase tracking-wide">GST Rate</label>
              <Select value={String(wizardData.gst)} onChange={(v: string) => setWizardData((p) => ({ ...p, gst: Number(v) }))} options={GST_OPTIONS} />
            </div>
            <Input label="Rack Location" value={wizardData.rackLocation} onChange={(e: any) => setWizardData((p) => ({ ...p, rackLocation: e.target.value }))} placeholder="e.g. A-12" />
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1.5 uppercase tracking-wide">Schedule</label>
              <Select value={wizardData.schedule_type} onChange={(v: string) => setWizardData((p) => ({ ...p, schedule_type: v }))} options={SCHEDULE_TYPES} />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1.5 uppercase tracking-wide">Category</label>
              <CategoryTreePicker
                value={wizardData.category_uuid}
                onChange={(uuid: string) => setWizardData((p) => ({ ...p, category_uuid: uuid }))}
                categories={categories}
                onCreateNew={async (name: string) => {
                  const created = await createCategory({ name });
                  await loadCategories();
                  return created;
                }}
                placeholder="Select category…"
              />
            </div>
          </div>
        );
      case 2:
        if (!type) return null;
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {type.medicineDetails.includes("strength") && (
              <Input label="Strength" value={wizardData.strength} onChange={(e: any) => setWizardData((p) => ({ ...p, strength: e.target.value }))} placeholder="e.g. 650mg" />
            )}
            {type.medicineDetails.includes("dosage_form") && (
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1.5 uppercase tracking-wide">Dosage Form</label>
                <Select value={wizardData.dosageForm} onChange={(v: string) => setWizardData((p) => ({ ...p, dosageForm: v }))} options={["Tablet", "Capsule", "Syrup", "Injection", "Drops"].map((v) => ({ value: v, label: v }))} />
              </div>
            )}
            {type.medicineDetails.includes("storage_condition") && (
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1.5 uppercase tracking-wide">Storage</label>
                <Select value={wizardData.storageCondition} onChange={(v: string) => setWizardData((p) => ({ ...p, storageCondition: v }))} options={["Room Temperature", "Cold Storage", "Keep Away From Sunlight"].map((v) => ({ value: v, label: v }))} />
              </div>
            )}
            {type.medicineDetails.includes("prescription_required") && (
              <div className="flex items-center gap-3 mt-1">
                <Toggle checked={wizardData.prescriptionRequired} onChange={(v: boolean) => setWizardData((p) => ({ ...p, prescriptionRequired: v }))} label="Prescription Required" />
              </div>
            )}
            {type.medicineDetails.includes("flavor") && (
              <Input label="Flavor" value={wizardData.flavor} onChange={(e: any) => setWizardData((p) => ({ ...p, flavor: e.target.value }))} placeholder="e.g. Orange" />
            )}
            {type.medicineDetails.includes("bottle_size") && (
              <Input label="Bottle Size" value={wizardData.bottleSize} onChange={(e: any) => setWizardData((p) => ({ ...p, bottleSize: e.target.value }))} placeholder="e.g. 100ml" />
            )}
            {type.medicineDetails.includes("sugar_free") && (
              <div className="flex items-center gap-3 mt-1">
                <Toggle checked={wizardData.sugarFree} onChange={(v: boolean) => setWizardData((p) => ({ ...p, sugarFree: v }))} label="Sugar Free" />
              </div>
            )}
          </div>
        );
      case 3:
        return (
          <PackagingManager
            baseUnit={wizardData.baseUnit}
            packages={wizardData.packages}
            onAddPackage={addPackage}
            onUpdatePackage={updatePackage}
            onRemovePackage={removePackage}
            onBaseUnitChange={(unit: string) => setWizardData((prev) => ({ ...prev, baseUnit: unit }))}
          />
        );
      case 4:
        return (
          <div className="bg-slate-50 rounded-2xl p-5 space-y-4">
            <div className="flex items-center gap-3 pb-4 border-b border-slate-200">
              <IonIcon icon={getIconForType(type?.icon || "cube")} className="text-3xl text-slate-600" />
              <div>
                <h3 className="font-bold text-slate-800">{wizardData.name || "Untitled Product"}</h3>
                <p className="text-sm text-slate-500">{wizardData.composition || "No composition"}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-x-8 gap-y-2 text-sm">
              {[
                ["Type", type?.label],
                ["Manufacturer", wizardData.manufacturer],
                ["Schedule", wizardData.schedule_type],
                ["GST", `${wizardData.gst}%`],
                ["HSN", wizardData.hsnCode || "—"],
                ["Rack", wizardData.rackLocation || "—"],
                ["Prescription", wizardData.prescriptionRequired ? "Required" : "Not required"],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between py-1.5 border-b border-slate-100">
                  <span className="text-slate-500">{k}</span>
                  <span className="font-medium text-slate-700">{v}</span>
                </div>
              ))}
            </div>
            <div className="pt-2">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Packaging</p>
              <div className="flex items-center gap-2 text-sm text-slate-700 mb-2">
                <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded-md font-medium">{wizardData.baseUnit || "—"}</span>
                <span className="text-slate-400">base unit</span>
              </div>
              {wizardData.packages.map((pkg, i) => (
                <div key={i} className="flex justify-between text-sm text-slate-600 py-1 border-b border-slate-100">
                  <span className="font-medium">{pkg.name}</span>
                  <span className="text-slate-400">
                    1 {pkg.name} = {pkg.contains} {wizardData.baseUnit}s {pkg.price ? `· ₹${pkg.price}` : ""}
                  </span>
                </div>
              ))}
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  if (loading && !products.length) {
    return (
      <div className="flex items-center justify-center h-96">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8F9FC] p-6 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight text-start">{t("products.title")}</h1>
          <p className="text-slate-500 text-sm mt-0.5">{t("products.subtitle")}</p>
        </div>
        <div className="flex items-center gap-2.5">
          <Tooltip label="Toggle statistics">
            <button
              onClick={() => setShowStats(!showStats)}
              className={`p-2.5 rounded-xl border transition-all text-slate-500 hover:border-slate-300 ${showStats ? "bg-slate-100 border-slate-300" : "bg-white border-slate-200"
                }`}
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </button>
          </Tooltip>
          <button
            onClick={() => {
              resetForm();
              setError(null);
              setShowWizard(true);
            }}
            className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 active:scale-[0.98] text-white text-sm font-semibold rounded-xl transition-all shadow-md shadow-blue-200"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            {t("products.addProduct")}
          </button>
          {/* <button
            onClick={() => setShowPrintLabels(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-purple-600 hover:bg-purple-700 text-white text-sm font-semibold rounded-xl transition-all shadow-md shadow-purple-200"
          >
            <IonIcon icon={pricetagOutline} className="text-lg" />
            Print Labels
          </button> */}
        </div>
      </div>

      {/* Flash Messages */}
      <div className="space-y-2">
        {success && (
          <div className="flex items-center gap-3 px-4 py-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-700 text-sm">
            <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {success}
          </div>
        )}
        {error && (
          <div className="flex items-center justify-between gap-3 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              {error}
            </div>
            <button onClick={() => setError(null)} className="text-red-400 hover:text-red-600">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}
      </div>

      {/* Stats Cards */}
      {showStats && (
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
          <StatCard
            label="Total Products"
            value={totalProducts}
            delta="All registered medicines"
            gradient="bg-gradient-to-br from-blue-500 to-blue-700 text-white"
            icon={
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            }
          />
          <StatCard
            label="Inventory Value"
            value={`₹${(totalInventoryValue / 1000).toFixed(1)}K`}
            delta="Current stock value"
            gradient="bg-gradient-to-br from-violet-500 to-violet-700 text-white"
            icon={
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            }
          />
          <StatCard
            label="Low Stock"
            value={lowStockProducts}
            delta="Items need reordering"
            gradient="bg-gradient-to-br from-amber-400 to-amber-600 text-white"
            icon={
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            }
          />
          <StatCard
            label="Out of Stock"
            value={outOfStockProducts}
            delta="Requires immediate action"
            gradient="bg-gradient-to-br from-red-400 to-rose-600 text-white"
            icon={
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
              </svg>
            }
          />
        </div>
      )}

      {/* Products Table Card */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm shadow-slate-100 overflow-hidden">
        {/* Toolbar */}
        <div className="flex items-center justify-between gap-3 px-5 py-4 border-b border-slate-100">
          <div className="relative flex-1 max-w-sm">
            <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder={t("products.searchPlaceholder")}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all placeholder:text-slate-400"
            />
            {searchTerm && (
              <button onClick={() => setSearchTerm("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <span>{filteredProducts.length} of {totalProducts} items</span>
          </div>
        </div>

        {/* Bulk Action Bar */}
        {selectedRows.size > 0 && ( 
          <div className="flex items-center gap-3 px-5 py-3 bg-blue-50 border-b border-blue-100">
            <span className="text-sm font-medium text-blue-700">{selectedRows.size} selected</span>
            <div className="flex items-center gap-2 ml-auto">
              <button className="px-3 py-1.5 text-xs font-medium text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">Edit Info</button>
              <button className="px-3 py-1.5 text-xs font-medium text-red-600 bg-white border border-red-200 rounded-lg hover:bg-red-50 transition-colors">Delete</button>
              <button onClick={() => setSelectedRows(new Set())} className="p-1.5 text-slate-400 hover:text-slate-600">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        )}

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full min-w-[800px]">
            <thead>
              <tr className="border-b border-slate-100">
                <th className="w-10 px-5 py-3.5 text-left">
                  <input
                    type="checkbox"
                    checked={selectedRows.size === filteredProducts.length && filteredProducts.length > 0}
                    onChange={toggleAll}
                    className="w-4 h-4 rounded border-slate-300 text-blue-600 cursor-pointer"
                  />
                </th>
                {[
                  ["name", "Product", true],
                  ["composition", "Composition", true],
                  ["schedule_type", "Schedule", false],
                  ["gst_percent", "GST", false],
                  ["price", "MRP", true],
                  ["stock", "Stock", true],
                  ["status", "Status", false],
                ].map(([field, label, sortable]) => (
                  <th
                    key={field as string}
                    onClick={sortable ? () => handleSort(field as string) : undefined}
                    className={`px-4 py-3.5 text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wider ${sortable ? "cursor-pointer hover:text-slate-700 select-none" : ""
                      }`}
                  >
                    <div className="flex items-center">
                      {label}
                      {sortable && <SortIcon field={field as string} />}
                    </div>
                  </th>
                ))}
                <th className="px-4 py-3.5 text-right text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-5 py-16 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center">
                        <svg className="w-7 h-7 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-slate-600">{searchTerm ? t("products.noSearchResults") : t("products.noProducts")}</p>
                        {!searchTerm && (
                          <button onClick={() => setShowWizard(true)} className="text-sm text-blue-600 hover:text-blue-700 mt-1">
                            Add your first product →
                          </button>
                        )}
                      </div>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredProducts.map((p) => {
                  const batchInfoItem = batchInfo[p.product_uuid];
                  const isNearExpiry = batchInfoItem?.nearestExpiryDays !== null && batchInfoItem?.nearestExpiryDays <= 90 && batchInfoItem?.nearestExpiryDays > 0;
                  const isOutOfStock = p.stock === 0;
                  const isLowStock = p.stock > 0 && p.stock <= 10;
                  const isSelected = selectedRows.has(p.product_uuid);
                  return (
                    <tr key={p.product_uuid} className={`group transition-colors ${isSelected ? "bg-blue-50/60" : "hover:bg-slate-50/80"}`}>
                      <td className="px-5 py-3.5">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleRow(p.product_uuid)}
                          className="w-4 h-4 rounded border-slate-300 text-blue-600 cursor-pointer"
                        />
                      </td>
                      <td className="px-4 py-3.5 max-w-[200px]">
                        <div className="font-semibold text-sm text-slate-800 truncate">{p.name}</div>
                        <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                          {p.manufacturer && <span className="text-xs text-slate-400 truncate max-w-[120px]">{p.manufacturer}</span>}
                          {p.medicine_type && <span className="text-[10px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded font-medium">{p.medicine_type}</span>}
                          {p.rack_location && <span className="text-[10px] text-blue-500 font-mono font-medium">{p.rack_location}</span>}
                          {isNearExpiry && (
                            <span className="text-[10px] bg-orange-100 text-orange-700 px-1.5 py-0.5 rounded flex items-center gap-1">
                              <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                              </svg>
                              Expires in {batchInfoItem.nearestExpiryDays}d
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3.5 max-w-[160px]">
                        <span className="text-xs text-slate-500 italic line-clamp-2">{p.composition || "—"}</span>
                      </td>
                      <td className="px-4 py-3.5">
                        {p.schedule_type && p.schedule_type !== "NONE" ? (
                          <Badge variant="schedule">Sch {p.schedule_type}</Badge>
                        ) : (
                          <Badge variant="otc">OTC</Badge>
                        )}
                      </td>
                      <td className="px-4 py-3.5">
                        <span className="text-xs font-mono text-slate-500">{p.gst_percent || 0}%</span>
                      </td>
                      <td className="px-4 py-3.5">
                        <span className="font-semibold text-sm text-slate-800">₹{p.price?.toLocaleString()}</span>
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-1.5">
                          <span className={`font-semibold text-sm ${isOutOfStock ? "text-red-500" : isLowStock ? "text-amber-600" : "text-slate-700"}`}>
                            {p.stock ?? 0}
                          </span>
                          <span className="text-xs text-slate-400">{p.unit}s</span>
                        </div>
                        {batchInfoItem && batchInfoItem.batchCount > 0 && batchInfoItem.totalAvailable !== p.stock && (
                          <div className="text-xs text-slate-400 mt-0.5">({batchInfoItem.totalAvailable} in batches)</div>
                        )}
                      </td>
                      <td className="px-4 py-3.5">
                        {isOutOfStock ? (
                          <Badge variant="danger">Out of Stock</Badge>
                        ) : isLowStock ? (
                          <Badge variant="warning">Low Stock</Badge>
                        ) : (
                          <Badge variant="success">In Stock</Badge>
                        )}
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Tooltip label="Edit">
                            <button
                              onClick={() => {
                                handleEdit(p);
                                loadBatchInfo(p.product_uuid);
                              }}
                              className="p-2 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                            >
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                            </button>
                          </Tooltip>
                          <Tooltip label="Delete">
                            <button
                              onClick={() => handleDelete(p.product_uuid)}
                              disabled={deleting === p.product_uuid}
                              className="p-2 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all disabled:opacity-40"
                            >
                              {deleting === p.product_uuid ? (
                                <Spinner size="sm" />
                              ) : (
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                              )}
                            </button>
                          </Tooltip>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        {filteredProducts.length > 0 && (
          <div className="px-5 py-3.5 border-t border-slate-100 flex items-center justify-between">
            <p className="text-xs text-slate-400">Showing {filteredProducts.length} of {totalProducts} products</p>
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <span className="flex items-center gap-1.5"><span className="w-2 h-2 bg-emerald-400 rounded-full" />In Stock</span>
              <span className="flex items-center gap-1.5"><span className="w-2 h-2 bg-amber-400 rounded-full" />Low Stock</span>
              <span className="flex items-center gap-1.5"><span className="w-2 h-2 bg-red-400 rounded-full" />Out of Stock</span>
            </div>
          </div>
        )}
      </div>

      {/* ─── Wizard Modal ───────────────────────────────────────────────────── */}
      {showWizard && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={(e) => e.target === e.currentTarget && resetWizard()}>
          <div className="bg-white rounded-3xl shadow-2xl shadow-slate-900/20 w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
            <div className="flex items-center justify-between px-6 pt-6 pb-0">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Add New Product</h2>
                <p className="text-sm text-slate-500 mt-0.5">Step {wizardStep + 1} of {wizardSteps.length}</p>
              </div>
              <button onClick={resetWizard} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-all">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="px-6 pt-4">
              <WizardSteps current={wizardStep} steps={wizardSteps} />
            </div>
            {error && (
              <div className="mx-6 mb-2 flex items-center gap-2 px-4 py-2.5 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
                <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                {error}
              </div>
            )}
            <div className="flex-1 overflow-y-auto px-6 pb-4">{renderWizardStep()}</div>
            <div className="flex items-center justify-between gap-3 px-6 py-4 border-t border-slate-100 bg-slate-50/50">
              <button
                onClick={() => setWizardStep(Math.max(0, wizardStep - 1))}
                disabled={wizardStep === 0}
                className="px-4 py-2.5 text-sm font-medium text-slate-600 border border-slate-200 bg-white rounded-xl hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              >
                ← Previous
              </button>
              <div className="flex items-center gap-1.5">
                {wizardSteps.map((_, i) => (
                  <div
                    key={i}
                    className={`rounded-full transition-all ${i === wizardStep ? "w-5 h-1.5 bg-blue-500" : i < wizardStep ? "w-1.5 h-1.5 bg-blue-400" : "w-1.5 h-1.5 bg-slate-200"
                      }`}
                  />
                ))}
              </div>
              {wizardStep < wizardSteps.length - 1 ? (
                <button
                  onClick={() => setWizardStep(wizardStep + 1)}
                  className="px-4 py-2.5 text-sm font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-all shadow-md shadow-blue-200"
                >
                  Next →
                </button>
              ) : (
                <button
                  onClick={handleWizardSubmit}
                  disabled={loading}
                  className="px-4 py-2.5 text-sm font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl transition-all shadow-md shadow-emerald-200 disabled:opacity-50 flex items-center gap-2"
                >
                  {loading && <Spinner size="sm" />}
                  {loading ? "Creating…" : "Create Product ✓"}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ─── Edit / Quick Add Form Modal (unchanged from original) ────────── */}
      {showForm && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={(e) => e.target === e.currentTarget && resetForm()}>
          <div className="bg-white rounded-3xl shadow-2xl shadow-slate-900/20 w-full max-w-xl max-h-[90vh] flex flex-col overflow-hidden">
            <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center">
                  <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900">{editing ? "Edit Product" : "Quick Add Product"}</h2>
                  <p className="text-xs text-slate-500 mt-0.5">{editing ? "Update medicine information" : "Add a product manually"}</p>
                </div>
              </div>
              <button onClick={resetForm} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-all">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {error && (
              <div className="mx-5 mt-4 flex items-center gap-2 px-4 py-2.5 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                {error}
              </div>
            )}

            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              <div className="grid grid-cols-1 gap-4">
                <Input label="Medicine Name" required value={form.name} onChange={(e: any) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Dolo 650" />
                <div className="grid grid-cols-2 gap-3">
                  <Input label="Manufacturer" value={form.manufacturer} onChange={(e: any) => setForm({ ...form, manufacturer: e.target.value })} placeholder="e.g. Micro Labs" />
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1.5 uppercase tracking-wide">Medicine Type</label>
                    <Select value={form.medicine_type} onChange={(v: string) => setForm({ ...form, medicine_type: v })} options={MEDICINE_TYPES.map((t) => ({ value: t, label: t }))} placeholder="Select type…" />
                  </div>
                </div>
                <Input label="Composition" value={form.composition} onChange={(e: any) => setForm({ ...form, composition: e.target.value })} placeholder="e.g. Paracetamol 650mg" />
                <div className="grid grid-cols-2 gap-3">
                  <Input label="Selling Price (MRP)" required prefix="₹" type="number" value={form.price} onChange={(e: any) => setForm({ ...form, price: e.target.value })} placeholder="0.00" />
                  <Input label="Purchase Price (PTR)" prefix="₹" type="number" value={form.purchase_price} onChange={(e: any) => setForm({ ...form, purchase_price: e.target.value })} placeholder="0.00" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1.5 uppercase tracking-wide">GST Rate</label>
                    <Select value={form.gst_percent} onChange={(v: string) => setForm({ ...form, gst_percent: v })} options={GST_OPTIONS} placeholder="Select GST…" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1.5 uppercase tracking-wide">Schedule</label>
                    <Select value={form.schedule_type} onChange={(v: string) => setForm({ ...form, schedule_type: v })} options={SCHEDULE_TYPES} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <Input label="HSN Code" value={form.hsn_code} onChange={(e: any) => setForm({ ...form, hsn_code: e.target.value })} placeholder="e.g. 3004" />
                  <Input label="Rack Location" value={form.rack_location} onChange={(e: any) => setForm({ ...form, rack_location: e.target.value })} placeholder="e.g. A-12" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <Input label="SKU" value={form.sku} onChange={(e: any) => setForm({ ...form, sku: e.target.value })} placeholder="Optional" />
                  <Input label="Barcode" value={form.barcode} onChange={(e: any) => setForm({ ...form, barcode: e.target.value })} placeholder="Scan or enter" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1.5 uppercase tracking-wide">Category</label>
                  <CategoryTreePicker
                    value={form.category_uuid}
                    onChange={(uuid: string) => setForm({ ...form, category_uuid: uuid })}
                    categories={categories}
                    onCreateNew={async (name: string) => {
                      const created = await createCategory({ name });
                      await loadCategories();
                      return created;
                    }}
                    placeholder="Select category…"
                  />
                </div>
                <Toggle checked={form.prescription_required} onChange={(v: boolean) => setForm({ ...form, prescription_required: v })} label="Prescription Required" />
              </div>
            </div>

            <div className="px-5 py-4 border-t border-slate-100 bg-slate-50/50">
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 py-3 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl transition-all shadow-lg shadow-blue-200 disabled:opacity-50"
              >
                {loading && <Spinner size="sm" />}
                {loading ? (editing ? "Updating…" : "Creating…") : editing ? "Update Product" : "Create Product"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Print Labels Modal */}
      {/* {showPrintLabels && createPortal(<PrintLabelsModal products={products} onClose={() => setShowPrintLabels(false)} />, document.body)} */}
    </div>
  );
}