// AmendoIA · Painel integrado — funções de apoio, gráficos e navegação.
const AMZ = window.AMZ = {};
AMZ.modelo = (d, ov) => {
  const ref = (k) => { const r = d.referencias_mercado.find((x) => x.chave === k); return r ? +r.valor : NaN; };
  const par = (k) => { const r = d.parametros.find((x) => x.chave === k); return r ? +r.valor : NaN; };
  const exp = (p, a) => d.exportacoes.find((x) => x.produto === p && +x.ano === a);
  const g25 = exp('Amendoim descascado', 2025), o25 = exp('Óleo de amendoim bruto', 2025);
  const hol = d.destinos.find((x) => x.produto === 'Grão' && x.pais === 'Holanda' && +x.ano === 2025);
  const s = {
    cambio: ref('cambio'), oleo: +o25.valor_usd / +o25.volume_t, grao: +g25.valor_usd / +g25.volume_t,
    torta: ref('farelo_amendoim'), interno: ref('grao_interno'), compra: ref('mp_tupa'),
    premio_ue: +hol.val_pct / +hol.vol_pct,
  };
  const ok = (v) => v !== null && v !== undefined && v !== '' && isFinite(+v);
  ['cambio', 'oleo', 'grao', 'torta', 'compra'].forEach((k) => { if (ok(ov[k])) s[k] = +ov[k]; });
  const cap = {}, extra = {};
  d.rotas.forEach((r) => { cap[r.rota] = +r.capacidade_t; extra[r.rota] = +r.custo_extra; });
  if (ok(ov.cap_prensa)) cap.Esmagamento = +ov.cap_prensa;
  if (ok(ov.cap_ue)) cap.UE = +ov.cap_ue;
  const C = s.cambio;
  const valor = {
    UE: s.grao * s.premio_ue * C - par('logistica_grao') * C - extra.UE,
    Outros: s.grao * C - par('logistica_grao') * C - extra.Outros,
    Interno: s.interno - extra.Interno,
    Esmagamento: par('rend_oleo') * (s.oleo - par('logistica_oleo')) * C + par('rend_torta') * s.torta - par('custo_prensagem') - extra.Esmagamento,
  };
  // Programação linear: maximizar o valor líquido do grão, sujeito à oferta de cada classe e à capacidade de cada rota (simplex, regra de Bland).
  const vars = [];
  d.classes.forEach((c) => String(c.rotas).split(',').map((t) => t.trim()).forEach((r) => { if (r in valor) vars.push({ classe: c.classe, rota: r }); }));
  const cons = d.classes.map((c) => ({ tipo: 'classe', id: c.classe, b: +c.oferta_t }))
    .concat(d.rotas.map((r) => ({ tipo: 'rota', id: r.rota, b: Math.max(0, cap[r.rota]) })));
  const n = vars.length, m = cons.length, W = n + m;
  const T = cons.map((k, i) => {
    const row = new Array(W + 1).fill(0);
    vars.forEach((v, j) => { if ((k.tipo === 'classe' && v.classe === k.id) || (k.tipo === 'rota' && v.rota === k.id)) row[j] = 1; });
    row[n + i] = 1; row[W] = k.b; return row;
  });
  const z = new Array(W + 1).fill(0);
  vars.forEach((v, j) => { z[j] = -valor[v.rota]; });
  const base = cons.map((_, i) => n + i);
  for (let it = 0; it < 500; it++) {
    let e = -1;
    for (let j = 0; j < W; j++) if (z[j] < -1e-9) { e = j; break; }
    if (e < 0) break;
    let l = -1, best = Infinity;
    for (let i = 0; i < m; i++) if (T[i][e] > 1e-12) {
      const q = T[i][W] / T[i][e];
      if (q < best - 1e-12 || (Math.abs(q - best) <= 1e-12 && base[i] < base[l])) { best = q; l = i; }
    }
    if (l < 0) break;
    const pv = T[l][e];
    for (let j = 0; j <= W; j++) T[l][j] /= pv;
    for (let i = 0; i < m; i++) if (i !== l && T[i][e] !== 0) { const f = T[i][e]; for (let j = 0; j <= W; j++) T[i][j] -= f * T[l][j]; }
    const f = z[e];
    for (let j = 0; j <= W; j++) z[j] -= f * T[l][j];
    base[l] = e;
  }
  const x = new Array(n).fill(0);
  base.forEach((bj, i) => { if (bj < n) x[bj] = T[i][W]; });
  const r0 = (v) => Math.round(v), r1 = (v) => Math.round(v * 10) / 10, r2 = (v) => Math.round(v * 100) / 100;
  const alocacao = vars.map((v, j) => ({ classe: v.classe, rota: v.rota, t: r0(x[j]) }));
  const obj = vars.reduce((a, v, j) => a + x[j] * valor[v.rota], 0);
  const nc = d.classes.length;
  const rotas = d.rotas.map((r, i) => ({
    rota: r.rota, nome: r.nome, limite: r.limite, valor_t: r0(valor[r.rota]), capacidade_t: r0(cap[r.rota]),
    usado_t: r0(vars.reduce((a, v, j) => a + (v.rota === r.rota ? x[j] : 0), 0)),
    preco_sombra: r0(z[n + nc + i]),
  }));
  const classes = d.classes.map((c, i) => ({
    classe: c.classe, descricao: c.descricao, oferta_t: +c.oferta_t,
    alocado_t: r0(vars.reduce((a, v, j) => a + (v.classe === c.classe ? x[j] : 0), 0)),
    valor_marginal: r0(z[n + i]),
  }));
  const grao_t = d.classes.reduce((a, c) => a + +c.oferta_t, 0);
  const rd = par('rend_descasque');
  const casca_t = grao_t / rd;
  const receita = obj + casca_t * (1 - rd) * par('casca_valor');
  const custo = casca_t * (s.compra * 40 + par('custo_beneficiamento'));
  const margem = receita - custo;
  const teto_t = (receita * (1 - par('margem_minima') / 100)) / casca_t - par('custo_beneficiamento');
  const resumo = {
    cambio: s.cambio, oleo_usd: r0(s.oleo), grao_usd: r0(s.grao), torta: r0(s.torta), compra_sc: r1(s.compra),
    premio_ue: r2(s.premio_ue), casca_t: r0(casca_t), receita_mi: r2(receita / 1e6), margem_mi: r2(margem / 1e6),
    margem_pct: r1((100 * margem) / receita), teto_sc: r1(teto_t / 40), folga_sc: r1(teto_t / 40 - s.compra),
  };
  return { resumo, rotas, alocacao, classes };
};
AMZ.SRC = ['referencias_mercado', 'exportacoes', 'destinos', 'parametros', 'rotas', 'classes'];
AMZ.nf = (v, d = 0) => (v === null || v === undefined || v === '' || !isFinite(+v)) ? '—' : new Intl.NumberFormat('pt-BR', { minimumFractionDigits: d, maximumFractionDigits: d }).format(+v);
AMZ.sg = (v, d = 1) => (v === null || v === undefined || v === '' || !isFinite(+v)) ? '—' : (+v > 0 ? '+' : '') + AMZ.nf(v, d);
AMZ.dt = (s) => { const p = String(s || '').slice(0, 10).split('-'); return p.length === 3 ? p[2] + '/' + p[1] + '/' + p[0] : '—'; };
AMZ.MES = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
AMZ.mes = (m) => { const p = String(m || '').split('-'); return p.length >= 2 ? AMZ.MES[+p[1] - 1] + '/' + p[0] : '—'; };
AMZ.date = (m) => { const p = String(m).split('-').map(Number); return new Date(Date.UTC(p[0], p[1] - 1, 1)); };
AMZ.todos = () => {
  const o = {};
  for (const id of AMZ.SRC) { const r = dash.data(id); if (r.status !== 'ok') return null; o[id] = r.data; }
  return o;
};
AMZ.ov = () => { const p = dash.params(); return { cambio: p.cambio, oleo: p.oleo, grao: p.grao, torta: p.torta, compra: p.compra, cap_prensa: p.cap_prensa, cap_ue: p.cap_ue }; };
AMZ.cenario = () => { const d = AMZ.todos(); return d ? AMZ.modelo(d, AMZ.ov()) : null; };
AMZ.rgb = (el, valor, reserva) => {
  const s = document.createElement('span'); s.style.color = valor; el.appendChild(s);
  const c = getComputedStyle(s).color; s.remove();
  return d3.color(c) ? c : reserva;
};
AMZ.tip = (box) => {
  let t = box.querySelector(':scope > .am-tip');
  if (!t) { t = document.createElement('div'); t.className = 'am-tip'; t.hidden = true; box.appendChild(t); }
  return {
    show(ev, lines) {
      t.replaceChildren(...lines.map((l, i) => { const e = document.createElement('div'); e.textContent = l; if (i === 0 && lines.length > 1) e.className = 'am-tip-h'; return e; }));
      t.hidden = false;
      const r = box.getBoundingClientRect(), w = t.offsetWidth, h = t.offsetHeight;
      let x = ev.clientX - r.left + 12, y = ev.clientY - r.top + 12;
      if (x + w > r.width) x = Math.max(0, ev.clientX - r.left - w - 12);
      if (y + h > r.height) y = Math.max(0, ev.clientY - r.top - h - 12);
      t.style.left = x + 'px'; t.style.top = y + 'px';
    },
    hide() { t.hidden = true; },
  };
};
AMZ.hbar = (el, rows, o) => {
  el.replaceChildren();
  const W = Math.max(260, el.clientWidth || 260), bh = 20, gap = 10, top = 4;
  const H = top + rows.length * (bh + gap);
  const svg = d3.select(el).append('svg').attr('width', '100%').attr('viewBox', `0 0 ${W} ${H}`).attr('role', 'img').attr('aria-label', o.aria || '');
  const gb = svg.append('g'), gl = svg.append('g'), gv = svg.append('g');
  const lab = gl.selectAll('text').data(rows).join('text').attr('class', 'am-tick').attr('text-anchor', 'end').text(o.label);
  let lw = 0; lab.each(function () { lw = Math.max(lw, this.getComputedTextLength()); });
  const val = gv.selectAll('text').data(rows).join('text').attr('class', 'am-val').text((r) => o.fmt(o.value(r)));
  let vw = 0; val.each(function () { vw = Math.max(vw, this.getComputedTextLength()); });
  const L = lw + 10, R = vw + 10;
  const mn = Math.min(0, d3.min(rows, o.value) || 0);
  const mx = Math.max(o.max ?? 0, d3.max(rows, o.value) || 0, o.back ? d3.max(rows, o.back) : 0) || 1;
  const x = d3.scaleLinear([mn, mx], [L, Math.max(L + 20, W - R)]);
  const y = (i) => top + i * (bh + gap);
  if (o.back) gb.selectAll('rect.bk').data(rows).join('rect').attr('class', 'bk').attr('x', x(0)).attr('y', (r, i) => y(i)).attr('height', bh).attr('width', (r) => Math.max(0, x(o.back(r)) - x(0))).attr('rx', 3).attr('fill', 'none').attr('stroke', 'var(--cds-chart-reference)').attr('stroke-dasharray', '3 3');
  gb.selectAll('rect.bar').data(rows).join('rect').attr('class', 'bar').attr('x', (r) => x(Math.min(0, o.value(r)))).attr('y', (r, i) => y(i)).attr('height', bh)
    .attr('width', (r) => Math.max(1, Math.abs(x(o.value(r)) - x(0)))).attr('rx', 3)
    .attr('fill', (r, i) => (o.cor ? o.cor(r, i) : null) || ((o.hi && !o.hi(r)) ? 'var(--cds-chart-muted)' : (o.neg && o.value(r) < 0 ? 'var(--cds-chart-status-critical)' : dash.colors[0])));
  lab.attr('x', L - 8).attr('y', (r, i) => y(i) + bh / 2 + 4);
  val.attr('x', (r) => Math.max(x(Math.max(0, o.value(r))), o.back ? x(o.back(r)) : 0) + 6).attr('y', (r, i) => y(i) + bh / 2 + 4);
  const tip = AMZ.tip(el);
  svg.append('g').selectAll('rect').data(rows).join('rect').attr('x', 0).attr('y', (r, i) => y(i) - gap / 2).attr('width', W).attr('height', bh + gap).attr('fill', 'transparent')
    .on('mousemove', (ev, r) => tip.show(ev, o.tip ? o.tip(r) : [o.label(r), o.fmt(o.value(r))])).on('mouseleave', () => tip.hide());
};
// Barras verticais com rótulo de valor em cima.
AMZ.vbar = (el, rows, o) => {
  el.replaceChildren();
  const W = Math.max(260, el.clientWidth || 260), H = 220, T = 18, B = 24, L = 4, R = 4;
  const svg = d3.select(el).append('svg').attr('width', '100%').attr('viewBox', `0 0 ${W} ${H}`).attr('role', 'img').attr('aria-label', o.aria || '');
  const x = d3.scaleBand(rows.map(o.label), [L, W - R]).padding(0.28);
  const y = d3.scaleLinear([0, (d3.max(rows, o.value) || 1) * 1.08], [H - B, T]);
  svg.append('line').attr('x1', L).attr('x2', W - R).attr('y1', H - B).attr('y2', H - B).attr('stroke', 'var(--cds-chart-axis)');
  const bw = Math.min(32, x.bandwidth()), off = (x.bandwidth() - bw) / 2;
  svg.append('g').selectAll('rect').data(rows).join('rect').attr('x', (r) => x(o.label(r)) + off).attr('width', bw).attr('y', (r) => y(o.value(r))).attr('height', (r) => H - B - y(o.value(r))).attr('rx', 3)
    .attr('fill', (r) => (o.hi && !o.hi(r)) ? 'var(--cds-chart-muted)' : dash.colors[0]);
  svg.append('g').selectAll('text').data(rows).join('text').attr('class', 'am-val').attr('text-anchor', 'middle').attr('x', (r) => x(o.label(r)) + x.bandwidth() / 2).attr('y', (r) => y(o.value(r)) - 5).text((r) => o.fmt(o.value(r)));
  const lab = svg.append('g').selectAll('text').data(rows).join('text').attr('class', 'am-tick').attr('text-anchor', 'middle').attr('x', (r) => x(o.label(r)) + x.bandwidth() / 2).attr('y', H - 7).text(o.label);
  let lw = 0; lab.each(function () { lw = Math.max(lw, this.getComputedTextLength()); });
  if (lw > x.step() - 4) lab.attr('display', (r, i) => i % 2 ? 'none' : null);
  const tip = AMZ.tip(el);
  svg.append('g').selectAll('rect').data(rows).join('rect').attr('x', (r) => x(o.label(r))).attr('width', x.bandwidth()).attr('y', T).attr('height', H - B - T).attr('fill', 'transparent')
    .on('mousemove', (ev, r) => tip.show(ev, o.tip ? o.tip(r) : [o.label(r), o.fmt(o.value(r))])).on('mouseleave', () => tip.hide());
};
// Linha com série real, tendência tracejada e faixa.
AMZ.linha = (el, o) => {
  el.replaceChildren();
  const real = o.real.map((r) => ({ d: AMZ.date(r.mes), v: +r.valor, mes: r.mes }));
  const proj = o.proj.map((r) => ({ d: AMZ.date(r.mes), v: +r.valor, lo: +r.lo, hi: +r.hi, mes: r.mes }));
  if (!real.length) return;
  const W = Math.max(280, el.clientWidth || 280), H = o.h || 240, T = 10, B = 26;
  const svg = d3.select(el).append('svg').attr('width', '100%').attr('viewBox', `0 0 ${W} ${H}`).attr('role', 'img').attr('aria-label', o.aria || '');
  const vals = real.map((r) => r.v).concat(proj.flatMap((r) => [r.lo, r.hi]), (o.refs || []).map((r) => r.v), (o.pontos || []).map((r) => r.v));
  const y = d3.scaleLinear(d3.extent(vals), [H - B, T]).nice(5);
  const ticks = y.ticks(5);
  const probe = svg.append('g');
  let lw = 0; probe.selectAll('text').data(ticks).join('text').attr('class', 'am-tick').text(o.fmt).each(function () { lw = Math.max(lw, this.getComputedTextLength()); });
  probe.remove();
  const lastP = proj.length ? proj[proj.length - 1] : real[real.length - 1];
  const endLab = svg.append('text').attr('class', 'am-val').text(o.fmt(lastP.v));
  const ew = endLab.node().getComputedTextLength();
  const L = lw + 10, R = ew + 10;
  const x = d3.scaleUtc([real[0].d, lastP.d], [L, W - R]);
  svg.append('g').selectAll('line').data(ticks).join('line').attr('x1', L).attr('x2', W - R).attr('y1', y).attr('y2', y).attr('stroke', 'var(--cds-chart-grid)');
  svg.append('g').selectAll('text').data(ticks).join('text').attr('class', 'am-tick').attr('text-anchor', 'end').attr('x', L - 6).attr('y', (t) => y(t) + 4).text(o.fmt);
  const meses = d3.utcMonth.range(real[0].d, d3.utcMonth.offset(lastP.d, 1));
  const passo = Math.max(1, Math.ceil(meses.length / Math.max(2, Math.floor((W - L - R) / 56))));
  svg.append('g').selectAll('text').data(meses.filter((m, i) => i % passo === 0)).join('text').attr('class', 'am-tick').attr('text-anchor', 'middle').attr('x', x).attr('y', H - 8)
    .text((m) => AMZ.MES[m.getUTCMonth()] + '/' + String(m.getUTCFullYear()).slice(2));
  const c0 = dash.colors[0];
  if (proj.length) {
    const ponte = [{ d: real[real.length - 1].d, v: real[real.length - 1].v, lo: real[real.length - 1].v, hi: real[real.length - 1].v }].concat(proj);
    svg.append('path').datum(ponte).attr('d', d3.area().x((r) => x(r.d)).y0((r) => y(r.lo)).y1((r) => y(r.hi))).style('fill', c0).attr('fill-opacity', 0.14);
    svg.append('path').datum(ponte).attr('d', d3.line().x((r) => x(r.d)).y((r) => y(r.v))).attr('fill', 'none').style('stroke', c0).attr('stroke-width', 2).attr('stroke-dasharray', '5 4');
  }
  (o.refs || []).forEach((r) => {
    svg.append('line').attr('x1', L).attr('x2', W - R).attr('y1', y(r.v)).attr('y2', y(r.v)).attr('stroke', 'var(--cds-chart-reference)').attr('stroke-dasharray', '4 4');
    svg.append('text').attr('class', 'am-tick').attr('x', L + 4).attr('y', y(r.v) - 5).text(r.label);
  });
  svg.append('path').datum(real).attr('d', d3.line().x((r) => x(r.d)).y((r) => y(r.v))).attr('fill', 'none').style('stroke', c0).attr('stroke-width', 2).attr('stroke-linecap', 'round').attr('stroke-linejoin', 'round');
  (o.pontos || []).forEach((p) => {
    const px = Math.min(W - R, Math.max(L, x(AMZ.date(p.mes))));
    svg.append('circle').attr('cx', px).attr('cy', y(p.v)).attr('r', 4).attr('fill', 'var(--color-fg)');
  });
  endLab.attr('x', x(lastP.d) + 6).attr('y', y(lastP.v) + 4);
  const todos = real.map((r) => Object.assign({ tipo: 'real' }, r)).concat(proj.map((r) => Object.assign({ tipo: 'proj' }, r)));
  const tip = AMZ.tip(el);
  const marca = svg.append('circle').attr('r', 4).style('fill', c0).attr('display', 'none');
  svg.append('rect').attr('x', L).attr('y', T).attr('width', W - L - R).attr('height', H - T - B).attr('fill', 'transparent')
    .on('mousemove', (ev) => {
      const [mx] = d3.pointer(ev); const d = x.invert(mx);
      const r = todos.reduce((a, b) => Math.abs(b.d - d) < Math.abs(a.d - d) ? b : a, todos[0]);
      marca.attr('display', null).attr('cx', x(r.d)).attr('cy', y(r.v));
      tip.show(ev, r.tipo === 'real' ? [AMZ.mes(r.mes), o.fmt(r.v)] : [AMZ.mes(r.mes) + ' · tendência', o.fmt(r.v), 'faixa ' + o.fmt(r.lo) + ' a ' + o.fmt(r.hi)]);
    })
    .on('mouseleave', () => { tip.hide(); marca.attr('display', 'none'); });
};
AMZ.heat = (el, xs, ys, val, o) => {
  el.replaceChildren();
  const cells = []; for (const a of xs) for (const b of ys) cells.push({ a, b, v: val(a, b) });
  const W = Math.max(280, el.clientWidth || 280);
  const svg = d3.select(el).append('svg').attr('width', '100%').attr('role', 'img').attr('aria-label', o.aria || '');
  const probe = svg.append('text').attr('class', 'am-tick').text(o.fy(ys[ys.length - 1]));
  const lw = probe.node().getComputedTextLength(); probe.remove();
  const L = lw + 12, T = 6, B = 34, R = 6;
  const cw = (W - L - R) / xs.length, ch = Math.max(18, Math.min(30, cw * 0.7));
  const H = T + ch * ys.length + B;
  svg.attr('viewBox', `0 0 ${W} ${H}`);
  const ext = d3.max(cells, (c) => Math.abs(c.v)) || 1;
  const fundo = AMZ.rgb(el, 'var(--color-panel)', '#ffffff');
  const pos = d3.interpolateRgb(fundo, AMZ.rgb(el, dash.colors[0], '#2a6fdb'));
  const neg = d3.interpolateRgb(fundo, AMZ.rgb(el, 'var(--cds-chart-status-critical)', '#c0392b'));
  const xi = (a) => L + xs.indexOf(a) * cw, yi = (b) => T + (ys.length - 1 - ys.indexOf(b)) * ch;
  const tip = AMZ.tip(el);
  svg.append('g').selectAll('rect').data(cells).join('rect').attr('x', (c) => xi(c.a) + 1).attr('y', (c) => yi(c.b) + 1).attr('width', cw - 2).attr('height', ch - 2).attr('rx', 2)
    .attr('fill', (c) => c.v >= 0 ? pos(0.15 + 0.85 * c.v / ext) : neg(0.15 + 0.85 * -c.v / ext))
    .on('mousemove', (ev, c) => tip.show(ev, [o.tipH(c.a, c.b), o.tipV(c.v)])).on('mouseleave', () => tip.hide());
  const ca = xs.reduce((p, a) => Math.abs(a - o.cur[0]) < Math.abs(p - o.cur[0]) ? a : p, xs[0]);
  const cb = ys.reduce((p, b) => Math.abs(b - o.cur[1]) < Math.abs(p - o.cur[1]) ? b : p, ys[0]);
  svg.append('rect').attr('x', xi(ca)).attr('y', yi(cb)).attr('width', cw).attr('height', ch).attr('fill', 'none').attr('stroke', 'var(--color-fg)').attr('stroke-width', 2).attr('rx', 3).attr('pointer-events', 'none');
  const step = Math.ceil(xs.length / Math.max(1, Math.floor((W - L) / 48)));
  svg.append('g').selectAll('text').data(xs.filter((a, i) => i % step === 0)).join('text').attr('class', 'am-tick').attr('text-anchor', 'middle').attr('x', (a) => xi(a) + cw / 2).attr('y', T + ch * ys.length + 14).text(o.fx);
  svg.append('text').attr('class', 'am-tick').attr('x', L + (W - L - R) / 2).attr('y', H - 4).attr('text-anchor', 'middle').text(o.xlab);
  svg.append('g').selectAll('text').data(ys.filter((b, i) => i % 2 === 0)).join('text').attr('class', 'am-tick').attr('text-anchor', 'end').attr('x', L - 6).attr('y', (b) => yi(b) + ch / 2 + 4).text(o.fy);
};
// Visões e páginas.
const amAbrirPagina = (id) => {
  const pg = document.getElementById(id);
  if (!pg) return;
  const visao = pg.closest('.am-visao');
  document.querySelectorAll('.am-visao').forEach((v) => { v.hidden = v !== visao; });
  document.querySelectorAll('.am-view').forEach((b) => b.setAttribute('aria-selected', String(b.dataset.visao === visao.id)));
  visao.querySelectorAll('.am-page').forEach((s) => { s.hidden = s.id !== id; });
  visao.querySelectorAll('.am-tab').forEach((b) => b.setAttribute('aria-selected', String(b.dataset.page === id)));
  dash.setLink(id);
};
const amAbrirVisao = (vid) => {
  const v = document.getElementById(vid);
  if (!v) return;
  const ativa = [...v.querySelectorAll('.am-page')].find((s) => !s.hidden) || v.querySelector('.am-page');
  if (ativa) amAbrirPagina(ativa.id);
};
document.querySelectorAll('.am-view').forEach((b) => b.addEventListener('click', () => amAbrirVisao(b.dataset.visao)));
document.querySelectorAll('.am-tab').forEach((b) => b.addEventListener('click', () => amAbrirPagina(b.dataset.page)));
const amInicio = location.hash.slice(1);
if (amInicio && document.getElementById(amInicio)) {
  const el = document.getElementById(amInicio);
  if (el.classList.contains('am-page')) amAbrirPagina(amInicio); else if (el.classList.contains('am-visao')) amAbrirVisao(amInicio);
}

// Cálculos com os dados de hoje.
dash.calc('tendencias', {
  title: 'Tendência de seis meses', description: 'Série mensal observada e projeção até abr/2027 com faixa de 80% (Holt amortecido).',
  inputs: ['series_mensais'], fn: (series_mensais) => {
  // Holt com tendência amortecida (phi = 0,85); alfa e beta escolhidos pelo menor erro de previsão um passo à frente.
  const ate = '2027-04', phi = 0.85, z = 1.2816;
  const mais = (m, k) => { const [y, mo] = m.split('-').map(Number); const t = y * 12 + (mo - 1) + k; return Math.floor(t / 12) + '-' + String((t % 12) + 1).padStart(2, '0'); };
  const dist = (a, b) => { const [ya, ma] = a.split('-').map(Number), [yb, mb] = b.split('-').map(Number); return (yb - ya) * 12 + (mb - ma); };
  const out = [];
  for (const s of [...new Set(series_mensais.map((r) => r.serie))]) {
    const rows = series_mensais.filter((r) => r.serie === s).sort((a, b) => (a.mes < b.mes ? -1 : 1));
    const y = rows.map((r) => +r.valor);
    let best = null;
    for (const a of [0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9]) for (const b of [0.05, 0.1, 0.2, 0.3]) {
      let l = y[0], t = y[1] - y[0], sse = 0;
      for (let i = 1; i < y.length; i++) {
        const f = l + phi * t, e = y[i] - f; sse += e * e;
        const ln = a * y[i] + (1 - a) * f; t = b * (ln - l) + (1 - b) * phi * t; l = ln;
      }
      if (!best || sse < best.sse) best = { a, b, l, t, sse };
    }
    const sigma = Math.sqrt(best.sse / Math.max(1, y.length - 2));
    rows.forEach((r) => out.push({ serie: s, mes: r.mes, valor: +r.valor, tipo: 'real', lo: null, hi: null }));
    const ult = rows[rows.length - 1].mes, H = Math.max(1, dist(ult, ate));
    let soma = 0;
    for (let h = 1; h <= H; h++) {
      soma += Math.pow(phi, h);
      const v = best.l + soma * best.t, d = z * sigma * Math.sqrt(h);
      const r2 = (x) => Math.round(x * 100) / 100;
      out.push({ serie: s, mes: mais(ult, h), valor: r2(v), tipo: 'projeção', lo: r2(v - d), hi: r2(v + d) });
    }
  }
  return out;
},
});
dash.calc('tend_resumo', {
  title: 'Resumo das tendências', description: 'Último valor observado, projeção final, faixa e variação de cada série.',
  inputs: ['tendencias'],
  fn: (tendencias) => [...new Set(tendencias.map((r) => r.serie))].map((s) => {
    const real = tendencias.filter((r) => r.serie === s && r.tipo === 'real');
    const proj = tendencias.filter((r) => r.serie === s && r.tipo !== 'real');
    const u = real[real.length - 1], f = proj[proj.length - 1];
    const [yy, mm] = u.mes.split('-');
    const ant = real.find((r) => r.mes === (+yy - 1) + '-' + mm);
    return { serie: s, mes_ultimo: u.mes, ultimo: u.valor, mes_final: f.mes, proj_final: f.valor, lo_final: f.lo, hi_final: f.hi,
      var_pct: Math.round(1000 * (f.valor / u.valor - 1)) / 10, var12_pct: ant ? Math.round(1000 * (u.valor / ant.valor - 1)) / 10 : null };
  }),
});
dash.calc('custo_ref', {
  title: 'Custo de referência do produtor', description: 'Custo total por hectare da CNA/ESALQ em Tupã (2025) dividido pela produtividade de referência; inclui o preço médio de 2025 para comparação.',
  inputs: ['series_mensais', 'produtor_perfil'],
  fn: (series_mensais, produtor_perfil) => {
    const par = (k) => +produtor_perfil.find((r) => r.chave === k).valor;
    const p25 = series_mensais.filter((r) => r.serie === 'preco_produtor' && r.mes.startsWith('2025-')).map((r) => +r.valor);
    const media = p25.reduce((a, b) => a + b, 0) / p25.length;
    const custo_ha = par('custo_ha_ref'), custo = custo_ha / par('prod_sc_ha');
    return [{ preco_medio_2025: Math.round(media * 100) / 100, custo_sc: Math.round(custo * 10) / 10, custo_ha }];
  },
});
dash.calc('produtor_base', {
  title: 'Resultado do produtor de referência', description: 'Receita, custo, resultado e pontos de equilíbrio com o preço do último mês da série mensal.',
  inputs: ['produtor_perfil', 'custo_ref', 'tend_resumo'],
  fn: (produtor_perfil, custo_ref, tend_resumo) => {
    const par = (k) => +produtor_perfil.find((r) => r.chave === k).valor;
    const area = par('area_ha'), prod = par('prod_sc_ha'), custo_ha = +custo_ref[0].custo_ha;
    const preco = +tend_resumo.find((r) => r.serie === 'preco_produtor').ultimo;
    const receita = area * prod * preco, custo = area * custo_ha;
    return [{ area_ha: area, prod_sc_ha: prod, preco_sc: preco, custo_ha, receita_mi: Math.round(receita / 1e4) / 100, custo_mi: Math.round(custo / 1e4) / 100,
      margem_mi: Math.round((receita - custo) / 1e4) / 100, margem_ha: Math.round(prod * preco - custo_ha), margem_sc: Math.round((preco - custo_ha / prod) * 10) / 10,
      be_preco: Math.round(custo_ha / prod * 10) / 10, be_prod: Math.round(custo_ha / preco) }];
  },
});
dash.calc('estocar', {
  title: 'Vender agora ou guardar', description: 'Preço projetado de nov/2026 a abr/2027 menos armazenagem, quebra e custo de capital sobre o preço de nov/2026.',
  inputs: ['tendencias', 'produtor_perfil'],
  fn: (tendencias, produtor_perfil) => {
    const par = (k) => +produtor_perfil.find((r) => r.chave === k).valor;
    const meses = ['2026-11', '2026-12', '2027-01', '2027-02', '2027-03', '2027-04'];
    const serie = tendencias.filter((r) => r.serie === 'preco_produtor');
    const p0 = +serie.find((r) => r.mes === meses[0]).valor;
    return meses.map((m, k) => {
      const p = +serie.find((r) => r.mes === m).valor;
      const guarda = k * par('custo_arm') + p0 * (par('taxa_capital') / 100 / 12) * k;
      return { mes: m, meses: k, preco: Math.round(p * 100) / 100, custo_guarda: Math.round(guarda * 100) / 100, liquido: Math.round((p - guarda) * 100) / 100 };
    });
  },
});
dash.calc('modelo_base', {
  title: 'Modelo da agroindústria com os dados de hoje', description: 'Mix ótimo por programação linear, margem e teto de compra, com preços e câmbio atuais.',
  inputs: ['referencias_mercado', 'exportacoes', 'destinos', 'parametros', 'rotas', 'classes'],
  fn: (referencias_mercado, exportacoes, destinos, parametros, rotas, classes) => AMZ.modelo({ referencias_mercado, exportacoes, destinos, parametros, rotas, classes }, {}),
});
dash.calc('resumo_base', { title: 'Resumo da agroindústria hoje', description: 'Margem, teto de compra e folga com os dados de hoje.', inputs: ['modelo_base'], fn: (modelo_base) => [modelo_base.resumo] });
dash.calc('rotas_base', { title: 'Destinos de hoje', description: 'Valor líquido, uso e preço-sombra de cada destino com os dados de hoje.', inputs: ['modelo_base'], fn: (modelo_base) => modelo_base.rotas });
dash.calc('teto_tend', {
  title: 'Teto de compra pela tendência', description: 'O mesmo modelo com o óleo do Banco Mundial projetado para abr/2027 (ajustado pela razão Brasil/mundo de 2025) e o dólar projetado.',
  inputs: ['referencias_mercado', 'exportacoes', 'destinos', 'parametros', 'rotas', 'classes', 'tendencias'],
  fn: (referencias_mercado, exportacoes, destinos, parametros, rotas, classes, tendencias) => {
    const fim = (s) => tendencias.filter((r) => r.serie === s).slice(-1)[0];
    const w25 = tendencias.filter((r) => r.serie === 'oleo_intl' && r.tipo === 'real' && r.mes.startsWith('2025-')).map((r) => +r.valor);
    const o25 = exportacoes.find((r) => r.produto === 'Óleo de amendoim bruto' && +r.ano === 2025);
    const razao = (+o25.valor_usd / +o25.volume_t) / (w25.reduce((a, b) => a + b, 0) / w25.length);
    const oleo = +fim('oleo_intl').valor * razao, cambio = +fim('cambio').valor;
    const m = AMZ.modelo({ referencias_mercado, exportacoes, destinos, parametros, rotas, classes }, { oleo, cambio });
    return [{ mes: fim('oleo_intl').mes, oleo_br_usd: Math.round(oleo), cambio, razao_br_mundo: Math.round(razao * 1000) / 1000, teto_proj: m.resumo.teto_sc, margem_proj_mi: m.resumo.margem_mi }];
  },
});
dash.calc('mercado_calc', {
  title: 'Preço médio exportado', description: 'Volume em mil toneladas, valor em US$ milhões e preço médio em US$ por tonelada.',
  inputs: ['exportacoes'],
  fn: (exportacoes) => exportacoes.map((r) => ({ produto: r.produto, ano: +r.ano, volume_mil_t: Math.round(+r.volume_t / 1000),
    valor_mi_usd: r.valor_usd === null ? null : Math.round(+r.valor_usd / 1e6), preco_usd_t: r.valor_usd === null ? null : Math.round(+r.valor_usd / +r.volume_t) })),
});
dash.calc('mercado_var', {
  title: 'Variação 2025 sobre 2024', description: 'Variação do volume e do preço médio exportados entre 2024 e 2025.',
  inputs: ['exportacoes'],
  fn: (exportacoes) => {
    const out = [];
    for (const p of new Set(exportacoes.map((r) => r.produto))) {
      const a = exportacoes.find((r) => r.produto === p && +r.ano === 2024), b = exportacoes.find((r) => r.produto === p && +r.ano === 2025);
      if (!a || !b) continue;
      const pa = +a.valor_usd / +a.volume_t, pb = +b.valor_usd / +b.volume_t;
      out.push({ produto: p, volume_var_pct: Math.round(1000 * (+b.volume_t / +a.volume_t - 1)) / 10, preco_var_pct: Math.round(1000 * (pb / pa - 1)) / 10 });
    }
    return out;
  },
});
dash.calc('premio_destino', {
  title: 'Prêmio de preço por destino', description: 'Participação no valor dividida pela participação no volume, grão, 2025.',
  inputs: ['destinos'],
  fn: (destinos) => destinos.filter((r) => +r.ano === 2025 && r.produto === 'Grão' && r.val_pct !== null && r.val_pct !== undefined).map((r) => ({ pais: r.pais, fator: Math.round(100 * +r.val_pct / +r.vol_pct) / 100 })).sort((a, b) => b.fator - a.fator),
});
const amVplCalc = (lista, taxaPct) => {
  const taxa = taxaPct / 100;
  const vpl = (c, g, n, i) => -c + g * (1 - Math.pow(1 + i, -n)) / i;
  return lista.map((r) => {
    const c = +r.capex, g = +r.ganho_anual, n = +r.vida_anos;
    let lo = 0.0001, hi = 3;
    for (let k = 0; k < 80; k++) { const mid = (lo + hi) / 2; if (vpl(c, g, n, mid) > 0) lo = mid; else hi = mid; }
    return { projeto: r.projeto, capex_mi: Math.round(c / 1e4) / 100, ganho_mi: Math.round(g / 1e4) / 100, vpl_mi: Math.round(vpl(c, g, n, taxa) / 1e4) / 100, tir_pct: Math.round(lo * 1000) / 10, payback_anos: Math.round(10 * c / g) / 10, efeito: r.efeito };
  }).sort((a, b) => b.vpl_mi - a.vpl_mi);
};
dash.calc('invest_calc', {
  title: 'VPL e TIR, agroindústria', description: 'VPL ao custo de capital dos parâmetros, TIR por bisseção e retorno simples.',
  inputs: ['investimentos', 'parametros'],
  fn: (investimentos, parametros) => amVplCalc(investimentos, +parametros.find((p) => p.chave === 'taxa_desconto').valor),
});
dash.calc('invest_prod_calc', {
  title: 'VPL e TIR, produtor', description: 'VPL ao custo de capital do produtor, TIR por bisseção e retorno simples.',
  inputs: ['invest_produtor', 'produtor_perfil'],
  fn: (invest_produtor, produtor_perfil) => amVplCalc(invest_produtor, +produtor_perfil.find((p) => p.chave === 'taxa_capital').valor),
});
dash.calc('ict_calc', {
  title: 'Índices por dimensão', description: 'Notas de Tupã e Jaboticabal e a diferença (Tupã menos Jaboticabal).',
  inputs: ['indices_ict'],
  fn: (indices_ict) => indices_ict.map((r) => {
    const t = r.tupa === null || r.tupa === undefined || r.tupa === '' ? null : +r.tupa;
    const j = r.jaboticabal === null || r.jaboticabal === undefined || r.jaboticabal === '' ? null : +r.jaboticabal;
    return { dimensao: r.dimensao, tupa: t, jaboticabal: j, diferenca: t === null || j === null ? null : t - j };
  }),
});
dash.calc('ict_resumo', {
  title: 'Índice geral por município', description: 'Média simples das dimensões com nota nos dois municípios.',
  inputs: ['ict_calc'],
  fn: (ict_calc) => {
    const ok = ict_calc.filter((r) => r.diferenca !== null);
    const media = (k) => ok.length ? Math.round(10 * ok.reduce((a, r) => a + r[k], 0) / ok.length) / 10 : null;
    const t = media('tupa'), j = media('jaboticabal');
    return [{ indice_tupa: t, indice_jaboticabal: j, diferenca: t === null ? null : Math.round(10 * (t - j)) / 10, dimensoes: ok.length, total: ict_calc.length }];
  },
});
dash.calc('dados_resumo', {
  title: 'Resumo do catálogo', description: 'Quantas bases foram levantadas, quantas já estão no painel e quantas estão por integrar.',
  inputs: ['dados_abertos'],
  fn: (dados_abertos) => [{ bases: dados_abertos.length, integradas: dados_abertos.filter((r) => String(r.no_painel).startsWith('Integrado')).length, a_integrar: dados_abertos.filter((r) => r.no_painel === 'A integrar').length }],
});
dash.calc('pracas_hoje', {
  title: 'Preço nas praças hoje', description: 'Média, mínimo e máximo do último preço de cada praça paulista.',
  inputs: ['referencias_mercado'],
  fn: (referencias_mercado) => {
    const v = referencias_mercado.filter((r) => String(r.chave).startsWith('mp_')).map((r) => +r.valor);
    return [{ media: v.length ? Math.round(100 * v.reduce((a, b) => a + b, 0) / v.length) / 100 : null, minimo: v.length ? Math.min(...v) : null, maximo: v.length ? Math.max(...v) : null, pracas: v.length }];
  },
});
dash.calc('anual_mensal', {
  title: 'Média anual do preço', description: 'Média dos meses disponíveis em cada ano da série mensal desde 2005.',
  inputs: ['series_mensais'],
  fn: (series_mensais) => {
    const s = series_mensais.filter((r) => r.serie === 'preco_produtor');
    return [...new Set(s.map((r) => r.mes.slice(0, 4)))].sort().map((ano) => {
      const v = s.filter((r) => r.mes.startsWith(ano)).map((r) => +r.valor);
      return { ano, media: Math.round(100 * v.reduce((a, b) => a + b, 0) / v.length) / 100, meses: v.length };
    });
  },
});
dash.calc('sazonal', {
  title: 'Padrão sazonal do preço', description: 'Preço do mês dividido pela média do ano, em média dos anos completos de 2005 a 2025 (100 = média do ano).',
  inputs: ['series_mensais'],
  fn: (series_mensais) => {
    const s = series_mensais.filter((r) => r.serie === 'preco_produtor');
    const anos = [...new Set(s.map((r) => r.mes.slice(0, 4)))].filter((a) => s.filter((r) => r.mes.startsWith(a)).length === 12);
    const out = [];
    for (let m = 1; m <= 12; m++) {
      const mm = String(m).padStart(2, '0');
      const idx = anos.map((a) => {
        const ano = s.filter((r) => r.mes.startsWith(a)).map((r) => +r.valor);
        const media = ano.reduce((x, y) => x + y, 0) / ano.length;
        return +s.find((r) => r.mes === a + '-' + mm).valor / media;
      });
      out.push({ mes: mm, indice: Math.round(1000 * idx.reduce((x, y) => x + y, 0) / idx.length) / 10, anos: anos.length });
    }
    return out;
  },
});

// Números marcados.
const amCampo = (id, campo, fmt, onde, cor) => (el) => {
  const r = dash.data(id);
  if (r.status !== 'ok') { el.textContent = '—'; return; }
  const rows = Array.isArray(r.data) ? r.data : [];
  const row = onde ? rows.find(onde) : rows[0];
  el.textContent = row ? fmt(row[campo]) : '—';
  if (cor && row) el.className = +row[campo] >= 0 ? 'am-good' : 'am-bad';
};
const amRef = (k) => (x) => x.chave === k;
const amSer = (s) => (x) => x.serie === s;
const n0 = (v) => AMZ.nf(v), n1 = (v) => AMZ.nf(v, 1), n2 = (v) => AMZ.nf(v, 2), s1 = (v) => AMZ.sg(v, 1);
// Produtor
dash.draw('pt_preco', amCampo('tend_resumo', 'ultimo', n2, amSer('preco_produtor')));
dash.draw('pt_mes', amCampo('tend_resumo', 'mes_ultimo', AMZ.mes, amSer('preco_produtor')));
dash.draw('pt_custo', amCampo('custo_ref', 'custo_sc', n1));
dash.draw('pt_proj', amCampo('tend_resumo', 'proj_final', n2, amSer('preco_produtor')));
dash.draw('pt_mesf', amCampo('tend_resumo', 'mes_final', AMZ.mes, amSer('preco_produtor')));
dash.draw('pk_preco', amCampo('tend_resumo', 'ultimo', n2, amSer('preco_produtor')));
dash.draw('pk_tupa', amCampo('referencias_mercado', 'valor', n2, amRef('mp_tupa')));
dash.draw('pk_tupa_d', amCampo('referencias_mercado', 'data', AMZ.dt, amRef('mp_tupa')));
dash.draw('pk_custo', amCampo('custo_ref', 'custo_sc', n1));
dash.draw('pk_margem', amCampo('produtor_base', 'margem_ha', n0, null, true));
dash.draw('pk_area', amCampo('produtor_perfil', 'valor', n0, amRef('area_ha')));
dash.draw('pk_be', amCampo('produtor_base', 'be_prod', n0));
dash.draw('pk_proj', amCampo('tend_resumo', 'proj_final', n2, amSer('preco_produtor')));
dash.draw('pk_lo', amCampo('tend_resumo', 'lo_final', n2, amSer('preco_produtor')));
dash.draw('pk_hi', amCampo('tend_resumo', 'hi_final', n2, amSer('preco_produtor')));
dash.draw('pb_receita', amCampo('produtor_base', 'receita_mi', n2));
dash.draw('pb_custo', amCampo('produtor_base', 'custo_mi', n2));
dash.draw('pb_res', amCampo('produtor_base', 'margem_mi', n2, null, true));
dash.draw('pb_ha', amCampo('produtor_base', 'margem_ha', n0, null, true));
dash.draw('pb_bep', amCampo('produtor_base', 'be_preco', n1));
dash.draw('pb_bes', amCampo('produtor_base', 'be_prod', n0));
dash.draw('pi_taxa', amCampo('produtor_perfil', 'valor', n2, amRef('taxa_capital')));
// Processamento
dash.draw('t_compra', amCampo('referencias_mercado', 'valor', n2, amRef('mp_tupa')));
dash.draw('t_teto', amCampo('resumo_base', 'teto_sc', n1));
dash.draw('t_teto_tend', amCampo('teto_tend', 'teto_proj', n1));
dash.draw('t_gargalo', (el) => {
  const r = dash.data('rotas_base');
  if (r.status !== 'ok') { el.textContent = '—'; return; }
  const top = [...r.data].sort((a, b) => b.preco_sombra - a.preco_sombra)[0];
  el.textContent = top && top.preco_sombra > 0 ? `o limite de "${top.limite}": cada tonelada a mais vale R$ ${AMZ.nf(top.preco_sombra)} por mês` : 'nenhum limite de destino; a oferta de matéria-prima é o que trava';
});
dash.draw('k_margem', amCampo('resumo_base', 'margem_mi', n2));
dash.draw('k_margem_pct', amCampo('resumo_base', 'margem_pct', n1));
dash.draw('k_teto', amCampo('resumo_base', 'teto_sc', n1));
dash.draw('k_folga', amCampo('resumo_base', 'folga_sc', s1, null, true));
dash.draw('k_teto_tend', amCampo('teto_tend', 'teto_proj', n1));
dash.draw('k_cambio', amCampo('referencias_mercado', 'valor', n2, amRef('cambio')));
dash.draw('k_cambio_data', amCampo('referencias_mercado', 'data', AMZ.dt, amRef('cambio')));
dash.draw('k_oleo_intl', amCampo('tend_resumo', 'ultimo', n0, amSer('oleo_intl')));
dash.draw('k_oleo_intl_m', amCampo('tend_resumo', 'mes_ultimo', AMZ.mes, amSer('oleo_intl')));
dash.draw('k_china24', amCampo('destinos', 'vol_pct', n0, (x) => +x.ano === 2024 && x.produto === 'Óleo' && x.pais === 'China'));
dash.draw('k_china', amCampo('destinos', 'vol_pct', n0, (x) => +x.ano === 2025 && x.produto === 'Óleo' && x.pais === 'China'));
dash.draw('b_margem', amCampo('resumo_base', 'margem_mi', n2));
dash.draw('b_margem_pct', amCampo('resumo_base', 'margem_pct', n1));
dash.draw('b_teto', amCampo('resumo_base', 'teto_sc', n1));
dash.draw('b_folga', amCampo('resumo_base', 'folga_sc', s1));
dash.draw('i_taxa', amCampo('parametros', 'valor', n2, amRef('taxa_desconto')));
dash.draw('i_sombra_ue', amCampo('rotas_base', 'preco_sombra', n0, (x) => x.rota === 'UE'));
dash.draw('i_cap_ue', amCampo('rotas_base', 'capacidade_t', n0, (x) => x.rota === 'UE'));
dash.draw('i_oleo_br', amCampo('mercado_calc', 'preco_usd_t', n0, (x) => x.produto === 'Óleo de amendoim bruto' && +x.ano === 2025));
// Cadeia
const amSafra = (s) => (x) => x.abrangencia === 'Brasil' && x.safra === s;
dash.draw('ct_prod', amCampo('safras', 'producao_mil_t', n0, amSafra('2025/26')));
dash.draw('ct_oleo', amCampo('mercado_calc', 'volume_mil_t', n0, (x) => x.produto === 'Óleo de amendoim bruto' && +x.ano === 2025));
dash.draw('ck_prod', amCampo('safras', 'producao_mil_t', n0, amSafra('2025/26')));
dash.draw('ck_produt', amCampo('safras', 'produtividade_kg_ha', n0, amSafra('2025/26')));
dash.draw('ck_produt_q', amCampo('safras', 'produtividade_kg_ha', n0, amSafra('2023/24')));
dash.draw('ck_grao', amCampo('mercado_calc', 'volume_mil_t', n0, (x) => x.produto === 'Amendoim descascado' && +x.ano === 2025));
dash.draw('ck_grao_p', amCampo('mercado_var', 'preco_var_pct', s1, (x) => x.produto === 'Amendoim descascado', true));
dash.draw('ck_oleo', amCampo('mercado_calc', 'volume_mil_t', n0, (x) => x.produto === 'Óleo de amendoim bruto' && +x.ano === 2025));
dash.draw('ck_oleo_v', amCampo('mercado_var', 'volume_var_pct', s1, (x) => x.produto === 'Óleo de amendoim bruto', true));
dash.draw('ck_cambio_m', amCampo('tend_resumo', 'mes_ultimo', AMZ.mes, amSer('cambio')));
dash.draw('ck_cambio', amCampo('tend_resumo', 'ultimo', n2, amSer('cambio')));
dash.draw('ck_cambio_p', amCampo('tend_resumo', 'proj_final', n2, amSer('cambio')));
dash.draw('ck_preco12', amCampo('tend_resumo', 'var12_pct', s1, amSer('preco_produtor'), true));
// Controles (todos os sliders) e cenários.
const amPadrao = () => {
  const out = {};
  const d = AMZ.todos();
  if (d) {
    const base = AMZ.modelo(d, {});
    const rot = (k) => base.rotas.find((r) => r.rota === k);
    Object.assign(out, { cambio: base.resumo.cambio, oleo: base.resumo.oleo_usd, grao: base.resumo.grao_usd, torta: base.resumo.torta, compra: base.resumo.compra_sc, cap_prensa: rot('Esmagamento').capacidade_t, cap_ue: rot('UE').capacidade_t });
  }
  const pb = dash.data('produtor_base');
  if (pb.status === 'ok' && pb.data[0]) Object.assign(out, { p_area: pb.data[0].area_ha, p_prod: pb.data[0].prod_sc_ha, p_custo: pb.data[0].custo_ha, p_preco: pb.data[0].preco_sc });
  out.afla = 6;
  return out;
};
const amValor = (k) => { const p = dash.params()[k]; if (p !== null && p !== undefined && p !== '' && isFinite(+p)) return +p; const d = amPadrao(); return d[k] === undefined ? null : d[k]; };
const amFmtCtl = { cambio: n2, oleo: n0, grao: n0, torta: n0, compra: n1, cap_prensa: n0, cap_ue: n0, p_area: n0, p_prod: n0, p_custo: n0, p_preco: n1, afla: n1 };
document.querySelectorAll('input[data-param]').forEach((inp) => inp.addEventListener('input', () => dash.setParams({ [inp.dataset.param]: +inp.value })));
document.querySelectorAll('.am-reset').forEach((b) => b.addEventListener('click', () => {
  const sec = b.closest('.am-card');
  const nomes = [...sec.querySelectorAll('input[data-param]')].map((i) => i.dataset.param);
  dash.setParams(Object.fromEntries(nomes.map((n) => [n, null])));
}));
dash.onData(() => {
  document.querySelectorAll('input[data-param]').forEach((inp) => {
    if (inp === document.activeElement) return;
    const v = amValor(inp.dataset.param);
    inp.disabled = v === null;
    if (v !== null) inp.value = String(v);
  });
});
for (const k of Object.keys(amFmtCtl)) dash.draw('v_' + k, (el) => { const v = amValor(k); el.textContent = v === null ? '—' : amFmtCtl[k](v); });

// Produtor: cenário
const amProdCen = () => {
  const a = amValor('p_area'), p = amValor('p_prod'), c = amValor('p_custo'), pr = amValor('p_preco');
  if ([a, p, c, pr].some((v) => v === null)) return null;
  const receita = a * p * pr, custo = a * c;
  return { receita_mi: receita / 1e6, custo_mi: custo / 1e6, res_mi: (receita - custo) / 1e6, res_ha: p * pr - c, bep: c / p, bes: c / pr };
};
const amPC = (campo, fmt, cor) => (el) => { const m = amProdCen(); if (!m) { el.textContent = '—'; return; } el.textContent = fmt(m[campo]); el.className = cor ? (m[campo] >= 0 ? 'am-good' : 'am-bad') : ''; };
dash.draw('ps_receita', amPC('receita_mi', n2));
dash.draw('ps_custo', amPC('custo_mi', n2));
dash.draw('ps_res', amPC('res_mi', n2, true));
dash.draw('ps_ha', amPC('res_ha', n0, true));
dash.draw('ps_bep', amPC('bep', n1));
dash.draw('ps_bes', amPC('bes', n0));
dash.draw('pc_heat', (el) => {
  const c = amValor('p_custo'), p = amValor('p_prod'), pr = amValor('p_preco');
  if ([c, p, pr].some((v) => v === null)) { el.replaceChildren(); return; }
  AMZ.heat(el, d3.range(55, 101, 5), d3.range(100, 221, 15), (preco, prod) => prod * preco - c,
    { cur: [pr, p], fx: (v) => AMZ.nf(v), fy: (v) => AMZ.nf(v) + ' sc', xlab: 'Preço de venda (R$/sc)', tipH: (a, b) => 'R$ ' + AMZ.nf(a) + '/sc · ' + AMZ.nf(b) + ' sc/ha', tipV: (v) => 'Resultado R$ ' + AMZ.nf(v) + ' por ha', aria: 'Resultado por hectare conforme preço e produtividade' });
});
dash.draw('pc_serie', (el) => {
  const t = dash.data('tendencias'), c = dash.data('custo_ref'), r = dash.data('referencias_mercado');
  if (t.status !== 'ok' || c.status !== 'ok' || r.status !== 'ok') { el.replaceChildren(); return; }
  const s = t.data.filter((x) => x.serie === 'preco_produtor');
  const tupa = r.data.find((x) => x.chave === 'mp_tupa');
  AMZ.linha(el, { real: s.filter((x) => x.tipo === 'real'), proj: s.filter((x) => x.tipo !== 'real'), fmt: (v) => 'R$ ' + AMZ.nf(v),
    refs: [{ v: +c.data[0].custo_sc, label: 'Custo estimado R$ ' + AMZ.nf(c.data[0].custo_sc, 1) }],
    pontos: tupa ? [{ mes: String(tupa.data).slice(0, 7), v: +tupa.valor }] : [], h: 260, aria: 'Preço recebido pelo produtor e tendência' });
});
dash.draw('pc_guardar', (el) => {
  const e = dash.data('estocar');
  if (e.status !== 'ok') { el.replaceChildren(); return; }
  const best = e.data.reduce((a, b) => (b.liquido > a.liquido ? b : a), e.data[0]);
  AMZ.vbar(el, e.data, { label: (r) => AMZ.mes(r.mes), value: (r) => r.liquido, fmt: (v) => AMZ.nf(v, 2), hi: (r) => r === best, aria: 'Valor líquido por saca em cada mês',
    tip: (r) => [AMZ.mes(r.mes), 'Preço projetado R$ ' + AMZ.nf(r.preco, 2), 'Custo de guardar R$ ' + AMZ.nf(r.custo_guarda, 2), 'Líquido R$ ' + AMZ.nf(r.liquido, 2)] });
});
dash.draw('pt_guardar', (el) => {
  const e = dash.data('estocar');
  if (e.status !== 'ok') { el.textContent = '—'; return; }
  const best = e.data.reduce((a, b) => (b.liquido > a.liquido ? b : a), e.data[0]);
  el.textContent = best.meses === 0 ? `Pela tendência, guardar não compensa: vender em ${AMZ.mes(best.mes)} rende mais, R$ ${AMZ.nf(best.liquido, 2)} líquidos por saca.` : `Pela tendência, o melhor mês é ${AMZ.mes(best.mes)}: R$ ${AMZ.nf(best.liquido, 2)} líquidos por saca.`;
});
dash.draw('pc_pracas', (el) => {
  const r = dash.data('referencias_mercado');
  if (r.status !== 'ok') { el.replaceChildren(); return; }
  AMZ.hbar(el, r.data.filter((x) => String(x.chave).startsWith('mp_')), { label: (x) => String(x.rotulo).replace('Amendoim em casca, ', ''), value: (x) => +x.valor, fmt: (v) => 'R$ ' + AMZ.nf(v, 2), hi: (x) => x.chave === 'mp_tupa', aria: 'Preço nas praças',
    tip: (x) => [x.rotulo, 'R$ ' + AMZ.nf(x.valor, 2) + ' em ' + AMZ.dt(x.data)] });
});
dash.draw('pc_sem', (el) => {
  const r = dash.data('limites_aflatoxina'), a = amValor('afla');
  if (r.status !== 'ok' || a === null) { el.replaceChildren(); return; }
  const ok = AMZ.rgb(el, 'var(--color-ok)', '#2e7d32'), bad = AMZ.rgb(el, 'var(--color-bad)', '#c62828');
  el.replaceChildren(...r.data.map((m) => {
    const lim = m.total_ppb !== null && m.total_ppb !== undefined ? +m.total_ppb : null;
    const linha = document.createElement('div'); linha.className = 'am-sem-row';
    const dot = document.createElement('span'); dot.className = 'am-dot';
    const tx = document.createElement('span');
    if (lim === null) { dot.style.background = 'var(--cds-chart-muted)'; tx.textContent = `${m.mercado}: limite só para B1 (${AMZ.nf(m.b1_ppb)} µg/kg); confira o laudo de B1.`; }
    else if (a <= lim) { dot.style.background = ok; tx.textContent = `${m.mercado}: dentro do limite de ${AMZ.nf(lim)} µg/kg.`; }
    else { dot.style.background = bad; tx.textContent = `${m.mercado}: acima do limite de ${AMZ.nf(lim)} µg/kg; o lote só vai para esmagamento ou seleção.`; }
    linha.append(dot, tx); return linha;
  }));
});
const amLinhas = (tbody, rows, cols) => {
  tbody.replaceChildren();
  rows.forEach((r) => { const tr = tbody.insertRow(); cols.forEach(([campo, fmt, cl]) => { const td = tr.insertCell(); td.textContent = fmt ? fmt(r[campo], r) : String(r[campo] ?? ''); if (cl) td.className = cl; }); });
};
dash.draw('tb_limites', (tb) => {
  const r = dash.data('limites_aflatoxina');
  if (r.status !== 'ok') { tb.replaceChildren(); return; }
  amLinhas(tb, r.data, [['mercado'], ['total_ppb', (v) => (v === null ? '—' : AMZ.nf(v)), 'num'], ['b1_ppb', (v) => (v === null ? '—' : AMZ.nf(v)), 'num'], ['norma'], ['vigencia']]);
});
const amInvTab = (id) => (tb) => {
  const r = dash.data(id);
  if (r.status !== 'ok') { tb.replaceChildren(); return; }
  amLinhas(tb, r.data, [['projeto'], ['capex_mi', n2, 'num'], ['ganho_mi', n2, 'num'], ['vpl_mi', n2, 'num'], ['tir_pct', n1, 'num'], ['payback_anos', n1, 'num'], ['efeito']]);
};
const amVpl = (id) => (el) => {
  const r = dash.data(id);
  if (r.status !== 'ok') { el.replaceChildren(); return; }
  AMZ.hbar(el, r.data, { label: (x) => x.projeto, value: (x) => +x.vpl_mi, neg: true, fmt: (v) => 'R$ ' + AMZ.nf(v, 2) + ' mi', aria: 'VPL por projeto',
    tip: (x) => [x.projeto, 'VPL R$ ' + AMZ.nf(x.vpl_mi, 2) + ' mi', 'TIR ' + AMZ.nf(x.tir_pct, 1) + '%'] });
};
dash.draw('tb_inv_prod', amInvTab('invest_prod_calc'));
dash.draw('pc_vpl', amVpl('invest_prod_calc'));
dash.draw('tb_invest', amInvTab('invest_calc'));
dash.draw('c_vpl', amVpl('invest_calc'));

// Processamento: cenário
const amCen = (campo, fmt, cor) => (el) => {
  const m = AMZ.cenario();
  if (!m) { el.textContent = '—'; return; }
  const v = m.resumo[campo];
  el.textContent = fmt(v);
  el.className = cor ? (v >= 0 ? 'am-good' : 'am-bad') : '';
};
dash.draw('s_margem', amCen('margem_mi', n2, true));
dash.draw('s_margem_pct', amCen('margem_pct', n1));
dash.draw('s_teto', amCen('teto_sc', n1));
dash.draw('s_folga', amCen('folga_sc', s1, true));
const amNomeRota = (r) => ({ UE: 'Europa', Outros: 'Outros destinos', Interno: 'Mercado interno', Esmagamento: 'Esmagamento' })[r.rota] || r.rota;
dash.draw('c_rotas', (el) => {
  const m = AMZ.cenario();
  if (!m) { el.replaceChildren(); return; }
  AMZ.hbar(el, m.rotas, { label: amNomeRota, value: (r) => r.valor_t, fmt: (v) => 'R$ ' + AMZ.nf(v), neg: true, aria: 'Valor líquido por tonelada de grão em cada destino', tip: (r) => [r.nome, 'R$ ' + AMZ.nf(r.valor_t) + ' por t de grão'] });
});
dash.draw('c_heat', (el) => {
  const d = AMZ.todos();
  if (!d) { el.replaceChildren(); return; }
  const ov = AMZ.ov(), cur = AMZ.modelo(d, ov).resumo;
  AMZ.heat(el, d3.range(4.6, 6.41, 0.2).map((v) => Math.round(v * 100) / 100), d3.range(900, 1501, 75), (c, g) => AMZ.modelo(d, Object.assign({}, ov, { cambio: c, grao: g })).resumo.margem_mi,
    { cur: [cur.cambio, cur.grao_usd], fx: (v) => AMZ.nf(v, 1), fy: (v) => 'US$ ' + AMZ.nf(v), xlab: 'Dólar (R$/US$)', tipH: (a, b) => 'Dólar R$ ' + AMZ.nf(a, 2) + ' · grão US$ ' + AMZ.nf(b) + '/t', tipV: (v) => 'Margem R$ ' + AMZ.nf(v, 2) + ' mi por mês', aria: 'Mapa de margem por câmbio e preço do grão' });
});
dash.draw('c_aloc', (el) => {
  const m = AMZ.cenario();
  if (!m) { el.replaceChildren(); return; }
  const tb = document.createElement('table'); tb.className = 'am-table';
  const hr = tb.createTHead().insertRow();
  const th = (t, c) => { const e = document.createElement('th'); e.textContent = t; if (c) e.className = c; hr.appendChild(e); };
  th('Classe'); th('Oferta (t)', 'num'); m.rotas.forEach((r) => th(amNomeRota(r), 'num')); th('Valor de +1 t (R$)', 'num');
  const body = tb.createTBody();
  m.classes.forEach((c) => {
    const tr = body.insertRow();
    const td = (t, cl) => { const e = tr.insertCell(); e.textContent = t; if (cl) e.className = cl; };
    td(c.classe + ' · ' + c.descricao); td(AMZ.nf(c.oferta_t), 'num');
    m.rotas.forEach((r) => { const a = m.alocacao.find((x) => x.classe === c.classe && x.rota === r.rota); td(a ? AMZ.nf(a.t) : 'não elegível', 'num'); });
    td(AMZ.nf(c.valor_marginal), 'num');
  });
  el.replaceChildren(tb);
});
dash.draw('c_uso', (el) => {
  const m = AMZ.cenario();
  if (!m) { el.replaceChildren(); return; }
  AMZ.hbar(el, m.rotas, { label: amNomeRota, value: (r) => r.usado_t, back: (r) => r.capacidade_t, fmt: (v) => AMZ.nf(v) + ' t', tip: (r) => [r.nome, 'Alocado ' + AMZ.nf(r.usado_t) + ' t de ' + AMZ.nf(r.capacidade_t) + ' t'], aria: 'Uso de cada destino contra o limite' });
});
const amTabela = (heads, rows) => {
  const tb = document.createElement('table'); tb.className = 'am-table';
  const hr = tb.createTHead().insertRow();
  heads.forEach((t, i) => { const e = document.createElement('th'); e.textContent = t; if (i) e.className = 'num'; hr.appendChild(e); });
  const body = tb.createTBody();
  rows.forEach((cells) => { const tr = body.insertRow(); cells.forEach((c, i) => { const td = tr.insertCell(); td.textContent = c[0]; if (i) td.className = 'num'; if (c[1]) td.className += ' ' + c[1]; }); });
  return tb;
};
dash.draw('c_sombra', (el) => {
  const m = AMZ.cenario();
  if (!m) { el.replaceChildren(); return; }
  el.replaceChildren(amTabela(['Destino', 'Limite', 'Uso', 'Valor de +1 t (R$)'], [...m.rotas].sort((a, b) => b.preco_sombra - a.preco_sombra).map((r) => [[r.limite], [AMZ.nf(r.capacidade_t) + ' t'], [AMZ.nf(r.capacidade_t ? 100 * r.usado_t / r.capacidade_t : 0) + '%'], [AMZ.nf(r.preco_sombra), r.preco_sombra > 0 ? 'am-good' : '']])));
});
dash.draw('c_classes', (el) => {
  const m = AMZ.cenario();
  if (!m) { el.replaceChildren(); return; }
  const rd = +AMZ.todos().parametros.find((p) => p.chave === 'rend_descasque').valor;
  el.replaceChildren(amTabela(['Classe', 'Oferta (t de grão)', 'Alocado (t)', 'Valor de +1 t de grão (R$)', 'Equivalente por saca em casca (R$)'], m.classes.map((c) => [[c.classe + ' · ' + c.descricao], [AMZ.nf(c.oferta_t)], [AMZ.nf(c.alocado_t)], [AMZ.nf(c.valor_marginal)], [AMZ.nf(c.valor_marginal * rd / 40, 1)]])));
});
const amSerie = (serie, fmt, aria, ponto) => (el) => {
  const t = dash.data('tendencias');
  if (t.status !== 'ok') { el.replaceChildren(); return; }
  const s = t.data.filter((x) => x.serie === serie);
  let pontos = [];
  if (ponto) { const r = dash.data('referencias_mercado'); const p = r.status === 'ok' ? r.data.find((x) => x.chave === ponto) : null; if (p) pontos = [{ mes: String(p.data).slice(0, 7), v: +p.valor }]; }
  AMZ.linha(el, { real: s.filter((x) => x.tipo === 'real'), proj: s.filter((x) => x.tipo !== 'real'), fmt, pontos, aria });
};
dash.draw('ic_oleo', amSerie('oleo_intl', (v) => 'US$ ' + AMZ.nf(v), 'Óleo de amendoim, referência mundial'));
dash.draw('ic_cambio', amSerie('cambio', (v) => 'R$ ' + AMZ.nf(v, 2), 'Dólar e tendência', 'cambio'));
dash.draw('cc_s_prod', amSerie('preco_produtor', (v) => 'R$ ' + AMZ.nf(v), 'Preço ao produtor em SP'));
dash.draw('cc_s_oleo', amSerie('oleo_intl', (v) => 'US$ ' + AMZ.nf(v), 'Óleo de amendoim, referência mundial'));
dash.draw('cc_s_cambio', amSerie('cambio', (v) => 'R$ ' + AMZ.nf(v, 2), 'Dólar', 'cambio'));
// Tabelas e gráficos de dados fixos.
dash.draw('tb_conc_oleo', (tb) => { const r = dash.data('concorrentes'); if (r.status !== 'ok') { tb.replaceChildren(); return; } amLinhas(tb, r.data.filter((x) => x.frente === 'Óleo e farelo'), [['empresa'], ['cidade'], ['atuacao'], ['leitura'], ['fonte']]); });
dash.draw('tb_conc_grao', (tb) => { const r = dash.data('concorrentes'); if (r.status !== 'ok') { tb.replaceChildren(); return; } amLinhas(tb, r.data.filter((x) => x.frente === 'Grão e originação'), [['empresa'], ['cidade'], ['atuacao'], ['leitura'], ['fonte']]); });
const amRiscos = () => { const r = dash.data('riscos'); return r.status === 'ok' ? [...r.data].sort((a, b) => b.prob * b.impacto - a.prob * a.impacto) : null; };
dash.draw('tb_riscos', (tb) => {
  const rows = amRiscos();
  if (!rows) { tb.replaceChildren(); return; }
  amLinhas(tb, rows, [['risco', (v, r) => (rows.indexOf(r) + 1) + '. ' + v], ['prob', (v) => String(v), 'num'], ['impacto', (v) => String(v), 'num'], ['gatilho'], ['acao']]);
});
dash.draw('c_matriz', (el) => {
  const rows = amRiscos();
  if (!rows) { el.replaceChildren(); return; }
  el.replaceChildren();
  const W = Math.max(260, el.clientWidth || 260);
  const L = 30, B = 34, T = 6, R = 6;
  const cell = Math.min(56, (W - L - R) / 5), H = T + cell * 5 + B;
  const svg = d3.select(el).append('svg').attr('width', '100%').attr('viewBox', `0 0 ${W} ${H}`).attr('role', 'img').attr('aria-label', 'Matriz de probabilidade e impacto');
  const crit = d3.interpolateRgb(AMZ.rgb(el, 'var(--color-panel)', '#ffffff'), AMZ.rgb(el, 'var(--cds-chart-status-critical)', '#c0392b'));
  for (let p = 1; p <= 5; p++) for (let i = 1; i <= 5; i++) svg.append('rect').attr('x', L + (p - 1) * cell + 1).attr('y', T + (5 - i) * cell + 1).attr('width', cell - 2).attr('height', cell - 2).attr('rx', 3).attr('fill', crit(0.05 + 0.55 * (p * i) / 25));
  const tip = AMZ.tip(el);
  for (const [, g] of d3.group(rows, (r) => r.prob + '-' + r.impacto)) g.forEach((r, k) => {
    const cx = L + (r.prob - 0.5) * cell + (k - (g.length - 1) / 2) * 18, cy = T + (5.5 - r.impacto) * cell;
    const gg = svg.append('g').on('mousemove', (ev) => tip.show(ev, [r.risco, 'Probabilidade ' + r.prob + ' · impacto ' + r.impacto])).on('mouseleave', () => tip.hide());
    gg.append('circle').attr('cx', cx).attr('cy', cy).attr('r', 9).attr('fill', 'var(--color-fg)');
    gg.append('text').attr('x', cx).attr('y', cy + 4).attr('text-anchor', 'middle').attr('class', 'am-tick').style('fill', 'var(--color-bg)').text(String(rows.indexOf(r) + 1));
  });
  for (let p = 1; p <= 5; p++) svg.append('text').attr('class', 'am-tick').attr('text-anchor', 'middle').attr('x', L + (p - 0.5) * cell).attr('y', T + 5 * cell + 14).text(String(p));
  for (let i = 1; i <= 5; i++) svg.append('text').attr('class', 'am-tick').attr('text-anchor', 'end').attr('x', L - 8).attr('y', T + (5.5 - i) * cell + 4).text(String(i));
  svg.append('text').attr('class', 'am-tick').attr('text-anchor', 'middle').attr('x', L + 2.5 * cell).attr('y', H - 4).text('Probabilidade');
});
dash.draw('tb_safras', (tb) => {
  const r = dash.data('safras');
  if (r.status !== 'ok') { tb.replaceChildren(); return; }
  amLinhas(tb, r.data, [['abrangencia'], ['safra'], ['area_mil_ha', n1, 'num'], ['produtividade_kg_ha', n0, 'num'], ['producao_mil_t', n1, 'num'], ['fonte']]);
});
dash.draw('cc_prod', (el) => {
  const r = dash.data('safras');
  if (r.status !== 'ok') { el.replaceChildren(); return; }
  AMZ.vbar(el, r.data.filter((x) => x.abrangencia === 'Brasil'), { label: (x) => x.safra, value: (x) => +x.producao_mil_t, fmt: n0, hi: (x) => x.safra !== '2023/24', aria: 'Produção brasileira por safra',
    tip: (x) => ['Safra ' + x.safra, AMZ.nf(x.producao_mil_t, 1) + ' mil t', AMZ.nf(x.area_mil_ha, 1) + ' mil ha'] });
});
dash.draw('cc_produt', (el) => {
  const r = dash.data('safras');
  if (r.status !== 'ok') { el.replaceChildren(); return; }
  AMZ.vbar(el, r.data.filter((x) => x.abrangencia === 'Brasil'), { label: (x) => x.safra, value: (x) => +x.produtividade_kg_ha, fmt: n0, hi: (x) => x.safra !== '2023/24', aria: 'Produtividade por safra' });
});
dash.draw('tb_export', (tb) => {
  const r = dash.data('mercado_calc');
  if (r.status !== 'ok') { tb.replaceChildren(); return; }
  amLinhas(tb, r.data, [['produto'], ['ano', (v) => String(v)], ['volume_mil_t', n0, 'num'], ['valor_mi_usd', (v) => (v === null ? '—' : AMZ.nf(v)), 'num'], ['preco_usd_t', (v) => (v === null ? '—' : AMZ.nf(v)), 'num']]);
});
const amExp = (prod) => (el) => {
  const r = dash.data('mercado_calc');
  if (r.status !== 'ok') { el.replaceChildren(); return; }
  AMZ.vbar(el, r.data.filter((x) => x.produto === prod), { label: (x) => String(x.ano), value: (x) => +x.volume_mil_t, fmt: n0, aria: 'Exportações por ano',
    tip: (x) => [String(x.ano), AMZ.nf(x.volume_mil_t) + ' mil t', x.preco_usd_t === null ? 'preço não publicado' : 'US$ ' + AMZ.nf(x.preco_usd_t) + '/t'] });
};
dash.draw('cc_exp_grao', amExp('Amendoim descascado'));
dash.draw('cc_exp_oleo', amExp('Óleo de amendoim bruto'));
dash.draw('cc_dest_oleo', (el) => {
  const r = dash.data('destinos');
  if (r.status !== 'ok') { el.replaceChildren(); return; }
  const rows = r.data.filter((x) => x.produto === 'Óleo').sort((a, b) => a.ano - b.ano || b.vol_pct - a.vol_pct);
  AMZ.hbar(el, rows, { label: (x) => x.pais + ' ' + x.ano, value: (x) => +x.vol_pct, max: 100, fmt: (v) => AMZ.nf(v) + '%', hi: (x) => +x.ano === 2025, aria: 'Destinos do óleo em 2024 e 2025' });
});
dash.draw('cc_premio', (el) => {
  const r = dash.data('premio_destino');
  if (r.status !== 'ok') { el.replaceChildren(); return; }
  AMZ.hbar(el, r.data, { label: (x) => x.pais, value: (x) => +x.fator, fmt: (v) => AMZ.nf(v, 2), hi: (x) => x.fator >= 1, aria: 'Prêmio de preço por destino do grão' });
});
dash.draw('tb_tend', (tb) => {
  const r = dash.data('tend_resumo');
  if (r.status !== 'ok') { tb.replaceChildren(); return; }
  amLinhas(tb, r.data, [['serie'], ['mes_ultimo', AMZ.mes], ['ultimo', n2, 'num'], ['mes_final', AMZ.mes], ['proj_final', n2, 'num'], ['lo_final', n2, 'num'], ['hi_final', n2, 'num'], ['var_pct', s1, 'num']]);
});
dash.draw('cc_regionais', (el) => {
  const r = dash.data('regionais_sp');
  if (r.status !== 'ok') { el.replaceChildren(); return; }
  AMZ.hbar(el, r.data, { label: (x) => x.regional, value: (x) => +x.pct, fmt: (v) => AMZ.nf(v, 1) + '%', hi: (x) => ['Tupã', 'Marília', 'Presidente Prudente'].includes(x.regional), aria: 'Participação das regionais na produção paulista' });
});
const amMun = (prod, destaque) => (el) => {
  const r = dash.data('municipios');
  if (r.status !== 'ok') { el.replaceChildren(); return; }
  AMZ.hbar(el, r.data.filter((x) => x.produto === prod), { label: (x) => x.municipio, value: (x) => +x.pct, fmt: (v) => AMZ.nf(v) + '%', hi: (x) => destaque.includes(x.municipio), aria: 'Participação dos municípios' });
};
dash.draw('cc_mun_grao', amMun('Grão', ['Tupã', 'Herculândia', 'Pompéia', 'Bastos']));
dash.draw('cc_mun_oleo', amMun('Óleo', ['Parapuã']));
dash.draw('cc_ranking', (el) => {
  const r = dash.data('ranking_municipios');
  if (r.status !== 'ok') { el.replaceChildren(); return; }
  const alta = ['Pompéia', 'Tupã', 'Herculândia', 'Quintana', 'Iacri', 'Marília'];
  AMZ.hbar(el, [...r.data].sort((a, b) => b.producao_t - a.producao_t), { label: (x) => x.municipio, value: (x) => +x.producao_t, fmt: (v) => AMZ.nf(v) + ' t', hi: (x) => alta.includes(x.municipio), aria: 'Maiores municípios produtores de amendoim em SP, 2025' });
});

// Inteligência de mercado: índices territoriais.
const amNota = (v) => (v === null || v === undefined || v === '' ? 'não informado' : AMZ.nf(v));
dash.draw('ict_tupa', amCampo('ict_resumo', 'indice_tupa', n1));
dash.draw('ict_jab', amCampo('ict_resumo', 'indice_jaboticabal', n1));
dash.draw('ict_tupa_t', amCampo('ict_resumo', 'indice_tupa', n1));
dash.draw('ict_jab_t', amCampo('ict_resumo', 'indice_jaboticabal', n1));
dash.draw('ict_dif', amCampo('ict_resumo', 'diferenca', s1, null, true));
dash.draw('ict_n', amCampo('ict_resumo', 'dimensoes', n0));
dash.draw('ict_total', amCampo('ict_resumo', 'total', n0));
const amIctExtremo = (maior) => (el) => {
  const r = dash.data('ict_calc');
  const rows = r.status === 'ok' ? r.data.filter((x) => x.diferenca !== null) : [];
  if (!rows.length) { el.textContent = '—'; return; }
  const x = rows.reduce((a, b) => (maior ? b.diferenca > a.diferenca : b.diferenca < a.diferenca) ? b : a, rows[0]);
  el.textContent = String(x.dimensao).toLowerCase() + ' (' + AMZ.sg(x.diferenca, 0) + ')';
};
dash.draw('ict_lider', amIctExtremo(true));
dash.draw('ict_gap', amIctExtremo(false));
dash.draw('tb_ict', (tb) => {
  const r = dash.data('ict_calc');
  if (r.status !== 'ok') { tb.replaceChildren(); return; }
  amLinhas(tb, r.data, [['dimensao'], ['tupa', amNota, 'num'], ['jaboticabal', amNota, 'num'], ['diferenca', (v) => (v === null ? '—' : AMZ.sg(v, 0)), 'num']]);
});
dash.draw('ict_barras', (el) => {
  const r = dash.data('indices_ict');
  if (r.status !== 'ok') { el.replaceChildren(); return; }
  el.replaceChildren();
  const rows = r.data, W = Math.max(280, el.clientWidth || 280), bh = 14, g = 4, gap = 18, top = 30;
  const H = top + rows.length * (2 * bh + g + gap);
  const svg = d3.select(el).append('svg').attr('width', '100%').attr('viewBox', `0 0 ${W} ${H}`).attr('role', 'img').attr('aria-label', 'Notas por dimensão, Tupã e Jaboticabal');
  const series = [{ k: 'tupa', nome: 'Tupã', cor: dash.colors[0] }, { k: 'jaboticabal', nome: 'Jaboticabal', cor: dash.colors[1] }];
  let lx = 0;
  series.forEach((s) => {
    const gg = svg.append('g').attr('transform', `translate(${lx},6)`);
    gg.append('rect').attr('width', 10).attr('height', 10).attr('rx', 2).style('fill', s.cor);
    const t = gg.append('text').attr('class', 'am-tick').attr('x', 14).attr('y', 9).text(s.nome);
    lx += 14 + t.node().getComputedTextLength() + 18;
  });
  const lab = svg.append('g').selectAll('text').data(rows).join('text').attr('class', 'am-tick').attr('text-anchor', 'end').text((x) => x.dimensao);
  let lw = 0; lab.each(function () { lw = Math.max(lw, this.getComputedTextLength()); });
  const L = lw + 12, R = 90;
  const x = d3.scaleLinear([0, 100], [L, Math.max(L + 40, W - R)]);
  const y0 = (i) => top + i * (2 * bh + g + gap);
  svg.append('g').selectAll('line').data([0, 25, 50, 75, 100]).join('line').attr('x1', x).attr('x2', x).attr('y1', top - 4).attr('y2', H - gap / 2).attr('stroke', 'var(--cds-chart-grid)');
  lab.attr('x', L - 8).attr('y', (d, i) => y0(i) + bh + g / 2 + 4);
  const tip = AMZ.tip(el);
  rows.forEach((row, i) => {
    series.forEach((s, j) => {
      const v = row[s.k], yy = y0(i) + j * (bh + g);
      if (v === null || v === undefined || v === '') {
        svg.append('text').attr('class', 'am-tick').attr('x', L + 4).attr('y', yy + bh - 3).text('não informado');
      } else {
        svg.append('rect').attr('x', L).attr('y', yy).attr('height', bh).attr('width', Math.max(1, x(+v) - L)).attr('rx', 3).style('fill', s.cor);
        svg.append('text').attr('class', 'am-val').attr('x', x(+v) + 6).attr('y', yy + bh - 3).text(AMZ.nf(v));
      }
    });
    svg.append('rect').attr('x', 0).attr('y', y0(i) - gap / 2).attr('width', W).attr('height', 2 * bh + g + gap).attr('fill', 'transparent')
      .on('mousemove', (ev) => tip.show(ev, [row.dimensao, 'Tupã ' + amNota(row.tupa), 'Jaboticabal ' + amNota(row.jaboticabal)]))
      .on('mouseleave', () => tip.hide());
  });
});
// Dados abertos.
dash.draw('da_bases_t', amCampo('dados_resumo', 'bases', n0));
dash.draw('da_int_t', amCampo('dados_resumo', 'integradas', n0));
dash.draw('da_falta_t', amCampo('dados_resumo', 'a_integrar', n0));
dash.draw('tb_dados', (tb) => {
  const r = dash.data('dados_abertos');
  if (r.status !== 'ok') { tb.replaceChildren(); return; }
  tb.replaceChildren();
  r.data.forEach((row) => {
    const tr = tb.insertRow();
    ['elo', 'fonte', 'conjunto', 'cobertura', 'frequencia', 'no_painel'].forEach((k) => { tr.insertCell().textContent = String(row[k] ?? ''); });
    const td = tr.insertCell();
    const url = String(row.acesso || '');
    if (/^https?:\/\//.test(url)) {
      const a = document.createElement('a');
      a.href = url; a.target = '_blank'; a.rel = 'noopener noreferrer';
      a.textContent = url.replace(/^https?:\/\//, '').replace(/\/$/, '');
      td.appendChild(a);
    } else td.textContent = url;
  });
});
// Custos públicos.
dash.draw('pcu_custo', amCampo('custo_ref', 'custo_sc', n1));
dash.draw('tb_custos', (tb) => {
  const r = dash.data('custos_publicos');
  if (r.status !== 'ok') { tb.replaceChildren(); return; }
  amLinhas(tb, r.data, [['fonte'], ['referencia'], ['indicador'], ['custo_sc', (v) => (v === null || v === undefined ? '—' : AMZ.nf(v, 2)), 'num'], ['nota']]);
});
// Visão executiva.
dash.draw('e_tupa', amCampo('referencias_mercado', 'valor', n2, amRef('mp_tupa')));
dash.draw('e_tupa_d', amCampo('referencias_mercado', 'data', AMZ.dt, amRef('mp_tupa')));
dash.draw('e_media_t', amCampo('pracas_hoje', 'media', n2));
dash.draw('e_custo_t', amCampo('custo_ref', 'custo_sc', n1));
dash.draw('ek_tupa', amCampo('referencias_mercado', 'valor', n2, amRef('mp_tupa')));
dash.draw('ek_media', amCampo('pracas_hoje', 'media', n2));
dash.draw('ek_min', amCampo('pracas_hoje', 'minimo', n2));
dash.draw('ek_max', amCampo('pracas_hoje', 'maximo', n2));
dash.draw('ek_custo', amCampo('custo_ref', 'custo_sc', n1));
dash.draw('ek_cambio', amCampo('referencias_mercado', 'valor', n2, amRef('cambio')));
dash.draw('ek_cambio_d', amCampo('referencias_mercado', 'data', AMZ.dt, amRef('cambio')));
dash.draw('ek_teto', amCampo('resumo_base', 'teto_sc', n1));
dash.draw('ek_ict', amCampo('ict_resumo', 'indice_tupa', n1));
dash.draw('ek_ict_j', amCampo('ict_resumo', 'indice_jaboticabal', n1));
dash.draw('e_cobre', (el) => {
  const c = dash.data('custo_ref'), r = dash.data('referencias_mercado');
  const t = r.status === 'ok' ? r.data.find((x) => x.chave === 'mp_tupa') : null;
  if (c.status !== 'ok' || !t || !c.data[0]) { el.textContent = '—'; return; }
  const d = +t.valor - +c.data[0].custo_sc;
  el.textContent = d >= 0 ? `o preço de Tupã cobre o custo, com folga de R$ ${AMZ.nf(d, 1)} por saca` : `o preço de Tupã fica R$ ${AMZ.nf(-d, 1)} abaixo do custo por saca`;
});
dash.draw('e_m_mesf', amCampo('tend_resumo', 'mes_final', AMZ.mes, amSer('preco_produtor')));
dash.draw('e_m_proj', amCampo('tend_resumo', 'proj_final', n2, amSer('preco_produtor')));
dash.draw('e_m_lo', amCampo('tend_resumo', 'lo_final', n2, amSer('preco_produtor')));
dash.draw('e_m_hi', amCampo('tend_resumo', 'hi_final', n2, amSer('preco_produtor')));
dash.draw('e_m26', amCampo('anual_mensal', 'media', n2, (x) => x.ano === '2026'));
dash.draw('e_m25', amCampo('anual_mensal', 'media', n2, (x) => x.ano === '2025'));
dash.draw('e_m24', amCampo('anual_mensal', 'media', n2, (x) => x.ano === '2024'));
dash.draw('e_mensal', amSerie('preco_produtor', (v) => 'R$ ' + AMZ.nf(v), 'Preço mensal do amendoim desde 2005 e tendência'));
dash.draw('e_anual', (el) => {
  const r = dash.data('anual_mensal');
  if (r.status !== 'ok') { el.replaceChildren(); return; }
  AMZ.vbar(el, r.data, { label: (x) => x.ano.slice(2), value: (x) => +x.media, fmt: (v) => AMZ.nf(v), hi: (x) => x.ano >= '2024', aria: 'Média anual do preço',
    tip: (x) => [x.ano + (x.meses < 12 ? ' (' + x.meses + ' meses)' : ''), 'R$ ' + AMZ.nf(x.media, 2) + ' por saca'] });
});
dash.draw('e_sazonal', (el) => {
  const r = dash.data('sazonal');
  if (r.status !== 'ok') { el.replaceChildren(); return; }
  const top = r.data.reduce((a, b) => (b.indice > a.indice ? b : a), r.data[0]);
  AMZ.hbar(el, r.data, { label: (x) => AMZ.MES[+x.mes - 1], value: (x) => +x.indice - 100, neg: true, fmt: (v) => AMZ.sg(v, 1) + '%', aria: 'Desvio sazonal do preço por mês, em relação à média do ano',
    tip: (x) => [AMZ.MES[+x.mes - 1] + (x === top ? ' · mês mais alto' : ''), 'Índice ' + AMZ.nf(x.indice, 1), 'média de ' + x.anos + ' anos'] });
});
// Gráfico do preço diário, uma linha em degraus por praça.
dash.draw('e_diario', (el) => {
  const r = dash.data('precos_diarios'), c = dash.data('custo_ref');
  if (r.status !== 'ok') { el.replaceChildren(); return; }
  el.replaceChildren();
  const pts = r.data.map((x) => ({ praca: x.praca, d: new Date(String(x.data).slice(0, 10) + 'T12:00:00Z'), data: String(x.data).slice(0, 10), v: +x.preco })).filter((x) => isFinite(x.v));
  if (!pts.length) return;
  const custo = c.status === 'ok' && c.data[0] ? +c.data[0].custo_sc : null;
  const pracas = [...new Set(pts.map((p) => p.praca))].sort((a, b) => (a === 'Tupã' ? -1 : b === 'Tupã' ? 1 : a.localeCompare(b)));
  const cor = (p, i) => (p === 'Tupã' ? dash.colors[0] : dash.colors[(i % 7) + 1]);
  const W = Math.max(300, el.clientWidth || 300), H = 300, T = 34, B = 26;
  const svg = d3.select(el).append('svg').attr('width', '100%').attr('viewBox', `0 0 ${W} ${H}`).attr('role', 'img').attr('aria-label', 'Preço diário do amendoim em casca nas praças paulistas');
  let lx = 0, ly = 6;
  pracas.forEach((p, i) => {
    const gg = svg.append('g');
    gg.append('rect').attr('width', 10).attr('height', 10).attr('rx', 2).style('fill', cor(p, i));
    const t = gg.append('text').attr('class', 'am-tick').attr('x', 14).attr('y', 9).text(p);
    const w = 14 + t.node().getComputedTextLength() + 14;
    if (lx + w > W && lx > 0) { lx = 0; ly += 16; }
    gg.attr('transform', `translate(${lx},${ly})`); lx += w;
  });
  const top = T + (ly - 6);
  const vals = pts.map((p) => p.v).concat(custo ? [custo] : []);
  const y = d3.scaleLinear([d3.min(vals) - 2, d3.max(vals) + 2], [H - B, top]).nice(5);
  const ticks = y.ticks(5);
  const probe = svg.append('g'); let lw = 0;
  probe.selectAll('text').data(ticks).join('text').attr('class', 'am-tick').text((v) => 'R$ ' + AMZ.nf(v)).each(function () { lw = Math.max(lw, this.getComputedTextLength()); });
  probe.remove();
  const L = lw + 10, R = 16;
  const ext = d3.extent(pts, (p) => p.d);
  const x = d3.scaleUtc([d3.utcDay.offset(ext[0], -1), d3.utcDay.offset(ext[1], 1)], [L, W - R]);
  svg.append('g').selectAll('line').data(ticks).join('line').attr('x1', L).attr('x2', W - R).attr('y1', y).attr('y2', y).attr('stroke', 'var(--cds-chart-grid)');
  svg.append('g').selectAll('text').data(ticks).join('text').attr('class', 'am-tick').attr('text-anchor', 'end').attr('x', L - 6).attr('y', (v) => y(v) + 4).text((v) => 'R$ ' + AMZ.nf(v));
  const dias = x.ticks(Math.max(2, Math.floor((W - L - R) / 70)));
  svg.append('g').selectAll('text').data(dias).join('text').attr('class', 'am-tick').attr('text-anchor', 'middle').attr('x', x).attr('y', H - 8).text((d) => String(d.getUTCDate()).padStart(2, '0') + '/' + String(d.getUTCMonth() + 1).padStart(2, '0'));
  if (custo) {
    svg.append('line').attr('x1', L).attr('x2', W - R).attr('y1', y(custo)).attr('y2', y(custo)).attr('stroke', 'var(--cds-chart-reference)').attr('stroke-dasharray', '4 4');
    svg.append('text').attr('class', 'am-tick').attr('x', L + 4).attr('y', y(custo) - 5).text('Custo estimado R$ ' + AMZ.nf(custo, 1));
  }
  pracas.forEach((p, i) => {
    const s = pts.filter((q) => q.praca === p).sort((a, b) => a.d - b.d);
    const tupa = p === 'Tupã';
    svg.append('path').datum(s).attr('d', d3.line().curve(d3.curveStepAfter).x((q) => x(q.d)).y((q) => y(q.v))).attr('fill', 'none').style('stroke', cor(p, i)).attr('stroke-width', tupa ? 2.5 : 1.5).attr('stroke-opacity', tupa ? 1 : 0.7);
    svg.append('g').selectAll('circle').data(s).join('circle').attr('cx', (q) => x(q.d)).attr('cy', (q) => y(q.v)).attr('r', tupa ? 4 : 3).style('fill', cor(p, i));
  });
  const tip = AMZ.tip(el);
  svg.append('rect').attr('x', L).attr('y', top).attr('width', W - L - R).attr('height', H - top - B).attr('fill', 'transparent')
    .on('mousemove', (ev) => {
      const [mx, my] = d3.pointer(ev);
      const q = pts.reduce((a, b) => (Math.hypot(x(b.d) - mx, y(b.v) - my) < Math.hypot(x(a.d) - mx, y(a.v) - my) ? b : a), pts[0]);
      tip.show(ev, [q.praca + ' · ' + AMZ.dt(q.data), 'R$ ' + AMZ.nf(q.v, 2) + ' por saca']);
    })
    .on('mouseleave', () => tip.hide());
});
