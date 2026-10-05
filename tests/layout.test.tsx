import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import RootLayout from "@/app/layout";
import Home from "@/app/page";

describe("root layout", () => {
  const html = renderToStaticMarkup(
    <RootLayout>
      <Home />
    </RootLayout>,
  );

  it("renders the never-ask banner on every screen", () => {
    expect(html).toContain('data-testid="nunca-pedimos"');
    expect(html).toContain("Nunca te vamos a pedir");
    expect(html).toContain("contraseñas, acceso a tu computadora ni dinero");
  });

  it("renders 'Hablar con una persona' as a tel:088 link", () => {
    expect(html).toMatch(/<a href="tel:088"[^>]*data-testid="hablar-con-persona"/);
    expect(html).toContain("Hablar con una persona · 088");
  });

  it("is in Spanish and has no password input", () => {
    expect(html).toContain('lang="es-MX"');
    expect(html).not.toMatch(/type="password"/i);
  });
});
