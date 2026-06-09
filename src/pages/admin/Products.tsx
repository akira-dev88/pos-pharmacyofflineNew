import { useEffect, useState, useRef, useCallback, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { format } from "date-fns";
import {
  getProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  getProductUnits,
  createProductUnit,
  deleteProductUnit,
  getProductBatches,
  quarantineExpiredBatches,
  getProductTemplates,
  getProductTemplate,
  createProductTemplate,
} from "../../renderer/services/productApi";
import { IonIcon } from "@ionic/react";
import {
  addOutline,
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
  calendarOutline,
} from "ionicons/icons";
import PrintLabelsModal from "../../components/PrintLabelsModal";
import { createPortal } from "react-dom";
import {
  getCategories,
  getCategoryAttributes,
  createCategory,
} from "../../renderer/services/categoryApi";
import SimpleDatePicker from "../../components/SimpleDatePicker";
import { CalendarIcon } from "lucide-react";

// shadcn/ui components
import { Button } from "@/components/ui/button";
import {
  Select as ShadSelect,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

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
  image: string;
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
  image: "",
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

const TEMPLATE_NAME_ICONS: Record<string, string> = {
  tablet: tabletPortraitOutline,
  capsule: medkitOutline,
  syrup: beakerOutline,
  injection: syncOutline,
  fmcg: cartOutline,
  device: pulseOutline,
  ayurvedic: leafOutline,
  cream: flaskOutline,
  ointment: flaskOutline,
  drops: flaskOutline,
  inhaler: medkitOutline,
  powder: flaskOutline,
};

const getIconForTemplateName = (name: string): string => {
  const key = name.toLowerCase().trim();
  return TEMPLATE_NAME_ICONS[key] || cubeOutline;
};

// ─── Reusable UI Components ───────────────────────────────────────────────
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
        className="w-full flex items-center justify-between gap-2 px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-sm text-slate-700 hover:border-slate-300 transition-all focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400"
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
              className={`px-3 py-2.5 text-sm cursor-pointer transition-colors ${opt.value === value ? "bg-emerald-50 text-emerald-700 font-medium" : "text-slate-700 hover:bg-slate-50"}`}
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



const WizardSteps = ({ current, steps }: { current: number; steps: string[] }) => (
  <div className="flex items-center gap-0 mb-8">
    {steps.map((s, i) => (
      <div key={i} className="flex items-center flex-1 last:flex-none">
        <div className="flex flex-col items-center gap-1">
          <div
            className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${i < current
              ? "bg-emerald-500 text-white"
              : i === current
                ? "bg-emerald-600 text-white ring-4 ring-emerald-100"
                : "bg-slate-100 text-slate-400"
              }`}
          >
            {i < current ? (
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            ) : i + 1}
          </div>
          <span className={`text-[10px] font-medium whitespace-nowrap ${i === current ? "text-emerald-600" : "text-slate-400"}`}>{s}</span>
        </div>
        {i < steps.length - 1 && (
          <div className={`flex-1 h-px mx-2 mb-5 transition-colors ${i < current ? "bg-emerald-400" : "bg-slate-200"}`} />
        )}
      </div>
    ))}
  </div>
);

// ─── Enhanced Category Tree Picker ────────────────────────────────────────
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

// ─── Packaging Manager ────────────────────────────────────────────────────
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

// ─── Main Products Component ──────────────────────────────────────────────
export default function Products() {
  const { t } = useTranslation();
  const [products, setProducts] = useState<Product[]>([]);
  const [editing, setEditing] = useState<any | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [stockFilter, setStockFilter] = useState<"all" | "in" | "low" | "out">("all");
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
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
  const [sortField, setSortField] = useState<string>("name");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [showStats, setShowStats] = useState(true);
  const [quarantining, setQuarantining] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<{ uuid: string; name: string } | { count: number } | null>(null);
  const [templates, setTemplates] = useState<any[]>([]);
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [missClickHint, setMissClickHint] = useState(false);
  const [wizardError, setWizardError] = useState<string | null>(null);
  const [selectedTemplateUuid, setSelectedTemplateUuid] = useState<string | null>(null);
  const [templateForm, setTemplateForm] = useState({
    name: "",
    description: "",
    defaults_json: { gst_percent: 12, schedule_type: "NONE", medicine_type: "Tablet", prescription_required: false },
    packaging_json: { baseUnit: "Tablet", templates: [] as { name: string; contains: number; unit: string }[] },
  });

  const wizardSteps = ["Type", "Basic Info", "Details", "Packaging", "Image", "Review"];
  const selectedProductType = PRODUCT_TYPES.find((t) => t.id === wizardData.productType);
  const selectedTemplateData = selectedTemplateUuid ? templates.find((t: any) => t.template_uuid === selectedTemplateUuid) : null;

  // Advanced filter state
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    dateFrom: "",
    dateTo: "",
    composition: "",
    schedule: "",
    gst: "",
    mrpMin: "",
    mrpMax: "",
  });
  const hasActiveFilters = Object.values(filters).some(v => v !== "");

  // Date picker state (matching H1Register style)
  const [filterFromDate, setFilterFromDate] = useState<Date | undefined>(undefined);
  const [filterToDate, setFilterToDate] = useState<Date | undefined>(undefined);
  const [showFilterFromPicker, setShowFilterFromPicker] = useState(false);
  const [showFilterToPicker, setShowFilterToPicker] = useState(false);
  const [filterFromPickPos, setFilterFromPickPos] = useState({ top: 0, right: 0 });
  const [filterToPickPos, setFilterToPickPos] = useState({ top: 0, right: 0 });
  const filterFromBtnRef = useRef<HTMLButtonElement>(null);
  const filterToBtnRef = useRef<HTMLButtonElement>(null);

  const filteredProducts = useMemo(() => {
    let list = products.filter(
      (p) =>
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (p.composition || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        (p.manufacturer || "").toLowerCase().includes(searchTerm.toLowerCase())
    );
    list = list.filter((p) => {
      if (stockFilter === "in") return (p.stock ?? 0) >= 10;
      if (stockFilter === "low") return (p.stock ?? 0) > 0 && (p.stock ?? 0) < 10;
      if (stockFilter === "out") return (p.stock ?? 0) === 0;
      return true;
    });
    // Advanced filters
    if (filters.composition) {
      list = list.filter(p => (p.composition || "").toLowerCase().includes(filters.composition.toLowerCase()));
    }
    if (filters.schedule) {
      list = list.filter(p => p.schedule_type === filters.schedule);
    }
    if (filters.gst) {
      list = list.filter(p => String(p.gst_percent ?? "0") === filters.gst);
    }
    if (filters.mrpMin) {
      list = list.filter(p => (p.price || 0) >= Number(filters.mrpMin));
    }
    if (filters.mrpMax) {
      list = list.filter(p => (p.price || 0) <= Number(filters.mrpMax));
    }
    list = [...list].sort((a, b) => {
      let va: any = a[sortField as keyof Product] ?? "";
      let vb: any = b[sortField as keyof Product] ?? "";
      if (typeof va === "number") return sortDir === "asc" ? va - vb : vb - va;
      return sortDir === "asc" ? String(va).localeCompare(String(vb)) : String(vb).localeCompare(String(va));
    });
    return list;
  }, [products, searchTerm, stockFilter, sortField, sortDir, filters]);

  const [pageP, setPageP] = useState(1);
  const pageSize = 20;
  const totalPages = Math.ceil(filteredProducts.length / pageSize);
  const paginatedProducts = filteredProducts.slice((pageP - 1) * pageSize, pageP * pageSize);

  const formatCompactNumber = (num: number): string => {
    if (num === null || num === undefined) return "0";
    const absNum = Math.abs(num);
    if (absNum >= 10000000) return (num / 10000000).toFixed(2) + "cr";
    if (absNum >= 100000) return (num / 100000).toFixed(2) + "L";
    if (absNum >= 1000) return (num / 1000).toFixed(2) + "k";
    return num.toFixed(2);
  };

  useEffect(() => {
    setPageP(1);
  }, [searchTerm, stockFilter, sortField, sortDir, filters]);

  useEffect(() => {
    setFilters(prev => ({ ...prev, dateFrom: filterFromDate ? format(filterFromDate, "yyyy-MM-dd") : "" }));
  }, [filterFromDate]);

  useEffect(() => {
    setFilters(prev => ({ ...prev, dateTo: filterToDate ? format(filterToDate, "yyyy-MM-dd") : "" }));
  }, [filterToDate]);

  useEffect(() => {
    if (!showFilterFromPicker || !filterFromBtnRef.current) return;
    const rect = filterFromBtnRef.current.getBoundingClientRect();
    setFilterFromPickPos({ top: rect.bottom + 6, right: document.documentElement.clientWidth - rect.right });
    const handleClick = (e: MouseEvent) => {
      if (filterFromBtnRef.current && !filterFromBtnRef.current.contains(e.target as Node) && !(e.target as Element)?.closest?.(".cal-card")) {
        setShowFilterFromPicker(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [showFilterFromPicker]);

  useEffect(() => {
    if (!showFilterToPicker || !filterToBtnRef.current) return;
    const rect = filterToBtnRef.current.getBoundingClientRect();
    setFilterToPickPos({ top: rect.bottom + 6, right: document.documentElement.clientWidth - rect.right });
    const handleClick = (e: MouseEvent) => {
      if (filterToBtnRef.current && !filterToBtnRef.current.contains(e.target as Node) && !(e.target as Element)?.closest?.(".cal-card")) {
        setShowFilterToPicker(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [showFilterToPicker]);

  const totalProducts = products.length;
  const lowStockProducts = products.filter((p) => p.stock <= 10 && p.stock > 0).length;
  const outOfStockProducts = products.filter((p) => p.stock === 0).length;
  const totalInventoryValue = products.reduce((sum, p) => sum + (p.price || 0) * (p.stock || 0), 0);

  const [selectedStat, setSelectedStat] = useState<string | null>(null);

  const trendData = useMemo(() => {
    const gen = (peak: number) => {
      const pts: number[] = [];
      for (let i = 0; i < 20; i++) {
        const base = (i / 19) * peak;
        pts.push(Math.max(0, Math.round(base * (0.7 + ((i * 7 + 13) % 10) / 20))));
      }
      return pts;
    };
    return {
      products: gen(totalProducts),
      inventory: gen(totalInventoryValue),
      low: gen(lowStockProducts),
      out: gen(outOfStockProducts),
    };
  }, [totalProducts, totalInventoryValue, lowStockProducts, outOfStockProducts]);

  const Sparkline = ({ data: chartData, width = 320, height = 100, color = "#22c55e" }: { data: number[], width?: number, height?: number, color?: string }) => {
    const [hovered, setHovered] = useState(false);
    if (!chartData || chartData.length < 2) return null;
    const values = chartData;
    const max = Math.max(...values, 1);
    const min = Math.min(...values, 0);
    const range = max - min || 1;
    const points = values.map((v: number, i: number) => ({
      x: i / (values.length - 1) * width,
      y: 4 + (height - 8) * (1 - (v - min) / range),
    }));
    const smoothPath = (pts: { x: number; y: number }[]) => {
      if (pts.length < 2) return '';
      let d = `M ${pts[0].x},${pts[0].y}`;
      for (let i = 1; i < pts.length; i++) {
        const p0 = pts[i - 1], p1 = pts[i], p_1 = pts[Math.max(0, i - 2)], p2 = pts[Math.min(pts.length - 1, i + 1)];
        d += ` C ${p0.x + (p1.x - p_1.x) / 6},${p0.y + (p1.y - p_1.y) / 6} ${p1.x - (p2.x - p0.x) / 6},${p1.y - (p2.y - p0.y) / 6} ${p1.x},${p1.y}`;
      }
      return d;
    };
    const lineD = smoothPath(points);
    const areaD = `${lineD} L ${width},${height} L 0,${height} Z`;
    return (
      <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none"
        onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}
        style={{ cursor: 'pointer' }}>
        <defs>
          <linearGradient id={`sg-${color.replace('#','')}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity={hovered ? 0.55 : 0.38} />
            <stop offset="100%" stopColor={color} stopOpacity={hovered ? 0.06 : 0.02} />
          </linearGradient>
        </defs>
        <path d={areaD} fill={`url(#sg-${color.replace('#','')})`} />
        <path d={lineD} fill="none" stroke={color} strokeWidth={hovered ? 3.5 : 2.5} strokeLinecap="round" strokeLinejoin="round" style={{ transition: 'stroke-width 0.15s' }} />
      </svg>
    );
  };

  // Data fetching (unchanged)
  const loadProducts = async (silent = false) => {
    if (!silent) setLoading(true);
    setError(null);
    try {
      const { products } = await getProducts(1, 5000);
      setProducts(products);
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

  const [showQuarantineConfirm, setShowQuarantineConfirm] = useState(false);

  const handleQuarantineExpired = async () => {
    setShowQuarantineConfirm(true);
  };

  const confirmQuarantine = async () => {
    setShowQuarantineConfirm(false);
    setQuarantining(true);
    try {
      const result = await quarantineExpiredBatches();
      if (result?.success !== false) {
        setSuccess("Expired batches quarantined successfully!");
      } else {
        setError(result?.error || "Quarantine failed");
      }
      await loadProducts(true);
    } catch (err) {
      setError("Failed to quarantine expired batches");
    } finally {
      setQuarantining(false);
    }
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

  useEffect(() => {
    if (showWizard) {
      getProductTemplates().then(setTemplates).catch(() => setTemplates([]));
    }
  }, [showWizard]);

  useEffect(() => {
    if (!selectedTemplateUuid) return;
    getProductTemplate(selectedTemplateUuid).then((template) => {
      if (!template) return;
      const def = template.defaults_json || {};
      const pkg = template.packaging_json || {};
      setWizardData((prev) => ({
        ...prev,
        gst: def.gst_percent ?? 12,
        schedule_type: def.schedule_type || "NONE",
        medicine_type: def.medicine_type || "Tablet",
        prescriptionRequired: def.prescription_required ?? false,
        baseUnit: pkg.baseUnit || "",
        packages: (pkg.templates || []).map((p: any) => ({
          name: p.name,
          contains: p.contains,
          unit: p.unit,
          price: undefined,
          purchase_price: undefined,
        })),
        strength: "",
        dosageForm: "",
        flavor: "",
        bottleSize: "",
        sugarFree: false,
      }));
    });
  }, [selectedTemplateUuid]);

  // Handlers
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
    const product = products.find((p) => p.product_uuid === uuid);
    setDeleteConfirm({ uuid, name: product?.name || "this product" });
  };

  const confirmDelete = async (target: { uuid: string } | { count: number }) => {
    setDeleteConfirm(null);
    if ("uuid" in target) {
      setDeleting(target.uuid);
      try {
        await deleteProduct(target.uuid);
        await loadProducts(true);
        setSuccess("Product deleted successfully!");
        setTimeout(() => setSuccess(null), 3000);
      } catch (err) {
        console.error("Delete error:", err);
        setError(t("products.deleteError"));
      } finally {
        setDeleting(null);
      }
    } else {
      for (const uuid of selectedRows) {
        await deleteProduct(uuid);
      }
      await loadProducts(true);
      setSelectedRows(new Set());
      setSuccess("Selected products deleted successfully!");
      setTimeout(() => setSuccess(null), 3000);
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
    setSelectedTemplateUuid(null);
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

  const handleNext = () => {
    setWizardError(null);
    if (wizardStep === 0 && !wizardData.productType) {
      setWizardError("Please select a product type to continue");
      return;
    }
    if (wizardStep === 1) {
      if (!wizardData.name.trim()) {
        setWizardError("Product name is required");
        return;
      }
      if (!wizardData.manufacturer.trim()) {
        setWizardError("Manufacturer is required");
        return;
      }
    }
    if (wizardStep === 3 && !wizardData.baseUnit.trim()) {
      setWizardError("Base unit is required for packaging");
      return;
    }
    setWizardStep((s) => s + 1);
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
        image: wizardData.image || undefined,
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

  const handleTemplatePreFill = (typeId: string) => {
    const type = PRODUCT_TYPES.find((t) => t.id === typeId);
    if (!type) return;
    setTemplateForm((prev) => ({
      ...prev,
      defaults_json: {
        gst_percent: type.defaults.gst,
        schedule_type: "NONE",
        medicine_type: type.label,
        prescription_required: type.defaults.prescriptionRequired || false,
      },
      packaging_json: {
        baseUnit: type.defaultPackaging.baseUnit,
        templates: type.defaultPackaging.templates.map((p) => ({ ...p })),
      },
    }));
  };

  const handleCreateTemplate = async () => {
    if (!templateForm.name.trim()) {
      setError("Template heading is required");
      return;
    }
    try {
      const payload = {
        name: templateForm.name,
        description: templateForm.description,
        defaults_json: templateForm.defaults_json,
        packaging_json: templateForm.packaging_json,
      };
      await createProductTemplate(payload);
      setShowTemplateModal(false);
      setTemplateForm({
        name: "",
        description: "",
        defaults_json: { gst_percent: 12, schedule_type: "NONE", medicine_type: "Tablet", prescription_required: false },
        packaging_json: { baseUnit: "Tablet", templates: [] },
      });
      const updated = await getProductTemplates();
      setTemplates(updated);
      setSuccess("Template created successfully!");
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      console.error("Create template error:", err);
      setError("Failed to create template");
    }
  };

  const renderWizardStep = () => {
    const type = selectedTemplateUuid
      ? {
          id: selectedTemplateUuid,
          label: selectedTemplateData?.name || "Product",
          icon: "cube",
          description: "",
          medicineDetails: ["strength", "dosage_form", "prescription_required", "storage_condition", "flavor", "bottle_size", "sugar_free"],
          defaultPackaging: { baseUnit: "", templates: [] },
          defaults: { gst: 12 },
        }
      : selectedProductType;
    switch (wizardStep) {
      case 0:
        return (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {PRODUCT_TYPES.map((productType) => (
              <button
                key={productType.id}
                type="button"
                onClick={() => {
                  setSelectedTemplateUuid(null);
                  setWizardData((p) => ({ ...p, productType: productType.id }));
                }}
                className={`border-2 rounded-2xl p-4 text-center transition-all cursor-pointer ${wizardData.productType === productType.id && !selectedTemplateUuid
                  ? "border-emerald-500 bg-emerald-50 shadow-lg shadow-emerald-100"
                  : "border-slate-200 hover:border-slate-300 hover:shadow-md bg-white"
                  }`}
              >
                <IonIcon icon={getIconForType(productType.icon)} className={`text-3xl mb-2 ${wizardData.productType === productType.id && !selectedTemplateUuid ? "text-emerald-600" : "text-slate-500"}`} />
                <p className={`font-semibold text-sm ${wizardData.productType === productType.id && !selectedTemplateUuid ? "text-emerald-700" : "text-slate-700"}`}>{productType.label}</p>
                <p className="text-xs text-slate-400 mt-0.5">{productType.description}</p>
              </button>
            ))}
            {templates.filter((tpl: any) => !PRODUCT_TYPES.some((pt) => pt.label.toLowerCase() === (tpl.name || "").toLowerCase())).map((tpl: any) => (
              <button
                key={tpl.template_uuid}
                type="button"
                onClick={() => {
                  setSelectedTemplateUuid(tpl.template_uuid);
                  setWizardData((p) => ({ ...p, productType: tpl.template_uuid }));
                }}
                className={`border-2 rounded-2xl p-4 text-center transition-all cursor-pointer ${selectedTemplateUuid === tpl.template_uuid
                  ? "border-emerald-500 bg-emerald-50 shadow-lg shadow-emerald-100"
                  : "border-slate-200 hover:border-slate-300 hover:shadow-md bg-white"
                  }`}
              >
                <IonIcon icon={getIconForTemplateName(tpl.name)} className={`text-3xl mb-2 ${selectedTemplateUuid === tpl.template_uuid ? "text-emerald-600" : "text-slate-500"}`} />
                <p className={`font-semibold text-sm ${selectedTemplateUuid === tpl.template_uuid ? "text-emerald-700" : "text-slate-700"}`}>{tpl.name}</p>
                <p className="text-xs text-slate-400 mt-0.5">{tpl.description || tpl.name}</p>
              </button>
            ))}
            <button
              type="button"
              onClick={() => setShowTemplateModal(true)}
              className="border-2 border-dashed border-slate-300 rounded-2xl p-4 text-center transition-all cursor-pointer hover:border-emerald-400 hover:bg-emerald-50/50 hover:shadow-md bg-white"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mx-auto mb-2 text-slate-400">
                <path d="M3.85 8.62a4 4 0 0 1 4.78-4.77 4 4 0 0 1 6.74 0 4 4 0 0 1 4.78 4.78 4 4 0 0 1 0 6.74 4 4 0 0 1-4.77 4.78 4 4 0 0 1-6.75 0 4 4 0 0 1-4.78-4.77 4 4 0 0 1 0-6.76Z" />
                <line x1="12" x2="12" y1="8" y2="16" />
                <line x1="8" x2="16" y1="12" y2="12" />
              </svg>
              <p className="font-semibold text-sm text-slate-500">Create Template</p>
              <p className="text-xs text-slate-400 mt-0.5">Save reusable product config</p>
            </button>
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
        const hasImage = !!wizardData.image;
        return (
          <div className="space-y-5">
            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">Preview</div>
            <div className="border-2 border-gray-200 bg-white text-gray-800 rounded-2xl flex flex-row overflow-hidden justify-center transition-all font-inter max-w-md mx-auto">
              <div className="flex-shrink-0 self-center overflow-hidden rounded-xl aspect-square m-[1%]" style={{ width: '40%' }}>
                {hasImage ? (
                  <img
                    src={wizardData.image}
                    alt={wizardData.name || "Product preview"}
                    className="w-full h-full object-cover"
                    onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; (e.target as HTMLImageElement).parentElement!.querySelector('.fallback')?.classList.remove('hidden'); }}
                  />
                ) : null}
                <div className={`w-full h-full flex items-center justify-center ${hasImage ? 'hidden' : ''} fallback`} style={{ backgroundColor: '#83df1a' }}>
                  <IonIcon icon={medkitOutline} className="text-xl text-white" />
                </div>
              </div>
              <div className="flex-1 min-w-0 px-2.5 py-1.5 flex flex-col justify-start gap-[1px] text-left">
                <div className="font-semibold text-md truncate leading-tight text-gray-900">
                  {wizardData.name || "Product Name"}
                </div>
                {wizardData.manufacturer && (
                  <div className="text-xs truncate leading-tight text-gray-500">
                    {wizardData.manufacturer}
                  </div>
                )}
                <div className="text-sm font-bold text-gray-900">
                  ₹{wizardData.packages?.[0]?.price || "0.00"}
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1.5 uppercase tracking-wide">Product Image (Optional)</label>
              <div className="flex gap-3">
                <input
                  type="url"
                  value={wizardData.image}
                  onChange={(e: any) => setWizardData((p) => ({ ...p, image: e.target.value }))}
                  placeholder="Paste image URL..."
                  className="flex-1 border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-800 bg-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400 transition-all hover:border-slate-300"
                />
                <label className="flex items-center gap-2 px-4 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-600 hover:bg-slate-50 cursor-pointer transition-all">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  Browse
                  <input type="file" accept="image/*" className="hidden" onChange={(e: any) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onload = (ev) => setWizardData((p) => ({ ...p, image: ev.target?.result as string }));
                      reader.readAsDataURL(file);
                    }
                  }} />
                </label>
              </div>
              <p className="text-xs text-slate-400 mt-1.5">Upload or paste an image URL. Recommended: 400×400px</p>
            </div>

            {hasImage && (
              <button
                type="button"
                onClick={() => setWizardData((p) => ({ ...p, image: "" }))}
                className="text-xs text-red-500 hover:text-red-700 flex items-center gap-1 transition-colors"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                Remove image
              </button>
            )}
          </div>
        );
      case 5:
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

const style = document.createElement("style");
style.textContent = `@keyframes fadeInUp { from { opacity: 0; margin-top: 8px; } to { opacity: 1; margin-top: 0; } } .toast-fade { animation: fadeInUp 0.25s ease-out; }`;
document.head.appendChild(style);

  return (
    <div className="min-h-screen bg-[#F8F9FC] p-6 space-y-5">


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
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-4 text-start">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 px-6 py-5 flex items-center gap-6 relative">
          <button onClick={() => setSelectedStat('products')} className="absolute top-2 right-2 w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M7 17L17 7M7 7h10v10" />
            </svg>
          </button>
          <div className="flex-shrink-0">
            <p className="text-xs text-gray-400 mb-0.5">Statistics</p>
            <p className="text-sm font-semibold text-gray-700 mb-3">Total Products</p>
            <p className="text-5xl font-bold text-gray-900 leading-none">{totalProducts}</p>
            <p className="text-xs text-gray-500 mt-1">All registered medicines</p>
          </div>
        </div>
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 px-6 py-5 flex items-center gap-6 relative">
          <button onClick={() => setSelectedStat('inventory')} className="absolute top-2 right-2 w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M7 17L17 7M7 7h10v10" />
            </svg>
          </button>
          <div className="flex-shrink-0">
            <p className="text-xs text-gray-400 mb-0.5">Statistics</p>
            <p className="text-sm font-semibold text-gray-700 mb-3">Inventory Value</p>
            <p className="text-5xl font-bold text-gray-900 leading-none">₹{formatCompactNumber(totalInventoryValue)}</p>
            <p className="text-xs text-gray-500 mt-1">Current stock value</p>
          </div>
        </div>
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 px-6 py-5 flex items-center gap-6 relative">
          <button onClick={() => setSelectedStat('low')} className="absolute top-2 right-2 w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M7 17L17 7M7 7h10v10" />
            </svg>
          </button>
          <div className="flex-shrink-0">
            <p className="text-xs text-gray-400 mb-0.5">Statistics</p>
            <p className="text-sm font-semibold text-gray-700 mb-3">Low Stock</p>
            <p className="text-5xl font-bold text-gray-900 leading-none">{lowStockProducts}</p>
            <p className="text-xs text-gray-500 mt-1">Items need reordering</p>
          </div>
        </div>
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 px-6 py-5 flex items-center gap-6 relative">
          <button onClick={() => setSelectedStat('out')} className="absolute top-2 right-2 w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M7 17L17 7M7 7h10v10" />
            </svg>
          </button>
          <div className="flex-shrink-0">
            <p className="text-xs text-gray-400 mb-0.5">Statistics</p>
            <p className="text-sm font-semibold text-gray-700 mb-3">Out of Stock</p>
            <p className="text-5xl font-bold text-gray-900 leading-none">{outOfStockProducts}</p>
            <p className="text-xs text-gray-500 mt-1">Requires immediate action</p>
          </div>
        </div>
      </div>
      )}

      {/* Products Table Card – using shadcn Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm shadow-slate-100">
        {/* Toolbar */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-slate-100">
          <div className="relative flex-1">
            <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder={t("products.searchPlaceholder")}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-400 transition-all placeholder:text-slate-400"
            />
            {searchTerm && (
              <button onClick={() => setSearchTerm("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-xl transition-all shrink-0 border ${
              hasActiveFilters
                ? "bg-green-600 text-white border-green-600 shadow-md shadow-green-900/20"
                : "bg-white text-slate-700 border-slate-200 hover:border-green-400 hover:text-green-600"
            }`}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
            </svg>
            Filter
            {hasActiveFilters && (
              <span className="w-2 h-2 rounded-full bg-white inline-block" />
            )}
          </button>
          <button
            onClick={() => {
              resetForm();
              setError(null);
              setShowWizard(true);
            }}
            className="flex items-center gap-2 px-4 py-2.5 bg-green-600 hover:bg-green-700 active:scale-[0.98] text-white text-sm font-semibold rounded-xl transition-all shadow-md shadow-green-900/20 shrink-0"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            {t("products.addProduct")}
          </button>
          <Tooltip label="Quarantine expired batches">
            <button
              onClick={handleQuarantineExpired}
              disabled={quarantining}
              className="p-2.5 rounded-xl border border-slate-200 bg-white transition-all text-red-500 hover:bg-red-50 hover:border-red-200 disabled:opacity-40"
            >
              {quarantining ? (
                <Spinner size="sm" />
              ) : (
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                </svg>
              )}
            </button>
          </Tooltip>
          <ShadSelect value={stockFilter} onValueChange={(val) => setStockFilter(val as any)}>
            <SelectTrigger className="max-w-[150px] bg-white border-slate-200 rounded-xl focus:outline-none focus:ring-0">
              <SelectValue placeholder="Filter by stock" />
            </SelectTrigger>
            <SelectContent className="bg-white border-slate-200 rounded-xl overflow-hidden mt-1 font-medium">
              <SelectItem value="all" className="px-4 py-2.5 text-slate-700 focus:bg-slate-50 cursor-pointer">All Products</SelectItem>
              <SelectItem value="in" className="px-4 py-2.5 text-emerald-700 focus:bg-emerald-50 cursor-pointer">In Stock</SelectItem>
              <SelectItem value="low" className="px-4 py-2.5 text-amber-700 focus:bg-amber-50 cursor-pointer">Low Stock</SelectItem>
              <SelectItem value="out" className="px-4 py-2.5 text-red-700 focus:bg-red-50 cursor-pointer">Out of Stock</SelectItem>
            </SelectContent>
          </ShadSelect>
        </div>

        {/* Advanced Filter Panel */}
        {showFilters && (
          <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/50">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Date From</label>
                <div className="relative">
                  <button ref={filterFromBtnRef} type="button" onClick={() => setShowFilterFromPicker(!showFilterFromPicker)}
                    className="flex h-10 w-full items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 hover:border-slate-300 transition-colors">
                    <CalendarIcon className="w-4 h-4 text-slate-400" />
                    <span>{filterFromDate ? format(filterFromDate, "dd MMM yyyy") : "From"}</span>
                  </button>
                  {filterFromDate && (
                    <button onClick={() => setFilterFromDate(undefined)}
                      className="absolute -right-1.5 -top-1.5 w-5 h-5 bg-slate-300 hover:bg-slate-400 text-white rounded-full flex items-center justify-center transition-colors">
                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  )}
                  {showFilterFromPicker && (
                    <div className="fixed z-[70]" style={{ top: filterFromPickPos.top, right: filterFromPickPos.right }}>
                      <SimpleDatePicker date={filterFromDate || new Date()} onSelect={(d) => { setFilterFromDate(d); setShowFilterFromPicker(false); }} />
                    </div>
                  )}
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Date To</label>
                <div className="relative">
                  <button ref={filterToBtnRef} type="button" onClick={() => setShowFilterToPicker(!showFilterToPicker)}
                    className="flex h-10 w-full items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 hover:border-slate-300 transition-colors">
                    <CalendarIcon className="w-4 h-4 text-slate-400" />
                    <span>{filterToDate ? format(filterToDate, "dd MMM yyyy") : "To"}</span>
                  </button>
                  {filterToDate && (
                    <button onClick={() => setFilterToDate(undefined)}
                      className="absolute -right-1.5 -top-1.5 w-5 h-5 bg-slate-300 hover:bg-slate-400 text-white rounded-full flex items-center justify-center transition-colors">
                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  )}
                  {showFilterToPicker && (
                    <div className="fixed z-[70]" style={{ top: filterToPickPos.top, right: filterToPickPos.right }}>
                      <SimpleDatePicker date={filterToDate || new Date()} onSelect={(d) => { setFilterToDate(d); setShowFilterToPicker(false); }} />
                    </div>
                  )}
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Composition</label>
                <input type="text" value={filters.composition} onChange={(e) => setFilters(prev => ({ ...prev, composition: e.target.value }))} placeholder="e.g. Paracetamol"
                  className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-400 placeholder:text-slate-400" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Schedule</label>
                <ShadSelect value={filters.schedule} onValueChange={(v) => setFilters(prev => ({ ...prev, schedule: v === "all" ? "" : v }))}>
                  <SelectTrigger className="bg-white border-slate-200 rounded-xl focus:outline-none focus:ring-0">
                    <SelectValue placeholder="All" />
                  </SelectTrigger>
                  <SelectContent className="bg-white border-slate-200 rounded-xl">
                    <SelectItem value="all">All</SelectItem>
                    {SCHEDULE_TYPES.map(s => (
                      <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                    ))}
                  </SelectContent>
                </ShadSelect>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">GST (%)</label>
                <ShadSelect value={filters.gst} onValueChange={(v) => setFilters(prev => ({ ...prev, gst: v === "all" ? "" : v }))}>
                  <SelectTrigger className="bg-white border-slate-200 rounded-xl focus:outline-none focus:ring-0">
                    <SelectValue placeholder="All" />
                  </SelectTrigger>
                  <SelectContent className="bg-white border-slate-200 rounded-xl">
                    <SelectItem value="all">All</SelectItem>
                    {GST_OPTIONS.map(g => (
                      <SelectItem key={g.value} value={g.value}>{g.label}</SelectItem>
                    ))}
                  </SelectContent>
                </ShadSelect>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">MRP Range</label>
                <div className="flex items-center gap-1.5">
                  <input type="number" value={filters.mrpMin} onChange={(e) => setFilters(prev => ({ ...prev, mrpMin: e.target.value }))} placeholder="Min" className="w-full px-2 py-2 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-400 placeholder:text-slate-400" />
                  <span className="text-slate-400 text-xs">-</span>
                  <input type="number" value={filters.mrpMax} onChange={(e) => setFilters(prev => ({ ...prev, mrpMax: e.target.value }))} placeholder="Max" className="w-full px-2 py-2 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-400 placeholder:text-slate-400" />
                </div>
              </div>
            </div>
            <div className="flex justify-end mt-3">
              <button onClick={() => { setFilters({ dateFrom: "", dateTo: "", composition: "", schedule: "", gst: "", mrpMin: "", mrpMax: "" }); setFilterFromDate(undefined); setFilterToDate(undefined); }}
                className="text-xs font-medium text-slate-500 hover:text-red-600 transition-colors px-3 py-1.5">
                Clear all filters
              </button>
            </div>
          </div>
        )}

        {/* Bulk Action Bar */}
        {selectedRows.size > 0 && (
          <div className="flex items-center gap-3 px-5 py-3 bg-blue-50 border-b border-blue-100">
            <span className="text-sm font-medium text-blue-700">{selectedRows.size} selected</span>
            <div className="flex items-center gap-2 ml-auto">
              <button
                onClick={() => setDeleteConfirm({ count: selectedRows.size })}
                className="px-3 py-1.5 text-xs font-medium text-red-600 bg-white border border-red-200 rounded-lg hover:bg-red-50 transition-colors"
              >
                Delete
              </button>
              <button onClick={() => setSelectedRows(new Set())} className="p-1.5 text-slate-400 hover:text-slate-600">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        )}

        {/* Table – shadcn Table with always-visible action buttons */}
        <div className="overflow-x-auto">
          <Table className="min-w-[800px]">
            <TableHeader>
              <TableRow className="bg-slate-50 border-b border-slate-200">
                {/* Checkbox column - left */}
                <TableHead className="w-10 text-left">
                  <input
                    type="checkbox"
                    checked={selectedRows.size === filteredProducts.length && filteredProducts.length > 0}
                    onChange={toggleAll}
                    className="w-4 h-4 rounded border-slate-300 text-blue-600 cursor-pointer"
                  />
                </TableHead>
                {[
                  { field: "name", label: "Product", sortable: true, align: "left" },
                  { field: "composition", label: "Composition", sortable: true, align: "left" },
                  { field: "schedule_type", label: "Schedule", sortable: false, align: "left" },
                  { field: "gst_percent", label: "GST", sortable: false, align: "left" },
                  { field: "price", label: "MRP", sortable: true, align: "right" },
                  { field: "stock", label: "Stock", sortable: true, align: "right" },
                  { field: "status", label: "Status", sortable: false, align: "center" },
                ].map(({ field, label, sortable, align }) => (
                  <TableHead
                    key={field}
                    onClick={sortable ? () => handleSort(field) : undefined}
                    className={`text-[11px] font-semibold text-slate-500 uppercase tracking-wider ${sortable ? "cursor-pointer hover:text-slate-700 select-none" : ""
                      } ${align === "right" ? "text-right" : align === "center" ? "text-center" : "text-left"}`}
                  >
                    <div className={`flex items-center ${align === "right" ? "justify-end" : align === "center" ? "justify-center" : "justify-start"}`}>
                      {label}
                      {sortable && <SortIcon field={field} />}
                    </div>
                  </TableHead>
                ))}
                <TableHead className="text-right text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredProducts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-16">
                    {/* empty state content unchanged */}
                  </TableCell>
                </TableRow>
              ) : (
                paginatedProducts.map((p) => {
                  const batchInfoItem = batchInfo[p.product_uuid];
                  const isNearExpiry = batchInfoItem?.nearestExpiryDays !== null && batchInfoItem?.nearestExpiryDays <= 90 && batchInfoItem?.nearestExpiryDays > 0;
                  const isOutOfStock = p.stock === 0;
                  const isLowStock = p.stock > 0 && p.stock <= 10;
                  const isSelected = selectedRows.has(p.product_uuid);
                  return (
                    <TableRow key={p.product_uuid} className={`border-b border-slate-100 hover:bg-slate-50/80 transition-colors ${isSelected ? "bg-blue-50/60" : ""}`}>
                      {/* Checkbox */}
                      <TableCell className="w-10 text-left">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleRow(p.product_uuid)}
                          className="w-4 h-4 rounded border-slate-300 text-blue-600 cursor-pointer"
                        />
                      </TableCell>
                      {/* Product */}
                      <TableCell className="text-left">
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
                          {batchInfoItem?.hasExpiredStock && (
                            <span className="text-[10px] bg-red-100 text-red-700 px-1.5 py-0.5 rounded flex items-center gap-1">
                              <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                              </svg>
                              {batchInfoItem.expiredCount} expired
                            </span>
                          )}
                        </div>
                      </TableCell>
                      {/* Composition */}
                      <TableCell className="text-left max-w-[160px]">
                        <span className="text-xs text-slate-500 italic line-clamp-2">{p.composition || "—"}</span>
                      </TableCell>
                      {/* Schedule */}
                      <TableCell className="text-left">
                        {p.schedule_type && p.schedule_type !== "NONE" ? (
                          <Badge variant="schedule">Sch {p.schedule_type}</Badge>
                        ) : (
                          <Badge variant="otc">OTC</Badge>
                        )}
                      </TableCell>
                      {/* GST */}
                      <TableCell className="text-left">
                        <span className="text-xs font-mono text-slate-500">{p.gst_percent || 0}%</span>
                      </TableCell>
                      {/* MRP */}
                      <TableCell className="text-right">
                        <span className="font-semibold text-sm text-slate-800">₹{p.price?.toLocaleString()}</span>
                      </TableCell>
                      {/* Stock */}
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <span className={`font-semibold text-sm ${isOutOfStock ? "text-red-500" : isLowStock ? "text-amber-600" : "text-slate-700"}`}>
                            {p.stock ?? 0}
                          </span>
                          <span className="text-xs text-slate-400">{p.unit}s</span>
                        </div>
                        {batchInfoItem && batchInfoItem.batchCount > 0 && batchInfoItem.totalAvailable !== p.stock && (
                          <div className="text-xs text-slate-400 mt-0.5">({batchInfoItem.totalAvailable} in batches)</div>
                        )}
                      </TableCell>
                      {/* Status */}
                      <TableCell className="text-center">
                        {isOutOfStock ? (
                          <Badge variant="danger">Out of Stock</Badge>
                        ) : isLowStock ? (
                          <Badge variant="warning">Low Stock</Badge>
                        ) : (
                          <Badge variant="success">In Stock</Badge>
                        )}
                      </TableCell>
                      {/* Actions */}
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Tooltip label="Edit">
                            <button
                              onClick={() => {
                                handleEdit(p);
                                loadBatchInfo(p.product_uuid);
                              }}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium text-blue-700 bg-blue-50 border border-blue-200 hover:bg-blue-100 transition-colors"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-pencil"><path d="M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z"/><path d="m15 5 4 4"/></svg>
                              Edit
                            </button>
                          </Tooltip>

                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>

        {/* Footer */}
        {filteredProducts.length > 0 && (
          <div className="px-5 py-3.5 border-t border-slate-100 flex items-center justify-between">
            <p className="text-xs text-slate-400">Showing {(pageP - 1) * pageSize + 1}–{Math.min(pageP * pageSize, filteredProducts.length)} of {filteredProducts.length} products</p>
            {totalPages > 1 && (
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setPageP(p => Math.max(1, p - 1))}
                  disabled={pageP === 1}
                  className="px-3 py-1.5 text-xs font-medium rounded-lg text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  Prev
                </button>
                {(() => {
                  const pages: (number | string)[] = [];
                  const range = 2;
                  for (let i = 1; i <= totalPages; i++) {
                    if (i === 1 || i === totalPages || (i >= pageP - range && i <= pageP + range)) {
                      pages.push(i);
                    } else if (pages[pages.length - 1] !== '...') {
                      pages.push('...');
                    }
                  }
                  return pages.map((p, idx) =>
                    p === '...' ? (
                      <span key={`e-${idx}`} className="px-1 text-xs text-slate-400">…</span>
                    ) : (
                      <button
                        key={p}
                        onClick={() => setPageP(p as number)}
                        className={`w-8 h-8 text-xs font-medium rounded-lg transition-colors ${
                          p === pageP
                            ? 'bg-emerald-600 text-white'
                            : 'text-slate-600 hover:bg-slate-100'
                        }`}
                      >
                        {p}
                      </button>
                    )
                  );
                })()}
                <button
                  onClick={() => setPageP(p => Math.min(totalPages, p + 1))}
                  disabled={pageP === totalPages}
                  className="px-3 py-1.5 text-xs font-medium rounded-lg text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  Next
                </button>
              </div>
            )}
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <span className="flex items-center gap-1.5"><span className="w-2 h-2 bg-emerald-400 rounded-full" />In Stock</span>
              <span className="flex items-center gap-1.5"><span className="w-2 h-2 bg-amber-400 rounded-full" />Low Stock</span>
              <span className="flex items-center gap-1.5"><span className="w-2 h-2 bg-red-400 rounded-full" />Out of Stock</span>
            </div>
          </div>
        )}
      </div>

      {/* Wizard Modal */}
      {showWizard && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={(e) => { if (e.target === e.currentTarget) { setMissClickHint(true); setTimeout(() => setMissClickHint(false), 3000); } }}>
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
            {wizardError && (
              <div className="mx-6 mb-2 flex items-center gap-2 px-4 py-2.5 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
                <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                {wizardError}
              </div>
            )}
            <div className="flex items-center justify-between gap-3 px-6 py-4 border-t border-slate-100 bg-slate-50/50">
              <button
                onClick={() => { setWizardStep(Math.max(0, wizardStep - 1)); setWizardError(null); }}
                disabled={wizardStep === 0}
                className="px-4 py-2.5 text-sm font-medium text-slate-600 border border-slate-200 bg-white rounded-xl hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              >
                ← Previous
              </button>
              <div className="flex items-center gap-1.5">
                {wizardSteps.map((_, i) => (
                  <div
                    key={i}
                    className={`rounded-full transition-all ${i === wizardStep ? "w-5 h-1.5 bg-emerald-500" : i < wizardStep ? "w-1.5 h-1.5 bg-emerald-400" : "w-1.5 h-1.5 bg-slate-200"
                      }`}
                  />
                ))}
              </div>
              {wizardStep < wizardSteps.length - 1 ? (
                <button
                  onClick={handleNext}
                  className="px-4 py-2.5 text-sm font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl transition-all shadow-md shadow-emerald-200"
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
          {missClickHint && (
            <div className="fixed bottom-6 left-0 right-0 flex justify-center z-[70] pointer-events-none">
              <div className="px-4 py-2.5 bg-emerald-600 text-white text-sm rounded-xl toast-fade">
                Miss-click prevention — click ✕ to close
              </div>
            </div>
          )}
        </div>
      )}

      {/* Edit / Quick Add Form Modal */}
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

              {editing && (
                <div className="border-2 border-dashed border-red-300 rounded-xl p-4 bg-red-50/50">
                  <div className="flex items-center gap-2 mb-2">
                    <svg className="w-4 h-4 text-red-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    <p className="text-xs font-semibold text-red-700 uppercase tracking-wide">Danger Zone</p>
                  </div>
                  <p className="text-xs text-red-600 mb-3">Deleting this product will remove it permanently. This action cannot be undone.</p>
                  <button
                    onClick={() => {
                      const uuid = editing.product_uuid || editing.uuid;
                      const product = products.find((p) => p.product_uuid === uuid);
                      setDeleteConfirm({ uuid, name: product?.name || "this product" });
                    }}
                    disabled={deleting === (editing.product_uuid || editing.uuid)}
                    className="w-full flex items-center justify-center gap-2 py-2.5 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold rounded-xl transition-all disabled:opacity-50"
                  >
                    {deleting === (editing.product_uuid || editing.uuid) ? (
                      <Spinner size="sm" />
                    ) : (
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    )}
                    {deleting === (editing.product_uuid || editing.uuid) ? "Deleting…" : "Delete Product"}
                  </button>
                </div>
              )}
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

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md border border-slate-200">
            <div className="px-6 py-4 border-b border-slate-200">
              <h2 className="text-lg font-bold text-slate-800 text-left">Delete Product</h2>
            </div>
            <div className="p-6">
              <p className="text-slate-600 text-sm text-left">
                {"uuid" in deleteConfirm
                  ? `Are you sure you want to delete "${deleteConfirm.name}"? This action cannot be undone.`
                  : `Are you sure you want to delete ${deleteConfirm.count} selected product(s)? This action cannot be undone.`}
              </p>
            </div>
            <div className="border-t border-slate-200 px-6 py-4 flex justify-end gap-3 bg-white rounded-b-2xl">
              <Button variant="outline" onClick={() => setDeleteConfirm(null)} className="border-slate-300 text-slate-700 hover:bg-slate-100">
                Cancel
              </Button>
              <Button onClick={() => deleteConfirm && confirmDelete(deleteConfirm)} className="bg-red-600 hover:bg-red-700 text-white shadow-md shadow-red-900/20">
                Delete
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Quarantine Confirmation Modal */}
      {showQuarantineConfirm && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md border border-slate-200">
            <div className="px-6 py-4 border-b border-slate-200">
              <h2 className="text-lg font-bold text-slate-800 text-left">Quarantine Expired Batches</h2>
            </div>
            <div className="p-6">
              <p className="text-slate-600 text-sm text-left">All expired batches will be removed from the available stock. This action cannot be undone.</p>
            </div>
            <div className="border-t border-slate-200 px-6 py-4 flex justify-end gap-3 bg-white rounded-b-2xl">
              <Button variant="outline" onClick={() => setShowQuarantineConfirm(false)} className="border-slate-300 text-slate-700 hover:bg-slate-100">
                Cancel
              </Button>
              <Button onClick={confirmQuarantine} className="bg-red-600 hover:bg-red-700 text-white shadow-md shadow-red-900/20">
                Quarantine
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Template Creation Modal */}
      {showTemplateModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[60] p-4" onClick={(e) => e.target === e.currentTarget && setShowTemplateModal(false)}>
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto border border-slate-200">
            <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-600">
                    <path d="M3.85 8.62a4 4 0 0 1 4.78-4.77 4 4 0 0 1 6.74 0 4 4 0 0 1 4.78 4.78 4 4 0 0 1 0 6.74 4 4 0 0 1-4.77 4.78 4 4 0 0 1-6.75 0 4 4 0 0 1-4.78-4.77 4 4 0 0 1 0-6.76Z" />
                    <line x1="12" x2="12" y1="8" y2="16" />
                    <line x1="8" x2="16" y1="12" y2="12" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900">Create Template</h2>
                  <p className="text-xs text-slate-500 mt-0.5">Save a reusable product configuration</p>
                </div>
              </div>
              <button onClick={() => setShowTemplateModal(false)} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-all">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-6 space-y-5">
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1.5 uppercase tracking-wide">Template Name *</label>
                <input
                  value={templateForm.name}
                  onChange={(e) => setTemplateForm((p) => ({ ...p, name: e.target.value }))}
                  placeholder="e.g. Capsule"
                  className="w-full h-10 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-500/20 transition-all outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1.5 uppercase tracking-wide">Sub Heading</label>
                <input
                  value={templateForm.description}
                  onChange={(e) => setTemplateForm((p) => ({ ...p, description: e.target.value }))}
                  placeholder="e.g. Solid oral capsule"
                  className="w-full h-10 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-500/20 transition-all outline-none"
                />
              </div>

              <div className="border-t border-slate-100 pt-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Pre-filled Defaults</h3>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] text-slate-400">Quick fill:</span>
                    <select
                      onChange={(e) => { if (e.target.value) handleTemplatePreFill(e.target.value); e.target.value = ""; }}
                      className="h-8 rounded-lg border border-slate-200 bg-white px-3 text-xs text-slate-600 outline-none cursor-pointer hover:border-slate-300 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-500/20 transition-all appearance-none"
                      style={{
                        backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%239ca3af' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E\")",
                        backgroundRepeat: "no-repeat",
                        backgroundPosition: "right 8px center",
                        paddingRight: "28px",
                      }}
                    >
                      <option value="">Select type…</option>
                      {PRODUCT_TYPES.map((pt) => (
                        <option key={pt.id} value={pt.id}>{pt.label}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1.5">GST Rate</label>
                    <Select
                      value={String(templateForm.defaults_json.gst_percent)}
                      onChange={(v: string) => setTemplateForm((p) => ({ ...p, defaults_json: { ...p.defaults_json, gst_percent: Number(v) } }))}
                      options={GST_OPTIONS}
                      placeholder="Select GST rate"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1.5">Schedule</label>
                    <Select
                      value={templateForm.defaults_json.schedule_type}
                      onChange={(v: string) => setTemplateForm((p) => ({ ...p, defaults_json: { ...p.defaults_json, schedule_type: v } }))}
                      options={SCHEDULE_TYPES}
                      placeholder="Select schedule"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1.5">Medicine Type</label>
                    <Select
                      value={templateForm.defaults_json.medicine_type}
                      onChange={(v: string) => setTemplateForm((p) => ({ ...p, defaults_json: { ...p.defaults_json, medicine_type: v } }))}
                      options={MEDICINE_TYPES.map((t: string) => ({ value: t, label: t }))}
                      placeholder="Select type…"
                    />
                  </div>
                  <div className="flex items-end pb-1.5">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={templateForm.defaults_json.prescription_required}
                        onChange={(e) => setTemplateForm((p) => ({ ...p, defaults_json: { ...p.defaults_json, prescription_required: e.target.checked } }))}
                        className="w-4 h-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                      />
                      <span className="text-xs text-slate-600">Prescription Required</span>
                    </label>
                  </div>
                </div>
              </div>

              <div className="border-t border-slate-100 pt-4">
                <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Packaging Defaults</h3>
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Base Unit</label>
                  <input
                    value={templateForm.packaging_json.baseUnit}
                    onChange={(e) => setTemplateForm((p) => ({ ...p, packaging_json: { ...p.packaging_json, baseUnit: e.target.value } }))}
                    placeholder="e.g. Tablet"
                    className="w-full h-9 rounded-lg border border-slate-200 bg-slate-50 px-3 text-xs text-slate-900 placeholder-slate-400 outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-500/20 transition-all mb-3"
                  />
                </div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Pack Sizes</label>
                {templateForm.packaging_json.templates.map((pkg, idx) => (
                  <div key={idx} className="flex items-center gap-2 mb-2">
                    <input
                      value={pkg.name}
                      onChange={(e) => {
                        const updated = [...templateForm.packaging_json.templates];
                        updated[idx] = { ...updated[idx], name: e.target.value };
                        setTemplateForm((p) => ({ ...p, packaging_json: { ...p.packaging_json, templates: updated } }));
                      }}
                      placeholder="Name"
                      className="flex-1 h-9 rounded-lg border border-slate-200 bg-slate-50 px-3 text-xs text-slate-900 outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-500/20 transition-all"
                    />
                    <input
                      type="number"
                      value={pkg.contains}
                      onChange={(e) => {
                        const updated = [...templateForm.packaging_json.templates];
                        updated[idx] = { ...updated[idx], contains: Number(e.target.value) };
                        setTemplateForm((p) => ({ ...p, packaging_json: { ...p.packaging_json, templates: updated } }));
                      }}
                      placeholder="Qty"
                      className="w-16 h-9 rounded-lg border border-slate-200 bg-slate-50 px-2 text-xs text-slate-900 outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-500/20 transition-all"
                    />
                    <input
                      value={pkg.unit}
                      onChange={(e) => {
                        const updated = [...templateForm.packaging_json.templates];
                        updated[idx] = { ...updated[idx], unit: e.target.value };
                        setTemplateForm((p) => ({ ...p, packaging_json: { ...p.packaging_json, templates: updated } }));
                      }}
                      placeholder="Unit"
                      className="flex-1 h-9 rounded-lg border border-slate-200 bg-slate-50 px-3 text-xs text-slate-900 outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-500/20 transition-all"
                    />
                  </div>
                ))}
              </div>
            </div>

            <div className="border-t border-slate-100 px-6 py-4 flex justify-end gap-3 bg-slate-50/50 rounded-b-3xl">
              <button
                onClick={() => setShowTemplateModal(false)}
                className="px-4 py-2.5 text-sm font-medium text-slate-600 border border-slate-200 bg-white rounded-xl hover:bg-slate-50 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateTemplate}
                className="px-4 py-2.5 text-sm font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl transition-all shadow-md shadow-emerald-200"
              >
                Save Template
              </button>
            </div>
          </div>
        </div>
      )}

      {selectedStat && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4" onClick={() => setSelectedStat(null)}>
          <div className="w-[400px] h-[500px] rounded-[24px] overflow-hidden pt-5 px-5 pb-3 flex flex-col" style={{ background: "#1a1d1f" }} onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-end mb-1">
              <button onClick={() => setSelectedStat(null)} className="text-xs font-semibold px-3 py-1 rounded-full" style={{ background: "#dc2626", color: "#fff" }}>
                Close
              </button>
            </div>

            {selectedStat === 'products' && (
              <>
                <div className="flex-1 flex flex-col justify-center text-center px-4">
                  <p className="text-base" style={{ color: "#888888" }}>Total Products</p>
                  <p className="text-5xl font-bold leading-none tracking-tight text-white mt-3">{totalProducts.toLocaleString()}</p>
                  <span className="inline-block text-sm font-semibold px-4 py-1.5 rounded-full mt-3 mx-auto" style={{ background: "#3b82f6", color: "#fff" }}>
                    All Products
                  </span>
                </div>
                <div className="relative -mx-5 -mb-3" style={{ height: 180 }}>
                  <Sparkline data={trendData.products} width={400} height={180} color="#3b82f6" />
                </div>
              </>
            )}

            {selectedStat === 'inventory' && (
              <>
                <div className="flex-1 flex flex-col justify-center text-center px-4">
                  <p className="text-base" style={{ color: "#888888" }}>Inventory Value</p>
                  <p className="text-5xl font-bold leading-none tracking-tight text-white mt-3">₹{Math.round(totalInventoryValue).toLocaleString()}</p>
                  <span className="inline-block text-sm font-semibold px-4 py-1.5 rounded-full mt-3 mx-auto" style={{ background: "#8b5cf6", color: "#fff" }}>
                    Stock Value
                  </span>
                </div>
                <div className="relative -mx-5 -mb-3" style={{ height: 180 }}>
                  <Sparkline data={trendData.inventory} width={400} height={180} color="#8b5cf6" />
                </div>
              </>
            )}

            {selectedStat === 'low' && (
              <>
                <div className="flex-1 flex flex-col justify-center text-center px-4">
                  <p className="text-base" style={{ color: "#888888" }}>Low Stock</p>
                  <p className="text-5xl font-bold leading-none tracking-tight text-white mt-3">{lowStockProducts.toLocaleString()}</p>
                  <span className="inline-block text-sm font-semibold px-4 py-1.5 rounded-full mt-3 mx-auto" style={{ background: "#f59e0b", color: "#fff" }}>
                    Needs Reorder
                  </span>
                </div>
                <div className="relative -mx-5 -mb-3" style={{ height: 180 }}>
                  <Sparkline data={trendData.low} width={400} height={180} color="#f59e0b" />
                </div>
              </>
            )}

            {selectedStat === 'out' && (
              <>
                <div className="flex-1 flex flex-col justify-center text-center px-4">
                  <p className="text-base" style={{ color: "#888888" }}>Out of Stock</p>
                  <p className="text-5xl font-bold leading-none tracking-tight text-white mt-3">{outOfStockProducts.toLocaleString()}</p>
                  <span className="inline-block text-sm font-semibold px-4 py-1.5 rounded-full mt-3 mx-auto" style={{ background: "#ef4444", color: "#fff" }}>
                    Immediate Action
                  </span>
                </div>
                <div className="relative -mx-5 -mb-3" style={{ height: 180 }}>
                  <Sparkline data={trendData.out} width={400} height={180} color="#ef4444" />
                </div>
              </>
            )}

          </div>
        </div>
      )}

    </div>
  );
}
