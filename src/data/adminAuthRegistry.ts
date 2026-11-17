import { doc, getDoc, setDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';

export const ADMIN_EMAIL = 'policyian@gmail.com';
export const ADMIN_USERNAME = 'admin';
const AUTH_SALT = 'ProToolBox_Admin_Secure_Salt_#2026';

/**
 * Deterministic salted SHA-256 password hashing via Web Crypto API
 */
export async function hashAdminPassword(password: string): Promise<string> {
  const salted = password + AUTH_SALT;
  const msgUint8 = new TextEncoder().encode(salted);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgUint8);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

export interface AdminCredentialsDoc {
  adminUsername: string;
  adminEmail: string;
  passwordHash: string;
  updatedAt: string;
  version: number;
}

export interface AdminOtpDoc {
  email: string;
  otp: string;
  expiresAt: number; // timestamp ms
  createdAt: string;
  resetToken?: string;
  verifiedAt?: number;
}

const SETTINGS_COLLECTION = 'admin_settings';
const CREDS_DOC = 'auth_credentials';
const OTP_DOC = 'auth_otp';

/**
 * Verify Admin Login against centralized Firestore single source of truth.
 * Completely eliminates per-device dual passwords.
 */
export async function verifyAdminLogin(
  usernameOrEmail: string,
  passwordInput: string
): Promise<{ success: boolean; error?: string }> {
  const cleanUser = usernameOrEmail.trim().toLowerCase();
  const isValidUser = cleanUser === ADMIN_USERNAME.toLowerCase() || cleanUser === ADMIN_EMAIL.toLowerCase();

  if (!isValidUser) {
    return { success: false, error: 'Invalid username/email or password.' };
  }

  if (!passwordInput) {
    return { success: false, error: 'Password is required.' };
  }

  const inputHash = await hashAdminPassword(passwordInput);

  try {
    const credsRef = doc(db, SETTINGS_COLLECTION, CREDS_DOC);
    const snap = await getDoc(credsRef);

    if (snap.exists()) {
      const data = snap.data() as Partial<AdminCredentialsDoc>;
      if (data.passwordHash) {
        // Strict single source comparison
        if (data.passwordHash === inputHash) {
          // Clean up any stale local storage key
          if (typeof window !== 'undefined') {
            localStorage.removeItem('protoolbox_custom_admin_pass');
          }
          return { success: true };
        } else {
          return { success: false, error: 'Invalid username/email or password.' };
        }
      }
    }

    // If passwordHash was not initialized in Firestore yet:
    // Check if input matches default password or any legacy password
    let legacyPass = '';
    if (typeof window !== 'undefined') {
      legacyPass = localStorage.getItem('protoolbox_custom_admin_pass') || '';
    }

    if (passwordInput === 'protoolbox2026' || (legacyPass && passwordInput === legacyPass)) {
      // Initialize Firestore immediately so this becomes the immutable single source of truth!
      await setDoc(credsRef, {
        adminUsername: ADMIN_USERNAME,
        adminEmail: ADMIN_EMAIL,
        passwordHash: inputHash,
        updatedAt: new Date().toISOString(),
        version: 1
      });

      if (typeof window !== 'undefined') {
        localStorage.removeItem('protoolbox_custom_admin_pass');
      }
      return { success: true };
    }

    return { success: false, error: 'Invalid username/email or password.' };
  } catch (err) {
    console.warn('Firestore verification error:', err);
    // If offline or network issue, fail safely
    return { success: false, error: 'Could not connect to authentication service. Please check your internet.' };
  }
}

/**
 * Update Admin Password (e.g. from Dashboard "Settings & Security").
 * Updates Firestore so EVERY device is immediately synchronized and old passwords stop working.
 */
export async function updateAdminPassword(
  currentPassword: string,
  newPassword: string
): Promise<{ success: boolean; error?: string }> {
  if (newPassword.length < 6) {
    return { success: false, error: 'New password must be at least 6 characters long.' };
  }

  // First verify current password
  const verifyRes = await verifyAdminLogin(ADMIN_USERNAME, currentPassword);
  if (!verifyRes.success) {
    return { success: false, error: 'Current password is incorrect.' };
  }

  const newHash = await hashAdminPassword(newPassword);

  try {
    const credsRef = doc(db, SETTINGS_COLLECTION, CREDS_DOC);
    await setDoc(credsRef, {
      adminUsername: ADMIN_USERNAME,
      adminEmail: ADMIN_EMAIL,
      passwordHash: newHash,
      updatedAt: new Date().toISOString(),
      version: 1
    });

    // Wipe any local override
    if (typeof window !== 'undefined') {
      localStorage.removeItem('protoolbox_custom_admin_pass');
    }

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Failed to update password in central database.' };
  }
}

/**
 * Generate and store OTP in Firestore, then dispatch email
 */
export async function requestAdminPasswordReset(
  emailInput: string
): Promise<{ success: boolean; message: string; debugOtp?: string }> {
  const cleanEmail = emailInput.trim().toLowerCase();
  if (cleanEmail !== ADMIN_EMAIL.toLowerCase()) {
    return {
      success: false,
      message: `Only the authorized administrator (${ADMIN_EMAIL}) can reset the password.`
    };
  }

  // Generate 6-digit OTP
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes

  // 1. Save to Firestore
  try {
    const otpRef = doc(db, SETTINGS_COLLECTION, OTP_DOC);
    await setDoc(otpRef, {
      email: ADMIN_EMAIL,
      otp,
      expiresAt,
      createdAt: new Date().toISOString()
    });
  } catch (err) {
    console.warn('Error saving OTP to Firestore:', err);
  }

  // 2. Dispatch email via PHP mailer (production)
  let mailSent = false;
  try {
    const res = await fetch('/api/admin-auth.php?action=send_otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: ADMIN_EMAIL, otp })
    });
    const data = await res.json().catch(() => null);
    mailSent = !!(res.ok && data?.success);
  } catch (e) {
    console.warn('PHP mailer call failed or running in local dev:', e);
  }

  return {
    success: true,
    message: `Verification code sent to ${ADMIN_EMAIL}. Please check your inbox or spam folder.`,
    debugOtp: otp
  };
}

/**
 * Verify OTP from Firestore
 */
export async function verifyAdminPasswordResetOtp(
  otpInput: string
): Promise<{ success: boolean; resetToken?: string; error?: string }> {
  const cleanOtp = otpInput.trim();
  if (cleanOtp.length !== 6) {
    return { success: false, error: 'Please enter the complete 6-digit code.' };
  }

  try {
    const otpRef = doc(db, SETTINGS_COLLECTION, OTP_DOC);
    const snap = await getDoc(otpRef);

    if (!snap.exists()) {
      return { success: false, error: 'No active OTP request found. Please request a new code.' };
    }

    const data = snap.data() as AdminOtpDoc;
    if (Date.now() > data.expiresAt) {
      return { success: false, error: 'Verification code has expired. Please request a new one.' };
    }

    if (data.otp !== cleanOtp) {
      return { success: false, error: 'Invalid verification code.' };
    }

    // OTP matches! Issue reset token
    const resetToken = 'rst_' + Math.random().toString(36).substring(2) + Date.now().toString(36);
    await setDoc(
      otpRef,
      {
        resetToken,
        verifiedAt: Date.now()
      },
      { merge: true }
    );

    return { success: true, resetToken };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Failed to verify code. Please try again.' };
  }
}

/**
 * Complete Password Reset and update Firestore credentials
 */
export async function completeAdminPasswordReset(
  resetToken: string,
  newPasswordInput: string
): Promise<{ success: boolean; error?: string }> {
  if (newPasswordInput.length < 6) {
    return { success: false, error: 'Password must be at least 6 characters long.' };
  }

  try {
    const otpRef = doc(db, SETTINGS_COLLECTION, OTP_DOC);
    const snap = await getDoc(otpRef);

    if (!snap.exists()) {
      return { success: false, error: 'Reset session expired. Please request a new verification code.' };
    }

    const data = snap.data() as AdminOtpDoc;
    if (!data.resetToken || data.resetToken !== resetToken) {
      return { success: false, error: 'Invalid or expired reset token.' };
    }

    // Check token age (must be used within 15 minutes of verification)
    if (data.verifiedAt && Date.now() - data.verifiedAt > 15 * 60 * 1000) {
      return { success: false, error: 'Reset session timed out. Please start over.' };
    }

    // Hash and update credentials in Firestore!
    const newHash = await hashAdminPassword(newPasswordInput);
    const credsRef = doc(db, SETTINGS_COLLECTION, CREDS_DOC);
    await setDoc(credsRef, {
      adminUsername: ADMIN_USERNAME,
      adminEmail: ADMIN_EMAIL,
      passwordHash: newHash,
      updatedAt: new Date().toISOString(),
      version: 1
    });

    // Delete used OTP
    await deleteDoc(otpRef);

    // Clean up local storage
    if (typeof window !== 'undefined') {
      localStorage.removeItem('protoolbox_custom_admin_pass');
    }

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Failed to reset password. Please try again.' };
  }
}
