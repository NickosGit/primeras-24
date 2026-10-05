import { describe, expect, it } from "vitest";
import { OCULTO, redactSecrets, shadowMotivo, violatesShadow } from "@/lib/guard";

describe("redactSecrets", () => {
  it("redacts 'mi contraseña es Gato2024!'", () => {
    const r = redactSecrets("Llegué y mi contraseña es Gato2024! no sirve");
    expect(r.redacted).toBe(true);
    expect(r.clean).not.toContain("Gato2024");
    expect(r.clean).toContain(OCULTO);
  });

  it.each([
    ["clave: perro99", "perro99"],
    ["el password Hola123", "Hola123"],
    ["mi nip es 4821", "4821"],
    ["pass=abc$12", "abc$12"],
    ["CONTRASEÑA: Ñandú_7", "Ñandú_7"],
  ])("redacts the value after a secret keyword: %s", (texto, secreto) => {
    const r = redactSecrets(texto);
    expect(r.redacted).toBe(true);
    expect(r.clean).not.toContain(secreto);
  });

  it("redacts 16-digit card numbers and 18-digit CLABEs", () => {
    const r = redactSecrets(
      "me cobraron en la 4152 3131 2345 6789 y salió de la 012180001234567891",
    );
    expect(r.redacted).toBe(true);
    expect(r.clean).not.toMatch(/\d{4}/);
    expect(r.clean.match(/\[DATO OCULTO\]/g)).toHaveLength(2);
  });

  it("leaves normal sentences about passwords alone", () => {
    const texto = "me cambiaron la clave de mi correo y no puedo entrar";
    expect(redactSecrets(texto)).toEqual({ clean: texto, redacted: false });
  });

  it("leaves short numbers (phones, amounts) alone", () => {
    const texto = "me llamaron del 5512345678 y pidieron 5000 pesos";
    expect(redactSecrets(texto).redacted).toBe(false);
  });
});

describe("violatesShadow", () => {
  it.each([
    "comparte tu contraseña",
    "instala AnyDesk",
    "paga el rescate en bitcoin",
    "seguramente fue tu exempleado",
    "publícalo en redes",
    "formatea la computadora",
    "ya estás protegida",
    // the rest of the forbidden behaviors
    "Mándanos el código que te llegó por SMS",
    "Abre TeamViewer para que te ayudemos",
    "Negocia con ellos un descuento",
    "Compra bitcoin en un cajero",
    "Hackéalos de vuelta",
    "Fue tu proveedor de sistemas",
    "Esto es obra de LockBit",
    "Súbelo a Facebook para alertar a otros",
    "Restaura el respaldo de ayer",
    "Descarga y ejecuta el descifrador",
    "Tranquila, tus archivos se van a recuperar",
    "Tu clínica está a salvo",
    "Ya estás segura",
  ])("blocks: %s", (texto) => {
    expect(violatesShadow(texto)).toBe(true);
  });

  it.each([
    "desconecta la compu del internet",
    "No pagues y no le contestes a quien te escribe.",
    "No conectes tu disco de respaldo a esa compu.",
    "Nunca compartas tu contraseña con nadie.",
    "La compu de recepción muestra una pantalla roja que pide bitcoins.",
    "Tus pacientes recibieron correos tuyos pidiendo depósitos.",
    "Hicieron una transferencia que no autorizaste.",
  ])("allows: %s", (texto) => {
    expect(shadowMotivo(texto)).toBeNull();
  });

  it("is case and accent insensitive", () => {
    expect(violatesShadow("PUBLICALO EN REDES")).toBe(true);
    expect(violatesShadow("ya estas protegida")).toBe(true);
    expect(violatesShadow("Comparte Tu Contrasena")).toBe(true);
  });
});
