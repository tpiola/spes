const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

module.exports = async function handler(request, response) {
  if (request.method !== "POST") return response.status(405).json({ ok: false, error: "method_not_allowed" });
  const { nome = "", email = "", consentimento = false, website = "", origem = "" } = request.body || {};
  if (website) return response.status(200).json({ ok: true });
  if (!nome.trim() || !EMAIL_PATTERN.test(email) || consentimento !== true) {
    return response.status(400).json({ ok: false, error: "invalid_submission" });
  }

  const payload = {
    nome: nome.trim().slice(0, 60),
    email: email.trim().toLowerCase().slice(0, 120),
    consentimento: true,
    origem: origem || "spes.blog",
    inscritoEm: new Date().toISOString(),
    tags: ["carta-semanal", "spes"]
  };

  try {
    const destination = process.env.NEWSLETTER_WEBHOOK_URL;
    const url = destination || "https://formsubmit.co/ajax/vocacaonossamaemaria@gmail.com";
    const upstream = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json", "Accept": "application/json" },
      body: JSON.stringify(destination ? payload : {
        ...payload,
        _subject: "Nova inscrição — Carta semanal da SPES",
        _template: "table",
        _captcha: "false"
      })
    });
    if (!upstream.ok) throw new Error("upstream_failed");
    response.setHeader("Cache-Control", "no-store");
    return response.status(200).json({ ok: true });
  } catch {
    return response.status(502).json({ ok: false, error: "subscription_unavailable" });
  }
};
