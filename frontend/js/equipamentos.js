/**
 * Tela de Equipamentos (itens 4.3 e 4.9 do enunciado).
 *
 * Com foto selecionada o corpo vai como FormData (multipart); sem foto,
 * como JSON. O backend aceita os dois formatos.
 *
 * O status EM_MANUTENCAO normalmente vem das ordens de servico, nao da
 * edicao manual, e pode ser sobrescrito na proxima movimentacao.
 */
import { protegerPagina, ehAdmin } from './auth.js';
import { renderizarLayout, renderizarTitulo } from './layout.js';
import { api } from './api.js';
import {
  avisar,
  confirmar,
  dataParaInput,
  debounce,
  esc,
  formatarData,
  mostrarErros,
  preencherSelect,
  renderizarPaginacao,
  seloStatusEquipamento,
} from './ui.js';

const usuario = await protegerPagina();
const administrador = ehAdmin(usuario);

renderizarLayout({ usuario, ativo: 'equipamentos' });
renderizarTitulo({
  titulo: 'Equipamentos',
  descricao: 'Cadastro, situacao e historico dos bens da empresa.',
  // O botao de cadastro so aparece para o administrador.
  acao: administrador
    ? `<button class="btn btn-primary" id="btnNovo">
         <i class="bi bi-plus-lg me-1"></i>Novo equipamento
       </button>`
    : '',
});

const estado = { pagina: 1, busca: '', status: '', categoriaId: '', localId: '' };

const grade = document.getElementById('grade');
const resumo = document.getElementById('resumo');
const paginacao = document.getElementById('paginacao');
const formulario = document.getElementById('formulario');
const modal = new bootstrap.Modal('#modalForm');
const botaoSalvar = document.getElementById('btnSalvar');
const previaFoto = document.getElementById('previaFoto');
const semFoto = document.getElementById('semFoto');

// ------------------------- Listas auxiliares ------------------------

/**
 * Carrega categorias e locais para os filtros e para o formulario.
 * limite=100 para trazer a lista completa, nao uma pagina.
 */
async function carregarListasAuxiliares() {
  try {
    const [categorias, locais] = await Promise.all([
      api.get('/categorias', { limite: 100 }),
      api.get('/locais', { limite: 100 }),
    ]);

    preencherSelect(document.getElementById('filtroCategoria'), categorias.dados, {
      vazio: 'Todas',
    });
    preencherSelect(document.getElementById('filtroLocal'), locais.dados, { vazio: 'Todos' });

    if (administrador) {
      preencherSelect(formulario.elements.categoriaId, categorias.dados, {
        vazio: 'Selecione a categoria',
      });
      preencherSelect(formulario.elements.localId, locais.dados, {
        vazio: 'Selecione o local',
      });
    }

    if (categorias.dados.length === 0 || locais.dados.length === 0) {
      avisar(
        'Cadastre ao menos uma categoria e um local antes de cadastrar equipamentos.',
        'warning'
      );
    }
  } catch (erro) {
    console.error('[equipamentos] Falha ao carregar categorias/locais:', erro);
    avisar('Nao foi possivel carregar categorias e locais.', 'danger');
  }
}

// ----------------------------- Listagem -----------------------------

function montarCartao(equipamento) {
  const foto = equipamento.fotoUrl
    ? `<img src="${esc(equipamento.fotoUrl)}" class="foto-equipamento" loading="lazy"
            alt="Foto de ${esc(equipamento.nome)}">`
    : `<div class="foto-equipamento sem-foto">Sem foto cadastrada</div>`;

  const acoesAdmin = administrador
    ? `<button class="btn btn-sm btn-outline-secondary" data-acao="editar"
               data-id="${equipamento.id}" title="Editar">
         <i class="bi bi-pencil"></i>
       </button>
       <button class="btn btn-sm btn-outline-danger" data-acao="excluir"
               data-id="${equipamento.id}" data-nome="${esc(equipamento.nome)}" title="Excluir">
         <i class="bi bi-trash"></i>
       </button>`
    : '';

  return `
    <div class="col-12 col-sm-6 col-lg-4 col-xxl-3">
      <div class="card h-100">
        <div class="card-body">
          ${foto}
          <div class="d-flex justify-content-between align-items-start gap-2 mt-3">
            <h2 class="h6 mb-0">${esc(equipamento.nome)}</h2>
            ${seloStatusEquipamento(equipamento.status)}
          </div>
          <p class="smaller text-secondary mt-1 mb-2">${esc(equipamento.patrimonio)}</p>

          <ul class="list-unstyled small text-secondary mb-0">
            <li><i class="bi bi-tag me-1"></i>${esc(equipamento.categoria.nome)}</li>
            <li><i class="bi bi-geo-alt me-1"></i>${esc(equipamento.local.nome)}</li>
            <li><i class="bi bi-calendar3 me-1"></i>Aquisicao em
                ${formatarData(equipamento.dataAquisicao)}</li>
            <li><i class="bi bi-wrench me-1"></i>${equipamento._count.ordens} manutencao(oes)</li>
          </ul>
        </div>

        <div class="card-footer bg-white d-flex justify-content-between align-items-center">
          <a href="equipamento.html?id=${equipamento.id}" class="btn btn-sm btn-outline-primary">
            <i class="bi bi-clock-history me-1"></i>Historico
          </a>
          <div class="d-flex gap-1">${acoesAdmin}</div>
        </div>
      </div>
    </div>`;
}

async function carregar() {
  grade.innerHTML = `
    <div class="col-12 text-center text-secondary py-5">
      <span class="spinner-border spinner-border-sm me-2"></span>Carregando equipamentos...
    </div>`;

  try {
    const resposta = await api.get('/equipamentos', {
      busca: estado.busca,
      status: estado.status,
      categoriaId: estado.categoriaId,
      localId: estado.localId,
      pagina: estado.pagina,
    });

    if (resposta.dados.length === 0) {
      grade.innerHTML = `
        <div class="col-12">
          <div class="card">
            <div class="card-body text-center text-secondary py-5">
              <i class="bi bi-inbox fs-1 d-block mb-2"></i>
              Nenhum equipamento encontrado com os filtros atuais.
            </div>
          </div>
        </div>`;
    } else {
      grade.innerHTML = resposta.dados.map(montarCartao).join('');
    }

    resumo.textContent = `${resposta.paginacao.total} equipamento(s) encontrado(s)`;

    renderizarPaginacao(paginacao, resposta.paginacao, (pagina) => {
      estado.pagina = pagina;
      carregar();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  } catch (erro) {
    console.error('[equipamentos] Falha ao listar:', erro);
    grade.innerHTML = `
      <div class="col-12"><div class="alert alert-danger mb-0">${esc(erro.message)}</div></div>`;
  }
}

// ------------------------- Cadastro e edicao ------------------------

function mostrarPrevia(url) {
  if (url) {
    previaFoto.src = url;
    previaFoto.classList.remove('d-none');
    semFoto.classList.add('d-none');
  } else {
    previaFoto.removeAttribute('src');
    previaFoto.classList.add('d-none');
    semFoto.classList.remove('d-none');
  }
}

if (administrador) {
  // Previa da imagem escolhida, antes de enviar.
  document.getElementById('foto').addEventListener('change', (evento) => {
    const arquivo = evento.target.files?.[0];
    // URL temporaria do arquivo local, sem envio ao servidor.
    mostrarPrevia(arquivo ? URL.createObjectURL(arquivo) : null);
  });

  formulario.elements.status.addEventListener('change', (evento) => {
    document.getElementById('avisoStatus').textContent =
      evento.target.value === 'EM_MANUTENCAO'
        ? 'Normalmente este status e definido automaticamente ao abrir uma ordem de servico.'
        : '';
  });
}

function abrirFormulario(equipamento = null) {
  formulario.reset();
  formulario.querySelectorAll('.is-invalid').forEach((el) => el.classList.remove('is-invalid'));
  formulario.querySelectorAll('.invalid-feedback.api').forEach((el) => el.remove());
  document.getElementById('avisoStatus').textContent = '';

  document.getElementById('modalTitulo').textContent = equipamento
    ? 'Editar equipamento'
    : 'Novo equipamento';

  formulario.elements.id.value = equipamento?.id || '';
  formulario.elements.nome.value = equipamento?.nome || '';
  formulario.elements.patrimonio.value = equipamento?.patrimonio || '';
  formulario.elements.descricao.value = equipamento?.descricao || '';
  formulario.elements.status.value = equipamento?.status || 'ATIVO';
  formulario.elements.categoriaId.value = equipamento?.categoriaId || '';
  formulario.elements.localId.value = equipamento?.localId || '';
  formulario.elements.dataAquisicao.value = equipamento
    ? dataParaInput(equipamento.dataAquisicao)
    : '';

  mostrarPrevia(equipamento?.fotoUrl || null);

  modal.show();
  setTimeout(() => formulario.elements.nome.focus(), 300);
}

document.getElementById('btnNovo')?.addEventListener('click', () => abrirFormulario());

formulario?.addEventListener('submit', async (evento) => {
  evento.preventDefault();

  const id = formulario.elements.id.value;
  const arquivo = document.getElementById('foto').files?.[0];

  // Monta o corpo: FormData quando ha foto, JSON quando nao ha.
  const campos = {
    nome: formulario.elements.nome.value.trim(),
    patrimonio: formulario.elements.patrimonio.value.trim(),
    descricao: formulario.elements.descricao.value.trim(),
    dataAquisicao: formulario.elements.dataAquisicao.value,
    status: formulario.elements.status.value,
    categoriaId: formulario.elements.categoriaId.value,
    localId: formulario.elements.localId.value,
  };

  let corpo;

  if (arquivo) {
    corpo = new FormData();
    Object.entries(campos).forEach(([chave, valor]) => corpo.append(chave, valor));
    corpo.append('foto', arquivo);
  } else {
    corpo = campos;
  }

  botaoSalvar.disabled = true;
  botaoSalvar.querySelector('.spinner-border').classList.remove('d-none');

  try {
    const resposta = id
      ? await api.put(`/equipamentos/${id}`, corpo)
      : await api.post('/equipamentos', corpo);

    modal.hide();
    avisar(resposta.mensagem);
    carregar();
  } catch (erro) {
    console.warn('[equipamentos] Falha ao salvar:', erro.message);
    mostrarErros(formulario, erro);
  } finally {
    botaoSalvar.disabled = false;
    botaoSalvar.querySelector('.spinner-border').classList.add('d-none');
  }
});

// ------------------------------ Acoes -------------------------------

grade.addEventListener('click', async (evento) => {
  const botao = evento.target.closest('button[data-acao]');
  if (!botao) return;

  const { acao, id, nome } = botao.dataset;

  if (acao === 'editar') {
    try {
      const { dados } = await api.get(`/equipamentos/${id}`);
      abrirFormulario(dados);
    } catch (erro) {
      avisar(erro.message, 'danger');
    }
    return;
  }

  if (acao === 'excluir') {
    const confirmado = await confirmar(
      `Excluir o equipamento "${nome}"? A foto tambem sera removida.`,
      { titulo: 'Excluir equipamento', rotuloOk: 'Excluir' }
    );

    if (!confirmado) return;

    try {
      const resposta = await api.remover(`/equipamentos/${id}`);
      avisar(resposta.mensagem);
      carregar();
    } catch (erro) {
      // Equipamento com historico de manutencoes nao pode ser excluido.
      avisar(erro.message, 'danger');
    }
  }
});

// ------------------------------ Filtros -----------------------------

document.getElementById('busca').addEventListener(
  'input',
  debounce((evento) => {
    estado.busca = evento.target.value.trim();
    estado.pagina = 1;
    carregar();
  })
);

[
  ['filtroStatus', 'status'],
  ['filtroCategoria', 'categoriaId'],
  ['filtroLocal', 'localId'],
].forEach(([elementoId, chave]) => {
  document.getElementById(elementoId).addEventListener('change', (evento) => {
    estado[chave] = evento.target.value;
    estado.pagina = 1;
    carregar();
  });
});

await carregarListasAuxiliares();
carregar();
