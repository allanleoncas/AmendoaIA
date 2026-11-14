import { useState, useMemo } from "react"
import {
  AreaChart, Area, LineChart, Line, BarChart, Bar, ComposedChart,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  ReferenceLine, Cell, ScatterChart, Scatter, ZAxis
} from "recharts"

// ── TOKENS ───────────────────────────────────────────────────────────────────
const G = "#c8a94a", GR = "#52c78f", MU = "#7a9b7d", BO = "#1c3320"
const CB = "#0c1a0e", TX = "#d8ead9", RD = "#e05c5c", AM = "#e0a040", BG = "#080f09"
const TP = { background: CB, border: `1px solid ${BO}`, borderRadius: 6, fontSize: 12, color: TX }
const brl = n => "R$ " + Math.round(n).toLocaleString("pt-BR")
const brlK = n => n >= 1e6 ? `R$ ${(n/1e6).toFixed(2)} mi` : n >= 1e3 ? `R$ ${(n/1e3).toFixed(0)} mil` : brl(n)

// ── DADOS DE MERCADO ─────────────────────────────────────────────────────────
const PRECO_SC = 110
const KG_SACA = 25
const CAMBIO = 4.95

const curvaCusto = [
  { pct: 10, custo: 11200 }, { pct: 20, custo: 12400 }, { pct: 30, custo: 13300 },
  { pct: 40, custo: 14100 }, { pct: 50, custo: 14800 }, { pct: 60, custo: 15500 },
  { pct: 70, custo: 16300 }, { pct: 80, custo: 17400 }, { pct: 90, custo: 19100 },
]

const compradores = [
  { nome: "União Europeia", part: 28, premio: 14, aflMax: 4, calMin: 70, rastr: 80, prazo: 45, obs: "Maior prêmio, maior exigência documental" },
  { nome: "Rússia", part: 22, premio: 4, aflMax: 15, calMin: 60, rastr: 30, prazo: 30, obs: "Volume alto, exigência técnica moderada" },
  { nome: "China", part: 20, premio: 7, aflMax: 15, calMin: 62, rastr: 40, prazo: 35, obs: "Forte demanda por óleo e grão premium" },
  { nome: "Argélia", part: 12, premio: 2, aflMax: 15, calMin: 55, rastr: 25, prazo: 60, obs: "Prazo longo, risco de contraparte" },
  { nome: "Indústria interna", part: 18, premio: 0, aflMax: 20, calMin: 50, rastr: 15, prazo: 21, obs: "Liquidez imediata, sem prêmio" },
]

const porterData = [
  { forca: "Poder do comprador", valor: 78, nota: "Poucos processadores concentram a compra" },
  { forca: "Poder do fornecedor", valor: 62, nota: "Revendas de insumo com margem protegida" },
  { forca: "Rivalidade", valor: 55, nota: "Concorrência por área e por janela de colheita" },
  { forca: "Novos entrantes", valor: 38, nota: "Barreira alta: maquinário específico" },
  { forca: "Substitutos", valor: 44, nota: "Outras oleaginosas na pasta e no óleo" },
]

const investimentos = [
  { id: "armazem", nome: "Armazém próprio 2.000 t", capex: 1850000, ganhoAno: 412000, vidaUtil: 20, desc: "Elimina custo de armazenagem terceirizada e abre janela de venda estendida" },
  { id: "secador", nome: "Secador estacionário", capex: 620000, ganhoAno: 198000, vidaUtil: 15, desc: "Reduz risco de aflatoxina e perda de qualidade por umidade" },
  { id: "certif", nome: "Certificação para exportação UE", capex: 145000, ganhoAno: 262000, vidaUtil: 5, desc: "Acesso ao prêmio de 14% do mercado europeu" },
  { id: "beneficia", nome: "Linha de descascamento", capex: 2400000, ganhoAno: 540000, vidaUtil: 18, desc: "Sobe um degrau na escada de valor do produto" },
  { id: "arrancadora", nome: "Arrancadora adicional", capex: 780000, ganhoAno: 215000, vidaUtil: 10, desc: "Reduz dias de janela e perda por atraso no arranquio" },
]

const riscos = [
  { nome: "Déficit hídrico severo", prob: 32, impacto: 890000, cat: "Clima", mitig: "Seguro paramétrico cobre até 70%" },
  { nome: "Rebaixamento de lote por aflatoxina", prob: 24, impacto: 620000, cat: "Qualidade", mitig: "Secagem controlada e amostragem por lote" },
  { nome: "Queda de preço abaixo de R$95/sc", prob: 41, impacto: 545000, cat: "Mercado", mitig: "Trava de preço via contrato a termo" },
  { nome: "Câmbio abaixo de R$4,40", prob: 28, impacto: 310000, cat: "Mercado", mitig: "Hedge cambial sobre parcela exportada" },
  { nome: "Quebra de arrancadora na janela", prob: 18, impacto: 425000, cat: "Operacional", mitig: "Contrato de manutenção e peças críticas em estoque" },
  { nome: "Rejeição documental na UE", prob: 15, impacto: 268000, cat: "Regulatório", mitig: "Dossiê de rastreabilidade completo" },
  { nome: "Autuação trabalhista", prob: 12, impacto: 180000, cat: "Jurídico", mitig: "Auditoria NR-31 anual" },
]

const escadaProduto = [
  { degrau: "Em casca", preco: 4.40, capex: 0, margem: 20.9 },
  { degrau: "Descascado", preco: 6.15, capex: 2400000, margem: 27.4 },
  { degrau: "Selecionado calibre", preco: 6.90, capex: 3100000, margem: 30.1 },
  { degrau: "Blancheado", preco: 7.80, capex: 4200000, margem: 32.8 },
  { degrau: "Pasta / óleo", preco: 9.20, capex: 7500000, margem: 36.2 },
]

const aflatoxinaCurva = [
  { dias: 0, u10: 0.8, u12: 1.2, u14: 2.1 },
  { dias: 30, u10: 1.1, u12: 2.4, u14: 5.8 },
  { dias: 60, u10: 1.5, u12: 3.9, u14: 11.2 },
  { dias: 90, u10: 2.0, u12: 5.6, u14: 18.4 },
  { dias: 120, u10: 2.6, u12: 7.8, u14: 26.1 },
  { dias: 150, u10: 3.3, u12: 10.4, u14: 34.5 },
  { dias: 180, u10: 4.1, u12: 13.5, u14: 43.2 },
]

const precoProj = [
  { mes: "Abr/26", real: 110, proj: 110 }, { mes: "Mai/26", proj: 112 },
  { mes: "Jun/26", proj: 113 }, { mes: "Jul/26", proj: 116 },
  { mes: "Ago/26", proj: 119 }, { mes: "Set/26", proj: 117 },
  { mes: "Out/26", proj: 121 }, { mes: "Nov/26", proj: 124 },
]

// ── COMPONENTES BASE ─────────────────────────────────────────────────────────
function KPI({ label, value, sub, color = MU, big }) {
  return (
    <div style={{ background: CB, border: `1px solid ${BO}`, borderRadius: 10, padding: big ? "18px 20px" : "14px 16px" }}>
      <div style={{ fontSize: 11, color: MU, marginBottom: 5 }}>{label}</div>
      <div style={{ fontFamily: "'DM Mono',monospace", fontSize: big ? 22 : 16, color: TX, fontWeight: 500 }}>{value}</div>
      {sub && <div style={{ fontSize: 11, marginTop: 4, color }}>{sub}</div>}
    </div>
  )
}

function Card({ children, title, subtitle, style = {} }) {
  return (
    <div style={{ background: CB, border: `1px solid ${BO}`, borderRadius: 10, padding: 18, ...style }}>
      {title && <div style={{ fontSize: 13, color: MU, fontWeight: 500, marginBottom: subtitle ? 3 : 14 }}>{title}</div>}
      {subtitle && <div style={{ fontSize: 11, color: "#4a6b4d", marginBottom: 14 }}>{subtitle}</div>}
      {children}
    </div>
  )
}

function Slider({ label, min, max, step, value, onChange, display }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 11 }}>
      <div style={{ fontSize: 12, color: MU, minWidth: 190 }}>{label}</div>
      <input type="range" min={min} max={max} step={step} value={value} onChange={e => onChange(parseFloat(e.target.value))} style={{ flex: 1, accentColor: G }} />
      <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 13, color: TX, minWidth: 95, textAlign: "right" }}>{display}</span>
    </div>
  )
}

function Field({ label, value, onChange, step = 1, suffix }) {
  return (
    <div>
      <div style={{ fontSize: 11, color: MU, marginBottom: 4 }}>{label}</div>
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        <input type="number" step={step} value={value} onChange={e => onChange(parseFloat(e.target.value) || 0)}
          style={{ width: "100%", background: BG, border: `1px solid ${BO}`, borderRadius: 6, padding: "7px 10px", color: TX, fontFamily: "'DM Mono',monospace", fontSize: 13, outline: "none" }} />
        {suffix && <span style={{ fontSize: 11, color: MU, whiteSpace: "nowrap" }}>{suffix}</span>}
      </div>
    </div>
  )
}

function Box({ label, value, note, color = TX, size = 16 }) {
  return (
    <div style={{ background: BG, border: `1px solid ${BO}`, borderRadius: 8, padding: "12px 14px" }}>
      <div style={{ fontSize: 11, color: MU, marginBottom: 4 }}>{label}</div>
      <div style={{ fontFamily: "'DM Mono',monospace", fontSize: size, fontWeight: 500, color }}>{value}</div>
      {note && <div style={{ fontSize: 10, color: "#3a5a3d", marginTop: 3 }}>{note}</div>}
    </div>
  )
}

function Tag({ children, color = MU }) {
  return <span style={{ fontSize: 10, padding: "2px 8px", borderRadius: 8, background: `${color}1a`, border: `1px solid ${color}44`, color, whiteSpace: "nowrap" }}>{children}</span>
}

function SubTab({ id, label, active, set }) {
  return (
    <button onClick={() => set(id)} style={{
      background: active === id ? "rgba(200,169,74,.13)" : "none",
      border: `1px solid ${active === id ? "rgba(200,169,74,.3)" : BO}`,
      color: active === id ? G : MU, padding: "4px 12px", borderRadius: 6,
      fontSize: 12, cursor: "pointer", fontFamily: "'DM Sans',sans-serif", transition: "all .2s"
    }}>{label}</button>
  )
}

// ── 0. PERFIL DA EMPRESA ─────────────────────────────────────────────────────
function Perfil({ p, setP }) {
  const set = (k, v) => setP(prev => ({ ...prev, [k]: v }))
  return (
    <div>
      <Card title="Perfil da empresa" subtitle="Estes dados alimentam todas as visões do módulo. Preencha uma vez e o sistema recalcula tudo automaticamente.">
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12, marginBottom: 16 }}>
          <Field label="Área plantada" value={p.area} onChange={v => set("area", v)} step={10} suffix="ha" />
          <Field label="Produtividade esperada" value={p.prod} onChange={v => set("prod", v)} step={50} suffix="kg/ha" />
          <Field label="Custo de produção" value={p.custo} onChange={v => set("custo", v)} step={100} suffix="R$/ha" />
          <Field label="Preço de venda praticado" value={p.preco} onChange={v => set("preco", v)} step={1} suffix="R$/sc" />
          <Field label="Capacidade de armazenagem" value={p.armazem} onChange={v => set("armazem", v)} step={5} suffix="% da safra" />
          <Field label="Custo de armazenagem" value={p.custoArm} onChange={v => set("custoArm", v)} step={0.05} suffix="R$/sc/mês" />
          <Field label="Frete até o comprador" value={p.frete} onChange={v => set("frete", v)} step={1} suffix="R$/t" />
          <Field label="Custo de capital" value={p.cmpc} onChange={v => set("cmpc", v)} step={0.5} suffix="% a.a." />
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12 }}>
          <div>
            <div style={{ fontSize: 11, color: MU, marginBottom: 4 }}>Regime tributário</div>
            <select value={p.regime} onChange={e => set("regime", e.target.value)} style={{ width: "100%", background: BG, border: `1px solid ${BO}`, borderRadius: 6, padding: "7px 10px", color: TX, fontSize: 13, outline: "none" }}>
              <option value="pf">Produtor rural pessoa física</option>
              <option value="presumido">Lucro presumido</option>
              <option value="real">Lucro real</option>
            </select>
          </div>
          <div>
            <div style={{ fontSize: 11, color: MU, marginBottom: 4 }}>Nível de beneficiamento atual</div>
            <select value={p.degrau} onChange={e => set("degrau", e.target.value)} style={{ width: "100%", background: BG, border: `1px solid ${BO}`, borderRadius: 6, padding: "7px 10px", color: TX, fontSize: 13, outline: "none" }}>
              {escadaProduto.map(d => <option key={d.degrau} value={d.degrau}>{d.degrau}</option>)}
            </select>
          </div>
          <div>
            <div style={{ fontSize: 11, color: MU, marginBottom: 4 }}>Certificação para exportação UE</div>
            <select value={p.certUE} onChange={e => set("certUE", e.target.value)} style={{ width: "100%", background: BG, border: `1px solid ${BO}`, borderRadius: 6, padding: "7px 10px", color: TX, fontSize: 13, outline: "none" }}>
              <option value="sim">Certificada e ativa</option>
              <option value="processo">Em processo</option>
              <option value="nao">Não possui</option>
            </select>
          </div>
        </div>
      </Card>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 10, marginTop: 14 }}>
        <KPI label="Produção estimada" value={`${Math.round(p.area * p.prod / 1000).toLocaleString("pt-BR")} t`} sub={`${Math.round(p.area * p.prod / KG_SACA).toLocaleString("pt-BR")} sacas de 25 kg`} />
        <KPI label="Receita bruta projetada" value={brlK(p.area * p.prod / KG_SACA * p.preco)} sub={`${p.area} ha × ${p.prod} kg/ha`} color={GR} />
        <KPI label="Custo total da safra" value={brlK(p.area * p.custo)} sub={`${brl(p.custo)}/ha`} color={AM} />
        <KPI label="Margem bruta projetada" value={brlK(p.area * p.prod / KG_SACA * p.preco - p.area * p.custo)} sub={`${((1 - p.custo / (p.prod / KG_SACA * p.preco)) * 100).toFixed(1)}% sobre receita`} color={GR} />
      </div>
    </div>
  )
}

// ── 1. COCKPIT ───────────────────────────────────────────────────────────────
function Cockpit({ p }) {
  const sacas = p.area * p.prod / KG_SACA
  const receita = sacas * p.preco
  const custoProd = p.area * p.custo
  const custoFrete = (p.area * p.prod / 1000) * p.frete
  const custoArm = sacas * (p.armazem / 100) * p.custoArm * 3
  const margem = receita - custoProd - custoFrete - custoArm
  const margemPct = margem / receita * 100
  const margemTon = margem / (p.area * p.prod / 1000)
  const capitalGiro = custoProd * 0.72
  const cicloCaixa = 218

  const cascata = [
    { label: "Receita bruta", val: receita, tipo: "pos" },
    { label: "Custo de produção", val: -custoProd, tipo: "neg" },
    { label: "Frete", val: -custoFrete, tipo: "neg" },
    { label: "Armazenagem", val: -custoArm, tipo: "neg" },
    { label: "Margem líquida", val: margem, tipo: "fim" },
  ]
  const maxAbs = Math.max(...cascata.map(c => Math.abs(c.val)))

  const alertas = [
    { sev: margemPct < 15 ? "crit" : margemPct < 22 ? "warn" : "ok", txt: `Margem líquida em ${margemPct.toFixed(1)}%`, det: margemPct < 15 ? "Abaixo do piso saudável de 15% — revisar custo ou preço" : margemPct < 22 ? "Dentro da faixa, mas sem folga para choque de preço" : "Acima da mediana do setor", val: `${margemPct.toFixed(1)}%` },
    { sev: p.preco < 100 ? "crit" : p.preco < 118 ? "warn" : "ok", txt: "Preço praticado contra projeção de setembro", det: `Projeção AIM para set/2026: R$117/sc. Diferença de ${(117 - p.preco).toFixed(0)} reais por saca`, val: `R$ ${p.preco}/sc` },
    { sev: p.armazem < 30 ? "warn" : "ok", txt: "Capacidade de armazenagem própria", det: p.armazem < 30 ? "Baixa capacidade limita a janela de venda e força venda na colheita" : "Permite postergar venda para janelas de preço melhor", val: `${p.armazem}%` },
    { sev: p.certUE === "nao" ? "warn" : "ok", txt: "Acesso ao mercado de maior prêmio", det: p.certUE === "nao" ? `Sem certificação UE — prêmio de 14% inacessível, equivale a ${brlK(receita * 0.14 * 0.28)} por safra` : "Certificação ativa habilita venda com prêmio", val: p.certUE === "nao" ? "Bloqueado" : "Liberado" },
  ]
  const sc = { ok: GR, warn: AM, crit: RD }
  const sl = { ok: "OK", warn: "ATENÇÃO", crit: "CRÍTICO" }

  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(5,1fr)", gap: 10, marginBottom: 14 }}>
        <KPI big label="Margem líquida da safra" value={brlK(margem)} sub={`${margemPct.toFixed(1)}% sobre receita`} color={margemPct >= 20 ? GR : AM} />
        <KPI big label="Margem por tonelada" value={brl(margemTon)} sub="Após frete e armazenagem" color={GR} />
        <KPI big label="Capital de giro imobilizado" value={brlK(capitalGiro)} sub="72% do custo antes da receita" color={AM} />
        <KPI big label="Ciclo de caixa" value={`${cicloCaixa} dias`} sub="Do plantio ao recebimento" color={AM} />
        <KPI big label="Ponto de equilíbrio" value={`R$ ${(p.custo / (p.prod / KG_SACA)).toFixed(0)}/sc`} sub={`Margem de segurança: ${((p.preco - p.custo / (p.prod / KG_SACA)) / p.preco * 100).toFixed(0)}%`} color={GR} />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1.3fr 1fr", gap: 14, marginBottom: 14 }}>
        <Card title="Cascata de resultado da safra" subtitle="Da receita bruta à margem líquida, com todos os custos empresariais">
          {cascata.map((c, i) => (
            <div key={i} style={{ display: "grid", gridTemplateColumns: "150px 1fr 120px", gap: 12, alignItems: "center", marginBottom: 10 }}>
              <div style={{ fontSize: 12, color: c.tipo === "fim" ? TX : MU, fontWeight: c.tipo === "fim" ? 500 : 400 }}>{c.label}</div>
              <div style={{ height: 22, background: BG, borderRadius: 4, overflow: "hidden", border: `1px solid ${BO}` }}>
                <div style={{ width: `${Math.abs(c.val) / maxAbs * 100}%`, height: "100%", background: c.tipo === "pos" ? "#2d6b40" : c.tipo === "neg" ? "#6b3d12" : GR, borderRadius: 3 }} />
              </div>
              <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 13, textAlign: "right", color: c.tipo === "neg" ? AM : c.tipo === "fim" ? GR : TX }}>
                {c.val < 0 ? "−" : ""}{brlK(Math.abs(c.val))}
              </div>
            </div>
          ))}
          <div style={{ borderTop: `1px solid ${BO}`, marginTop: 12, paddingTop: 12, display: "flex", justifyContent: "space-between", fontSize: 12 }}>
            <span style={{ color: MU }}>Custo total por saca produzida</span>
            <span style={{ fontFamily: "'DM Mono',monospace", color: TX }}>R$ {((custoProd + custoFrete + custoArm) / sacas).toFixed(2)}/sc</span>
          </div>
        </Card>

        <Card title="Composição do resultado por hectare">
          <ResponsiveContainer width="100%" height={230}>
            <BarChart data={[
              { n: "Receita", v: receita / p.area },
              { n: "Custo prod.", v: -custoProd / p.area },
              { n: "Frete", v: -custoFrete / p.area },
              { n: "Armazen.", v: -custoArm / p.area },
              { n: "Margem", v: margem / p.area },
            ]}>
              <CartesianGrid strokeDasharray="3 3" stroke={BO} />
              <XAxis dataKey="n" tick={{ fontSize: 10, fill: MU }} />
              <YAxis tick={{ fontSize: 10, fill: "#3a5a3d" }} />
              <Tooltip contentStyle={TP} formatter={v => [brl(Math.abs(v)) + "/ha"]} />
              <ReferenceLine y={0} stroke={BO} />
              <Bar dataKey="v" radius={[3, 3, 0, 0]}>
                {[GR, "#6b3d12", "#6b3d12", "#6b3d12", G].map((c, i) => <Cell key={i} fill={c} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>

      <Card title="Alertas de gestão" subtitle="Desvios traduzidos em impacto financeiro, não em desvio estatístico">
        <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
          {alertas.map((a, i) => (
            <div key={i} style={{ background: BG, border: `1px solid ${BO}`, borderRadius: 8, padding: "10px 14px", display: "grid", gridTemplateColumns: "10px 1fr auto auto", gap: 12, alignItems: "center" }}>
              <div style={{ width: 8, height: 8, borderRadius: "50%", background: sc[a.sev] }} />
              <div>
                <div style={{ fontSize: 13, color: TX }}>{a.txt}</div>
                <div style={{ fontSize: 11, color: MU, marginTop: 2 }}>{a.det}</div>
              </div>
              <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 13, color: sc[a.sev] }}>{a.val}</div>
              <Tag color={sc[a.sev]}>{sl[a.sev]}</Tag>
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}

// ── 2. POSIÇÃO COMPETITIVA ───────────────────────────────────────────────────
function Posicao({ p }) {
  const meuCusto = p.custo
  const pos = curvaCusto.findIndex(c => c.custo >= meuCusto)
  const percentil = pos === -1 ? 95 : curvaCusto[pos].pct
  const q4 = 11200, gap = meuCusto - q4

  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 10, marginBottom: 14 }}>
        <KPI label="Seu custo por hectare" value={brl(meuCusto)} sub={`Percentil ${percentil} do setor`} color={percentil <= 40 ? GR : percentil <= 60 ? G : AM} />
        <KPI label="Melhor quartil regional" value={brl(q4)} sub="Referência de eficiência" color={GR} />
        <KPI label="Gap para o melhor quartil" value={brl(gap)} sub={`${brlK(gap * p.area)} por safra`} color={gap > 0 ? AM : GR} />
        <KPI label="Produtividade relativa" value={`${((p.prod / 4250 - 1) * 100).toFixed(1)}%`} sub="Contra média regional 4.250 kg/ha" color={p.prod >= 4250 ? GR : AM} />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: 14, marginBottom: 14 }}>
        <Card title="Curva de custo do setor" subtitle="Distribuição de custo por hectare na região — sua posição marcada em dourado">
          <ResponsiveContainer width="100%" height={250}>
            <ComposedChart data={curvaCusto}>
              <CartesianGrid strokeDasharray="3 3" stroke={BO} />
              <XAxis dataKey="pct" tick={{ fontSize: 10, fill: MU }} unit="%" label={{ value: "Percentil de produtores", position: "insideBottom", offset: -3, fill: MU, fontSize: 11 }} />
              <YAxis tick={{ fontSize: 10, fill: "#3a5a3d" }} domain={[10000, 20000]} />
              <Tooltip contentStyle={TP} formatter={v => [brl(v) + "/ha"]} />
              <Area type="monotone" dataKey="custo" stroke={MU} fill="#1c4a3055" strokeWidth={2} name="Custo do setor" />
              <ReferenceLine y={meuCusto} stroke={G} strokeWidth={2} strokeDasharray="5 4" label={{ value: `Você: ${brl(meuCusto)}`, fill: G, fontSize: 11, position: "insideTopRight" }} />
            </ComposedChart>
          </ResponsiveContainer>
        </Card>

        <Card title="Cinco forças de Porter" subtitle="Quanto maior, mais a força pressiona sua margem">
          <ResponsiveContainer width="100%" height={250}>
            <RadarChart data={porterData}>
              <PolarGrid stroke={BO} />
              <PolarAngleAxis dataKey="forca" tick={{ fontSize: 10, fill: MU }} />
              <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fontSize: 9, fill: "#3a5a3d" }} />
              <Radar name="Pressão" dataKey="valor" stroke={G} fill={G} fillOpacity={0.2} strokeWidth={1.5} />
              <Tooltip contentStyle={TP} />
            </RadarChart>
          </ResponsiveContainer>
        </Card>
      </div>

      <Card title="Leitura estratégica das forças competitivas">
        {porterData.sort((a, b) => b.valor - a.valor).map((f, i) => (
          <div key={i} style={{ display: "grid", gridTemplateColumns: "180px 90px 1fr", gap: 12, padding: "9px 0", borderBottom: i < 4 ? `1px solid ${BO}` : "none", alignItems: "center" }}>
            <span style={{ fontSize: 12, color: TX }}>{f.forca}</span>
            <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
              <div style={{ flex: 1, height: 6, background: BG, borderRadius: 3, overflow: "hidden" }}>
                <div style={{ width: `${f.valor}%`, height: "100%", background: f.valor >= 70 ? RD : f.valor >= 50 ? AM : GR }} />
              </div>
              <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 11, color: MU }}>{f.valor}</span>
            </div>
            <span style={{ fontSize: 11, color: MU }}>{f.nota}</span>
          </div>
        ))}
      </Card>
    </div>
  )
}

// ── 3. COMPRADORES ───────────────────────────────────────────────────────────
function Compradores({ p }) {
  const [afl, setAfl] = useState(2.8)
  const [cal, setCal] = useState(67)
  const [rastr, setRastr] = useState(47)

  const eleg = c => {
    const ok = afl <= c.aflMax && cal >= c.calMin && rastr >= c.rastr
    const parcial = afl <= c.aflMax && (cal >= c.calMin || rastr >= c.rastr)
    return ok ? "ok" : parcial ? "parcial" : "bloq"
  }
  const sacas = p.area * p.prod / KG_SACA
  const receitaBase = sacas * p.preco
  const perdido = compradores.filter(c => eleg(c) !== "ok").reduce((s, c) => s + receitaBase * (c.part / 100) * (c.premio / 100), 0)

  return (
    <div>
      <Card title="Sua qualidade atual" subtitle="Ajuste os parâmetros do seu lote e veja quais mercados se abrem ou fecham" style={{ marginBottom: 14 }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
          <div>
            <Slider label="Aflatoxina do lote (ppb)" min={0.5} max={25} step={0.1} value={afl} onChange={setAfl} display={`${afl.toFixed(1)} ppb`} />
            <Slider label="Uniformidade de calibre (%)" min={40} max={95} step={1} value={cal} onChange={setCal} display={`${cal}%`} />
            <Slider label="Rastreabilidade documentada (%)" min={0} max={100} step={1} value={rastr} onChange={setRastr} display={`${rastr}%`} />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, alignContent: "start" }}>
            <Box label="Mercados totalmente abertos" value={`${compradores.filter(c => eleg(c) === "ok").length} de ${compradores.length}`} color={GR} />
            <Box label="Prêmio não capturado" value={brlK(perdido)} note="Por safra, nos mercados bloqueados" color={AM} />
          </div>
        </div>
      </Card>

      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {compradores.map((c, i) => {
          const e = eleg(c)
          const cor = e === "ok" ? GR : e === "parcial" ? AM : RD
          const lbl = e === "ok" ? "Elegível" : e === "parcial" ? "Parcial" : "Bloqueado"
          return (
            <div key={i} style={{ background: CB, border: `1px solid ${e === "ok" ? "rgba(82,199,143,.25)" : BO}`, borderRadius: 10, padding: "14px 16px" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr auto auto", gap: 12, alignItems: "center", marginBottom: 10 }}>
                <div>
                  <div style={{ fontSize: 14, color: TX, fontWeight: 500 }}>{c.nome}</div>
                  <div style={{ fontSize: 11, color: MU, marginTop: 2 }}>{c.obs}</div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 14, color: c.premio > 0 ? GR : MU }}>{c.premio > 0 ? `+${c.premio}%` : "sem prêmio"}</div>
                  <div style={{ fontSize: 10, color: MU }}>{c.part}% do mercado</div>
                </div>
                <Tag color={cor}>{lbl}</Tag>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 8, paddingTop: 10, borderTop: `1px solid ${BO}` }}>
                {[
                  { l: "Aflatoxina máx.", v: `${c.aflMax} ppb`, ok: afl <= c.aflMax },
                  { l: "Calibre mín.", v: `${c.calMin}%`, ok: cal >= c.calMin },
                  { l: "Rastreabilidade", v: `${c.rastr}%`, ok: rastr >= c.rastr },
                  { l: "Prazo de pagamento", v: `${c.prazo} dias`, ok: true },
                ].map((r, j) => (
                  <div key={j}>
                    <div style={{ fontSize: 10, color: MU }}>{r.l}</div>
                    <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 12, color: r.ok ? GR : RD, marginTop: 2 }}>{r.v} {r.ok ? "✓" : "✕"}</div>
                  </div>
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── 4. PREÇO E HEDGE ─────────────────────────────────────────────────────────
function PrecoHedge({ p }) {
  const [travado, setTravado] = useState(25)
  const [vendido, setVendido] = useState(30)
  const [cambio, setCambio] = useState(CAMBIO)

  const sacas = p.area * p.prod / KG_SACA
  const aberto = Math.max(0, 100 - travado - vendido)
  const expostoSc = sacas * aberto / 100
  const parcExport = 0.55
  const expCambial = expostoSc * p.preco * parcExport
  const sensib = expCambial * ((cambio - CAMBIO) / CAMBIO)

  const cenarios = [
    { nome: "Preço cai para R$95", delta: (95 - p.preco) * expostoSc },
    { nome: "Preço fica em R$110", delta: (110 - p.preco) * expostoSc },
    { nome: "Preço sobe para R$124", delta: (124 - p.preco) * expostoSc },
  ]

  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 10, marginBottom: 14 }}>
        <KPI label="Produção total" value={`${Math.round(sacas).toLocaleString("pt-BR")} sc`} sub={`${Math.round(p.area * p.prod / 1000)} toneladas`} />
        <KPI label="Já vendido" value={`${vendido}%`} sub={`${Math.round(sacas * vendido / 100).toLocaleString("pt-BR")} sacas`} color={GR} />
        <KPI label="Preço travado a termo" value={`${travado}%`} sub={`${Math.round(sacas * travado / 100).toLocaleString("pt-BR")} sacas`} color={G} />
        <KPI label="Exposto a preço" value={`${aberto}%`} sub={`${Math.round(expostoSc).toLocaleString("pt-BR")} sacas em aberto`} color={aberto > 50 ? RD : aberto > 30 ? AM : GR} />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 14 }}>
        <Card title="Posição de venda e exposição" subtitle="Ajuste sua posição e veja o risco em aberto">
          <Slider label="% já vendido (spot)" min={0} max={100} step={5} value={vendido} onChange={v => setVendido(Math.min(v, 100 - travado))} display={`${vendido}%`} />
          <Slider label="% travado a termo" min={0} max={100} step={5} value={travado} onChange={v => setTravado(Math.min(v, 100 - vendido))} display={`${travado}%`} />
          <Slider label="Câmbio projetado (BRL/USD)" min={4.0} max={6.5} step={0.05} value={cambio} onChange={setCambio} display={`R$ ${cambio.toFixed(2)}`} />
          <div style={{ height: 26, display: "flex", borderRadius: 6, overflow: "hidden", border: `1px solid ${BO}`, marginTop: 14 }}>
            <div style={{ width: `${vendido}%`, background: GR }} />
            <div style={{ width: `${travado}%`, background: G }} />
            <div style={{ width: `${aberto}%`, background: "#6b3d12" }} />
          </div>
          <div style={{ display: "flex", gap: 14, marginTop: 8, fontSize: 11, color: MU }}>
            <span><span style={{ display: "inline-block", width: 8, height: 8, background: GR, borderRadius: 2, marginRight: 5 }} />Vendido</span>
            <span><span style={{ display: "inline-block", width: 8, height: 8, background: G, borderRadius: 2, marginRight: 5 }} />Travado</span>
            <span><span style={{ display: "inline-block", width: 8, height: 8, background: "#6b3d12", borderRadius: 2, marginRight: 5 }} />Exposto</span>
          </div>
        </Card>

        <Card title="Impacto financeiro da posição em aberto">
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 14 }}>
            <Box label="Exposição cambial" value={brlK(expCambial)} note="55% da produção vai a exportação" color={AM} />
            <Box label="Efeito do câmbio simulado" value={`${sensib >= 0 ? "+" : "−"}${brlK(Math.abs(sensib))}`} note={`Câmbio a R$${cambio.toFixed(2)}`} color={sensib >= 0 ? GR : RD} />
          </div>
          <div style={{ fontSize: 12, color: MU, marginBottom: 10 }}>Resultado da parcela exposta por cenário de preço</div>
          {cenarios.map((c, i) => (
            <div key={i} style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 10, padding: "9px 0", borderBottom: i < 2 ? `1px solid ${BO}` : "none" }}>
              <span style={{ fontSize: 12, color: TX }}>{c.nome}</span>
              <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 13, color: c.delta >= 0 ? GR : RD }}>
                {c.delta >= 0 ? "+" : "−"}{brlK(Math.abs(c.delta))}
              </span>
            </div>
          ))}
        </Card>
      </div>

      <Card title="Projeção de preço e janelas de decisão" subtitle="Modelo ARIMA-GARCH do agente AIM aplicado ao seu volume em aberto">
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={precoProj}>
            <CartesianGrid strokeDasharray="3 3" stroke={BO} />
            <XAxis dataKey="mes" tick={{ fontSize: 11, fill: MU }} />
            <YAxis tick={{ fontSize: 10, fill: "#3a5a3d" }} domain={[95, 135]} />
            <Tooltip contentStyle={TP} formatter={v => [`R$ ${v}/sc`]} />
            <Legend iconSize={8} wrapperStyle={{ fontSize: 11 }} />
            <ReferenceLine y={p.preco} stroke={MU} strokeDasharray="4 3" label={{ value: "Seu preço", fill: MU, fontSize: 10, position: "insideBottomRight" }} />
            <Line type="monotone" dataKey="real" name="Realizado" stroke={G} strokeWidth={2.5} dot={{ r: 3, fill: G }} connectNulls={false} />
            <Line type="monotone" dataKey="proj" name="Projeção AIM" stroke={GR} strokeWidth={2} strokeDasharray="5 5" dot={{ r: 2.5, fill: GR }} />
          </LineChart>
        </ResponsiveContainer>
      </Card>
    </div>
  )
}

// ── 5. DECISÕES DE CAPITAL ───────────────────────────────────────────────────
function Capital({ p }) {
  const [sel, setSel] = useState("armazem")
  const inv = investimentos.find(i => i.id === sel)
  const taxa = p.cmpc / 100

  const calc = i => {
    let vpl = -i.capex
    for (let a = 1; a <= i.vidaUtil; a++) vpl += i.ganhoAno / Math.pow(1 + taxa, a)
    const payback = i.capex / i.ganhoAno
    let tir = 0
    for (let r = 0.01; r <= 1; r += 0.005) {
      let v = -i.capex
      for (let a = 1; a <= i.vidaUtil; a++) v += i.ganhoAno / Math.pow(1 + r, a)
      if (v < 0) { tir = r; break }
    }
    return { vpl, payback, tir: tir * 100 }
  }
  const r = calc(inv)
  const fluxo = Array.from({ length: Math.min(inv.vidaUtil, 12) }, (_, a) => {
    const ano = a + 1
    let acum = -inv.capex
    for (let k = 1; k <= ano; k++) acum += inv.ganhoAno
    return { ano: `A${ano}`, acumulado: acum, anual: inv.ganhoAno }
  })

  return (
    <div>
      <div style={{ display: "flex", gap: 8, marginBottom: 14, flexWrap: "wrap" }}>
        {investimentos.map(i => <SubTab key={i.id} id={i.id} label={i.nome} active={sel} set={setSel} />)}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 10, marginBottom: 14 }}>
        <KPI label="Investimento necessário" value={brlK(inv.capex)} sub={`Vida útil de ${inv.vidaUtil} anos`} color={AM} />
        <KPI label="Valor presente líquido" value={brlK(r.vpl)} sub={`Descontado a ${p.cmpc}% a.a.`} color={r.vpl > 0 ? GR : RD} />
        <KPI label="Taxa interna de retorno" value={`${r.tir.toFixed(1)}%`} sub={r.tir > p.cmpc ? "Acima do custo de capital" : "Abaixo do custo de capital"} color={r.tir > p.cmpc ? GR : RD} />
        <KPI label="Payback simples" value={`${r.payback.toFixed(1)} anos`} sub={`Ganho anual de ${brlK(inv.ganhoAno)}`} color={r.payback < 5 ? GR : AM} />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1.3fr 1fr", gap: 14, marginBottom: 14 }}>
        <Card title="Fluxo de caixa acumulado" subtitle={inv.desc}>
          <ResponsiveContainer width="100%" height={240}>
            <ComposedChart data={fluxo}>
              <CartesianGrid strokeDasharray="3 3" stroke={BO} />
              <XAxis dataKey="ano" tick={{ fontSize: 10, fill: MU }} />
              <YAxis tick={{ fontSize: 10, fill: "#3a5a3d" }} tickFormatter={v => (v / 1e6).toFixed(1) + "M"} />
              <Tooltip contentStyle={TP} formatter={v => [brlK(v)]} />
              <Legend iconSize={8} wrapperStyle={{ fontSize: 11 }} />
              <ReferenceLine y={0} stroke={RD} strokeDasharray="4 3" />
              <Bar dataKey="anual" name="Ganho anual" fill="#1c4a30" radius={[3, 3, 0, 0]} />
              <Line type="monotone" dataKey="acumulado" name="Acumulado" stroke={G} strokeWidth={2.5} dot={{ r: 3, fill: G }} />
            </ComposedChart>
          </ResponsiveContainer>
        </Card>

        <Card title="Comparativo entre alternativas" subtitle="Ordenado por VPL — todos avaliados ao mesmo custo de capital">
          {investimentos.map(i => {
            const c = calc(i)
            return { ...i, ...c }
          }).sort((a, b) => b.vpl - a.vpl).map((i, idx) => (
            <div key={i.id} style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 10, padding: "10px 0", borderBottom: idx < 4 ? `1px solid ${BO}` : "none", alignItems: "center" }}>
              <div>
                <div style={{ fontSize: 12, color: i.id === sel ? G : TX }}>{i.nome}</div>
                <div style={{ fontSize: 10, color: MU, marginTop: 2 }}>TIR {i.tir.toFixed(1)}% · payback {i.payback.toFixed(1)} anos</div>
              </div>
              <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 13, color: i.vpl > 0 ? GR : RD }}>{brlK(i.vpl)}</span>
            </div>
          ))}
        </Card>
      </div>
    </div>
  )
}

// ── 6. RISCO ─────────────────────────────────────────────────────────────────
function Risco({ p }) {
  const receita = p.area * p.prod / KG_SACA * p.preco
  const totalExposto = riscos.reduce((s, r) => s + r.prob / 100 * r.impacto, 0)
  const catCor = { Clima: "#3d9970", Qualidade: G, Mercado: AM, Operacional: MU, Regulatório: RD, Jurídico: "#8a6bb5" }

  const scatter = riscos.map(r => ({ x: r.prob, y: r.impacto / 1000, z: r.prob / 100 * r.impacto / 1000, nome: r.nome, cat: r.cat }))

  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 10, marginBottom: 14 }}>
        <KPI big label="Valor em risco esperado" value={brlK(totalExposto)} sub={`${(totalExposto / receita * 100).toFixed(1)}% da receita projetada`} color={AM} />
        <KPI big label="Maior exposição isolada" value={brlK(Math.max(...riscos.map(r => r.prob / 100 * r.impacto)))} sub="Déficit hídrico severo" color={RD} />
        <KPI big label="Riscos mapeados" value={`${riscos.length}`} sub="Em 6 categorias distintas" />
        <KPI big label="Cobertura recomendada" value={brlK(totalExposto * 0.7)} sub="70% do valor em risco via seguro" color={GR} />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1.1fr 1fr", gap: 14, marginBottom: 14 }}>
        <Card title="Matriz de risco" subtitle="Probabilidade contra impacto financeiro — o tamanho da bolha é a exposição esperada">
          <ResponsiveContainer width="100%" height={280}>
            <ScatterChart margin={{ top: 10, right: 10, bottom: 20, left: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={BO} />
              <XAxis type="number" dataKey="x" name="Probabilidade" unit="%" domain={[0, 50]} tick={{ fontSize: 10, fill: MU }} label={{ value: "Probabilidade (%)", position: "insideBottom", offset: -8, fill: MU, fontSize: 11 }} />
              <YAxis type="number" dataKey="y" name="Impacto" unit=" mil" domain={[0, 1000]} tick={{ fontSize: 10, fill: "#3a5a3d" }} />
              <ZAxis type="number" dataKey="z" range={[60, 400]} />
              <Tooltip contentStyle={TP} formatter={(v, n) => n === "Impacto" ? [`R$ ${v} mil`] : [`${v}%`]} labelFormatter={() => ""} content={({ payload }) => payload && payload[0] ? (
                <div style={{ ...TP, padding: "8px 10px" }}>
                  <div style={{ color: TX, fontSize: 12, marginBottom: 4 }}>{payload[0].payload.nome}</div>
                  <div style={{ color: MU, fontSize: 11 }}>Probabilidade: {payload[0].payload.x}%</div>
                  <div style={{ color: MU, fontSize: 11 }}>Impacto: R$ {payload[0].payload.y} mil</div>
                </div>
              ) : null} />
              <Scatter data={scatter}>
                {scatter.map((s, i) => <Cell key={i} fill={catCor[s.cat]} fillOpacity={0.7} />)}
              </Scatter>
            </ScatterChart>
          </ResponsiveContainer>
        </Card>

        <Card title="Registro de riscos" subtitle="Ordenado por exposição esperada">
          {riscos.map(r => ({ ...r, exp: r.prob / 100 * r.impacto })).sort((a, b) => b.exp - a.exp).map((r, i) => (
            <div key={i} style={{ padding: "10px 0", borderBottom: i < riscos.length - 1 ? `1px solid ${BO}` : "none" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 10, alignItems: "center", marginBottom: 4 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                  <div style={{ width: 7, height: 7, borderRadius: "50%", background: catCor[r.cat], flexShrink: 0 }} />
                  <span style={{ fontSize: 12, color: TX }}>{r.nome}</span>
                </div>
                <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 12, color: AM }}>{brlK(r.exp)}</span>
              </div>
              <div style={{ fontSize: 10, color: MU, paddingLeft: 14 }}>{r.prob}% × {brlK(r.impacto)} · {r.mitig}</div>
            </div>
          ))}
        </Card>
      </div>

      <Card title="Teste de estresse combinado" subtitle="Resultado da safra sob cenários adversos simultâneos">
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12 }}>
          {[
            { nome: "Cenário base", desc: "Condições atuais mantidas", res: receita - p.area * p.custo, cor: GR },
            { nome: "Estresse moderado", desc: "Preço a R$95 e produtividade −12%", res: (p.area * p.prod * 0.88 / KG_SACA * 95) - p.area * p.custo, cor: AM },
            { nome: "Estresse severo", desc: "Preço a R$88, produtividade −28%, rebaixamento de lote", res: (p.area * p.prod * 0.72 / KG_SACA * 88) - p.area * p.custo - 180000, cor: RD },
          ].map((c, i) => (
            <div key={i} style={{ background: BG, border: `1px solid ${BO}`, borderRadius: 8, padding: "14px 16px" }}>
              <div style={{ fontSize: 12, color: c.cor, fontWeight: 500, marginBottom: 3 }}>{c.nome}</div>
              <div style={{ fontSize: 11, color: MU, marginBottom: 10 }}>{c.desc}</div>
              <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 18, color: c.res > 0 ? GR : RD }}>{c.res >= 0 ? "" : "−"}{brlK(Math.abs(c.res))}</div>
              <div style={{ fontSize: 10, color: MU, marginTop: 3 }}>{c.res > 0 ? "Margem positiva" : "Prejuízo na safra"}</div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}

// ── 7. AFLATOXINA ────────────────────────────────────────────────────────────
function Aflatoxina({ p }) {
  const [umid, setUmid] = useState(12)
  const [dias, setDias] = useState(90)

  const key = umid <= 10.5 ? "u10" : umid <= 13 ? "u12" : "u14"
  const ponto = aflatoxinaCurva.reduce((prev, c) => Math.abs(c.dias - dias) < Math.abs(prev.dias - dias) ? c : prev)
  const nivel = ponto[key]
  const sacas = p.area * p.prod / KG_SACA
  const receitaUE = sacas * p.preco * 1.14
  const receitaCodex = sacas * p.preco
  const receitaRacao = sacas * p.preco * 0.45
  const destino = nivel <= 4 ? "UE" : nivel <= 15 ? "Codex" : "Ração"
  const receitaAtual = destino === "UE" ? receitaUE : destino === "Codex" ? receitaCodex : receitaRacao
  const perda = receitaUE - receitaAtual

  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 10, marginBottom: 14 }}>
        <KPI big label="Aflatoxina projetada" value={`${nivel.toFixed(1)} ppb`} sub={`Após ${dias} dias a ${umid}% de umidade`} color={nivel <= 4 ? GR : nivel <= 15 ? AM : RD} />
        <KPI big label="Mercado acessível" value={destino === "UE" ? "União Europeia" : destino === "Codex" ? "Codex (Rússia, China)" : "Ração animal"} sub={destino === "UE" ? "Limite 4 ppb — prêmio de 14%" : destino === "Codex" ? "Limite 15 ppb — sem prêmio" : "Rebaixamento total do lote"} color={nivel <= 4 ? GR : nivel <= 15 ? AM : RD} />
        <KPI big label="Receita do lote" value={brlK(receitaAtual)} sub={`${Math.round(sacas).toLocaleString("pt-BR")} sacas`} color={destino === "UE" ? GR : AM} />
        <KPI big label="Valor perdido vs. UE" value={perda > 0 ? `− ${brlK(perda)}` : "Nenhum"} sub={perda > 0 ? "Prêmio não capturado" : "Máximo valor capturado"} color={perda > 0 ? RD : GR} />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 14 }}>
        <Card title="Simulador de risco por lote" subtitle="Ajuste a umidade de entrada e o tempo previsto de armazenagem">
          <Slider label="Umidade na entrada do armazém" min={8} max={16} step={0.5} value={umid} onChange={setUmid} display={`${umid.toFixed(1)}%`} />
          <Slider label="Tempo de armazenagem previsto" min={0} max={180} step={15} value={dias} onChange={setDias} display={`${dias} dias`} />
          <div style={{ marginTop: 16, background: nivel <= 4 ? "rgba(82,199,143,.07)" : nivel <= 15 ? "rgba(224,160,64,.07)" : "rgba(224,80,80,.07)", border: `1px solid ${nivel <= 4 ? "rgba(82,199,143,.22)" : nivel <= 15 ? "rgba(224,160,64,.22)" : "rgba(224,80,80,.22)"}`, borderRadius: 8, padding: "12px 14px" }}>
            <div style={{ fontSize: 13, color: nivel <= 4 ? GR : nivel <= 15 ? AM : RD, fontWeight: 500, marginBottom: 4 }}>
              {nivel <= 4 ? "Lote elegível para o mercado premium" : nivel <= 15 ? "Lote fora do mercado europeu" : "Risco de rebaixamento total"}
            </div>
            <div style={{ fontSize: 12, color: "#a8c4aa", lineHeight: 1.5 }}>
              {nivel <= 4
                ? `Mantendo ${umid}% de umidade, o lote permanece abaixo de 4 ppb por até ${dias} dias e captura o prêmio de 14% do mercado europeu.`
                : nivel <= 15
                ? `Com ${umid}% de umidade, o lote ultrapassa 4 ppb e perde acesso à UE. Secar até 10% antes de armazenar preservaria ${brlK(perda)} de receita.`
                : `Nível crítico. Reduzir umidade imediatamente ou vender o lote antes de ${Math.max(0, dias - 60)} dias para evitar perda de ${brlK(perda)}.`}
            </div>
          </div>
        </Card>

        <Card title="Curva de formação de aflatoxina" subtitle="Evolução do teor em ppb ao longo do tempo, por umidade de armazenagem">
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={aflatoxinaCurva}>
              <CartesianGrid strokeDasharray="3 3" stroke={BO} />
              <XAxis dataKey="dias" tick={{ fontSize: 10, fill: MU }} unit="d" />
              <YAxis tick={{ fontSize: 10, fill: "#3a5a3d" }} unit=" ppb" />
              <Tooltip contentStyle={TP} formatter={v => [`${v} ppb`]} />
              <Legend iconSize={8} wrapperStyle={{ fontSize: 11 }} />
              <ReferenceLine y={4} stroke={GR} strokeDasharray="5 4" label={{ value: "Limite UE", fill: GR, fontSize: 10, position: "insideTopLeft" }} />
              <ReferenceLine y={15} stroke={AM} strokeDasharray="5 4" label={{ value: "Limite Codex", fill: AM, fontSize: 10, position: "insideTopLeft" }} />
              <Line type="monotone" dataKey="u10" name="10% umidade" stroke={GR} strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="u12" name="12% umidade" stroke={G} strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="u14" name="14% umidade" stroke={RD} strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </Card>
      </div>

      <Card title="Custo do rebaixamento por faixa de mercado" subtitle="O que cada nível de aflatoxina significa em receita para a sua produção">
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12 }}>
          {[
            { faixa: "Até 4 ppb", mercado: "União Europeia", rec: receitaUE, cor: GR, det: "Prêmio de 14% sobre o preço base" },
            { faixa: "4 a 15 ppb", mercado: "Rússia, China, Argélia", rec: receitaCodex, cor: AM, det: "Preço base sem prêmio" },
            { faixa: "Acima de 20 ppb", mercado: "Ração animal", rec: receitaRacao, cor: RD, det: "Rebaixamento de 55% no valor" },
          ].map((f, i) => (
            <div key={i} style={{ background: BG, border: `1px solid ${destino === (i === 0 ? "UE" : i === 1 ? "Codex" : "Ração") ? f.cor + "66" : BO}`, borderRadius: 8, padding: "14px 16px" }}>
              <div style={{ fontSize: 12, color: f.cor, fontWeight: 500 }}>{f.faixa}</div>
              <div style={{ fontSize: 11, color: MU, marginBottom: 10 }}>{f.mercado}</div>
              <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 17, color: TX }}>{brlK(f.rec)}</div>
              <div style={{ fontSize: 10, color: MU, marginTop: 3 }}>{f.det}</div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}

// ── 8. ESCADA DE PRODUTO ─────────────────────────────────────────────────────
function Escada({ p }) {
  const atualIdx = escadaProduto.findIndex(d => d.degrau === p.degrau)
  const toneladas = p.area * p.prod / 1000
  const dados = escadaProduto.map((d, i) => ({
    ...d,
    receita: toneladas * 1000 * d.preco,
    delta: i > atualIdx ? (d.preco - escadaProduto[atualIdx].preco) * toneladas * 1000 : 0,
    capexIncr: i > atualIdx ? d.capex - escadaProduto[atualIdx].capex : 0,
  }))

  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 10, marginBottom: 14 }}>
        <KPI label="Nível atual" value={p.degrau} sub={`R$ ${escadaProduto[atualIdx].preco.toFixed(2)}/kg`} color={G} />
        <KPI label="Receita no nível atual" value={brlK(dados[atualIdx].receita)} sub={`${Math.round(toneladas)} toneladas`} />
        <KPI label="Potencial no topo da escada" value={brlK(dados[dados.length - 1].receita)} sub="Pasta e óleo" color={GR} />
        <KPI label="Valor não capturado" value={brlK(dados[dados.length - 1].receita - dados[atualIdx].receita)} sub="Diferença até o último degrau" color={AM} />
      </div>

      <Card title="Escada de agregação de valor" subtitle="Preço por quilo em cada nível de beneficiamento — seu nível atual em dourado" style={{ marginBottom: 14 }}>
        <ResponsiveContainer width="100%" height={230}>
          <BarChart data={dados}>
            <CartesianGrid strokeDasharray="3 3" stroke={BO} />
            <XAxis dataKey="degrau" tick={{ fontSize: 11, fill: MU }} />
            <YAxis tick={{ fontSize: 10, fill: "#3a5a3d" }} unit="/kg" />
            <Tooltip contentStyle={TP} formatter={(v, n) => n === "preco" ? [`R$ ${v.toFixed(2)}/kg`] : [`${v}%`]} />
            <Bar dataKey="preco" name="preco" radius={[4, 4, 0, 0]}>
              {dados.map((d, i) => <Cell key={i} fill={i === atualIdx ? G : i < atualIdx ? "#2d4a30" : "#1c4a30"} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </Card>

      <Card title="Análise de subida de degrau" subtitle="Ganho anual de receita contra investimento incremental necessário">
        {dados.map((d, i) => {
          if (i <= atualIdx) return null
          const payback = d.capexIncr > 0 ? d.capexIncr / (d.delta * (d.margem / 100)) : 0
          return (
            <div key={i} style={{ display: "grid", gridTemplateColumns: "150px 1fr 110px 110px 90px", gap: 12, padding: "12px 0", borderBottom: i < dados.length - 1 ? `1px solid ${BO}` : "none", alignItems: "center" }}>
              <div>
                <div style={{ fontSize: 12, color: TX }}>{d.degrau}</div>
                <div style={{ fontSize: 10, color: MU, marginTop: 2 }}>margem {d.margem}%</div>
              </div>
              <div style={{ height: 8, background: BG, borderRadius: 4, overflow: "hidden" }}>
                <div style={{ width: `${d.delta / (dados[dados.length - 1].delta || 1) * 100}%`, height: "100%", background: GR }} />
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: 10, color: MU }}>Ganho de receita</div>
                <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 12, color: GR }}>+{brlK(d.delta)}</div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: 10, color: MU }}>Investimento</div>
                <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 12, color: AM }}>{brlK(d.capexIncr)}</div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: 10, color: MU }}>Payback</div>
                <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 12, color: payback < 6 ? GR : AM }}>{payback.toFixed(1)} anos</div>
              </div>
            </div>
          )
        })}
        {atualIdx === escadaProduto.length - 1 && (
          <div style={{ fontSize: 12, color: MU, padding: "12px 0" }}>Você já está no topo da escada de agregação de valor.</div>
        )}
      </Card>
    </div>
  )
}

// ── APP ──────────────────────────────────────────────────────────────────────
export default function AmendoIABusiness() {
  const [tab, setTab] = useState("cockpit")
  const [p, setP] = useState({
    area: 320, prod: 4250, custo: 14800, preco: 110,
    armazem: 35, custoArm: 0.45, frete: 65, cmpc: 14.5,
    regime: "presumido", degrau: "Em casca", certUE: "nao",
  })

  const TABS = [
    { id: "cockpit", label: "Cockpit do negócio" },
    { id: "posicao", label: "Posição competitiva" },
    { id: "compradores", label: "Compradores" },
    { id: "preco", label: "Preço e hedge" },
    { id: "capital", label: "Decisões de capital" },
    { id: "risco", label: "Mapa de risco" },
    { id: "aflatoxina", label: "Aflatoxina e qualidade" },
    { id: "escada", label: "Escada de produto" },
    { id: "sep" },
    { id: "perfil", label: "Perfil da empresa" },
  ]

  const titulos = {
    cockpit: ["Cockpit do negócio", "Resultado da safra em tempo real · preço CEPEA abr/2026 · R$110/sc"],
    posicao: ["Posição competitiva", "Onde sua empresa está na curva de custo e sob quais pressões de mercado"],
    compradores: ["Inteligência de compradores", "Para quem vender, sob quais exigências e a que prêmio"],
    preco: ["Precificação e hedge", "Posição de venda, exposição a preço e câmbio, janelas de decisão"],
    capital: ["Decisões de capital", "VPL, TIR e payback dos investimentos ao seu custo de capital real"],
    risco: ["Mapa de risco empresarial", "Probabilidade contra impacto em reais, com teste de estresse"],
    aflatoxina: ["Aflatoxina e qualidade pós-colheita", "A variável que mais destrói valor no negócio do amendoim"],
    escada: ["Escada de produto e verticalização", "Quanto vale subir cada degrau de beneficiamento"],
    perfil: ["Perfil da empresa", "Os dados que alimentam todas as visões do módulo"],
  }

  return (
    <div style={{ background: BG, minHeight: "100vh", fontFamily: "'DM Sans',sans-serif", color: TX }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500&family=Playfair+Display:wght@600&family=DM+Mono:wght@400;500&display=swap');
        *{box-sizing:border-box;margin:0;padding:0}
        ::-webkit-scrollbar{width:3px}::-webkit-scrollbar-track{background:transparent}::-webkit-scrollbar-thumb{background:#1c3320;border-radius:2px}
        .nb{background:none;border:none;cursor:pointer;padding:8px 12px;border-radius:6px;font-family:'DM Sans',sans-serif;font-size:13px;transition:all .2s;white-space:nowrap;color:#7a9b7d;text-align:left;width:100%}
        .nb:hover{background:rgba(200,169,74,.07)}.nb.on{background:rgba(200,169,74,.13);color:#c8a94a}
        input[type=range]{accent-color:#c8a94a}
        select,input[type=number]{background:#080f09;color:#d8ead9;font-family:'DM Sans',sans-serif}
        select option{background:#0c1a0e}
        input[type=number]:focus,select:focus{border-color:#2d5a34}
        @keyframes fi{from{opacity:0;transform:translateY(4px)}to{opacity:1;transform:translateY(0)}}.fi{animation:fi .22s ease}
      `}</style>

      <div style={{ borderBottom: `1px solid ${BO}`, padding: "0 18px", display: "flex", alignItems: "center", justifyContent: "space-between", height: 52, position: "sticky", top: 0, zIndex: 100, background: BG }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 28, height: 28, background: "linear-gradient(135deg,#c8a94a,#7a5e1e)", borderRadius: 7, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14 }}>🥜</div>
          <span style={{ fontFamily: "'Playfair Display',serif", fontSize: 17, color: G }}>AmendoIA</span>
          <span style={{ fontSize: 10, padding: "2px 8px", borderRadius: 10, fontWeight: 500, background: "rgba(200,169,74,.15)", color: G, border: "1px solid rgba(200,169,74,.3)" }}>modo negócio</span>
          <span style={{ color: BO, margin: "0 6px", fontSize: 18 }}>|</span>
          <span style={{ fontSize: 11, color: "#4a6b4d" }}>Visão do empresário · FCE-Tupã / UNESP · abr/2026</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 14, fontSize: 11, color: MU }}>
          <span>{p.area} ha</span>
          <span style={{ color: BO }}>·</span>
          <span>{Math.round(p.area * p.prod / 1000)} t projetadas</span>
          <span style={{ color: BO }}>·</span>
          <span style={{ color: G, fontFamily: "'DM Mono',monospace" }}>R$ {p.preco}/sc</span>
        </div>
      </div>

      <div style={{ display: "flex", height: "calc(100vh - 52px)" }}>
        <div style={{ width: 196, borderRight: `1px solid ${BO}`, padding: "10px 5px", display: "flex", flexDirection: "column", gap: 1, flexShrink: 0 }}>
          {TABS.map(t => t.id === "sep"
            ? <div key="sep" style={{ height: 1, background: BO, margin: "6px 8px" }} />
            : <button key={t.id} className={`nb ${tab === t.id ? "on" : ""}`} onClick={() => setTab(t.id)}>{t.label}</button>
          )}
          <div style={{ marginTop: "auto", padding: "12px 8px", borderTop: `1px solid ${BO}`, fontSize: 10, color: "#3a5a3d", lineHeight: 1.7 }}>
            Mercado: CEPEA · AGROSTAT<br />Crédito: BACEN · Selic 14,75%<br />Clima: INMET · Sentinel-2<br />© FCE-Tupã / FAPESP
          </div>
        </div>

        <div style={{ flex: 1, overflow: "auto", padding: 20 }}>
          <div className="fi" key={tab}>
            <div style={{ marginBottom: 16 }}>
              <h2 style={{ fontFamily: "'Playfair Display',serif", fontSize: 20, color: G, fontWeight: 600 }}>{titulos[tab][0]}</h2>
              <p style={{ fontSize: 12, color: MU, marginTop: 3 }}>{titulos[tab][1]}</p>
            </div>
            {tab === "cockpit" && <Cockpit p={p} />}
            {tab === "posicao" && <Posicao p={p} />}
            {tab === "compradores" && <Compradores p={p} />}
            {tab === "preco" && <PrecoHedge p={p} />}
            {tab === "capital" && <Capital p={p} />}
            {tab === "risco" && <Risco p={p} />}
            {tab === "aflatoxina" && <Aflatoxina p={p} />}
            {tab === "escada" && <Escada p={p} />}
            {tab === "perfil" && <Perfil p={p} setP={setP} />}
          </div>
        </div>
      </div>
    </div>
  )
}
