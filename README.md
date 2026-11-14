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

## Estrutura

```
src/      componentes React dos dois módulos
dist/     versão HTML estática para apresentação offline
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
