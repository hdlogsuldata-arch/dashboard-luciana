# Dashboard Luciana

Dashboard gerencial desenvolvido pela FGV Jr para visualização de KPIs e indicadores operacionais de uma empresa de transporte de cargas.

## Funcionalidades

- **Dashboard personalizado por usuário** — cada usuário escolhe quais KPIs e gráficos exibir
- **Painel administrativo** — gestão de usuários, permissões e metas
- **Metas e acompanhamento** — criação de metas vinculadas a indicadores com status automático (No Prazo, Em Risco, Atrasada, Alcançada)
- **Série histórica** — visualização de dados ao longo do tempo via Recharts
- **Autenticação segura** — JWT com controle de roles (Admin, Manager, Analyst, Operator, Viewer)

## Stack

| Camada | Tecnologia |
|--------|-----------|
| Framework | Next.js 16 (App Router) |
| UI | React 19 + TailwindCSS 4 |
| Linguagem | TypeScript |
| ORM | Prisma 6 |
| Banco de dados | PostgreSQL (Neon serverless) |
| Gráficos | Recharts |
| Auth | JWT (jsonwebtoken + bcryptjs) |
| Validação | Zod v4 |

## Pré-requisitos

- Node.js 20+
- Conta no [Neon](https://neon.tech) (ou outro PostgreSQL)

## Configuração

1. Clone o repositório e instale as dependências:

```bash
npm install
```

2. Crie o arquivo `.env` na raiz do projeto:

```env
DATABASE_URL="postgresql://..."
JWT_SECRET="sua-chave-secreta"
```

3. Aplique as migrations e execute o seed:

```bash
npx prisma migrate deploy
npm run seed
```

4. Inicie o servidor de desenvolvimento:

```bash
npm run dev
```

Acesse [http://localhost:3000](http://localhost:3000).

## Scripts disponíveis

| Comando | Descrição |
|---------|-----------|
| `npm run dev` | Inicia o servidor de desenvolvimento |
| `npm run build` | Gera o build de produção |
| `npm run start` | Inicia o servidor em produção |
| `npm run lint` | Executa o ESLint |
| `npm run seed` | Popula o banco com dados iniciais |

## Estrutura principal

```
app/
  api/          # Rotas de API (Next.js route handlers)
    admin/      # Endpoints administrativos (requireAdmin)
    auth/       # Login e autenticação
  (dashboard)/  # Páginas protegidas do dashboard
  login/        # Página de login
components/
  admin/        # Componentes do painel admin (usuários, metas)
  ui/           # Componentes genéricos de interface
lib/
  auth-server.ts   # requireAuth / requireAdmin
  api.ts           # Helper apiFetch (anexa JWT do localStorage)
  charts/
    registry.ts    # KPI_REGISTRY (7 KPIs) e CHART_REGISTRY (30 gráficos)
  formatter.ts     # Formatadores: brl, pct, int, days, km, m3
prisma/
  schema.prisma    # Schema do banco de dados
```

## Modelos de dados

| Modelo | Descrição |
|--------|-----------|
| `User` | Usuários com roles e dashboards permitidos |
| `Meta` | Metas vinculadas a gráficos com prazo e status |
| `Ctrc` | Conhecimentos de transporte (documentos de frete) |
| `Motorista` | Cadastro de motoristas |
| `Veiculo` | Frota de veículos |
| `Vendedor` | Equipe de vendas |
| `Lancamento` | Lançamentos financeiros |
| `Ocorrencia` | Ocorrências em CTRCs |

## Roles de acesso

| Role | Permissões |
|------|-----------|
| `ADMIN` | Acesso total, incluindo painel admin |
| `MANAGER` | Visualização e edição de dados operacionais |
| `ANALYST` | Acesso analítico ao dashboard |
| `OPERATOR` | Acesso operacional restrito |
| `VIEWER` | Somente leitura |
