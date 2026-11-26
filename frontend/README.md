# Frontend - DistriSchool

Interface web do DistriSchool, feita em React 19 + Vite 8 + MUI. Fala apenas com o API Gateway (Nginx), nunca direto com os serviços.

## Como rodar

Existem duas formas. As duas usam a porta 3000, então rode uma ou a outra.

### 1. Pelo Docker Compose (sistema completo)

Na raiz do repositório:

```
docker compose up -d --build
```

Abra http://localhost:3000. O serviço de notificações sobe junto. O `--build` é necessário sempre que o código mudar, senão o Docker reaproveita a imagem antiga.

### 2. Em modo de desenvolvimento (recarrega ao salvar)

Com o backend no ar (`docker compose up -d` na raiz, sem o container `frontend` rodando):

```
cd frontend
npm install
npm run dev
```

Abra http://localhost:3000.

## Variáveis de ambiente

| Variável | Padrão | Para que serve |
| --- | --- | --- |
| `VITE_API_URL` | `http://localhost:8080/api` | Endereço do gateway. É gravado no JavaScript no momento do build, então precisa ser acessível pelo navegador do usuário |

Para mudar em desenvolvimento, copie `.env.example` para `.env.local`. No Docker, defina `VITE_API_URL` no `.env` da raiz e rode com `--build`.

A porta 3000 não é por acaso: o gateway só aceita requisições do navegador vindas de `http://localhost:3000` (variável `CORS_ORIGIN` no `compose.yaml`).

## Usuários de teste

Senha de todos: `Senha@123`.

| Email | Perfil |
| --- | --- |
| carla.tecnica@distrischool.test | ADMIN |
| helena.prof@distrischool.test | TEACHER |
| ana.souza@distrischool.test | STUDENT |
| maria.responsavel@distrischool.test | PARENT (responsável pela Ana) |

## Telas e permissões

| Rota | Tela | Quem vê |
| --- | --- | --- |
| `/login` | Login | Todos |
| `/esqueci-senha`, `/redefinir-senha?token=` | Recuperação de senha (o link chega por email) | Todos, sem login |
| `/verificar-email?token=` | Confirma o email (o link é pedido na página inicial) | Todos, sem login |
| `/` | Início, com os totais de alunos, professores, turmas e disciplinas | Todos (totais só para ADMIN e TEACHER) |
| `/alunos`, `/alunos/novo`, `/alunos/:id` | Lista com exportação CSV/PDF, cadastro e edição de alunos | ADMIN edita; TEACHER só consulta |
| `/alunos/:id/historico` | Histórico escolar: notas e presença de todas as turmas do aluno, com exportação | ADMIN e TEACHER |
| `/professores`, `/professores/novo`, `/professores/:id` | Lista, cadastro e edição de professores, com as turmas de cada um | ADMIN edita; TEACHER só consulta |
| `/turmas`, `/turmas/:id` | Turmas, professores por disciplina (atribuição) e matrículas | ADMIN edita; TEACHER matricula |
| `/turmas/:id/chamada` | Chamada da turma inteira num dia | ADMIN e TEACHER |
| `/disciplinas` | Cadastro de disciplinas | ADMIN edita; TEACHER só consulta |
| `/relatorios?turma_id=` | Relatório da turma: frequência (destaca abaixo de 75%) e médias por disciplina, com exportação | ADMIN e TEACHER |
| `/matriculas/:id` | Notas e frequência do aluno na turma | ADMIN e TEACHER lançam |
| `/notificacoes` | Notificações do usuário logado | Todos |

STUDENT e PARENT veem apenas Início e Notificações. Qualquer outra rota leva para Notificações.

As permissões no frontend só escondem botões e menus. Quem bloqueia de verdade é o backend.

## Emails de teste (Mailpit)

Os emails de recuperação de senha e de verificação vão para o Mailpit, uma caixa de entrada de teste que sobe junto com o Docker Compose.

1. Na tela de login, clique em "Esqueci minha senha" e informe o email.
2. Abra http://localhost:8025, clique no email "Recuperação de senha" e no link.
3. Crie a nova senha. O link vale por 1 hora e só pode ser usado uma vez.

## Resiliência

- Se um serviço cai, só a parte da tela que depende dele mostra um aviso. O resto continua funcionando.
- Toda requisição tem limite de 15 segundos. Em gravações (POST, PATCH, DELETE), o aviso de tempo esgotado diz para conferir antes de tentar de novo, porque o backend pode ter gravado mesmo assim. Nota não pode ser editada nem excluída, então tentar de novo às cegas pode duplicar a nota.
- O contador de notificações no menu atualiza a cada 30 segundos. Se o serviço de notificações estiver fora, o contador apenas some.
- Se o `comunicacao-service` estiver indisponível, a página de notificações mostra "Serviço de notificações indisponível no momento" e o contador some.

## Estrutura de pastas

```
src/
  api/          cliente.js (fetch, token, tradução de erros) e endpoints.js (uma função por rota)
  componentes/  Layout, RotaProtegida e partes reaproveitadas das telas
  contexto/     AuthContext (usuário logado)
  hooks/        useCarregamento (carregando/erro/dados) e useNaoLidas (contador de notificações)
  paginas/      uma tela por arquivo
  utils/        formatos (datas e números) e permissoes (regras por perfil)
```

Datas no formato `AAAA-MM-DD` são formatadas cortando a string, e não com `new Date`. Assim elas não voltam um dia por causa do fuso (UTC-3).
