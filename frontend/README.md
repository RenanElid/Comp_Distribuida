# Frontend - DistriSchool

Interface web do DistriSchool, feita em React 19 + Vite 8 + MUI. Fala apenas com o API Gateway (Nginx), nunca direto com os serviços.

## Como rodar

Existem duas formas. As duas usam a porta 3000, então rode uma ou a outra.

### 1. Pelo Docker Compose (sistema completo)

Na raiz do repositório:

```
docker compose up -d --build
```

Abra http://localhost:3000. O `--build` é necessário sempre que o código mudar, senão o Docker reaproveita a imagem antiga.

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
| `/` | Início | Todos |
| `/alunos`, `/alunos/novo`, `/alunos/:id` | Lista, cadastro e edição de alunos | ADMIN edita; TEACHER só consulta |
| `/professores` | Lista de professores | ADMIN e TEACHER |
| `/turmas`, `/turmas/:id` | Turmas, disciplinas e matrículas | ADMIN e TEACHER |
| `/matriculas/:id` | Notas e frequência do aluno na turma | ADMIN e TEACHER lançam |
| `/notificacoes` | Notificações do usuário logado | Todos |

STUDENT e PARENT veem apenas Início e Notificações. Qualquer outra rota leva para Notificações.

As permissões no frontend só escondem botões e menus. Quem bloqueia de verdade é o backend.

## Resiliência

- Se um serviço cai, só a parte da tela que depende dele mostra um aviso. O resto continua funcionando.
- Toda requisição tem limite de 10 segundos. Em gravações (POST, PATCH, DELETE), o aviso de tempo esgotado diz para conferir antes de tentar de novo, porque o backend pode ter gravado mesmo assim. Nota não pode ser editada nem excluída, então tentar de novo às cegas pode duplicar a nota.
- O contador de notificações no menu atualiza a cada 30 segundos. Se o serviço de notificações estiver fora, o contador apenas some.
- Enquanto o `comunicacao-service` não existir, a página de notificações mostra "Serviço indisponível".

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
