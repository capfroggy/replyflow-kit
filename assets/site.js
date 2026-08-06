const PAYPAL_EMAIL = "alejandro.amezquita@alumnos.udg.mx";
const PAYPAL_HANDLE = "@AMEZQUITASALINAS";

function paypalUrl(itemName, amount, cancelPath = "/") {
  const origin = window.location.origin;
  const basePath = window.location.hostname.endsWith("github.io")
    ? `/${window.location.pathname.split("/").filter(Boolean)[0] || ""}`
    : "";
  const normalizedCancel = cancelPath.startsWith("/") ? cancelPath : `/${cancelPath}`;
  const params = new URLSearchParams({
    cmd: "_xclick",
    business: PAYPAL_EMAIL,
    item_name: itemName,
    amount,
    currency_code: "USD",
    no_shipping: "1",
    no_note: "0",
    return: `${origin}${basePath}/delivery.html`,
    cancel_return: `${origin}${basePath}${normalizedCancel}`,
  });

  return `https://www.paypal.com/cgi-bin/webscr?${params.toString()}`;
}

function wirePayPalLinks() {
  document.querySelectorAll("[data-paypal-item]").forEach((link) => {
    const item = link.getAttribute("data-paypal-item");
    const amount = link.getAttribute("data-paypal-amount");
    const cancel = link.getAttribute("data-paypal-cancel") || "/";
    if (item && amount) {
      link.setAttribute("href", paypalUrl(item, amount, cancel));
    }
  });
}

const spanishTemplates = {
  lead: "Hola {{nombre}}, gracias por escribirnos sobre {{servicio}}. Si podemos ayudarte. El siguiente paso mas rapido es {{siguiente_paso}}. {{cierre}}",
  cotizacion:
    "Hola {{nombre}}, te doy seguimiento a la cotizacion de {{servicio}} para {{negocio}}. Si todavia te interesa, el siguiente paso mas facil es {{siguiente_paso}}. {{cierre}}",
  factura:
    "Hola {{nombre}}, te escribo por la factura pendiente de {{negocio}} por {{monto}}. Puedes resolverla con {{siguiente_paso}}. {{cierre}}",
  frio:
    "Hola {{nombre}}, vuelvo a escribirte por {{servicio}}. Si ya no es prioridad, no hay problema. Si todavia quieres avanzar, {{siguiente_paso}}. {{cierre}}",
};

const englishTemplates = {
  lead: "Hi {{name}}, thanks for reaching out about {{service}}. I can help. The fastest next step is {{next_step}}. {{closer}}",
  quote:
    "Hi {{name}}, quick follow-up on the {{service}} quote for {{business}}. If this is still useful, the easiest next step is {{next_step}}. {{closer}}",
  invoice:
    "Hi {{name}}, following up on the open {{business}} invoice for {{amount}}. You can take care of it with {{next_step}}. {{closer}}",
  quiet:
    "Hi {{name}}, checking once more on {{service}}. If now is not the right time, no problem. If you still want help, {{next_step}}. {{closer}}",
};

const spanishClosers = {
  calido: "Con gusto te ayudo a hacerlo sencillo.",
  directo: "Respondeme con el mejor siguiente paso y lo movemos.",
  firme: "Por favor respondeme hoy para mantener esto en orden.",
};

const englishClosers = {
  warm: "Happy to make this easy.",
  direct: "Reply with the best next step and I will take it from there.",
  firm: "Please reply today so I can keep this moving.",
};

function value(id, fallback) {
  const input = document.getElementById(id);
  const raw = input && "value" in input ? input.value.trim() : "";
  return raw || fallback;
}

function activeValue(group) {
  const active = document.querySelector(`[data-group="${group}"].active`);
  return active ? active.getAttribute("data-value") : "";
}

function setActive(button) {
  const group = button.getAttribute("data-group");
  document.querySelectorAll(`[data-group="${group}"]`).forEach((item) => {
    item.classList.remove("active");
  });
  button.classList.add("active");
}

function renderSpanishMessage() {
  const caso = activeValue("caso") || "lead";
  const tono = activeValue("tono") || "calido";
  const canal = activeValue("canal") || "email";
  const template = spanishTemplates[caso];
  const message = template
    .replaceAll("{{nombre}}", value("nombre", "{{nombre}}"))
    .replaceAll("{{negocio}}", value("negocio", "{{negocio}}"))
    .replaceAll("{{servicio}}", value("servicio", "{{servicio}}"))
    .replaceAll("{{monto}}", value("monto", "{{monto}}"))
    .replaceAll("{{siguiente_paso}}", value("siguiente", "{{siguiente_paso}}"))
    .replaceAll("{{cierre}}", spanishClosers[tono]);

  return canal === "sms" ? message.replace(/\s+/g, " ").trim() : `${message}\n\nGracias,\n{{tu_nombre}}`;
}

function renderEnglishMessage() {
  const scenario = activeValue("scenario") || "lead";
  const tone = activeValue("tone") || "warm";
  const channel = activeValue("channel") || "email";
  const template = englishTemplates[scenario];
  const message = template
    .replaceAll("{{name}}", value("name", "{{first_name}}"))
    .replaceAll("{{business}}", value("business", "{{business_name}}"))
    .replaceAll("{{service}}", value("service", "{{service}}"))
    .replaceAll("{{amount}}", value("amount", "{{amount}}"))
    .replaceAll("{{next_step}}", value("next", "{{next_step}}"))
    .replaceAll("{{closer}}", englishClosers[tone]);

  return channel === "sms" ? message.replace(/\s+/g, " ").trim() : `${message}\n\nThanks,\n{{your_name}}`;
}

function wireGenerator() {
  const output = document.getElementById("message-output");
  if (!output) return;

  const isSpanish = output.getAttribute("data-language") === "es";
  const render = () => {
    output.value = isSpanish ? renderSpanishMessage() : renderEnglishMessage();
  };

  document.querySelectorAll(".segment").forEach((button) => {
    button.addEventListener("click", () => {
      setActive(button);
      render();
    });
  });

  document.querySelectorAll("input").forEach((input) => {
    input.addEventListener("input", render);
  });

  const copy = document.getElementById("copy-message");
  if (copy) {
    copy.addEventListener("click", async () => {
      try {
        await navigator.clipboard.writeText(output.value);
        copy.textContent = isSpanish ? "Copiado" : "Copied";
      } catch {
        copy.textContent = isSpanish ? "Selecciona y copia" : "Select and copy";
      }
    });
  }

  render();
}

document.addEventListener("DOMContentLoaded", () => {
  wirePayPalLinks();
  wireGenerator();
});
