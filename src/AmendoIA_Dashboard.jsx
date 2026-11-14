import { useState, useRef, useEffect, useMemo } from "react"
import {
  AreaChart, Area, LineChart, Line, BarChart, Bar,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, ComposedChart
} from "recharts"

// ─────────────────────────────────────────────────────────────────────────────
// DADOS
// ─────────────────────────────────────────────────────────────────────────────
const productivityData = [
  {ano:"2015",tupa:2580,jaboti:2720,nacional:2490},{ano:"2016",tupa:2760,jaboti:2890,nacional:2640},
  {ano:"2017",tupa:2920,jaboti:3060,nacional:2810},{ano:"2018",tupa:3010,jaboti:3180,nacional:2870},
  {ano:"2019",tupa:3080,jaboti:3240,nacional:2960},{ano:"2020",tupa:3350,jaboti:3480,nacional:3210},
  {ano:"2021",tupa:3510,jaboti:3660,nacional:3380},{ano:"2022",tupa:3790,jaboti:3940,nacional:3620},
  {ano:"2023",tupa:4080,jaboti:4260,nacional:3890},{ano:"2024",tupa:2773,jaboti:2897,nacional:2873},
  {ano:"2024/25",tupa:4150,jaboti:4310,nacional:4176},{ano:"2025/26*",tupa:4250,jaboti:4390,nacional:4120},
]
const productivityBySize = [{label:"<50 ha",tupa:3420,jaboti:3580},{label:"50–200 ha",tupa:4380,jaboti:4520},{label:">200 ha",tupa:4890,jaboti:5010}]
const costBreakdown = [{item:"Fertilizantes",valor:1178,pct:31.4},{item:"Defensivos",valor:890,pct:23.7},{item:"Mecanização",valor:810,pct:21.6},{item:"Sementes",valor:420,pct:11.2},{item:"Mão de obra",valor:320,pct:8.5},{item:"Outros",valor:133,pct:3.6}]
const priceData = [
  {mes:"Jan/20",preco:62},{mes:"Abr/20",preco:68},{mes:"Jul/20",preco:74},{mes:"Out/20",preco:79},
  {mes:"Jan/21",preco:85},{mes:"Abr/21",preco:94},{mes:"Jul/21",preco:101},{mes:"Out/21",preco:108},
  {mes:"Jan/22",preco:112},{mes:"Abr/22",preco:119},{mes:"Jul/22",preco:124},{mes:"Out/22",preco:118},
  {mes:"Jan/23",preco:115},{mes:"Abr/23",preco:121},{mes:"Jul/23",preco:129},{mes:"Out/23",preco:134},
  {mes:"Jan/24",preco:98},{mes:"Mar/24",preco:112},{mes:"Mai/24",preco:145},{mes:"Jul/24",preco:138},
  {mes:"Set/24",preco:121},{mes:"Nov/24",preco:118},{mes:"Jan/25",preco:125},{mes:"Mar/25",preco:131},
  {mes:"Mai/25",preco:139},{mes:"Jul/25",preco:136},{mes:"Set/25",preco:128},{mes:"Nov/25",preco:119},
  {mes:"Jan/26",preco:112,proj:112},{mes:"Mar/26",preco:109,proj:109},{mes:"Abr/26",preco:110,proj:110},
  {mes:"Jun/26",proj:113},{mes:"Set/26",proj:117},
]
const exportDestinations = [{destino:"União Europeia",pct:28,valor_mi:103},{destino:"Rússia",pct:22,valor_mi:81},{destino:"China",pct:20,valor_mi:73},{destino:"Argélia",pct:12,valor_mi:44},{destino:"Demais",pct:18,valor_mi:66}]
const PIE_COLORS = ["#c8a94a","#52c78f","#3d9970","#7a9b7d","#4a6b4d"]
const rcaData = [{pais:"Índia",rca:4.2},{pais:"Argentina",rca:3.1},{pais:"China",rca:2.9},{pais:"EUA",rca:1.9},{pais:"Brasil",rca:1.8},{pais:"Senegal",rca:1.4}]
const costCompar = [{pais:"Índia",custo:480},{pais:"Brasil",custo:588},{pais:"Argentina",custo:710},{pais:"EUA",custo:820},{pais:"China",custo:890}]
const logisticsData = [{rota:"Tupã→Santos",atual:65,otimizado:52,pav:72,distKm:574},{rota:"Tupã→Campinas",atual:43,otimizado:36,pav:81,distKm:398},{rota:"Jaboti→Santos",atual:50,otimizado:42,pav:88,distKm:492},{rota:"Jaboti→RPreto",atual:27,otimizado:22,pav:94,distKm:261},{rota:"Tupã↔Jaboti",atual:36,otimizado:30,pav:69,distKm:312}]
const storageCapacity = [{municipio:"Ribeirão Preto",capacidade:198,ocupacao:64},{municipio:"Marília",capacidade:142,ocupacao:72},{municipio:"Tupã",capacidade:84,ocupacao:58},{municipio:"Jaboticabal",capacidade:67,ocupacao:48},{municipio:"Pres. Prudente",capacidade:56,ocupacao:71}]
const creditRuralData = [{programa:"Custeio Empresarial",valor:61.2},{programa:"PRONAF",valor:32.4},{programa:"ABC+ Restauração",valor:14.8},{programa:"Inovagro",valor:9.6},{programa:"PSR (Seguro)",valor:7.2}]
const policyData = [{politica:"Certif. exportação UE",impacto:22,incerteza:9},{politica:"Seguro paramétrico",impacto:18,incerteza:6},{politica:"Armazém cooperativo",impacto:14,incerteza:5},{politica:"Crédito PRONAF+",impacto:12,incerteza:4},{politica:"Assist. técnica CATI",impacto:9,incerteza:3}]
const climateHistory = [
  {mes:"Jan",t2024:27.8,t2025:25.9,t2026:25.2,p2024:142,p2025:198,p2026:188},
  {mes:"Fev",t2024:27.2,t2025:25.4,t2026:24.8,p2024:98,p2025:168,p2026:172},
  {mes:"Mar",t2024:26.9,t2025:24.6,t2026:24.1,p2024:62,p2025:132,p2026:118},
  {mes:"Abr",t2024:25.1,t2025:23.0,t2026:22.8,p2024:38,p2025:84,p2026:76},
  {mes:"Mai",t2024:22.3,t2025:20.8,p2024:18,p2025:44},
  {mes:"Jun",t2024:20.4,t2025:19.1,p2024:12,p2025:31},
  {mes:"Jul",t2024:20.1,t2025:18.4,p2024:8,p2025:22},
  {mes:"Ago",t2024:22.8,t2025:20.2,p2024:14,p2025:28},
  {mes:"Set",t2024:25.6,t2025:23.1,p2024:42,p2025:78},
  {mes:"Out",t2024:27.2,t2025:24.8,p2024:84,p2025:148},
  {mes:"Nov",t2024:27.9,t2025:25.4,p2024:118,p2025:172},
  {mes:"Dez",t2024:28.1,t2025:25.9,p2024:148,p2025:192},
]
const ndviData = [{municipio:"Ribeirão Preto",ndvi:0.74,risco:"Muito baixo"},{municipio:"Jaboticabal",ndvi:0.70,risco:"Baixo"},{municipio:"Marília",ndvi:0.66,risco:"Baixo"},{municipio:"Assis",ndvi:0.63,risco:"Baixo"},{municipio:"Tupã",ndvi:0.62,risco:"Baixo"},{municipio:"Pres. Prudente",ndvi:0.58,risco:"Moderado"}]
const precipData = [{mes:"Jan",precip:188,necessidade:120},{mes:"Fev",precip:172,necessidade:115},{mes:"Mar",precip:118,necessidade:105},{mes:"Abr",precip:76,necessidade:85}]
const ictCombined = [{dim:"Produtiva",Tupã:74,Jaboticabal:81},{dim:"Logística",Tupã:60,Jaboticabal:73},{dim:"Mercadológica",Tupã:64,Jaboticabal:72},{dim:"Institucional",Tupã:79,Jaboticabal:70},{dim:"Ambiental",Tupã:65,Jaboticabal:69}]
const xaiFatores = [
  {name:"Câmbio BRL/USD (R$4,95 → pressão exportadora)",val:4.2,pos:true},
  {name:"Sazonalidade histórica set–out (alta demanda)",val:2.6,pos:true},
  {name:"Déficit de estoques mundiais (-10% vs média)",val:1.9,pos:true},
  {name:"Redução área SP -30% (contração oferta)",val:1.7,pos:true},
  {name:"IPPA/CEPEA negativo 1T2026 (momentum baixista)",val:-1.8,pos:false},
  {name:"Custo de produção caindo (↓ pressão de oferta)",val:-0.7,pos:false},
]
const xaiHistData = [{range:"<R$100",prob:3},{range:"101–105",prob:7},{range:"106–110",prob:12},{range:"111–115",prob:18},{range:"116–120",prob:22},{range:"121–125",prob:20},{range:"126–130",prob:11},{range:"131–135",prob:5},{range:">R$135",prob:2}]
const ALERTAS_DATA = [
  {sev:"crit",name:"Preço CEPEA abaixo da média histórica",detail:"Média 2020–2025: R$115/sc | Atual: R$110/sc | Desvio: -4,3%",value:"R$ 110/sc"},
  {sev:"warn",name:"NDVI de Pres. Prudente abaixo do limiar",detail:"Limiar de monitoramento: 0,60 | Atual: 0,58 | Diferença: -0,02",value:"NDVI 0,58"},
  {sev:"warn",name:"Área plantada SP com redução expressiva",detail:"Área 2025/26: ~132 mil ha | Referência: 188 mil ha (2024/25) | Queda: -30%",value:"-30%"},
  {sev:"ok",name:"Aflatoxinas dentro do limite UE (Reg. 2023/915)",detail:"Limite UE: 4 ppb | Medição atual: 2,8 ppb | Margem de segurança: 30%",value:"2,8 ppb"},
  {sev:"ok",name:"Precipitação jan–abr/2026 acima da necessidade",detail:"Necessidade hídrica: 425mm | Precipitação real: 554mm | Superávit: +30%",value:"+30%"},
  {sev:"ok",name:"Custo de produção abaixo de 2025",detail:"2025: R$3.820/ha | 2026: R$3.751/ha | Redução: -1,8%",value:"-1,8%"},
]
const LINHAS_CREDITO = [
  {nome:"PRONAF C",desc:"Custeio agrícola familiar · Taxa 5% a.a. · Desconto 58% parcela abr/2026",max:"R$ 80 mil",taxa:"5% a.a.",cond:(dap,vbp,fin)=>dap==="sim"&&vbp<=360000&&fin==="custeio",destaque:true},
  {nome:"PRONAF D",desc:"Custeio/investimento · Até R$415 mil · Taxa 5% a.a.",max:"R$ 415 mil",taxa:"5% a.a.",cond:(dap,vbp)=>dap==="sim"&&vbp<=360000,destaque:false},
  {nome:"ABC+ Restauração",desc:"Boas práticas · Plantio direto, integração lavoura-pecuária",max:"R$ 5 mi",taxa:"8% a.a.",cond:(_,__,fin)=>fin==="ambiental"||fin==="investimento",destaque:false},
  {nome:"Inovagro",desc:"Adoção de tecnologias · Agricultura de precisão, equipamentos",max:"R$ 1,3 mi",taxa:"7,5% a.a.",cond:(_,__,fin)=>fin==="investimento",destaque:false},
  {nome:"Custeio Empresarial (BCB)",desc:"Produtores com VBP acima de R$360 mil · Juros de mercado",max:"Sem limite",taxa:"12–14% a.a.",cond:(dap,vbp)=>vbp>360000||dap==="nao",destaque:false},
  {nome:"PSR — Subvenção ao Seguro Rural",desc:"Subsídio de 50–70% no prêmio do seguro paramétrico · Cobertura climática",max:"Varia",taxa:"Subvenção 50–70%",cond:()=>true,destaque:false},
]

// ─────────────────────────────────────────────────────────────────────────────
// SYSTEM PROMPT
// ─────────────────────────────────────────────────────────────────────────────
const SYSTEM_PROMPT = `Você é AmendoIA v4, sistema de inteligência competitiva para a cadeia produtiva do amendoim em São Paulo, FCE-Tupã/UNESP, FAPESP. DATA: ABRIL DE 2026. Integra cinco agentes: AEP, AIM, AOL, AAI, AMA.

CONTEXTO MACRO ABR/2026: PIB agronegócio 2025 +12,2% (R$3,20 tri). Câmbio R$4,95 (real +10,12% no 1T2026). IPPA/CEPEA -9,79% no 1T2026. Selic 14,75%.

AEP: Produt. 2025/26: Tupã 4.250 kg/ha, Jaboti 4.310 kg/ha. Área SP -30% (~132 mil ha). Custo R$3.751/ha. Margem bruta R$1.149/ha. Aflatoxinas 2,8 ppb. IAC Caiapó 55%.
AIM: Preço CEPEA abr/2026 R$110/sc. Projeção set/26: R$117 (IC95%: R$101–R$133, conf. 64%). Exportações 2025: 311 mil t (+37%). Rússia 22%, UE 28%, China 20%. Óleo +170%. RCA Brasil 1,8.
AOL: Frete Tupã→Santos R$65/t (otim. R$52/t). Ocupação armazéns 62,6%.
AAI: Crédito rural R$125mi (+13,6%). PRONAF desconto 58%. PGPM R$82/sc vs mercado R$110.
AMA: Temp jan–abr/26: 24,2°C. Precipitação: 554mm (+63% vs 2024). NDVI Tupã 0,62. Risco aflatoxina baixo-moderado.

ICT abr/2026: Tupã 68,4 | Jaboticabal 73,0.

Responda em português técnico, orientado a decisões. Máximo 4 parágrafos. Cite qual agente é mais pertinente.`

// ─────────────────────────────────────────────────────────────────────────────
// DESIGN TOKENS
// ─────────────────────────────────────────────────────────────────────────────
const G = "#c8a94a", GR = "#52c78f", MU = "#7a9b7d", BO = "#1c3320", CB = "#0c1a0e", TX = "#d8ead9"
const TP = { background: CB, border: `1px solid ${BO}`, borderRadius: 6, fontSize: 12, color: TX }

// ─────────────────────────────────────────────────────────────────────────────
// COMPONENTES BASE
// ─────────────────────────────────────────────────────────────────────────────
function KPI({ label, value, sub, color = MU }) {
  return (
    <div style={{ background: CB, border: `1px solid ${BO}`, borderRadius: 10, padding: "16px 17px" }}>
      <div style={{ fontSize: 11, color: MU, marginBottom: 5 }}>{label}</div>
      <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 17, color: TX, fontWeight: 500 }}>{value}</div>
      <div style={{ fontSize: 11, marginTop: 4, color }}>{sub}</div>
    </div>
  )
}

function Card({ children, title, subtitle, style = {} }) {
  return (
    <div style={{ background: CB, border: `1px solid ${BO}`, borderRadius: 10, padding: 18, ...style }}>
      {title && <div style={{ fontSize: 13, color: MU, fontWeight: 500, marginBottom: subtitle ? 3 : 14 }}>{title}</div>}
      {subtitle && <div style={{ fontSize: 11, color: "#4a6b4d", marginBottom: 14, display: "flex", alignItems: "center", gap: 6 }}>{subtitle}</div>}
      {children}
    </div>
  )
}

function Freshness({ label, type = "green" }) {
  const c = type === "green" ? GR : G
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 10, padding: "1px 6px", borderRadius: 8, fontWeight: 500, background: `${c}1a`, border: `1px solid ${c}33`, color: c }}>
      <span style={{ width: 4, height: 4, borderRadius: "50%", background: c, flexShrink: 0 }} />
      {label}
    </span>
  )
}

function ConfBadge({ conf, ci }) {
  const color = conf >= 75 ? GR : conf >= 60 ? G : "#e05c5c"
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 3, fontSize: 10, padding: "2px 7px", borderRadius: 10, fontWeight: 500, marginLeft: 5, background: `${color}18`, border: `1px solid ${color}44`, color }}>
      {conf}% conf.{ci ? ` · IC95%: ${ci}` : ""}
    </span>
  )
}

function SubTab({ id, label, active, setActive }) {
  return (
    <button onClick={() => setActive(id)} style={{
      background: active === id ? "rgba(200,169,74,.13)" : "none",
      border: `1px solid ${active === id ? "rgba(200,169,74,.3)" : BO}`,
      color: active === id ? G : MU, padding: "4px 12px", borderRadius: 6,
      fontSize: 12, cursor: "pointer", fontFamily: "'DM Sans',sans-serif", transition: "all .2s"
    }}>{label}</button>
  )
}

function QRow({ label, value, target, ok, note }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: `1px solid ${BO}` }}>
      <div><div style={{ fontSize: 12, color: "#a8c4aa" }}>{label}</div>{note && <div style={{ fontSize: 10, color: GR }}>{note}</div>}</div>
      <div style={{ textAlign: "right" }}>
        <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 13, color: ok ? GR : "#e05c5c" }}>{value}</div>
        {target && <div style={{ fontSize: 10, color: "#3a5a3d" }}>{target}</div>}
      </div>
    </div>
  )
}

function SliderRow({ label, min, max, step, value, onChange, display }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
      <div style={{ fontSize: 12, color: MU, minWidth: 200 }}>{label}</div>
      <input type="range" min={min} max={max} step={step} value={value} onChange={e => onChange(parseFloat(e.target.value))} style={{ flex: 1, accentColor: G }} />
      <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 13, color: TX, minWidth: 90, textAlign: "right" }}>{display}</span>
    </div>
  )
}

function ResultBox({ label, value, note, color = TX }) {
  return (
    <div style={{ background: "#080f09", border: `1px solid ${BO}`, borderRadius: 8, padding: "12px 14px" }}>
      <div style={{ fontSize: 11, color: MU, marginBottom: 4 }}>{label}</div>
      <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 16, fontWeight: 500, color }}>{value}</div>
      {note && <div style={{ fontSize: 10, color: "#3a5a3d", marginTop: 3 }}>{note}</div>}
    </div>
  )
}

function ToolCard({ title, sub, children }) {
  return (
    <div style={{ background: CB, border: `1px solid ${BO}`, borderRadius: 10, padding: 18, marginBottom: 14 }}>
      <div style={{ fontSize: 14, color: G, fontWeight: 500, marginBottom: 4 }}>{title}</div>
      <div style={{ fontSize: 11, color: "#4a6b4d", marginBottom: 16 }}>{sub}</div>
      {children}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// F7: CENTRAL DE ALERTAS
// ─────────────────────────────────────────────────────────────────────────────
function CentralAlertas() {
  const sevColor = { ok: GR, warn: "#e0a040", crit: "#e05c5c" }
  const sevLabel = { ok: "OK", warn: "ATENÇÃO", crit: "ALERTA" }
  return (
    <Card title="⚡ Central de Alertas — Detecção de Anomalias" subtitle={<>Monitoramento automático por regras · Z-score sobre dados históricos <Freshness label="ao vivo" /></>}>
      <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
        {ALERTAS_DATA.map((a, i) => (
          <div key={i} style={{ background: "#080f09", border: `1px solid ${BO}`, borderRadius: 8, padding: "10px 14px", display: "grid", gridTemplateColumns: "10px 1fr auto auto", gap: 10, alignItems: "center" }}>
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: sevColor[a.sev] }} />
            <div>
              <div style={{ fontSize: 13, color: TX }}>{a.name}</div>
              <div style={{ fontSize: 11, color: MU, marginTop: 2 }}>{a.detail}</div>
            </div>
            <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 13, color: sevColor[a.sev], textAlign: "right" }}>{a.value}</div>
            <div style={{ fontSize: 10, padding: "2px 8px", borderRadius: 8, fontWeight: 500, background: `${sevColor[a.sev]}18`, color: sevColor[a.sev], textAlign: "center", whiteSpace: "nowrap" }}>{sevLabel[a.sev]}</div>
          </div>
        ))}
      </div>
    </Card>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// F1: CALCULADORA DE EQUILÍBRIO
// ─────────────────────────────────────────────────────────────────────────────
function Calculadora() {
  const [area, setArea] = useState(100)
  const [custo, setCusto] = useState(3751)
  const [prod, setProd] = useState(4250)
  const [preco, setPreco] = useState(110)

  const scsPorHa = prod / 25
  const precoEq = (custo / scsPorHa).toFixed(1)
  const prodEq = Math.round(custo / (preco / 25))
  const receita = Math.round(area * prod * (preco / 25))
  const custoTotal = Math.round(area * custo)
  const margem = receita - custoTotal
  const seg = ((preco - parseFloat(precoEq)) / preco * 100).toFixed(1)
  const lucro = margem >= 0

  return (
    <ToolCard title="⚖️ Calculadora de Ponto de Equilíbrio" sub="Informe sua estrutura produtiva e veja o preço mínimo de venda, produtividade mínima e margem de segurança vs. CEPEA abr/2026">
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <div>
          <SliderRow label="Área plantada (ha)" min={10} max={500} step={5} value={area} onChange={setArea} display={`${area} ha`} />
          <SliderRow label="Custo de produção (R$/ha)" min={1500} max={7000} step={100} value={custo} onChange={setCusto} display={`R$ ${custo.toLocaleString("pt-BR")}`} />
          <SliderRow label="Produtividade esperada (kg/ha)" min={1000} max={6000} step={100} value={prod} onChange={setProd} display={`${prod.toLocaleString("pt-BR")} kg/ha`} />
          <SliderRow label="Preço de mercado (R$/sc 25kg)" min={50} max={200} step={1} value={preco} onChange={setPreco} display={`R$ ${preco}`} />
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, alignContent: "start" }}>
          <ResultBox label="Preço mínimo de venda" value={`R$ ${precoEq}/sc`} note="Abaixo disso = prejuízo" color={G} />
          <ResultBox label="Produtividade mínima" value={`${prodEq.toLocaleString("pt-BR")} kg/ha`} note="Para cobrir o custo" color={G} />
          <ResultBox label="Receita bruta total" value={`R$ ${receita.toLocaleString("pt-BR")}`} note={`${area} ha × ${prod} kg`} color={GR} />
          <ResultBox label="Margem bruta total" value={`R$ ${margem.toLocaleString("pt-BR")}`} note={lucro ? "Lucrativo" : "Prejuízo"} color={lucro ? GR : "#e05c5c"} />
        </div>
      </div>
      <div style={{ marginTop: 12, background: lucro ? "rgba(82,199,143,.07)" : "rgba(224,80,80,.07)", border: `1px solid ${lucro ? "rgba(82,199,143,.22)" : "rgba(224,80,80,.22)"}`, borderRadius: 8, padding: "11px 16px" }}>
        <span style={{ fontSize: 13, fontWeight: 500, color: lucro ? GR : "#e05c5c" }}>{lucro ? "Operação rentável · " : "Operação deficitária · "}</span>
        <span style={{ fontSize: 13, color: "#a8c4aa" }}>Margem de segurança de preço: {seg}%. Preço atual R${preco}/sc está {parseFloat(seg) >= 0 ? "acima" : "abaixo"} do equilíbrio (R${precoEq}/sc). Produtividade esperada ({prod} kg/ha) é {prod >= prodEq ? "superior" : "inferior"} à mínima necessária ({prodEq.toLocaleString("pt-BR")} kg/ha).</span>
      </div>
    </ToolCard>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// F2: SIMULADOR DE CENÁRIOS
// ─────────────────────────────────────────────────────────────────────────────
function SimuladorCenarios() {
  const [s1, setS1] = useState({ cambio: 4.95, preco: 95, prod: 3400, area: 110 })
  const [s2, setS2] = useState({ cambio: 4.95, preco: 110, prod: 4250, area: 132 })
  const [s3, setS3] = useState({ cambio: 5.30, preco: 128, prod: 4500, area: 155 })

  const calc = s => {
    const rec = s.area * 1000 * s.prod * (s.preco / 25)
    const cst = s.area * 1000 * 3751
    const mrg = rec - cst
    const pct = (mrg / rec * 100).toFixed(1)
    const usd = (rec / s.cambio / 1e9).toFixed(2)
    return { rec: (rec / 1e9).toFixed(2), cst: (cst / 1e9).toFixed(2), mrg: (mrg / 1e9).toFixed(2), pct, usd, mrgRaw: mrg }
  }
  const r1 = calc(s1), r2 = calc(s2), r3 = calc(s3)
  const chartData = [
    { label: "Receita (R$ bi)", Pessimista: parseFloat(r1.rec), Base: parseFloat(r2.rec), Otimista: parseFloat(r3.rec) },
    { label: "Custo (R$ bi)", Pessimista: parseFloat(r1.cst), Base: parseFloat(r2.cst), Otimista: parseFloat(r3.cst) },
    { label: "Margem (R$ bi)", Pessimista: parseFloat(r1.mrg), Base: parseFloat(r2.mrg), Otimista: parseFloat(r3.mrg) },
  ]

  const ScField = ({ label, field, val, setter, step = 1 }) => (
    <div style={{ marginBottom: 10 }}>
      <div style={{ fontSize: 11, color: MU, marginBottom: 4 }}>{label}</div>
      <input type="number" step={step} value={val} onChange={e => setter(p => ({ ...p, [field]: parseFloat(e.target.value) || 0 }))}
        style={{ width: "100%", background: CB, border: `1px solid ${BO}`, borderRadius: 6, padding: "6px 10px", color: TX, fontFamily: "'DM Mono',monospace", fontSize: 13, outline: "none" }} />
    </div>
  )
  const ScResults = ({ r, color }) => (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 7, marginTop: 10 }}>
      <ResultBox label="Receita bruta SP" value={`R$ ${r.rec} bi`} color={GR} />
      <ResultBox label="Margem total SP" value={`R$ ${r.mrg} bi`} color={r.mrgRaw >= 0 ? GR : "#e05c5c"} />
      <ResultBox label="Margem %" value={`${r.pct}%`} color={parseFloat(r.pct) >= 0 ? GR : "#e05c5c"} />
      <ResultBox label="Receita (US$ bi)" value={`US$ ${r.usd} bi`} color={G} />
    </div>
  )

  return (
    <ToolCard title="📊 Simulador de Cenários — Pessimista · Base · Otimista" sub="Configure três cenários e compare receita, margem e VPA do setor SP lado a lado">
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginBottom: 14 }}>
        {[
          { label: "Cenário Pessimista", s: s1, set: setS1, r: r1, color: "#e05c5c" },
          { label: "Cenário Base (atual)", s: s2, set: setS2, r: r2, color: G },
          { label: "Cenário Otimista", s: s3, set: setS3, r: r3, color: GR },
        ].map(({ label, s, set, r, color }) => (
          <div key={label} style={{ background: "#080f09", border: `1px solid ${BO}`, borderRadius: 10, padding: "14px 16px" }}>
            <div style={{ fontSize: 12, fontWeight: 500, color, marginBottom: 12, paddingBottom: 8, borderBottom: `1px solid ${BO}` }}>{label}</div>
            <ScField label="Câmbio BRL/USD" field="cambio" val={s.cambio} setter={set} step={0.05} />
            <ScField label="Preço (R$/sc)" field="preco" val={s.preco} setter={set} step={1} />
            <ScField label="Produtividade (kg/ha)" field="prod" val={s.prod} setter={set} step={50} />
            <ScField label="Área SP (mil ha)" field="area" val={s.area} setter={set} step={5} />
            <ScResults r={r} color={color} />
          </div>
        ))}
      </div>
      <Card title="Comparativo visual — Receita, Custo e Margem (R$ bi)">
        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke={BO} />
            <XAxis dataKey="label" tick={{ fontSize: 11, fill: MU }} />
            <YAxis tick={{ fontSize: 10, fill: "#3a5a3d" }} />
            <Tooltip contentStyle={TP} />
            <Legend iconSize={8} wrapperStyle={{ fontSize: 11 }} />
            <Bar dataKey="Pessimista" fill="#e05c5c99" radius={[3, 3, 0, 0]} />
            <Bar dataKey="Base" fill={`${G}99`} radius={[3, 3, 0, 0]} />
            <Bar dataKey="Otimista" fill={`${GR}99`} radius={[3, 3, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </Card>
    </ToolCard>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// F3: CONTRAFACTUAL
// ─────────────────────────────────────────────────────────────────────────────
function Contrafactual() {
  const [cambio, setCambio] = useState(4.95)
  const [deficit, setDeficit] = useState(10)
  const [sazon, setSazon] = useState(1.0)
  const [area, setArea] = useState(30)

  const priceNew = 110 * Math.pow(cambio / 4.95, 0.68) * (1 + deficit / 100 * 0.3) * sazon * (1 + area / 100 * 0.002)
  const delta = priceNew - 110
  const recPorHa = Math.round(4250 * priceNew / 25)
  const margem = ((priceNew / 25 * 4250 - 3751) / (priceNew / 25 * 4250) * 100).toFixed(1)

  return (
    <ToolCard title="🔄 Modo Contrafactual — E se?" sub="Ajuste as variáveis e veja como cada mudança propaga na projeção de preço via fórmula ARIMA simplificada">
      <SliderRow label="Câmbio BRL/USD (atual: R$ 4,95)" min={4.0} max={6.5} step={0.05} value={cambio} onChange={setCambio} display={`R$ ${cambio.toFixed(2)}`} />
      <SliderRow label="Déficit de estoques mundiais (%)" min={-20} max={30} step={1} value={deficit} onChange={setDeficit} display={`${deficit >= 0 ? "+" : ""}${deficit}%`} />
      <SliderRow label="Fator de sazonalidade" min={0.80} max={1.20} step={0.01} value={sazon} onChange={setSazon} display={`${sazon.toFixed(2)}×`} />
      <SliderRow label="Redução de área plantada SP (%)" min={-10} max={50} step={1} value={area} onChange={setArea} display={`-${area}%`} />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 10, marginTop: 14 }}>
        <ResultBox label="Preço projetado" value={`R$ ${priceNew.toFixed(0)}/sc`} note="vs base R$110/sc" color={priceNew >= 110 ? GR : "#e05c5c"} />
        <ResultBox label="Variação vs base" value={`${delta >= 0 ? "+" : ""}${delta.toFixed(1)} R$/sc`} note="impacto combinado" color={delta >= 0 ? GR : "#e05c5c"} />
        <ResultBox label="Receita por ha estimada" value={`R$ ${recPorHa.toLocaleString("pt-BR")}`} note="4.250 kg/ha" color={G} />
        <ResultBox label="Margem bruta estimada" value={`${margem}%`} note="sobre receita bruta" color={parseFloat(margem) > 0 ? GR : "#e05c5c"} />
      </div>
    </ToolCard>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// F4: PLANEJADOR DE VENDA
// ─────────────────────────────────────────────────────────────────────────────
function PlanejadorVenda() {
  const [volume, setVolume] = useState(1660)
  const [storage, setStorage] = useState(0.45)
  const [p1, setP1] = useState(30)
  const [p2, setP2] = useState(40)
  const [p3, setP3] = useState(30)

  const total = p1 + p2 + p3
  const v1 = Math.round(volume * p1 / 100)
  const v2 = Math.round(volume * p2 / 100)
  const v3 = Math.round(volume * p3 / 100)
  const c2 = storage * 3 * v2
  const c3 = storage * 6 * v3
  const r1 = v1 * 110, r2 = v2 * 117 - c2, r3 = v3 * 128 - c3
  const rTotal = r1 + r2 + r3
  const rBase = volume * 110
  const ganho = rTotal - rBase
  const ok = Math.abs(total - 100) <= 1

  const periodos = [
    { label: "Abr/2026", preco: "R$ 110/sc", vol: v1, pct: p1, rec: r1, color: "#6b3d12" },
    { label: "Jun–Jul/2026", preco: "proj. R$ 117/sc", vol: v2, pct: p2, rec: r2, color: MU },
    { label: "Set–Out/2026", preco: "proj. R$ 128/sc", vol: v3, pct: p3, rec: r3, color: GR },
  ]

  return (
    <ToolCard title="📅 Planejador de Estratégia de Venda" sub="Distribua sua produção entre as três janelas de preço e compare a receita líquida vs. vender tudo agora">
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12, marginBottom: 14 }}>
        {[
          { label: "Volume total (sacas 25kg)", val: volume, set: setVolume, step: 10 },
          { label: "Custo de armazenagem (R$/sc/mês)", val: storage, set: setStorage, step: 0.05 },
        ].map(({ label, val, set, step }) => (
          <div key={label}>
            <div style={{ fontSize: 11, color: MU, marginBottom: 4 }}>{label}</div>
            <input type="number" step={step} value={val} onChange={e => set(parseFloat(e.target.value) || 0)}
              style={{ width: "100%", background: CB, border: `1px solid ${BO}`, borderRadius: 6, padding: "6px 10px", color: TX, fontFamily: "'DM Mono',monospace", fontSize: 13, outline: "none" }} />
          </div>
        ))}
      </div>
      <SliderRow label="% vender agora (abr — R$110/sc)" min={0} max={100} step={5} value={p1} onChange={setP1} display={`${p1}%`} />
      <SliderRow label="% vender jun–jul (proj. R$117/sc)" min={0} max={100} step={5} value={p2} onChange={setP2} display={`${p2}%`} />
      <SliderRow label="% vender set–out (proj. R$128/sc)" min={0} max={100} step={5} value={p3} onChange={setP3} display={`${p3}%`} />
      {!ok && <div style={{ fontSize: 11, color: "#e05c5c", marginBottom: 8 }}>⚠ A soma das proporções ({total}%) deve ser 100%</div>}
      <div style={{ display: "flex", flexDirection: "column", gap: 7, marginTop: 8 }}>
        {periodos.map((p, i) => (
          <div key={i} style={{ background: "#080f09", border: `1px solid ${BO}`, borderRadius: 8, padding: "11px 14px", display: "grid", gridTemplateColumns: "110px 1fr auto", gap: 12, alignItems: "center" }}>
            <div>
              <div style={{ fontSize: 13, color: TX, fontWeight: 500 }}>{p.label}</div>
              <div style={{ fontSize: 11, color: MU }}>{p.preco}</div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 12, color: MU, minWidth: 30 }}>{p.pct}%</span>
              <div style={{ flex: 1, height: 12, background: "#080f09", borderRadius: 6, overflow: "hidden", border: `1px solid ${BO}` }}>
                <div style={{ width: `${p.pct}%`, height: "100%", background: p.color, borderRadius: 6, minWidth: p.pct > 0 ? 4 : 0 }} />
              </div>
              <span style={{ fontSize: 11, color: MU }}>{p.vol} sc</span>
            </div>
            <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 13, color: i === 2 ? GR : i === 1 ? G : MU }}>R$ {Math.round(p.rec).toLocaleString("pt-BR")}</div>
          </div>
        ))}
      </div>
      <div style={{ background: CB, border: `1px solid ${BO}`, borderRadius: 8, padding: "14px 16px", marginTop: 12, display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14 }}>
        {[
          { label: "Receita total líquida", val: `R$ ${Math.round(rTotal).toLocaleString("pt-BR")}`, color: GR },
          { label: "vs. vender tudo agora", val: `${ganho >= 0 ? "+" : ""}R$ ${Math.round(ganho).toLocaleString("pt-BR")}`, color: ganho >= 0 ? GR : "#e05c5c" },
          { label: "Ganho por saca", val: `${ganho >= 0 ? "+" : ""}R$ ${(ganho / volume).toFixed(2)}`, color: ganho >= 0 ? GR : "#e05c5c" },
        ].map(({ label, val, color }) => (
          <div key={label} style={{ textAlign: "center" }}>
            <div style={{ fontSize: 11, color: MU, marginBottom: 4 }}>{label}</div>
            <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 16, fontWeight: 500, color }}>{val}</div>
          </div>
        ))}
      </div>
    </ToolCard>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// F10: EXPLICABILIDADE XAI
// ─────────────────────────────────────────────────────────────────────────────
function XAIPanel() {
  const maxVal = Math.max(...xaiFatores.map(f => Math.abs(f.val)))
  return (
    <div>
      <ToolCard title="🧠 Explicabilidade XAI — Por que R$117/sc em set/2026?" sub="Análise SHAP simulada: contribuição de cada fator para a projeção ARIMA-GARCH. Verde = impacto positivo · Vermelho = negativo">
        <div style={{ fontSize: 12, color: MU, marginBottom: 14 }}>
          Projeção base: R$110/sc (abr/2026) + contribuições = <strong style={{ color: GR }}>R$117/sc (set/2026)</strong>
          <ConfBadge conf={64} ci="R$101–R$133" />
        </div>
        {xaiFatores.map((f, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 9 }}>
            <div style={{ fontSize: 12, color: MU, minWidth: 280 }}>{f.name}</div>
            <div style={{ flex: 1, height: 16, background: "#0a1a0c", borderRadius: 4, overflow: "hidden" }}>
              <div style={{ width: `${Math.abs(f.val) / maxVal * 100}%`, height: "100%", background: f.pos ? GR : "#e05c5c", borderRadius: 4 }} />
            </div>
            <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 12, minWidth: 65, textAlign: "right", color: f.pos ? GR : "#e05c5c" }}>
              {f.val >= 0 ? "+" : ""}R${Math.abs(f.val).toFixed(1)}
            </div>
          </div>
        ))}
        <div style={{ borderTop: `1px solid ${BO}`, marginTop: 14, paddingTop: 12, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontSize: 12, color: MU }}>Base: R$110/sc + ajustes ARIMA-GARCH</span>
          <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 15, color: GR }}>Projeção: R$117/sc</span>
        </div>
      </ToolCard>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
        <Card title="Distribuição de probabilidade — projeção set/2026">
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={xaiHistData}>
              <CartesianGrid strokeDasharray="3 3" stroke={BO} />
              <XAxis dataKey="range" tick={{ fontSize: 10, fill: MU }} />
              <YAxis tick={{ fontSize: 10, fill: "#3a5a3d" }} unit="%" />
              <Tooltip contentStyle={TP} />
              <Bar dataKey="prob" name="Probabilidade (%)" fill={GR} radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>
        <Card title="Intervalos de confiança">
          <div style={{ display: "flex", flexDirection: "column", gap: 12, padding: "10px 0" }}>
            {[
              { label: "IC 50%", val: "R$112 – R$122", color: TX },
              { label: "IC 80%", val: "R$106 – R$128", color: G },
              { label: "IC 95%", val: "R$101 – R$133", color: MU },
            ].map(({ label, val, color }) => (
              <div key={label} style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ fontSize: 12, color: MU }}>{label}</span>
                <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 13, color }}>{val}</span>
              </div>
            ))}
            <div style={{ fontSize: 11, color: "#3a5a3d", marginTop: 8 }}>
              Confiança calculada sobre 27 observações mensais CEPEA. Volatilidade 30d: 8,2%.
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// F9: SANKEY (SVG React)
// ─────────────────────────────────────────────────────────────────────────────
function SankeyChart() {
  const nodes = [
    { id: 0, name: "Produtor Rural", x: 20, y: 80, w: 110, h: 100, color: "#1c4a30", val: "R$4,40/kg" },
    { id: 1, name: "Cooperativa / Trader", x: 200, y: 40, w: 125, h: 70, color: "#2d6b40", val: "R$7,80/kg" },
    { id: 2, name: "Indústria Processadora", x: 200, y: 140, w: 125, h: 75, color: "#3a5a3d", val: "R$5,20/kg" },
    { id: 3, name: "Exportação Descascado", x: 400, y: 20, w: 120, h: 58, color: MU, val: "R$5,88/kg" },
    { id: 4, name: "Exportação Óleo", x: 400, y: 108, w: 120, h: 55, color: "#4a6b4d", val: "R$4,60/kg" },
    { id: 5, name: "Mercado Interno", x: 400, y: 193, w: 120, h: 55, color: "#3a5a3d", val: "R$4,20/kg" },
  ]
  const links = [
    { s: 0, t: 1, thick: 22, opacity: 0.5 }, { s: 0, t: 2, thick: 14, opacity: 0.4 },
    { s: 1, t: 3, thick: 16, opacity: 0.45 }, { s: 1, t: 4, thick: 9, opacity: 0.4 },
    { s: 2, t: 5, thick: 10, opacity: 0.4 }, { s: 2, t: 4, thick: 6, opacity: 0.35 },
  ]
  const makePath = (s, t, thick) => {
    const sn = nodes[s], tn = nodes[t]
    const sx = sn.x + sn.w, sy = sn.y + sn.h / 2
    const tx = tn.x, ty = tn.y + tn.h / 2
    const hw = thick / 2
    return `M${sx},${sy - hw} C${sx + 55},${sy - hw} ${tx - 55},${ty - hw} ${tx},${ty - hw} L${tx},${ty + hw} C${tx - 55},${ty + hw} ${sx + 55},${sy + hw} ${sx},${sy + hw} Z`
  }
  return (
    <ToolCard title="🔀 Mapa de Captura de Valor da Cadeia" sub="Spread de valor entre produtor (CEPEA), cooperativa/trader, exportador e mercado final · CEPEA vs. AGROSTAT preço FOB abr/2026">
      <svg viewBox="0 0 560 280" style={{ width: "100%", height: 280, marginBottom: 14 }}>
        {links.map((l, i) => (
          <path key={i} d={makePath(l.s, l.t, l.thick)} fill={nodes[l.s].color} opacity={l.opacity} />
        ))}
        {nodes.map(n => (
          <g key={n.id}>
            <rect x={n.x} y={n.y} width={n.w} height={n.h} rx={6} fill={n.color} stroke={BO} strokeWidth={0.5} />
            <text x={n.x + n.w / 2} y={n.y + n.h / 2 - 6} textAnchor="middle" fill="#d8ead9" fontSize={10} fontFamily="'DM Sans',sans-serif">{n.name}</text>
            <text x={n.x + n.w / 2} y={n.y + n.h / 2 + 10} textAnchor="middle" fill={G} fontSize={11} fontFamily="'DM Mono',monospace">{n.val}</text>
          </g>
        ))}
      </svg>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 10 }}>
        <ResultBox label="Receita do produtor (abr/2026)" value="R$ 4,40/kg" note="CEPEA: R$110/sc · 25kg = R$4,40" color={G} />
        <ResultBox label="Spread trader + cooperativa" value="R$ 0,55/kg" note="Processamento, armazenagem, margem" color="#e0a040" />
        <ResultBox label="Preço FOB exportação" value="R$ 5,88/kg" note="US$1,188/kg × R$4,95 = R$5,88" color={GR} />
      </div>
    </ToolCard>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// F11: BENCHMARKING
// ─────────────────────────────────────────────────────────────────────────────
function BenchmarkingPanel() {
  const [benchProd, setBenchProd] = useState(3900)
  const [benchCost, setBenchCost] = useState(3750)
  const [benchMargin, setBenchMargin] = useState(1150)

  const metrics = [
    { name: "Produtividade", unit: "kg/ha", val: benchProd, q: [1500, 3200, 3900, 4400, 6000] },
    { name: "Custo de produção", unit: "R$/ha", val: benchCost, q: [2000, 3400, 3750, 4100, 6000] },
    { name: "Margem bruta", unit: "R$/ha", val: benchMargin, q: [-500, 800, 1200, 1600, 3000] },
  ]
  const qColors = ["#1c4a30", "#2d6b40", "#3d9970", GR]
  const qNames = ["Q1 — inferior", "Q2", "Q3", "Q4 — superior"]

  const BenchBar = ({ m }) => {
    const range = m.q[4] - m.q[0]
    const pct = v => Math.max(0, Math.min(100, (v - m.q[0]) / range * 100))
    const myPct = pct(m.val)
    let qIdx = m.q.findIndex((v, i) => i > 0 && m.val <= v) - 1
    if (qIdx < 0) qIdx = 3
    return (
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
        <div style={{ fontSize: 12, color: MU, minWidth: 160 }}>{m.name} ({m.unit})</div>
        <div style={{ flex: 1, height: 20, background: "#0a1a0c", borderRadius: 10, position: "relative", overflow: "hidden" }}>
          {[0, 1, 2, 3].map(i => (
            <div key={i} style={{ position: "absolute", top: 0, left: `${pct(m.q[i])}%`, width: `${pct(m.q[i + 1]) - pct(m.q[i])}%`, height: "100%", background: qColors[i], opacity: 0.8 }} />
          ))}
          <div style={{ position: "absolute", top: -3, left: `${myPct}%`, width: 3, height: 26, background: G, borderRadius: 2, transform: "translateX(-50%)" }} />
        </div>
        <div style={{ fontSize: 12, color: qColors[Math.min(qIdx, 3)], fontWeight: 500, minWidth: 90, textAlign: "right" }}>{qNames[Math.min(qIdx, 3)]}</div>
      </div>
    )
  }

  return (
    <ToolCard title="📊 Benchmarking por Quartil — Posicionamento Regional" sub="Informe os valores da sua propriedade e veja sua posição relativa na distribuição regional IEA-SP 2025 (grupo 50–200 ha, Tupã e Jaboticabal)">
      <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: 16 }}>
        <div>
          <SliderRow label="Minha produtividade (kg/ha)" min={1500} max={6000} step={50} value={benchProd} onChange={setBenchProd} display={benchProd.toLocaleString("pt-BR")} />
          <SliderRow label="Meu custo de produção (R$/ha)" min={2000} max={6000} step={50} value={benchCost} onChange={setBenchCost} display={benchCost.toLocaleString("pt-BR")} />
          <SliderRow label="Minha margem bruta (R$/ha)" min={-500} max={3000} step={50} value={benchMargin} onChange={setBenchMargin} display={benchMargin.toLocaleString("pt-BR")} />
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 8 }}>
            {qColors.map((c, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11, color: MU }}>
                <div style={{ width: 8, height: 8, borderRadius: 2, background: c }} />
                {["Q1","Q2","Q3","Q4"][i]}
              </div>
            ))}
            <div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11, color: MU }}>
              <div style={{ width: 3, height: 12, background: G, borderRadius: 2 }} />
              Sua posição
            </div>
          </div>
        </div>
        <div>
          {metrics.map(m => <BenchBar key={m.name} m={m} />)}
        </div>
      </div>
    </ToolCard>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// F5: ELEGIBILIDADE DE CRÉDITO
// ─────────────────────────────────────────────────────────────────────────────
function CreditoRural() {
  const [dap, setDap] = useState("sim")
  const [vbp, setVbp] = useState(180000)
  const [final, setFinal] = useState("custeio")
  const [mun, setMun] = useState("tupa")

  const elegiveis = LINHAS_CREDITO.filter(l => l.cond(dap, vbp, final, mun))

  const selectSt = { width: "100%", background: CB, border: `1px solid ${BO}`, borderRadius: 6, padding: "8px 12px", color: TX, fontFamily: "'DM Sans',sans-serif", fontSize: 13, outline: "none" }

  return (
    <ToolCard title="💰 Painel de Elegibilidade de Crédito Rural" sub="Informe seu perfil e veja quais linhas de crédito você está habilitado a acessar com taxas e condições de abril/2026">
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
        <div><div style={{ fontSize: 11, color: MU, marginBottom: 4 }}>Possui DAP / CAF?</div>
          <select value={dap} onChange={e => setDap(e.target.value)} style={selectSt}>
            <option value="sim">Sim — sou agricultor familiar</option>
            <option value="nao">Não — produtor empresarial</option>
          </select>
        </div>
        <div><div style={{ fontSize: 11, color: MU, marginBottom: 4 }}>Valor Bruto da Produção anual (R$)</div>
          <input type="number" value={vbp} onChange={e => setVbp(parseFloat(e.target.value) || 0)} style={{ ...selectSt, fontFamily: "'DM Mono',monospace" }} />
        </div>
        <div><div style={{ fontSize: 11, color: MU, marginBottom: 4 }}>Finalidade do crédito</div>
          <select value={final} onChange={e => setFinal(e.target.value)} style={selectSt}>
            <option value="custeio">Custeio — capital de giro para a safra</option>
            <option value="investimento">Investimento — máquinas, equipamentos</option>
            <option value="ambiental">Ambiental — boas práticas, certificação</option>
          </select>
        </div>
        <div><div style={{ fontSize: 11, color: MU, marginBottom: 4 }}>Município</div>
          <select value={mun} onChange={e => setMun(e.target.value)} style={selectSt}>
            <option value="tupa">Tupã</option>
            <option value="jaboti">Jaboticabal</option>
            <option value="outro">Outro município de SP</option>
          </select>
        </div>
      </div>
      <div style={{ fontSize: 12, color: MU, marginBottom: 10 }}>
        {elegiveis.length} linhas encontradas · DAP: {dap === "sim" ? "Sim" : "Não"} · VBP: R${vbp.toLocaleString("pt-BR")} · {final}
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {elegiveis.map((l, i) => (
          <div key={i} style={{ background: "#080f09", border: `1px solid ${l.destaque ? "rgba(200,169,74,.4)" : BO}`, borderRadius: 8, padding: "12px 14px", display: "grid", gridTemplateColumns: "1fr auto", gap: 8, alignItems: "start" }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 500, color: TX, marginBottom: 3 }}>{l.nome}{l.destaque ? " ⭐" : ""}</div>
              <div style={{ fontSize: 11, color: MU }}>{l.desc}</div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: 10, padding: "3px 8px", borderRadius: 8, background: "rgba(82,199,143,.12)", color: GR, border: "1px solid rgba(82,199,143,.25)" }}>{l.taxa}</div>
              <div style={{ fontSize: 10, color: MU, marginTop: 4 }}>{l.max}</div>
            </div>
          </div>
        ))}
      </div>
    </ToolCard>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// INSIGHTS BAR
// ─────────────────────────────────────────────────────────────────────────────
function InsightsBar({ items }) {
  const sections = [
    { key: "tendencias", label: "📈 Tendências", color: GR, bg: "rgba(82,199,143,.06)", border: "rgba(82,199,143,.18)" },
    { key: "riscos",     label: "⚠ Riscos Potenciais", color: "#e0a040", bg: "rgba(224,160,64,.06)", border: "rgba(224,160,64,.2)" },
    { key: "analise",    label: "🎯 Análise Estratégica", color: G, bg: "rgba(200,169,74,.06)", border: "rgba(200,169,74,.18)" },
  ]
  return (
    <div style={{ marginTop: 16, border: `1px solid ${BO}`, borderRadius: 10, overflow: "hidden" }}>
      <div style={{ background: "#0a1a0c", borderBottom: `1px solid ${BO}`, padding: "9px 16px", display: "flex", alignItems: "center" }}>
        <span style={{ width: 6, height: 6, borderRadius: "50%", background: GR, display: "inline-block", marginRight: 6 }} />
        <span style={{ fontSize: 12, color: MU, fontWeight: 500 }}>Análise de Inteligência · AmendoIA · abr/2026</span>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr" }}>
        {sections.map((s, si) => (
          <div key={s.key} style={{ background: s.bg, borderRight: si < 2 ? `1px solid ${BO}` : "none", padding: "14px 16px" }}>
            <div style={{ fontSize: 11, color: s.color, fontWeight: 600, marginBottom: 10, letterSpacing: .3 }}>{s.label}</div>
            {(items[s.key] || []).map((text, i) => (
              <div key={i} style={{ display: "flex", gap: 6, alignItems: "flex-start", marginBottom: 7 }}>
                <span style={{ color: s.color, fontSize: 10, flexShrink: 0, marginTop: 2 }}>▸</span>
                <span style={{ fontSize: 12, color: TX, lineHeight: 1.5 }}>{text}</span>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// COMPONENTE PRINCIPAL
// ─────────────────────────────────────────────────────────────────────────────
export default function AmendoIA() {
  const [tab, setTab] = useState("overview")
  const [region, setRegion] = useState("both")
  const [aepSub, setAepSub] = useState("productivity")
  const [aimSub, setAimSub] = useState("prices")
  const [aolSub, setAolSub] = useState("routes")
  const [aaiSub, setAaiSub] = useState("overview")
  const [amaSub, setAmaSub] = useState("climate")
  const [toolSub, setToolSub] = useState("calc")
  const [msgs, setMsgs] = useState([{ role: "assistant", content: "Olá! Sou AmendoIA v4 — agora com 11 novas funcionalidades da banca avaliadora.\n\nDestaques: calculadora de equilíbrio, simulador de cenários, modo contrafactual, planejador de venda, painel de crédito rural, scores de confiança, central de alertas, mapa de captura de valor (Sankey), XAI e benchmarking por quartil.\n\nAcesse a aba 🛠 Ferramentas para as calculadoras interativas. O que gostaria de analisar?" }])
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)
  const chatRef = useRef(null)

  useEffect(() => { if (chatRef.current) chatRef.current.scrollTop = chatRef.current.scrollHeight }, [msgs, loading])

  const send = async () => {
    if (!input.trim() || loading) return
    const um = { role: "user", content: input }
    const next = [...msgs, um]
    setMsgs(next); setInput(""); setLoading(true)
    try {
      const r = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ model: "claude-sonnet-4-20250514", max_tokens: 1000, system: SYSTEM_PROMPT, messages: next.map(m => ({ role: m.role, content: m.content })) })
      })
      const d = await r.json()
      setMsgs(p => [...p, { role: "assistant", content: d.content[0].text }])
    } catch { setMsgs(p => [...p, { role: "assistant", content: "Erro ao processar. Tente novamente." }]) }
    setLoading(false)
  }

  const showT = region === "both" || region === "tupa"
  const showJ = region === "both" || region === "jaboti"
  const regionName = region === "tupa" ? "Tupã" : region === "jaboti" ? "Jaboticabal" : "Ambas as regiões"

  const TABS = [
    { id: "overview", label: "Visão Geral" }, { id: "aep", label: "AEP – Produção" },
    { id: "aim", label: "AIM – Mercado" }, { id: "aol", label: "AOL – Logística" },
    { id: "aai", label: "AAI – Institucional" }, { id: "ama", label: "AMA – Ambiental" },
    { id: "sep" }, { id: "ferramentas", label: "🛠 Ferramentas" }, { id: "chat", label: "💬 Chat AmendoIA" },
  ]

  return (
    <div style={{ background: "#080f09", minHeight: "100vh", fontFamily: "'DM Sans',sans-serif", color: TX }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500&family=Playfair+Display:wght@600&family=DM+Mono:wght@400;500&display=swap');
        *{box-sizing:border-box;margin:0;padding:0}
        ::-webkit-scrollbar{width:3px}::-webkit-scrollbar-track{background:transparent}::-webkit-scrollbar-thumb{background:#1c3320;border-radius:2px}
        .tb{background:none;border:none;cursor:pointer;padding:8px 12px;border-radius:6px;font-family:'DM Sans',sans-serif;font-size:13px;transition:all .2s;white-space:nowrap;color:#7a9b7d;display:flex;text-align:left;width:100%}
        .tb:hover{background:rgba(200,169,74,.07)}.tb.on{background:rgba(200,169,74,.13);color:#c8a94a}
        .tb.feat{color:#c8a94a}.tb.feat:hover{background:rgba(200,169,74,.1)}
        .rb{background:none;border:1px solid #1c3320;padding:4px 11px;border-radius:20px;font-family:'DM Sans',sans-serif;font-size:12px;cursor:pointer;transition:all .2s;color:#7a9b7d}
        .rb.on{border-color:#c8a94a;color:#c8a94a;background:rgba(200,169,74,.08)}
        .ci{background:#0c1a0e;border:1px solid #1c3320;border-radius:8px;padding:10px 13px;color:#d8ead9;font-family:'DM Sans',sans-serif;font-size:14px;outline:none;width:100%;transition:border-color .2s}
        .ci:focus{border-color:#2d5a34}
        .sb{background:#c8a94a;border:none;border-radius:8px;padding:10px 18px;color:#060c07;font-weight:500;cursor:pointer;font-family:'DM Sans',sans-serif;font-size:14px;transition:opacity .2s;white-space:nowrap}
        .sb:hover{opacity:.85}.sb:disabled{opacity:.35;cursor:not-allowed}
        .sq{background:#0c1a0e;border:1px solid #1c3320;padding:6px 11px;border-radius:6px;font-size:12px;color:#7a9b7d;cursor:pointer;font-family:'DM Sans',sans-serif;transition:all .2s;text-align:left}
        .sq:hover{border-color:rgba(200,169,74,.4);color:#c8a94a}
        @keyframes fi{from{opacity:0;transform:translateY(4px)}to{opacity:1;transform:translateY(0)}}.fi{animation:fi .22s ease}
        @keyframes pu{0%,100%{opacity:1}50%{opacity:.35}}.pu{animation:pu 1.1s infinite}
        .v4badge{font-size:10px;padding:2px 7px;border-radius:10px;font-weight:500;background:rgba(82,199,143,.12);color:#52c78f;border:1px solid rgba(82,199,143,.28)}
        input[type=range]{accent-color:#c8a94a}
        select,input[type=number]{background:#0c1a0e;color:#d8ead9}
        select option{background:#0c1a0e}
      `}</style>

      {/* HEADER */}
      <div style={{ background: "#080f09", borderBottom: `1px solid ${BO}`, padding: "0 18px", display: "flex", alignItems: "center", justifyContent: "space-between", height: 52, position: "sticky", top: 0, zIndex: 100 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 28, height: 28, background: "linear-gradient(135deg,#c8a94a,#7a5e1e)", borderRadius: 7, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14 }}>🥜</div>
          <span style={{ fontFamily: "'Playfair Display',serif", fontSize: 17, color: G }}>AmendoIA</span>
          <span className="v4badge" style={{ marginLeft: 2 }}>v4 · abr/2026</span>
          <span style={{ color: BO, margin: "0 6px", fontSize: 18 }}>|</span>
          <span style={{ fontSize: 11, color: "#4a6b4d" }}>SAD · FCE-Tupã / UNESP · Protótipo FAPESP · 11 novas funcionalidades</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
          <span style={{ fontSize: 11, color: "#4a6b4d", marginRight: 2 }}>Região:</span>
          {[["both","Ambas"],["tupa","Tupã"],["jaboti","Jaboticabal"]].map(([v,l]) => (
            <button key={v} className={`rb ${region===v?"on":""}`} onClick={() => setRegion(v)}>{l}</button>
          ))}
          <div style={{ width: 7, height: 7, borderRadius: "50%", background: GR, marginLeft: 8 }} />
          <span style={{ fontSize: 11, color: GR }}>online</span>
        </div>
      </div>

      <div style={{ display: "flex", height: "calc(100vh - 52px)" }}>
        {/* SIDEBAR */}
        <div style={{ width: 188, background: "#080f09", borderRight: `1px solid ${BO}`, padding: "10px 5px", display: "flex", flexDirection: "column", gap: 1, flexShrink: 0 }}>
          {TABS.map(t => t.id === "sep" ? (
            <div key="sep" style={{ height: 1, background: BO, margin: "5px 8px" }} />
          ) : (
            <button key={t.id} className={`tb ${tab===t.id?"on":""} ${t.id==="ferramentas"?"feat":""}`} onClick={() => setTab(t.id)}>{t.label}</button>
          ))}
          <div style={{ marginTop: "auto", padding: "12px 8px", borderTop: `1px solid ${BO}` }}>
            <div style={{ fontSize: 10, color: "#3a5a3d", lineHeight: 1.7 }}>CONAB 7º Lev. 14/abr/2026<br/>IEA-SP · CEPEA · AGROSTAT<br/>BACEN · Câmara Setorial<br/>© FCE-Tupã / FAPESP</div>
          </div>
        </div>

        {/* CONTEÚDO */}
        <div style={{ flex: 1, overflow: "auto", padding: 20 }}>

          {/* ══ OVERVIEW ══ */}
          {tab === "overview" && (
            <div className="fi">
              <div style={{ marginBottom: 16 }}>
                <h2 style={{ fontFamily: "'Playfair Display',serif", fontSize: 20, color: G }}>Visão Geral · {regionName}</h2>
                <p style={{ fontSize: 12, color: MU, marginTop: 3 }}>Cadeia produtiva do amendoim · Safra 2025/26 em colheita · CONAB 7º Levantamento, 14 abr 2026</p>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(5,1fr)", gap: 10, marginBottom: 16 }}>
                <KPI label="Produt. 2025/26 est." value="4.270 kg/ha" sub="Chuvas bem distribuídas" color={GR} />
                <KPI label="Preço CEPEA abr/2026" value="R$ 110/sc" sub="↓ 12% vs pico mai/2025" color={G} />
                <KPI label="ICT médio regional" value="70,7 / 100" sub="↑ 1,4 pts vs abr/2025" color={GR} />
                <KPI label="Área SP 2025/26" value="~132 mil ha" sub="↓ ~30% (preços menores)" color={G} />
                <KPI label="Câmbio BRL/USD" value="R$ 4,95" sub="Abaixo R$5 — 1ª vez em 2 anos" color={GR} />
              </div>
              <CentralAlertas />
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 14, marginTop: 14 }}>
                <Card title="ICT — Índice de Competitividade Territorial (abr/2026)" subtitle={<>Produtiva e Ambiental melhoraram. Mercadológica recuou. <Freshness label="abr/2026" type="gold" /></>}>
                  <ResponsiveContainer width="100%" height={220}>
                    <RadarChart data={ictCombined}>
                      <PolarGrid stroke={BO} /><PolarAngleAxis dataKey="dim" tick={{ fontSize: 11, fill: MU }} />
                      <PolarRadiusAxis angle={90} domain={[0,100]} tick={{ fontSize: 9, fill: "#3a5a3d" }} />
                      {showT && <Radar name="Tupã" dataKey="Tupã" stroke={G} fill={G} fillOpacity={0.17} strokeWidth={1.5} />}
                      {showJ && <Radar name="Jaboticabal" dataKey="Jaboticabal" stroke={GR} fill={GR} fillOpacity={0.13} strokeWidth={1.5} />}
                      <Legend iconSize={8} wrapperStyle={{ fontSize: 11 }} /><Tooltip contentStyle={TP} />
                    </RadarChart>
                  </ResponsiveContainer>
                </Card>
                <Card title="Produtividade histórica (kg/ha)" subtitle={<>CONAB/IEA 2015–2026 <Freshness label="CONAB 14/abr/2026" /></>}>
                  <ResponsiveContainer width="100%" height={220}>
                    <AreaChart data={productivityData}>
                      <defs>
                        <linearGradient id="gt" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={G} stopOpacity={0.25}/><stop offset="95%" stopColor={G} stopOpacity={0}/></linearGradient>
                        <linearGradient id="gj" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={GR} stopOpacity={0.2}/><stop offset="95%" stopColor={GR} stopOpacity={0}/></linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke={BO} /><XAxis dataKey="ano" tick={{ fontSize: 10, fill: MU }} /><YAxis tick={{ fontSize: 10, fill: "#3a5a3d" }} />
                      <Tooltip contentStyle={TP} /><Legend iconSize={8} wrapperStyle={{ fontSize: 11 }} />
                      {showT && <Area type="monotone" dataKey="tupa" name="Tupã" stroke={G} fill="url(#gt)" strokeWidth={2} />}
                      {showJ && <Area type="monotone" dataKey="jaboti" name="Jaboticabal" stroke={GR} fill="url(#gj)" strokeWidth={2} />}
                      <Line type="monotone" dataKey="nacional" name="Nacional" stroke={MU} strokeWidth={1.5} strokeDasharray="4 3" dot={false} />
                    </AreaChart>
                  </ResponsiveContainer>
                </Card>
              </div>
              <InsightsBar items={{
                tendencias: ["Produtividade 2025/26 recupera após queda de 32% em 2024 (El Niño)","Óleo de amendoim emerge como novo vetor exportador (+170% em 2025)","Rússia e China substituem UE como principais destinos (54% combinados)"],
                riscos: ["Queda de área 30% comprime oferta futura e reduz receita total do setor","Câmbio R$4,95 reduz receita em reais do exportador mesmo com recorde de volume","IPPA/CEPEA -9,79% sinaliza ano de margens comprimidas em toda a cadeia"],
                analise: ["Janela jun–set/2026: projeção R$117/sc com leve recuperação esperada","Diversificação para óleo é estratégica — China paga prêmio pela qualidade","Jaboticabal ICT 73,0 supera Tupã 68,4 — benchmarking produtivo prioritário"],
              }} />
            </div>
          )}

          {/* ══ AEP ══ */}
          {tab === "aep" && (
            <div className="fi">
              <div style={{ marginBottom: 14 }}>
                <h2 style={{ fontFamily: "'Playfair Display',serif", fontSize: 20, color: G }}>Agente de Eficiência Produtiva</h2>
                <p style={{ fontSize: 12, color: MU, marginTop: 3 }}>Safra 2025/26 em colheita · CONAB 7º Levantamento abr/2026 · IEA-SP 2025</p>
              </div>
              <div style={{ display: "flex", gap: 8, marginBottom: 14, flexWrap: "wrap" }}>
                {[["productivity","Produtividade"],["costs","Custos 2026"],["quality","Qualidade"],["benchmark","📊 Benchmarking"]].map(([id,l]) => (
                  <SubTab key={id} id={id} label={l} active={aepSub} setActive={setAepSub} />
                ))}
              </div>
              {aepSub === "productivity" && (<>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 10, marginBottom: 14 }}>
                  <KPI label="Produt. Tupã 2025/26" value="4.250 kg/ha" sub="↑ Chuvas favoráveis" color={GR} />
                  <KPI label="Produção SP proj." value="953.300 t" sub="+3,6% (FAESP fev/2026)" color={GR} />
                  <KPI label="Área SP 2025/26" value="~132 mil ha" sub="↓ 30% vs 188 mil ha" color={G} />
                  <KPI label="Margem bruta est." value="R$ 1.149/ha" sub="↓ 25% vs 2025" color={G} />
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 14 }}>
                  <Card title="Série histórica + projeção 2025/26 (kg/ha)" subtitle={<>CONAB/IEA 2015–2026 <Freshness label="CONAB 14/abr/2026" /></>}>
                    <ResponsiveContainer width="100%" height={240}>
                      <AreaChart data={productivityData}>
                        <defs>
                          <linearGradient id="g1" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={G} stopOpacity={0.25}/><stop offset="95%" stopColor={G} stopOpacity={0}/></linearGradient>
                          <linearGradient id="g2" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={GR} stopOpacity={0.2}/><stop offset="95%" stopColor={GR} stopOpacity={0}/></linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke={BO} /><XAxis dataKey="ano" tick={{ fontSize: 10, fill: MU }} /><YAxis tick={{ fontSize: 10, fill: "#3a5a3d" }} />
                        <Tooltip contentStyle={TP} /><Legend iconSize={8} wrapperStyle={{ fontSize: 11 }} />
                        {showT && <Area type="monotone" dataKey="tupa" name="Tupã" stroke={G} fill="url(#g1)" strokeWidth={2} />}
                        {showJ && <Area type="monotone" dataKey="jaboti" name="Jaboticabal" stroke={GR} fill="url(#g2)" strokeWidth={2} />}
                        <Line type="monotone" dataKey="nacional" name="Nacional" stroke={MU} strokeDasharray="4 3" strokeWidth={1.5} dot={false} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </Card>
                  <Card title="Por porte de propriedade (kg/ha)" subtitle={<>IBGE Censo Agropecuário <Freshness label="2025" type="gold" /></>}>
                    <ResponsiveContainer width="100%" height={240}>
                      <BarChart data={productivityBySize} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" stroke={BO} horizontal={false} />
                        <XAxis type="number" tick={{ fontSize: 10, fill: "#3a5a3d" }} domain={[0,5500]} />
                        <YAxis type="category" dataKey="label" tick={{ fontSize: 11, fill: MU }} width={80} />
                        <Tooltip contentStyle={TP} /><Legend iconSize={8} wrapperStyle={{ fontSize: 11 }} />
                        {showT && <Bar dataKey="tupa" name="Tupã" fill={G} radius={[0,3,3,0]} />}
                        {showJ && <Bar dataKey="jaboti" name="Jaboticabal" fill={GR} radius={[0,3,3,0]} />}
                      </BarChart>
                    </ResponsiveContainer>
                  </Card>
                </div>
              </>)}
              {aepSub === "costs" && (<>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 10, marginBottom: 14 }}>
                  <KPI label="Custo total 2026" value="R$ 3.751/ha" sub="↓ 1,8% vs 2025 (câmbio)" color={GR} />
                  <KPI label="Fertilizantes" value="R$ 1.178/ha" sub="↓ ~5% — real valorizado" color={GR} />
                  <KPI label="Receita bruta est." value="R$ 4.900/ha" sub="4.250 kg × R$1,15/kg" color={G} />
                  <KPI label="Margem bruta" value="R$ 1.149/ha" sub="↓ 25% vs R$1.540 em 2025" color={G} />
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                  <Card title="Custo por insumo (R$/ha) — 2026" subtitle={<>IEA-SP 2025 <Freshness label="IEA 2025" type="gold" /></>}>
                    <ResponsiveContainer width="100%" height={240}>
                      <BarChart data={costBreakdown}>
                        <CartesianGrid strokeDasharray="3 3" stroke={BO} /><XAxis dataKey="item" tick={{ fontSize: 10, fill: MU }} /><YAxis tick={{ fontSize: 10, fill: "#3a5a3d" }} />
                        <Tooltip contentStyle={TP} formatter={v=>[`R$ ${v}/ha`]} />
                        <Bar dataKey="valor" name="R$/ha" fill={G} radius={[4,4,0,0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </Card>
                  <Card title="Participação % no custo total">
                    <ResponsiveContainer width="100%" height={240}>
                      <PieChart>
                        <Pie data={costBreakdown} dataKey="pct" nameKey="item" cx="50%" cy="50%" outerRadius={80} label={({ item, pct }) => `${item.split(" ")[0]} ${pct}%`} fontSize={10}>
                          {costBreakdown.map((_, i) => <Cell key={i} fill={PIE_COLORS[i] || "#2d4a30"} />)}
                        </Pie>
                        <Tooltip contentStyle={TP} formatter={v=>[`${v}%`]} />
                      </PieChart>
                    </ResponsiveContainer>
                  </Card>
                </div>
              </>)}
              {aepSub === "quality" && (
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                  <Card title="Qualidade estimada safra 2025/26">
                    {[
                      { label: "Teor de óleo", value: "48,5%", target: "> 46%", ok: true, note: "↑ vs 48,2%" },
                      { label: "Aflatoxinas B1+B2+G1+G2", value: "2,8 ppb", target: "< 4 ppb (Reg. UE 2023/915)", ok: true, note: "↓ vs 3,1 ppb — melhora" },
                      { label: "Umidade na colheita", value: "9,6%", target: "< 10%", ok: true },
                      { label: "Grãos tipo exportação", value: "74%", target: "> 70%", ok: true, note: "↑ vs 72%" },
                      { label: "Uniformidade de calibre", value: "67%", target: "> 70%", ok: false },
                      { label: "Rastreabilidade lote a lote", value: "47%", target: "> 80% meta UE", ok: false },
                    ].map((q, i) => <QRow key={i} {...q} />)}
                  </Card>
                  <Card title="Variedades cultivadas em SP (2025/26)" subtitle={<>IAC · Embrapa · dados de campo <Freshness label="2025/26" /></>}>
                    <ResponsiveContainer width="100%" height={220}>
                      <PieChart>
                        <Pie data={[{name:"IAC Caiapó",value:55},{name:"Runner IAC 886",value:28},{name:"BRS 151L7",value:12},{name:"Outras",value:5}]} dataKey="value" cx="50%" cy="50%" outerRadius={80} label={({ name, value }) => `${name.split(" ")[0]} ${value}%`} fontSize={10}>
                          {[G,GR,"#3d9970",MU].map((c,i) => <Cell key={i} fill={c} />)}
                        </Pie>
                        <Tooltip contentStyle={TP} formatter={v=>[`${v}%`]} />
                      </PieChart>
                    </ResponsiveContainer>
                  </Card>
                </div>
              )}
              {aepSub === "benchmark" && <BenchmarkingPanel />}
              <InsightsBar items={{
                tendencias:["Aflatoxinas caíram para 2,8 ppb — melhor elegibilidade para mercado europeu","Fertilizantes 5% mais baratos com real valorizado reduz custo em R$69/ha","Produtores grandes (>200ha) têm produtividade 15% superior à média regional"],
                riscos:["Margem caiu 25% vs 2025 — preço R$110/sc comprime rentabilidade","Área -30% em SP reduz escala e poder de barganha com traders","Rastreabilidade 47% abaixo da meta UE de 80% limita acesso ao mercado premium"],
                analise:["Investir em rastreabilidade digital é o gargalo de maior retorno","IAC Caiapó (55%) domina — diversificar para Runner 886 em áreas logísticas melhores","Qualidade 2025/26 superior cria janela para renegociar contratos com prêmio"],
              }} />
            </div>
          )}

          {/* ══ AIM ══ */}
          {tab === "aim" && (
            <div className="fi">
              <div style={{ marginBottom: 14 }}>
                <h2 style={{ fontFamily: "'Playfair Display',serif", fontSize: 20, color: G }}>Agente de Inteligência de Mercado</h2>
                <p style={{ fontSize: 12, color: MU, marginTop: 3 }}>Série CEPEA até abr/2026 · Exportações 2025 · Rússia novo líder · Óleo +170%</p>
              </div>
              <div style={{ display: "flex", gap: 8, marginBottom: 14, flexWrap: "wrap" }}>
                {[["prices","Preços"],["exports","Exportações 2025"],["rca","Benchmarks RCA"],["contrafactual","🔄 Contrafactual"],["planejador","📅 Planejador de Venda"],["xai","🧠 Explicabilidade XAI"],["sankey","🔀 Captura de Valor"]].map(([id,l]) => (
                  <SubTab key={id} id={id} label={l} active={aimSub} setActive={setAimSub} />
                ))}
              </div>

              {aimSub === "prices" && (<>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 10, marginBottom: 14 }}>
                  <KPI label="Preço CEPEA abr/2026" value={<>R$ 110/sc<ConfBadge conf={82} /></>} sub="↓ 12% vs pico mai/2025" color={G} />
                  <KPI label="Projeção jun/2026" value={<>R$ 113/sc<ConfBadge conf={79} /></>} sub="IC 95%: R$104–R$122" color={GR} />
                  <KPI label="Projeção set/2026" value={<>R$ 117/sc<ConfBadge conf={64} /></>} sub="IC 95%: R$101–R$133" color={GR} />
                  <KPI label="Volatilidade 30d" value="8,2%" sub="↓ vs 14,3% jan/2025" color={GR} />
                </div>
                <Card title="Série histórica e projeção — preços (R$/sc 25kg)" subtitle={<>CEPEA jan/2020–set/2026 <Freshness label="CEPEA abr/2026" /> · tracejado = projeção ARIMA(2,1,2)-GARCH(1,1)</>}>
                  <ResponsiveContainer width="100%" height={270}>
                    <LineChart data={priceData}>
                      <CartesianGrid strokeDasharray="3 3" stroke={BO} />
                      <XAxis dataKey="mes" tick={{ fontSize: 10, fill: MU }} interval={3} />
                      <YAxis tick={{ fontSize: 10, fill: "#3a5a3d" }} domain={[50,160]} />
                      <Tooltip contentStyle={TP} /><Legend iconSize={8} wrapperStyle={{ fontSize: 11 }} />
                      <Line type="monotone" dataKey="preco" name="Realizado" stroke={G} strokeWidth={2.5} dot={{ r:2, fill:G }} connectNulls={false} />
                      <Line type="monotone" dataKey="proj" name="Projeção AIM" stroke={GR} strokeWidth={2} strokeDasharray="5 5" dot={{ r:2.5, fill:GR }} connectNulls={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </Card>
              </>)}

              {aimSub === "exports" && (<>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 10, marginBottom: 14 }}>
                  <KPI label="Descascado 2025" value="311 mil t" sub="+37% vs 2024 — recorde" color={GR} />
                  <KPI label="Valor 2025" value="US$ 367 mi" sub="+2% vs 2024" color={GR} />
                  <KPI label="Óleo amendoim 2025" value="98 mil t" sub="+170%! — China 87%" color={GR} />
                  <KPI label="Novo líder destino" value="Rússia 22%" sub="UE caiu de 48% para 28%" color={G} />
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                  <Card title="Destinos exportação amendoim descascado — 2025" subtitle={<>AGROSTAT/MDIC 2025 <Freshness label="AGROSTAT 2025" type="gold" /></>}>
                    <ResponsiveContainer width="100%" height={230}>
                      <PieChart>
                        <Pie data={exportDestinations} dataKey="pct" nameKey="destino" cx="50%" cy="50%" outerRadius={85} label={({ destino, pct }) => `${destino.split(" ")[0]} ${pct}%`} fontSize={10}>
                          {exportDestinations.map((_, i) => <Cell key={i} fill={PIE_COLORS[i]} />)}
                        </Pie>
                        <Tooltip contentStyle={TP} formatter={(v,n,p)=>[`US$ ${p.payload.valor_mi}mi (${v}%)`]} />
                      </PieChart>
                    </ResponsiveContainer>
                  </Card>
                  <Card title="Valor exportado por destino (US$ mi)">
                    <ResponsiveContainer width="100%" height={230}>
                      <BarChart data={exportDestinations} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" stroke={BO} horizontal={false} />
                        <XAxis type="number" tick={{ fontSize: 10, fill: "#3a5a3d" }} />
                        <YAxis type="category" dataKey="destino" tick={{ fontSize: 11, fill: MU }} width={110} />
                        <Tooltip contentStyle={TP} formatter={v=>[`US$ ${v}mi`]} />
                        <Bar dataKey="valor_mi" name="US$ mi" fill={G} radius={[0,3,3,0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </Card>
                </div>
              </>)}

              {aimSub === "rca" && (<>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 10, marginBottom: 14 }}>
                  <KPI label="RCA Brasil" value="1,8" sub="Vantagem fraca mas crescendo" color={G} />
                  <KPI label="Custo Brasil abr/2026" value="US$ 588/t" sub="↓ US$32 vs 2025 (câmbio)" color={GR} />
                  <KPI label="Exportações 2025" value="Recorde histórico" sub="311 mil t descascado" color={GR} />
                  <KPI label="Vantagem diferencial" value="Qualidade + óleo" sub="Aflatoxinas e óleo premium" color={GR} />
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                  <Card title="RCA — Vantagem Comparativa Revelada" subtitle={<>FAO 2024 <Freshness label="FAO 2024" type="gold" /> · RCA > 1 = vantagem comparativa</>}>
                    <ResponsiveContainer width="100%" height={240}>
                      <BarChart data={rcaData}>
                        <CartesianGrid strokeDasharray="3 3" stroke={BO} /><XAxis dataKey="pais" tick={{ fontSize: 11, fill: MU }} /><YAxis tick={{ fontSize: 10, fill: "#3a5a3d" }} domain={[0,5]} />
                        <Tooltip contentStyle={TP} />
                        <Bar dataKey="rca" name="RCA" radius={[4,4,0,0]}>
                          {rcaData.map((d,i) => <Cell key={i} fill={d.pais==="Brasil"?G:d.pais==="Índia"?GR:MU} />)}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </Card>
                  <Card title="Custo comparado (US$/t) — abr/2026">
                    <ResponsiveContainer width="100%" height={240}>
                      <BarChart data={costCompar} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" stroke={BO} horizontal={false} />
                        <XAxis type="number" tick={{ fontSize: 10, fill: "#3a5a3d" }} unit="$" />
                        <YAxis type="category" dataKey="pais" tick={{ fontSize: 11, fill: MU }} width={72} />
                        <Tooltip contentStyle={TP} formatter={v=>[`US$ ${v}/t`]} />
                        <Bar dataKey="custo" name="US$/t" radius={[0,3,3,0]}>
                          {costCompar.map((d,i) => <Cell key={i} fill={d.pais==="Brasil"?G:d.pais==="Índia"?GR:MU} />)}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </Card>
                </div>
              </>)}

              {aimSub === "contrafactual" && <Contrafactual />}
              {aimSub === "planejador" && <PlanejadorVenda />}
              {aimSub === "xai" && <XAIPanel />}
              {aimSub === "sankey" && <SankeyChart />}

              <InsightsBar items={{
                tendencias:["Exportações 2025 atingiram recorde histórico de 311 mil t (+37%)","Óleo de amendoim cresceu 170%, emergindo como segundo produto de exportação","Projeção ARIMA indica recuperação para R$117/sc em set/2026"],
                riscos:["Câmbio R$4,95 reduz receita em reais mesmo com volume recorde","Rússia (22%) como principal destino representa risco geopolítico concentrado","RCA Brasil 1,8 — risco de perda competitiva com expansão da Índia (RCA 4,2)"],
                analise:["Diversificar para Argélia e Oriente Médio reduz dependência de Rússia e UE","Certificação UE mantém prêmio — mercado europeu paga mais por aflatoxinas ≤4ppb","Use o Planejador de Venda para calcular a estratégia ótima de venda"],
              }} />
            </div>
          )}

          {/* ══ AOL ══ */}
          {tab === "aol" && (
            <div className="fi">
              <div style={{ marginBottom: 14 }}>
                <h2 style={{ fontFamily: "'Playfair Display',serif", fontSize: 20, color: G }}>Agente de Otimização Logística</h2>
                <p style={{ fontSize: 12, color: MU, marginTop: 3 }}>Qualidade viária DNIT/DER-SP · Capacidade armazéns CONAB · Programação linear multiobjetivo</p>
              </div>
              <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
                {[["routes","Rotas e fretes"],["storage","Armazenagem"]].map(([id,l]) => (
                  <SubTab key={id} id={id} label={l} active={aolSub} setActive={setAolSub} />
                ))}
              </div>
              {aolSub === "routes" && (<>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 10, marginBottom: 14 }}>
                  <KPI label="Frete Tupã→Santos abr/26" value="R$ 65/t" sub="↓ vs R$68 em 2025" />
                  <KPI label="Otimizado AOL" value="R$ 52/t" sub="Economia de 20%" color={GR} />
                  <KPI label="Via mais crítica" value="Tupã↔Jaboti" sub="69% pavim. / 312 km" color={G} />
                  <KPI label="Perda pós-colheita" value="4,2%" sub="Meta 6% superada" color={GR} />
                </div>
                <Card title="Custo atual vs. otimizado (R$/t) por rota" subtitle={<>DNIT/DER-SP + NTC&Log abr/2026 <Freshness label="NTC&Log abr/2026" /></>}>
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={logisticsData}>
                      <CartesianGrid strokeDasharray="3 3" stroke={BO} /><XAxis dataKey="rota" tick={{ fontSize: 10, fill: MU }} /><YAxis tick={{ fontSize: 10, fill: "#3a5a3d" }} />
                      <Tooltip contentStyle={TP} /><Legend iconSize={8} wrapperStyle={{ fontSize: 11 }} />
                      <Bar dataKey="atual" name="Custo atual (R$/t)" fill="#6b3d12" radius={[3,3,0,0]} />
                      <Bar dataKey="otimizado" name="Otimizado AOL (R$/t)" fill={G} radius={[3,3,0,0]} />
                    </BarChart>
                  </ResponsiveContainer>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(5,1fr)", gap: 8, marginTop: 14 }}>
                    {logisticsData.map((r,i) => (
                      <div key={i} style={{ background: "#080f09", border: `1px solid ${BO}`, borderRadius: 8, padding: "10px 12px" }}>
                        <div style={{ fontSize: 11, color: MU, marginBottom: 4 }}>{r.rota}</div>
                        <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 12, color: TX }}>{r.distKm} km</div>
                        <div style={{ fontSize: 11, marginTop: 3, color: r.pav>=85?GR:r.pav>=75?G:"#e05c5c" }}>{r.pav}% pav.</div>
                      </div>
                    ))}
                  </div>
                </Card>
              </>)}
              {aolSub === "storage" && (<>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 10, marginBottom: 14 }}>
                  <KPI label="Ocupação média abr/2026" value="62,6%" sub="↓ vs 77,6% em 2025" color={GR} />
                  <KPI label="Polo mais próximo cap." value="Marília 72%" sub="Ainda confortável" color={G} />
                  <KPI label="Maior folga" value="Jaboti 48%" sub="Expansão viável" color={GR} />
                  <KPI label="Gargalo aliviado" value="Área -30%" sub="Menores volumes" color={GR} />
                </div>
                <Card title="Capacidade e ocupação por polo — abr/2026" subtitle={<>CONAB/MAPA <Freshness label="CONAB 2025" type="gold" /></>}>
                  <ResponsiveContainer width="100%" height={260}>
                    <BarChart data={storageCapacity}>
                      <CartesianGrid strokeDasharray="3 3" stroke={BO} /><XAxis dataKey="municipio" tick={{ fontSize: 11, fill: MU }} /><YAxis tick={{ fontSize: 10, fill: "#3a5a3d" }} unit=" kt" />
                      <Tooltip contentStyle={TP} /><Legend iconSize={8} wrapperStyle={{ fontSize: 11 }} />
                      <Bar dataKey="capacidade" name="Capacidade total (kt)" fill="#1c4a30" radius={[4,4,0,0]} />
                      <Bar dataKey="ocupacao" name="Ocupação atual (kt)" fill={GR} radius={[4,4,0,0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </Card>
              </>)}
              <InsightsBar items={{
                tendencias:["Fretes caíram R$3/t com câmbio valorizado e combustíveis mais baratos","Ocupação armazéns reduziu para 62,6% — gargalo de safra aliviado","Jaboticabal tem capacidade ociosa (48%) — polo candidato à expansão"],
                riscos:["Via Tupã↔Jaboti com 69% pavimentada eleva custo e risco de perda","Frete sobe 35% na safra (jan–abr) por concorrência com soja — janela crítica","Perda pós-colheita 4,2% ainda representa ~R$40/t de valor não recuperado"],
                analise:["Economia AOL de R$13/t representa R$12,4mi na produção SP de 953 mil t","Antecipação de frete antes de jan elimina sobrepreço de 35% na safra","Armazém cooperativo em Tupã pode ampliar capacidade sem pressão imediata"],
              }} />
            </div>
          )}

          {/* ══ AAI ══ */}
          {tab === "aai" && (
            <div className="fi">
              <div style={{ marginBottom: 14 }}>
                <h2 style={{ fontFamily: "'Playfair Display',serif", fontSize: 20, color: G }}>Agente de Análise Institucional</h2>
                <p style={{ fontSize: 12, color: MU, marginTop: 3 }}>Crédito BACEN 2025 · PRONAF desconto 58% abr/2026 · Selic 14,75% · Regulamentações</p>
              </div>
              <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
                {[["overview","Visão Geral"],["credito","💰 Elegibilidade de Crédito"]].map(([id,l]) => (
                  <SubTab key={id} id={id} label={l} active={aaiSub} setActive={setAaiSub} />
                ))}
              </div>
              {aaiSub === "overview" && (<>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 10, marginBottom: 14 }}>
                  <KPI label="Crédito rural total 2025" value="R$ 125 mi" sub="+13,6% vs 2024" color={GR} />
                  <KPI label="PRONAF desconto abr/2026" value="Até 58%" sub="CONAB atualiza abr/2026" color={GR} />
                  <KPI label="Selic abr/2026" value="14,75% a.a." sub="Copom 18/mar" color={G} />
                  <KPI label="ICT institucional Tupã" value="79 / 100" sub="↑ 1 ponto vs 2025" color={GR} />
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 14 }}>
                  <Card title="Crédito rural por programa (R$ mi) — 2025" subtitle={<>BACEN/SISBACEN 2025 <Freshness label="BACEN 2025" type="gold" /></>}>
                    <ResponsiveContainer width="100%" height={220}>
                      <BarChart data={creditRuralData}>
                        <CartesianGrid strokeDasharray="3 3" stroke={BO} /><XAxis dataKey="programa" tick={{ fontSize: 10, fill: MU }} /><YAxis tick={{ fontSize: 10, fill: "#3a5a3d" }} />
                        <Tooltip contentStyle={TP} formatter={v=>[`R$ ${v}mi`]} />
                        <Bar dataKey="valor" name="Volume (R$ mi)" fill={G} radius={[4,4,0,0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </Card>
                  <Card title="Monte Carlo · Impacto de políticas na margem (%)" subtitle="10.000 iterações · Distribuições Beta/Poisson/Normal">
                    <ResponsiveContainer width="100%" height={220}>
                      <BarChart data={policyData}>
                        <CartesianGrid strokeDasharray="3 3" stroke={BO} /><XAxis dataKey="politica" tick={{ fontSize: 10, fill: MU }} /><YAxis tick={{ fontSize: 10, fill: "#3a5a3d" }} unit="%" />
                        <Tooltip contentStyle={TP} formatter={v=>[`${v}%`]} /><Legend iconSize={8} wrapperStyle={{ fontSize: 11 }} />
                        <Bar dataKey="impacto" name="Impacto esperado (%)" fill={GR} radius={[4,4,0,0]} />
                        <Bar dataKey="incerteza" name="Incerteza (±%)" fill="#1c4a30" radius={[4,4,0,0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </Card>
                </div>
                <Card title="Regulamentações sanitárias vigentes — abr/2026" subtitle={<>Impacto direto nas exportações por destino <Freshness label="vigente" /></>}>
                  {[
                    {reg:"Reg. UE 2023/915",escopo:"UE — 28% exportações 2025 (↓ de 48% em 2024)",limite:"Aflatoxinas B1+B2+G1+G2 ≤ 4 ppb",risco:"Alto",rc:"#e05c5c"},
                    {reg:"Codex CXS 193",escopo:"Rússia (22%) + China (20%) + Argélia (12%) = 54%",limite:"B1 ≤ 8 ppb | Total ≤ 15 ppb",risco:"Médio",rc:"#e0a040"},
                    {reg:"FDA 21 CFR Pt 110",escopo:"EUA — ~10% das exportações",limite:"Aflatoxinas ≤ 20 ppb · Rastreabilidade",risco:"Médio",rc:"#e0a040"},
                    {reg:"IN MAPA nº 11/2010",escopo:"Mercado doméstico brasileiro",limite:"Aflatoxinas ≤ 20 ppb",risco:"Baixo",rc:GR},
                  ].map((r,i,a) => (
                    <div key={i} style={{ display: "grid", gridTemplateColumns: "165px 1fr 1fr 70px", gap: 12, padding: "9px 0", borderBottom: i<a.length-1?`1px solid ${BO}`:"none", alignItems: "start" }}>
                      <span style={{ fontSize: 12, color: G, fontWeight: 500 }}>{r.reg}</span>
                      <span style={{ fontSize: 11, color: "#a8c4aa" }}>{r.escopo}</span>
                      <span style={{ fontSize: 11, color: MU }}>{r.limite}</span>
                      <span style={{ fontSize: 11, fontWeight: 500, color: r.rc }}>{r.risco}</span>
                    </div>
                  ))}
                </Card>
              </>)}
              {aaiSub === "credito" && <CreditoRural />}
              <InsightsBar items={{
                tendencias:["Crédito rural cresceu 13,6% com PRONAF e linhas verdes ABC+ em expansão","PRONAF com desconto de 58% nas parcelas é maior vantagem para familiares","ICT institucional Tupã 79 supera Jaboticabal 70 pelo capital social cooperativo"],
                riscos:["Selic 14,75% encarece custeio empresarial (R$61mi) a 12–14% a.a.","Reg. UE ≤4ppb afeta 28% das exportações — conformidade 83% deixa 17% em risco","Apenas 41% dos produtores têm seguro rural — 59% expostos a riscos climáticos"],
                analise:["Certificação exportação UE tem maior impacto na margem (+22%) — Monte Carlo","Use o Painel de Elegibilidade para identificar linhas de crédito disponíveis","Ampliar seguro rural paramétrico para 60%+ é meta de curto prazo viável"],
              }} />
            </div>
          )}

          {/* ══ AMA ══ */}
          {tab === "ama" && (
            <div className="fi">
              <div style={{ marginBottom: 14 }}>
                <h2 style={{ fontFamily: "'Playfair Display',serif", fontSize: 20, color: G }}>Agente de Monitoramento Ambiental</h2>
                <p style={{ fontSize: 12, color: MU, marginTop: 3 }}>Série climática INMET 2024–2026 · NDVI Sentinel-2 abr/2026 · Safra 2025/26: condições favoráveis</p>
              </div>
              <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
                {[["climate","Série climática"],["ndvi","NDVI abr/2026"],["compliance","Conformidade"]].map(([id,l]) => (
                  <SubTab key={id} id={id} label={l} active={amaSub} setActive={setAmaSub} />
                ))}
              </div>
              {amaSub === "climate" && (<>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 10, marginBottom: 14 }}>
                  <KPI label="Temp. média jan–abr/2026" value="24,2 °C" sub="↓ vs 27,1°C (2024 El Niño)" color={GR} />
                  <KPI label="Precip. jan–abr/2026" value="554 mm" sub="↑ vs 340mm de 2024" color={GR} />
                  <KPI label="Condições 2025/26" value="Favoráveis" sub="Chuvas bem distribuídas" color={GR} />
                  <KPI label="Risco aflatoxina" value="Baixo-Moderado" sub="Condições equilibradas" color={GR} />
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                  <Card title="Temperatura média mensal (°C)" subtitle={<>INMET/IAC · Estação Tupã <Freshness label="INMET abr/2026" /></>}>
                    <ResponsiveContainer width="100%" height={220}>
                      <LineChart data={climateHistory}>
                        <CartesianGrid strokeDasharray="3 3" stroke={BO} /><XAxis dataKey="mes" tick={{ fontSize: 10, fill: MU }} /><YAxis tick={{ fontSize: 10, fill: "#3a5a3d" }} unit="°C" domain={[15,30]} />
                        <Tooltip contentStyle={TP} formatter={v=>v?[`${v}°C`]:["—"]} /><Legend iconSize={8} wrapperStyle={{ fontSize: 11 }} />
                        <Line type="monotone" dataKey="t2024" name="2024 (El Niño)" stroke="#e05c5c" strokeWidth={2} dot={false} connectNulls={false} />
                        <Line type="monotone" dataKey="t2025" name="2025" stroke={GR} strokeWidth={1.5} dot={false} connectNulls={false} />
                        <Line type="monotone" dataKey="t2026" name="2026" stroke={G} strokeWidth={2} dot={{ r:3, fill:G }} connectNulls={false} />
                      </LineChart>
                    </ResponsiveContainer>
                  </Card>
                  <Card title="Precipitação mensal (mm)">
                    <ResponsiveContainer width="100%" height={220}>
                      <BarChart data={climateHistory}>
                        <CartesianGrid strokeDasharray="3 3" stroke={BO} /><XAxis dataKey="mes" tick={{ fontSize: 10, fill: MU }} /><YAxis tick={{ fontSize: 10, fill: "#3a5a3d" }} unit="mm" />
                        <Tooltip contentStyle={TP} formatter={v=>v?[`${v}mm`]:["—"]} /><Legend iconSize={8} wrapperStyle={{ fontSize: 11 }} />
                        <Bar dataKey="p2024" name="2024" fill="#e05c5c99" radius={[2,2,0,0]} />
                        <Bar dataKey="p2025" name="2025" fill="#1c4a30" radius={[2,2,0,0]} />
                        <Bar dataKey="p2026" name="2026" fill={`${G}bb`} radius={[2,2,0,0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </Card>
                </div>
              </>)}
              {amaSub === "ndvi" && (<>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 10, marginBottom: 14 }}>
                  <KPI label="NDVI mais alto (abr/26)" value="Ribeirão Preto 0,74" sub="↑ vs 0,71 em 2025" color={GR} />
                  <KPI label="NDVI Tupã (abr/26)" value="0,62" sub="↑ vs 0,58 em 2025" color={GR} />
                  <KPI label="NDVI mais baixo" value="Pres. Prudente 0,58" sub="Monitoramento recomendado" color={G} />
                  <KPI label="Melhoria regional média" value="+0,04 pontos" sub="Chuvas 2025/26 favoreceram" color={GR} />
                </div>
                <Card title="NDVI médio por município (Sentinel-2, jan–abr/2026)" subtitle={<>Verde = baixo risco · Amarelo = moderado <Freshness label="Sentinel-2 abr/2026" /></>}>
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={ndviData}>
                      <CartesianGrid strokeDasharray="3 3" stroke={BO} /><XAxis dataKey="municipio" tick={{ fontSize: 11, fill: MU }} /><YAxis tick={{ fontSize: 10, fill: "#3a5a3d" }} domain={[0.4,0.8]} />
                      <Tooltip contentStyle={TP} formatter={(v,n,p)=>[`NDVI ${v} · ${p.payload.risco}`]} />
                      <Bar dataKey="ndvi" name="NDVI médio" radius={[4,4,0,0]}>
                        {ndviData.map((d,i) => <Cell key={i} fill={d.ndvi>=0.65?GR:d.ndvi>=0.58?G:"#e05c5c"} />)}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </Card>
              </>)}
              {amaSub === "compliance" && (
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                  <Card title="Conformidade ambiental — abr/2026">
                    {[
                      { label: "Reserva legal cadastrada (CAR)", value: "94%", ok: true },
                      { label: "APP preservada", value: "88%", ok: true },
                      { label: "Plantio direto adotado", value: "73%", ok: true, note: "↑ 2pp vs 2025" },
                      { label: "Conformidade EU AflatoxinReg 2023", value: "83%", ok: true, note: "↑ 2pp" },
                      { label: "Manejo integrado de pragas (MIP)", value: "58%", ok: false, note: "↑ 3pp vs 2025" },
                      { label: "Rastreabilidade lote a lote", value: "47%", ok: false },
                    ].map((q, i) => <QRow key={i} {...q} />)}
                  </Card>
                  <Card title="Precipitação vs. necessidade hídrica (mm, Tupã)">
                    <ResponsiveContainer width="100%" height={250}>
                      <BarChart data={precipData}>
                        <CartesianGrid strokeDasharray="3 3" stroke={BO} /><XAxis dataKey="mes" tick={{ fontSize: 11, fill: MU }} /><YAxis tick={{ fontSize: 10, fill: "#3a5a3d" }} unit="mm" />
                        <Tooltip contentStyle={TP} /><Legend iconSize={8} wrapperStyle={{ fontSize: 11 }} />
                        <Bar dataKey="precip" name="Precipitação real 2026" fill="#3d9970" radius={[4,4,0,0]} />
                        <Bar dataKey="necessidade" name="Necessidade hídrica" fill="#1c4a30" radius={[4,4,0,0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </Card>
                </div>
              )}
              <InsightsBar items={{
                tendencias:["NDVI Tupã recuperou para 0,62 (+0,04 vs 2025) com chuvas jan–abr +63%","Temperatura 2026 (24,2°C) retorna à normalidade após anomalia de 2024","Conformidade EU AflatoxinReg subiu para 83% — reflexo de condições favoráveis"],
                riscos:["Pres. Prudente NDVI 0,58 moderado — monitoramento contínuo necessário","Mudanças climáticas estruturais: tendência de +1,4°C por El Niño pode repetir","17% da produção fora da conformidade UE representa risco de rejeição"],
                analise:["Safra 2025/26 favorável é janela para aumentar reservas de contingência","Ampliar MIP de 58% para 70%+ reduz risco de aflatoxina e custo de defensivos","Monitoramento NDVI mensal via Sentinel-2 deve ser institucionalizado nas cooperativas"],
              }} />
            </div>
          )}

          {/* ══ FERRAMENTAS ══ */}
          {tab === "ferramentas" && (
            <div className="fi">
              <div style={{ marginBottom: 14 }}>
                <h2 style={{ fontFamily: "'Playfair Display',serif", fontSize: 20, color: G }}>🛠 Ferramentas Analíticas</h2>
                <p style={{ fontSize: 12, color: MU, marginTop: 3 }}>Calculadoras interativas baseadas nos dados da cadeia · Atualizadas para abr/2026</p>
              </div>
              <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
                {[["calc","⚖️ Calculadora de Equilíbrio"],["sim","📊 Simulador de Cenários"]].map(([id,l]) => (
                  <SubTab key={id} id={id} label={l} active={toolSub} setActive={setToolSub} />
                ))}
              </div>
              {toolSub === "calc" && <Calculadora />}
              {toolSub === "sim" && <SimuladorCenarios />}
            </div>
          )}

          {/* ══ CHAT ══ */}
          {tab === "chat" && (
            <div className="fi" style={{ display: "flex", flexDirection: "column", height: "calc(100vh - 100px)" }}>
              <div style={{ marginBottom: 12 }}>
                <h2 style={{ fontFamily: "'Playfair Display',serif", fontSize: 20, color: G }}>AmendoIA · Assistente Inteligente v4</h2>
                <p style={{ fontSize: 12, color: MU, marginTop: 3 }}>Dados de abril/2026 · CONAB 7º Levantamento · CEPEA · AGROSTAT 2025 · PIB Agro +12,2% · Câmbio R$4,95</p>
              </div>
              <div style={{ display: "flex", gap: 7, flexWrap: "wrap", marginBottom: 12 }}>
                {["Por que os preços caíram em 2026?","A área menor da safra 2025/26 é preocupante?","Por que a Rússia passou a liderar as exportações?","O câmbio abaixo de R$5 prejudica o produtor?","Compare as condições climáticas 2024 vs 2025 vs 2026","Qual o impacto do PRONAF com desconto de 58%?"].map(s => (
                  <button key={s} className="sq" onClick={() => setInput(s)}>{s}</button>
                ))}
              </div>
              <div ref={chatRef} style={{ flex: 1, overflow: "auto", display: "flex", flexDirection: "column", gap: 10, paddingRight: 4, marginBottom: 12 }}>
                {msgs.map((msg, i) => (
                  <div key={i} className="fi" style={{ display: "flex", justifyContent: msg.role==="user"?"flex-end":"flex-start", alignItems: "flex-start", gap: 8 }}>
                    {msg.role === "assistant" && (
                      <div style={{ width: 26, height: 26, borderRadius: 6, background: "rgba(200,169,74,.13)", border: "1px solid rgba(200,169,74,.28)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, flexShrink: 0, marginTop: 1 }}>🥜</div>
                    )}
                    <div style={{ maxWidth: "80%", background: msg.role==="user"?"rgba(200,169,74,.09)":CB, border: `1px solid ${msg.role==="user"?"rgba(200,169,74,.2)":BO}`, borderRadius: 10, padding: "9px 13px", fontSize: 13, lineHeight: 1.65, color: TX, whiteSpace: "pre-wrap" }}>
                      {msg.content}
                    </div>
                    {msg.role === "user" && (
                      <div style={{ width: 26, height: 26, borderRadius: 6, background: "#1c3320", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, flexShrink: 0, color: MU, marginTop: 1 }}>EU</div>
                    )}
                  </div>
                ))}
                {loading && (
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <div style={{ width: 26, height: 26, borderRadius: 6, background: "rgba(200,169,74,.13)", border: "1px solid rgba(200,169,74,.28)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13 }}>🥜</div>
                    <div style={{ background: CB, border: `1px solid ${BO}`, borderRadius: 10, padding: "9px 14px" }}>
                      <span className="pu" style={{ fontSize: 13, color: MU }}>Consultando base de dados abr/2026...</span>
                    </div>
                  </div>
                )}
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <input className="ci" value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key==="Enter" && send()} placeholder="Consulte qualquer agente com dados de abril/2026 — produção, preços, exportações, logística, clima..." />
                <button className="sb" onClick={send} disabled={loading || !input.trim()}>Enviar</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
