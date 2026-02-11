## IceHub – Documentação do Aplicativo

### Visão geral

O IceHub é um aplicativo mobile (React Native/Expo) focado em hockey no gelo. Ele oferece:

- **Modo NHL**: jogos do dia, lista de times, favoritos e notícias da liga.
- **Modo Olimpíadas**: jogos e seleções de hockey nas Olimpíadas de Inverno, com favoritos e notícias específicas.
- **Conteúdo complementar**: wallpapers temáticos e uma área de perfil (por enquanto mock).

O projeto é dividido em dois diretórios principais:

- **`frontend/`**: app mobile em React Native/Expo.
- **`server/`**: API Node.js/Express que centraliza chamadas externas (NHL, APISports, GNews/NewsAPI, TheSportsDB) e oferece endpoints próprios.

---

## Arquitetura de alto nível

### Frontend (Expo/React Native)

- **Stack principal**:
  - React Native + Expo.
  - Navegação por abas (`RootTabParamList` em `frontend/src/types/navigation.ts`).
  - Estado global com **Zustand** (`useAppStore`).
  - Persistência local com **AsyncStorage** (`useHydrateApp`).
  - Camada visual com tema customizado (`theme.ts`) e hook `useThemeColors`.

- **Telas principais** (todas usando `IceBackground` + `ScreenHeader`):
  - `HomeScreen`: jogos de hoje (NHL) ou jogos olímpicos.
  - `TeamsScreen`: lista de times (NHL) ou seleções olímpicas para marcar favoritos.
  - `FavoritesScreen`: exibe apenas os times/seleções marcados como favoritos.
  - `GameDayScreen`: foco em jogos do time ou seleções (modo olímpico).
  - `NewsScreen`: notícias relacionadas à NHL ou Olimpíadas.
  - `WallpapersScreen`: grade de wallpapers.
  - `ProfileScreen`: área de perfil (stub).

- **Serviços de dados**:
  - `nhlApi.ts` e `nhlHooks.ts`: integração com `/api/nhl` (servidor).
  - `hockeyApi.ts`: integração com `/api/hockey` (servidor / APISports Hockey).
  - `newsApi.ts`: integração com `/api/news`.
  - `wallpapersApi.ts`: integração com `/api/wallpapers`.

- **Configuração de base URL**:
  - `frontend/src/config.ts`:
    - Usa `EXPO_PUBLIC_API_URL` (quando definido) ou fallback `http://localhost:4000`.
    - Todos os serviços (`nhlApi`, `hockeyApi`, `newsApi`, `wallpapersApi`) montam URLs a partir de `API_BASE_URL`.

### Backend (Node.js/Express)

- **Entrada principal**: `server/src/index.ts`
  - Carrega variáveis de ambiente com `dotenv/config`.
  - Cria app Express.
  - Aplica middlewares:
    - `cors` restringindo `origin` a `config.frontendUrl`.
    - `express.json()` para JSON.
  - Registra rotas:
    - `/api/auth` → `authRoutes`
    - `/api/user` → `userRoutes`
    - `/api/nhl` → `nhlProxyRoutes`
    - `/api/news` → `newsRoutes`
    - `/api/wallpapers` → `wallpapersRoutes`
    - `/api/sportsdb` → `sportsdbRoutes`
    - `/api/hockey` → `hockeyApiRoutes`
  - Exposição de `GET /health` para health check.
  - Middleware final de erro: `errorHandler`.

- **Configuração de ambiente**: `server/src/config.ts`
  - `port`: porta da API (`PORT` ou 4000).
  - `frontendUrl`: para CORS (`FRONTEND_URL` ou `http://localhost:8081`).
  - `jwt.secret` e `jwt.expiresIn`.
  - Chaves de APIs externas:
    - `NEWS_API_KEY`
    - `GNEWS_API_KEY`
    - `THESPORTSDB_API_KEY`
    - `APISPORTS_HOCKEY_KEY`
  - `databaseUrl`: `DATABASE_URL` (SQLite/Prisma por padrão).

- **Banco de dados (Prisma)**:
  - Schema em `server/prisma/schema.prisma`.
  - Modelo `User` com:
    - Campos básicos (`id`, `email`, `password`, `name`, timestamps).
    - `favoriteTeamIds` (string JSON com IDs de times).
    - `pushToken`, `notifyGames`, `notifyNews`, `darkMode`.
  - No momento, as rotas de auth/usuário usam mocks (não persistem de fato).

---

## Estado global e tema

### Store global (`useAppStore`)

Local: `frontend/src/store/useAppStore.ts`

Campos principais:

- **`mode: 'nhl' | 'olympics'`**:
  - Controla se o app está em modo NHL ou Olimpíadas.
- **`user: UserProfile | null`**:
  - Perfil básico do usuário (mock), com `favoriteTeams`.
- **`token: string | null`**:
  - Token de autenticação (mock).
- **`favoriteTeams: number[]`**:
  - IDs de times NHL favoritos.
- **`favoriteOlympicTeams: number[]`**:
  - IDs de seleções olímpicas favoritas.
- **`gameDayTeamId: number | null`**:
  - Reservado para destacar um time específico no Game Day.

Métodos:

- **`setMode(mode)`**: alterna entre `nhl` e `olympics`.
- **`setAuth({ user, token })`**: define usuário e token, inicializando `favoriteTeams` com os favoritos do usuário.
- **`logout()`**: limpa usuário, token e favoritos.
- **`toggleFavoriteTeam(teamId)`**: adiciona/remove time NHL favorito.
- **`toggleFavoriteOlympicTeam(teamId)`**: adiciona/remove seleção olímpica favorita.
- **`setGameDayTeam(teamId | null)`**: configura time foco para Game Day.
- **`hydrateFromStorage(data)`**: aplica snapshot carregado do AsyncStorage.

### Persistência local (`useHydrateApp`)

Local: `frontend/src/hooks/useHydrateApp.ts`

- Usa `AsyncStorage` com a chave `@icehub_app_state_v1`.
- No `useEffect` inicial:
  - Lê os dados salvos.
  - Faz `hydrateFromStorage(parsed)` na store.
  - Marca `isHydrated = true`.
- Em outro `useEffect`:
  - Quando `isHydrated` é `true`, salva continuamente um snapshot de:
    - `user`, `token`, `favoriteTeams`, `favoriteOlympicTeams`, `mode`.

### Tema visual (`theme.ts` + `useThemeColors`)

- **Temas**:
  - `colors`: tema padrão NHL (azul claro e laranja).
  - `colorsOlympics`: variação com cores base dos anéis olímpicos.
- **Hook `useThemeColors`**:
  - Lê `mode` da store.
  - Retorna `colorsOlympics` quando `mode === 'olympics'`, senão `colors`.
- **`IceBackground`**:
  - Aplica gradiente de fundo e desenha linhas/círculos de rink de hockey (NHL ou Olimpíadas com leve variação de cor).

---

## Navegação e cabeçalho de tela

### Navegação por abas

- Tipagem em `frontend/src/types/navigation.ts`:
  - `RootTabParamList` define abas:
    - `Home`
    - `Teams`
    - `Favorites`
    - `News`
    - `Wallpapers`
    - `Profile`
    - `GameDay`

(A configuração do `Navigator` em si fica fora dos arquivos inspecionados, mas as telas presumem um bottom tab navigator.)

### `ScreenHeader`

Local: `frontend/src/components/ScreenHeader.tsx`

- Renderiza:
  - **Linha de ações** no topo:
    - Botão de alternância **NHL ⇄ Olimpíadas**:
      - Usa `mode` e `setMode` da store.
      - Ao alternar, também navega para `'Home'`.
    - Botão **Favoritos**: navega para `Favorites`.
    - Botão **Wallpapers**: navega para `Wallpapers`.
    - Botão **Perfil**: navega para `Profile`.
  - **Área opcional de hero** (ex.: `NhlHero`, `OlympicHero`).
  - **Título/subtítulo da tela** com ícone.

Fluxo de alternância de modo:

1. Usuário toca no botão de troca de modo (ícone NHL ↔ anéis olímpicos).
2. `onSwitchMode`:
   - Calcula `nextMode` (`'nhl'` ou `'olympics'`).
   - Chama `setMode(nextMode)` na store.
   - Navega para `'Home'`.
3. O tema, fundo, textos e dados passam a se comportar de acordo com o novo modo.

---

## Serviços e fluxos de dados (frontend → backend → APIs externas)

### `nhlApi` e `nhlHooks` (NHL Stats API via backend)

Local: `frontend/src/services/nhlApi.ts` e `frontend/src/services/nhlHooks.ts`

- **`NHL_API_BASE`**: `${API_BASE_URL}/api/nhl`.
- Função interna **`get<TResponse>(path, params?)`**:
  - Monta URL com `URL(NHL_API_BASE + path)`.
  - Aplica `searchParams` a partir de `params` (ignorando `undefined`).
  - Faz `fetch`.
  - Se resposta não for `ok`, lança erro com status.
  - Retorna `response.json()` como `TResponse`.

Endpoints consumidos:

- **`fetchTodayGames()`**:
  - Chama `GET /api/nhl/schedule/today`.
  - Resposta tipada como `NhlScheduleResponse` com `dates[].games[]`.
  - Retorna `games` do primeiro elemento de `dates` (ou `[]`).
- **`fetchScheduleByDate(date)`**:
  - Chama `GET /api/nhl/schedule?date=YYYY-MM-DD`.
- **`fetchStandings(season?)`**:
  - Chama `GET /api/nhl/standings?season=...` quando `season` é fornecida.
- **`fetchGameFeed(gameId)`**:
  - Chama `GET /api/nhl/game/:gameId/feed/live`.

Hook `useTodayGames()`:

- Estado local:
  - `games`: lista de jogos enriquecidos com `gameDateLocal` (horário local formatado pt-BR).
  - `isLoading`, `error`.
- `load()`:
  - Chama `fetchTodayGames()`.
  - Converte `gameDate` em `gameDateLocal` com `toLocaleTimeString('pt-BR')`.
  - Atualiza `state`.
- `useEffect` inicial dispara `load()`.
- Retorno:
  - `{ games, isLoading, error, refetch: load }`.

### `hockeyApi` (APISports Hockey – Olimpíadas e ligas internacionais)

Local: `frontend/src/services/hockeyApi.ts`

- **`HOCKEY_BASE`**: `${API_BASE_URL}/api/hockey`.
- Função genérica `get<T>`:
  - Monta URL com `HOCKEY_BASE + path` e `params`.
  - Chama backend `server/src/routes/hockey-api.routes.ts`.
  - Em caso de erro, tenta extrair `message` do JSON; se não houver, lança `'Erro na API Hockey'`.

Funções principais:

- **`fetchOlympicGames(season = '2022')`**:
  - Chama `GET /api/hockey/olympics/games?season=2022`.
  - Retorna `data.response ?? []` (onde `data` é resposta da APISports via backend).
- **`fetchOlympicTeams(season = '2022')`**:
  - Chama `GET /api/hockey/olympics/teams?season=2022`.
  - Normaliza para `OlympicTeam` com campos `id`, `name`, `logo`, `country`.
- **`fetchOlympicLeagueId()`**:
  - Chama `GET /api/hockey/olympics/leagues`.
  - Retorna ID numérico da liga olímpica ou `null`.

### `newsApi` (notícias)

Local: `frontend/src/services/newsApi.ts`

- Usa `API_BASE_URL` e monta `GET /api/news`.
- Tipos:
  - `NewsArticle`: `{ title, description?, url, publishedAt, urlToImage?, source? }`.
  - `NewsResponse`: `{ source: string; articles: NewsArticle[] }`.
- **`fetchNews(query?)`**:
  - Adiciona `q` como query string quando fornecido.
  - Se `res.ok` for `false`, lança erro `"Não foi possível carregar notícias."`.
  - Retorna `data.articles ?? []`.

### `wallpapersApi` (wallpapers)

Local: `frontend/src/services/wallpapersApi.ts`

- Usa `API_BASE_URL` → `GET /api/wallpapers`.
- Tipos:
  - `Wallpaper`: `{ id, teamId, title, imageUrl }`.
  - `WallpapersResponse`: `{ wallpapers: Wallpaper[] }`.
- **`fetchWallpapers(teamId?)`**:
  - Quando `teamId` é passado, adiciona `?teamId=` à URL.
  - Se resposta não for `ok`, retorna `[]`.
  - Caso contrário, retorna `data.wallpapers ?? []`.

---

## Fluxos de uso por tela

### 1. Tela Home (`HomeScreen`)

Local: `frontend/src/screens/HomeScreen.tsx`

Comportamento:

- Lê:
  - `mode` da store (`nhl` ou `olympics`).
  - Hook `useTodayGames()` para jogos NHL.
  - Função `fetchOlympicGames` quando em modo olímpico.
- Exibe:
  - `IceBackground` (rink).
  - `ScreenHeader` com:
    - `title`: `'Hockey Olímpico'` ou `'IceHub'`.
    - `subtitle`: texto descritivo do modo.
    - `icon` e `hero` (`OlympicHero` ou `NhlHero`).

Lista de jogos:

- Quando **modo NHL**:
  - `games` vem de `useTodayGames` (NHL).
  - Cada jogo é renderizado como `GameCard` com:
    - `homeTeam`: `game.teams.home.team.abbreviation`.
    - `awayTeam`: `game.teams.away.team.abbreviation`.
    - `startTime`: `game.gameDateLocal` (horário local).
    - `status`:
      - `'FINAL'` se `statusCode === '3'`.
      - `'LIVE'` se `abstractGameState === 'Live'`.
      - Senão `'UPCOMING'`.
  - Caso `games.length === 0`:
    - Mensagem “Nenhum jogo hoje na NHL. Puxe para atualizar ou volte mais tarde.”

- Quando **modo Olimpíadas**:
  - Usa estado local `olympicGames`, carregado por `fetchOlympicGames('2022')`.
  - Função `normalizeOlympicGames`:
    - Mapeia campos do retorno da APISports para:
      - `homeName`, `awayName`, `date`, `time`, `status`, e placares.
    - Determina `status` (`LIVE`, `FINAL`, `UPCOMING`) com base em códigos como `LIVE`, `FT`, `AOT`, etc.
  - Renderiza `GameCard` para cada jogo.
  - Caso não haja jogos:
    - Mensagem orientando a configurar `APISPORTS_HOCKEY_KEY` no servidor.

Fluxo do usuário:

1. Abre o app (assumindo que já está logado/sem login).
2. Home é exibida com o modo atual salvo (padrão NHL).
3. Pode “puxar para baixo” para atualizar lista de jogos (chamando `refetch` ou `loadOlympic`).
4. Pode alternar entre NHL/Olimpíadas pelo botão do `ScreenHeader`.

### 2. Tela Times (`TeamsScreen`)

Local: `frontend/src/screens/TeamsScreen.tsx`

Objetivo: listar times e permitir marcar/desmarcar favoritos.

Fluxo de dados:

- Lê:
  - `mode` da store.
  - `favoriteTeams` e `favoriteOlympicTeams`.
  - `toggleFavoriteTeam` e `toggleFavoriteOlympicTeam`.
- Quando **modo NHL**:
  - `loadNhl()` chama `nhlApi.get('/teams')`.
  - Resposta tipada como `TeamsResponse { teams: NhlTeam[] }`.
  - Ordena times alfabeticamente: `list.sort((a, b) => a.name.localeCompare(b.name))`.
- Quando **modo Olimpíadas**:
  - `loadOlympic()` chama `fetchOlympicTeams('2022')`.

Renderização:

- Usa `FlatList` com cartões de time:
  - Cada item mostra:
    - Abreviação (`abbr`): para NHL, `team.abbreviation`; para Olimpíadas, 3 primeiras letras do nome da seleção.
    - Nome completo do time.
    - Subtítulo:
      - NHL: divisão (`division.name` sem “ Division”).
      - Olimpíadas: `country.name` ou “Olimpíadas”.
  - Ícone de estrela:
    - Preenchida quando `id` está em `favorites`.
    - Outline quando não está.
  - Ao tocar no cartão:
    - Chama `toggleFavorite(item.id)` na store (para o modo atual).

Fluxo do usuário:

1. Abre aba **Times**.
2. O app carrega a lista da fonte correta (NHL ou Olimpíadas).
3. Usuário toca em um cartão para marcar/desmarcar favorito.
4. Estados de favoritos são persistidos via AsyncStorage.

### 3. Tela Favoritos (`FavoritesScreen`)

Local: `frontend/src/screens/FavoritesScreen.tsx`

Objetivo: mostrar apenas os times/seleções que o usuário marcou como favoritos.

Fluxo de dados:

- Lê:
  - `mode`.
  - `favoriteTeams` e `favoriteOlympicTeams`.
- `loadFavorites()`:
  - Se modo Olimpíadas:
    - Se não há `favoriteOlympicTeams`, limpa lista e encerra.
    - Caso contrário, chama `fetchOlympicTeams('2022')` e filtra por IDs presentes.
  - Se modo NHL:
    - Mesma ideia, usando `nhlApi.get('/teams')` e filtrando por `favoriteTeams`.

Renderização:

- Se `loading`:
  - Exibe esqueletos (`Skeleton`).
- Se não há favoritos:
  - Mensagem “Nenhum favorito” com instrução:
    - “Vá em Seleções Olímpicas...” ou “Vá em Times...” dependendo do modo.
- Caso haja dados:
  - Lista com cartões simples (similar à tela de times, mas sem botão de estrela).

Fluxo do usuário:

1. Marca favoritos na tela **Times**.
2. Abre a aba **Favoritos**.
3. Vê apenas os times ou seleções que marcou.
4. Pode puxar para atualizar caso haja alterações externas.

### 4. Tela Game Day (`GameDayScreen`)

Local: `frontend/src/screens/GameDayScreen.tsx`

Objetivo: consolidar jogos do “Game Day”.

Comportamento atual:

- Modo NHL:
  - Não há integração completa ainda (mensagem orientando a selecionar um time favorito).
- Modo Olimpíadas:
  - Usa `fetchOlympicGames('2022')` similar à Home.
  - Normaliza dados com `normalizeOlympicGames`.
  - Exibe lista de `GameCard` com:
    - `homeTeam`, `awayTeam` (primeiras 3 letras, maiúsculas, se necessário).
    - `startTime` (`date + time`).
    - `status`.

Fluxo do usuário:

1. No modo Olimpíadas, abre a aba **Game Day**.
2. Visualiza lista de jogos olímpicos.
3. Pode puxar para atualizar dados (apenas em modo olímpico).

### 5. Tela Notícias (`NewsScreen`)

Local: `frontend/src/screens/NewsScreen.tsx`

Objetivo: mostrar notícias atualizadas de hockey.

Fluxo de dados:

- Lê `mode` da store.
- `load()`:
  - Define `query`:
    - `'Olympic hockey'` se modo Olímpico.
    - `'NHL hockey'` se modo NHL.
  - Chama `fetchNews(query)`, que executa `GET /api/news?q=...`.
  - Atualiza `articles` e estados de loading/refreshing.

Backend (`newsRoutes`):

- Tenta:
  - Buscar via **NewsAPI** (`NEWS_API_KEY`).
  - Se falhar ou não houver resultados, tenta **GNews** (`GNEWS_API_KEY`).
  - Se ainda assim não houver, retorna um artigo mock orientando configuração das chaves.
- Sempre responde com `{ source, articles }`.

Renderização:

- Se `loading`:
  - Esqueletos em formato de cartões com imagem e texto.
- Se `articles.length === 0`:
  - Mensagem sobre ausência de notícias e instrução para configurar `GNEWS_API_KEY` ou `NEWS_API_KEY`.
- Caso haja artigos:
  - Para cada `article`:
    - Imagem (`urlToImage`) ou placeholder.
    - Título (`title`), descrição e data formatada pt-BR.
    - Ao tocar, abre `Linking.openURL(article.url)`.

Fluxo do usuário:

1. Abre aba **Notícias**.
2. Vê notícias relevantes ao modo atual (NHL ou Olimpíadas).
3. Toca em uma notícia para abrir no navegador.
4. Pode puxar para atualizar.

### 6. Tela Wallpapers (`WallpapersScreen`)

Local: `frontend/src/screens/WallpapersScreen.tsx`

Objetivo: exibir wallpapers de hockey/NHL.

Fluxo de dados:

- `load()` chama `fetchWallpapers()` (sem filtro de time por enquanto).
- Backend (`wallpapersRoutes`):
  - Usa TheSportsDB (`THESPORTSDB_API_KEY` ou key padrão `123`) para buscar times NHL.
  - Monta lista de wallpapers:
    - `GENERIC_WALLPAPERS`: 3 imagens fixas (Pexels).
    - Imagens dos times retornadas pela API (`strBanner`, `strFanart1`, `strLogo`).
  - Se parametro `teamId` é informado:
    - Filtra por `teamId` correspondente ou entradas genéricas (`teamId === null`).

Renderização:

- Grid responsivo com 2 colunas, calculado por `Dimensions.get('window')`.
- Cada tile contém:
  - Imagem (`Image` com `uri = imageUrl`).
  - Título embaixo (`title`).

Fluxo do usuário:

1. Abre aba **Wallpapers** (ou via menu do `ScreenHeader`).
2. Vê grid de imagens.
3. Pode puxar para atualizar (recarregar e pegar possíveis novas imagens da API).

### 7. Tela Perfil (`ProfileScreen`)

Local: `frontend/src/screens/ProfileScreen.tsx`

Atualmente é um **stub**:

- Exibe apenas:
  - Título “Perfil”.
  - Mensagem “Login e configurações serão exibidos aqui.”

Backend de suporte (planejado):

- `authRoutes`:
  - `POST /api/auth/login`: retorna token e usuário mock.
  - `POST /api/auth/register`: retorna usuário criado (mock).
- `userRoutes`:
  - `GET /api/user/me`: retorna usuário mock fixo.
  - `PUT /api/user/preferences`: ecoa as preferências recebidas.

Fluxo esperado no futuro:

1. Usuário fará login/cadastro.
2. Token será armazenado na store (`setAuth`) e persistido no AsyncStorage.
3. Tela de Perfil mostrará dados reais do usuário e permitirá ajuste de preferências.

---

## Backend – detalhes dos principais endpoints

### `/api/nhl` – Proxy NHL Stats API

Local: `server/src/routes/nhl-proxy.routes.ts`

Função auxiliar `nhlGet(path, params?)`:

- Usa `axios.get` em `https://statsapi.web.nhl.com/api/v1`.
- Aplica `params` e `timeout`.

Rotas:

- `GET /schedule/today`:
  - Calcula data de hoje (`YYYY-MM-DD`).
  - Chama `/schedule?date=...&expand=schedule.linescore`.
  - Retorna JSON diretamente para o frontend.
- `GET /schedule?date=...`:
  - Mesmo fluxo, mas usando data vinda da query string.
- `GET /teams`:
  - Chama `/teams?expand=team.roster`.
- `GET /standings?season=...`:
  - Chama `/standings?season=...`.
- `GET /game/:gameId/feed/live`:
  - Dados de jogo ao vivo, boxscore e play-by-play.
- `GET /people/:playerId`:
  - Dados de um jogador específico.

### `/api/hockey` – APISports Hockey (inclui Olimpíadas)

Local: `server/src/routes/hockey-api.routes.ts`

Função `getHeaders()`:

- Lê `APISPORTS_HOCKEY_KEY` de `config`.
- Se não existir, lança erro “APISPORTS_HOCKEY_KEY não configurada”.
- Usada em todas as chamadas à APISports.

Rotas gerais:

- `GET /leagues`:
  - Lista ligas de hockey disponíveis.
- `GET /games`:
  - Recebe `league` e `season`, chama `/games` na APISports.
- `GET /games/statistics?game=ID`:
  - Estatísticas detalhadas de um jogo.
- `GET /teams`:
  - Times por `league` e `season`.
- `GET /standings`:
  - Classificação por `league` e `season`.

Rotas específicas de Olimpíadas:

- `GET /olympics/leagues`:
  - Função `getOlympicLeagueId()`:
    - Chama `/leagues` na APISports.
    - Procura por ligas cujo `name` contenha “olympic”/“olympics”.
    - Se não encontrar, tenta IDs conhecidos (76/77).
    - Cacheia o ID encontrado em `cachedOlympicLeagueId`.
  - Retorna `{ olympicLeagueId }`.

- `GET /olympics/games`:
  - Usa `getOlympicLeagueId()` para obter a liga.
  - Chama `/games?league=ID&season=YYYY`.
  - Retorna JSON para o frontend.

- `GET /olympics/teams`:
  - Similar, chamando `/teams?league=ID&season=YYYY`.

### `/api/news` – Notícias (NewsAPI / GNews)

Local: `server/src/routes/news.routes.ts`

- Funções:
  - `mockArticles()`:
    - Retorna uma lista mínima orientando configuração de chaves.
  - `fetchGNews(query)`:
    - Usa `GNEWS_API_KEY` para chamar `https://gnews.io/api/v4/search`.
  - `fetchNewsApi(query)`:
    - Usa `NEWS_API_KEY` para chamar `https://newsapi.org/v2/everything`.

Rota:

- `GET /api/news?q=...`:
  - Tenta `fetchNewsApi` (NewsAPI).
  - Se vazio, tenta `fetchGNews`.
  - Se ainda vazio, usa `mockArticles`.
  - Responde `{ source, articles }`.

### `/api/wallpapers` – Wallpapers (TheSportsDB)

Local: `server/src/routes/wallpapers.routes.ts`

- Função `fetchNhlTeamsFromSportsDb()`:
  - Usa `THESPORTSDB_API_KEY` (ou key padrão).
  - Chama `searchteams.php?t=NHL`.
  - Filtra apenas times de `strSport === 'Ice Hockey'`.
  - Monta lista de objetos `{ id, teamId, title, imageUrl }`.

Rota:

- `GET /api/wallpapers?teamId=...`:
  - Monta lista total:
    - `GENERIC_WALLPAPERS` + resultados da TheSportsDB.
  - Se `teamId` foi enviado:
    - Filtra para wallpapers do time ou genéricos.
  - Em erro, retorna apenas `GENERIC_WALLPAPERS`.

### `/api/sportsdb` – Logos NHL (TheSportsDB)

Local: `server/src/routes/sportsdb.routes.ts`

- Mantém mapa `NHL_ABBR_TO_QUERY` de abreviação → nome completo.
- `fetchLogoForAbbr(abbr)`:
  - Chama `searchteams.php` com o nome do time.
  - Retorna `strBadge` ou `strLogo`.
- Cache em memória (`logoCache`) para otimizar.

Rota:

- `GET /api/sportsdb/nhl-logos?abbreviations=TOR,BOS,...`:
  - Para cada abreviação, busca logo (usando cache).
  - Responde `{ logos: { TOR: 'url1', BOS: 'url2', ... } }`.

### `/api/auth` e `/api/user` – Autenticação/Usuário (mock)

Locais:

- `server/src/routes/auth.routes.ts`
- `server/src/routes/user.routes.ts`

Autenticação (`authRoutes`):

- `POST /api/auth/login`:
  - Recebe `email`.
  - Retorna objeto fixo:
    - `token: 'dev-mock-token'`.
    - `user`: dados estáticos, incluindo `favoriteTeamIds`.
- `POST /api/auth/register`:
  - Recebe `email`, `name`.
  - Retorna usuário mock com mensagem de cadastro bem-sucedido.

Usuário (`userRoutes`):

- `GET /api/user/me`:
  - Retorna usuário estático (simulando usuário logado).
- `PUT /api/user/preferences`:
  - Ecoa o body como `preferences`, simulando update bem-sucedido.

### Middleware de erros

Local: `server/src/middlewares/error.middleware.ts`

- `errorHandler(err, _req, res, _next)`:
  - Loga o erro no console.
  - Usa `err.statusCode` ou `err.status` ou `500` como HTTP status.
  - Corpo:
    - `message`: mensagem do erro ou mensagem genérica.
    - `stack`: incluída apenas quando `NODE_ENV !== 'production'`.

---

## Variáveis de ambiente e configuração

### Frontend (`frontend/.env`)

- `EXPO_PUBLIC_API_URL`:
  - Deve apontar para a URL pública do backend.
  - Exemplo desenvolvimento: `http://192.168.0.10:4000` (IP da máquina no Wi-Fi).

### Backend (`server/.env`)

Principais variáveis:

- `PORT`: porta da API (padrão 4000).
- `FRONTEND_URL`: origem permitida pelo CORS (ex.: `http://localhost:8081` ou URL do Expo).
- `DATABASE_URL`: URL de banco (para Prisma; por padrão SQLite).
- `JWT_SECRET`, `JWT_EXPIRES_IN`: para autenticação real (ainda não implementada).
- `NEWS_API_KEY`: chave da NewsAPI.
- `GNEWS_API_KEY`: chave alternativa da GNews.
- `THESPORTSDB_API_KEY`: chave da TheSportsDB (pode ser `123` em dev).
- `APISPORTS_HOCKEY_KEY`: chave da APISports Hockey (obrigatória para dados olímpicos reais).

---

## Fluxo completo de início do app

1. **Backend sobe** (`server/src/index.ts`):
   - Lê `.env` e configura `config`.
   - Sobe servidor Express na porta configurada.
   - Registra rotas e middleware de erro.

2. **Frontend sobe** (Expo):
   - Lê `EXPO_PUBLIC_API_URL` (se existir) e configura `API_BASE_URL`.
   - Inicializa `useAppStore` com estado padrão.
   - Hook `useHydrateApp()`:
     - Carrega snapshot de `AsyncStorage`.
     - Aplica no store via `hydrateFromStorage`.
     - Passa a salvar mudanças do estado global.

3. **Usuário abre o app**:
   - Tela Home é carregada com o modo salvo (`mode`) e favoritos da sessão anterior.
   - `useTodayGames()` dispara requisição `GET /api/nhl/schedule/today` para preencher jogos (modo NHL).
   - Se modo `olympics`, Home chama `fetchOlympicGames` para `/api/hockey/olympics/games`.

4. **Usuário navega pelo app**:
   - Seleciona times em **Times**; store atualiza `favoriteTeams`/`favoriteOlympicTeams` e persiste.
   - Em **Favoritos**, o app busca novamente times/seleções e filtra pelos favoritos.
   - Em **Notícias**, o app consulta `/api/news` conforme o modo.
   - Em **Wallpapers**, consome `/api/wallpapers` (com ou sem `teamId`).

---

## Considerações finais e pontos de extensão

- **Autenticação real**:
  - Atualmente as rotas de auth/usuário são mocks.
  - Para produção, seria necessário:
    - Implementar criação/validação de usuários via Prisma.
    - Gerar JWT real usando `config.jwt`.
    - Proteger rotas com middleware de autenticação.

- **Integração mais profunda com favoritos e Game Day**:
  - `gameDayTeamId` ainda não é usado plenamente.
  - Poderia ser usado para:
    - Filtrar jogos apenas do(s) time(s) favoritos na tela Game Day.

- **Push notifications**:
  - O modelo `User` já possui `pushToken`.
  - Backend ainda não implementa envio de notificações.

- **Melhorias de UX**:
  - Adicionar filtros por data, liga, fase das Olimpíadas.
  - Exibir logos dos times usando `/api/sportsdb/nhl-logos` nos cartões de jogo/time.

Este documento resume a arquitetura, componentes e fluxos principais do IceHub, tanto no frontend quanto no backend, servindo como guia de manutenção e evolução do projeto.

