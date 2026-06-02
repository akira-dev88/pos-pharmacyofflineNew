import { apiGet, apiPost, apiPut } from "./api";

export async function getSettings() {
  return await apiGet("/settings");
}

export async function saveSettings(data: any) {
  return await apiPost("/settings", data);
}

// ✅ optional update
export async function updateSettings(data: any) {
  return await apiPut("/settings", data);
}

// Backup management
export async function createBackup() {
  return await apiPost('/settings/backup', {});
}

export async function listBackups() {
  return await apiGet('/settings/backups');
}

export async function restoreBackup(backup_name: string) {
  return await apiPost('/settings/restore', { backup_name });
}

// License management
export async function getLicenseStatus() {
  try {
    return await apiGet('/settings/license/status');
  } catch (error) {
    console.error("Failed to get license status:", error);
    return { success: false, error: "License status check failed" };
  }
}

export async function activateLicense(licenseKey: string) {
  try {
    return await apiPost('/settings/license/activate', { license_key: licenseKey });
  } catch (error) {
    console.error("License activation failed:", error);
    return { success: false, error: "License activation failed" };
  }
}

// Printer
export async function testPrinter() {
  try {
    return await apiGet('/printing/test-printer');
  } catch (error) {
    console.error("Printer test failed:", error);
    return { success: false, error: "Printer test failed" };
  }
}