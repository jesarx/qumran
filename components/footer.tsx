export default function Footer() {
  return (
    <footer className="border-t border-border bg-card">
      <div className="mx-auto py-6 px-4 flex flex-col items-center space-y-2">
        <p className="text-center text-sm text-muted-foreground">
          Ningún derecho reservado
        </p>
        <p className="text-center text-xs text-muted-foreground">
          <a href="https://github.com/jesarx/qumran">Qumran</a>  fue derarrollado por <a href="https://edpartida.com/">eduardo partida</a>
        </p>
      </div>
    </footer>
  );
}
