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
  btn.textContent = 'Analyse...';

  const rz = document.getElementById('results');
  rz.classList.add('show');
  document.getElementById('loadMsg').style.display = 'block';
  document.getElementById('resContent').style.display = 'none';
  document.getElementById('pdfBtn').style.display = 'none';
  rz.scrollIntoView({ behavior: 'smooth', block: 'start' });

  const prompt = `Tu es un expert de la philosophie japonaise de l'ikigai.
Voici les 4 dimensions d'un etudiant :
- Ce que j'aime : ${aime || '(non renseigne)'}
- Ce pour quoi je suis doue : ${doue || '(non renseigne)'}
- Ce pour quoi je peux etre paye : ${paye || '(non renseigne)'}
- Ce dont le monde a besoin : ${monde || '(non renseigne)'}

Reponds UNIQUEMENT en JSON valide sans backticks ni commentaires, exactement cette structure :
{
  "passion": "1 phrase (20-28 mots) definissant l'intersection aime+doue",
  "mission": "1 phrase (20-28 mots) definissant l'intersection aime+monde",
  "vocation": "1 phrase (20-28 mots) definissant l'intersection doue+monde",
  "profession": "1 phrase (20-28 mots) definissant l'intersection doue+paye",
  "ikigai": "1 phrase de synthese (30-40 mots) qui fait le lien concret entre les 4 intersections et resume la raison d'etre de cet etudiant. Pas de metaphore poetique, une phrase claire et directe."
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
          { role: 'system', content: 'Tu es un expert de la philosophie japonaise de l\'ikigai. Tu reponds toujours en JSON valide uniquement, sans backticks ni commentaires.' },
          { role: 'user', content: prompt }
        ]
      })
    });

    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    const data = await response.json();
    const text = data.choices[0].message.content;
    const p = JSON.parse(text.replace(/```json|```/g, '').trim());

    document.getElementById('r-passion').textContent    = p.passion    || '-';
    document.getElementById('r-mission').textContent    = p.mission    || '-';
    document.getElementById('r-vocation').textContent   = p.vocation   || '-';
    document.getElementById('r-profession').textContent = p.profession || '-';
    document.getElementById('r-ikigai').textContent     = p.ikigai     || '-';

    document.getElementById('loadMsg').style.display    = 'none';
    document.getElementById('resContent').style.display = 'block';
    document.getElementById('pdfBtn').style.display     = 'flex';

  } catch (e) {
    document.getElementById('loadMsg').textContent = 'Une erreur est survenue. Reessaie dans quelques instants.';
    console.error(e);
  }

  btn.disabled = false;
  btn.textContent = 'Reveler mon ikigai';
}

// ─── Reset ───────────────────────────────────────────────────────
function resetAll() {
  ['aime', 'doue', 'paye', 'monde'].forEach(id => {
    document.getElementById(id).value = '';
  });
  document.getElementById('results').classList.remove('show');
  document.getElementById('pdfBtn').style.display = 'none';
}

// ─── Helpers PDF ─────────────────────────────────────────────────
function addPage(doc) {
  doc.addPage();
  doc.setFillColor(250, 248, 245);
  doc.rect(0, 0, 210, 297, 'F');
  return 20;
}

function blockField(doc, y, W, M, label, num, val, rc) {
  const lineH = 5;
  const lines = doc.splitTextToSize(val || '-', W - 2*M - 14);
  const bh = 10 + lines.length * lineH + 8;

  if (y + bh > 275) { y = addPage(doc); }

  // fond clair
  doc.setFillColor(rc[0], rc[1], rc[2]);
  doc.setGState(doc.GState({ opacity: 0.12 }));
  doc.roundedRect(M, y, W - 2*M, bh, 3, 3, 'F');
  doc.setGState(doc.GState({ opacity: 1 }));

  // barre coloree gauche
  doc.setFillColor(rc[0], rc[1], rc[2]);
  doc.rect(M, y, 3, bh, 'F');

  // numero + titre
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.setTextColor(rc[0]*0.55, rc[1]*0.55, rc[2]*0.55);
  doc.text(num, M + 7, y + 6);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(44, 37, 32);
  doc.text(label, M + 7, y + 12);

  // contenu
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(70, 60, 55);
  doc.text(lines, M + 7, y + 19);

  return y + bh + 4;
}

function blockIntersection(doc, y, W, M, label, txt, rc) {
  const lines = doc.splitTextToSize(txt || '-', W - 2*M - 14);
  const bh = 8 + lines.length * 5 + 6;

  if (y + bh > 275) { y = addPage(doc); }

  doc.setFillColor(rc[0], rc[1], rc[2]);
  doc.setGState(doc.GState({ opacity: 0.1 }));
  doc.roundedRect(M, y, W - 2*M, bh, 3, 3, 'F');
  doc.setGState(doc.GState({ opacity: 1 }));

  doc.setFillColor(rc[0], rc[1], rc[2]);
  doc.rect(M, y, 3, bh, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(rc[0]*0.6, rc[1]*0.6, rc[2]*0.6);
  doc.text(label, M + 7, y + 7);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(44, 37, 32);
  doc.text(lines, M + 7, y + 13);

  return y + bh + 4;
}

// ─── PDF Download ─────────────────────────────────────────────────
function downloadPDF() {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const W = 210, M = 18;

  // ── PAGE 1 : fond + en-tete ──
  doc.setFillColor(250, 248, 245);
  doc.rect(0, 0, W, 297, 'F');

  // Cadre or
  doc.setDrawColor(184, 151, 106);
  doc.setLineWidth(0.4);
  doc.rect(10, 10, 190, 277);

  // Titre
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.setTextColor(184, 151, 106);
  doc.text('MON IKIGAI', W/2, 20, { align: 'center' });

  doc.setLineWidth(0.15);
  doc.setDrawColor(200, 170, 120);
  doc.line(M+10, 23, W-M-10, 23);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(24);
  doc.setTextColor(44, 37, 32);
  doc.text('Mon Ikigai', W/2, 34, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(150, 140, 130);
  doc.text("Ma raison d'etre", W/2, 41, { align: 'center' });

  doc.setLineWidth(0.15);
  doc.setDrawColor(200, 170, 120);
  doc.line(M+10, 45, W-M-10, 45);

  let y = 52;

  // ── 4 CHAMPS ──
  const fields = [
    { num: '01', label: "Ce que j'aime",                    id: 'aime',  rc: [220, 160, 175] },
    { num: '02', label: "Ce pour quoi je suis doue(e)",     id: 'doue',  rc: [140, 155, 210] },
    { num: '03', label: "Ce pour quoi je peux etre paye(e)",id: 'paye',  rc: [195, 165, 110] },
    { num: '04', label: "Ce dont le monde a besoin",        id: 'monde', rc: [120, 175, 130] }
  ];

  fields.forEach(f => {
    const val = document.getElementById(f.id).value.trim();
    y = blockField(doc, y, W, M, f.label, f.num, val, f.rc);
  });

  // ── PAGE 2 : Synthese ──
  y = addPage(doc);

  // Cadre or page 2
  doc.setDrawColor(184, 151, 106);
  doc.setLineWidth(0.4);
  doc.rect(10, 10, 190, 277);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.setTextColor(184, 151, 106);
  doc.text('MON IKIGAI - SYNTHESE', W/2, 20, { align: 'center' });

  doc.setLineWidth(0.15);
  doc.setDrawColor(200, 170, 120);
  doc.line(M+10, 23, W-M-10, 23);

  y = 32;

  // ── 4 INTERSECTIONS ──
  const sections = [
    { label: 'PASSION',    id: 'r-passion',    rc: [200, 100, 120] },
    { label: 'MISSION',    id: 'r-mission',    rc: [80,  150,  90] },
    { label: 'VOCATION',   id: 'r-vocation',   rc: [80,  100, 175] },
    { label: 'PROFESSION', id: 'r-profession', rc: [185, 140,  70] }
  ];

  sections.forEach(s => {
    const txt = document.getElementById(s.id).textContent;
    y = blockIntersection(doc, y, W, M, s.label, txt, s.rc);
  });

  y += 4;
  doc.setLineWidth(0.15);
  doc.setDrawColor(200, 170, 120);
  doc.line(M, y, W-M, y);
  y += 8;

  // ── BLOC IKIGAI CENTRAL ──
  const ikigaiTxt = document.getElementById('r-ikigai').textContent || '-';
  const ikigaiLines = doc.splitTextToSize(ikigaiTxt, W - 2*M - 16);
  const ikBh = 14 + ikigaiLines.length * 5.5 + 8;

  doc.setFillColor(44, 37, 32);
  doc.roundedRect(M, y, W - 2*M, ikBh, 4, 4, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(184, 151, 106);
  doc.text('TON IKIGAI', W/2, y + 8, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.5);
  doc.setTextColor(245, 240, 232);
  doc.text(ikigaiLines, W/2, y + 15, { align: 'center' });

  y += ikBh + 10;

  // ── SCHEMA SVG en image ──
  const svgEl = document.querySelector('.svg-wrap svg');
  if (svgEl && typeof window.canvg !== 'undefined') {
    // fallback si canvg disponible
  }

  // Légende textuelle du schema (remplacement simple)
  if (y + 60 > 275) { y = addPage(doc); }

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(184, 151, 106);
  doc.text('SCHEMA IKIGAI', W/2, y, { align: 'center' });
  y += 5;

  const schema = [
    { label: 'Passion',    desc: 'Ce que tu aimes  +  Ce pour quoi tu es doue(e)',       rc: [200, 100, 120] },
    { label: 'Mission',    desc: 'Ce que tu aimes  +  Ce dont le monde a besoin',         rc: [80,  150,  90] },
    { label: 'Vocation',   desc: 'Ce pour quoi tu es doue(e)  +  Ce dont le monde a besoin', rc: [80, 100, 175] },
    { label: 'Profession', desc: 'Ce pour quoi tu es doue(e)  +  Ce pour quoi tu peux etre paye(e)', rc: [185, 140, 70] }
  ];

  schema.forEach(s => {
    if (y + 10 > 275) { y = addPage(doc); }
    doc.setFillColor(s.rc[0], s.rc[1], s.rc[2]);
    doc.circle(M + 3, y + 2, 2, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(s.rc[0]*0.6, s.rc[1]*0.6, s.rc[2]*0.6);
    doc.text(s.label, M + 8, y + 4);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(100, 90, 85);
    doc.text(s.desc, M + 8, y + 9);
    y += 14;
  });

  // Pied de page
  doc.setFontSize(7);
  doc.setTextColor(184, 151, 106);
  doc.text('ikigai - ma raison d\'etre', W/2, 284, { align: 'center' });

  doc.save('mon-ikigai.pdf');
}
