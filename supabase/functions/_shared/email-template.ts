// Shared premium B&W email template for Static Vibes

export const BRAND = {
  name: "STATIC VIBES",
  tagline: "Premium Streetwear",
  url: "https://staticvibes.lovable.app",
  supportEmail: "support@staticvibes.com",
};

export function baseLayout(opts: {
  preheader?: string;
  bodyHtml: string;
}) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="color-scheme" content="light dark">
<title>${BRAND.name}</title>
</head>
<body style="margin:0;padding:0;background:#f5f5f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;color:#0a0a0a;-webkit-font-smoothing:antialiased;">
<span style="display:none!important;opacity:0;color:transparent;height:0;width:0;overflow:hidden;">${opts.preheader ?? ""}</span>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f5;padding:32px 16px;">
  <tr><td align="center">
    <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border:1px solid #ebebeb;">
      <tr><td style="background:#000000;padding:36px 32px;text-align:center;">
        <div style="font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;font-weight:900;letter-spacing:8px;font-size:22px;color:#ffffff;">${BRAND.name}</div>
        <div style="margin-top:6px;font-size:10px;letter-spacing:4px;color:#9a9a9a;text-transform:uppercase;">${BRAND.tagline}</div>
      </td></tr>
      <tr><td style="padding:40px 36px 32px;">${opts.bodyHtml}</td></tr>
      <tr><td style="border-top:1px solid #ebebeb;padding:24px 32px;text-align:center;font-size:11px;color:#888;letter-spacing:1px;">
        © ${new Date().getFullYear()} ${BRAND.name} · <a href="${BRAND.url}" style="color:#000;text-decoration:none;">staticvibes.com</a>
      </td></tr>
    </table>
  </td></tr>
</table>
</body></html>`;
}

export const btn = (href: string, label: string) =>
  `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:24px auto;"><tr><td style="background:#000;border-radius:2px;">
    <a href="${href}" style="display:inline-block;padding:14px 32px;color:#fff;font-size:13px;letter-spacing:3px;text-transform:uppercase;font-weight:600;text-decoration:none;">${label}</a>
  </td></tr></table>`;

export const h1 = (s: string) =>
  `<h1 style="font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;font-weight:300;font-size:28px;letter-spacing:1px;margin:0 0 16px;color:#000;text-align:center;">${s}</h1>`;

export const p = (s: string) =>
  `<p style="font-size:14px;line-height:1.7;color:#444;margin:0 0 14px;">${s}</p>`;

export const divider = `<div style="height:1px;background:#ebebeb;margin:28px 0;"></div>`;
