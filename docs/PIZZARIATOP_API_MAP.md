# Mapeamento Completo da API PizzariaTop

- **Base URL (Produção)**: `https://apipizzariatop.dev.vilhena.ifro.edu.br/api`
- **Uploads / Imagens estáticas**: `https://apipizzariatop.dev.vilhena.ifro.edu.br/uploads/<filename>` (fora do prefixo `/api`)
- **Autenticação**:
  - Cookie HTTP-only `user_session` (24h TTL em `user_sessions`)
  - Suporte opcional a header `Authorization: Bearer <token>` (usando `token` retornado em `POST /api/auth/login` para clientes mobile/Expo Go)
  - Header opcional `x-device-fingerprint` em `POST /api/auth/login` (usado junto ao IP no rate limit de 5 tentativas)

---

## 1. Autenticação
| Método | Rota | Auth | Payload / Query | Resposta / Comportamento |
|---|---|---|---|---|
| `POST` | `/auth/login` | Pública (+ rate limit) | Body: `{ email, senha, device_id? }` | Valida `usuarios` + bcrypt; cria `user_sessions`, define cookie `user_session` e retorna `{ success, message, require_password_change, data: { user: { id, nome, email, cpf, tipo_usuario }, token? } }` |
| `GET` | `/auth/me` | Sessão (`validateSession`) | — | Retorna `{ success, message, user }` (sem `senha_hash`) ou `401` |
| `POST` | `/auth/me` | Sessão opcional (`extractSession`) | — | Logout: desativa `user_sessions` (`is_active=0`) e limpa cookie `user_session` |
| `POST` | `/create-user` | Pública | Body: `{ nome, email, senha }` | Cria usuário cliente (`tipo_usuario='cliente'`); senha mín. 6 chars; retorna `{ success, data: { id, nome, email } }` |

---

## 2. Usuários e Perfil
| Método | Rota | Auth | Payload / Query | Resposta / Comportamento |
|---|---|---|---|---|
| `GET` | `/usuarios` | Opcional | Query: `?tipo=` | Lista usuários (mascara `cpf` e `telefone` se não for `admin`); retorna `{ success, data, count }` |
| `POST` | `/usuarios` | Pública | Body: `{ nome, email, senha, tipo_usuario?, codigo_afiliado_indicacao? }` | Exige senha forte; se houver indicação válida, soma +50 `pontos_fidelidade` ao indicador |
| `GET` | `/usuarios/[id]` | Pública (sem auth na rota) | Param: `id` | Retorna dados do usuário (gera `codigo_afiliado` automaticamente se ausente) |
| `PUT` / `PATCH` | `/usuarios/[id]` | Parcial (admin p/ alterar CPF) | Param: `id`, Body parcial de perfil/cargo/senha | Atualiza dados do usuário |
| `DELETE` | `/usuarios/[id]` | Pública (sem auth na rota) | Param: `id` | Tenta hard delete; em erro de FK faz soft-delete (`ativo = 0`) |
| `PATCH` | `/usuarios/me/config` | `authenticate` | Body: `{ mostrar_infos_avaliacao }` | Atualiza preferência de exibição de dados em avaliações públicas |
| `GET` | `/users/profile` | `withAuth` | — | Retorna perfil do usuário autenticado |
| `PUT` | `/users/profile` | `withAuth` | Body: `{ nome?, email?, default_payment_method? }` | Atualiza perfil e método de pagamento padrão |
| `GET` | `/users/avatar` | `withAuth` | — | Retorna URL do avatar (`profile_picture_url`) |
| `POST` | `/users/avatar` | `withAuth` | `multipart/form-data` campo `avatar` (<= 3MB, jpeg/png/gif/webp) | Salva em `uploads/avatar_<id>_...` e atualiza `profile_picture_url` |
| `DELETE` | `/users/avatar` | `withAuth` | — | Remove arquivo de avatar e limpa coluna no banco |

---

## 3. Endereços e CEP
| Método | Rota | Auth | Payload / Query | Resposta / Comportamento |
|---|---|---|---|---|
| `GET` | `/enderecos` | `withAuth` | — | Lista endereços do usuário autenticado (`logradouro AS rua`) |
| `POST` | `/enderecos` | `withAuth` | Body: `{ logradouro\|rua, numero, complemento?, bairro, cidade, estado?, cep? }` | Cadastra novo endereço (`201`) |
| `GET` / `PUT` / `PATCH` / `DELETE` | `/enderecos/[id]` | Pública (sem auth na rota) | Param: `id` | Busca/atualiza/remove endereço por ID (atenção: rota legado referencia colunas `rua`/`ativo`) |
| `GET` | `/cep` | Pública | Query: `?cep=76900000` | Consulta ViaCEP com fallback mock para `76900-000` |

---

## 4. Cardápio, Produtos, Sabores, Tamanhos, Massas, Bordas, Ingredientes e Combos
| Método | Rota | Auth | Payload / Query | Resposta / Comportamento |
|---|---|---|---|---|
| `GET` | `/categorias` | Pública | — | Lista `categorias_produtos` ordenadas por `ordem_exibicao` |
| `POST` | `/categorias` | `withAdminAuth` | Body: `{ nome_categoria, descricao?, ativo?, ordem_exibicao? }` | Cria categoria |
| `GET` | `/produtos` | Pública | Query: `?action=showcase` ou `?showcase=true` | Lista até 12 itens em vitrine (categorias `1,2`, com fallback se vazio) ou todos os produtos |
| `POST` | `/produtos` | `withAdminAuth` | Body: `{ action:'fix-data' }` ou `{ nome_produto, descricao?, preco_base, imagem_url?, disponivel?, id_categoria? }` | Cria produto ou normaliza vitrine |
| `GET` / `PUT` / `PATCH` / `DELETE` | `/produtos/[id]` | Pública (sem auth na rota) | Param: `id` | CRUD individual de produto |
| `GET` | `/sabores` | Pública | Query opcional `?disponivel=true` | Lista `sabores_pizza` |
| `POST` | `/sabores` | Pública (sem auth na rota) | Body: `{ nome_sabor, descricao?, categoria_sabor?, preco_adicional?, imagem_url? }` | Cadastra sabor de pizza |
| `GET` / `PUT` / `PATCH` / `DELETE` | `/sabores/[id]` | Pública (sem auth na rota) | Param: `id` | CRUD individual de sabor |
| `GET` | `/tamanhos` | Pública | Query: `?all=true` (inclui inativos) | Lista tamanhos (`nome_tamanho`, `numero_fatias`, `numero_sabores`, `preco_base`, `diametro_cm`, `imagem_url`) |
| `POST` | `/tamanhos` | `authenticate` (`admin\|gerente`) | Body: `{ nome_tamanho, numero_fatias, numero_sabores, preco_base, diametro_cm, imagem_url, descricao? }` | Cria tamanho |
| `PUT` / `DELETE` | `/tamanhos/[id]` | `authenticate` (`admin\|gerente`) | Param: `id` | Atualiza ou desativa/remove tamanho |
| `GET` | `/massas` | Pública | — | Lista massas disponíveis |
| `POST` / `PUT` / `DELETE` | `/massas` e `/massas/[id]` | `withAdminAuth` | Body: `{ nome_massa, descricao?, preco_adicional?, disponivel? }` | CRUD de massas |
| `GET` | `/bordas` | Pública | — | Lista bordas disponíveis |
| `POST` / `PUT` / `DELETE` | `/bordas` e `/bordas/[id]` | `withAdminAuth` | Body: `{ nome_borda, descricao?, preco_adicional?, disponivel? }` | CRUD de bordas |
| `GET` | `/ingredientes` | Pública | — | Lista ingredientes |
| `POST` | `/ingredientes` | `withAdminAuth` | Body: `{ nome_ingrediente, tipo_ingrediente, preco_adicional?, disponivel?, imagem_url? }` | Cria ingrediente |
| `GET` / `PUT` / `DELETE` | `/ingredientes/[id]` | Pública (sem auth na rota) | Param: `id` | CRUD individual de ingrediente (`DELETE` faz fallback para `disponivel=0`) |
| `GET` | `/combos` | Pública | — | Lista combos ativos (`WHERE ativo = 1`) |
| `GET` | `/search` | Pública | Query: `?q=` | Busca mockada (2 pizzas de exemplo) |

---

## 5. Carrinho e Cálculo de Preço
| Método | Rota | Auth | Payload / Query | Resposta / Comportamento |
|---|---|---|---|---|
| `GET` | `/carrinho` | Sessão opcional ou `?session_id=` | Query: `?session_id=` | Lista itens do carrinho |
| `POST` | `/carrinho` | Sessão opcional ou `session_id` | Body de item do carrinho | Adiciona item ao carrinho |
| `DELETE` | `/carrinho` | Sessão opcional ou `session_id` | Query/Body: `id` ou `session_id` | Remove item ou limpa carrinho |
| `GET` / `POST` | `/calculate` | Pública | Body/Query: `{ type: 'pizza' \| 'order', tamanho?, sabores?, borda?, itens? }` | Calculadora stateless (`pequena: 25`, `media: 35`, `grande: 45`, `familia: 55`, `borda: 8`, `sabor_adicional: 2`, `taxa_entrega: 5`) |

---

## 6. Pedidos, Entrega e Rastreamento
| Método | Rota | Auth | Payload / Query | Resposta / Comportamento |
|---|---|---|---|---|
| `GET` | `/pedidos` | Pública (sem auth na rota) | Query: `?id_usuario=` | Lista até 50 pedidos recentes com dados de `usuarios` e `enderecos` |
| `POST` | `/pedidos` | Pública (sem auth na rota) | Body: `{ id_usuario, id_endereco, total\|valor_total, valor_subtotal?, forma_pagamento?, observacoes?, itens?: [{ tipo_item?, id_produto, quantidade, preco_unitario }] }` | Cria pedido (`status_pedido='pendente'`) e `itens_pedido` |
| `GET` / `PUT` / `PATCH` / `DELETE` | `/pedidos/[id]` | Pública (sem auth na rota) | Param: `id`; Body: `{ status_pedido?, observacoes? }` | Consulta/atualiza pedido; ao atualizar status cria `notificacoes` e em `Entregue` credita `floor(valor_total/10)` `pontos_fidelidade` |
| `GET` | `/pedidos/favoritos` | `validateSession` | — | Consulta pedidos favoritos do usuário (nota: backend legado possui divergência de schema) |
| `GET` | `/entrega` | `withAuth` | — | Lista pedidos em `preparando` ou `saiu_entrega` |
| `POST` | `/entrega/atualizar-localizacao` | Pública | Body: `{ id_pedido, latitude, longitude, id_entregador? }` | Atualiza posição em memória para entrega |
| `GET` | `/tracking/[pedidoId]` | Pública | Param: `pedidoId` | Retorna status, endereço e coordenadas GPS (mock em Ji-Paraná quando `saiu_entrega`) |
| `GET` | `/tempo_entrega` | Pública | — | Estima tempo: `30 + 5 * COUNT(pendente \| preparando)` minutos |

---

## 7. Pagamentos, Cupons e Avaliações
| Método | Rota | Auth | Payload / Query | Resposta / Comportamento |
|---|---|---|---|---|
| `POST` | `/pagamentos` | Pública | Body: `{ id_pedido, metodo: 'pix' \| 'cartao_credito', valor_total? }` | Processa pagamento simulado (PIX retorna código + QR URL) e marca pedido como `confirmado` |
| `GET` | `/cupons` | Pública | — | Lista cupons cadastrados |
| `POST` | `/cupons` | Pública (sem auth na rota) | Body: `{ codigo, tipo_desconto, valor_desconto, data_validade, ... }` | Cria cupom |
| `POST` | `/cupons/validate` | Pública | Body: `{ codigo, id_usuario? }` | Valida cupom ativo, validade, limite de usos e tempo mínimo de conta |
| `GET` / `PUT` / `PATCH` / `DELETE` | `/cupons/[id]` | Pública (sem auth na rota) | Param: `id` | CRUD individual de cupom |
| `GET` | `/avaliacoes` | Pública | Query: `?limit=20` | Lista avaliações (`avaliacao >= 3`) |
| `POST` | `/avaliacoes` | Pública | Body: `{ id_pedido, avaliacao, comentario?, foto_avaliacao? }` | Registra avaliação no pedido |
| `GET` | `/avaliacoes/top` | Pública | — | Top 5 avaliações (`avaliacao >= 4` com comentário) |
| `POST` | `/avaliacoes/like` | Pública | Body: `{ id_pedido }` | Incrementa `likes_avaliacao` |
| `POST` | `/avaliacoes/[id]/like` | Pública | Param: `id` | Incrementa `likes_avaliacao` do pedido `id` |

---

## 8. Fidelidade, Recompensas e Notificações
| Método | Rota | Auth | Payload / Query | Resposta / Comportamento |
|---|---|---|---|---|
| `GET` | `/fidelidade` | `authenticate` | — | Retorna saldo de pontos / TopCoins do usuário autenticado |
| `GET` | `/recompensas` | Pública | — | Lista recompensas ativas (`WHERE ativo = 1`) |
| `GET` | `/resgates` | `validateSession` | — | Lista recompensas resgatadas pelo usuário |
| `POST` | `/resgates` | `validateSession` | Body: `{ id_recompensa }` | Debita `usuarios.pontos_fidelidade` e registra em `recompensas_resgatadas` |
| `GET` | `/notificacoes` | `validateSession` | — | Últimas 20 notificações do usuário |
| `PUT` | `/notificacoes` | `validateSession` | — | Marca todas notificações do usuário como lidas |
| `GET` / `POST` / `PUT` | `/notify` | Pública | Body: `{ userId, type, title, message }` | Store de notificações em memória |

---

## 9. Caixa, Estatísticas, IA, Upload e Webhooks
| Método | Rota | Auth | Payload / Query | Resposta / Comportamento |
|---|---|---|---|---|
| `GET` / `POST` / `PATCH` | `/caixa` | `validateSession` (`admin\|gerente`) | Query `?atual=1` | Gerencia turnos de caixa (`turnos_caixa`) |
| `GET` | `/configuracoes/loja` | Pública | — | Retorna horários, banner e taxas da loja |
| `POST` | `/configuracoes/loja` | Pública | Body de configuração | Atualiza configuração mock da loja |
| `GET` / `PUT` | `/configuracoes/meta` | Pública | Body: `{ meta_vendas, meta_periodo, meta_data_inicio, meta_data_fim }` | Lê/atualiza metas em `configuracoes` + contagem de pedidos |
| `GET` | `/stats` | Pública | — | Faturamento, pedidos do dia, clientes e top 5 sabores |
| `GET` | `/stats/chart` | `authenticate` (`admin`) | — | Série diária de faturamento dos últimos 7 dias |
| `POST` | `/ai/chat` | `authenticate` | Body: `{ message, history?, godMode?, file? }` | Assistente IA (Gemini / fallback Groq) com contexto do cardápio |
| `GET` / `POST` | `/upload` | Pública | `multipart/form-data` (`file\|pizza\|image`, <= 3MB) | Salva imagem em `uploads/` e retorna `{ url: '/uploads/...' }` |
| `GET` / `POST` / `PUT` / `DELETE` | `/webhooks` | Pública | — | Registro simulado de webhooks em memória |
| `GET` / `POST` | `/webhooks/trigger` | Pública | — | Dispara webhooks simulados |

---

## 10. Diagnóstico e Ferramentas de Banco
- **Health & Status**:
  - `GET /health` — Healthcheck básico
  - `GET` / `POST /ping` — Ping simples
  - `GET` / `POST /status` — Status do serviço
  - `GET /test` — Teste básico da API
  - `GET /test-db` — Teste de consulta no MySQL
  - `GET /test-connection` — Teste detalhado de conexão
  - `GET /diagnostic` — Diagnóstico geral
  - `GET` / `POST /system` — Informações do sistema
  - `GET /version` — Versão da API
  - `GET /cors-test` — Teste de headers CORS
  - `GET /force-rebuild` — Sinalizador de rebuild
  - `GET` / `POST /validate` — Validação de payloads
  - `GET` / `POST /export` — Exportação simulada CSV/JSON
- **Inspeção / Manutenção de Banco & Ambiente** (rotas administrativas/diagnóstico no servidor):
  - `GET /env-check`, `GET /force-prod`, `GET /test-env`
  - `GET /db-test`, `GET /debug`, `GET /tables`, `GET /database-structure`, `GET /produtos-structure`, `GET /sabores-structure`
  - `GET /setup-features`, `GET` / `POST /backup`, `GET` / `POST /migrations`, `GET` / `POST /optimizer`
  - `POST /debug-login`, `POST /test-senha`
