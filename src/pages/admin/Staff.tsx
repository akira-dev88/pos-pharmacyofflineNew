import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  getStaff,
  createStaff,
  updateStaff,
  deleteStaff,
  type Staff,
} from "../../renderer/services/staffApi";
import { IonIcon } from "@ionic/react";
import {
  addOutline,
  createOutline,
  trashOutline,
  searchOutline,
  closeOutline,
  peopleOutline,
  mailOutline,
  keyOutline,
  checkmarkCircleOutline,
  warningOutline,
  refreshOutline,
} from "ionicons/icons";

// shadcn/ui components (only those that work)
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// ── Reusable StatCard
const StatCard = ({ label, value, gradient, icon }: any) => (
  <div className={`relative overflow-hidden rounded-2xl p-5 ${gradient} group cursor-default text-white min-w-0`}>
    <div className="flex items-start justify-between gap-2">
      <div className="min-w-0">
        <p className="text-xs font-semibold uppercase tracking-wider opacity-80 mb-1 truncate">{label}</p>
        <p className="text-2xl sm:text-3xl font-bold mt-0.5 truncate">{value}</p>
      </div>
      <div className="p-2.5 rounded-xl bg-white/15 backdrop-blur-sm flex items-center justify-center shrink-0">
        {icon}
      </div>
    </div>
    <div className="absolute -bottom-4 -right-4 w-24 h-24 rounded-full bg-white/5 group-hover:bg-white/10 transition-colors" />
  </div>
);

export default function StaffPage() {
  const { t } = useTranslation();
  const [staff, setStaff] = useState<Staff[]>([]);
  const [editing, setEditing] = useState<Staff | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "cashier",
  });

  useEffect(() => {
    loadStaff();
  }, []);

  const loadStaff = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getStaff();
      setStaff(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Load staff error:", err);
      setError(t('staff.loadError'));
      setStaff([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!form.name || !form.email || !form.password) {
      setError(t('staff.validationRequired'));
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await createStaff(form);
      await loadStaff();
      setSuccess(t('staff.createSuccess'));
      setTimeout(() => setSuccess(null), 3000);
      resetForm();
      setModalOpen(false);
    } catch (err) {
      console.error("Create staff error:", err);
      setError(t('staff.createError'));
    } finally {
      setLoading(false);
    }
  };

  const startEdit = (s: Staff) => {
    setEditing(s);
    setForm({
      name: s.name,
      email: s.email,
      password: "",
      role: s.role,
    });
    setModalOpen(true);
  };

  const handleUpdate = async () => {
    if (!editing) return;

    setLoading(true);
    setError(null);

    try {
      await updateStaff(editing.user_uuid, form);
      await loadStaff();
      setSuccess(t('staff.updateSuccess'));
      setTimeout(() => setSuccess(null), 3000);
      resetForm();
      setModalOpen(false);
    } catch (err) {
      console.error("Update staff error:", err);
      setError(t('staff.updateError'));
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (uuid: string) => {
    if (!confirm(t('staff.deleteConfirm'))) return;

    setLoading(true);
    setError(null);

    try {
      await deleteStaff(uuid);
      await loadStaff();
      setSuccess(t('staff.deleteSuccess'));
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      console.error("Delete staff error:", err);
      setError(t('staff.deleteError'));
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setEditing(null);
    setForm({
      name: "",
      email: "",
      password: "",
      role: "cashier",
    });
  };

  const filteredStaff = staff.filter((s) =>
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalStaff = staff.length;
  const managers = staff.filter((s) => s.role === "manager").length;
  const cashiers = staff.filter((s) => s.role === "cashier").length;

  return (
    <div className="min-h-screen bg-[#F8F9FC] p-6 space-y-5">
      {/* Header */}
      <div className="flex justify-between items-center flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight text-start">{t('staff.title')}</h1>
          <p className="text-slate-500 text-sm mt-0.5">{t('staff.subtitle')}</p>
        </div>
        <Button onClick={() => { resetForm(); setModalOpen(true); }} className="gap-2 bg-green-600 hover:bg-green-700 text-white">
          <IonIcon icon={addOutline} className="text-xl" />
          {t('staff.addStaff')}
        </Button>
      </div>

      {/* Success/Error Messages */}
      {success && (
        <Card className="border-emerald-200 bg-emerald-50">
          <CardContent className="p-4 flex items-center gap-2 text-emerald-700">
            <IonIcon icon={checkmarkCircleOutline} className="text-xl" />
            <p className="text-sm">{success}</p>
          </CardContent>
        </Card>
      )}
      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-4 flex justify-between items-center">
            <div className="flex items-center gap-2 text-red-700">
              <IonIcon icon={warningOutline} className="text-xl" />
              <p className="text-sm">{error}</p>
            </div>
            <button onClick={() => setError(null)} className="text-red-500 hover:text-red-700">
              <IonIcon icon={closeOutline} className="text-lg" />
            </button>
          </CardContent>
        </Card>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard
          label={t('staff.totalStaff')}
          value={totalStaff}
          gradient="bg-gradient-to-br from-purple-500 to-purple-700"
          icon={<IonIcon icon={peopleOutline} className="w-5 h-5 text-white" />}
        />
        <StatCard
          label={t('staff.managers')}
          value={managers}
          gradient="bg-gradient-to-br from-blue-500 to-blue-700"
          icon={<IonIcon icon={peopleOutline} className="w-5 h-5 text-white" />}
        />
        <StatCard
          label={t('staff.cashiers')}
          value={cashiers}
          gradient="bg-gradient-to-br from-emerald-500 to-emerald-700"
          icon={<IonIcon icon={peopleOutline} className="w-5 h-5 text-white" />}
        />
      </div>

      {/* Search Bar */}
      <div className="relative">
        <IonIcon icon={searchOutline} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-lg" />
        <Input
          placeholder={t('staff.searchPlaceholder')}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-11 pr-10 py-2.5 bg-white border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all"
        />
        {searchTerm && (
          <button
            onClick={() => setSearchTerm("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
          >
            <IonIcon icon={closeOutline} className="text-lg" />
          </button>
        )}
      </div>

      {/* Staff Table */}
      <Card className="border-slate-200 shadow-sm bg-white overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-slate-700 to-slate-800 rounded-t-2xl">
          <CardTitle className="flex items-center gap-2 text-white">
            <IonIcon icon={peopleOutline} className="text-xl" />
            {t('staff.staffMembers')} ({filteredStaff.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50 border-b border-slate-200">
                  <TableHead className=" text-slate-600 min-w-[180px]">{t('staff.tableStaffMember')}</TableHead>
                  <TableHead className=" text-slate-600 min-w-[200px]">{t('staff.tableContact')}</TableHead>
                  <TableHead className=" text-slate-600 min-w-[120px]">{t('staff.tableRole')}</TableHead>
                  <TableHead className=" text-slate-600 min-w-[100px]">{t('staff.tableStatus')}</TableHead>
                  <TableHead className=" text-slate-600 min-w-[100px]">{t('staff.tableActions')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading && staff.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-12">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto" />
                    </TableCell>
                  </TableRow>
                ) : filteredStaff.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-12 text-slate-500">
                      <div className="flex flex-col items-center gap-2">
                        <IonIcon icon={peopleOutline} className="text-6xl text-slate-300" />
                        <p className="text-lg">{t('staff.noStaff')}</p>
                        <p className="text-sm">{searchTerm ? t('staff.noSearchResults') : t('staff.noStaffSubtext')}</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredStaff.map((s) => (
                    <TableRow key={s.user_uuid} className="border-b border-slate-100 hover:bg-slate-50/80 transition-colors">
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-semibold">
                            {s.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-medium text-slate-800">{s.name}</div>
                            <div className="text-xs text-slate-400 font-mono">
                              {t('staff.idLabel')}: {s.user_uuid?.slice(0, 8)}...
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-sm text-slate-600">
                          <IonIcon icon={mailOutline} className="text-xs" />
                          <span>{s.email}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-start">
                        <Badge variant="secondary" className={s.role === "manager"
                          ? "bg-purple-100 text-purple-700 hover:bg-purple-100 border-purple-200"
                          : "bg-blue-100 text-blue-700 hover:bg-blue-100 border-blue-200"
                        }>
                          <IonIcon icon={peopleOutline} className="text-xs mr-1" />
                          {s.role === "manager" ? t('staff.roleManager') : t('staff.roleCashier')}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-start">
                        <Badge variant="secondary" className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 border-emerald-200">
                          <IonIcon icon={checkmarkCircleOutline} className="text-xs mr-1" />
                          {t('staff.activeStatus')}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-start">
                        <div className="flex items-start justify-start gap-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => startEdit(s)}
                            className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                            title={t('staff.editTitle')}
                          >
                            <IonIcon icon={createOutline} className="text-lg" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDelete(s.user_uuid)}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            title={t('staff.deleteTitle')}
                          >
                            <IonIcon icon={trashOutline} className="text-lg" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Custom Modal (Reliable + Premium Dark) */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-[#171717] rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto border border-gray-700">
            <div className="sticky top-0 bg-[#171717] backdrop-blur-sm border-b border-gray-700 px-6 py-4 flex justify-between items-center">
              <div>
                <div className="flex items-center gap-2">
                  <IonIcon icon={peopleOutline} className="text-gray-400 text-xl" />
                  <h2 className="text-xl font-bold text-white">
                    {editing ? t('staff.editStaff') : t('staff.addNewStaff')}
                  </h2>
                </div>
                <p className="text-gray-400 text-sm mt-1">
                  {editing ? t('staff.editSubtext') : t('staff.createSubtext')}
                </p>
              </div>
              <button onClick={() => { setModalOpen(false); resetForm(); }} className="text-gray-400 hover:text-gray-200">
                <IonIcon icon={closeOutline} className="text-2xl" />
              </button>
            </div>

            <div className="p-6 space-y-5">
              <div>
                <label className="block text-sm font-bold text-start text-gray-300 mb-1.5">
                  {t('staff.fullNameLabel')} *
                </label>
                <Input
                  placeholder={t('staff.namePlaceholder')}
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="h-10 w-full min-w-0 rounded-lg border border-input bg-transparent px-2.5 py-1 text-base transition-colors outline-none file:inline-flex file:h-6 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-input/50 disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 md:text-sm dark:bg-input/30 dark:disabled:bg-input/80 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-start text-gray-300 mb-1.5">
                  {t('staff.emailLabel')} *
                </label>
                <Input
                  type="email"
                  placeholder="staff@example.com"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="h-10 w-full min-w-0 rounded-lg border border-input bg-transparent px-2.5 py-1 text-base transition-colors outline-none file:inline-flex file:h-6 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-input/50 disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 md:text-sm dark:bg-input/30 dark:disabled:bg-input/80 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-start text-gray-300 mb-1.5">
                  {editing ? t('staff.passwordEditLabel') : t('staff.passwordLabel')}
                </label>
                <Input
                  type="password"
                  placeholder={editing ? t('staff.passwordEditPlaceholder') : t('staff.passwordPlaceholder')}
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  className="h-10 w-full min-w-0 rounded-lg border border-input bg-transparent px-2.5 py-1 text-base transition-colors outline-none file:inline-flex file:h-6 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-input/50 disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 md:text-sm dark:bg-input/30 dark:disabled:bg-input/80 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-start text-gray-300 mb-1.5">
                  {t('staff.roleLabel')} *
                </label>
                <Select value={form.role} onValueChange={(val) => setForm({ ...form, role: val })}>
                  <SelectTrigger
                    className="h-10 w-full min-w-0 rounded-lg border border-input bg-transparent px-2.5 py-1 text-base transition-colors outline-none focus:outline-none focus:ring-0 focus-visible:outline-none focus-visible:ring-0 disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-input/50 disabled:opacity-50 dark:bg-input/30 dark:disabled:bg-input/80"
                  >
                    <SelectValue placeholder={t('staff.selectRole')} />
                  </SelectTrigger>
                  <SelectContent
                    className="border-gray-700 bg-[#171717] p-1 mt-1"
                    style={{ width: 'var(--radix-select-trigger-width)' }}
                  >
                    <SelectItem value="cashier" className="text-gray-200 rounded-md p-1 font-bold font-inter focus:bg-gray-700">{t('staff.roleCashier')}</SelectItem>
                    <SelectItem value="manager" className="text-gray-200 rounded-md p-1 font-bold font-inter focus:bg-gray-700">{t('staff.roleManager')}</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-gray-500 mt-1.5">{t('staff.roleHint')}</p>
              </div>
            </div>

            <div className="sticky bottom-0 bg-[#171717] backdrop-blur-sm border-t border-gray-700 px-6 py-4 rounded-b-2xl">
              <div className="flex justify-end gap-3">
                <Button variant="outline" onClick={() => { setModalOpen(false); resetForm(); }} className="border-gray-600 text-gray-300 hover:bg-gray-800">
                  {t('common.cancel')}
                </Button>
                <Button
                  onClick={editing ? handleUpdate : handleCreate}
                  disabled={loading}
                  className="bg-green-600 hover:bg-green-700 text-white"
                >
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                      {editing ? t('staff.updating') : t('staff.creating')}
                    </span>
                  ) : (
                    editing ? t('staff.updateButton') : t('staff.createButton')
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
