export const staffInviteEmailTemplate = (
  storeName: string,
  roleName: string,
  inviteLink: string,
  recipientName?: string,
): string => {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
          background-color: #f8fafc;
          color: #0f172a;
          margin: 0;
          padding: 24px 12px;
        }
        .card {
          max-width: 520px;
          margin: 0 auto;
          background-color: #ffffff;
          border-radius: 12px;
          border: 1px solid #e2e8f0;
          padding: 32px 28px;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
        }
        .header-badge {
          display: inline-block;
          background-color: #ede9fe;
          color: #6d28d9;
          font-size: 12px;
          font-weight: 600;
          padding: 4px 12px;
          border-radius: 9999px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          margin-bottom: 16px;
        }
        .store-title {
          font-size: 22px;
          font-weight: 700;
          color: #0f172a;
          margin: 0 0 12px 0;
        }
        .description {
          font-size: 15px;
          line-height: 1.6;
          color: #475569;
          margin: 0 0 24px 0;
        }
        .role-highlight {
          font-weight: 600;
          color: #0f172a;
          background-color: #f1f5f9;
          padding: 2px 8px;
          border-radius: 4px;
        }
        .btn {
          display: inline-block;
          background-color: #0f172a;
          color: #ffffff !important;
          text-decoration: none;
          padding: 14px 28px;
          border-radius: 8px;
          font-weight: 600;
          font-size: 15px;
          text-align: center;
          width: 100%;
          box-sizing: border-box;
        }
        .expiry-note {
          font-size: 13px;
          color: #94a3b8;
          margin-top: 20px;
          text-align: center;
        }
        .footer {
          text-align: center;
          margin-top: 24px;
          font-size: 12px;
          color: #94a3b8;
        }
      </style>
    </head>
    <body>
      <div class="card">
        <div style="text-align: center;">
          <span class="header-badge">Staff Invitation</span>
          <h1 class="store-title">Join ${storeName}</h1>
          <p class="description">
            Hello${recipientName ? ` <strong>${recipientName}</strong>` : ''},<br><br>
            You have been invited to join the management team of <strong>${storeName}</strong> as <span class="role-highlight">${roleName}</span>.<br><br>
            Please click the button below to set up your password and access your dashboard.
          </p>
          <a href="${inviteLink}" class="btn" target="_blank">Accept Invitation & Set Password</a>
          <p class="expiry-note">This invitation link is secure and valid for 7 days.</p>
        </div>
      </div>
      <div class="footer">
        &copy; ${new Date().getFullYear()} ${storeName}. All rights reserved.
      </div>
    </body>
    </html>
  `;
};
