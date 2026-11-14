#!/usr/bin/env node
/* Coletor de jogos do dia.
   Lê uma ou mais fontes (uma por linha na variável FONTES), normaliza e
   grava docs/jogos.json. Se nenhuma fonte responder, mantém o arquivo
   anterior intacto — assim o app nunca fica sem lista. */
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';

const SAIDA = 'docs/jogos.json';
const FONTES = (process.env.FONTES || '').split(/[\n;]+/).map(s => s.trim()).filter(Boolean);

if (!FONTES.length) {
  console.error('Defina a variável FONTES com pelo menos um endereço.');
  process.exit(1);
}

const PULA = /score|placar|gol|logo|img|image|escudo|url|_id$|^id$|icon|bandeira/i;
const pick = (o, ks) => { for (const k of ks) if (o[k] != null && o[k] !== '') return o[k]; return '' };
const find = (o, rx) => {
  for (const k of Object.keys(o)) {
    if (PULA.test(k) || !rx.test(k)) continue;
    const v = o[k];
    if (v != null && v !== '' && (typeof v !== 'object' || Array.isArray(v))) return v;
  }
  return '';
};
const canais = v => [].concat(v || [])
  .flatMap(x => typeof x === 'string'
    ? x.split(/\s*(?:,|\/|\||\be\b|\+(?!\s*$))\s*/i)
    : [String((x && (x.nome || x.name || x.canal || x.title || x.emissora)) || '')])
  .map(s => s.trim()).filter(s => s.length > 1);

function normalizar(o) {
  if (!o || typeof o !== 'object') return null;
  const time1 = String(pick(o, ['time1', 'home', 'mandante', 'timeA', 'team1', 'equipe1', 'casa', 'home_team'])
    || find(o, /^(time_?1|mandante|casa|home|team_?1|equipe_?1)/i)).trim();
  const time2 = String(pick(o, ['time2', 'away', 'visitante', 'timeB', 'team2', 'equipe2', 'fora', 'away_team'])
    || find(o, /^(time_?2|visitante|fora|away|team_?2|equipe_?2)/i)).trim();
  if (!time1 || !time2) return null;

  const horario = String(pick(o, ['horario', 'hora', 'time', 'hour', 'start_time', 'kickoff', 'inicio'])
    || find(o, /(horario|hora|quando|kick|inicio)/i)).trim();
  const st0 = String(pick(o, ['status', 'situacao', 'state']) || find(o, /(status|situac|state)/i)).toLowerCase();
  const status = /ao.?vivo|live|andamento|1t|2t|intervalo/.test(st0) ? 'ao_vivo'
    : /encerr|finaliz|finished|ft|fim/.test(st0) ? 'encerrado' : '';

  let p1 = pick(o, ['placar_time1', 'gols1', 'score_home', 'placar1', 'home_score']);
  let p2 = pick(o, ['placar_time2', 'gols2', 'score_away', 'placar2', 'away_score']);
  if (p1 === '' && p2 === '') {
    const m = String(pick(o, ['placar', 'score', 'resultado', 'marcador'])).match(/^(\d+)\s*[-x×:]\s*(\d+)$/i);
    if (m) { p1 = m[1]; p2 = m[2] }
  }

  return {
    competicao: String(pick(o, ['competicao', 'campeonato', 'liga', 'league', 'competition', 'torneio'])
      || find(o, /(competic|campeonato|liga|league|torneio)/i)).trim(),
    horario,
    data_jogo: String(pick(o, ['data_jogo', 'data', 'date', 'dia'])).trim() || 'hoje',
    time1, time2,
    status,
    placar_time1: p1 === '' ? '' : String(p1),
    placar_time2: p2 === '' ? '' : String(p2),
    minuto: String(pick(o, ['minuto', 'minute', 'tempo', 'clock'])).trim(),
    canais: canais(pick(o, ['canal', 'canais', 'emissora', 'emissoras', 'transmissao', 'tv', 'channels', 'broadcast'])
      || find(o, /(canal|canais|emissora|transmiss|onde_?assistir|broadcast|channel)/i))
  };
}

async function ler(url) {
  const tok = (url.match(/[?&](?:token|api_key|apikey|key)=([^&]+)/) || [])[1];
  let r = await fetch(url, { headers: { 'User-Agent': 'streamhub-jogos/1.0' } });
  if ((r.status === 401 || r.status === 403) && tok) {
    r = await fetch(url, { headers: { 'X-API-Token': decodeURIComponent(tok), 'User-Agent': 'streamhub-jogos/1.0' } });
  }
  if (!r.ok) throw new Error('HTTP ' + r.status);
  const j = await r.json();
  const arr = Array.isArray(j) ? j : (j && (j.data || j.jogos || j.games || j.events || j.matches || j.partidas || j.result)) || [];
  const jogos = (Array.isArray(arr) ? arr : []).map(normalizar).filter(Boolean);
  if (!jogos.length) throw new Error('nenhum jogo reconhecido (' + (Array.isArray(arr) ? arr.length : 0) + ' itens)');
  return jogos;
}

const main = async () => {
  for (const url of FONTES) {
    const nome = (url.split('//')[1] || url).split('/')[0];
    try {
      const jogos = await ler(url);
      mkdirSync('docs', { recursive: true });
      const saida = { atualizado_em: new Date().toISOString(), fonte: nome, total: jogos.length, jogos };
      let antes = '';
      if (existsSync(SAIDA)) { try { antes = JSON.stringify(JSON.parse(readFileSync(SAIDA, 'utf8')).jogos) } catch { } }
      if (antes === JSON.stringify(jogos)) {
        console.log(`sem mudança (${jogos.length} jogos de ${nome})`);
        process.exit(0);
      }
      writeFileSync(SAIDA, JSON.stringify(saida, null, 1));
      console.log(`gravado: ${jogos.length} jogos de ${nome}`);
      process.exit(0);
    } catch (e) {
      console.error(`falhou em ${nome}: ${e.message}`);
    }
  }
  console.error('Nenhuma fonte respondeu. Mantendo o arquivo anterior.');
  process.exit(existsSync(SAIDA) ? 0 : 1);
};
main();
