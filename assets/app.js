// ====== Config ======
const DATA_URL = '/inventory/t37.csv'; // later you can swap to your Google pub?output=csv

// ====== DOM ======
const rows = document.getElementById('rows');
const q = document.getElementById('q');
const cond = document.getElementById('cond');
const minqty = document.getElementById('minqty');
const count = document.getElementById('count');
const clearBtn = document.getElementById('clear');
const exportBtn = document.getElementById('exportSel');
const selectedBox = document.getElementById('selected');
const quoteForm = document.getElementById('quoteForm');
const mailtoLink = document.getElementById('mailtoLink');

document.getElementById('yr').textContent = new Date().getFullYear();
window.addEventListener('error', e => { if (count) count.textContent = 'Error: ' + e.message; });

let INVENTORY = [];
const state = { sel: new Set(), rowMap: new Map() };

// ====== Helpers ======
function norm(r){
  const has = (o,k)=>Object.prototype.hasOwnProperty.call(o,k) && o[k]!=='' && o[k]!=null;
  const s = v => (v==null ? '' : String(v).trim());
  const n = v => { const m = String(v||'').replace(/[^0-9-]/g,''); return m ? parseInt(m,10) : 0; };

  const pn   = has(r,'pn')?r.pn:(has(r,'PARTNUMBER')?r.PARTNUMBER:'');
  const nsn  = has(r,'nsn')?r.nsn:(has(r,'NSN')?r.NSN:'');
  const alt  = has(r,'alt')?r.alt:(has(r,'ALTERNATEPARTNUMBER')?r.ALTERNATEPARTNUMBER:'');
  const desc = has(r,'desc')?r.desc:(has(r,'DESCRIPTION')?r.DESCRIPTION:'');
  const cnd  = has(r,'cond')?r.cond:(has(r,'CONDITIONCD')?r.CONDITIONCD:'');
  const qty  = has(r,'qty')?r.qty:(has(r,'QUANTITY')?r.QUANTITY:'');

  return { pn:s(pn), nsn:s(nsn), alt:s(alt), desc:s(desc), cond:s(cnd), qty:n(qty) };
}

function render(){
  const term = (q?.value || '').toLowerCase();
  const c = cond?.value || '';
  const mq = Number(minqty?.value || 0);

  const filtered = INVENTORY.filter(r => {
    const hay = (r.pn + ' ' + r.nsn + ' ' + r.alt + ' ' + r.desc).toLowerCase();
    return hay.includes(term) && (!c || r.cond === c) && ((r.qty||0) >= mq);
  });

  rows.innerHTML = '';
  state.rowMap.clear();

  filtered.forEach(r => {
    const key = (r.pn||'') + '|' + (r.nsn||'');
    state.rowMap.set(key, r);

    const tr = document.createElement('tr');
    tr.className = 'hover:bg-gray-50';
    tr.innerHTML =
      '<td class="p-3 align-top"><input type="checkbox" data-key="'+key+'" class="accent-blue-600"/></td>'+
      '<td class="p-3 sticky-col font-medium">'+(r.pn||'')+'</td>'+
      '<td class="p-3">'+(r.nsn||'')+'</td>'+
      '<td class="p-3">'+(r.alt||'')+'</td>'+
      '<td class="p-3">'+(r.desc||'')+'</td>'+
      '<td class="p-3">'+(r.cond||'')+'</td>'+
      '<td class="p-3">'+((r.qty??'')+'')+'</td>';
    rows.appendChild(tr);
  });

  count.textContent = filtered.length + ' line item(s)';

  rows.querySelectorAll('input[type="checkbox"]').forEach(cb=>{
    cb.addEventListener('change', e=>{
      const k = e.target.getAttribute('data-key');
      if (e.target.checked) state.sel.add(k); else state.sel.delete(k);
      updateSelectedBox();
    });
  });

  updateSelectedBox();
}

function updateSelectedBox(){
  const selected = Array.from(state.sel).map(k => state.rowMap.get(k)).filter(Boolean);
  const text = selected
    .map(r => `PN ${r.pn} | ${r.desc} | Cond ${r.cond} | Qty ${r.qty}${r.nsn ? ` | NSN ${r.nsn}` : ''}`)
    .join('\n'); // newline OK
  if (selectedBox) selectedBox.value = text;
}

function composeMailto(){
  const to = 'sales@yourco.example';
  const subject = 'RFQ: Cessna T-37 spares';
  const body =
    `Name: ${document.getElementById('name').value || ''}\n` +
    `Email: ${document.getElementById('email').value || ''}\n` +
    `Phone: ${document.getElementById('phone').value || ''}\n\n` +
    `Notes:\n${document.getElementById('notes').value || ''}\n\n` +
    `Selected Line Items:\n${selectedBox.value || ''}`;

  const href = 'mailto:' + encodeURIComponent(to) +
               '?subject=' + encodeURIComponent(subject) +
               '&body=' + encodeURIComponent(body);
  mailtoLink.href = href;
  mailtoLink.classList.remove('hidden');
  mailtoLink.click();
  document.getElementById('formStatus').classList.remove('hidden');
  setTimeout(()=>document.getElementById('formStatus').classList.add('hidden'), 4000);
}

// events (no inline handlers)
q?.addEventListener('input', render);
cond?.addEventListener('change', render);
minqty?.addEventListener('input', render);
clearBtn?.addEventListener('click', ()=>{ if(q) q.value=''; if(cond) cond.value=''; if(minqty) minqty.value=''; state.sel.clear(); render(); });
exportBtn?.addEventListener('click', ()=>{
  if (!state.sel.size) { alert('Select at least one line.'); return; }
  document.getElementById('quote').scrollIntoView({ behavior:'smooth' });
});
quoteForm?.addEventListener('submit', (e)=>{ e.preventDefault(); composeMailto(); });

// load data
function loadData(){
  const url = DATA_URL + (DATA_URL.includes('?') ? '&' : '?') + 't=' + Date.now();
  fetch(url, { cache:'no-store' })
    .then(res => { if (!res.ok) throw new Error('CSV HTTP '+res.status); return res.text(); })
    .then(text => {
      Papa.parse(text, { header:true, skipEmptyLines:true, dynamicTyping:false,
        complete: (r)=>{ INVENTORY = r.data.map(norm); render(); }
      });
    })
    .catch(err => { console.error(err); if (count) count.textContent = 'Failed to load data.'; });
}
loadData();
