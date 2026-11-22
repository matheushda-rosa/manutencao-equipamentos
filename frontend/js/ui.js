/**
 * Funcoes de interface reaproveitadas por todas as telas:
 * avisos, confirmacao, formatacao de data, selos de status e
 * preenchimento de <select>.
 */

/**
 * Escapa texto antes de inserir no HTML.
 * As tabelas sao montadas com template strings e innerHTML, entao todo
 * valor vindo do banco passa por aqui (protecao contra XSS).
 */
export function esc(valor) {
  if (valor === null || valor === undefined) return '';
  return String(valor)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

/** Garante que exista um container de toasts na pagina. */
function obterContainerToast() {
  let container = document.getElementById('toast-container');

  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    container.className = 'toast-container position-fixed top-0 end-0 p-3';
    container.style.zIndex = '1090';
    document.body.appendChild(container);
  }

  return container;
}

/**
 * Mostra um aviso flutuante.
 * @param {'success'|'danger'|'warning'|'info'} tipo
 */
export function avisar(mensagem, tipo = 'success') {
  const container = obterContainerToast();

  const toast = document.createElement('div');
  toast.className = `toast align-items-center text-bg-${tipo} border-0`;
  toast.setAttribute('role', 'alert');
  toast.innerHTML = `
    <div class="d-flex">
      <div class="toast-body">${esc(mensagem)}</div>
      <button type="button" class="btn-close btn-close-white me-2 m-auto"
              data-bs-dismiss="toast" aria-label="Fechar"></button>
    </div>`;

  container.appendChild(toast);

  const instancia = new bootstrap.Toast(toast, { delay: tipo === 'danger' ? 6000 : 3500 });
  instancia.show();

  toast.addEventListener('hidden.bs.toast', () => toast.remove());
}

/**
 * Confirmacao em modal, no lugar do window.confirm.
 * Devolve uma Promise<boolean>, para poder ser usada com await.
 */
export function confirmar(mensagem, { titulo = 'Confirmar', rotuloOk = 'Confirmar', perigo = true } = {}) {
  return new Promise((resolve) => {
    const elemento = document.createElement('div');
    elemento.className = 'modal fade';
    elemento.innerHTML = `
      <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">${esc(titulo)}</h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
          </div>
          <div class="modal-body"><p class="mb-0">${esc(mensagem)}</p></div>
          <div class="modal-footer">
            <button type="button" class="btn btn-outline-secondary" data-bs-dismiss="modal">
              Cancelar
            </button>
            <button type="button" class="btn btn-${perigo ? 'danger' : 'primary'}" data-confirmar>
              ${esc(rotuloOk)}
            </button>
          </div>
        </div>
      </div>`;

    document.body.appendChild(elemento);
    const modal = new bootstrap.Modal(elemento);
    let confirmado = false;

    elemento.querySelector('[data-confirmar]').addEventListener('click', () => {
      confirmado = true;
      modal.hide();
    });

    elemento.addEventListener('hidden.bs.modal', () => {
      elemento.remove();
      resolve(confirmado);
    });

    modal.show();
  });
}

// ---------------------------- Formatacao ----------------------------

export function formatarData(iso) {
  if (!iso) return '-';
  // Datas puras ("2024-03-15") precisam de cuidado: new Date() as
  // interpreta como UTC e, no fuso do Brasil, exibiria o dia anterior.
  const somenteData = /^\d{4}-\d{2}-\d{2}$/.test(iso);
  const data = somenteData ? new Date(`${iso}T12:00:00`) : new Date(iso);
  return data.toLocaleDateString('pt-BR');
}

export function formatarDataHora(iso) {
  if (!iso) return '-';
  return new Date(iso).toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/** Converte ISO para o formato aceito por <input type="date">. */
export function dataParaInput(iso) {
  if (!iso) return '';
  return new Date(iso).toISOString().slice(0, 10);
}

// ------------------------------- Selos -------------------------------

const ESTILO_STATUS_EQUIPAMENTO = {
  ATIVO: { classe: 'success', rotulo: 'Ativo' },
  EM_MANUTENCAO: { classe: 'warning text-dark', rotulo: 'Em manutencao' },
  INATIVO: { classe: 'secondary', rotulo: 'Inativo' },
};

const ESTILO_STATUS_ORDEM = {
  ABERTA: { classe: 'primary', rotulo: 'Aberta' },
  EM_ANDAMENTO: { classe: 'warning text-dark', rotulo: 'Em andamento' },
  CONCLUIDA: { classe: 'success', rotulo: 'Concluida' },
  CANCELADA: { classe: 'secondary', rotulo: 'Cancelada' },
};

const ESTILO_PRIORIDADE = {
  BAIXA: { classe: 'info text-dark', rotulo: 'Baixa' },
  MEDIA: { classe: 'secondary', rotulo: 'Media' },
  ALTA: { classe: 'warning text-dark', rotulo: 'Alta' },
  URGENTE: { classe: 'danger', rotulo: 'Urgente' },
};

function montarSelo(mapa, valor) {
  const estilo = mapa[valor] || { classe: 'light text-dark', rotulo: valor || '-' };
  return `<span class="badge text-bg-${estilo.classe}">${esc(estilo.rotulo)}</span>`;
}

export const seloStatusEquipamento = (valor) => montarSelo(ESTILO_STATUS_EQUIPAMENTO, valor);
export const seloStatusOrdem = (valor) => montarSelo(ESTILO_STATUS_ORDEM, valor);
export const seloPrioridade = (valor) => montarSelo(ESTILO_PRIORIDADE, valor);

export const rotuloStatusOrdem = (valor) => ESTILO_STATUS_ORDEM[valor]?.rotulo || valor;
export const rotuloStatusEquipamento = (valor) => ESTILO_STATUS_EQUIPAMENTO[valor]?.rotulo || valor;

// ------------------------------ Auxiliares ---------------------------

/** Preenche um <select> a partir de uma lista de objetos. */
export function preencherSelect(select, itens, { valor = 'id', texto = 'nome', vazio = 'Selecione...' } = {}) {
  select.innerHTML =
    `<option value="">${esc(vazio)}</option>` +
    itens
      .map((item) => `<option value="${esc(item[valor])}">${esc(item[texto])}</option>`)
      .join('');
}

/**
 * Atrasa a execucao enquanto o usuario ainda digita.
 * Usado na busca, para nao disparar uma requisicao por tecla.
 */
export function debounce(funcao, espera = 400) {
  let temporizador;
  return (...argumentos) => {
    clearTimeout(temporizador);
    temporizador = setTimeout(() => funcao(...argumentos), espera);
  };
}

/** Mostra os erros de validacao devolvidos pela API dentro do formulario. */
export function mostrarErros(formulario, erro) {
  formulario.querySelectorAll('.invalid-feedback.api').forEach((el) => el.remove());
  formulario.querySelectorAll('.is-invalid').forEach((el) => el.classList.remove('is-invalid'));

  if (!Array.isArray(erro?.detalhes) || erro.detalhes.length === 0) {
    avisar(erro?.message || 'Nao foi possivel salvar.', 'danger');
    return;
  }

  erro.detalhes.forEach(({ campo, mensagem }) => {
    const input = formulario.querySelector(`[name="${campo}"]`);

    if (!input) {
      avisar(`${campo}: ${mensagem}`, 'danger');
      return;
    }

    input.classList.add('is-invalid');
    const aviso = document.createElement('div');
    aviso.className = 'invalid-feedback api d-block';
    aviso.textContent = mensagem;
    input.insertAdjacentElement('afterend', aviso);
  });
}

/** Linha de "carregando" para usar dentro de uma tabela. */
export function linhaCarregando(colunas, mensagem = 'Carregando...') {
  return `
    <tr>
      <td colspan="${colunas}" class="text-center text-secondary py-4">
        <span class="spinner-border spinner-border-sm me-2"></span>${esc(mensagem)}
      </td>
    </tr>`;
}

/** Linha de "nenhum registro". */
export function linhaVazia(colunas, mensagem = 'Nenhum registro encontrado.') {
  return `
    <tr>
      <td colspan="${colunas}" class="text-center text-secondary py-4">${esc(mensagem)}</td>
    </tr>`;
}

/** Desenha os botoes de paginacao. */
export function renderizarPaginacao(elemento, paginacao, aoTrocar) {
  const { pagina, paginas } = paginacao;

  if (!paginas || paginas <= 1) {
    elemento.innerHTML = '';
    return;
  }

  const itens = [];
  const adicionar = (numero, rotulo = numero, ativo = false, desabilitado = false) => {
    itens.push(`
      <li class="page-item ${ativo ? 'active' : ''} ${desabilitado ? 'disabled' : ''}">
        <button class="page-link" data-pagina="${numero}">${rotulo}</button>
      </li>`);
  };

  adicionar(pagina - 1, '&laquo;', false, pagina === 1);

  for (let numero = 1; numero <= paginas; numero += 1) {
    // Mostra a primeira, a ultima e as vizinhas da atual.
    if (numero === 1 || numero === paginas || Math.abs(numero - pagina) <= 1) {
      adicionar(numero, numero, numero === pagina);
    } else if (Math.abs(numero - pagina) === 2) {
      itens.push('<li class="page-item disabled"><span class="page-link">...</span></li>');
    }
  }

  adicionar(pagina + 1, '&raquo;', false, pagina === paginas);

  elemento.innerHTML = `<ul class="pagination pagination-sm mb-0">${itens.join('')}</ul>`;

  elemento.querySelectorAll('button[data-pagina]').forEach((botao) => {
    botao.addEventListener('click', () => aoTrocar(Number(botao.dataset.pagina)));
  });
}
