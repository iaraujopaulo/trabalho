/* VOLTS MOTORS - aplicação React (SPA com rotas por hash: index.html#/rota) */
// Este arquivo contém TODO o site: as páginas (componentes), o menu, as funções de apoio e a inicialização do React.
// O index.html carrega este arquivo e o Babel converte o JSX (HTML dentro do JavaScript) em JavaScript comum no navegador.
// Pegue os "hooks" do React (a biblioteca vem do index.html e fica na variável global React):
// - useState: guarda um valor que, ao mudar, atualiza a tela
// - useEffect: executa um código em certos momentos (ao abrir a página, ao mudar de rota...)
const { useState, useEffect } = React;

/* ---------- constantes ---------- */
// Dados fixos do site: cores, caminhos de imagens, carros e textos.
// Cor de destaque (laranja): item ativo do menu e rótulos dos carros
const LARANJA = "#E15F09";
// Monta o caminho de uma imagem da pasta imagens/ (encodeURI trata espaços e acentos no nome do arquivo)
const img = (nome) => "imagens/" + encodeURI(nome);

// Imagens usadas nas páginas: fundo da Home, imagem da sessão Visão e fundos das telas de login/cadastro/senha
const IMG = {
  fundoHome: img("c837a6_02de7d4c43d44b7b890854049ed75da8f000.webp"),
  visao: img("Captura de tela 2024-04-07 170507.png"),
  fundoLogin: img("carro-eletrico.jpg"),
  fundoSenha: img("closeup-shot-car-wiper-with-sunset-background.jpg"),
};

// Catálogo dos 3 carros (nome → tipo, imagem e descrição). É usado na página Modelos e na escolha do pedido
const MODELOS = {
  "Volts E1": { tipo: "Compacto urbano", img: img("volts-e1.png"), texto: "Pequeno por fora, esperto por dentro. Feito para manobrar fácil na cidade, estacionar em qualquer vaga e gastar pouco." },
  "Volts X": { tipo: "SUV elétrico", img: img("volts-x.png"), texto: "Espaço para a família toda, posição de dirigir elevada e conforto para viagens longas, sem abrir mão da eficiência." },
  "Volts GT": { tipo: "Esportivo de luxo", img: img("volts-gt.png"), texto: "Aceleração forte, acabamento premium e desenho baixo e largo. O elétrico para quem gosta de dirigir." },
};

// Cards da página Tecnologia: cada item é (título, texto)
const TECNOLOGIAS = [
  ["Bateria e autonomia", "Baterias de íons de lítio com gerenciamento térmico inteligente, que mantêm o desempenho no calor e prolongam a vida útil do conjunto."],
  ["Recarga rápida", "Compatível com carregadores domésticos, públicos e de corrente contínua. Em estações rápidas, a bateria recupera boa parte da carga no tempo de um café."],
  ["Motor elétrico eficiente", "Torque instantâneo, funcionamento silencioso e menos peças móveis, o que significa menos manutenção do que um motor a combustão."],
  ["Frenagem regenerativa", "Ao desacelerar, o carro transforma movimento em energia e devolve à bateria, aumentando a autonomia no trânsito urbano."],
  ["Direção assistida", "Sensores e câmeras ajudam a manter a faixa, evitar colisões e estacionar com mais segurança e tranquilidade."],
  ["Software conectado", "Painel com informações ao vivo, rotas com pontos de recarga e atualizações pelo ar que melhoram o carro com o tempo."],
];

// Título da aba do navegador para cada rota. Também serve para saber quais rotas existem (rota fora da lista volta para a Home)
const TITULOS = {
  "/": "VOLTS MOTORS",
  "/tecnologia": "Tecnologia | VOLTS MOTORS",
  "/modelos": "Modelos | VOLTS MOTORS",
  "/sobre": "Sobre | VOLTS MOTORS",
  "/contato": "Contato | VOLTS MOTORS",
  "/pedido": "Meu pedido | VOLTS MOTORS",
  "/login": "Página de login",
  "/cadastro": "Página de Cadastro",
  "/senha": "VOLTS MOTORS - Alteração de senha",
};

/* ---------- armazenamento (localStorage / sessionStorage) ---------- */
// Funções que salvam e leem dados no navegador (não há servidor/banco de dados):
// - localStorage: dura mesmo fechando o navegador (usuários, pedidos, "me lembre o login")
// - sessionStorage: dura só enquanto a aba está aberta (quem está logado)
// Lê um valor do localStorage e converte de texto JSON para objeto/lista. Se não existir ou aparecer um erro, devolve null
const ler = (k) => {
  try { return JSON.parse(localStorage.getItem(k)); } catch (e) { return null; }
};
// Converte o valor para texto JSON e salva no localStorage (o try/catch evita quebrar o site se o navegador bloquear)
const gravar = (k, v) => {
  try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* ignora */ }
};
// Lista de contas cadastradas (lista vazia se ainda não há nenhuma)
const usuarios = () => ler("volts_usuarios") || [];
// Pedidos salvos, guardados em um objeto onde a chave é o e-mail do comprador
const pedidos = () => ler("volts_pedidos") || {};
// Devolve o e-mail de quem está logado nesta aba (ou null se ninguém estiver)
const lerSessao = () => {
  try { return sessionStorage.getItem("volts_sessao"); } catch (e) { return null; }
};
// Marca quem está logado (passando o e-mail) ou encerra a sessão (passando null)
const gravarSessao = (email) => {
  try {
    if (email) sessionStorage.setItem("volts_sessao", email);
    else sessionStorage.removeItem("volts_sessao");
  } catch (e) { /* ignora */ }
};

// Formata o telefone enquanto digita: (DD) 99999-9999 ou (DD) 9999-9999
const mascaraTelefone = (valor) => {
  // Mantém só os números e limita a 11 dígitos (DDD + 9 dígitos)
  const d = valor.replace(/\D/g, "").slice(0, 11);
  // Posição do hífen: depois do 7º dígito se tiver 11 números (celular), senão depois do 6º
  const corte = d.length > 10 ? 7 : 6;
  // Número completo: (DD) 99999-9999
  if (d.length > corte) return `(${d.slice(0, 2)}) ${d.slice(2, corte)}-${d.slice(corte)}`;
  // Já digitou o DDD: (DD) 9999
  if (d.length > 2) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  // Poucos dígitos: devolve só os números
  return d;
};

/* ---------- roteamento por hash ---------- */
// Como o site troca de "página" sem recarregar: o que vem depois do # no endereço (ex.: #/modelos) define qual componente aparece.
// Lê a rota atual do endereço. Ex.: "index.html#/modelos" → "/modelos" (sem nada depois do # é a Home "/")
const rotaAtual = () => (window.location.hash.replace(/^#/, "") || "/").split("?")[0];
// Navega para outra rota (cria uma entrada no histórico, então o botão voltar funciona)
const irPara = (rota) => { window.location.hash = rota; };
// redireciona SEM criar uma entrada nova no histórico (o botão "voltar" não fica preso)
const substituirPara = (rota) => { window.location.replace("#" + rota); };

// Hook que devolve a rota atual e atualiza a tela sempre que o endereço mudar (clique em link, botão voltar etc.)
function useRota() {
  // Guarda a rota atual
  const [rota, setRota] = useState(rotaAtual());
  // Ao abrir o site, passa a "ouvir" mudanças no endereço
  useEffect(() => {
    // Quando o endereço muda: atualiza a rota e volta ao topo da página
    const aoMudar = () => { setRota(rotaAtual()); window.scrollTo(0, 0); };
    window.addEventListener("hashchange", aoMudar);
    // Ao sair, para de ouvir (evita ouvintes duplicados)
    return () => window.removeEventListener("hashchange", aoMudar);
  }, []);
  return rota;
}

/* ---------- componentes pequenos ---------- */
// Peças reutilizadas em várias páginas.
// Caixa de aviso (verde = sucesso, vermelho = erro). Sem mensagem, reserva só o espaço para o formulário não "pular"
function Mensagem({ msg }) {
  if (!msg) return <div style={{ minHeight: "1.5rem" }} />;
  // Caixa de aviso do Bootstrap (alert-success = verde, alert-danger = vermelho)
  return (
    <div className={"alert py-2 mb-3 " + (msg.ok ? "alert-success" : "alert-danger")} role="status">
      {msg.texto}
    </div>
  );
}

// Texto de direitos autorais; "fixo" prende o texto no rodapé da tela (usado nas telas de login)
function Direitos({ cor = "rgba(255,255,255,.75)", fixo = true }) {
  return (
    <p
      className={"text-center small mb-0 " + (fixo ? "position-fixed bottom-0 start-0 w-100 pb-3" : "")}
      style={{ color: cor, pointerEvents: "none", zIndex: 1 }}
    >
      &copy; 2026 VOLTS MOTORS. Todos os direitos reservados.
    </p>
  );
}

/* ---------- menu (navbar Bootstrap) ---------- */
// Menu superior do site, feito com a navbar do Bootstrap.
// Menu: recebe a rota atual (para destacar o item ativo), quem está logado, a função de sair e se o fundo é claro (Home)
function Menu({ rota, sessao, aoSair, claro = false }) {
  // Controla se o menu está aberto no celular (botão "hambúrguer")
  const [aberto, setAberto] = useState(false);
  // Fecha o menu do celular sempre que a rota mudar
  useEffect(() => setAberto(false), [rota]);

  // Itens do menu: [rota, texto]
  const links = [
    ["/", "Home"],
    ["/tecnologia", "Tecnologia"],
    ["/modelos", "Modelos"],
    ["/sobre", "Sobre"],
    ["/contato", "Contato"],
  ];
  // Estilo dos botões do menu: escuro na Home (fundo claro) e claro nas demais páginas
  const btn = claro ? "btn btn-dark" : "btn btn-light";

  // Barra do Bootstrap (navbar-expand-lg: vira "hambúrguer" em telas pequenas)
  return (
    <nav
      className={"navbar navbar-expand-lg " + (claro ? "navbar-light" : "border-bottom border-secondary-subtle")}
      data-bs-theme={claro ? "light" : "dark"}
      style={{ minHeight: 90, background: claro ? "transparent" : "#000", position: "relative", zIndex: 10 }}
    >
      <div className="container-fluid px-4 px-xl-5">
        {/* Nome da marca (leva à Home) */}
        <a className="navbar-brand fw-semibold" href="#/" style={{ letterSpacing: "0.45rem" }}>
          VOLTS MOTORS
        </a>
        {/* Botão "hambúrguer" que abre/fecha o menu no celular */}
        <button
          className="navbar-toggler"
          type="button"
          aria-label="Abrir menu"
          aria-expanded={aberto}
          onClick={() => setAberto(!aberto)}
        >
          <span className="navbar-toggler-icon"></span>
        </button>
        {/* Área do menu que aparece/esconde (a classe "show" é adicionada quando aberto) */}
        <div className={"collapse navbar-collapse justify-content-end" + (aberto ? " show" : "")}>
          <ul className="navbar-nav align-items-lg-center gap-lg-2">
            {/* Cria um link para cada item da lista; o item da rota atual fica laranja */}
            {links.map(([caminho, nome]) => (
              <li className="nav-item" key={caminho}>
                <a
                  className="nav-link"
                  href={"#" + caminho}
                  style={rota === caminho ? { color: LARANJA } : undefined}
                  aria-current={rota === caminho ? "page" : undefined}
                >
                  {nome}
                </a>
              </li>
            ))}
            {/* Logado: mostra "Meu pedido" e "Sair". Deslogado: mostra "Criar conta" e "Entrar" */}
            {sessao ? (
              <>
                <li className="nav-item ms-lg-2 my-1 my-lg-0">
                  <a className={btn} href="#/pedido">Meu pedido</a>
                </li>
                <li className="nav-item my-1 my-lg-0">
                  <button className={btn} type="button" onClick={aoSair}>Sair</button>
                </li>
              </>
            ) : (
              <>
                <li className="nav-item ms-lg-2 my-1 my-lg-0">
                  <a className={btn} href="#/cadastro">Criar conta</a>
                </li>
                <li className="nav-item my-1 my-lg-0">
                  <a className={btn} href="#/login">Entrar</a>
                </li>
              </>
            )}
          </ul>
        </div>
      </div>
    </nav>
  );
}

/* ---------- página inicial ---------- */
// Página inicial (rota "/").
// Home: topo com imagem de fundo, seção "Visão" e rodapé com parceiros
function Home({ rota, sessao, aoSair }) {
  // Nomes que aparecem na lista de parceiros do rodapé
  const parceiros = ["Adriano", "Bruno", "Igor", "Mateus", "Patricia", "Ronaldo", "Weberth"];
  return (
    <>
      {/* Topo: imagem de fundo com o menu (claro) e o título principal */}
      <header
        style={{
          backgroundImage: `url("${IMG.fundoHome}")`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundColor: "#8C9CB0",
          minHeight: "90vh",
        }}
      >
        <Menu rota={rota} sessao={sessao} aoSair={aoSair} claro />
        <div className="container text-center text-dark pt-4 pb-5">
          <h1 className="display-4 fw-normal mx-auto" style={{ maxWidth: 730 }}>
            FUTURO DOS AUTOMOVEIS ELÉTRICOS
          </h1>
          <p className="fs-4 fw-light mx-auto mt-3" style={{ maxWidth: 730 }}>
            Dirija com mais tranquilidade e conforto.
          </p>
        </div>
      </header>

      {/* Seção "Visão": texto à esquerda e imagem à direita (empilha no celular) */}
      <section className="bg-black text-white py-5" style={{ boxShadow: "0 -60px 60px 30px #000" }}>
        <div className="container py-4">
          <div className="row align-items-center justify-content-evenly g-5">
            <div className="col-lg-5">
              <h3 className="fw-light mb-4">VISÃO</h3>
              <h2 className="fw-normal mb-4" style={{ fontSize: "2.4rem", lineHeight: 1.2 }}>
                Uma revolução no modo como pensamos sobre carros
              </h2>
              <p className="fs-5 fw-light" style={{ lineHeight: 1.6 }}>
                Uma abordagem diferente, com um novo método de produção, com direção autônoma, informações ao vivo e percepção ativada autônoma em números.
              </p>
            </div>
            <div className="col-lg-5 text-center">
              <img className="img-fluid" src={IMG.visao} alt="Painel do carro VOLTS MOTORS" />
            </div>
          </div>
        </div>
      </section>

      {/* Rodapé branco com os parceiros e os direitos autorais */}
      <footer className="bg-white text-dark py-5 position-relative">
        <div className="container">
          <div className="row align-items-center g-4 pb-4">
            <div className="col-md-6 text-center text-md-start">
              <h1 className="h5 mb-3" style={{ letterSpacing: 7 }}>VOLTS MOTORS</h1>
              <h2 className="h5 fw-normal mb-0">Nossos parceiros.</h2>
            </div>
            <div className="col-md-6 d-flex flex-column align-items-center align-items-md-start">
              {parceiros.map((nome) => (
                <span key={nome} className="mb-2">
                  &copy;{nome}
                </span>
              ))}
            </div>
          </div>
          <Direitos cor="#555" fixo={false} />
        </div>
      </footer>
    </>
  );
}

/* ---------- layout das páginas internas ---------- */
// Estrutura comum às páginas Tecnologia, Modelos, Sobre, Contato e Meu pedido.
// Moldura das páginas internas: menu no topo, título, conteúdo (children) e rodapé. O rodapé fica sempre embaixo da tela
function PaginaInterna({ rota, sessao, aoSair, titulo, subtitulo, children }) {
  return (
    <div className="d-flex flex-column min-vh-100 bg-black text-white">
      <Menu rota={rota} sessao={sessao} aoSair={aoSair} />
      {/* Conteúdo da página: título, subtítulo opcional e o que foi colocado dentro do componente */}
      <main className="container flex-grow-1 py-5" style={{ maxWidth: 1100 }}>
        <h1 className="display-5 fw-normal mb-2">{titulo}</h1>
        {subtitulo && <p className="text-secondary-emphasis fw-light mb-5" style={{ maxWidth: 700 }}>{subtitulo}</p>}
        {children}
      </main>
      {/* Rodapé simples com os direitos autorais */}
      <footer className="text-center text-secondary border-top border-secondary-subtle py-4 small">
        &copy; 2026 VOLTS MOTORS. Todos os direitos reservados.
      </footer>
    </div>
  );
}

// Estilo dos cards escuros (fundo e borda) reaproveitado em várias páginas
const cartao = { background: "#111", borderColor: "#2a2a2a" };

// Página Tecnologia: um card para cada item da lista TECNOLOGIAS
function Tecnologia(props) {
  return (
    <PaginaInterna {...props} titulo="Tecnologia VOLTS MOTORS" subtitulo="Dirija com mais tranquilidade e conforto: veja o que há por trás dos nossos carros elétricos.">
      {/* Grade do Bootstrap: 1 coluna no celular, 2 em telas médias e 3 em telas grandes */}
      <div className="row g-4">
        {TECNOLOGIAS.map(([titulo, texto]) => (
          <div className="col-md-6 col-lg-4" key={titulo}>
            <article className="card h-100" style={cartao}>
              <div className="card-body p-4">
                <h2 className="h5 fw-semibold mb-3">{titulo}</h2>
                <p className="card-text text-secondary-emphasis fw-light">{texto}</p>
              </div>
            </article>
          </div>
        ))}
      </div>
    </PaginaInterna>
  );
}

// Página Modelos: um card para cada carro do catálogo, com botão que leva ao pedido
function Modelos(props) {
  return (
    <PaginaInterna {...props} titulo="Nossos modelos" subtitulo="Três carros elétricos para três estilos de vida.">
      {/* Grade de cards (Object.entries transforma o catálogo em lista de [nome, dados]) */}
      <div className="row g-4">
        {Object.entries(MODELOS).map(([nome, m]) => (
          <div className="col-md-6 col-lg-4" key={nome}>
            <article className="card h-100" style={cartao}>
              <div className="card-body p-4 d-flex flex-column">
                <img className="img-fluid rounded mb-3" src={m.img} alt={nome} />
                <p className="small text-uppercase mb-2" style={{ color: LARANJA, letterSpacing: 2 }}>{m.tipo}</p>
                <h2 className="h5 fw-semibold">{nome}</h2>
                <p className="card-text text-secondary-emphasis fw-light flex-grow-1">{m.texto}</p>
                {/* Leva para "Meu pedido" (quem não está logado é enviado ao login) */}
                <a className="btn btn-light fw-semibold align-self-start" href="#/pedido">Fazer pedido</a>
              </div>
            </article>
          </div>
        ))}
      </div>
    </PaginaInterna>
  );
}

// Página Sobre: textos institucionais (quem somos, missão, visão e valores)
function Sobre(props) {
  // Cada bloco é [título, texto]
  const blocos = [
    ["Quem somos", "A VOLTS MOTORS é uma fabricante de automóveis elétricos criada para tornar a mobilidade limpa acessível, confortável e divertida. Projetamos carros do compacto urbano ao esportivo de luxo."],
    ["Missão", "Oferecer veículos elétricos confiáveis e tecnológicos que reduzam o custo e o impacto ambiental de se locomover."],
    ["Visão", "Ser referência em mobilidade elétrica, com uma abordagem diferente de produção, direção assistida e informações ao vivo."],
    ["Valores", "Sustentabilidade, segurança, transparência com o cliente e inovação contínua."],
  ];
  return (
    <PaginaInterna {...props} titulo="Sobre a VOLTS MOTORS" subtitulo="Uma nova forma de pensar sobre carros.">
      <div style={{ maxWidth: 760 }}>
        {blocos.map(([titulo, texto]) => (
          <section key={titulo}>
            <h2 className="h4 fw-semibold mt-4 mb-2">{titulo}</h2>
            <p className="text-secondary-emphasis fw-light" style={{ lineHeight: 1.8 }}>{texto}</p>
          </section>
        ))}
      </div>
    </PaginaInterna>
  );
}

// Página Contato: formulário com máscara de telefone e mensagem de confirmação
function Contato(props) {
  // Valores iniciais (campos em branco), também usados para limpar o formulário após o envio
  const vazio = { nome: "", email: "", telefone: "", mensagem: "" };
  // Guarda o que foi digitado em cada campo
  const [form, setForm] = useState(vazio);
  // Guarda o aviso exibido abaixo do formulário
  const [msg, setMsg] = useState(null);

  // A cada letra digitada atualiza o campo correspondente (o telefone passa pela máscara)
  const mudar = (e) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: name === "telefone" ? mascaraTelefone(value) : value });
  };
  // Ao enviar: evita recarregar a página, mostra a confirmação e limpa os campos (nada é enviado a servidor)
  const enviar = (e) => {
    e.preventDefault();
    setMsg({ ok: true, texto: "Formulário enviado" });
    setForm(vazio);
  };

  return (
    <PaginaInterna {...props} titulo="Fale com a VOLTS MOTORS" subtitulo="Dúvidas, reclamações ou elogios: envie sua mensagem.">
      {/* Formulário: o Bootstrap estiliza os campos (form-control) e o navegador valida os campos "required" */}
      <form onSubmit={enviar} style={{ maxWidth: 600 }}>
        <div className="mb-3">
          <label className="form-label text-secondary-emphasis" htmlFor="c-nome">Nome completo</label>
          <input id="c-nome" className="form-control" type="text" name="nome" value={form.nome} onChange={mudar} required />
        </div>
        <div className="mb-3">
          <label className="form-label text-secondary-emphasis" htmlFor="c-email">E-mail</label>
          <input id="c-email" className="form-control" type="email" name="email" value={form.email} onChange={mudar} required />
        </div>
        <div className="mb-3">
          <label className="form-label text-secondary-emphasis" htmlFor="c-tel">Telefone com DDD</label>
          <input
            id="c-tel"
            className="form-control"
            type="tel"
            name="telefone"
            placeholder="(85) 99999-9999"
            pattern={"\\(\\d{2}\\) \\d{4,5}-\\d{4}"}
            title="Use o formato (DD) 99999-9999"
            value={form.telefone}
            onChange={mudar}
            required
          />
        </div>
        <div className="mb-3">
          <label className="form-label text-secondary-emphasis" htmlFor="c-msg">Mensagem</label>
          <textarea
            id="c-msg"
            className="form-control"
            name="mensagem"
            rows="5"
            placeholder="Escreva sua dúvida, reclamação ou elogio"
            value={form.mensagem}
            onChange={mudar}
            required
          />
        </div>
        <Mensagem msg={msg} />
        <button type="submit" className="btn btn-light fw-semibold px-4">Enviar</button>
      </form>
    </PaginaInterna>
  );
}

/* ---------- área do comprador (pedido) ---------- */
// Página "Meu pedido" (rota "/pedido"): só para quem fez login.
// Pedido: mostra os dados do comprador e permite escolher e salvar o carro
function Pedido(props) {
  // sessao = e-mail de quem está logado
  const { sessao } = props;
  // Procura na lista de contas o usuário logado
  const usuario = usuarios().find((u) => u.email === sessao);
  // Pedido já salvo anteriormente por este usuário (se existir)
  const salvo = sessao ? pedidos()[sessao] : null;

  // Modelo selecionado (começa no pedido salvo ou no Volts E1)
  const [modelo, setModelo] = useState(salvo ? salvo.modelo : "Volts E1");
  // Ano selecionado
  const [ano, setAno] = useState(salvo ? salvo.ano : "2026");
  // Pedido salvo mostrado na tela
  const [pedidoSalvo, setPedidoSalvo] = useState(salvo);
  // Aviso exibido após salvar
  const [msg, setMsg] = useState(null);

  // Proteção da página: sem login, vai para o login (substituirPara não deixa a página no histórico, assim o botão voltar não fica preso)
  useEffect(() => {
    if (!usuario) substituirPara("/login");
  }, [usuario]);

  // Enquanto redireciona, não desenha nada
  if (!usuario) return null;

  // Salva o pedido (modelo, ano e data) no localStorage, na chave do e-mail do usuário
  const salvar = (e) => {
    e.preventDefault();
    const todos = pedidos();
    const novo = { modelo, ano, data: new Date().toLocaleDateString("pt-BR") };
    todos[sessao] = novo;
    gravar("volts_pedidos", todos);
    setPedidoSalvo(novo);
    setMsg({ ok: true, texto: "Pedido salvo com sucesso!" });
  };

  return (
    <PaginaInterna {...props} titulo="Minha área" subtitulo="Confira seus dados e escolha o carro do seu pedido.">
      {/* Duas colunas: dados do comprador (esquerda) e escolha do carro (direita) */}
      <div className="row g-4">
        <div className="col-lg-6">
          <section className="card h-100" style={cartao}>
            <div className="card-body p-4">
              <h2 className="h5 fw-semibold mb-3">Dados do comprador</h2>
              {/* Lista de dados do comprador (nome, sobrenome e e-mail) */}
              <dl className="row mb-0">
                <dt className="col-sm-4 text-secondary">Nome</dt>
                <dd className="col-sm-8">{usuario.nome}</dd>
                <dt className="col-sm-4 text-secondary">Sobrenome</dt>
                <dd className="col-sm-8">{usuario.sobrenome || "-"}</dd>
                <dt className="col-sm-4 text-secondary">E-mail</dt>
                <dd className="col-sm-8 text-break">{usuario.email}</dd>
              </dl>
            </div>
          </section>
        </div>
        <div className="col-lg-6">
          <section className="card h-100" style={cartao}>
            <div className="card-body p-4">
              <h2 className="h5 fw-semibold mb-3">Escolha do carro</h2>
              <form onSubmit={salvar}>
                <div className="mb-3">
                  <label className="form-label text-secondary-emphasis" htmlFor="p-modelo">Modelo</label>
                  {/* Lista de modelos montada a partir do catálogo MODELOS */}
                  <select id="p-modelo" className="form-select" value={modelo} onChange={(e) => setModelo(e.target.value)}>
                    {Object.keys(MODELOS).map((nome) => <option key={nome}>{nome}</option>)}
                  </select>
                </div>
                <div className="mb-3">
                  <label className="form-label text-secondary-emphasis" htmlFor="p-ano">Ano</label>
                  <select id="p-ano" className="form-select" value={ano} onChange={(e) => setAno(e.target.value)}>
                    <option>2026</option>
                    <option>2027</option>
                  </select>
                </div>
                {/* Prévia do carro escolhido (muda junto com a seleção) */}
                <img className="img-fluid rounded mb-2" src={MODELOS[modelo].img} alt="Modelo escolhido" />
                <p className="small text-uppercase mb-3" style={{ color: LARANJA, letterSpacing: 2 }}>{MODELOS[modelo].tipo}</p>
                <Mensagem msg={msg} />
                <button type="submit" className="btn btn-light fw-semibold px-4">Salvar pedido</button>
                <p className="text-secondary mt-3 mb-0">
                  {pedidoSalvo
                    ? `Pedido salvo: ${pedidoSalvo.modelo} ${pedidoSalvo.ano} em ${pedidoSalvo.data}`
                    : "Nenhum pedido salvo ainda."}
                </p>
              </form>
            </div>
          </section>
        </div>
      </div>
    </PaginaInterna>
  );
}

/* ---------- páginas de autenticação ---------- */
// Telas de login, cadastro e recuperação de senha (com imagem de fundo e card de vidro).
// Fundo das telas de autenticação: imagem em tela cheia com o conteúdo centralizado
function LayoutAuth({ fundo, children, corDireitos }) {
  return (
    <div
      className="min-vh-100 d-flex align-items-center justify-content-center p-3"
      style={{
        backgroundColor: "#000",
        backgroundImage: `url("${fundo}")`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundAttachment: "fixed",
      }}
    >
      {children}
      <Direitos cor={corDireitos} />
    </div>
  );
}

// Estilo do card com efeito de vidro (fundo semitransparente + desfoque)
const vidro = {
  width: 400,
  maxWidth: "100%",
  backdropFilter: "blur(7px)",
  WebkitBackdropFilter: "blur(7px)",
  border: "1px solid rgba(255,255,255,.5)",
  background: "rgba(0,0,0,.25)",
};

// Campo de formulário com rótulo flutuante do Bootstrap (form-floating); repassa os demais atributos ao <input>
function Campo({ id, rotulo, ...resto }) {
  return (
    <div className="form-floating mb-3">
      <input id={id} className="form-control bg-transparent text-white" placeholder={rotulo} {...resto} />
      <label htmlFor={id} className="text-white-50">{rotulo}</label>
    </div>
  );
}

// Hook que redireciona para outra rota depois de alguns milissegundos (para dar tempo de ler a mensagem de sucesso)
function useRedirecionar() {
  // Guarda para qual rota ir (null = nenhum redirecionamento pedido)
  const [destino, setDestino] = useState(null);
  // Quando um destino é definido, espera 1,5 s e redireciona
  useEffect(() => {
    if (!destino) return;
    const timer = setTimeout(() => substituirPara(destino), 1500);
    // Cancela o timer se a página for fechada antes do redirecionamento
    return () => clearTimeout(timer);
  }, [destino]);
  // Função devolvida: chame redirecionar("/login") para agendar a ida até a rota
  return (rota) => setDestino(rota);
}

// Tela de login: confere e-mail e senha com as contas cadastradas
function Login({ aoEntrar }) {
  // E-mail salvo pela opção "Me lembre o login" (vem preenchido na próxima visita)
  const lembrado = (() => { try { return localStorage.getItem("volts_lembrar") || ""; } catch (e) { return ""; } })();
  // Campos do formulário e aviso de erro
  const [email, setEmail] = useState(lembrado);
  const [senha, setSenha] = useState("");
  const [lembrar, setLembrar] = useState(!!lembrado);
  const [msg, setMsg] = useState(null);

  // Ao enviar: valida os dados; se estiverem corretos, grava a sessão e vai para o pedido
  const entrar = (e) => {
    e.preventDefault();
    // E-mail em minúsculas e sem espaços, para comparar corretamente
    const em = email.trim().toLowerCase();
    const lista = usuarios();
    // Não há nenhuma conta cadastrada
    if (!lista.length) return setMsg({ ok: false, texto: "Nenhuma conta cadastrada. Crie sua conta primeiro." });
    // E-mail ou senha não conferem
    if (!lista.find((u) => u.email === em && u.senha === senha)) return setMsg({ ok: false, texto: "E-mail ou senha incorretos." });
    // Guarda ou apaga o e-mail conforme a caixa "Me lembre o login"
    try {
      if (lembrar) localStorage.setItem("volts_lembrar", em);
      else localStorage.removeItem("volts_lembrar");
    } catch (err) { /* ignora */ }
    // Login válido: registra quem está logado e abre a página do pedido
    aoEntrar(em);
    substituirPara("/pedido");
  };

  return (
    <LayoutAuth fundo={IMG.fundoLogin}>
      <div className="rounded p-4 text-center text-white" style={vidro} data-bs-theme="dark">
        <form onSubmit={entrar}>
          <h2 className="h3 mb-4" style={{ letterSpacing: 6 }}>VOLTS MOTORS</h2>
          {/* Campos de e-mail e senha (o rótulo flutua sobre o campo) */}
          <Campo id="l-email" rotulo="Digite seu email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          <Campo id="l-senha" rotulo="Digite sua senha" type="password" value={senha} onChange={(e) => setSenha(e.target.value)} required />
          {/* Caixa "Me lembre o login" à esquerda e link de recuperação de senha à direita */}
          <div className="d-flex align-items-center justify-content-between mb-3">
            <div className="form-check mb-0">
              <input className="form-check-input" type="checkbox" id="l-lembrar" checked={lembrar} onChange={(e) => setLembrar(e.target.checked)} />
              <label className="form-check-label" htmlFor="l-lembrar">Me lembre o login</label>
            </div>
            <a className="link-light" href="#/senha">Esqueceu a senha?</a>
          </div>
          {/* Aviso de erro (conta inexistente ou dados incorretos) */}
          <Mensagem msg={msg} />
          <button type="submit" className="btn btn-light w-100 fw-semibold">Entrar</button>
          {/* Link para criar uma conta nova */}
          <p className="mt-4 mb-0">
            Não tem uma conta? <a className="link-light" href="#/cadastro">Crie sua conta</a>
          </p>
        </form>
      </div>
    </LayoutAuth>
  );
}

// Tela de cadastro: cria uma conta nova e guarda no localStorage
function Cadastro() {
  // Valores iniciais do formulário
  const vazio = { nome: "", sobrenome: "", email: "", senha: "", confirmar: "", termos: false };
  // Guarda todos os campos num único objeto
  const [f, setF] = useState(vazio);
  const [msg, setMsg] = useState(null);
  const redirecionar = useRedirecionar();

  // Atualiza o campo digitado (a caixa de termos usa "checked" em vez de "value")
  const mudar = (e) => {
    const { name, value, type, checked } = e.target;
    setF({ ...f, [name]: type === "checkbox" ? checked : value });
  };
  // Ao enviar: valida os dados, salva a conta e leva ao login
  const cadastrar = (e) => {
    e.preventDefault();
    const email = f.email.trim().toLowerCase();
    // Validações: nome preenchido, senhas iguais e e-mail ainda não usado
    if (!f.nome.trim()) return setMsg({ ok: false, texto: "Informe seu nome." });
    if (f.senha !== f.confirmar) return setMsg({ ok: false, texto: "As senhas não conferem." });
    const lista = usuarios();
    if (lista.some((u) => u.email === email)) return setMsg({ ok: false, texto: "Este e-mail já está cadastrado." });
    // Tudo certo: adiciona a conta, mostra "Cadastrado!", limpa o formulário e vai ao login
    lista.push({ nome: f.nome.trim(), sobrenome: f.sobrenome.trim(), email, senha: f.senha });
    gravar("volts_usuarios", lista);
    setMsg({ ok: true, texto: "Cadastrado!" });
    setF(vazio);
    redirecionar("/login");
  };

  return (
    <LayoutAuth fundo={IMG.fundoLogin}>
      <div className="rounded p-4 text-center text-white" style={vidro} data-bs-theme="dark">
        <form onSubmit={cadastrar}>
          <h1 className="fs-6 mb-2" style={{ letterSpacing: 5 }}>VOLTS MOTORS</h1>
          <h2 className="mb-4">Crie sua conta</h2>
          {/* Campos do cadastro (sobrenome é opcional; os demais são obrigatórios) */}
          <Campo id="c-nome" rotulo="Nome" type="text" name="nome" autoComplete="off" value={f.nome} onChange={mudar} />
          <Campo id="c-sobrenome" rotulo="Sobrenome (opcional)" type="text" name="sobrenome" autoComplete="off" value={f.sobrenome} onChange={mudar} />
          <Campo id="c-email" rotulo="E-mail" type="email" name="email" autoComplete="off" value={f.email} onChange={mudar} required />
          <Campo id="c-senha" rotulo="Nova senha" type="password" name="senha" autoComplete="new-password" value={f.senha} onChange={mudar} required />
          <Campo id="c-confirmar" rotulo="Confirmar senha" type="password" name="confirmar" autoComplete="new-password" value={f.confirmar} onChange={mudar} required />
          {/* Aceite dos termos: o cadastro só é enviado com a caixa marcada */}
          <div className="form-check text-start small mb-3">
            <input className="form-check-input" type="checkbox" id="c-termos" name="termos" checked={f.termos} onChange={mudar} required />
            <label className="form-check-label" htmlFor="c-termos">
              Ao continuar, você aceita nossa <a className="link-info" href="#/sobre">Política de Privacidade</a> e <a className="link-info" href="#/sobre">Termos de Uso</a>
            </label>
          </div>
          {/* Aviso de erro ou de sucesso ("Cadastrado!") */}
          <Mensagem msg={msg} />
          <button type="submit" className="btn btn-light w-100 fw-semibold">Cadastrar-se</button>
          <p className="mt-4 mb-0">
            <a className="link-light" href="#/login">Fazer login</a> usando uma conta já cadastrada!
          </p>
        </form>
      </div>
    </LayoutAuth>
  );
}

// Tela de alteração de senha: troca a senha de uma conta existente
function EsqueciSenha() {
  const [f, setF] = useState({ email: "", senha: "", confirmar: "" });
  const [msg, setMsg] = useState(null);
  const redirecionar = useRedirecionar();

  const mudar = (e) => setF({ ...f, [e.target.name]: e.target.value });
  // Ao enviar: confere o e-mail e as senhas e grava a nova senha
  const alterar = (e) => {
    e.preventDefault();
    const em = f.email.trim().toLowerCase();
    const lista = usuarios();
    const u = lista.find((x) => x.email === em);
    if (!u) return setMsg({ ok: false, texto: "E-mail não cadastrado." });
    if (f.senha !== f.confirmar) return setMsg({ ok: false, texto: "As senhas não conferem." });
    // Atualiza a senha da conta encontrada e salva a lista
    u.senha = f.senha;
    gravar("volts_usuarios", lista);
    setMsg({ ok: true, texto: "Senha alterada" });
    setF({ email: "", senha: "", confirmar: "" });
    redirecionar("/login");
  };

  return (
    <LayoutAuth fundo={IMG.fundoSenha} corDireitos="#fff">
      <div className="rounded p-4 text-white" style={{ ...vidro, background: "rgba(72,72,72,.35)", border: "1px solid #ccc" }} data-bs-theme="dark">
        <form onSubmit={alterar}>
          <h1 className="text-center mb-2" style={{ letterSpacing: 6, fontSize: 15, fontWeight: 650 }}>VOLTS MOTORS</h1>
          <h2 className="text-center mb-4 fs-3 fw-semibold">Alteração de senha</h2>
          {/* Campos: e-mail da conta, nova senha e confirmação da nova senha */}
          <Campo id="s-email" rotulo="Digite seu email" type="email" name="email" value={f.email} onChange={mudar} required />
          <Campo id="s-senha" rotulo="Nova senha" type="password" name="senha" autoComplete="new-password" value={f.senha} onChange={mudar} required />
          <Campo id="s-confirmar" rotulo="Confirmar nova senha" type="password" name="confirmar" autoComplete="new-password" value={f.confirmar} onChange={mudar} required />
          {/* Aviso de erro ou de sucesso ("Senha alterada") */}
          <Mensagem msg={msg} />
          <a className="link-light d-block mb-3" href="#/login">Voltar para login</a>
          <button type="submit" className="btn btn-outline-light w-100">Aceitar</button>
        </form>
      </div>
    </LayoutAuth>
  );
}

/* ---------- aplicação ---------- */
// Componente principal: decide qual página mostrar e controla o login.
// App: escolhe a página de acordo com a rota atual
function App() {
  // Rota atual (atualiza sozinha quando o endereço muda)
  const rota = useRota();
  // E-mail de quem está logado (lido da sessão ao abrir o site)
  const [sessao, setSessao] = useState(lerSessao());

  // A cada mudança de rota: atualiza o título da aba e, se a rota não existir, volta para a Home
  useEffect(() => {
    document.title = TITULOS[rota] || TITULOS["/"];
    if (!TITULOS[rota]) substituirPara("/"); // rota desconhecida volta para a Home
  }, [rota]);

  // Chamada pelo Login: grava e guarda quem entrou
  const entrar = (email) => { gravarSessao(email); setSessao(email); };
  // Encerra a sessão e volta para a Home
  const sair = () => { gravarSessao(null); setSessao(null); substituirPara("/"); };
  // Dados que o menu precisa em todas as páginas
  const comum = { rota, sessao, aoSair: sair };

  // Mostra o componente da página correspondente à rota
  switch (rota) {
    case "/": return <Home {...comum} />;
    case "/tecnologia": return <Tecnologia {...comum} />;
    case "/modelos": return <Modelos {...comum} />;
    case "/sobre": return <Sobre {...comum} />;
    case "/contato": return <Contato {...comum} />;
    case "/pedido": return <Pedido {...comum} />;
    case "/login": return <Login aoEntrar={entrar} />;
    case "/cadastro": return <Cadastro />;
    case "/senha": return <EsqueciSenha />;
    default:
      return null;
  }
}

// Inicia o React: desenha o App dentro da <div id="root"> do index.html
ReactDOM.createRoot(document.getElementById("root")).render(<App />);
