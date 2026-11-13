const chat = document.getElementById('chat');
const form = document.getElementById('form');
const pergunta = document.getElementById('pergunta');
const enviar = document.getElementById('enviar');
const nova = document.getElementById('nova');

// Recupera ou cria o ID da conversa no navegador
let conversa = localStorage.getItem('conversa');
if (!conversa) {
  conversa = crypto.randomUUID();
  localStorage.setItem('conversa', conversa);
}

function esconderBoasVindas() {
  const welcome = document.getElementById('welcome');
  if (welcome) welcome.style.display = 'none';
}

function mostrar(classe, texto) {
  esconderBoasVindas();

  const wrapper = document.createElement('div');
  wrapper.className = 'msg-wrapper';

  if (classe.includes('user')) {
    const div = document.createElement('div');
    div.className = classe;
    div.textContent = texto;
    wrapper.appendChild(div);
    chat.appendChild(wrapper);
    chat.scrollTop = chat.scrollHeight;
    return div;
  }

  // Estrutura para a resposta do assistente (avatar + texto)
  const row = document.createElement('div');
  row.className = 'assistant-row';

  const avatar = document.createElement('div');
  avatar.className = 'avatar';
  avatar.textContent = 'AI';

  const content = document.createElement('div');
  content.className = 'assistant-content';

  const div = document.createElement('div');
  div.className = classe;
  div.textContent = texto;

  content.appendChild(div);
  row.appendChild(avatar);
  row.appendChild(content);
  wrapper.appendChild(row);
  chat.appendChild(wrapper);
  chat.scrollTop = chat.scrollHeight;

  return div;
}

// Ao abrir a página: busca o histórico salvo no banco e desenha na tela
async function carregarHistorico() {
  try {
    const resposta = await fetch('/historico/' + conversa);
    const mensagens = await resposta.json();
    if (!resposta.ok) throw new Error(mensagens.erro);

    for (const m of mensagens) {
      mostrar('msg ' + m.role, m.content);
    }
  } catch (erro) {
    mostrar('msg assistant', 'Erro ao carregar o histórico: ' + erro.message);
  }
}
carregarHistorico();

// Botão "Nova conversa": gera novo ID, limpa o chat e restaura a tela inicial
nova.addEventListener('click', () => {
  conversa = crypto.randomUUID();
  localStorage.setItem('conversa', conversa);
  chat.innerHTML = `
    <div id="welcome" class="welcome-screen">
      <h2>Como posso ajudar hoje?</h2>
      <p>Suas conversas ficam salvas automaticamente.</p>
    </div>
  `;
  pergunta.focus();
});

form.addEventListener('submit', async (evento) => {
  evento.preventDefault();
  const texto = pergunta.value.trim();
  if (!texto) return;

  mostrar('msg user', texto);
  pergunta.value = '';
  enviar.disabled = true;
  const balao = mostrar('msg assistant', 'Pensando...');

  try {
    const resposta = await fetch('/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ conversa: conversa, texto: texto })
    });
    const dados = await resposta.json();
    if (!resposta.ok) throw new Error(dados.erro);

    balao.textContent = dados.resposta;

    // Exibe a etiqueta das ferramentas acima da resposta do assistente
    if (dados.ferramentas && dados.ferramentas.length > 0) {
      const infoFerramentas = document.createElement('div');
      infoFerramentas.className = 'ferramentas';
      infoFerramentas.textContent = '⚙️ Consultou: ' + dados.ferramentas.join(', ');
      balao.parentElement.insertBefore(infoFerramentas, balao);
    }
  } catch (erro) {
    balao.textContent = 'Erro: ' + erro.message;
  }

  chat.scrollTop = chat.scrollHeight;
  enviar.disabled = false;
  pergunta.focus();
});