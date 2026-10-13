import { createServerFn } from "@tanstack/react-start";

export const ESPECIALIDADES = [
  "Clínico Geral", "Cardiologia", "Dermatologia", "Ginecologia", "Ortopedia",
  "Pediatria", "Oftalmologia", "Psiquiatria", "Neurologia", "Endocrinologia",
];

export const sugerirEspecialidade = createServerFn({ method: "POST" })
  .inputValidator((d: { necessidades: string }) => {
    const t = String(d?.necessidades ?? "").trim();
    if (t.length < 5 || t.length > 2000) throw new Error("Descreva as necessidades (5 a 2000 caracteres).");
    return { necessidades: t };
  })
  .handler(async ({ data }) => {
    const key = process.env["LOVABLE_API_KEY"];
    if (!key) return { error: "IA não configurada." };
    const res = await fetch("https://ai.gateway.lovable.dev/v1/responses", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}`, "X-Lovable-AIG-SDK": "fetch" },
      body: JSON.stringify({
        model: "openai/gpt-6-astra",
        stream: true,
        store: false,
        reasoning: { effort: "low" },
        instructions: `Você é um assistente de triagem de uma clínica. Com base na descrição do paciente, escolha a especialidade mais adequada entre: ${ESPECIALIDADES.join(", ")}. Explique o motivo em uma frase curta em português. Não faça diagnóstico.`,
        input: data.necessidades,
        text: {
          format: {
            type: "json_schema", name: "sugestao", strict: true,
            schema: {
              type: "object", additionalProperties: false, required: ["especialidade", "motivo"],
              properties: { especialidade: { type: "string", enum: ESPECIALIDADES }, motivo: { type: "string" } },
            },
          },
        },
      }),
    });
    if (!res.ok || !res.body) {
      const msg = await res.text().catch(() => "");
      console.error("AI gateway", res.status, msg);
      if (res.status === 429) return { error: "Muitas solicitações. Aguarde um pouco e tente novamente." };
      if (res.status === 402) return { error: "Créditos de IA esgotados." };
      return { error: "Não foi possível obter a sugestão agora." };
    }
    const reader = res.body.getReader();
    const dec = new TextDecoder();
    let buf = "", text = "";
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      buf += dec.decode(value, { stream: true });
      const lines = buf.split("\n");
      buf = lines.pop() ?? "";
      for (const l of lines) {
        if (!l.startsWith("data:")) continue;
        try {
          const ev = JSON.parse(l.slice(5).trim());
          if (ev.type === "response.output_text.delta") text += ev.delta;
        } catch { /* ignore */ }
      }
    }
    try {
      const out = JSON.parse(text) as { especialidade: string; motivo: string };
      return { especialidade: out.especialidade, motivo: out.motivo };
    } catch {
      return { error: "Resposta da IA inválida. Tente novamente." };
    }
  });
