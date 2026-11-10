<?php
/**
 * ProToolBox Contact Form Email Dispatcher
 * Sends contact form inquiries directly to policyian@gmail.com
 */

header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');
header('Content-Type: application/json; charset=utf-8');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'error' => 'Method not allowed. Only POST is accepted.']);
    exit;
}

$DESTINATION_EMAIL = 'policyian@gmail.com';

// ── Rate Limiting (Prevent spam: max 5 submissions per 10 minutes per IP) ───
$ip = $_SERVER['REMOTE_ADDR'] ?? '0.0.0.0';
$rateFile = sys_get_temp_dir() . '/ptb_contact_rate_' . md5($ip) . '.json';

$rateData = ['count' => 0, 'first_attempt' => time()];
if (file_exists($rateFile)) {
    $raw = @file_get_contents($rateFile);
    if ($raw) {
        $decoded = json_decode($raw, true);
        if ($decoded && (time() - $decoded['first_attempt']) < 600) {
            $rateData = $decoded;
        }
    }
}

if ($rateData['count'] >= 6) {
    http_response_code(429);
    echo json_encode([
        'success' => false,
        'error' => 'Too many requests. Please wait a few minutes before sending another inquiry.'
    ]);
    exit;
}

// ── Read & Parse Input ──────────────────────────────────────────────────────
$input = json_decode(file_get_contents('php://input'), true);
if (!$input) {
    $input = $_POST;
}

$name    = trim($input['name'] ?? '');
$email   = trim($input['email'] ?? '');
$subject = trim($input['subject'] ?? 'Website Inquiry');
$message = trim($input['message'] ?? '');

// Validation
if (empty($name) || empty($email) || empty($message)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'Please fill in all required fields (Name, Email, Message).']);
    exit;
}

if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'Please provide a valid email address.']);
    exit;
}

// ── Sanitize ────────────────────────────────────────────────────────────────
$safeName    = htmlspecialchars($name, ENT_QUOTES, 'UTF-8');
$safeEmail   = htmlspecialchars($email, ENT_QUOTES, 'UTF-8');
$safeSubject = htmlspecialchars($subject, ENT_QUOTES, 'UTF-8');
$safeMessage = nl2br(htmlspecialchars($message, ENT_QUOTES, 'UTF-8'));
$dateFormatted = date('d M Y, h:i A T');

// ── Compose Professional HTML Email ─────────────────────────────────────────
$mailSubject = "New ProToolBox Inquiry: " . ($subject ?: "Message from $name");

$emailBody = "
<!DOCTYPE html>
<html>
<head>
  <meta charset='utf-8'>
  <title>New ProToolBox Inquiry</title>
</head>
<body style='margin:0; padding:24px; background-color:#f1f5f9; font-family:-apple-system, BlinkMacSystemFont, \"Segoe UI\", Roboto, Helvetica, Arial, sans-serif; color:#0f172a;'>
  <div style='max-width:600px; margin:0 auto; background:#ffffff; border-radius:16px; overflow:hidden; box-shadow:0 10px 25px rgba(0,0,0,0.06); border:1px solid #e2e8f0;'>
    
    <!-- Header -->
    <div style='background:linear-gradient(135deg, #3b82f6 0%, #6366f1 50%, #8b5cf6 100%); padding:28px 24px; text-align:center;'>
      <h1 style='color:#ffffff; margin:0; font-size:22px; font-weight:800; letter-spacing:-0.02em;'>ProToolBox Contact Inquiry</h1>
      <p style='color:rgba(255,255,255,0.85); margin:6px 0 0; font-size:13px;'>You received a new message from the website contact form</p>
    </div>

    <!-- Body -->
    <div style='padding:28px 24px;'>
      
      <!-- Sender Info Table -->
      <table style='width:100%; border-collapse:collapse; margin-bottom:24px; background:#f8faff; border-radius:10px; border:1px solid #e2e8f0;'>
        <tr>
          <td style='padding:12px 16px; font-weight:700; color:#475569; width:120px; font-size:13px; border-bottom:1px solid #e2e8f0;'>From:</td>
          <td style='padding:12px 16px; color:#0f172a; font-weight:600; font-size:14px; border-bottom:1px solid #e2e8f0;'>{$safeName}</td>
        </tr>
        <tr>
          <td style='padding:12px 16px; font-weight:700; color:#475569; font-size:13px; border-bottom:1px solid #e2e8f0;'>Email:</td>
          <td style='padding:12px 16px; color:#4f46e5; font-weight:600; font-size:14px; border-bottom:1px solid #e2e8f0;'>
            <a href='mailto:{$safeEmail}' style='color:#4f46e5; text-decoration:none;'>{$safeEmail}</a>
          </td>
        </tr>
        <tr>
          <td style='padding:12px 16px; font-weight:700; color:#475569; font-size:13px; border-bottom:1px solid #e2e8f0;'>Subject:</td>
          <td style='padding:12px 16px; color:#0f172a; font-size:14px; border-bottom:1px solid #e2e8f0;'>{$safeSubject}</td>
        </tr>
        <tr>
          <td style='padding:12px 16px; font-weight:700; color:#475569; font-size:13px;'>Received:</td>
          <td style='padding:12px 16px; color:#64748b; font-size:13px;'>{$dateFormatted}</td>
        </tr>
      </table>

      <!-- Message Content -->
      <h3 style='margin:0 0 10px; font-size:14px; font-weight:700; color:#0f172a; text-transform:uppercase; letter-spacing:0.04em;'>Message:</h3>
      <div style='background:#ffffff; border:1px solid #cbd5e1; border-radius:10px; padding:18px; color:#1e293b; font-size:14px; line-height:1.65; white-space:pre-wrap;'>{$safeMessage}</div>

      <!-- Quick Reply Button -->
      <div style='margin-top:24px; text-align:center;'>
        <a href='mailto:{$safeEmail}?subject=Re:%20{$safeSubject}' style='display:inline-block; background:linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%); color:#ffffff; font-weight:700; font-size:14px; padding:12px 28px; border-radius:999px; text-decoration:none; box-shadow:0 4px 12px rgba(99,102,241,0.3);'>Reply to {$safeName}</a>
      </div>

    </div>

    <!-- Footer -->
    <div style='background:#f8faff; padding:14px 24px; border-top:1px solid #e2e8f0; text-align:center; font-size:12px; color:#94a3b8;'>
      Sent from <a href='https://protoolbox.in' style='color:#6366f1; text-decoration:none;'>ProToolBox</a> Contact Form â€¢ User IP: {$ip}
    </div>

  </div>
</body>
</html>
";

// Headers
$headers = [
    'MIME-Version: 1.0',
    'Content-Type: text/html; charset=UTF-8',
    'From: ProToolBox Contact <noreply@protoolbox.in>',
    "Reply-To: {$safeName} <{$email}>",
    'X-Mailer: PHP/' . phpversion()
];

// Send mail
$mailSent = @mail($DESTINATION_EMAIL, $mailSubject, $emailBody, implode("\r\n", $headers));

// Update rate limiter
$rateData['count']++;
@file_put_contents($rateFile, json_encode($rateData));

echo json_encode([
    'success' => true,
    'message' => 'Thank you! Your inquiry has been sent to our team at ' . $DESTINATION_EMAIL . '. We will respond within 24â€“48 hours.',
    'mailSent' => $mailSent
]);

