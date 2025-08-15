import LegalPage from '@/components/LegalPage';

export const metadata = {
    title: "Podmínky používání | XAP3Y's Space",
};

export default function TermsPage() {
    const updatedAt = '2025-08-15';

    return (
        <LegalPage title="Podmínky používání služby" updatedAt={updatedAt}>
            <>
                <h2>1. Úvod</h2>
                <p>
                    Tyto Podmínky používání (dále jen „Podmínky“) upravují používání on‑line služeb poskytovaných v rámci
                    platformy <strong>XAP3Y’s Space</strong> (dále jen „Služba“). Používáním Služby vyjadřujete souhlas
                    s těmito Podmínkami. Pokud s nimi nesouhlasíte, Službu nepoužívejte.
                </p>

                <h2>2. Provozovatel</h2>
                <p>
                    Provozovatelem Služby je <strong>Martin Hoke</strong> (fyzická osoba), jednající pod značkou
                    <strong> „XAP3Y’s Space“</strong> (dále jen „Provozovatel“).
                </p>
                <ul>
                    <li>Kontaktní e‑mail (podpora): <a href="mailto:support@xap3y.space">support@xap3y.space</a></li>
                    <li>Zneužití/abuse: <a href="mailto:abuse@xap3y.space">abuse@xap3y.space</a></li>
                    <li>DMCA/porušení práv: <a href="mailto:dmca@xap3y.space">dmca@xap3y.space</a></li>
                </ul>

                <h2>3. Popis Služby</h2>
                <p>Služba zahrnuje zejména:</p>
                <ul>
                    <li>Nahrávání a uchovávání obrázků,</li>
                    <li>zkracovač URL,</li>
                    <li>„pastes“ – textové úložiště,</li>
                    <li>dočasnou e‑mailovou schránku.</li>
                </ul>
                <p>Služba je v současnosti poskytována bezplatně. Provozovatel si vyhrazuje právo podmínky a rozsah Služby kdykoli změnit či omezit.</p>

                <h2>4. Uživatelské účty</h2>
                <ul>
                    <li>Uživatel odpovídá za bezpečnost svého účtu a API klíče. Každý uživatel má svůj API klíč, který může používat, dokud účet není uzavřen/omezen.</li>
                    <li>Provozovatel může účet kdykoli omezit, pozastavit či zrušit, a to i bez udání důvodu.</li>
                    <li>Minimální věk pro používání Služby je 15 let.</li>
                </ul>

                <h2>5. Zakázané použití</h2>
                <p>Je zakázáno zejména:</p>
                <ul>
                    <li>šířit či ukládat obsah týkající se dětské pornografie (CSAM) jakékoli formy,</li>
                    <li>porušovat práva třetích osob (autorská, osobnostní, ochranné známky ap.),</li>
                    <li>podílet se na podvodech, phishingu, malware, spamu, nelegálních aktivitách,</li>
                    <li>zneužívat zkracovač k maskování škodlivého obsahu,</li>
                    <li>provádět scraping bez výslovného povolení Provozovatele.</li>
                </ul>

                <h2>6. Obsah uživatelů</h2>
                <ul>
                    <li>Uživatel nese plnou odpovědnost za obsah, který nahrává či sdílí.</li>
                    <li>Provozovatel si vyhrazuje právo kdykoli odstranit jakýkoli obsah, a to i bez předchozího oznámení a bez uvedení důvodu.</li>
                </ul>

                <h2>7. API</h2>
                <ul>
                    <li>API je dostupné na <code>call.xap3y.space</code>. Uživatelé mají individuální API klíče.</li>
                    <li>V tuto chvíli nejsou nastaveny limity, nicméně Provozovatel může kdykoli zavést omezení, měnit rozhraní či klíče zneplatnit.</li>
                    <li>Scraping je zakázán.</li>
                </ul>

                <h2>8. Dostupnost a údržba</h2>
                <p>
                    Dostupnost (uptime) lze sledovat na <a href="https://uptime.xap3y.tech/status/space" target="_blank" rel="noreferrer">https://uptime.xap3y.tech/status/space</a>.
                    Služba neběží nepřetržitě (24/7) a Provozovatel neposkytuje žádná SLA. Může docházet k výpadkům a plánované i neplánované údržbě.
                </p>

                <h2>9. Záruky a odpovědnost</h2>
                <ul>
                    <li>Služba je poskytována „tak jak je“ („as is“) bez jakýchkoli záruk.</li>
                    <li>Provozovatel neodpovídá za jakoukoli přímou či nepřímou škodu, ušlý zisk či ztrátu dat vzniklou v souvislosti s používáním Služby.</li>
                </ul>

                <h2>10. Moderace a blokace</h2>
                <p>
                    Provozovatel je oprávněn kdykoli a dle vlastního uvážení odstranit obsah, zablokovat či zrušit účet, a to i bez udání důvodu,
                    zejména při podezření na porušení těchto Podmínek nebo právních předpisů.
                </p>

                <h2>11. Změny Podmínek</h2>
                <p>
                    Podmínky mohou být aktualizovány. Změnu Provozovatel oznámí prostřednictvím banneru na webu. Pokračováním v používání Služby po
                    nabytí účinnosti změn vyjadřujete souhlas s novým zněním.
                </p>

                <h2>12. Právo a soudní příslušnost</h2>
                <p>
                    Tyto Podmínky se řídí právem České republiky. K řešení sporů jsou příslušné soudy České republiky.
                </p>

                <h2>13. Kontakt</h2>
                <ul>
                    <li>Podpora: <a href="mailto:support@xap3y.space">support@xap3y.space</a></li>
                    <li>Nahlášení zneužití: <a href="mailto:abuse@xap3y.space">abuse@xap3y.space</a></li>
                    <li>DMCA/porušení práv: <a href="mailto:dmca@xap3y.space">dmca@xap3y.space</a></li>
                </ul>

                {/*<p className="mt-6 text-xs text-gray-400">
                    Pozn.: Pokud budete mít v budoucnu IČO/adresu, doporučujeme je do této stránky doplnit.
                </p>*/}
            </>
        </LegalPage>
    );
}