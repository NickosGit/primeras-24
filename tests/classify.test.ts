import { describe, expect, it } from "vitest";
import { classifyByKeywords } from "@/lib/classify";

describe("classifyByKeywords", () => {
  it.each([
    ["la compu de recepción tiene una pantalla roja que pide bitcoins", "ransomware"],
    [
      "Llegué a la clínica y la compu de recepción tiene una pantalla roja en inglés que pide bitcoins. No abre la agenda ni los expedientes.",
      "ransomware",
    ],
    ["todos los archivos tienen extensión .locked y no abren", "ransomware"],
    ["mis pacientes recibieron correos míos pidiendo depósitos", "correo"],
    ["hackearon mi correo y no puedo entrar", "correo"],
    ["Hicieron una transferencia que yo no autoricé", "banco"],
    ["aparecen cargos que no reconozco en la tarjeta", "banco"],
  ])("%s -> %s", (texto, tipo) => {
    expect(classifyByKeywords(texto)).toBe(tipo);
  });

  it.each([
    "algo raro pasa con la compu",
    "la computadora está muy lenta desde ayer",
    "no sé qué pasó pero nada funciona",
    "",
  ])("vague text is no_claro: %s", (texto) => {
    expect(classifyByKeywords(texto)).toBe("no_claro");
  });

  it("returns no_claro when strong keywords point to more than one type", () => {
    expect(
      classifyByKeywords(
        "la pantalla pide bitcoins y además hicieron una transferencia que no autoricé",
      ),
    ).toBe("no_claro");
  });
});
