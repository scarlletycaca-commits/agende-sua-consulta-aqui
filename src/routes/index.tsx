import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import logo from "@/assets/logo-eclim.jpg.asset.json";
import { ESPECIALIDADES, SUBTIPOS } from "@/lib/especialidade.functions";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Agende sua consulta — Clínica ECLIM" },
      { name: "description", content: "Solicite sua consulta em poucos segundos: nome, cidade, telefone e especialidade." },
      { property: "og:title", content: "Agende sua consulta — Clínica ECLIM" },
      { property: "og:description", content: "Solicite sua consulta em poucos segundos." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Index,
});

const WHATS = "5583988551095";

function maskPhone(v: string) {
  const d = v.replace(/\D/g, "").slice(0, 11);
  if (d.length <= 2) return d;
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
}

const VAZIO = { nome: "", cidade: "", telefone: "", especialidade: "", tipo: "" };

function Index() {
  const [form, setForm] = useState(VAZIO);
  const [status, setStatus] = useState<"idle" | "revisar" | "saving" | "ok" | "erro">("idle");
  const [erro, setErro] = useState("");
  const tipos = SUBTIPOS[form.especialidade];
  const espCompleta = form.tipo ? `${form.especialidade} - ${form.tipo}` : form.especialidade;

  function revisar(e: React.FormEvent) {
    e.preventDefault();
    if (form.nome.trim().length < 2 || form.cidade.trim().length < 2 || form.telefone.replace(/\D/g, "").length < 10 || !form.especialidade) {
      setErro("Preencha todos os campos corretamente.");
      return;
    }
    if (tipos && !form.tipo) { setErro(`Especifique o tipo de ${form.especialidade}.`); return; }
    setErro("");
    setStatus("revisar");
  }

  async function confirmar() {
    setStatus("saving");
    const { error } = await supabase.from("agendamentos").insert({
      nome: form.nome.trim(), cidade: form.cidade.trim(), telefone: form.telefone, especialidade: espCompleta,
    });
    if (error) { setStatus("revisar"); setErro("Não foi possível enviar. Tente novamente."); return; }
    setErro("");
    setStatus("ok");
  }

  function linkWhats() {
    const msg = `*Nova solicitação de consulta - Clínica ECLIM*\n\nPaciente: ${form.nome.trim()}\nCidade: ${form.cidade.trim()}\nTelefone: ${form.telefone}\nEspecialidade: ${espCompleta}\n\nPor favor, confirmem se há disponibilidade.`;
    return `https://wa.me/${WHATS}?text=${encodeURIComponent(msg)}`;
  }

  return (
    <main className="min-h-screen bg-background flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-lg">
        <header className="mb-8 text-center">
          <img src={logo} alt="Clínica ECLIM" className="mx-auto mb-5 h-40 w-auto rounded-2xl bg-white p-3 shadow-soft" />
          <h1 className="font-display text-4xl text-foreground">Agende sua consulta</h1>
          <p className="mt-3 text-muted-foreground">Preencha os dados. Sua solicitação vai para o WhatsApp da clínica, que confirma a disponibilidade.</p>
        </header>

        <div className="rounded-2xl border bg-card p-8 shadow-soft">
          {status === "ok" ? (
            <div className="text-center py-6">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-2xl text-primary">✓</div>
              <h2 className="font-display text-2xl text-card-foreground">Dados confirmados!</h2>
              <p className="mt-2 text-muted-foreground">Obrigado, {form.nome.split(" ")[0]}. Toque no botão abaixo para enviar a solicitação no WhatsApp. A clínica responderá confirmando se há disponibilidade.</p>
              <a href={linkWhats()} target="_blank" rel="noreferrer"
                className="mt-5 inline-block rounded-xl bg-primary px-5 py-3 font-semibold text-primary-foreground hover:opacity-90">
                Enviar no WhatsApp da clínica
              </a>
              <button className="mt-6 block mx-auto text-sm font-medium text-primary underline-offset-4 hover:underline"
                onClick={() => { setForm(VAZIO); setStatus("idle"); }}>
                Fazer novo agendamento
              </button>
            </div>
          ) : status === "revisar" || status === "saving" ? (
            <div>
              <h2 className="font-display text-2xl text-card-foreground">Confira seus dados</h2>
              <dl className="mt-4 space-y-2 text-sm">
                {[["Paciente", form.nome.trim()], ["Cidade", form.cidade.trim()], ["Telefone", form.telefone],
                  ["Especialidade", espCompleta]].map(([k, v]) => (
                  <div key={k} className="flex justify-between gap-4 border-b pb-2">
                    <dt className="text-muted-foreground">{k}</dt><dd className="text-right font-medium text-card-foreground">{v}</dd>
                  </div>
                ))}
              </dl>
              {erro && <p className="mt-3 text-sm text-destructive">{erro}</p>}
              <button onClick={confirmar} disabled={status === "saving"}
                className="mt-6 w-full rounded-xl bg-primary py-3 font-semibold text-primary-foreground transition hover:opacity-90 disabled:opacity-60">
                {status === "saving" ? "Confirmando..." : "Confirmar dados"}
              </button>
              <button onClick={() => setStatus("idle")} className="mt-3 w-full text-sm font-medium text-primary hover:underline">
                Corrigir dados
              </button>
            </div>
          ) : (
            <form onSubmit={revisar} className="space-y-5">
              <Campo label="Nome do paciente">
                <input className="campo" value={form.nome} maxLength={120} placeholder="Ex.: Maria da Silva"
                  onChange={(e) => setForm({ ...form, nome: e.target.value })} />
              </Campo>
              <Campo label="Cidade">
                <input className="campo" value={form.cidade} maxLength={80} placeholder="Ex.: João Pessoa"
                  onChange={(e) => setForm({ ...form, cidade: e.target.value })} />
              </Campo>
              <Campo label="Telefone">
                <input className="campo" inputMode="tel" value={form.telefone} placeholder="(83) 99999-9999"
                  onChange={(e) => setForm({ ...form, telefone: maskPhone(e.target.value) })} />
              </Campo>
              <Campo label="Especialidade">
                <select className="campo" value={form.especialidade}
                  onChange={(e) => setForm({ ...form, especialidade: e.target.value, tipo: "" })}>
                  <option value="">Selecione...</option>
                  {ESPECIALIDADES.map((s) => <option key={s}>{s}</option>)}
                </select>
              </Campo>
              {tipos && (
                <Campo label={`Tipo de ${form.especialidade}`}>
                  <select className="campo" value={form.tipo}
                    onChange={(e) => setForm({ ...form, tipo: e.target.value })}>
                    <option value="">Selecione...</option>
                    {tipos.map((s) => <option key={s}>{s}</option>)}
                  </select>
                </Campo>
              )}
              {erro && <p className="text-sm text-destructive">{erro}</p>}
              <button type="submit"
                className="w-full rounded-xl bg-primary py-3 font-semibold text-primary-foreground transition hover:opacity-90">
                Continuar
              </button>
            </form>
          )}
        </div>
      </div>
    </main>
  );
}

function Campo({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-card-foreground">{label}</span>
      {children}
    </label>
  );
}
