// AmendoIA · camada mínima que faz o painel rodar fora do claude.ai.
// Implementa o mesmo contrato usado pelas páginas do painel: dash.data, dash.calc,
// dash.draw, dash.onData, dash.params, dash.setParams, dash.setLink e dash.colors.
(function () {
  const RAW = window.AMZ_DADOS || {};
  const calcs = {}, draws = {}, onDataFns = [];
  const cache = {};
  let params = {};
  let pronto = false;
  const calcular = (id) => {
    if (id in cache) return cache[id];
    if (id in RAW) { cache[id] = RAW[id]; return cache[id]; }
    const c = calcs[id];
    if (!c) return undefined;
    const args = c.inputs.map(calcular);
    if (args.some((a) => a === undefined)) return undefined;
    try { cache[id] = c.fn(...args); } catch (e) { console.error('Cálculo ' + id, e); cache[id] = undefined; }
    return cache[id];
  };
  const desenhar = () => {
    if (!pronto) return;
    onDataFns.forEach((f) => { try { f(); } catch (e) { console.error(e); } });
    for (const [nome, fn] of Object.entries(draws)) {
      document.querySelectorAll('[data-draw="' + nome + '"]').forEach((el) => {
        if (el.closest('[hidden]')) return;
        try { fn(el); } catch (e) { console.error('Desenho ' + nome, e); }
      });
    }
  };
  window.dash = {
    colors: ['#2f6b4f', '#c8892b', '#3d6fb4', '#b4533d', '#7a5aa6', '#4f9a9a', '#8a8f3c', '#a8577e'],
    data(id) {
      const d = calcular(id);
      if (d === undefined) return { status: 'missing', data: [], columns: [] };
      return { status: 'ok', data: d, columns: Array.isArray(d) && d[0] ? Object.keys(d[0]) : [], refreshing: false, meta: [] };
    },
    calc(id, spec) { calcs[id] = spec; },
    loader() {},
    draw(nome, fn) { draws[nome] = typeof fn === 'function' ? fn : (fn && fn.update) || (() => {}); },
    onData(fn) { onDataFns.push(fn); },
    params() { return Object.assign({}, params); },
    setParams(o) { for (const k in o) { if (o[k] === null || o[k] === undefined) delete params[k]; else params[k] = o[k]; } desenhar(); },
    resetParams() { params = {}; desenhar(); },
    setLink(id) { try { history.replaceState(null, '', '#' + id); } catch (e) { /* arquivo local */ } desenhar(); },
    refresh() {},
  };
  window.addEventListener('DOMContentLoaded', () => { pronto = true; desenhar(); });
  let t;
  window.addEventListener('resize', () => { clearTimeout(t); t = setTimeout(desenhar, 150); });
})();
