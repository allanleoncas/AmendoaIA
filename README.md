# AmendoIA

Sistema de Apoio à Decisão (SAD) baseado em Inteligência Artificial aplicado à cadeia produtiva do amendoim nas regiões de Tupã e Jaboticabal (SP).

Protótipo desenvolvido na Faculdade de Ciências e Engenharia — UNESP/Câmpus de Tupã, como prova de conceito para candidatura ao Auxílio à Pesquisa Regular da FAPESP.

---

## Sobre o projeto

O AmendoIA integra variáveis produtivas, logísticas, mercadológicas, institucionais e ambientais da cadeia do amendoim em uma arquitetura modular de agentes analíticos especializados, com interface de consulta em linguagem natural.

São Paulo responde por aproximadamente 86% da produção nacional de amendoim, o que torna a cadeia paulista um objeto empírico estratégico para pesquisa em agricultura digital e inteligência competitiva territorial.

## Os dois módulos

O sistema opera sob duas lentes complementares sobre a mesma base de dados.

### Módulo territorial — `src/AmendoIA_Dashboard.jsx`

Visão de pesquisa e política pública, organizada em cinco agentes analíticos:

| Agente | Escopo | Técnicas |
|---|---|---|
| AEP | Eficiência produtiva | Séries temporais, análise de eficiência técnica |
| AIM | Inteligência de mercado | ARIMA-GARCH, regressão instrumental |
| AOL | Otimização logística | Programação linear multiobjetivo |
| AAI | Análise institucional | Simulação Monte Carlo |
| AMA | Monitoramento ambiental | Regressão logística multinomial, NDVI |

Inclui o Índice de Competitividade Territorial (ICT), ferramentas analíticas interativas e barras de análise de tendências, riscos e leitura estratégica por módulo.

### Módulo empresarial — `src/AmendoIA_Business.jsx`

Visão da firma, organizada em oito painéis alimentados por um perfil de empresa editável:

- **Cockpit do negócio** — margem, cascata de resultado, ciclo de caixa, alertas em reais
- **Posição competitiva** — curva de custo setorial e cinco forças de Porter operacionalizadas
- **Inteligência de compradores** — elegibilidade por mercado e prêmio não capturado
- **Precificação e hedge** — posição de venda, exposição a preço e câmbio
- **Decisões de capital** — VPL, TIR e payback ao custo de capital real
- **Mapa de risco** — matriz probabilidade × impacto financeiro e teste de estresse
- **Aflatoxina e qualidade** — curva de formação por umidade e custo de rebaixamento
- **Escada de produto** — valor por degrau de beneficiamento e análise de verticalização

A regra de corte entre os módulos: se a resposta termina em um número descritivo sobre a região, é territorial; se termina em uma decisão com valor em reais e prazo, é empresarial.

## Painel integrado (versão de 18/11/2026) — `painel/`

Versão que une os dois módulos num único painel com quatro visões sobre a mesma base:

- **Executiva** — preço diário do amendoim em casca nas praças paulistas (Agrolink), preço mensal desde 2005 com tendência até abr/2027, média por ano e padrão sazonal por mês.
- **Produtor** — simulador de resultado por hectare, custo de referência (CNA/ESALQ, Tupã 2025), vender ou guardar, semáforo de aflatoxina por mercado e investimentos na propriedade.
- **Processamento** — teto de compra da agroindústria, mix ótimo por programação linear (simplex) com preço-sombra, óleo e câmbio, concorrência regional, investimentos e matriz de risco.
- **Cadeia geral** — safras Conab até a estimativa 2026/27, exportações 2023–2026 (MDIC), tendências, território (regionais, municípios exportadores e ranking de produção), **Inteligência de mercado** (índices territoriais de Tupã e Jaboticabal por dimensão) e **Dados abertos** (catálogo de 24 bases públicas da cadeia).

Abra `painel/index.html` no navegador; não há build. Os dados ficam em `painel/dados.js` (e em JSON, um arquivo por conjunto, em `painel/dados/`); todos os cálculos — tendências de Holt, custo, mix ótimo, VPL/TIR, índices — rodam no navegador a partir deles. O gráfico usa D3 v7 via CDN, então é preciso internet na primeira abertura.

Para atualizar um número, edite o JSON correspondente em `painel/dados/` e regenere `painel/dados.js` (é o mesmo conteúdo, num único objeto `window.AMZ_DADOS`).

Situação dos dados nesta versão:

| Origem | Conjuntos |
|---|---|
| Fontes públicas | Conab, IEA-SP, MDIC/ComexStat, Banco Central (PTAX, Selic), Banco Mundial, IBGE (PAM), CNA/ESALQ (Campo Futuro), Anvisa e UE (aflatoxina), Agrolink (preços diários) |
| Informado pelo pesquisador | série mensal de preço 2005–2026 (fonte a confirmar) e índices territoriais por dimensão (dimensão Ambiental ainda sem nota) |
| Hipóteses a calibrar com a empresa | área do produtor de referência, custos de processo e logística, classes de grão, destinos e limites, investimentos |

## Estrutura

```
painel/   painel integrado (nov/2026): HTML estático, dados e cálculos
src/      componentes React dos dois módulos (versão anterior)
dist/     versão HTML estática anterior, para apresentação offline
docs/     base de dados consolidada da cadeia
```

## Executando localmente

```bash
npm create vite@latest amendoia -- --template react
cd amendoia
npm install recharts
```

Copie os arquivos de `src/` para a pasta `src/` do projeto Vite e importe o módulo desejado em `App.jsx`.

A versão em `dist/index.html` abre diretamente no navegador, sem build ou instalação.

### Chat com IA

Os módulos React incluem interface conversacional via API da Anthropic. Em produção, a chave de API deve ficar em um backend intermediário, nunca no frontend:

```javascript
// api/claude.js
export default async function handler(req, res) {
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': process.env.ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify(req.body)
  })
  res.json(await response.json())
}
```

## Fontes de dados

CONAB (levantamentos de safra), IEA-SP (produção e custos paulistas), CEPEA/ESALQ (séries de preço), AGROSTAT/MDIC (exportações), BACEN/SISBACEN (crédito rural), INMET e IAC (séries climáticas), Copernicus Sentinel-2 (NDVI), MAPA e EUR-Lex (regulamentação sanitária).

## Estado do protótipo

Esta é uma prova de conceito. As visualizações, calculadoras e a arquitetura de interface são funcionais. Os modelos preditivos (LSTM, ARIMA-GARCH, programação linear) estão representados por projeções calibradas sobre dados reais, não por modelos treinados — seu desenvolvimento é parte do escopo da pesquisa proposta.

## Autoria

Allan Leon Casemiro da Silva
Faculdade de Ciências e Engenharia — UNESP/Tupã
