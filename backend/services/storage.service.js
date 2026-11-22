/**
 * Upload de imagens no Supabase Storage (item 4.9 do enunciado).
 *
 * O upload passa pelo backend para que a service role key nunca chegue
 * ao navegador.
 *
 * De cada foto guardamos a URL publica (usada no <img>) e o caminho
 * dentro do bucket, que e o que permite remover ou substituir o arquivo.
 */
const path = require('node:path');
const crypto = require('node:crypto');

const { obterClienteSupabase } = require('../config/supabase');
const { env } = require('../config/env');
const AppError = require('../utils/AppError');

/**
 * Monta um nome de arquivo unico, independente do nome enviado pelo
 * usuario, que pode repetir ou conter caracteres invalidos para URL.
 */
function gerarNomeArquivo(nomeOriginal) {
  const extensao = path.extname(nomeOriginal || '').toLowerCase() || '.jpg';
  const identificador = crypto.randomUUID();
  return `equipamentos/${Date.now()}-${identificador}${extensao}`;
}

const storageService = {
  /**
   * Envia o arquivo e devolve { caminho, url }.
   * @param {{buffer: Buffer, mimetype: string, originalname: string}} arquivo
   */
  async enviarFoto(arquivo) {
    const supabase = obterClienteSupabase();
    const caminho = gerarNomeArquivo(arquivo.originalname);

    const { error } = await supabase.storage
      .from(env.supabase.bucket)
      .upload(caminho, arquivo.buffer, {
        contentType: arquivo.mimetype,
        upsert: false,
      });

    if (error) {
      console.error('[storage] Falha no upload:', error.message);
      throw new AppError(
        'Nao foi possivel enviar a imagem. Verifique se o bucket ' +
          `"${env.supabase.bucket}" existe no Supabase Storage.`,
        502
      );
    }

    const { data } = supabase.storage.from(env.supabase.bucket).getPublicUrl(caminho);

    console.log('[storage] Imagem enviada:', caminho);

    return { caminho, url: data.publicUrl };
  },

  /**
   * Remove um arquivo do bucket.
   * Uma falha aqui nao interrompe a operacao principal: sobra um arquivo
   * orfao, o que e preferivel a abortar a exclusao do registro.
   */
  async removerFoto(caminho) {
    if (!caminho) return;

    try {
      const supabase = obterClienteSupabase();
      const { error } = await supabase.storage.from(env.supabase.bucket).remove([caminho]);

      if (error) {
        console.warn('[storage] Nao foi possivel remover', caminho, '-', error.message);
        return;
      }

      console.log('[storage] Imagem removida:', caminho);
    } catch (erro) {
      console.warn('[storage] Erro ao remover imagem:', erro.message);
    }
  },
};

module.exports = storageService;
