/**
 * Integracao com a API ViaCEP (item 4.5 do enunciado).
 * https://viacep.com.br/ws/89801000/json/
 *
 * CEP inexistente responde 200 OK com { "erro": true } no corpo, entao
 * o status HTTP nao basta.
 */

const PADRAO_CEP = /^\d{5}-?\d{3}$/;

export function cepValido(cep) {
  return PADRAO_CEP.test(String(cep || '').trim());
}

export function formatarCep(valor) {
  const digitos = String(valor || '').replace(/\D/g, '').slice(0, 8);
  if (digitos.length <= 5) return digitos;
  return `${digitos.slice(0, 5)}-${digitos.slice(5)}`;
}

/**
 * Busca o endereco do CEP.
 * @returns {Promise<{cep, logradouro, bairro, cidade, uf}>}
 */
export async function buscarCep(cep) {
  const digitos = String(cep).replace(/\D/g, '');

  if (digitos.length !== 8) {
    throw new Error('Informe um CEP com 8 digitos.');
  }

  let resposta;

  try {
    resposta = await fetch(`https://viacep.com.br/ws/${digitos}/json/`);
  } catch (erro) {
    console.error('[viacep] Falha na consulta:', erro);
    throw new Error('Nao foi possivel consultar o CEP. Verifique sua conexao.');
  }

  if (!resposta.ok) {
    throw new Error('Servico de CEP indisponivel no momento.');
  }

  const dados = await resposta.json();

  if (dados.erro) {
    throw new Error('CEP nao encontrado.');
  }

  console.log('[viacep] CEP encontrado:', dados.cep);

  // "localidade" vira "cidade", nome usado no banco e nos formularios.
  return {
    cep: dados.cep,
    logradouro: dados.logradouro,
    bairro: dados.bairro,
    cidade: dados.localidade,
    uf: dados.uf,
  };
}

/**
 * Liga um campo de CEP aos campos de endereco de um formulario.
 * Dispara a busca quando o usuario sai do campo (blur) ou completa os
 * 8 digitos, aplica a mascara e preenche o restante.
 */
export function ligarAutocompleteCep(formulario, { aoErro, aoSucesso } = {}) {
  const campoCep = formulario.querySelector('[name="cep"]');
  if (!campoCep) return;

  const preencher = (endereco) => {
    const mapa = {
      logradouro: endereco.logradouro,
      bairro: endereco.bairro,
      cidade: endereco.cidade,
      uf: endereco.uf,
    };

    Object.entries(mapa).forEach(([nome, valor]) => {
      const campo = formulario.querySelector(`[name="${nome}"]`);
      // So sobrescreve se o ViaCEP trouxe valor: ha CEPs sem logradouro.
      if (campo && valor) campo.value = valor;
    });

    formulario.querySelector('[name="numero"]')?.focus();
  };

  let ultimoConsultado = '';

  const consultar = async () => {
    const digitos = campoCep.value.replace(/\D/g, '');
    if (digitos.length !== 8 || digitos === ultimoConsultado) return;

    ultimoConsultado = digitos;
    campoCep.classList.remove('is-invalid');
    campoCep.disabled = true;

    try {
      const endereco = await buscarCep(digitos);
      preencher(endereco);
      aoSucesso?.(endereco);
    } catch (erro) {
      campoCep.classList.add('is-invalid');
      ultimoConsultado = '';
      aoErro?.(erro);
    } finally {
      campoCep.disabled = false;
    }
  };

  campoCep.addEventListener('input', () => {
    campoCep.value = formatarCep(campoCep.value);
    if (campoCep.value.replace(/\D/g, '').length === 8) consultar();
  });

  campoCep.addEventListener('blur', consultar);
}
