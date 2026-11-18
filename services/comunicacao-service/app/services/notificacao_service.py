import logging
from datetime import date

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models import Notificacao
from app.repositories.notificacao_repository import NotificacaoRepository

logger = logging.getLogger("notificacao_service")

class NotificacaoService:
    def __init__(self, db: Session):
        self.notificacao_repository = NotificacaoRepository(db)

    def listar_do_usuario(self, usuario_id: int) -> list[Notificacao]:
        return self.notificacao_repository.listar_do_usuario(usuario_id)

    def marcar_como_lida(self, notificacao_id: int, usuario_id: int) -> Notificacao:
        notificacao = self.notificacao_repository.buscar_por_id(notificacao_id)
        if notificacao is None or notificacao.usuario_id != usuario_id:
            raise HTTPException(status.HTTP_404_NOT_FOUND, "Notificação não encontrada")

        notificacao.lida = True
        return self.notificacao_repository.salvar(notificacao)

    def processar_evento(self, topico: str, evento: dict):
        evento_id = evento.get("evento_id")
        if evento_id is None:
            logger.info("Evento %s ignorado: não tem evento_id", topico)
            return
        if self.notificacao_repository.evento_ja_processado(evento_id):
            logger.info("Evento %s ignorado: já foi processado", evento_id)
            return

        dados = evento["dados"]
        destinatario = dados.get("destinatario_usuario_id")
        notificacao = None
        if destinatario is None:
            logger.warning("Evento %s sem destinatário: nenhuma notificação criada", evento_id)
        else:
            tipo, mensagem = self.montar_mensagem(topico, dados)
            notificacao = Notificacao(usuario_id=destinatario, tipo=tipo, mensagem=mensagem)

        self.notificacao_repository.salvar_evento(evento_id, topico, notificacao)
        if notificacao is not None:
            logger.info("Notificação %s criada para o usuário %s", notificacao.tipo, destinatario)

    def montar_mensagem(self, topico: str, dados: dict) -> tuple[str, str]:
        if topico == "grade.recorded":
            return "NOTA_LANCADA", self.mensagem_da_nota(dados)
        if topico == "attendance.recorded":
            dia = date.fromisoformat(dados["data"]).strftime("%d/%m/%Y")
            return "FREQUENCIA_REGISTRADA", f"Frequência de {dia}: {dados['situacao'].lower()}"
        return "PROFESSOR_ATRIBUIDO", f"Você foi atribuído à disciplina {dados['disciplina_id']} da turma {dados['turma_id']}"

    def mensagem_da_nota(self, dados: dict) -> str:
        valor = dados["valor"]
        casas = 1 if round(valor, 1) == valor else 2
        valor_formatado = f"{valor:.{casas}f}".replace(".", ",")
        aluno = dados.get("aluno_nome")
        disciplina = dados.get("disciplina_nome")
        if aluno and disciplina:
            return f"Nova nota de {aluno} em {disciplina}: {valor_formatado} ({dados['descricao']})"
        return f"Nova nota lançada: {valor_formatado} ({dados['descricao']})"
