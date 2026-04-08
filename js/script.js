const horariosBase = ["09:00", "10:30", "14:00", "15:30", "17:00", "18:30"];
const dataInput = document.getElementById("data");
const horaSelect = document.getElementById("hora");
const form = document.getElementById("formAgendamento");
const listaAgendamentos = document.getElementById("listaAgendamentos");

function hojeFormatoISO() {
  const hoje = new Date();
  const ano = hoje.getFullYear();
  const mes = String(hoje.getMonth() + 1).padStart(2, "0");
  const dia = String(hoje.getDate()).padStart(2, "0");
  return `${ano}-${mes}-${dia}`;
}

function obterAgendamentos() {
  return JSON.parse(localStorage.getItem("agendamentosCamila")) || [];
}

function salvarAgendamentos(lista) {
  localStorage.setItem("agendamentosCamila", JSON.stringify(lista));
}

function dataEhDomingo(dataISO) {
  const partes = dataISO.split("-");
  const data = new Date(partes[0], partes[1] - 1, partes[2]);
  return data.getDay() === 0;
}

function atualizarHorarios() {
  const dataSelecionada = dataInput.value;
  horaSelect.innerHTML = "";

  if (!dataSelecionada) {
    horaSelect.innerHTML = '<option value="">Selecione uma data primeiro</option>';
    return;
  }

  if (dataEhDomingo(dataSelecionada)) {
    horaSelect.innerHTML = '<option value="">Domingo indisponível</option>';
    return;
  }

  const agendamentos = obterAgendamentos();
  const horariosOcupados = agendamentos
    .filter(item => item.data === dataSelecionada)
    .map(item => item.hora);

  const horariosDisponiveis = horariosBase.filter(h => !horariosOcupados.includes(h));

  if (horariosDisponiveis.length === 0) {
    horaSelect.innerHTML = '<option value="">Sem horários disponíveis</option>';
    return;
  }

  horaSelect.innerHTML = '<option value="">Selecione um horário</option>';

  horariosDisponiveis.forEach(horario => {
    const option = document.createElement("option");
    option.value = horario;
    option.textContent = horario;
    horaSelect.appendChild(option);
  });
}

function renderizarAgendamentos() {
  const agendamentos = obterAgendamentos();

  if (agendamentos.length === 0) {
    listaAgendamentos.innerHTML = '<div class="vazio">Nenhum agendamento salvo ainda.</div>';
    return;
  }

  listaAgendamentos.innerHTML = "";

  agendamentos.forEach((item, index) => {
    const bloco = document.createElement("div");
    bloco.className = "agenda-item";

    bloco.innerHTML = `
      <strong>${item.nome}</strong><br>
      ${item.tipoConsulta}<br>
      📧 ${item.email}<br>
      📱 ${item.telefone}<br>
      📅 ${item.data}<br>
      ⏰ ${item.hora}<br>
      💬 ${item.mensagem || "Sem observações"}<br><br>
      <button type="button" onclick="excluirAgendamento(${index})">Excluir</button>
    `;

    listaAgendamentos.appendChild(bloco);
  });
}

function excluirAgendamento(indice) {
  const agendamentos = obterAgendamentos();
  agendamentos.splice(indice, 1);
  salvarAgendamentos(agendamentos);
  renderizarAgendamentos();
  atualizarHorarios();
}

function limparAgendamentos() {
  if (confirm("Tem certeza que deseja apagar todos os agendamentos?")) {
    localStorage.removeItem("agendamentosCamila");
    renderizarAgendamentos();
    atualizarHorarios();
  }
}

function enviarWhatsApp(dados) {
  const texto = `Olá, meu nome é ${dados.nome}. Quero agendar uma consulta.

📌 Tipo: ${dados.tipoConsulta}
📧 Email: ${dados.email}
📱 Telefone: ${dados.telefone}
📅 Data: ${dados.data}
⏰ Horário: ${dados.hora}
💬 Observações: ${dados.mensagem || "Sem observações"}`;

  const url = "https://wa.me/5511995226332?text=" + encodeURIComponent(texto);
  window.open(url, "_blank");
}

form.addEventListener("submit", function(event) {
  event.preventDefault();

  const nome = document.getElementById("nome").value.trim();
  const email = document.getElementById("email").value.trim();
  const telefone = document.getElementById("telefone").value.trim();
  const data = document.getElementById("data").value;
  const hora = document.getElementById("hora").value;
  const tipoConsulta = document.getElementById("tipoConsulta").value;
  const mensagem = document.getElementById("mensagem").value.trim();

  if (!data || dataEhDomingo(data)) {
    alert("Não é possível agendar aos domingos.");
    return;
  }

  if (!hora) {
    alert("Selecione um horário disponível.");
    return;
  }

  const novoAgendamento = {
    nome,
    email,
    telefone,
    data,
    hora,
    tipoConsulta,
    mensagem
  };

  const agendamentos = obterAgendamentos();

  const conflito = agendamentos.some(item => item.data === data && item.hora === hora);

  if (conflito) {
    alert("Esse horário já foi agendado. Escolha outro.");
    atualizarHorarios();
    return;
  }

  agendamentos.push(novoAgendamento);
  salvarAgendamentos(agendamentos);

  renderizarAgendamentos();
  atualizarHorarios();
  enviarWhatsApp(novoAgendamento);

  form.reset();
  horaSelect.innerHTML = '<option value="">Selecione uma data primeiro</option>';
});

dataInput.min = hojeFormatoISO();
dataInput.addEventListener("change", atualizarHorarios);

renderizarAgendamentos();