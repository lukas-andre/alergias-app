import Link from "next/link";

export default function Home() {
  return (
    <main className="home">
      <section className="hero">
        <p className="badge">MVP 0</p>
        <h1>Nutrición para Alergias</h1>
        <p className="lead">
          Escanea etiquetas de productos chilenos y recibe un JSON con{" "}
          <strong>ingredientes</strong>, alérgenos y confianza generado por la
          API de OpenAI.
        </p>
        <div className="hero-actions">
          <Link className="primary" href="/scan">
            Ir al escáner
          </Link>
          <a
            className="ghost"
            href="backlog/track.md"
            target="_blank"
            rel="noreferrer"
          >
            Ver roadmap
          </a>
        </div>
      </section>

      <section className="home-grid">
        <article>
          <h2>Enfoque local</h2>
          <p>
            Prompting pensado para etiquetas en español (Chile); devuelve campos
            limpios y estructurados listos para MVP1.
          </p>
        </article>
        <article>
          <h2>Privacidad clara</h2>
          <p>
            Las fotos solo viajan al endpoint de OpenAI; este proyecto no guarda ni
            persiste resultados en servidores propios.
          </p>
        </article>
        <article>
          <h2>Base para MVP 1</h2>
          <p>
            El JSON incluye ingredientes, alérgenos, advertencias y confianza para
            alimentar reglas de tráfico de color y perfiles.
          </p>
        </article>
      </section>
    </main>
  );
}
