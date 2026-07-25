import { useEffect } from 'react';
import {
  Anchor,
  ArrowRight,
  Check,
  Compass,
  Footprints,
  LocateFixed,
  MapPinned,
  Navigation,
  Route,
  ShieldCheck,
  Sparkles,
  Stamp,
} from 'lucide-react';
import { motion, useReducedMotion } from 'motion/react';
import heroVideo from '../assets/video_hero.mp4';
import heroPoster from '../assets/hero-poster.webp';
import './LandingPage.css';

interface LandingPageProps {
  onEnter: () => void;
}

const trustItems = [
  { icon: MapPinned, label: 'Curadoria local', detail: 'Lugares com contexto' },
  { icon: Route, label: 'Roteiros inteligentes', detail: 'Do achado ao caminho' },
  { icon: ShieldCheck, label: 'Preferência de segurança', detail: 'Você define a prioridade' },
];

const steps = [
  {
    number: '01',
    title: 'Diga onde está',
    text: 'Use sua localização ou escolha uma cidade para começar a descoberta.',
    icon: LocateFixed,
  },
  {
    number: '02',
    title: 'Escolha seu ritmo',
    text: 'Converse com o Guia IA e ajuste o tipo de lugar que faz sentido para você.',
    icon: Sparkles,
  },
  {
    number: '03',
    title: 'Siga a rota',
    text: 'Organize as paradas em um roteiro e leve o mapa com você.',
    icon: Navigation,
  },
];

const faqs = [
  {
    question: 'Preciso criar uma conta para começar?',
    answer: 'Não. Você pode entrar e explorar o aplicativo sem cadastro.',
  },
  {
    question: 'Como o Navegantes usa minha localização?',
    answer:
      'A localização só é solicitada pelo dispositivo depois que você entra no aplicativo. Ela ajuda a identificar a cidade, encontrar lugares próximos e montar rotas.',
  },
  {
    question: 'Posso priorizar lugares mais seguros?',
    answer:
      'Sim. O aplicativo tem uma preferência específica para tornar a curadoria mais rigorosa quando segurança for sua prioridade.',
  },
  {
    question: 'Preciso instalar alguma coisa?',
    answer:
      'Não. O Navegantes funciona no navegador e também pode ser instalado no celular como aplicativo quando o dispositivo oferecer essa opção.',
  },
  {
    question: 'As sugestões substituem informações locais oficiais?',
    answer:
      'Não. A curadoria ajuda na descoberta e no planejamento, mas horários, acessos e condições do local devem ser confirmados antes da visita.',
  },
];

export function LandingPage({ onEnter }: LandingPageProps) {
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    window.dispatchEvent(
      new CustomEvent('navegantes:landing_view', {
        detail: { path: window.location.pathname, search: window.location.search },
      }),
    );
  }, []);

  const enterApp = () => {
    window.dispatchEvent(
      new CustomEvent('navegantes:cta_click', {
        detail: { placement: 'landing', path: window.location.pathname },
      }),
    );
    onEnter();
  };

  const reveal = reduceMotion
    ? {}
    : {
        initial: { opacity: 0, y: 24 },
        whileInView: { opacity: 1, y: 0 },
        viewport: { once: true, amount: 0.22 },
        transition: { duration: 0.55, ease: 'easeOut' as const },
      };

  return (
    <main className="landing-page">
      <section className="landing-hero" aria-labelledby="landing-title">
        <video
          className="landing-hero__video"
          autoPlay={!reduceMotion}
          muted
          loop
          playsInline
          preload="metadata"
          poster={heroPoster}
          aria-hidden="true"
        >
          <source src={heroVideo} type="video/mp4" />
        </video>
        <div className="landing-hero__veil" aria-hidden="true" />
        <div className="landing-hero__grain" aria-hidden="true" />

        <header className="landing-header">
          <a className="landing-brand" href="#inicio" aria-label="Navegantes — início">
            <span className="landing-brand__mark" aria-hidden="true">
              <Compass size={21} strokeWidth={1.8} />
            </span>
            <span>
              <strong>Navegantes</strong>
              <small>Assistente local</small>
            </span>
          </a>
          <a className="landing-header__link" href="#como-funciona">
            Conhecer o app
            <ArrowRight size={15} aria-hidden="true" />
          </a>
        </header>

        <div className="landing-hero__content" id="inicio">
          <motion.div
            className="landing-hero__copy"
            initial={reduceMotion ? false : { opacity: 0, y: 24 }}
            animate={reduceMotion ? undefined : { opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: 'easeOut' }}
          >
            <p className="landing-eyebrow">
              <span aria-hidden="true" />
              Descoberta local, sem roteiro óbvio
            </p>
            <h1 id="landing-title">
              Descubra os lugares que realmente <em>valem o desvio.</em>
            </h1>
            <p className="landing-hero__lead">
              Curadoria local, rotas e sugestões com IA para você aproveitar melhor cada destino —
              sem perder tempo separando atração de descoberta.
            </p>
            <button className="landing-primary-cta" type="button" onClick={enterApp}>
              <LocateFixed size={19} aria-hidden="true" />
              Explorar perto de mim
              <ArrowRight size={18} aria-hidden="true" />
            </button>
            <div className="landing-hero__microcopy">
              <span>
                <Check size={14} aria-hidden="true" />
                Sem cadastro para começar
              </span>
              <span>
                <Check size={14} aria-hidden="true" />
                Você escolhe quando compartilhar sua localização
              </span>
            </div>
          </motion.div>

          <motion.aside
            className="landing-coordinate-card"
            initial={reduceMotion ? false : { opacity: 0, x: 24 }}
            animate={reduceMotion ? undefined : { opacity: 1, x: 0 }}
            transition={{ duration: 0.7, delay: 0.18, ease: 'easeOut' }}
            aria-label="Como funciona a curadoria"
          >
            <div className="landing-coordinate-card__top">
              <span>COORD. 23°32&apos;S</span>
              <span>ONLINE</span>
            </div>
            <div className="landing-coordinate-card__compass" aria-hidden="true">
              <Compass size={54} strokeWidth={1.15} />
            </div>
            <p>A bússola aponta. A curadoria explica por que vale ir.</p>
            <div className="landing-coordinate-card__route" aria-hidden="true">
              <span />
              <span />
              <span />
            </div>
          </motion.aside>
        </div>

        <div className="landing-hero__index" aria-hidden="true">
          <span>01</span>
          <i />
          <span>04</span>
        </div>
      </section>

      <section className="landing-trust" aria-label="Recursos principais">
        {trustItems.map(({ icon: Icon, label, detail }) => (
          <div className="landing-trust__item" key={label}>
            <Icon size={20} strokeWidth={1.8} aria-hidden="true" />
            <span>
              <strong>{label}</strong>
              <small>{detail}</small>
            </span>
          </div>
        ))}
      </section>

      <motion.section className="landing-demo landing-section" {...reveal}>
        <div className="landing-section__intro">
          <p className="landing-kicker">Você está aqui</p>
          <h2>Não apenas perto. <em>Relevante.</em></h2>
          <p>
            O Navegantes combina sua localização, o contexto da viagem e suas preferências para
            transformar um mapa cheio de opções em uma próxima parada possível.
          </p>
          <div className="landing-route-legend" aria-label="Etapas da descoberta">
            <span>Sua localização</span>
            <ArrowRight size={15} aria-hidden="true" />
            <span>Curadoria</span>
            <ArrowRight size={15} aria-hidden="true" />
            <span>Roteiro</span>
          </div>
        </div>

        <div className="landing-product-window" aria-label="Prévia fiel do aplicativo Navegantes">
          <div className="landing-product-window__bar">
            <span />
            <span />
            <span />
            <small>NAVEGANTES / TERRA BRASILIS</small>
          </div>
          <div className="landing-product-window__body">
            <div className="landing-product-window__heading">
              <div>
                <small>CURADORIA NAVEGANTES</small>
                <h3>Explorando o Brasil</h3>
              </div>
              <span className="landing-product-window__status">
                <LocateFixed size={13} aria-hidden="true" />
                GPS
              </span>
            </div>

            <div className="landing-product-window__preference">
              <ShieldCheck size={17} aria-hidden="true" />
              <span>
                <small>PREFERÊNCIA ATIVA</small>
                Priorizar segurança
              </span>
              <i aria-hidden="true" />
            </div>

            <div className="landing-product-window__place">
              <div className="landing-product-window__place-number">01</div>
              <div>
                <small>PRÓXIMA DESCOBERTA</small>
                <strong>Cristo Redentor</strong>
                <p>Monumento · Rio de Janeiro</p>
              </div>
              <span>5.0</span>
            </div>

            <div className="landing-product-window__itinerary">
              <div className="landing-product-window__line" aria-hidden="true">
                <i />
                <i />
                <i />
              </div>
              <div>
                <small>10:00</small>
                <span>Ponto de interesse local</span>
              </div>
              <div>
                <small>13:00</small>
                <span>Gastronomia regional</span>
              </div>
              <div>
                <small>16:30</small>
                <span>Próxima parada sugerida</span>
              </div>
            </div>
          </div>
          <div className="landing-product-window__stamp" aria-hidden="true">
            CURADO
          </div>
        </div>
      </motion.section>

      <section className="landing-how landing-section" id="como-funciona">
        <motion.div className="landing-how__heading" {...reveal}>
          <p className="landing-kicker">Como funciona</p>
          <h2>Da curiosidade ao caminho, em três movimentos.</h2>
        </motion.div>
        <div className="landing-steps">
          {steps.map(({ number, title, text, icon: Icon }, index) => (
            <motion.article
              className="landing-step"
              key={number}
              initial={reduceMotion ? false : { opacity: 0, y: 20 }}
              whileInView={reduceMotion ? undefined : { opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.35 }}
              transition={{ duration: 0.45, delay: index * 0.08 }}
            >
              <div className="landing-step__number">{number}</div>
              <Icon size={28} strokeWidth={1.55} aria-hidden="true" />
              <h3>{title}</h3>
              <p>{text}</p>
            </motion.article>
          ))}
        </div>
      </section>

      <section className="landing-capabilities landing-section">
        <motion.article className="landing-capability landing-capability--map" {...reveal}>
          <div className="landing-capability__icon">
            <Route size={28} strokeWidth={1.5} aria-hidden="true" />
          </div>
          <p className="landing-kicker">Do achado ao caminho</p>
          <h2>Descobrir é só o começo.</h2>
          <p>
            Salve lugares, organize paradas e transforme sugestões em um roteiro que acompanha o
            ritmo real da sua viagem.
          </p>
          <div className="landing-map-lines" aria-hidden="true">
            <span />
            <span />
            <span />
            <i />
            <i />
            <i />
          </div>
        </motion.article>

        <motion.article className="landing-capability landing-capability--journal" {...reveal}>
          <div className="landing-capability__icon">
            <Stamp size={28} strokeWidth={1.5} aria-hidden="true" />
          </div>
          <p className="landing-kicker">Seu diário de bordo</p>
          <h2>A viagem continua depois da rota.</h2>
          <p>
            Guarde favoritos, publique memórias e colecione carimbos dos lugares que entraram para
            a sua história.
          </p>
          <div className="landing-journal-note" aria-hidden="true">
            <Anchor size={18} />
            <span>Uma nova memória registrada</span>
          </div>
        </motion.article>
      </section>

      <section className="landing-faq landing-section">
        <motion.div className="landing-faq__heading" {...reveal}>
          <p className="landing-kicker">Antes de embarcar</p>
          <h2>Perguntas de quem prefere viajar bem informado.</h2>
        </motion.div>
        <motion.div className="landing-faq__list" {...reveal}>
          {faqs.map((faq, index) => (
            <details key={faq.question}>
              <summary>
                <span>{String(index + 1).padStart(2, '0')}</span>
                {faq.question}
                <i aria-hidden="true" />
              </summary>
              <p>{faq.answer}</p>
            </details>
          ))}
        </motion.div>
      </section>

      <section className="landing-final-cta">
        <div className="landing-final-cta__route" aria-hidden="true" />
        <motion.div {...reveal}>
          <Footprints size={31} strokeWidth={1.5} aria-hidden="true" />
          <p className="landing-kicker">A próxima parada</p>
          <h2>Pode estar a poucos passos daqui.</h2>
          <p>Abra o Navegantes e descubra por onde vale a pena começar.</p>
          <button className="landing-primary-cta" type="button" onClick={enterApp}>
            <LocateFixed size={19} aria-hidden="true" />
            Explorar perto de mim
            <ArrowRight size={18} aria-hidden="true" />
          </button>
        </motion.div>
      </section>

      <footer className="landing-footer">
        <a className="landing-brand" href="#inicio" aria-label="Navegantes — voltar ao início">
          <span className="landing-brand__mark" aria-hidden="true">
            <Compass size={19} strokeWidth={1.8} />
          </span>
          <span>
            <strong>Navegantes</strong>
            <small>Assistente local</small>
          </span>
        </a>
        <p>Feito para quem prefere histórias a checklists.</p>
      </footer>
    </main>
  );
}
