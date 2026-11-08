<?php
/**
 * ProToolBox Admin Authentication & Security Gateway (PHP)
 * Provides:
 *  - Secure Login with Brute-Force Rate Limiting
 *  - Forgot Password OTP Email Dispatch to policyian@gmail.com
 *  - OTP Verification & Password Reset
 *  - Password Change within Dashboard
 */

header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Content-Type: application/json; charset=utf-8');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

$ADMIN_EMAIL = 'policyian@gmail.com';
$ADMIN_USER = 'admin';
$DEFAULT_PASS_HASH = password_hash('protoolbox2026', PASSWORD_BCRYPT);

$credFile = sys_get_temp_dir() . '/protoolbox_admin_creds.json';
$otpFile = sys_get_temp_dir() . '/protoolbox_admin_otp.json';
$rateFile = sys_get_temp_dir() . '/protoolbox_admin_rate.json';

// Helper: Get current password hash
function getAdminPasswordHash($credFile, $defaultHash) {
    if (file_exists($credFile)) {
        $data = json_decode(file_get_contents($credFile), true);
        if (!empty($data['password_hash'])) {
            return $data['password_hash'];
        }
    }
    return $defaultHash;
}

// Helper: Set admin password
function setAdminPassword($credFile, $newPassword) {
    $data = [
        'password_hash' => password_hash($newPassword, PASSWORD_BCRYPT),
        'updated_at' => date('c')
    ];
    file_put_contents($credFile, json_encode($data));
}

// Helper: Check brute force rate limit
function checkRateLimit($rateFile) {
    $ip = $_SERVER['REMOTE_ADDR'] ?? '127.0.0.1';
    $data = [];
    if (file_exists($rateFile)) {
        $data = json_decode(file_get_contents($rateFile), true) ?: [];
    }
    $now = time();
    $attempts = $data[$ip] ?? ['count' => 0, 'first_attempt' => $now];

    // Reset window after 10 minutes
    if ($now - $attempts['first_attempt'] > 600) {
        $attempts = ['count' => 0, 'first_attempt' => $now];
    }

    if ($attempts['count'] >= 6) {
        http_response_code(429);
        echo json_encode([
            'error' => 'Too many failed login attempts. Please wait 10 minutes or use Forgot Password.'
        ]);
        exit;
    }

    $attempts['count']++;
    $data[$ip] = $attempts;
    file_put_contents($rateFile, json_encode($data));
}

function clearRateLimit($rateFile) {
    $ip = $_SERVER['REMOTE_ADDR'] ?? '127.0.0.1';
    if (file_exists($rateFile)) {
        $data = json_decode(file_get_contents($rateFile), true) ?: [];
        unset($data[$ip]);
        file_put_contents($rateFile, json_encode($data));
    }
}

// Read JSON input
$body = json_decode(file_get_contents('php://input'), true) ?? [];
$action = $_GET['action'] ?? $body['action'] ?? '';

// ─── 1. LOGIN ────────────────────────────────────────────────────────────────
if ($action === 'login') {
    $username = trim($body['username'] ?? $body['email'] ?? '');
    $password = $body['password'] ?? '';

    if (empty($username) || empty($password)) {
        http_response_code(400);
        echo json_encode(['error' => 'Username/email and password are required.']);
        exit;
    }

    // Allow login with either 'admin' or 'policyian@gmail.com'
    $validUser = (strtolower($username) === 'admin' || strtolower($username) === strtolower($ADMIN_EMAIL));
    $currentHash = getAdminPasswordHash($credFile, $DEFAULT_PASS_HASH);

    if ($validUser && password_verify($password, $currentHash)) {
        clearRateLimit($rateFile);
        $token = bin2hex(random_bytes(32));
        $sessionData = [
            'token' => $token,
            'user' => $ADMIN_USER,
            'email' => $ADMIN_EMAIL,
            'expires' => time() + (86400 * 7) // 7 days session
        ];
        file_put_contents(sys_get_temp_dir() . '/protoolbox_session_' . $token . '.json', json_encode($sessionData));

        echo json_encode([
            'success' => true,
            'token' => $token,
            'user' => [
                'username' => $ADMIN_USER,
                'email' => $ADMIN_EMAIL
            ],
            'message' => 'Login successful'
        ]);
        exit;
    } else {
        checkRateLimit($rateFile);
        http_response_code(401);
        echo json_encode(['error' => 'Invalid username/email or password.']);
        exit;
    }
}

// ─── 2. SEND OTP FOR PASSWORD RESET ──────────────────────────────────────────
if ($action === 'send_otp') {
    $email = strtolower(trim($body['email'] ?? ''));

    if ($email !== strtolower($ADMIN_EMAIL)) {
        http_response_code(403);
        echo json_encode([
            'error' => 'Only the authorized administrator email (' . $ADMIN_EMAIL . ') can request password reset.'
        ]);
        exit;
    }

    // Generate secure 6-digit OTP
    $otp = (string) random_int(100000, 999999);
    $expires = time() + 600; // 10 minutes validity

    $otpData = [
        'otp_hash' => password_hash($otp, PASSWORD_BCRYPT),
        'email' => $email,
        'expires' => $expires
    ];
    file_put_contents($otpFile, json_encode($otpData));

    // Send professional HTML email via PHP mail()
    $subject = "ProToolBox Admin: Password Reset Verification Code";
    $message = "
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset='utf-8'>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #0f1117; color: #f8fafc; padding: 30px 15px; margin: 0; }
        .card { max-width: 500px; margin: 0 auto; background: #161b27; border: 1px solid #2a3449; border-radius: 12px; padding: 32px; box-shadow: 0 10px 30px rgba(0,0,0,0.4); }
        .logo { font-size: 22px; font-weight: 700; color: #6366f1; margin-bottom: 8px; }
        h2 { font-size: 20px; margin-top: 0; color: #ffffff; }
        p { color: #94a3b8; line-height: 1.6; font-size: 14.5px; }
        .otp-box { background: #1e2535; border: 2px dashed #6366f1; border-radius: 10px; padding: 18px; text-align: center; margin: 24px 0; font-size: 32px; font-weight: 800; letter-spacing: 6px; color: #38bdf8; }
        .footer { font-size: 12px; color: #64748b; margin-top: 24px; border-top: 1px solid #232c3d; padding-top: 16px; }
      </style>
    </head>
    <body>
      <div class='card'>
        <div class='logo'>ProToolBox</div>
        <h2>Admin Password Reset Code</h2>
        <p>A password reset request was initiated for your ProToolBox administrator account. Use the 6-digit verification code below to set a new password:</p>
        <div class='otp-box'>{$otp}</div>
        <p>This code will expire in <strong>10 minutes</strong>. If you did not request this reset, your account is safe and you can ignore this email.</p>
        <div class='footer'>
          Sent from <strong>protoolbox.in</strong> Security Center • Authorized to {$email}
        </div>
      </div>
    </body>
    </html>
    ";

    $headers = [
        "MIME-Version: 1.0",
        "Content-type: text/html; charset=UTF-8",
        "From: ProToolBox Security <no-reply@protoolbox.in>",
        "Reply-To: support@protoolbox.in",
        "X-Mailer: PHP/" . phpversion()
    ];

    $mailSent = @mail($email, $subject, $message, implode("\r\n", $headers));

    echo json_encode([
        'success' => true,
        'message' => 'Verification code sent to ' . $email,
        'mailSent' => $mailSent,
        // In local/sandbox environments where sendmail is absent, expose fallback for testing
        'debugOtp' => (!$mailSent && $_SERVER['REMOTE_ADDR'] === '127.0.0.1') ? $otp : null
    ]);
    exit;
}

// ─── 3. VERIFY OTP ───────────────────────────────────────────────────────────
if ($action === 'verify_otp') {
    $email = strtolower(trim($body['email'] ?? ''));
    $otp = trim($body['otp'] ?? '');

    if (!file_exists($otpFile)) {
        http_response_code(400);
        echo json_encode(['error' => 'No active verification code found. Please request a new one.']);
        exit;
    }

    $otpData = json_decode(file_get_contents($otpFile), true);
    if (time() > ($otpData['expires'] ?? 0)) {
        @unlink($otpFile);
        http_response_code(400);
        echo json_encode(['error' => 'Verification code has expired. Please request a new one.']);
        exit;
    }

    if ($email === $otpData['email'] && password_verify($otp, $otpData['otp_hash'])) {
        // Generate single-use reset token
        $resetToken = bin2hex(random_bytes(24));
        $tokenFile = sys_get_temp_dir() . '/protoolbox_reset_' . $resetToken . '.json';
        file_put_contents($tokenFile, json_encode(['email' => $email, 'expires' => time() + 900]));
        @unlink($otpFile);

        echo json_encode([
            'success' => true,
            'reset_token' => $resetToken,
            'message' => 'OTP verified successfully.'
        ]);
        exit;
    } else {
        http_response_code(400);
        echo json_encode(['error' => 'Invalid verification code. Please check and try again.']);
        exit;
    }
}

// ─── 4. RESET PASSWORD (WITH TOKEN) ──────────────────────────────────────────
if ($action === 'reset_password') {
    $resetToken = trim($body['reset_token'] ?? '');
    $newPassword = $body['new_password'] ?? '';

    if (empty($resetToken) || strlen($newPassword) < 6) {
        http_response_code(400);
        echo json_encode(['error' => 'Password must be at least 6 characters long and reset token is required.']);
        exit;
    }

    $tokenFile = sys_get_temp_dir() . '/protoolbox_reset_' . $resetToken . '.json';
    if (!file_exists($tokenFile)) {
        http_response_code(403);
        echo json_encode(['error' => 'Reset token is invalid or expired.']);
        exit;
    }

    $tokenData = json_decode(file_get_contents($tokenFile), true);
    if (time() > ($tokenData['expires'] ?? 0)) {
        @unlink($tokenFile);
        http_response_code(403);
        echo json_encode(['error' => 'Reset token has expired.']);
        exit;
    }

    setAdminPassword($credFile, $newPassword);
    @unlink($tokenFile);
    clearRateLimit($rateFile);

    echo json_encode([
        'success' => true,
        'message' => 'Password reset successfully! You can now sign in with your new password.'
    ]);
    exit;
}

// ─── 5. CHANGE PASSWORD (FROM SETTINGS) ──────────────────────────────────────
if ($action === 'change_password') {
    $currentPass = $body['current_password'] ?? '';
    $newPass = $body['new_password'] ?? '';

    if (empty($currentPass) || strlen($newPass) < 6) {
        http_response_code(400);
        echo json_encode(['error' => 'New password must be at least 6 characters.']);
        exit;
    }

    $currentHash = getAdminPasswordHash($credFile, $DEFAULT_PASS_HASH);
    if (!password_verify($currentPass, $currentHash)) {
        http_response_code(401);
        echo json_encode(['error' => 'Current password is incorrect.']);
        exit;
    }

    setAdminPassword($credFile, $newPass);
    echo json_encode([
        'success' => true,
        'message' => 'Password updated successfully!'
    ]);
    exit;
}

http_response_code(400);
echo json_encode(['error' => 'Invalid action.']);

