import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Agende sua consulta — Clínica" },
      { name: "description", content: "Solicite sua consulta em poucos segundos: nome, cidade, telefone e especialidade." },
      { property: "og:title", content: "Agende sua consulta — Clínica" },
      { property: "og:description", content: "Solicite sua consulta em poucos segundos." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Index,
});

const ESPECIALIDADES = [
  "Clínico Geral", "Cardiologia", "Dermatologia", "Ginecologia", "Ortopedia",
  "Pediatria", "Oftalmologia", "Psiquiatria", "Neurologia", "Endocrinologia",
];

function maskPhone(v: string) {
  const d = v.replace(/\D/g, "").slice(0, 11);
  if (d.length <= 2) return d;
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
}

function Index() {
  const [form, setForm] = useState({ nome: "", cidade: "", telefone: "", especialidade: "" });
  const [status, setStatus] = useState<"idle" | "saving" | "ok" | "erro">("idle");
  const [erro, setErro] = useState("");

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    if (form.nome.trim().length < 2 || form.cidade.trim().length < 2 || form.telefone.replace(/\D/g, "").length < 10 || !form.especialidade) {
      setErro("Preencha todos os campos corretamente.");
      return;
    }
    setErro("");
    setStatus("saving");
    const { error } = await supabase.from("agendamentos").insert({
      nome: form.nome.trim(), cidade: form.cidade.trim(), telefone: form.telefone, especialidade: form.especialidade,
    });
    if (error) { setStatus("erro"); setErro("Não foi possível enviar. Tente novamente."); return; }
    setStatus("ok");
  }

  return (
    <main className="min-h-screen bg-background flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-lg">
        <header className="mb-8 text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary">Clínica</p>
          <h1 className="mt-2 font-display text-4xl text-foreground">Agende sua consulta</h1>
          <p className="mt-3 text-muted-foreground">Preencha os dados e entraremos em contato para confirmar o horário.</p>
        </header>

        <div className="rounded-2xl border bg-card p-8 shadow-soft">
          {status === "ok" ? (
            <div className="text-center py-6">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-2xl text-primary">✓</div>
              <h2 className="font-display text-2xl text-card-foreground">Solicitação enviada!</h2>
              <p className="mt-2 text-muted-foreground">Obrigado, {form.nome.split(" ")[0]}. Ligaremos para {form.telefone} em breve.</p>
              <button className="mt-6 text-sm font-medium text-primary underline-offset-4 hover:underline"
                onClick={() => { setForm({ nome: "", cidade: "", telefone: "", especialidade: "" }); setStatus("idle"); }}>
                Fazer novo agendamento
              </button>
            </div>
          ) : (
            <form onSubmit={enviar} className="space-y-5">
              <Campo label="Nome do paciente">
                <input className="campo" value={form.nome} maxLength={120} placeholder="Ex.: Maria da Silva"
                  onChange={(e) => setForm({ ...form, nome: e.target.value })} />
              </Campo>
              <Campo label="Cidade">
                <input className="campo" value={form.cidade} maxLength={80} placeholder="Ex.: São Paulo"
                  onChange={(e) => setForm({ ...form, cidade: e.target.value })} />
              </Campo>
              <Campo label="Telefone">
                <input className="campo" inputMode="tel" value={form.telefone} placeholder="(11) 99999-9999"
                  onChange={(e) => setForm({ ...form, telefone: maskPhone(e.target.value) })} />
              </Campo>
              <Campo label="Especialidade">
                <select className="campo" value={form.especialidade}
                  onChange={(e) => setForm({ ...form, especialidade: e.target.value })}>
                  <option value="">Selecione...</option>
                  {ESPECIALIDADES.map((s) => <option key={s}>{s}</option>)}
                </select>
              </Campo>
              {erro && <p className="text-sm text-destructive">{erro}</p>}
              <button type="submit" disabled={status === "saving"}
                className="w-full rounded-xl bg-primary py-3 font-semibold text-primary-foreground transition hover:opacity-90 disabled:opacity-60">
                {status === "saving" ? "Enviando..." : "Solicitar consulta"}
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
