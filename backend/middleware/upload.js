/**
 * Upload de imagens (multer).
 * memoryStorage: o arquivo vai direto para o Supabase Storage, porque o
 * sistema de arquivos do Render e efemero.
 */
const multer = require('multer');
const AppError = require('../utils/AppError');

const TIPOS_PERMITIDOS = ['image/jpeg', 'image/png', 'image/webp'];
const TAMANHO_MAXIMO = 5 * 1024 * 1024; // 5 MB

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: TAMANHO_MAXIMO },
  fileFilter(_req, arquivo, callback) {
    if (!TIPOS_PERMITIDOS.includes(arquivo.mimetype)) {
      return callback(
        new AppError('Formato de imagem invalido. Envie JPEG, PNG ou WEBP.', 400)
      );
    }
    return callback(null, true);
  },
});

/** Campo "foto" do formulario, opcional. */
const uploadFoto = upload.single('foto');

/** Converte os erros do multer em AppError. */
function tratarUploadFoto(req, res, next) {
  uploadFoto(req, res, (erro) => {
    if (!erro) return next();

    if (erro instanceof multer.MulterError) {
      if (erro.code === 'LIMIT_FILE_SIZE') {
        return next(new AppError('A imagem excede o limite de 5 MB.', 400));
      }
      return next(new AppError(`Falha no upload: ${erro.message}`, 400));
    }

    return next(erro);
  });
}

module.exports = { tratarUploadFoto, TIPOS_PERMITIDOS, TAMANHO_MAXIMO };
