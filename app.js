// ─── Configuration ───────────────────────────────────────────────
const GROQ_API_KEY = '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';
const GROQ_MODEL   = 'llama-3.3-70b-versatile';

// ─── Generate ────────────────────────────────────────────────────
async function generate() {
  const aime  = document.getElementById('aime').value.trim();
  const doue  = document.getElementById('doue').value.trim();
  const paye  = document.getElementById('paye').value.trim();
  const monde = document.getElementById('monde').value.trim();

  if (!aime && !doue && !monde && !paye) {
    alert('Remplis au moins un champ pour continuer.');
    return;
  }

  const btn = document.getElementById('genBtn');
  btn.disabled = true;
  btn.textContent = 'Analyse…';

  const rz = document.getElementById('results');
  rz.classList.add('show');
  document.getElementById('loadMsg').style.display = 'block';
  document.getElementById('resContent').style.display = 'none';
  document.getElementById('pdfBtn').style.display = 'none';
  rz.scrollIntoView({ behavior: 'smooth', block: 'start' });

  const prompt = `Tu es un expert de la philosophie japonaise de l'ikigaï.
Voici les 4 dimensions d'un étudiant :
- Ce que j'aime : ${aime || '(non renseigné)'}
- Ce pour quoi je suis doué·e : ${doue || '(non renseigné)'}
- Ce pour quoi je peux être payé·e : ${paye || '(non renseigné)'}
- Ce dont le monde a besoin : ${monde || '(non renseigné)'}

Réponds UNIQUEMENT en JSON valide sans backticks ni commentaires, exactement cette structure :
{
  "passion": "1 phrase (20-28 mots) définissant l'intersection aime+doué·e",
  "mission": "1 phrase (20-28 mots) définissant l'intersection aime+monde",
  "vocation": "1 phrase (20-28 mots) définissant l'intersection doué·e+monde",
  "profession": "1 phrase (20-28 mots) définissant l'intersection doué·e+payé·e",
  "ikigai": "1 phrase de synthèse (30-40 mots) qui fait le lien concret entre les 4 intersections et résume la raison d'être de cet étudiant. Pas de métaphore poétique, une phrase claire et directe."
}`;

  try {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${GROQ_API_KEY}`
      },
      body: JSON.stringify({
        model: GROQ_MODEL,
        max_tokens: 800,
        temperature: 0.7,
        messages: [
          { role: 'system', content: 'Tu es un expert de la philosophie japonaise de l\'ikigaï. Tu réponds toujours en JSON valide uniquement, sans backticks ni commentaires.' },
          { role: 'user', content: prompt }
        ]
      })
    });

    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    const data = await response.json();
    const text = data.choices[0].message.content;
    const p = JSON.parse(text.replace(/```json|```/g, '').trim());

    document.getElementById('r-passion').textContent    = p.passion    || '—';
    document.getElementById('r-mission').textContent    = p.mission    || '—';
    document.getElementById('r-vocation').textContent   = p.vocation   || '—';
    document.getElementById('r-profession').textContent = p.profession || '—';
    document.getElementById('r-ikigai').textContent     = p.ikigai     || '—';

    document.getElementById('loadMsg').style.display    = 'none';
    document.getElementById('resContent').style.display = 'block';
    document.getElementById('pdfBtn').style.display     = 'flex';

  } catch (e) {
    document.getElementById('loadMsg').textContent = 'Une erreur est survenue. Réessaie dans quelques instants.';
    console.error(e);
  }

  btn.disabled = false;
  btn.textContent = 'Révéler mon ikigaï';
}

// ─── Reset ───────────────────────────────────────────────────────
function resetAll() {
  ['aime', 'doue', 'paye', 'monde'].forEach(id => {
    document.getElementById(id).value = '';
  });
  document.getElementById('results').classList.remove('show');
  document.getElementById('pdfBtn').style.display = 'none';
}

// ─── PDF Download ─────────────────────────────────────────────────
function downloadPDF() {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const W = 210, H = 297, M = 20;

  doc.setFillColor(250, 248, 245);
  doc.rect(0, 0, W, H, 'F');

  doc.setDrawColor(184, 151, 106);
  doc.setLineWidth(0.3);
  doc.rect(M - 5, M - 5, W - 2 * (M - 5), H - 2 * (M - 5));

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(184, 151, 106);
  doc.text('MON IKIGAI  ·  生き甲斐', W / 2, M + 2, { align: 'center' });

  doc.setLineWidth(0.2);
  doc.setDrawColor(220, 196, 154);
  doc.line(M + 10, M + 8, W - M - 10, M + 8);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(22);
  doc.setTextColor(44, 37, 32);
  doc.text('Mon Ikigaï', W / 2, M + 22, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(160, 150, 144);
  doc.text("Ma raison d'être", W / 2, M + 30, { align: 'center' });

  let y = M + 44;

  const fields = [
    { num: "01 · 愛", title: "Ce que j'aime",                    id: 'aime',  r: 242, g: 196, b: 206 },
    { num: "02 · 才", title: "Ce pour quoi je suis doué·e",      id: 'doue',  r: 176, g: 188, b: 219 },
    { num: "03 · 業", title: "Ce pour quoi je peux être payé·e", id: 'paye',  r: 220, g: 196, b: 154 },
    { num: "04 · 世", title: "Ce dont le monde a besoin",        id: 'monde', r: 168, g: 200, b: 168 }
  ];

  fields.forEach(f => {
    const val = document.getElementById(f.id).value.trim() || '—';
    const lines = doc.splitTextToSize(val, W - 2 * M - 12);
    const bh = 18 + lines.length * 5;

    doc.setFillColor(f.r, f.g, f.b, 0.15);
    doc.roundedRect(M, y, W - 2 * M, bh, 3, 3, 'F');

    doc.setDrawColor(f.r, f.g, f.b);
    doc.setLineWidth(0.5);
    doc.line(M, y + 1, M, y + bh - 1);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(f.r * 0.6, f.g * 0.6, f.b * 0.6);
    doc.text(f.num, M + 6, y + 7);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.setTextColor(44, 37, 32);
    doc.text(f.title, M + 6, y + 13);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(80, 70, 65);
    doc.text(lines, M + 6, y + 20);

    y += bh + 4;
  });

  y += 4;
  doc.setLineWidth(0.2);
  doc.setDrawColor(220, 196, 154);
  doc.line(M, y, W - M, y);
  y += 8;

  const sections = [
    { lbl: 'PASSION',    txt: document.getElementById('r-passion').textContent,    r: 176, g: 86,  b: 106 },
    { lbl: 'MISSION',    txt: document.getElementById('r-mission').textContent,    r: 74,  g: 128, b: 80  },
    { lbl: 'VOCATION',   txt: document.getElementById('r-vocation').textContent,   r: 58,  g: 72,  b: 112 },
    { lbl: 'PROFESSION', txt: document.getElementById('r-profession').textContent, r: 154, g: 112, b: 64  }
  ];

  const cw = (W - 2 * M - 4) / 2;
  sections.forEach((s, i) => {
    const cx = M + (i % 2) * (cw + 4);
    const cy = y + Math.floor(i / 2) * 28;
    const lines = doc.splitTextToSize(s.txt || '—', cw - 8);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.setTextColor(s.r, s.g, s.b);
    doc.text(s.lbl, cx + 4, cy + 6);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(44, 37, 32);
    doc.text(lines, cx + 4, cy + 11);
  });

  y += Math.ceil(sections.length / 2) * 28 + 6;

  doc.setFillColor(44, 37, 32);
  doc.roundedRect(M, y, W - 2 * M, 28, 4, 4, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(184, 151, 106);
  doc.text('TON IKIGAÏ', W / 2, y + 7, { align: 'center' });

  const iLines = doc.splitTextToSize(document.getElementById('r-ikigai').textContent || '—', W - 2 * M - 16);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(250, 248, 245);
  doc.text(iLines, W / 2, y + 14, { align: 'center' });

  doc.setFontSize(7.5);
  doc.setTextColor(184, 151, 106);
  doc.text('ikigai · 生き甲斐', W / 2, H - M + 2, { align: 'center' });

  doc.save('mon-ikigai.pdf');
}
