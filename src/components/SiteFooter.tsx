import { FOOTER_LINKS } from "@/lib/links";

// F-13 の 3 箇所のうちの一つ。フッタは全ページに出るので、
// どのページから入ってきた人にも架空である旨が必ず届く。
export function SiteFooter() {
  return (
    <footer className="footer">
      <div className="footer__inner">
        {FOOTER_LINKS.map((l, i) => (
          <span key={l.href}>
            {i > 0 && <span aria-hidden="true">・</span>}{" "}
            <a href={l.href} target="_blank" rel="noreferrer">
              {l.label}
            </a>
          </span>
        ))}
        <p className="footer__fiction">
          瀬音の杜は架空のキャンプ場です。実在の施設ではなく、予約は成立しません。
        </p>
      </div>
    </footer>
  );
}
