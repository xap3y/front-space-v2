// Central vocabulary configuration for Weeks 1–3
// You can freely extend these arrays; the quiz generates questions from them.

export type Week = 1 | 2 | 3;

export type Gender = "m" | "f" | "n";

export interface Noun {
    type: "noun";
    week: Week;
    nom: string; // nominative singular (full word)
    gen: string; // genitive singular (full word)
    gender: Gender;
    en: string; // main English translation
    synonyms?: string[]; // accepted alternative translations
    topic?: string;
}

export interface Adjective {
    type: "adjective";
    week: Week; // 2 or 3 for these sets
    masc: string;
    fem: string;
    neut: string;
    en: string;
    // optional notes like "with costa" are omitted for validation simplicity
}

export interface Collocation {
    type: "collocation";
    week: Week;
    english: string; // definition/English prompt
    latin: string; // full Latin phrase
    missing: string; // the word to be filled by user
}

// Week 1 — Corpus Humanus + Skeleton (selected core)
export const NOUNS: Noun[] = [
    // Corpus Humanus
    { type: "noun", week: 1, nom: "corpus", gen: "corporis", gender: "n", en: "body" },
    { type: "noun", week: 1, nom: "cutis", gen: "cutis", gender: "f", en: "skin" },
    { type: "noun", week: 1, nom: "caput", gen: "capitis", gender: "n", en: "head" },
    { type: "noun", week: 1, nom: "facies", gen: "faciei", gender: "f", en: "face" },
    { type: "noun", week: 1, nom: "os", gen: "oris", gender: "n", en: "mouth", synonyms: ["opening"] },
    { type: "noun", week: 1, nom: "lingua", gen: "linguae", gender: "f", en: "tongue" },
    { type: "noun", week: 1, nom: "mentum", gen: "menti", gender: "n", en: "chin" },
    { type: "noun", week: 1, nom: "axilla", gen: "axillae", gender: "f", en: "armpit", synonyms: ["axilla"] },
    { type: "noun", week: 1, nom: "brachium", gen: "brachii", gender: "n", en: "upper arm", synonyms: ["brachium"] },
    { type: "noun", week: 1, nom: "cubitus", gen: "cubiti", gender: "m", en: "elbow" },
    { type: "noun", week: 1, nom: "antebrachium", gen: "antebrachii", gender: "n", en: "forearm" },
    { type: "noun", week: 1, nom: "carpus", gen: "carpi", gender: "m", en: "wrist" },
    { type: "noun", week: 1, nom: "pollex", gen: "pollicis", gender: "m", en: "thumb" },
    { type: "noun", week: 1, nom: "palma", gen: "palmae", gender: "f", en: "palm" },
    { type: "noun", week: 1, nom: "digitus", gen: "digiti", gender: "m", en: "finger" },
    { type: "noun", week: 1, nom: "sulcus", gen: "sulci", gender: "m", en: "groove", synonyms: ["furrow"] },
    { type: "noun", week: 1, nom: "penis", gen: "penis", gender: "m", en: "penis" },
    { type: "noun", week: 1, nom: "femur", gen: "femoris", gender: "n", en: "thigh", synonyms: ["femur", "thighbone"] },
    { type: "noun", week: 1, nom: "genu", gen: "genus", gender: "n", en: "knee" },
    { type: "noun", week: 1, nom: "frons", gen: "frontis", gender: "f", en: "forehead" },
    { type: "noun", week: 1, nom: "oculus", gen: "oculi", gender: "m", en: "eye" },
    { type: "noun", week: 1, nom: "nasus", gen: "nasi", gender: "m", en: "nose" },
    { type: "noun", week: 1, nom: "auris", gen: "auris", gender: "f", en: "ear" },
    { type: "noun", week: 1, nom: "bucca", gen: "buccae", gender: "f", en: "cheek" },
    { type: "noun", week: 1, nom: "collum", gen: "colli", gender: "n", en: "neck" },
    { type: "noun", week: 1, nom: "cervix", gen: "cervicis", gender: "f", en: "neck", synonyms: ["cervix"] },
    { type: "noun", week: 1, nom: "pectus", gen: "pectoris", gender: "n", en: "chest" },
    { type: "noun", week: 1, nom: "abdomen", gen: "abdominis", gender: "n", en: "abdomen", synonyms: ["belly"] },
    { type: "noun", week: 1, nom: "hypogastrium", gen: "hypogastrii", gender: "n", en: "hypogastrium" },
    { type: "noun", week: 1, nom: "truncus", gen: "trunci", gender: "m", en: "trunk" },
    { type: "noun", week: 1, nom: "manus", gen: "manus", gender: "f", en: "hand" },
    { type: "noun", week: 1, nom: "crus", gen: "cruris", gender: "n", en: "lower leg", synonyms: ["calf"] },
    { type: "noun", week: 1, nom: "tarsus", gen: "tarsi", gender: "m", en: "tarsus" },
    { type: "noun", week: 1, nom: "talus", gen: "tali", gender: "m", en: "anklebone", synonyms: ["talus"] },
    { type: "noun", week: 1, nom: "pes", gen: "pedis", gender: "m", en: "foot" },
    { type: "noun", week: 1, nom: "hallux", gen: "hallucis", gender: "m", en: "big toe" },

    // Skeleton
    { type: "noun", week: 1, nom: "skeleton", gen: "skeletoni", gender: "n", en: "skeleton" },
    { type: "noun", week: 1, nom: "os", gen: "ossis", gender: "n", en: "bone" },
    { type: "noun", week: 1, nom: "cranium", gen: "cranii", gender: "n", en: "skull" },
    { type: "noun", week: 1, nom: "orbita", gen: "orbitae", gender: "f", en: "orbit" },
    { type: "noun", week: 1, nom: "thorax", gen: "thoracis", gender: "m", en: "thorax" },
    { type: "noun", week: 1, nom: "costa", gen: "costae", gender: "f", en: "rib" },
    { type: "noun", week: 1, nom: "discus", gen: "disci", gender: "m", en: "disc", synonyms: ["vertebral disc"] },
    { type: "noun", week: 1, nom: "processus", gen: "processus", gender: "m", en: "process", synonyms: ["protuberance"] },
    { type: "noun", week: 1, nom: "vertebra", gen: "vertebrae", gender: "f", en: "vertebra" },
    { type: "noun", week: 1, nom: "pelvis", gen: "pelvis", gender: "f", en: "pelvis" },
    { type: "noun", week: 1, nom: "coxa", gen: "coxae", gender: "f", en: "hip", synonyms: ["hip joint"] },
    { type: "noun", week: 1, nom: "ilium", gen: "ilii", gender: "n", en: "ilium" },
    { type: "noun", week: 1, nom: "coccyx", gen: "coccygis", gender: "f", en: "coccyx", synonyms: ["tailbone"] },
    { type: "noun", week: 1, nom: "ischium", gen: "ischii", gender: "n", en: "ischium" },
    { type: "noun", week: 1, nom: "symphysis", gen: "symphysis", gender: "f", en: "symphysis" },
    { type: "noun", week: 1, nom: "dens", gen: "dentis", gender: "m", en: "tooth" },
    { type: "noun", week: 1, nom: "mandibula", gen: "mandibulae", gender: "f", en: "lower jaw" },
    { type: "noun", week: 1, nom: "clavicula", gen: "claviculae", gender: "f", en: "clavicle", synonyms: ["collarbone"] },
    { type: "noun", week: 1, nom: "scapula", gen: "scapulae", gender: "f", en: "shoulder blade" },
    { type: "noun", week: 1, nom: "sternum", gen: "sterni", gender: "n", en: "breastbone", synonyms: ["sternum"] },
    { type: "noun", week: 1, nom: "humerus", gen: "humeri", gender: "m", en: "arm bone", synonyms: ["humerus"] },
    { type: "noun", week: 1, nom: "arcus", gen: "arcus", gender: "m", en: "arch" },
    { type: "noun", week: 1, nom: "radius", gen: "radii", gender: "m", en: "radius", synonyms: ["radial bone"] },
    { type: "noun", week: 1, nom: "ulna", gen: "ulnae", gender: "f", en: "elbow bone" },
    { type: "noun", week: 1, nom: "metacarpus", gen: "metacarpi", gender: "m", en: "metacarpus" },
    { type: "noun", week: 1, nom: "phalanx", gen: "phalangis", gender: "f", en: "finger bone" },
    { type: "noun", week: 1, nom: "patella", gen: "patellae", gender: "f", en: "kneecap" },
    { type: "noun", week: 1, nom: "tibia", gen: "tibiae", gender: "f", en: "shinbone" },
    { type: "noun", week: 1, nom: "fibula", gen: "fibulae", gender: "f", en: "calf bone" },
    { type: "noun", week: 1, nom: "metatarsus", gen: "metatarsi", gender: "m", en: "metatarsus" },
];

// Week 2 — key nouns
NOUNS.push(
    { type: "noun", week: 2, nom: "aorta", gen: "aortae", gender: "f", en: "aorta" },
    { type: "noun", week: 2, nom: "arteria", gen: "arteriae", gender: "f", en: "artery" },
    { type: "noun", week: 2, nom: "lamina", gen: "laminae", gender: "f", en: "lamina", synonyms: ["membrane"] },
    { type: "noun", week: 2, nom: "linea", gen: "lineae", gender: "f", en: "line" },
    { type: "noun", week: 2, nom: "vena", gen: "venae", gender: "f", en: "vein" },
    { type: "noun", week: 2, nom: "vesica", gen: "vesicae", gender: "f", en: "bladder" },
    { type: "noun", week: 2, nom: "fractura", gen: "fracturae", gender: "f", en: "fracture" },
    { type: "noun", week: 2, nom: "ruptura", gen: "rupturae", gender: "f", en: "rupture", synonyms: ["tearing of tissue"] },
);

// Week 3 — anatomical + clinical nouns (selected)
NOUNS.push(
    { type: "noun", week: 3, nom: "apertura", gen: "aperturae", gender: "f", en: "opening", synonyms: ["aperture"] },
    { type: "noun", week: 3, nom: "bursa", gen: "bursae", gender: "f", en: "pouch", synonyms: ["sack"] },
    { type: "noun", week: 3, nom: "cellula", gen: "cellulae", gender: "f", en: "cell" },
    { type: "noun", week: 3, nom: "columna", gen: "columnae", gender: "f", en: "column" },
    { type: "noun", week: 3, nom: "crista", gen: "cristae", gender: "f", en: "crest", synonyms: ["ridge"] },
    { type: "noun", week: 3, nom: "diploe", gen: "diploes", gender: "f", en: "spongy layer in flat bones", synonyms: ["diploe"] },
    { type: "noun", week: 3, nom: "fascia", gen: "fasciae", gender: "f", en: "fascia" },
    { type: "noun", week: 3, nom: "fissura", gen: "fissurae", gender: "f", en: "fissure", synonyms: ["elongated cleft"] },
    { type: "noun", week: 3, nom: "fossa", gen: "fossae", gender: "f", en: "hole", synonyms: ["depression", "fossa"] },
    { type: "noun", week: 3, nom: "glandula", gen: "glandulae", gender: "f", en: "gland" },
    { type: "noun", week: 3, nom: "mamma", gen: "mammae", gender: "f", en: "breast" },
    { type: "noun", week: 3, nom: "maxilla", gen: "maxillae", gender: "f", en: "upper jaw" },
    { type: "noun", week: 3, nom: "medulla", gen: "medullae", gender: "f", en: "bone marrow" },
    { type: "noun", week: 3, nom: "palpebra", gen: "palpebrae", gender: "f", en: "eyelid" },
    { type: "noun", week: 3, nom: "plica", gen: "plicae", gender: "f", en: "fold" },
    { type: "noun", week: 3, nom: "raphe", gen: "raphes", gender: "f", en: "suture", synonyms: ["suture (soft tissues)"] },
    { type: "noun", week: 3, nom: "rima", gen: "rimae", gender: "f", en: "fissure", synonyms: ["free space between"] },
    { type: "noun", week: 3, nom: "sclera", gen: "sclerae", gender: "f", en: "sclera" },
    { type: "noun", week: 3, nom: "spina", gen: "spinae", gender: "f", en: "spine", synonyms: ["thorn"] },
    { type: "noun", week: 3, nom: "sutura", gen: "suturae", gender: "f", en: "suture" },
    { type: "noun", week: 3, nom: "tonsilla", gen: "tonsillae", gender: "f", en: "tonsil" },
    { type: "noun", week: 3, nom: "tunica", gen: "tunicae", gender: "f", en: "membrane" },
    { type: "noun", week: 3, nom: "valvula", gen: "valvulae", gender: "f", en: "valve" },

    // clinical
    { type: "noun", week: 3, nom: "acne", gen: "acnes", gender: "f", en: "acne" },
    { type: "noun", week: 3, nom: "allergia", gen: "allergiae", gender: "f", en: "allergy" },
    { type: "noun", week: 3, nom: "anaemia", gen: "anaemiae", gender: "f", en: "anaemia" },
    { type: "noun", week: 3, nom: "angina", gen: "anginae", gender: "f", en: "angina" },
    { type: "noun", week: 3, nom: "ascites", gen: "ascitis", gender: "m", en: "ascites" },
    { type: "noun", week: 3, nom: "causa", gen: "causae", gender: "f", en: "cause" },
    { type: "noun", week: 3, nom: "colica", gen: "colicae", gender: "f", en: "colic", synonyms: ["spasmodic pains in abdomen"] },
    { type: "noun", week: 3, nom: "cura", gen: "curae", gender: "f", en: "care" },
    { type: "noun", week: 3, nom: "diabetes", gen: "diabetes", gender: "m", en: "diabetes" },
    { type: "noun", week: 3, nom: "diastole", gen: "diastoles", gender: "f", en: "diastole" },
    { type: "noun", week: 3, nom: "diarrhoe", gen: "diarrhoes", gender: "f", en: "diarrhoea" },
    { type: "noun", week: 3, nom: "diphtheria", gen: "diphtheriae", gender: "f", en: "diphtheria" },
    { type: "noun", week: 3, nom: "epilepsia", gen: "epilepsiae", gender: "f", en: "epilepsy" },
    { type: "noun", week: 3, nom: "haemorrhagia", gen: "haemorrhagiae", gender: "f", en: "bleeding" },
    { type: "noun", week: 3, nom: "hernia", gen: "herniae", gender: "f", en: "hernia" },
    { type: "noun", week: 3, nom: "insufficientia", gen: "insufficientiae", gender: "f", en: "insufficiency" },
    { type: "noun", week: 3, nom: "pneumonia", gen: "pneumoniae", gender: "f", en: "pneumonia" },
    { type: "noun", week: 3, nom: "scarlatina", gen: "scarlatinae", gender: "f", en: "scarlet fever" },
    { type: "noun", week: 3, nom: "therapia", gen: "therapiae", gender: "f", en: "treatment" },
);

// Adjectives (Weeks 2–3)
export const ADJECTIVES: Adjective[] = [
    // Week 2
    { type: "adjective", week: 2, masc: "apertus", fem: "aperta", neut: "apertum", en: "open" },
    { type: "adjective", week: 2, masc: "clausus", fem: "clausa", neut: "clausum", en: "closed" },
    { type: "adjective", week: 2, masc: "chirurgicus", fem: "chirurgica", neut: "chirurgicum", en: "surgical" },
    { type: "adjective", week: 2, masc: "anatomicus", fem: "anatomica", neut: "anatomicum", en: "anatomical" },
    { type: "adjective", week: 2, masc: "complicatus", fem: "complicata", neut: "complicatum", en: "complicated" },

    { type: "adjective", week: 2, masc: "dexter", fem: "dextra", neut: "dextrum", en: "right" },
    { type: "adjective", week: 2, masc: "sinister", fem: "sinistra", neut: "sinistrum", en: "left" },
    { type: "adjective", week: 2, masc: "internus", fem: "interna", neut: "internum", en: "internal" },
    { type: "adjective", week: 2, masc: "externus", fem: "externa", neut: "externum", en: "external" },
    { type: "adjective", week: 2, masc: "medianus", fem: "mediana", neut: "medianum", en: "median" },
    { type: "adjective", week: 2, masc: "medius", fem: "media", neut: "medium", en: "middle" },
    { type: "adjective", week: 2, masc: "magnus", fem: "magna", neut: "magnum", en: "big" },
    { type: "adjective", week: 2, masc: "parvus", fem: "parva", neut: "parvum", en: "small" },
    { type: "adjective", week: 2, masc: "liber", fem: "libera", neut: "liberum", en: "free" },
    { type: "adjective", week: 2, masc: "niger", fem: "nigra", neut: "nigrum", en: "black" },
    { type: "adjective", week: 2, masc: "albus", fem: "alba", neut: "album", en: "white" },
    { type: "adjective", week: 2, masc: "fuscus", fem: "fusca", neut: "fuscum", en: "brown" },
    { type: "adjective", week: 2, masc: "obliquus", fem: "obliqua", neut: "obliquum", en: "oblique" },
    { type: "adjective", week: 2, masc: "palatinus", fem: "palatina", neut: "palatinum", en: "palatal" },
    { type: "adjective", week: 2, masc: "proprius", fem: "propria", neut: "proprium", en: "proper" },
    { type: "adjective", week: 2, masc: "profundus", fem: "profunda", neut: "profundum", en: "deep" },
    { type: "adjective", week: 2, masc: "spurius", fem: "spuria", neut: "spurium", en: "false" },
    { type: "adjective", week: 2, masc: "subcutaneus", fem: "subcutanea", neut: "subcutaneum", en: "subcutaneous" },
    { type: "adjective", week: 2, masc: "thoracicus", fem: "thoracica", neut: "thoracicum", en: "thoracic" },
    { type: "adjective", week: 2, masc: "transversus", fem: "transversa", neut: "transversum", en: "transverse" },
    { type: "adjective", week: 2, masc: "urinarius", fem: "urinaria", neut: "urinarium", en: "urinary" },
    { type: "adjective", week: 2, masc: "uterinus", fem: "uterina", neut: "uterinum", en: "uterine" },
    { type: "adjective", week: 2, masc: "verus", fem: "vera", neut: "verum", en: "true" },
    { type: "adjective", week: 2, masc: "coronarius", fem: "coronaria", neut: "coronarium", en: "coronary" },
    { type: "adjective", week: 2, masc: "auditivus", fem: "auditiva", neut: "auditivum", en: "auditory" },
    { type: "adjective", week: 2, masc: "gastricus", fem: "gastrica", neut: "gastricum", en: "gastric" },
    { type: "adjective", week: 2, masc: "iliacus", fem: "iliaca", neut: "iliacum", en: "iliac" },
    { type: "adjective", week: 2, masc: "felleus", fem: "fellea", neut: "felleum", en: "bilious" },

    // Week 3
    { type: "adjective", week: 3, masc: "latus", fem: "lata", neut: "latum", en: "wide" },
    { type: "adjective", week: 3, masc: "mucosus", fem: "mucosa", neut: "mucosum", en: "mucous" },
    { type: "adjective", week: 3, masc: "oblongatus", fem: "oblongata", neut: "oblongatum", en: "prolonged" },
    { type: "adjective", week: 3, masc: "serosus", fem: "serosa", neut: "serosum", en: "serous" },

    // Clinical adjectives week 3
    { type: "adjective", week: 3, masc: "acquisitus", fem: "acquisita", neut: "acquisitum", en: "acquired" },
    { type: "adjective", week: 3, masc: "acutus", fem: "acuta", neut: "acutum", en: "acute" },
    { type: "adjective", week: 3, masc: "chronicus", fem: "chronica", neut: "chronicum", en: "chronic" },
    { type: "adjective", week: 3, masc: "epidemicus", fem: "epidemica", neut: "epidemicum", en: "epidemic" },
    { type: "adjective", week: 3, masc: "postoperativus", fem: "postoperativa", neut: "postoperativum", en: "postoperative" },
    { type: "adjective", week: 3, masc: "periculosus", fem: "periculosa", neut: "periculosum", en: "dangerous" },
    { type: "adjective", week: 3, masc: "secundarius", fem: "secundaria", neut: "secundarium", en: "secondary" },
];

// Collocations from Weeks 2–3
export const COLLOCATIONS: Collocation[] = [
    // Week 2
    { type: "collocation", week: 2, english: "anatomical neck (of humerus)", latin: "collum anatomicum", missing: "anatomicum" },
    { type: "collocation", week: 2, english: "surgical neck (frequent fracture site)", latin: "collum chirurgicum", missing: "chirurgicum" },
    { type: "collocation", week: 2, english: "lamina propria", latin: "lamina propria", missing: "propria" },
    { type: "collocation", week: 2, english: "tendinous median line on anterior abdominal wall", latin: "linea alba", missing: "alba" },
    { type: "collocation", week: 2, english: "auditory tube (Eustachian)", latin: "tuba auditiva", missing: "auditiva" },
    { type: "collocation", week: 2, english: "uterine tube (Fallopian)", latin: "tuba uterina", missing: "uterina" },
    { type: "collocation", week: 2, english: "gall bladder", latin: "vesica fellea", missing: "fellea" },
    { type: "collocation", week: 2, english: "urinary bladder", latin: "vesica urinaria", missing: "urinaria" },

    // Week 3
    { type: "collocation", week: 3, english: "angina pectoris", latin: "angina pectoris", missing: "pectoris" },
    { type: "collocation", week: 3, english: "diabetes mellitus", latin: "diabetes mellitus", missing: "mellitus" },
    {
        type: "collocation",
        week: 3,
        english:
            "deep fascia of the thigh that encloses thigh muscles and forms the outer limit of fascial compartments",
        latin: "fascia lata",
        missing: "lata",
    },
    {
        type: "collocation",
        week: 3,
        english:
            "thyroid gland (an endocrine gland in the throat secreting hormones influencing metabolic rate, protein synthesis, etc.)",
        latin: "glandula thyroidea",
        missing: "thyroidea",
    },
    {
        type: "collocation",
        week: 3,
        english: "prolongation of the spinal cord",
        latin: "medulla oblongata",
        missing: "oblongata",
    },
    {
        type: "collocation",
        week: 3,
        english: "free space between eyelids, the fissure between eyelids",
        latin: "rima palpebrarum",
        missing: "palpebrarum",
    },
    {
        type: "collocation",
        week: 3,
        english: "membrane that lines cavities and surrounds internal organs",
        latin: "tunica mucosa",
        missing: "mucosa",
    },
    {
        type: "collocation",
        week: 3,
        english:
            "smooth tissue membrane consisting of two layers of mesothelium which secretes serous fluid",
        latin: "tunica serosa",
        missing: "serosa",
    }
];

// Helpers
export function normalize(s: string): string {
    return s
        .normalize("NFC")
        .trim()
        .toLowerCase()
        .replace(/\s+/g, " ");
}

export function matchesEnglish(input: string, main: string, alts?: string[]) {
    const v = normalize(input);
    const opts = [main, ...(alts || [])].map(normalize);
    return opts.includes(v);
}