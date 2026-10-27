export type InvitationEmailContent = {
  subject: string;
  text: string;
  html: string;
};

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

export function buildInvitationEmail(inviteUrl: string, personalMessage?: string): InvitationEmailContent {
  const message = personalMessage?.trim();
  const safeMessage = message
    ? `<tr><td class="content-pad" style="padding:0 40px 24px;font-family:Arial,Helvetica,sans-serif;font-size:16px;line-height:25px;color:#374151"><div style="padding:16px 18px;border-left:3px solid #c99d50;background:#f8f6f1">${escapeHtml(message).replaceAll('\n', '<br>')}</div></td></tr>`
    : '';
  const safeUrl = escapeHtml(inviteUrl);
  const logoUrl = escapeHtml(new URL('/E.V.%20Logo.jpeg', new URL(inviteUrl).origin).toString());

  const text = [
    'Hallo,',
    '',
    'Herzlich willkommen bei Headbang Handwerk e. V.! 🤘',
    '',
    'Als Mitglied oder Partner von Headbang Handwerk e. V. hast du die Möglichkeit, unsere AppSchmiede kostenlos und in vollem Umfang zu nutzen.',
    '',
    'Mit der AppSchmiede kannst du deine eigenen Ideen in digitale Anwendungen verwandeln – ganz ohne Programmierkenntnisse.',
    '',
    'Exklusiv für unsere Mitglieder und Partner!',
    '',
    'Erstelle deine eigene App als Prototyp, gestalte individuelle Funktionen und teste deine Anwendung direkt im Browser oder auf deinem Smartphone.',
    ...(message ? ['', message] : []),
    '',
    'Klicke auf den folgenden Button, registriere dich mit deiner eingeladenen E-Mail-Adresse und starte dein erstes Projekt.',
    '',
    'JETZT REGISTRIEREN UND APPSCHMIEDE ENTDECKEN',
    inviteUrl,
    '',
    'Dein persönlicher Einladungslink ist sieben Tage gültig und kann nur einmal verwendet werden.',
    '',
    'Solltest du Fragen haben oder Unterstützung benötigen, wende dich gerne an info@headbang-handwerk.de.',
    '',
    'Wir wünschen dir viel Spaß beim Entwickeln, Ausprobieren und Gestalten deiner eigenen App!',
    '',
    'Mit freundlichen Grüßen',
    '',
    'Dein Headbang Handwerk Team 🤘',
    '',
    'Headbang Handwerk e. V.',
    'Wiesengrund 5',
    '26203 Wardenburg',
    'info@headbang-handwerk.de',
    'https://www.headbang-handwerk.com/',
    '',
    'Vorstandsmitglieder:',
    'Daniel Bigl',
    'Ramon Meyer',
    'Melanie Stephan',
  ].join('\n');

  const html = `<!doctype html>
<html lang="de">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <meta name="x-apple-disable-message-reformatting">
  <title>Willkommen bei Headbang Handwerk</title>
  <style>
    @media screen and (max-width: 620px) {
      .email-shell { width:100% !important; }
      .content-pad { padding-left:22px !important; padding-right:22px !important; }
      .brand-logo { width:132px !important; }
      .email-title { font-size:26px !important; line-height:33px !important; }
      .cta-link { display:block !important; padding:16px 14px !important; font-size:14px !important; }
      .footer-col { display:block !important; width:100% !important; padding:0 0 16px !important; }
    }
  </style>
</head>
<body style="margin:0;padding:0;background-color:#f0f1f3;-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%">
  <div style="display:none;font-size:1px;color:#f0f1f3;line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden">Deine persönliche Einladung zur AppSchmiede ist da.</div>
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" bgcolor="#f0f1f3" style="width:100%;border-collapse:collapse;background-color:#f0f1f3">
    <tr>
      <td align="center" style="padding:28px 12px">
        <table role="presentation" class="email-shell" width="100%" cellspacing="0" cellpadding="0" border="0" bgcolor="#ffffff" style="width:100%;max-width:600px;border-collapse:collapse;background-color:#ffffff">
          <tr>
            <td align="center" bgcolor="#101318" style="padding:28px 24px 24px;background-color:#101318;border-bottom:4px solid #c99d50">
              <img class="brand-logo" src="${logoUrl}" width="164" alt="Headbang Handwerk e. V." style="display:block;width:164px;max-width:100%;height:auto;border:0;outline:none;text-decoration:none">
              <p style="margin:16px 0 0;font-family:Arial,Helvetica,sans-serif;font-size:11px;line-height:16px;font-weight:bold;letter-spacing:2px;color:#e8c77d;text-transform:uppercase">Handwerk. Laut. Sichtbar.</p>
            </td>
          </tr>
          <tr>
            <td class="content-pad" style="padding:34px 40px 10px;font-family:Arial,Helvetica,sans-serif;color:#20242a">
              <h1 class="email-title" style="margin:0 0 22px;font-family:Arial,Helvetica,sans-serif;font-size:30px;line-height:38px;font-weight:700;color:#181b20">Herzlich willkommen bei Headbang Handwerk e. V.! 🤘</h1>
              <p style="margin:0 0 18px;font-size:16px;line-height:25px;color:#374151">Hallo,</p>
              <p style="margin:0 0 18px;font-size:16px;line-height:25px;color:#374151">Als Mitglied oder Partner von Headbang Handwerk e. V. hast du die Möglichkeit, unsere AppSchmiede kostenlos und in vollem Umfang zu nutzen.</p>
              <p style="margin:0 0 18px;font-size:16px;line-height:25px;color:#374151">Mit der AppSchmiede kannst du deine eigenen Ideen in digitale Anwendungen verwandeln – ganz ohne Programmierkenntnisse.</p>
              <p style="margin:0 0 18px;padding:14px 16px;border-left:4px solid #c99d50;background-color:#f8f6f1;font-size:16px;line-height:24px;font-weight:700;color:#20242a">Exklusiv für unsere Mitglieder und Partner!</p>
              <p style="margin:0 0 24px;font-size:16px;line-height:25px;color:#374151">Erstelle deine eigene App als Prototyp, gestalte individuelle Funktionen und teste deine Anwendung direkt im Browser oder auf deinem Smartphone.</p>
            </td>
          </tr>
          ${safeMessage}
          <tr>
            <td class="content-pad" style="padding:0 40px 8px;font-family:Arial,Helvetica,sans-serif;font-size:16px;line-height:25px;color:#374151">Klicke auf den folgenden Button, registriere dich mit deiner eingeladenen E-Mail-Adresse und starte dein erstes Projekt.</td>
          </tr>
          <tr>
            <td align="center" class="content-pad" style="padding:18px 40px 14px">
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="border-collapse:separate">
                <tr>
                  <td align="center" bgcolor="#c99d50" style="border-radius:5px;background-color:#c99d50">
                    <a class="cta-link" href="${safeUrl}" target="_blank" style="display:inline-block;padding:16px 24px;font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:20px;font-weight:700;letter-spacing:.3px;color:#17120e;text-align:center;text-decoration:none">JETZT REGISTRIEREN UND APPSCHMIEDE ENTDECKEN</a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td class="content-pad" style="padding:8px 40px 12px;font-family:Arial,Helvetica,sans-serif;font-size:13px;line-height:21px;color:#626a73;text-align:center">Dein persönlicher Einladungslink ist sieben Tage gültig und kann nur einmal verwendet werden.</td>
          </tr>
          <tr>
            <td class="content-pad" style="padding:14px 40px 30px;font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:24px;color:#374151">
              <p style="margin:0 0 14px">Solltest du Fragen haben oder Unterstützung benötigen, wende dich gerne an <a href="mailto:info@headbang-handwerk.de" style="color:#805b20;text-decoration:underline">info@headbang-handwerk.de</a>.</p>
              <p style="margin:0 0 20px">Wir wünschen dir viel Spaß beim Entwickeln, Ausprobieren und Gestalten deiner eigenen App!</p>
              <p style="margin:0">Mit freundlichen Grüßen<br><br><strong>Dein Headbang Handwerk Team 🤘</strong></p>
            </td>
          </tr>
          <tr>
            <td bgcolor="#101318" style="padding:26px 30px;background-color:#101318;border-top:4px solid #c99d50">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="width:100%;border-collapse:collapse">
                <tr>
                  <td class="footer-col" valign="top" width="58%" style="width:58%;padding-right:18px;font-family:Arial,Helvetica,sans-serif;font-size:13px;line-height:21px;color:#e6e8eb">
                    <strong style="font-size:15px;color:#ffffff">Headbang Handwerk e. V.</strong><br>
                    Wiesengrund 5<br>
                    26203 Wardenburg<br>
                    <a href="mailto:info@headbang-handwerk.de" style="color:#e8c77d;text-decoration:underline">info@headbang-handwerk.de</a><br>
                    <a href="https://www.headbang-handwerk.com/" style="color:#e8c77d;text-decoration:underline">https://www.headbang-handwerk.com</a>
                  </td>
                  <td class="footer-col" valign="top" width="42%" style="width:42%;font-family:Arial,Helvetica,sans-serif;font-size:13px;line-height:21px;color:#c5c9cf">
                    <strong style="color:#ffffff">Vorstandsmitglieder</strong><br>
                    Daniel Bigl<br>
                    Ramon Meyer<br>
                    Melanie Stephan
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  return {
    subject: 'Willkommen bei Headbang Handwerk – Deine Einladung zur AppSchmiede',
    text,
    html,
  };
}
