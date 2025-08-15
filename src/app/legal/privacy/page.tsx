import LegalPage from '@/components/LegalPage';

export const metadata = {
    title: "Zásady ochrany osobních údajů | XAP3Y's Space",
};

export default function PrivacyPage() {
    const updatedAt = '2025-08-15';

    return (
        <LegalPage title="Zásady ochrany osobních údajů (GDPR)" updatedAt={updatedAt}>
            <>
                <h2>1. Kdo je správcem</h2>
                <p>
                    Správcem osobních údajů je <strong>Martin Hoke</strong> (fyzická osoba), jednající pod značkou
                    <strong> „XAP3Y’s Space“</strong> (dále jen „Správce“).
                </p>
                <ul>
                    <li>Kontakt pro soukromí/GDPR: <a href="mailto:privacy@xap3y.space">privacy@xap3y.space</a></li>
                    <li>Podpora: <a href="mailto:support@xap3y.space">support@xap3y.space</a></li>
                    <li>Zneužití/abuse: <a href="mailto:abuse@xap3y.space">abuse@xap3y.space</a></li>
                </ul>

                <h2>2. Jaké údaje zpracováváme</h2>
                <ul>
                    <li>Účetní údaje: e‑mail, telefon (pokud ho vyplníte), jméno/nick, UID, avatar, API klíč.</li>
                    <li>Pro zkrácené URL: IP adresa, user‑agent a čas kliknutí (ShortUrlLog).</li>
                    <li>Obsah a metadata: nahrané obrázky, pastes a jejich metadata.</li>
                    <li>Technické údaje: cookies (zejména při přihlášení), protokolové záznamy (logy) při každém volání API, údaje o zařízení a prohlížeči.</li>
                    <li>Analytika: agregovaná data o používání webu (Google Analytics – viz níže).</li>
                </ul>

                <h2>3. Účely a právní základy</h2>
                <ul>
                    <li>Poskytování Služby a provoz účtu (plnění smlouvy).</li>
                    <li>Bezpečnost, prevence zneužití, vedení logů, zlepšování Služby (oprávněný zájem).</li>
                    <li>Plnění právních povinností (např. účetnictví, pokud bude relevantní).</li>
                    <li>Analytika a marketingové cookies pouze na základě vašeho souhlasu (pokud je použit).</li>
                </ul>

                <h2>4. Cookies</h2>
                <ul>
                    <li>Sesssion/nezbytné cookies: pro přihlášení a bezpečnost. Bez nich nemusí Služba fungovat.</li>
                    <li>Analytické cookies (Google Analytics): používáme pouze se souhlasem. Souhlas můžete kdykoli odvolat (např. prostřednictvím cookie lišty nebo nastavení prohlížeče).</li>
                </ul>

                <h2>5. Příjemci a zpracovatelé</h2>
                <p>Vaše údaje mohou být zpracovávány těmito poskytovateli:</p>
                <ul>
                    <li>Hosting frontendu: Vercel (může zahrnovat přenosy mimo EU, standardní smluvní doložky – SCC).</li>
                    <li>Backend: soukromé VPS servery Správce.</li>
                    <li>Databáze: MariaDB (na infrastruktuře Správce nebo smluvního poskytovatele).</li>
                    <li>Úložiště souborů: Cloudflare R2 (CDN, ukládání souborů; přenosy dle jejich podmínek, včetně SCC).</li>
                    <li>E‑mail: Zoho Mail (komunikace, provoz účtu, notifikace; SCC).</li>
                    <li>Analytika: Google Analytics (pouze při udělení souhlasu; SCC).</li>
                </ul>
                <p>
                    Pokud dochází k přenosu údajů mimo EU/EHP, probíhá na základě vhodných záruk (zejména SCC).
                </p>

                <h2>6. Doba uchování</h2>
                <ul>
                    <li>Účetní/identifikační údaje: zpravidla do 10 let (nebo dle zákonných povinností).</li>
                    <li>Provozní logy a ShortUrlLog (IP, UA, čas): 2 měsíce, není‑li nutné delší uchování pro ochranu práv Správce.</li>
                    <li>Obsah (obrázky, pastes, krátké URL): po dobu existence účtu nebo do smazání uživatelem/Správcem.</li>
                    <li>Cookies: dle typu a nastavení prohlížeče; analytické pouze po dobu souhlasu.</li>
                </ul>

                <h2>7. Vaše práva</h2>
                <p>V souladu s GDPR máte zejména právo na přístup, opravu, výmaz, omezení zpracování, námitku a přenositelnost. Dále můžete podat stížnost u ÚOOÚ.</p>
                <p>
                    Žádosti nám prosím posílejte na <a href="mailto:privacy@xap3y.space">privacy@xap3y.space</a>.
                    Z bezpečnostních důvodů můžeme požádat o ověření identity. Obvykle odpovíme do 30 dnů.
                </p>
                <p>
                    Smazání účtu můžete provést také přímo v nastavení profilu na webu. Upozorňujeme, že některé údaje můžeme uchovávat po nezbytnou dobu pro plnění právních povinností
                    nebo ochranu našich práv.
                </p>

                <h2>8. Bezpečnost</h2>
                <p>
                    Používáme technická a organizační opatření (šifrování při přenosu, řízení přístupů, oddělení prostředí). Žádný systém ale nemůže být 100% zabezpečen;
                    nelze poskytovat absolutní záruku.
                </p>

                <h2>9. DPO a kontakt</h2>
                <p>Pověřence pro ochranu osobních údajů (DPO) nemáme jmenovaného. Kontakt pro GDPR: <a href="mailto:privacy@xap3y.space">privacy@xap3y.space</a>.</p>

                <h2>10. Změny těchto Zásad</h2>
                <p>
                    Zásady můžeme aktualizovat. Změny oznámíme na webu (např. bannerem) a uvedeme datum účinnosti. Doporučujeme se k dokumentu pravidelně vracet.
                </p>
            </>
        </LegalPage>
    );
}