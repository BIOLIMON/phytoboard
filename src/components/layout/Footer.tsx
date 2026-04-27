export function Footer() {
  return (
    <footer className="border-t border-border py-6 px-6 text-center">
      <p className="text-muted text-xs">
        © {new Date().getFullYear()} Phytolearning — Núcleo Milenio en Ciencia de Datos y Resiliencia Vegetal.{' '}
        <a
          href="https://phytolearning.cl"
          target="_blank"
          rel="noopener noreferrer"
          className="text-muted hover:text-green transition-colors no-underline"
        >
          phytolearning.cl
        </a>
      </p>
    </footer>
  )
}
