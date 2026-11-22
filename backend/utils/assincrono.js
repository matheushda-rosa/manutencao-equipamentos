/**
 * Envolve um controller assincrono para que qualquer erro rejeitado caia
 * no middleware de tratamento de erros.
 */
function assincrono(manipulador) {
  return (req, res, next) => {
    Promise.resolve(manipulador(req, res, next)).catch(next);
  };
}

module.exports = assincrono;
