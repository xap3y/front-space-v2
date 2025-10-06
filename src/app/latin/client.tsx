"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
    ADJECTIVES,
    COLLOCATIONS,
    NOUNS,
    type Adjective,
    type Collocation,
    type Gender,
    type Noun,
    type Week,
    matchesEnglish,
    normalize,
} from "@/config/latin/latin";

type Kind = "nouns" | "adjectives" | "collocations";

type NounSubtype = "genGiven" | "englishGiven" | "nomGiven";
type AdjSubtype = "englishToForms" | "latinToEnglish" | "englishWithMPrefilled";
type CollSubtype = "fillMissing";

type Question =
    | { kind: "nouns"; subtype: NounSubtype; item: Noun }
    | { kind: "adjectives"; subtype: AdjSubtype; item: Adjective }
    | { kind: "collocations"; subtype: CollSubtype; item: Collocation };

const WEEK_OPTIONS: Week[] = [1, 2, 3];
const KIND_OPTIONS: Kind[] = ["nouns", "adjectives", "collocations"];

;export default function LatinPage() {
    const [selectedWeeks, setSelectedWeeks] = useState<Set<Week>>(new Set(WEEK_OPTIONS));
    const [selectedKinds, setSelectedKinds] = useState<Set<Kind>>(new Set(KIND_OPTIONS));
    const [started, setStarted] = useState(false);

    const [q, setQ] = useState<Question | null>(null);
    const [qid, setQid] = useState(0); // stable question key

    // Validation lifecycle
    const [checked, setChecked] = useState(false);
    const [feedback, setFeedback] = useState<Record<string, boolean>>({});

    // Uncontrolled values store (no re-render per keystroke)
    const inputsRef = useRef<Record<string, string>>({});
    const genderRef = useRef<Gender | "">("");

    // DOM node registry for value/focus restoration
    const nodeRefs = useRef<Record<string, HTMLInputElement | HTMLSelectElement | null>>({});
    const lastActiveNameRef = useRef<string>("");

    const pool = useMemo(() => {
        const weeks = selectedWeeks;
        return {
            nouns: NOUNS.filter((n) => weeks.has(n.week)),
            adjs: ADJECTIVES.filter((a) => weeks.has(a.week)),
            cols: COLLOCATIONS.filter((c) => weeks.has(c.week)),
        };
    }, [selectedWeeks]);

    function toggleWeek(w: Week) {
        setSelectedWeeks((prev) => {
            const next = new Set(prev);
            if (next.has(w)) next.delete(w);
            else next.add(w);
            if (next.size === 0) next.add(w); // require at least one
            return next;
        });
    }

    function toggleKind(k: Kind) {
        setSelectedKinds((prev) => {
            const next = new Set(prev);
            if (next.has(k)) next.delete(k);
            else next.add(k);
            if (next.size === 0) next.add(k);
            return next;
        });
    }

    function rand<T>(arr: T[]) {
        return arr[Math.floor(Math.random() * arr.length)];
    }

    function nextQuestion() {
        setChecked(false);
        setFeedback({});
        inputsRef.current = {};
        genderRef.current = "";
        lastActiveNameRef.current = "";
        setQid((x) => x + 1);

        const kind = rand(Array.from(selectedKinds));
        if (kind === "nouns") {
            const item = rand(pool.nouns);
            const r = Math.random();
            const subtype: NounSubtype = r < 1 / 3 ? "genGiven" : r < 2 / 3 ? "englishGiven" : "nomGiven";
            setQ({ kind: "nouns", subtype, item });
        } else if (kind === "adjectives") {
            const item = rand(pool.adjs);
            const r = Math.random();
            const subtype: AdjSubtype =
                r < 0.33 ? "latinToEnglish" : r < 0.66 ? "englishToForms" : "englishWithMPrefilled";
            setQ({ kind: "adjectives", subtype, item });
        } else {
            const item = rand(pool.cols);
            setQ({ kind: "collocations", subtype: "fillMissing", item });
        }
    }

    function start() {
        setStarted(true);
        nextQuestion();
    }

    // Preserve values and focus across the "Check" re-render
    useEffect(() => {
        if (!checked) return;

        const restoreValues = () => {
            const map = nodeRefs.current;
            for (const [name, node] of Object.entries(map)) {
                if (!node) continue;
                if (name === "gender" && node instanceof HTMLSelectElement) {
                    const gv = genderRef.current || "";
                    if (node.value !== gv) node.value = gv;
                } else if (node instanceof HTMLInputElement) {
                    const v = inputsRef.current[name] ?? "";
                    if (node.value !== v) node.value = v;
                }
            }

            const last = lastActiveNameRef.current;
            if (last && map[last]) {
                setTimeout(() => {
                    map[last]?.focus();
                }, 0);
            }
        };

        if (typeof window !== "undefined") requestAnimationFrame(restoreValues);
        else restoreValues();
    }, [checked]);

    // Validation using refs
    function onCheck() {
        if (!q) return;

        const el = document.activeElement as HTMLElement | null;
        const name = el?.getAttribute?.("data-name");
        if (name) lastActiveNameRef.current = name;

        const fb: Record<string, boolean> = {};

        if (q.kind === "nouns") {
            const n = q.item;
            if (q.subtype === "genGiven") {
                fb["nom"] = normalize(inputsRef.current.nom || "") === normalize(n.nom);
                fb["en"] = matchesEnglish(inputsRef.current.en || "", n.en, n.synonyms);
                fb["gender"] = genderRef.current === n.gender;
            } else if (q.subtype === "englishGiven") {
                fb["nom"] = normalize(inputsRef.current.nom || "") === normalize(n.nom);
                fb["gen"] = normalize(inputsRef.current.gen || "") === normalize(n.gen);
                fb["gender"] = genderRef.current === n.gender;
            } else {
                // nomGiven
                fb["gen"] = normalize(inputsRef.current.gen || "") === normalize(n.gen);
                fb["en"] = matchesEnglish(inputsRef.current.en || "", n.en, n.synonyms);
                fb["gender"] = genderRef.current === n.gender;
            }
        } else if (q.kind === "adjectives") {
            const a = q.item;
            if (q.subtype === "latinToEnglish") {
                fb["en"] = matchesEnglish(inputsRef.current.en || "", a.en);
            } else if (q.subtype === "englishToForms") {
                fb["masc"] = normalize(inputsRef.current.masc || "") === normalize(a.masc);
                fb["fem"] = normalize(inputsRef.current.fem || "") === normalize(a.fem);
                fb["neut"] = normalize(inputsRef.current.neut || "") === normalize(a.neut);
            } else {
                fb["fem"] = normalize(inputsRef.current.fem || "") === normalize(a.fem);
                fb["neut"] = normalize(inputsRef.current.neut || "") === normalize(a.neut);
            }
        } else {
            const c = q.item;
            fb["missing"] = normalize(inputsRef.current.missing || "") === normalize(c.missing);
        }

        setFeedback(fb);
        setChecked(true);
    }

    const anyWrong = checked && Object.values(feedback).some((v) => v === false);

    // UI helpers
    const baseInput =
        "w-full rounded-md bg-primary2 text-white placeholder-gray-400 px-3 py-2 border outline-none focus:ring-2 transition";
    const ok = "border-lime-500 ring-lime-500";
    const bad = "border-red-500 ring-red-500";
    const idle = "border-neutral-700 ring-primary0";

    function cls(name: string) {
        if (!checked) return `${baseInput} ${idle}`;
        const correct = feedback[name];
        if (correct === true) return `${baseInput} ${ok}`;
        if (correct === false) return `${baseInput} ${bad}`;
        return `${baseInput} ${idle}`;
    }

    function LabeledRow({
                            label,
                            children,
                        }: {
        label: string;
        children: React.ReactNode;
    }) {
        return (
            <label className="block text-sm text-gray-200">
                <span className="mb-1 block">{label}</span>
                {children}
            </label>
        );
    }

    const setNode =
        (name: string) =>
            (el: HTMLInputElement | HTMLSelectElement | null): void => {
                nodeRefs.current[name] = el;
            };

    return (
        <div className="min-h-screen bg-primary1 bg-primaryDottedSize bg-primaryDotted text-white">
            <div className="mx-auto w-full max-w-screen-sm px-4 py-6">
                <header className="mb-4">
                    <h1 className="text-2xl font-semibold">Latin Vocab Exam</h1>
                    <p className="text-sm text-gray-400">Weeks 1–3 • Mobile-first</p>
                </header>

                {!started ? (
                    <section className="space-y-6">
                        <div className="rounded-lg bg-primary0 p-4">
                            <h2 className="mb-2 font-medium">Choose weeks</h2>
                            <div className="flex flex-wrap gap-2">
                                {WEEK_OPTIONS.map((w) => (
                                    <button
                                        key={w}
                                        onClick={() => toggleWeek(w)}
                                        className={`px-3 py-1 rounded-md text-sm border ${
                                            selectedWeeks.has(w) ? "bg-primary2 border-lime-500" : "border-neutral-700"
                                        }`}
                                    >
                                        Week {w}
                                    </button>
                                ))}
                                <button
                                    onClick={() => setSelectedWeeks(new Set(WEEK_OPTIONS))}
                                    className="ml-auto px-3 py-1 rounded-md text-sm border border-neutral-700"
                                >
                                    All
                                </button>
                            </div>
                        </div>

                        <div className="rounded-lg bg-primary0 p-4">
                            <h2 className="mb-2 font-medium">Question types</h2>
                            <div className="flex flex-wrap gap-2">
                                {KIND_OPTIONS.map((k) => (
                                    <button
                                        key={k}
                                        onClick={() => toggleKind(k)}
                                        className={`px-3 py-1 rounded-md text-sm border capitalize ${
                                            selectedKinds.has(k)
                                                ? "bg-primary2 border-lime-500"
                                                : "border-neutral-700"
                                        }`}
                                    >
                                        {k}
                                    </button>
                                ))}
                                <button
                                    onClick={() => setSelectedKinds(new Set(KIND_OPTIONS))}
                                    className="ml-auto px-3 py-1 rounded-md text-sm border border-neutral-700"
                                >
                                    All
                                </button>
                            </div>
                        </div>

                        <button
                            onClick={start}
                            className="w-full rounded-md bg-primary2 px-4 py-3 text-center font-medium border border-neutral-700 hover:border-lime-500"
                        >
                            Start
                        </button>
                    </section>
                ) : null}

                {started && q && (
                    <section className="mt-4 space-y-4">
                        <div className="rounded-lg bg-primary0 p-4">
                            {q.kind === "nouns" && (
                                <div className="space-y-3">
                                    <div className="mb-1 text-sm text-gray-300">
                                        Nouns (
                                        {q.subtype === "genGiven"
                                            ? "Gen. given"
                                            : q.subtype === "englishGiven"
                                                ? "English given"
                                                : "Nom. given"}
                                        )
                                    </div>

                                    {q.subtype === "genGiven" && (
                                        <div className="rounded-md bg-primary2 p-3 text-sm">
                                            Gen. sg.: <span className="font-semibold">{q.item.gen}</span>
                                        </div>
                                    )}
                                    {q.subtype === "englishGiven" && (
                                        <div className="rounded-md bg-primary2 p-3 text-sm">
                                            English: <span className="font-semibold">{q.item.en}</span>
                                        </div>
                                    )}
                                    {q.subtype === "nomGiven" && (
                                        <div className="rounded-md bg-primary2 p-3 text-sm">
                                            Nom. sg.: <span className="font-semibold">{q.item.nom}</span>
                                        </div>
                                    )}

                                    <div className="grid grid-cols-1 gap-3">
                                        {q.subtype !== "nomGiven" && (
                                            <LabeledRow label="Nom. sg.:">
                                                <input
                                                    key={`${qid}-noun-nom`}
                                                    ref={setNode("nom")}
                                                    data-name="nom"
                                                    className={cls("nom")}
                                                    defaultValue=""
                                                    onChange={(e) => (inputsRef.current.nom = e.target.value)}
                                                    placeholder="e.g., tibia"
                                                />
                                                {checked && feedback["nom"] === false && (
                                                    <p className="mt-1 text-xs text-red-400">Correct: {q.item.nom}</p>
                                                )}
                                            </LabeledRow>
                                        )}

                                        {q.subtype === "englishGiven" && (
                                            <LabeledRow label="Gen. sg.:">
                                                <input
                                                    key={`${qid}-noun-gen`}
                                                    ref={setNode("gen")}
                                                    data-name="gen"
                                                    className={cls("gen")}
                                                    defaultValue=""
                                                    onChange={(e) => (inputsRef.current.gen = e.target.value)}
                                                    placeholder="full genitive, e.g., tibiae"
                                                />
                                                {checked && feedback["gen"] === false && (
                                                    <p className="mt-1 text-xs text-red-400">Correct: {q.item.gen}</p>
                                                )}
                                            </LabeledRow>
                                        )}

                                        {q.subtype === "genGiven" && (
                                            <LabeledRow label="English:">
                                                <input
                                                    key={`${qid}-noun-en`}
                                                    ref={setNode("en")}
                                                    data-name="en"
                                                    className={cls("en")}
                                                    defaultValue=""
                                                    onChange={(e) => (inputsRef.current.en = e.target.value)}
                                                    placeholder="translation"
                                                />
                                                {checked && feedback["en"] === false && (
                                                    <p className="mt-1 text-xs text-red-400">
                                                        Correct: {q.item.en}
                                                        {q.item.synonyms?.length ? ` (also: ${q.item.synonyms.join(", ")})` : ""}
                                                    </p>
                                                )}
                                            </LabeledRow>
                                        )}

                                        {q.subtype === "nomGiven" && (
                                            <>
                                                <LabeledRow label="Gen. sg.:">
                                                    <input
                                                        key={`${qid}-noun-gen2`}
                                                        ref={setNode("gen")}
                                                        data-name="gen"
                                                        className={cls("gen")}
                                                        defaultValue=""
                                                        onChange={(e) => (inputsRef.current.gen = e.target.value)}
                                                        placeholder="full genitive, e.g., tibiae"
                                                    />
                                                    {checked && feedback["gen"] === false && (
                                                        <p className="mt-1 text-xs text-red-400">Correct: {q.item.gen}</p>
                                                    )}
                                                </LabeledRow>
                                                <LabeledRow label="English:">
                                                    <input
                                                        key={`${qid}-noun-en2`}
                                                        ref={setNode("en")}
                                                        data-name="en"
                                                        className={cls("en")}
                                                        defaultValue=""
                                                        onChange={(e) => (inputsRef.current.en = e.target.value)}
                                                        placeholder="translation"
                                                    />
                                                    {checked && feedback["en"] === false && (
                                                        <p className="mt-1 text-xs text-red-400">
                                                            Correct: {q.item.en}
                                                            {q.item.synonyms?.length
                                                                ? ` (also: ${q.item.synonyms.join(", ")})`
                                                                : ""}
                                                        </p>
                                                    )}
                                                </LabeledRow>
                                            </>
                                        )}

                                        <LabeledRow label="Gender:">
                                            <select
                                                key={`${qid}-noun-gender`}
                                                ref={setNode("gender")}
                                                data-name="gender"
                                                className={cls("gender")}
                                                defaultValue=""
                                                onChange={(e) => (genderRef.current = e.target.value as Gender)}
                                            >
                                                <option value="">Select gender</option>
                                                <option value="m">m.</option>
                                                <option value="f">f.</option>
                                                <option value="n">n.</option>
                                            </select>
                                            {checked && feedback["gender"] === false && (
                                                <p className="mt-1 text-xs text-red-400">Correct: {q.item.gender}.</p>
                                            )}
                                        </LabeledRow>
                                    </div>
                                </div>
                            )}

                            {q.kind === "adjectives" && (
                                <div className="space-y-3">
                                    <div className="mb-1 text-sm text-gray-300 capitalize">
                                        Adjectives ({q.subtype})
                                    </div>

                                    {q.subtype === "latinToEnglish" && (
                                        <>
                                            <div className="rounded-md bg-primary2 p-3 text-sm">
                                                {q.item.masc}, {q.item.fem}, {q.item.neut}
                                            </div>
                                            <LabeledRow label="English:">
                                                <input
                                                    key={`${qid}-adj-en`}
                                                    ref={setNode("en")}
                                                    data-name="en"
                                                    className={cls("en")}
                                                    defaultValue=""
                                                    onChange={(e) => (inputsRef.current.en = e.target.value)}
                                                    placeholder="translation"
                                                />
                                                {checked && feedback["en"] === false && (
                                                    <p className="mt-1 text-xs text-red-400">Correct: {q.item.en}</p>
                                                )}
                                            </LabeledRow>
                                        </>
                                    )}

                                    {q.subtype === "englishToForms" && (
                                        <>
                                            <div className="rounded-md bg-primary2 p-3 text-sm">English: {q.item.en}</div>
                                            <div className="grid grid-cols-1 gap-3">
                                                <LabeledRow label="M.:">
                                                    <input
                                                        key={`${qid}-adj-m`}
                                                        ref={setNode("masc")}
                                                        data-name="masc"
                                                        className={cls("masc")}
                                                        defaultValue=""
                                                        onChange={(e) => (inputsRef.current.masc = e.target.value)}
                                                        placeholder="masculine form"
                                                    />
                                                    {checked && feedback["masc"] === false && (
                                                        <p className="mt-1 text-xs text-red-400">Correct: {q.item.masc}</p>
                                                    )}
                                                </LabeledRow>
                                                <LabeledRow label="F.:">
                                                    <input
                                                        key={`${qid}-adj-f`}
                                                        ref={setNode("fem")}
                                                        data-name="fem"
                                                        className={cls("fem")}
                                                        defaultValue=""
                                                        onChange={(e) => (inputsRef.current.fem = e.target.value)}
                                                        placeholder="feminine form"
                                                    />
                                                    {checked && feedback["fem"] === false && (
                                                        <p className="mt-1 text-xs text-red-400">Correct: {q.item.fem}</p>
                                                    )}
                                                </LabeledRow>
                                                <LabeledRow label="N.:">
                                                    <input
                                                        key={`${qid}-adj-n`}
                                                        ref={setNode("neut")}
                                                        data-name="neut"
                                                        className={cls("neut")}
                                                        defaultValue=""
                                                        onChange={(e) => (inputsRef.current.neut = e.target.value)}
                                                        placeholder="neuter form"
                                                    />
                                                    {checked && feedback["neut"] === false && (
                                                        <p className="mt-1 text-xs text-red-400">Correct: {q.item.neut}</p>
                                                    )}
                                                </LabeledRow>
                                            </div>
                                        </>
                                    )}

                                    {q.subtype === "englishWithMPrefilled" && (
                                        <>
                                            <div className="rounded-md bg-primary2 p-3 text-sm">English: {q.item.en}</div>
                                            <div className="grid grid-cols-1 gap-3">
                                                <LabeledRow label="M.: (prefilled)">
                                                    <input
                                                        className={`${baseInput} ${idle}`}
                                                        value={q.item.masc}
                                                        disabled
                                                        readOnly
                                                    />
                                                </LabeledRow>
                                                <LabeledRow label="F.:">
                                                    <input
                                                        key={`${qid}-adj-f2`}
                                                        ref={setNode("fem")}
                                                        data-name="fem"
                                                        className={cls("fem")}
                                                        defaultValue=""
                                                        onChange={(e) => (inputsRef.current.fem = e.target.value)}
                                                        placeholder="feminine form"
                                                    />
                                                    {checked && feedback["fem"] === false && (
                                                        <p className="mt-1 text-xs text-red-400">Correct: {q.item.fem}</p>
                                                    )}
                                                </LabeledRow>
                                                <LabeledRow label="N.:">
                                                    <input
                                                        key={`${qid}-adj-n2`}
                                                        ref={setNode("neut")}
                                                        data-name="neut"
                                                        className={cls("neut")}
                                                        defaultValue=""
                                                        onChange={(e) => (inputsRef.current.neut = e.target.value)}
                                                        placeholder="neuter form"
                                                    />
                                                    {checked && feedback["neut"] === false && (
                                                        <p className="mt-1 text-xs text-red-400">Correct: {q.item.neut}</p>
                                                    )}
                                                </LabeledRow>
                                            </div>
                                        </>
                                    )}
                                </div>
                            )}

                            {q.kind === "collocations" && (
                                <div className="space-y-3">
                                    <div className="mb-1 text-sm text-gray-300">Collocations</div>
                                    <div className="rounded-md bg-primary2 p-3 text-sm">{q.item.english}</div>
                                    <LabeledRow label="Missing Latin word:">
                                        <input
                                            key={`${qid}-coll-missing`}
                                            ref={setNode("missing")}
                                            data-name="missing"
                                            className={cls("missing")}
                                            defaultValue=""
                                            onChange={(e) => (inputsRef.current.missing = e.target.value)}
                                            placeholder="full word (e.g., auditiva)"
                                        />
                                        {checked && feedback["missing"] === false && (
                                            <p className="mt-1 text-xs text-red-400">Correct: {q.item.missing}</p>
                                        )}
                                    </LabeledRow>
                                </div>
                            )}
                        </div>

                        <div className="flex items-center gap-3">
                            {!checked ? (
                                <>
                                    <button
                                        onClick={onCheck}
                                        className="flex-1 rounded-md bg-primary2 px-4 py-3 font-medium border border-neutral-700 hover:border-lime-500"
                                    >
                                        Check
                                    </button>
                                    {/* SKIP button */}
                                    <button
                                        onClick={nextQuestion}
                                        className="rounded-md px-4 py-3 font-medium border border-neutral-700 bg-primary0 hover:border-gray-500"
                                    >
                                        SKIP
                                    </button>
                                </>
                            ) : (
                                <>
                                    <button
                                        onClick={nextQuestion}
                                        className="flex-1 rounded-md bg-primary2 px-4 py-3 font-medium border border-neutral-700 hover:border-lime-500"
                                    >
                                        Continue
                                    </button>
                                    {/* Keep SKIP available after checking as well */}
                                    <button
                                        onClick={nextQuestion}
                                        className="rounded-md px-4 py-3 font-medium border border-neutral-700 bg-primary0 hover:border-gray-500"
                                    >
                                        SKIP
                                    </button>
                                    {anyWrong && (
                                        <span className="text-xs text-red-400">
                      Incorrect fields highlighted; correct answers shown below them.
                    </span>
                                    )}
                                </>
                            )}
                        </div>

                        <div className="pt-2">
                            <button
                                onClick={() => {
                                    setStarted(false);
                                    setQ(null);
                                    setChecked(false);
                                    setFeedback({});
                                    inputsRef.current = {};
                                    genderRef.current = "";
                                    lastActiveNameRef.current = "";
                                }}
                                className="text-xs text-gray-400 underline"
                            >
                                Change settings
                            </button>
                        </div>
                    </section>
                )}
            </div>
        </div>
    );
}