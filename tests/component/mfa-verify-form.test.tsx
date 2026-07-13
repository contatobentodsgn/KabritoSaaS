// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest";
import "@testing-library/jest-dom/vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MfaVerifyForm } from "@/components/forms/mfa-verify-form";
import {
  verifyLoginMfaAction,
  verifyRecoveryCodeAction,
} from "@/server/actions/mfa";
import { toast } from "sonner";

/**
 * Formulário de verificação MFA no fluxo de login (aal1 -> aal2). Mocka as
 * Server Actions e o toast — não depende de Supabase real.
 */
vi.mock("@/server/actions/mfa", () => ({
  verifyLoginMfaAction: vi.fn(),
  verifyRecoveryCodeAction: vi.fn(),
}));
vi.mock("sonner", () => ({
  toast: { error: vi.fn(), success: vi.fn() },
}));

const mockedVerify = vi.mocked(verifyLoginMfaAction);
const mockedRecovery = vi.mocked(verifyRecoveryCodeAction);
const FACTOR_ID = "factor-123";

describe("MfaVerifyForm", () => {
  beforeEach(() => {
    mockedVerify.mockReset();
    mockedRecovery.mockReset();
    vi.mocked(toast.error).mockReset();
  });

  it("mantém o botão Verificar desabilitado até haver 6 dígitos", async () => {
    const user = userEvent.setup();
    render(<MfaVerifyForm factorId={FACTOR_ID} />);

    const button = screen.getByRole("button", { name: "Verificar" });
    expect(button).toBeDisabled();

    await user.type(screen.getByLabelText("Código de verificação"), "123");
    expect(button).toBeDisabled();

    await user.type(screen.getByLabelText("Código de verificação"), "456");
    expect(button).not.toBeDisabled();
  });

  it("envia o código TOTP com o factorId para verifyLoginMfaAction", async () => {
    mockedVerify.mockResolvedValue({ ok: true });
    const user = userEvent.setup();
    render(<MfaVerifyForm factorId={FACTOR_ID} />);

    await user.type(screen.getByLabelText("Código de verificação"), "654321");
    await user.click(screen.getByRole("button", { name: "Verificar" }));

    await waitFor(() =>
      expect(mockedVerify).toHaveBeenCalledWith(FACTOR_ID, "654321"),
    );
    expect(mockedRecovery).not.toHaveBeenCalled();
  });

  it("mostra um toast de erro quando o código é inválido", async () => {
    mockedVerify.mockResolvedValue({
      ok: false,
      error:
        "Código inválido. Confira o código atual no app autenticador e tente de novo.",
    });
    const user = userEvent.setup();
    render(<MfaVerifyForm factorId={FACTOR_ID} />);

    await user.type(screen.getByLabelText("Código de verificação"), "000000");
    await user.click(screen.getByRole("button", { name: "Verificar" }));

    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith(
        "Código inválido. Confira o código atual no app autenticador e tente de novo.",
      ),
    );
  });

  it("alterna para o modo de código de recuperação e envia via verifyRecoveryCodeAction", async () => {
    mockedRecovery.mockResolvedValue({ ok: true });
    const user = userEvent.setup();
    render(<MfaVerifyForm factorId={FACTOR_ID} />);

    await user.click(
      screen.getByRole("button", {
        name: "Perdi o acesso ao autenticador, usar um código de recuperação",
      }),
    );

    const recoveryInput = screen.getByLabelText("Código de recuperação");
    await user.type(recoveryInput, "AAAA-BBBB-CCCC");
    await user.click(screen.getByRole("button", { name: "Verificar" }));

    await waitFor(() =>
      expect(mockedRecovery).toHaveBeenCalledWith("AAAA-BBBB-CCCC"),
    );
    expect(mockedVerify).not.toHaveBeenCalled();
  });

  it("desabilita o botão e mostra 'Verificando...' enquanto a action está pendente", async () => {
    let resolveAction!: (
      v: { ok: true } | { ok: false; error: string },
    ) => void;
    mockedVerify.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveAction = resolve;
        }),
    );
    const user = userEvent.setup();
    render(<MfaVerifyForm factorId={FACTOR_ID} />);

    await user.type(screen.getByLabelText("Código de verificação"), "111111");
    await user.click(screen.getByRole("button", { name: "Verificar" }));

    const pendingButton = await screen.findByRole("button", {
      name: "Verificando...",
    });
    expect(pendingButton).toBeDisabled();

    resolveAction({ ok: true });
    await waitFor(() =>
      expect(
        screen.queryByRole("button", { name: "Verificando..." }),
      ).not.toBeInTheDocument(),
    );
  });
});
