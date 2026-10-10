"use client";

import { useState } from "react";
import { FaArrowUpRightFromSquare, FaPlus } from "react-icons/fa6";
import {
    Badge,
    Button,
    Checkbox,
    CopyButton,
    DeleteButton,
    EmptyState,
    Field,
    Grid,
    Pagination,
    Panel,
    ResourceCard,
    SaveButton,
    SearchField,
    SegmentedControl,
    Skeleton,
    Toggle,
    Toolbar,
} from "@/components/ui";

const examples = [
    { name: "holiday-images.zip", info: "8 souborů · 24.8 MB · Dnes, 12:43" },
    { name: "project-backup.zip", info: "12 souborů · 84.2 MB · Včera, 18:20" },
    { name: "screenshots.zip", info: "3 soubory · 2.4 MB · 8. 10., 09:15" },
];

export default function DesignShowcase() {
    const [mode, setMode] = useState<"compact" | "detailed">("compact");
    const [loading, setLoading] = useState(false);
    const [enabled, setEnabled] = useState(true);
    const [selected, setSelected] = useState(false);
    const [query, setQuery] = useState("");
    const [name, setName] = useState("Ukázkový pack");
    const [page, setPage] = useState(1);
    const [notice, setNotice] = useState("Všechny akce jsou pouze ukázkové.");
    const [pendingDelete, setPendingDelete] = useState<string | null>(null);
    const filtered = examples.filter((item) => item.name.toLowerCase().includes(query.toLowerCase()));

    function actions(title: string) {
        return (
            <>
                <Button icon={<FaArrowUpRightFromSquare aria-hidden="true" />} onClick={() => setNotice(`Ukázka otevření: ${title}`)}>Zobrazit</Button>
                <CopyButton iconOnly aria-label={`Kopírovat odkaz: ${title}`} onClick={() => setNotice(`Ukázka kopírování: ${title}`)} />
                <DeleteButton iconOnly aria-label={`Smazat: ${title}`} onClick={() => setPendingDelete(title)} />
            </>
        );
    }

    return (
        <main className="mx-auto w-full max-w-6xl space-y-5 px-4 py-8 text-zinc-200 sm:px-6">
            <header className="space-y-3">
                <div className="flex flex-wrap items-center gap-3">
                    <h1 className="text-xl font-semibold">Design / Space</h1>
                    <Badge>Sdílený design webu</Badge>
                </div>
                <p className="max-w-3xl text-xs leading-6 text-zinc-400">
                    Jeden společný základ pro celý web. Tlačítka 32 px / malá 26 px, ikony 12 px,
                    vstupy 34 px, mezery v gridu 12 px. Stejné akce mají vždy stejnou barvu a ikonu.
                </p>
                <nav aria-label="Sekce katalogu" className="flex flex-wrap gap-x-4 gap-y-2 text-xs text-zinc-400">
                    <a href="#buttons" className="hover:text-white">Tlačítka</a>
                    <a href="#inputs" className="hover:text-white">Vstupy a nastavení</a>
                    <a href="#layouts" className="hover:text-white">Karty a gridy</a>
                    <a href="#states" className="hover:text-white">Stavy a loading</a>
                    <a href="/design/convert" className="hover:text-white">Video compatibility →</a>
                </nav>
            </header>

            <div id="buttons" className="scroll-mt-4">
                <Panel title="01 / Tlačítka">
                    <div className="space-y-5">
                        <Toolbar>
                            <Button variant="primary" icon={<FaPlus aria-hidden="true" />} onClick={() => setNotice("Ukázka vytvoření nové položky.")}>Vytvořit</Button>
                            <Button onClick={() => setNotice("Ukázka sekundární akce.")}>Zrušit</Button>
                            <SaveButton onClick={() => setNotice("Ukázka uložení. Žádná nastavení se nezměnila.")}>Uložit</SaveButton>
                            <CopyButton onClick={() => setNotice("Ukázka kopírování odkazu.")}>Kopírovat</CopyButton>
                            <DeleteButton onClick={() => setPendingDelete("Ukázková položka")}>Smazat</DeleteButton>
                            <Button variant="warning" onClick={() => setNotice("Ukázka varovné akce.")}>Obnovit</Button>
                        </Toolbar>
                        <Toolbar>
                            <Button size="small">Malé tlačítko</Button>
                            <CopyButton size="small" iconOnly aria-label="Malé kopírování" />
                            <DeleteButton size="small" iconOnly aria-label="Malé mazání" onClick={() => setPendingDelete("Malá položka")} />
                            <SaveButton disabled>Zakázané</SaveButton>
                            <SaveButton loading>Ukládání</SaveButton>
                        </Toolbar>
                        <p className="text-[11px] leading-5 text-zinc-500">
                            DeleteButton má jednu pevnou ikonu koše, barvu i rozměry. Rozdíl je pouze v malém / běžném provedení a zobrazení popisku.
                        </p>
                    </div>
                </Panel>
            </div>

            <div id="inputs" className="scroll-mt-4">
                <Grid>
                    <Panel title="02 / Vstupy a hledání">
                        <div className="space-y-4">
                            <Field label="Název" value={name} onChange={setName} hint="Stejný základ pro text, heslo, URL i čísla." />
                            <Field label="URL" type="url" defaultValue="https://space.example/files/pack/demo" />
                            <Field label="Heslo" type="password" placeholder="Nastavit heslo" />
                            <Field label="Neplatný vstup" defaultValue="špatná adresa" error="Zadej platnou e-mailovou adresu." type="email" />
                            <Field label="Zakázaný vstup" defaultValue="Pouze pro čtení" disabled />
                        </div>
                    </Panel>
                    <Panel title="03 / Nastavení a výběr">
                        <div className="space-y-5">
                            <div>
                                <Checkbox label="Povolit zobrazení historie" checked={selected} onChange={setSelected} />
                                <p className="mt-1 text-[11px] leading-5 text-zinc-500">Checkbox pro boolean hodnoty ve formulářích a oprávněních.</p>
                            </div>
                            <div>
                                <Toggle label="Automatické obnovování" checked={enabled} onChange={setEnabled} />
                                <p className="mt-1 text-[11px] leading-5 text-zinc-500">Switch pro okamžité zapnutí / vypnutí funkce, ne další náhodný styl checkboxu.</p>
                            </div>
                            <Checkbox label="Nedostupné oprávnění" checked={false} onChange={() => undefined} disabled />
                            <SegmentedControl label="Rozložení ukázky" value={mode} onChange={setMode} options={[
                                { value: "compact", label: "Kompaktní" },
                                { value: "detailed", label: "Detailní" },
                            ]} />
                            <Toolbar>
                                <Badge>Soukromé</Badge>
                                <Badge tone="success">Aktivní</Badge>
                                <Badge tone="warning">Chráněné heslem</Badge>
                                <Badge tone="danger">Expirované</Badge>
                            </Toolbar>
                        </div>
                    </Panel>
                </Grid>
            </div>

            <div id="layouts" className="scroll-mt-4">
                <Panel title="04 / Seznam, filtry a responzivní grid" actions={
                    <Toggle label="Ghost loading" checked={loading} onChange={setLoading} />
                }>
                    <div className="space-y-4">
                        <div className="flex flex-wrap items-end gap-3">
                            <div className="min-w-0 flex-1 basis-60">
                                <SearchField label="Hledat v ukázkách" placeholder="Název souboru…" value={query} onChange={setQuery} />
                            </div>
                            <SegmentedControl label="Rozložení seznamu" value={mode} onChange={setMode} options={[
                                { value: "compact", label: "Kompaktní" },
                                { value: "detailed", label: "Detailní" },
                            ]} />
                            <Button variant="primary" icon={<FaPlus aria-hidden="true" />} onClick={() => setNotice("Ukázka vytvoření packu.")}>Vytvořit pack</Button>
                        </div>
                        <div className="space-y-3">
                            {loading ? examples.map((item) => (
                                <ResourceCard key={item.name} loading mode={mode} />
                            )) : filtered.map((item) => (
                                <ResourceCard key={item.name} title={item.name} metadata={item.info} actions={actions(item.name)} mode={mode} />
                            ))}
                            {!loading && filtered.length === 0 && (
                                <EmptyState title="Žádné výsledky" description="Zkus jiný název nebo vymaž hledání." action={<Button onClick={() => setQuery("")}>Vymazat hledání</Button>} />
                            )}
                        </div>
                        <Pagination page={page} pages={3} onChange={setPage} />
                        <p className="text-[11px] text-zinc-500">Stránkování je ukázkové; položky zůstávají stejné.</p>
                        <Grid columns={3}>
                            {examples.map((item) => (
                                <ResourceCard key={item.name} title={item.name} metadata={item.info} actions={actions(item.name)} mode="detailed" loading={loading} />
                            ))}
                        </Grid>
                    </div>
                </Panel>
            </div>

            <div id="states" className="scroll-mt-4">
                <Grid>
                    <Panel title="05 / Prázdný stav">
                        <EmptyState title="Zatím žádné soubory" description="Po vytvoření prvního packu se objeví tady." action={<Button variant="primary" icon={<FaPlus aria-hidden="true" />} onClick={() => setNotice("Ukázka prvního packu.")}>Vytvořit pack</Button>} />
                    </Panel>
                    <Panel title="06 / Loading a potvrzení mazání">
                        <div className="space-y-4">
                            <Toolbar>
                                <Button disabled aria-label="Načítání vytvoření packu"><Skeleton width={100} /></Button>
                                <Skeleton width={80} height={26} />
                            </Toolbar>
                            {pendingDelete ? (
                                <div role="alert" className="space-y-3 rounded border border-red-900/70 bg-red-950/20 p-3 text-xs">
                                    <p>Smazat „{pendingDelete}“?</p>
                                    <p className="text-zinc-500">Pouze ukázka potvrzení. Žádná reálná data se nemažou.</p>
                                    <Toolbar>
                                        <DeleteButton onClick={() => {
                                            setNotice(`Ukázka smazání: ${pendingDelete}`);
                                            setPendingDelete(null);
                                        }}>Potvrdit smazání</DeleteButton>
                                        <Button onClick={() => setPendingDelete(null)}>Zrušit</Button>
                                    </Toolbar>
                                </div>
                            ) : (
                                <p className="text-xs leading-5 text-zinc-500">Kliknutím na libovolný koš zobrazíš ukázku potvrzení tady.</p>
                            )}
                            <p role="status" className="text-xs leading-5 text-zinc-400">{notice}</p>
                        </div>
                    </Panel>
                </Grid>
            </div>
            <footer className="text-[11px] leading-6 text-zinc-500">
                Sdílené komponenty: src/components/ui. Používají existující HoverDiv a MainStringInput.
                Stejný základ teď používají i ostatní stránky webu. Ukázkové akce tady nemění skutečná data.
            </footer>
        </main>
    );
}
