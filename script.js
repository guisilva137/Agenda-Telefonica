/* ===== DADOS (ficam só em memória) ===== */
let contatos = [];               // cada item: {id, nome, telefone, email}
let compromissos = [];           // cada item: {id, titulo, data, hora, contatoId}
let proximoId = 1;               // gera um número único para cada item
let editandoContato = null;      // id do contato em edição (ou null)
let editandoCompromisso = null;  // id do compromisso em edição (ou null)

// Atalho para buscar um elemento da página pelo id
const $ = (id) => document.getElementById(id);

/* Mostra uma mensagem de erro (vermelha) ou de sucesso (laranja) */
function mostrarMsg(idMsg, texto, ehErro) {
  const el = $(idMsg);
  el.textContent = texto;
  el.className = "msg " + (ehErro ? "erro" : "ok");
}

/* Evita que o texto digitado seja interpretado como código HTML */
function esc(t) {
  return String(t).replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

/* ===== CONTATOS: cadastrar, validar e editar ===== */
function salvarContato() {
  const nome = $("c-nome").value.trim();
  const telefone = $("c-tel").value.trim();
  const email = $("c-email").value.trim();

  // Validação: lista o que precisa ser corrigido
  const faltando = [];
  if (!nome) faltando.push("nome");
  if (!telefone) faltando.push("telefone");
  if (faltando.length > 0) {
    mostrarMsg("c-msg", "Preencha: " + faltando.join(" e ") + ".", true);
    return; // para aqui: não salva
  }

  if (editandoContato !== null) {
    // Modo edição: atualiza o contato existente
    const c = contatos.find((x) => x.id === editandoContato);
    c.nome = nome;
    c.telefone = telefone;
    c.email = email;
    mostrarMsg("c-msg", "Contato atualizado.", false);
  } else {
    // Modo cadastro: cria um contato novo
    contatos.push({ id: proximoId++, nome, telefone, email });
    mostrarMsg("c-msg", "Contato salvo.", false);
  }
  limparFormContato();
  renderTudo();
}

function editarContato(id) {
  const c = contatos.find((x) => x.id === id);
  $("c-nome").value = c.nome;
  $("c-tel").value = c.telefone;
  $("c-email").value = c.email;
  editandoContato = id;
  $("c-salvar").textContent = "Atualizar contato";
  $("c-cancelar").hidden = false;
  $("c-nome").focus();
}

function limparFormContato() {
  $("c-nome").value = "";
  $("c-tel").value = "";
  $("c-email").value = "";
  editandoContato = null;
  $("c-salvar").textContent = "Salvar contato";
  $("c-cancelar").hidden = true;
}

/* ===== CONTATOS: excluir ===== */
function excluirContato(id) {
  const c = contatos.find((x) => x.id === id);
  if (!confirm('Excluir o contato "' + c.nome + '"?')) return;

  contatos = contatos.filter((x) => x.id !== id);
  // Compromissos ligados a ele continuam, mas ficam sem contato
  compromissos.forEach((p) => { if (p.contatoId === id) p.contatoId = null; });
  if (editandoContato === id) limparFormContato();
  mostrarMsg("c-msg", "Contato excluído.", false);
  renderTudo();
}

/* ===== COMPROMISSOS: cadastrar, validar e editar ===== */
function salvarCompromisso() {
  const titulo = $("p-titulo").value.trim();
  const data = $("p-data").value;
  const hora = $("p-hora").value;
  const contatoId = $("p-contato").value ? Number($("p-contato").value) : null;

  const faltando = [];
  if (!titulo) faltando.push("título");
  if (!data) faltando.push("data");
  if (!hora) faltando.push("horário");
  if (faltando.length > 0) {
    mostrarMsg("p-msg", "Preencha: " + faltando.join(", ") + ".", true);
    return;
  }

  if (editandoCompromisso !== null) {
    const p = compromissos.find((x) => x.id === editandoCompromisso);
    p.titulo = titulo;
    p.data = data;
    p.hora = hora;
    p.contatoId = contatoId;
    mostrarMsg("p-msg", "Compromisso atualizado.", false);
  } else {
    compromissos.push({ id: proximoId++, titulo, data, hora, contatoId });
    mostrarMsg("p-msg", "Compromisso salvo.", false);
  }
  limparFormCompromisso();
  renderTudo();
}

function editarCompromisso(id) {
  const p = compromissos.find((x) => x.id === id);
  $("p-titulo").value = p.titulo;
  $("p-data").value = p.data;
  $("p-hora").value = p.hora;
  $("p-contato").value = p.contatoId === null ? "" : String(p.contatoId);
  editandoCompromisso = id;
  $("p-salvar").textContent = "Atualizar compromisso";
  $("p-cancelar").hidden = false;
  $("p-titulo").focus();
}

function limparFormCompromisso() {
  $("p-titulo").value = "";
  $("p-data").value = "";
  $("p-hora").value = "";
  $("p-contato").value = "";
  editandoCompromisso = null;
  $("p-salvar").textContent = "Salvar compromisso";
  $("p-cancelar").hidden = true;
}

/* ===== COMPROMISSOS: excluir ===== */
function excluirCompromisso(id) {
  const p = compromissos.find((x) => x.id === id);
  if (!confirm('Excluir o compromisso "' + p.titulo + '"?')) return;

  compromissos = compromissos.filter((x) => x.id !== id);
  if (editandoCompromisso === id) limparFormCompromisso();
  mostrarMsg("p-msg", "Compromisso excluído.", false);
  renderTudo();
}

/* ===== LISTAGEM: desenha as listas na tela ===== */
function formatarData(iso) { // "2026-10-05" vira "05/10/2026"
  const [ano, mes, dia] = iso.split("-");
  return dia + "/" + mes + "/" + ano;
}

function renderTudo() {
  // Contatos em ordem alfabética (ignora maiúsculas e acentos)
  const listaC = [...contatos].sort((a, b) =>
    a.nome.localeCompare(b.nome, "pt-BR", { sensitivity: "base" }));

  $("c-lista").innerHTML = listaC.length
    ? listaC.map((c) => `
        <li>
          <div>
            <strong>${esc(c.nome)}</strong>
            <small>${esc(c.telefone)}${c.email ? " · " + esc(c.email) : ""}</small>
          </div>
          <div>
            <button class="mini sec" onclick="editarContato(${c.id})">Editar</button>
            <button class="mini perigo" onclick="excluirContato(${c.id})">Excluir</button>
          </div>
        </li>`).join("")
    : '<li class="vazio">Nenhum contato cadastrado.</li>';

  // Compromissos por data e depois horário (formato ISO compara bem como texto)
  const listaP = [...compromissos].sort((a, b) =>
    (a.data + a.hora).localeCompare(b.data + b.hora));

  $("p-lista").innerHTML = listaP.length
    ? listaP.map((p) => {
        const ct = contatos.find((c) => c.id === p.contatoId);
        return `
        <li>
          <div>
            <strong>${esc(p.titulo)}</strong>
            <small>${formatarData(p.data)} às ${esc(p.hora)}${ct ? " · com " + esc(ct.nome) : ""}</small>
          </div>
          <div>
            <button class="mini sec" onclick="editarCompromisso(${p.id})">Editar</button>
            <button class="mini perigo" onclick="excluirCompromisso(${p.id})">Excluir</button>
          </div>
        </li>`;
      }).join("")
    : '<li class="vazio">Nenhum compromisso cadastrado.</li>';

  // Atualiza o menu de contatos do formulário de compromissos
  const selecionado = $("p-contato").value;
  $("p-contato").innerHTML = '<option value="">Sem contato</option>' +
    listaC.map((c) => `<option value="${c.id}">${esc(c.nome)}</option>`).join("");
  $("p-contato").value = selecionado;
}

/* ===== LIGAÇÃO DOS BOTÕES ===== */
$("c-salvar").addEventListener("click", salvarContato);
$("c-cancelar").addEventListener("click", () => { limparFormContato(); mostrarMsg("c-msg", "", false); });
$("p-salvar").addEventListener("click", salvarCompromisso);
$("p-cancelar").addEventListener("click", () => { limparFormCompromisso(); mostrarMsg("p-msg", "", false); });

renderTudo(); // desenha a tela pela primeira vez